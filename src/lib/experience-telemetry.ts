// Client-side experience telemetry (Sections 41/45/63).
//
// Every meaningful interaction is queued locally first and flushed to
// /v1/experiences/events. Queueing first (rather than posting first and
// queueing on failure) is what makes the offline case ordinary rather than
// exceptional: a person playing with no connectivity produces exactly the same
// local record as one who is online, and the events sync when the network
// comes back.
//
// Deliberately not reusing OfflineEventOutbox: that queue is typed to
// experience_episode / trial_telemetry and posts a different envelope to
// /v1/cognitive-studio/sync-offline-events. Widening it would mean changing a
// shape the existing engines and their tests depend on, to gain a localStorage
// array and a fetch.

import type { ExperienceEventInput } from "../intelligence/experience/types";

const STORAGE_KEY = "mindmitra_experience_events";
const ENDPOINT = "/v1/experiences/events";

type QueuedEvent = ExperienceEventInput & { idempotency_key: string; occurred_at: string };

function load(): QueuedEvent[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

function save(events: QueuedEvent[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    // Keep the tail if storage is tight: the most recent interactions are the
    // ones worth preserving.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // Quota exceeded or storage disabled -- telemetry must never break play.
  }
}

let flushing = false;

/** Record one event. Returns immediately; the flush is fire-and-forget. */
export function recordExperienceEvent(event: ExperienceEventInput): void {
  const queued: QueuedEvent = {
    ...event,
    occurred_at: event.occurred_at || new Date().toISOString(),
    idempotency_key:
      event.idempotency_key ||
      `${event.spec_id || "nospec"}_${event.event_type}_${event.step_id || "nostep"}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`,
  };
  save([...load(), queued]);
  void flushExperienceEvents();
}

/**
 * Send everything queued. Safe to call at any time and from anywhere: the
 * server deduplicates on idempotency_key, so a batch that was already written
 * before the connection dropped is a no-op on retry.
 */
export async function flushExperienceEvents(): Promise<{ sent: number; remaining: number }> {
  if (flushing) return { sent: 0, remaining: load().length };
  const pending = load();
  if (pending.length === 0) return { sent: 0, remaining: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { sent: 0, remaining: pending.length };
  }

  flushing = true;
  try {
    const personId = pending[0].person_id;
    const batch = pending.filter((e) => e.person_id === personId);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: personId, events: batch }),
    });
    if (!res.ok) {
      // 202 means "keep it queued"; anything else is also a reason to keep it.
      return { sent: 0, remaining: pending.length };
    }
    const keys = new Set(batch.map((e) => e.idempotency_key));
    const remaining = load().filter((e) => !keys.has(e.idempotency_key));
    save(remaining);
    return { sent: batch.length, remaining: remaining.length };
  } catch {
    return { sent: 0, remaining: pending.length };
  } finally {
    flushing = false;
  }
}

/** Number of events still waiting to sync. Used by the offline notice. */
export function pendingExperienceEventCount(): number {
  return load().length;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushExperienceEvents();
  });
}
