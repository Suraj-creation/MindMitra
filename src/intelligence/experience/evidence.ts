// Agentic hybrid retrieval for experience planning (Sections 10/11/12).
//
// The retrieval plan is query-shaped: the planner says which entity families a
// candidate template actually needs, and only those are fetched. "Retrieve
// everything and sort it out later" is exactly the pattern the Memory Firewall
// exists to prevent, and it is also the slowest possible way to open a page.
//
// Authorization policy is the same one personal-context-engine.ts applies to
// conversation -- consent-scope allowlist, high-sensitivity exclusion,
// verification labelling, cross-person rejection -- applied here to the same
// Neon-backed repository rows. It is re-stated rather than imported because
// that module returns a conversation-shaped projection with no media links and
// no memory->people edges, which are the two things an experience needs most.

import * as repo from "../../db/person-data-repository";
import { resolveAuthorizedMedia } from "./media";
import { ResolvedMedia } from "./types";

export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/** The consent scopes under which personal content may be used in an activity. */
const ALLOWED_CONSENT_SCOPES = new Set(["games", "reminiscence", "all", "family"]);

export interface EvidenceRequest {
  personId: string;
  timeZone?: string;
  language?: string;
  displayName?: string;
  honorific?: string;
  culture?: string;
  need: {
    dayEvents?: boolean;
    /** Which calendar days, as offsets from today. e.g. [0, -1]. */
    dayOffsets?: number[];
    upcoming?: boolean;
    routines?: boolean;
    people?: boolean;
    memories?: boolean;
    places?: boolean;
    media?: boolean;
  };
}

export interface EvidenceEvent {
  id: string;
  title: string;
  person_name: string | null;
  relationship: string | null;
  location_name: string;
  scheduled_at: string;
  status: string;
  day_offset: number;
  past: boolean;
  clock: string;
}

export interface EvidencePerson {
  id: string;
  name: string;
  relationship: string;
  verified: boolean;
  avatar_media_id: string | null;
}

export interface EvidenceMemory {
  id: string;
  title: string;
  description: string;
  approximate_period: string;
  temporal_frame: string;
  verified: boolean;
  confidence: number;
  sensitivity: string;
  consent_scope: string;
  source: string;
  media_refs: string[];
  people_refs: Array<{ person_entity_id: string; relationship: string }>;
}

export interface EvidencePlace {
  id: string;
  name: string;
  category: string;
  significance: string | null;
  verified: boolean;
  media_refs: string[];
}

export interface EvidenceRoutine {
  id: string;
  title: string;
  time_of_day: string | null;
  description: string | null;
  minutes: number | null;
  verified: boolean;
}

export interface ExperienceEvidence {
  person: {
    id: string;
    display_name: string;
    honorific: string;
    language: string;
    culture: string;
    time_zone: string;
  };
  now: {
    iso: string;
    time_of_day: "early_morning" | "morning" | "afternoon" | "evening" | "night";
    minutes_of_day: number;
  };
  /** Events keyed by day offset (0 = today, -1 = yesterday). */
  eventsByDay: Record<number, EvidenceEvent[]>;
  upcoming: EvidenceEvent[];
  routines: EvidenceRoutine[];
  people: EvidencePerson[];
  memories: EvidenceMemory[];
  places: EvidencePlace[];
  media: Map<string, ResolvedMedia>;
  counts: Record<string, number>;
  blocked: Record<string, number>;
  /** True if any retrieval call failed -- "I can't check" is not "there is nothing". */
  retrieval_failed: boolean;
}

// -- Timezone helpers (day boundaries follow the person, never the server) ----

function partsInZone(d: Date, timeZone: string): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function timeOfDayFor(hour: number): ExperienceEvidence["now"]["time_of_day"] {
  if (hour < 6) return "night";
  if (hour < 9) return "early_morning";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "evening";
  return "night";
}

/** "16:00" / "04:00 PM" -> minutes since midnight. Null when unparseable. */
export function minutesOfDay(label: string | null | undefined): number | null {
  if (!label) return null;
  const m = String(label).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function clockInZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * Retrieve exactly what the requested templates need, with the firewall
 * applied. Every list defaults to empty and `retrieval_failed` records whether
 * that emptiness means "nothing recorded" or "could not read" -- a distinction
 * the planner has to preserve all the way to what the person is told.
 */
export async function gatherExperienceEvidence(req: EvidenceRequest): Promise<ExperienceEvidence> {
  const personId = req.personId;
  const timeZone = req.timeZone || DEFAULT_TIME_ZONE;
  const now = new Date();
  const { hour, minute } = partsInZone(now, timeZone);
  const nowMinutes = hour * 60 + minute;

  const need = req.need;
  const dayOffsets = need.dayEvents ? (need.dayOffsets && need.dayOffsets.length ? need.dayOffsets : [0]) : [];

  let failed = false;
  const onErr = () => {
    failed = true;
    return [] as any[];
  };

  const [dayResults, upcomingRaw, routinesRaw, peopleRaw, memoriesRaw, placesRaw] = await Promise.all([
    Promise.all(dayOffsets.map((off) => repo.listEventsForDay(personId, off, timeZone).catch(onErr).then((rows) => ({ off, rows })))),
    need.upcoming ? repo.listUpcomingEvents(personId).catch(onErr) : Promise.resolve([]),
    need.routines ? repo.listRoutines(personId).catch(onErr) : Promise.resolve([]),
    need.people ? repo.listFamiliarPeople(personId).catch(onErr) : Promise.resolve([]),
    need.memories ? repo.listMemories(personId).catch(onErr) : Promise.resolve([]),
    need.places ? repo.listPlaces(personId).catch(onErr) : Promise.resolve([]),
  ]);

  const blocked: Record<string, number> = {
    cross_person: 0,
    consent_or_sensitivity: 0,
    unverified: 0,
    media_unauthorized: 0,
  };

  // -- Events ----------------------------------------------------------------
  // Temporal validity (cancelled / expired) is enforced in SQL by
  // listEventsForDay and listUpcomingEvents. It is not re-implemented here:
  // one source of truth for "current" is the point of putting it there.
  const eventsByDay: Record<number, EvidenceEvent[]> = {};
  for (const { off, rows } of dayResults) {
    eventsByDay[off] = (rows as any[])
      .filter((e) => {
        if (e.person_id !== personId) {
          blocked.cross_person++;
          return false;
        }
        return true;
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        person_name: e.person_name ?? null,
        relationship: e.relationship ?? null,
        location_name: e.location_name,
        scheduled_at: e.scheduled_at,
        status: e.status,
        day_offset: off,
        past: off < 0 || (off === 0 && new Date(e.scheduled_at).getTime() < now.getTime()) || e.status === "occurred",
        clock: clockInZone(e.scheduled_at, timeZone),
      }));
  }

  const upcoming: EvidenceEvent[] = (upcomingRaw as any[])
    .filter((e) => e.person_id === personId)
    .map((e) => ({
      id: e.id,
      title: e.title,
      person_name: e.person_name ?? null,
      relationship: e.relationship ?? null,
      location_name: e.location_name,
      scheduled_at: e.scheduled_at,
      status: e.status,
      day_offset: 0,
      past: false,
      clock: clockInZone(e.scheduled_at, timeZone),
    }));

  // -- Routines --------------------------------------------------------------
  const routines: EvidenceRoutine[] = (routinesRaw as any[])
    .filter((r) => r.person_id === personId)
    .map((r) => ({
      id: r.id,
      title: r.title,
      time_of_day: r.time_of_day ?? null,
      description: r.anchor_description ?? null,
      minutes: minutesOfDay(r.time_of_day),
      verified: r.verification_status !== "unverified",
    }))
    .sort((a, b) => (a.minutes ?? 1e9) - (b.minutes ?? 1e9));

  // -- People ----------------------------------------------------------------
  // listFamiliarPeople is person_id-scoped by its SQL join.
  const people: EvidencePerson[] = (peopleRaw as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    verified: !!p.verified,
    avatar_media_id: p.avatar_media_id ?? null,
  }));

  // -- Memories --------------------------------------------------------------
  const peopleLinks = need.memories
    ? await repo.listMemoryPeopleLinks(personId).catch(() => [] as any[])
    : [];
  const linksByMemory = new Map<string, Array<{ person_entity_id: string; relationship: string }>>();
  for (const l of peopleLinks) {
    const arr = linksByMemory.get(l.memory_id) ?? [];
    arr.push({ person_entity_id: l.person_entity_id, relationship: l.relationship });
    linksByMemory.set(l.memory_id, arr);
  }

  const memories: EvidenceMemory[] = (memoriesRaw as any[])
    .filter((m) => {
      if (m.person_id !== personId) {
        blocked.cross_person++;
        return false;
      }
      if (!ALLOWED_CONSENT_SCOPES.has(m.consent_scope) || m.sensitivity === "high") {
        blocked.consent_or_sensitivity++;
        return false;
      }
      // An activity built on an unverified claim would present a guess to the
      // person as their own history. Conversation may hedge; an activity
      // cannot, so unverified memories are excluded outright here.
      if (m.verification_status === "unverified") {
        blocked.unverified++;
        return false;
      }
      return true;
    })
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      approximate_period: m.approximate_period,
      temporal_frame: m.temporal_frame,
      verified: true,
      confidence: Number(m.confidence ?? 0),
      sensitivity: m.sensitivity,
      consent_scope: m.consent_scope,
      source: m.source,
      media_refs: Array.isArray(m.media_refs) ? m.media_refs.filter(Boolean) : [],
      people_refs: linksByMemory.get(m.id) ?? [],
    }));

  // -- Places ----------------------------------------------------------------
  const places: EvidencePlace[] = (placesRaw as any[])
    .filter((p) => {
      if (p.person_id !== personId) {
        blocked.cross_person++;
        return false;
      }
      if (p.verification_status === "unverified") {
        blocked.unverified++;
        return false;
      }
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      significance: p.significance ?? null,
      verified: true,
      media_refs: Array.isArray(p.media_refs) ? p.media_refs.filter(Boolean) : [],
    }));

  // -- Media -----------------------------------------------------------------
  let media = new Map<string, ResolvedMedia>();
  if (need.media) {
    const wanted: string[] = [];
    const altText: Record<string, string> = {};
    for (const m of memories) {
      for (const id of m.media_refs) {
        wanted.push(id);
        altText[id] = `Photograph from: ${m.title}`;
      }
    }
    for (const p of places) {
      for (const id of p.media_refs) {
        wanted.push(id);
        altText[id] = `Photograph of ${p.name}`;
      }
    }
    for (const p of people) {
      if (p.avatar_media_id) {
        wanted.push(p.avatar_media_id);
        altText[p.avatar_media_id] = `Photograph of ${p.name}`;
      }
    }
    media = await resolveAuthorizedMedia(personId, wanted, altText).catch(() => new Map());
    blocked.media_unauthorized = Math.max(0, new Set(wanted).size - media.size);
  }

  return {
    person: {
      id: personId,
      display_name: req.displayName || "friend",
      honorific: req.honorific || "",
      language: req.language || "en",
      culture: req.culture || "",
      time_zone: timeZone,
    },
    now: {
      iso: now.toISOString(),
      time_of_day: timeOfDayFor(hour),
      minutes_of_day: nowMinutes,
    },
    eventsByDay,
    upcoming,
    routines,
    people,
    memories,
    places,
    media,
    counts: {
      day_events: Object.values(eventsByDay).reduce((n, arr) => n + arr.length, 0),
      upcoming: upcoming.length,
      routines: routines.length,
      people: people.length,
      memories: memories.length,
      places: places.length,
      media: media.size,
    },
    blocked,
    retrieval_failed: failed,
  };
}
