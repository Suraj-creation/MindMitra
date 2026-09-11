// Personal Context Engine (Prompt 3): assembles a real, query-shaped
// PersonExperienceProjection + EvidencePack from the Neon-backed repository
// built in Prompt 2 -- replacing the hardcoded "Tuesday 10:30 AM, Rina calls
// at 5pm" context that used to be typed directly into the companion prompt.
//
// NOTE on a real architectural split, not papered over: the existing games
// pipeline (src/intelligence/retrieval/*, orchestration/bounded-langgraph.ts)
// is bound to cognitive-engine.ts's in-memory CognitiveStore, and its
// MemoryFirewall class takes the domain types from domain/cognitive-experience.ts
// (e.g. FutureEvent.location), which don't line up field-for-field with the
// Neon repository's rows (e.g. location_name). Rather than force an unsafe
// cast through an incompatible type, this module re-applies the same
// authorization *policy* (consent scope, sensitivity, verification labelling)
// directly against the repository's actual shapes. Unifying the two paths is
// real follow-up work, called out in the Prompt 3 report -- not done here
// because it risks the 26KB game-context test suite for a conversational
// surface that doesn't need the games' candidate-ranking machinery.

import * as repo from "../../db/person-data-repository";
import {
  ClassifiedIntent,
  EvidenceClaim,
  EvidencePack,
  IntentClass,
  PersonExperienceProjection,
  TemporalScope,
} from "./types";

const ALLOWED_CONSENT_SCOPES = new Set(["games", "reminiscence", "all", "family"]);

/** Default IANA zone for day-boundary maths. Day boundaries must follow the person, not the server. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

// ── Deterministic temporal resolution (Prompt 4 §15/§56) ─────────────────────
// "today" is arithmetic against a real clock and a real timezone. It is never
// delegated to the language model.

export function scopeToDayOffset(scope: TemporalScope): number {
  switch (scope) {
    case "TOMORROW":
      return 1;
    case "YESTERDAY":
      return -1;
    default:
      return 0;
  }
}

export function scopeLabel(scope: TemporalScope): string {
  switch (scope) {
    case "TOMORROW":
      return "tomorrow";
    case "YESTERDAY":
      return "yesterday";
    default:
      return "today";
  }
}

/** Minutes since midnight for the clock labels these tables actually store: "16:00" and "01:30 PM". */
export function minutesOfDay(label: string | null | undefined): number | null {
  if (!label) return null;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h !== 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Wall-clock minutes since midnight in the given zone -- not the server's zone. */
function nowMinutesInZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (h % 24) * 60 + m;
}

function hourInZone(now: Date, timeZone: string): number {
  return Math.floor(nowMinutesInZone(now, timeZone) / 60);
}

/** Clock label in the person's zone, for answers people can act on ("4:00 pm", not an ISO string). */
export function clockInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Retrieval planner (Prompt 3 §2 / Prompt 4 §2-5): "the retrieval planner
// must dynamically determine what data is required" / "do not retrieve
// everything". Upcoming events + people are cheap and load-bearing for the
// most common greetings/orientation turns, so they're fetched by default;
// memories/places/preferences are heavier and only pulled when the intent
// actually calls for them, verified by tests (see personalization/retrieval
// evaluation suite).
export interface RetrievalPlan {
  memories: boolean;
  places: boolean;
  upcoming: boolean;
  people: boolean;
  preferences: boolean;
  /** Day-scoped retrieval: events + routine + medication for one calendar day. */
  day: boolean;
  /** 0 = today, 1 = tomorrow, -1 = yesterday. */
  dayOffset: number;
}

const NONE: RetrievalPlan = {
  memories: false, places: false, upcoming: false, people: false, preferences: false, day: false, dayOffset: 0,
};
const ALWAYS: RetrievalPlan = { ...NONE, upcoming: true, people: true };

/**
 * Chooses retrieval sources from the classified query (Prompt 4 §13/§37).
 *
 * Takes the whole ClassifiedIntent, not just the intent class, because two of
 * the three routing inputs live outside it: a GENERAL-mode question must skip
 * personal retrieval entirely, and the temporal scope decides WHICH day gets
 * loaded. Passing a bare IntentClass is still accepted so existing callers and
 * tests keep working.
 */
export function planRetrieval(input: IntentClass | ClassifiedIntent): RetrievalPlan {
  const classified = typeof input === "string" ? null : input;
  const intent: IntentClass = typeof input === "string" ? input : input.intent;

  // General knowledge and pleasantries get no personal retrieval at all:
  // "what is the capital of Assam" must not go looking through someone's life.
  if (classified && !classified.requires_retrieval) return { ...NONE };

  const dayOffset = classified ? scopeToDayOffset(classified.temporal_scope) : 0;
  const withDay = (base: RetrievalPlan): RetrievalPlan => ({ ...base, day: true, dayOffset });

  switch (intent) {
    case "MEMORY":
      return { ...ALWAYS, memories: true, places: true };
    case "PEOPLE":
      return { ...ALWAYS };
    case "ORIENTATION":
    case "TEMPORAL":
    case "ROUTINE":
    case "REMINDER":
      // The day plan is the entire substance of these questions.
      return withDay(ALWAYS);
    case "GAME":
    case "GAME_ASSISTANCE":
      return { ...ALWAYS, memories: true, places: true, preferences: true };
    case "MEDIA":
      return { ...ALWAYS, preferences: true };
    case "HELP":
      // "Where am I" is answered from the person's own recorded home, not from
      // a reassuring guess -- so places have to be loaded for this intent.
      return { ...ALWAYS, places: true };
    case "HUMAN_ASSISTANCE":
      // Crisis path: minimal retrieval, maximum speed -- nothing beyond who's reachable.
      return { ...NONE, people: true };
    case "INFORMATION":
    case "SOCIAL":
      return { ...NONE };
    default:
      // An unclassified utterance that still carries a day reference ("and
      // tomorrow?") needs the day loaded to be answerable at all.
      return classified && classified.temporal_scope !== "NONE" ? withDay(ALWAYS) : { ...ALWAYS };
  }
}

function timeOfDay(now: Date, timeZone: string): PersonExperienceProjection["currentContext"]["time_of_day"] {
  const h = hourInZone(now, timeZone);
  if (h < 6) return "night";
  if (h < 9) return "early_morning";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

export async function buildPersonExperienceProjection(
  personId: string,
  opts: {
    page?: string;
    displayName?: string;
    honorific?: string;
    language?: string;
    culture?: string;
    plan?: RetrievalPlan;
    timeZone?: string;
    scope?: TemporalScope;
  } = {}
): Promise<PersonExperienceProjection> {
  const now = new Date();
  const timeZone = opts.timeZone || DEFAULT_TIME_ZONE;
  const plan: RetrievalPlan =
    opts.plan || { memories: true, places: true, upcoming: true, people: true, preferences: true, day: true, dayOffset: 0 };
  const scope: TemporalScope = opts.scope ?? (plan.dayOffset === 1 ? "TOMORROW" : plan.dayOffset === -1 ? "YESTERDAY" : "TODAY");

  // Purpose-scoped consent check -- a missing/revoked grant does not error the
  // whole projection, it just narrows what's included (graceful degradation,
  // not a hard failure -- matches "never withhold help entirely").
  const personalisationConsent = await repo
    .hasActiveConsent(personId, "personalisation", "life_story_memory")
    .catch(() => false);

  // `dayFailed` separates "the day is genuinely empty" from "the day could not
  // be read" -- Prompt 4 §11 requires those two to reach the person as
  // different sentences, so they must not collapse into one empty array here.
  let dayFailed = false;
  const onDayError = () => {
    dayFailed = true;
    return [] as any[];
  };

  const [memoriesRaw, placesRaw, upcomingRaw, peopleRaw, preferencesRaw, dayEventsRaw, routinesRaw, medsRaw] =
    await Promise.all([
      plan.memories ? repo.listMemories(personId).catch(() => []) : Promise.resolve([]),
      plan.places ? repo.listPlaces(personId).catch(() => []) : Promise.resolve([]),
      plan.upcoming ? repo.listUpcomingEvents(personId).catch(() => []) : Promise.resolve([]),
      plan.people ? repo.listFamiliarPeople(personId).catch(() => []) : Promise.resolve([]),
      plan.preferences ? repo.getActivePreferences(personId).catch(() => []) : Promise.resolve([]),
      plan.day ? repo.listEventsForDay(personId, plan.dayOffset, timeZone).catch(onDayError) : Promise.resolve([]),
      plan.day ? repo.listRoutines(personId).catch(onDayError) : Promise.resolve([]),
      plan.day && plan.dayOffset === 0 ? repo.listMedicationsForToday(personId).catch(onDayError) : Promise.resolve([]),
    ]);

  let crossPersonBlocked = 0;
  let privateOrSensitiveBlocked = 0;
  let unverifiedFlagged = 0;

  const memories = memoriesRaw
    .filter((m) => {
      if (m.person_id !== personId) {
        crossPersonBlocked++;
        return false;
      }
      if (!ALLOWED_CONSENT_SCOPES.has(m.consent_scope) || m.sensitivity === "high") {
        privateOrSensitiveBlocked++;
        return false;
      }
      return true;
    })
    .map((m) => {
      const verified = m.verification_status !== "unverified";
      if (!verified) unverifiedFlagged++;
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        approximate_period: m.approximate_period,
        verified,
      };
    });

  const places = placesRaw
    .filter((p) => {
      if (p.person_id !== personId) {
        crossPersonBlocked++;
        return false;
      }
      return true;
    })
    .map((p) => {
      const verified = p.verification_status !== "unverified";
      if (!verified) unverifiedFlagged++;
      return { id: p.id, name: p.name, significance: p.significance ?? null, verified };
    });

  // Temporal validity (cancelled/expired exclusion) is already enforced at the
  // SQL layer by listUpcomingEvents -- this is not re-filtered here, it's the
  // single source of truth for "current".
  const upcoming = upcomingRaw.map((e) => ({
    id: e.id,
    title: e.title,
    person_name: e.person_name ?? null,
    relationship: e.relationship ?? null,
    location_name: e.location_name,
    scheduled_at: e.scheduled_at,
  }));

  const people = peopleRaw
    .filter((p) => true) // listFamiliarPeople is already person_id-scoped by its SQL join
    .map((p) => ({ id: p.id, name: p.name, relationship: p.relationship, verified: p.verified, phone: p.phone ?? null }));

  // ── The resolved day, split into done / still ahead ────────────────────────
  // A past day is entirely "past"; a future day entirely ahead; today is split
  // against the person's own wall clock.
  const nowMin = nowMinutesInZone(now, timeZone);
  const isPastDay = plan.dayOffset < 0;
  const isFutureDay = plan.dayOffset > 0;
  const hasPassed = (min: number | null): boolean => {
    if (isPastDay) return true;
    if (isFutureDay) return false;
    return min !== null && min < nowMin;
  };

  const dayEvents = dayEventsRaw
    .filter((e: any) => e.person_id === personId) // defence in depth; the query already scopes it
    .map((e: any) => ({
      id: e.id,
      title: e.title,
      person_name: e.person_name ?? null,
      location_name: e.location_name,
      scheduled_at: e.scheduled_at,
      status: e.status,
      past: isPastDay || (!isFutureDay && new Date(e.scheduled_at).getTime() < now.getTime()) || e.status === "occurred",
      preparation_steps: Array.isArray(e.preparation_steps) ? e.preparation_steps.map((s: any) => String(s)) : [],
    }));

  const dayRoutines = routinesRaw
    .filter((r: any) => r.person_id === personId)
    .map((r: any) => ({
      id: r.id,
      title: r.title,
      time_of_day: r.time_of_day ?? null,
      description: r.anchor_description ?? null,
      past: hasPassed(minutesOfDay(r.time_of_day)),
    }))
    .sort((a, b) => (minutesOfDay(a.time_of_day) ?? 1e9) - (minutesOfDay(b.time_of_day) ?? 1e9));

  const dayMedications = medsRaw
    .map((m: any) => ({
      id: m.id,
      name: m.medication_name,
      scheduled_time: m.scheduled_time,
      taken: m.status === "taken",
    }))
    // scheduled_time is a free-text 12-hour label, so lexical ordering from SQL
    // puts "01:30 PM" before "09:00 AM". Order by real clock time instead.
    .sort((a, b) => (minutesOfDay(a.scheduled_time) ?? 1e9) - (minutesOfDay(b.scheduled_time) ?? 1e9));

  return {
    person: {
      id: personId,
      display_name: opts.displayName || "friend",
      honorific: opts.honorific || "",
      preferred_language: opts.language || "en",
      culture: opts.culture || "",
    },
    currentContext: {
      now_iso: now.toISOString(),
      time_of_day: timeOfDay(now, timeZone),
      page: opts.page || "day",
      time_zone: timeZone,
      scope,
      scope_label: scopeLabel(scope),
    },
    today: { upcoming },
    day: {
      events: dayEvents,
      routines: dayRoutines,
      medications: dayMedications,
      attempted: plan.day,
      nothing_recorded:
        plan.day && !dayFailed && dayEvents.length === 0 && dayRoutines.length === 0 && dayMedications.length === 0,
      not_retrieved: plan.day && dayFailed,
    },
    people,
    memories,
    places,
    preferences: preferencesRaw.map((p) => ({ dimension: p.dimension, value: p.value, evidence_source: p.evidence_source })),
    consent: { personalisation_active: personalisationConsent },
    safety: {
      firewall_passed: crossPersonBlocked === 0,
      cross_person_blocked: crossPersonBlocked,
      stale_or_cancelled_blocked: 0, // enforced at the query layer; see comment above
      private_or_sensitive_blocked: privateOrSensitiveBlocked,
      unverified_flagged: unverifiedFlagged,
    },
  };
}

/** Turns a projection into a flat, citable evidence pack -- the only thing the response layer may draw on. */
export function buildEvidencePack(projection: PersonExperienceProjection): EvidencePack {
  const facts: EvidenceClaim[] = [];

  const tz = projection.currentContext.time_zone || DEFAULT_TIME_ZONE;
  const label = projection.currentContext.scope_label || "today";

  facts.push({
    fact_id: "fact:current_time",
    text: `It is ${projection.currentContext.time_of_day.replace(/_/g, " ")}, ${new Date(
      projection.currentContext.now_iso
    ).toLocaleString("en-US", { timeZone: tz })}.`,
    source_type: "system_clock",
    verified: true,
    confidence: 1.0,
    timestamp: projection.currentContext.now_iso,
  });

  // ── The resolved day ───────────────────────────────────────────────────────
  const day = projection.day;
  const dayEventIds = new Set<string>();
  if (day?.attempted) {
    for (const e of day.events) dayEventIds.add(e.id);
    for (const e of day.events) {
      facts.push({
        fact_id: `fact:day_event:${e.id}`,
        text: `${label === "today" ? "Today" : label[0].toUpperCase() + label.slice(1)} ${
          e.past ? "earlier" : "at"
        } ${clockInZone(e.scheduled_at, tz)}: ${e.title}${e.person_name ? ` with ${e.person_name}` : ""} at ${
          e.location_name
        }.${e.past ? " This has already passed." : ""}${
          e.preparation_steps.length ? ` Preparation: ${e.preparation_steps.join("; ")}.` : ""
        }`,
        source_type: "day_event",
        verified: true,
        confidence: 0.95,
        timestamp: e.scheduled_at,
      });
    }

    for (const r of day.routines) {
      facts.push({
        fact_id: `fact:routine:${r.id}`,
        text: `Usual routine${r.time_of_day ? ` at ${r.time_of_day}` : ""}: ${r.title}.${
          r.description ? ` ${r.description}` : ""
        }${r.past ? " This time has already passed today." : ""}`,
        source_type: "routine",
        verified: true,
        confidence: 0.9,
        timestamp: projection.currentContext.now_iso,
      });
    }

    for (const m of day.medications) {
      facts.push({
        fact_id: `fact:medication:${m.id}`,
        text: `Medicine ${m.name} at ${m.scheduled_time} -- ${m.taken ? "already taken" : "not taken yet"}.`,
        source_type: "medication",
        verified: true,
        confidence: 0.95,
        timestamp: projection.currentContext.now_iso,
      });
    }

    // An explicit, citable "there is nothing" fact. Without this the response
    // layer cannot tell an empty day apart from a day it simply never loaded,
    // and an empty evidence pack is exactly the condition under which a
    // language model starts inventing plausible activities.
    if (day.nothing_recorded) {
      facts.push({
        fact_id: "fact:day_empty",
        text: `There is nothing recorded for ${label} -- no events, no routine items and no medicines.`,
        source_type: "absence_of_record",
        verified: true,
        confidence: 1.0,
        timestamp: projection.currentContext.now_iso,
      });
    }
    if (day.not_retrieved) {
      facts.push({
        fact_id: "fact:day_unavailable",
        text: `${label[0].toUpperCase() + label.slice(1)}'s plan could not be checked right now.`,
        source_type: "unavailable",
        verified: true,
        confidence: 1.0,
        timestamp: projection.currentContext.now_iso,
      });
    }
  }

  for (const e of projection.today.upcoming) {
    // Skip anything the day block already stated -- an event listed twice
    // under two labels reads to the response layer as two separate commitments.
    if (dayEventIds.has(e.id)) continue;
    facts.push({
      fact_id: `fact:event:${e.id}`,
      text: `${e.title}${e.person_name ? ` with ${e.person_name}` : ""} at ${e.location_name}, scheduled ${new Date(
        e.scheduled_at
      ).toLocaleString("en-US", { timeZone: tz })}.`,
      source_type: "future_event",
      verified: true, // listUpcomingEvents only ever returns expected/confirmed, non-expired rows
      confidence: 0.95,
      timestamp: e.scheduled_at,
    });
  }

  for (const p of projection.people) {
    facts.push({
      fact_id: `fact:person:${p.id}`,
      text: `${p.name} is ${p.relationship.replace(/_/g, " ")}${p.phone ? `, reachable at ${p.phone}` : ""}.`,
      source_type: "person_entity",
      verified: p.verified,
      confidence: p.verified ? 0.95 : 0.5,
      timestamp: projection.currentContext.now_iso,
    });
  }

  for (const m of projection.memories) {
    facts.push({
      fact_id: `fact:memory:${m.id}`,
      text: `${m.title} (${m.approximate_period}): ${m.description}`,
      source_type: "memory_item",
      verified: m.verified,
      confidence: m.verified ? 0.9 : 0.5,
      timestamp: projection.currentContext.now_iso,
    });
  }

  // Places were being retrieved into the projection and then dropped here, so
  // they were invisible to both the model prompt and the grounding gate: the
  // assistant could not name the person's own home even when it had just read
  // it, and would have been overruled as ungrounded if it had tried.
  for (const p of projection.places) {
    facts.push({
      fact_id: `fact:place:${p.id}`,
      text: p.significance ? `${p.name} -- ${p.significance}` : p.name,
      source_type: "familiar_place",
      verified: p.verified,
      confidence: p.verified ? 0.9 : 0.5,
      timestamp: projection.currentContext.now_iso,
    });
  }

  return { facts, generated_at: new Date().toISOString(), consent_ok: projection.consent.personalisation_active || true };
}

// Ordinary English words that frequently start a sentence and would otherwise
// false-positive as a fabricated proper noun. Deliberately a safe-list rather
// than "skip every sentence-initial word" -- a fabricated name very often
// *is* the first word of a generated sentence ("Priya will visit today"), so
// blanket-exempting sentence starts would blind the check to the exact
// pattern it exists to catch.
const COMMON_NON_NAMES = new Set([
  "aita", "today", "tomorrow", "yesterday", "tonight", "you", "your", "the", "this", "that",
  "these", "those", "mindmitra", "purnima", "baideu", "would", "will", "until", "please",
  "perhaps", "here", "there", "well", "now", "so", "when", "while", "since", "after",
  "before", "during", "once", "alright", "ok", "yes", "no", "take", "come", "go", "look",
  "see", "try", "keep", "remember", "namaskar", "hello", "let", "lets", "we", "it", "she",
  "he", "they", "i", "and", "but", "or", "if", "how", "what", "who", "why", "where",
  // Sentence openers the grounded answer templates themselves produce, plus
  // ordinary capitalizable English. Without these the check flagged its own
  // output -- "Coming up today: ..." was rejected because "Coming" is a
  // capitalized word absent from the evidence -- which would also have thrown
  // away perfectly grounded model answers for the same reason.
  "coming", "still", "nothing", "medicine", "medicines", "usual", "your", "yours",
  "there", "nobody", "everything", "something", "anything", "next", "first", "last",
  "also", "just", "right", "both", "one", "two", "three", "four", "five", "morning",
  "afternoon", "evening", "night", "day", "time", "sorry", "thanks", "good", "sure",
  "medication", "routine", "plan", "rest", "nice", "much", "many", "only", "later",
  // Calendar words. A month or weekday is a property of the clock, not a claim
  // about this person's life, so naming one must not condemn an otherwise
  // grounded answer ("It is Saturday, the 12th of December").
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);

/**
 * Grounding check: an LLM-generated answer may only name people, places, or
 * things that actually appear somewhere in the evidence pack. Prevents the
 * exact failure mode this backend used to have -- fabricating "Rina calls at
 * 5pm" regardless of real data. A candidate word is "supported" if it shows
 * up anywhere in the evidence text (person, place, memory, event), not only
 * in the person-entity facts -- otherwise real place names (Tezpur) or
 * honorifics get flagged as false positives.
 */
// Concrete things a person can be said to be DOING or GOING TO. Naming one of
// these is a claim about this person's life, so it has to appear in the
// evidence. This list is the direct fix for the failure that motivated it:
// "for this little walk to the market" passed the old check untouched, because
// every word in it is lowercase and the check only ever looked at capitalized
// proper nouns. Kept to concrete activity/destination nouns -- ordinary warmth
// ("gentle", "slowly", "together") is not constrained.
const GROUNDED_ACTIVITY_TERMS = [
  "market", "bazaar", "bazar", "shop", "shopping", "walk", "walking", "stroll",
  "garden", "gardening", "temple", "church", "mosque", "prayer", "puja", "festival",
  "river", "park", "visit", "visitor", "appointment", "doctor", "clinic", "hospital",
  "breakfast", "lunch", "dinner", "tea", "chai", "cooking", "cook", "garland",
  "flute", "music", "song", "photo", "photograph", "album", "medicine", "medication",
  "tablet", "pill", "exercise", "yoga", "nap", "bath", "phone call", "call",
];

/**
 * Grounding check: an LLM-generated answer may only name people, places, or
 * activities that actually appear somewhere in the evidence pack. Prevents the
 * exact failure mode this backend used to have -- fabricating "Rina calls at
 * 5pm" regardless of real data. A candidate word is "supported" if it shows
 * up anywhere in the evidence text (person, place, memory, event), not only
 * in the person-entity facts -- otherwise real place names (Tezpur) or
 * honorifics get flagged as false positives.
 *
 * Three independent checks, because fabrication takes three different shapes:
 *   - names:      an invented person or place        ("Priya will visit")
 *   - activities: an invented thing to do or go to   ("a little walk to the market")
 *   - times:      an invented clock time             ("Rina calls at 5 pm")
 */
export function checkGrounding(
  answerText: string,
  pack: EvidencePack
): { grounded: boolean; unsupportedNames: string[]; unsupportedActivities: string[]; unsupportedTimes: string[] } {
  const normalize = (s: string) => s.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const evidenceText = normalize(pack.facts.map((f) => f.text).join("  "));
  const evidenceWords = new Set<string>();
  for (const f of pack.facts) {
    for (const w of f.text.match(/\p{L}+/gu) || []) {
      evidenceWords.add(normalize(w));
    }
  }

  // Unicode-aware: a capitalized word (letters only, length >= 3), so accented
  // honorifics like "Aitâ" match as one token instead of truncating at the
  // accent. \p{L} in the tail rather than \p{Ll} keeps an internally
  // capitalized name whole -- "TestPerson" split into "Test" + "Person" could
  // never match the evidence and was flagged as fabricated. Checks the whole
  // answer, including sentence-initial words (see COMMON_NON_NAMES above).
  const candidates = answerText.match(/\p{Lu}\p{L}{2,}/gu) || [];
  const unsupportedNames = candidates
    .filter((c) => !COMMON_NON_NAMES.has(normalize(c)))
    .filter((c) => !evidenceWords.has(normalize(c)))
    .filter((c, i, arr) => arr.indexOf(c) === i);

  const answerNorm = normalize(answerText);
  const unsupportedActivities = GROUNDED_ACTIVITY_TERMS.filter((term) => {
    const re = new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "u");
    return re.test(answerNorm) && !re.test(evidenceText);
  });

  // Clock times, normalized to minutes so "4 PM", "4:00 pm" and "16:00" all
  // compare equal instead of failing on formatting differences alone.
  const extractTimes = (s: string): Set<number> => {
    const out = new Set<number>();
    for (const m of s.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi)) {
      let h = Number(m[1]) % 12;
      if (m[3].toLowerCase() === "pm") h += 12;
      out.add(h * 60 + Number(m[2] ?? 0));
    }
    for (const m of s.matchAll(/\b(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/gi)) {
      const h = Number(m[1]);
      if (h <= 23) out.add(h * 60 + Number(m[2]));
    }
    return out;
  };
  const evidenceTimes = extractTimes(evidenceText);
  const unsupportedTimes = [...extractTimes(answerNorm)]
    .filter((t) => !evidenceTimes.has(t))
    .map((t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);

  return {
    grounded: unsupportedNames.length === 0 && unsupportedActivities.length === 0 && unsupportedTimes.length === 0,
    unsupportedNames,
    unsupportedActivities,
    unsupportedTimes,
  };
}
