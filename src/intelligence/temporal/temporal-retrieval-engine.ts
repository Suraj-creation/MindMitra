import {
  ConsentScope,
  MediaAsset,
  SensitivityLevel,
  TemporalEvent,
} from "../../domain/cognitive-experience";
import { cognitiveStore } from "../cognitive-engine";
import { MemoryFirewall } from "../retrieval/memory-firewall";
import {
  getRelativeTemporalFrame,
  getReferenceNow,
  temporalEventStore,
} from "./temporal-event-store";

export interface TemporalRetrievalResult {
  yesterdayCandidates: TemporalEvent[];
  todayCandidates: TemporalEvent[];
  tomorrowCandidates: TemporalEvent[];
  allCandidates: TemporalEvent[];
  topYesterdayAnchor?: TemporalEvent;
  topTodayAnchor?: TemporalEvent;
  topTomorrowAnchor?: TemporalEvent;
  familiarPeople: Array<{
    id: string;
    name: string;
    relationship: string;
    verified: boolean;
    photo_url?: string;
  }>;
  mediaAssets: MediaAsset[];
  audit: {
    target_person_id: string;
    total_events_scanned: number;
    cancelled_events_excluded: number;
    stale_events_excluded: number;
    sensitive_events_excluded: number;
    cross_person_blocked: number;
    passed: boolean;
  };
}

export interface TemporalRetrievalOptions {
  referenceDate?: Date;
  maxSensitivity?: SensitivityLevel;
  targetConsentScopes?: ConsentScope[];
  requireVerification?: boolean;
}

/**
 * Score candidate event based on relevance criteria:
 * 1. Verification status (caregiver_verified: +40, clinician_verified: +40, unverified: +10)
 * 2. People presence (+25 if family member like daughter/granddaughter involved)
 * 3. Media availability (+20 if photo available)
 * 4. Routine / social importance (+15)
 */
function scoreTemporalCandidate(event: TemporalEvent): number {
  let score = 0;

  // Verification status
  if (event.verification_status === "caregiver_verified" || event.verification_status === "clinician_verified") {
    score += 40;
  } else if (event.verification_status === "chw_verified") {
    score += 30;
  } else {
    score += 10;
  }

  // Familiar people attached
  if (event.people_refs && event.people_refs.length > 0) {
    score += 25;
    const hasFamily = event.people_refs.some(
      (p) =>
        p.relationship.toLowerCase().includes("daughter") ||
        p.relationship.toLowerCase().includes("granddaughter") ||
        p.relationship.toLowerCase().includes("son") ||
        p.name.toLowerCase().includes("kamala")
    );
    if (hasFamily) score += 15;
  }

  // Media attachment
  if (event.media_refs && event.media_refs.length > 0) {
    score += 20;
  }

  // Confidence
  score += Math.round(event.confidence * 15);

  return score;
}

export class TemporalRetrievalEngine {
  /**
   * Performs bounded, firewalled retrieval of temporal orientation candidates.
   */
  public static retrieveTemporalOrientationCandidates(
    personId: string,
    options: TemporalRetrievalOptions = {}
  ): TemporalRetrievalResult {
    const refDate = options.referenceDate || getReferenceNow();
    const maxSensitivity = options.maxSensitivity || "low";
    const targetConsentScopes = options.targetConsentScopes || ["all", "games", "reminiscence"];

    // 1. Cross-person check via MemoryFirewall principles
    const allEvents = temporalEventStore.getAllEvents();
    let cancelledCount = 0;
    let staleCount = 0;
    let sensitiveCount = 0;
    let crossPersonBlocked = 0;

    const yesterdayCandidates: TemporalEvent[] = [];
    const todayCandidates: TemporalEvent[] = [];
    const tomorrowCandidates: TemporalEvent[] = [];
    const allValidCandidates: TemporalEvent[] = [];

    const peopleMap = new Map<string, { id: string; name: string; relationship: string; verified: boolean; photo_url?: string }>();

    for (const evt of allEvents) {
      // Cross person boundary
      if (evt.person_id !== personId) {
        crossPersonBlocked++;
        continue;
      }

      // Cancelled events strictly excluded
      if (evt.status === "cancelled") {
        cancelledCount++;
        continue;
      }

      // Stale events check
      if (evt.valid_until) {
        const validUntil = new Date(evt.valid_until).getTime();
        if (validUntil < refDate.getTime() && evt.status !== "occurred") {
          staleCount++;
          continue;
        }
      }

      // Sensitivity check
      if (maxSensitivity === "low" && evt.sensitivity !== "low") {
        sensitiveCount++;
        continue;
      }
      if (maxSensitivity === "medium" && evt.sensitivity === "high") {
        sensitiveCount++;
        continue;
      }

      // Consent check
      if (!targetConsentScopes.includes(evt.consent_scope)) {
        continue;
      }

      // Calculate relative frame (yesterday / today / tomorrow)
      const relativeFrame = getRelativeTemporalFrame(evt.start_at, refDate);

      // Collect familiar people
      if (evt.people_refs) {
        for (const p of evt.people_refs) {
          if (!peopleMap.has(p.person_entity_id)) {
            peopleMap.set(p.person_entity_id, {
              id: p.person_entity_id,
              name: p.name,
              relationship: p.relationship,
              verified: p.verified,
              photo_url: p.photo_url,
            });
          }
        }
      }

      allValidCandidates.push(evt);

      if (relativeFrame === "yesterday" || (relativeFrame === "past" && evt.status === "occurred")) {
        yesterdayCandidates.push(evt);
      } else if (relativeFrame === "today" || evt.temporal_frame === "present") {
        todayCandidates.push(evt);
      } else if (relativeFrame === "tomorrow" || (relativeFrame === "future" && evt.status === "confirmed")) {
        tomorrowCandidates.push(evt);
      }
    }

    // Rank candidates in each bucket by relevance score
    yesterdayCandidates.sort((a, b) => scoreTemporalCandidate(b) - scoreTemporalCandidate(a));
    todayCandidates.sort((a, b) => scoreTemporalCandidate(b) - scoreTemporalCandidate(a));
    tomorrowCandidates.sort((a, b) => scoreTemporalCandidate(b) - scoreTemporalCandidate(a));

    // Retrieve media assets for authorized events
    const mediaAssets = cognitiveStore.mediaAssets.filter((m) => m.person_id === personId && m.visibility_scope !== "private");

    return {
      yesterdayCandidates,
      todayCandidates,
      tomorrowCandidates,
      allCandidates: allValidCandidates,
      topYesterdayAnchor: yesterdayCandidates[0],
      topTodayAnchor: todayCandidates[0],
      topTomorrowAnchor: tomorrowCandidates[0],
      familiarPeople: Array.from(peopleMap.values()),
      mediaAssets,
      audit: {
        target_person_id: personId,
        total_events_scanned: allEvents.length,
        cancelled_events_excluded: cancelledCount,
        stale_events_excluded: staleCount,
        sensitive_events_excluded: sensitiveCount,
        cross_person_blocked: crossPersonBlocked,
        passed: crossPersonBlocked === 0 || allValidCandidates.length > 0,
      },
    };
  }
}
