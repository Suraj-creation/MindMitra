// The template system (Sections 29-31).
//
// A template is a DESCRIPTOR -- what content it needs, how the answer is
// modelled, which scaffolding rungs it can offer, what is being observed --
// plus one small deterministic composer that fills it from real retrieved
// records. Nothing here is a game; the same seven descriptors produce a
// different experience for every person and every day because the content is
// the person's own life.
//
// Three rules the composers never break:
//   1. Every option, cue and answer traces to a retrieved record id.
//   2. If there are not enough REAL distractors, the template is ineligible.
//      It never pads the choices with invented ones.
//   3. Medication content is excluded from every template. Medication guidance
//      is clinician-authored and governed elsewhere (see
//      src/intelligence/medication-store.ts); it is not activity material.

import {
  EvidenceEvent,
  EvidenceMemory,
  EvidencePerson,
  EvidencePlace,
  EvidenceRoutine,
  ExperienceEvidence,
} from "./evidence";
import {
  AssistanceLevel,
  ExperienceChoice,
  ExperienceMeasurementPlan,
  ExperienceReason,
  ExperienceStep,
  ExperienceTemplateId,
  InteractionMode,
  ProvenanceRef,
  ResolvedMedia,
  ScaffoldRung,
} from "./types";
import { EvidenceRequest } from "./evidence";

// -- Deterministic ordering --------------------------------------------------
// Choice order must be stable for a given spec so that a resumed or replayed
// experience presents the same screen. Math.random() would make a spec
// unreproducible, which defeats the point of storing it.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates driven by a seeded LCG. Same seed, same order, every time. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hashString(seed) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// -- Composer plumbing -------------------------------------------------------

export interface ComposerContext {
  ev: ExperienceEvidence;
  /** Entities played very recently. Deprioritised, never hard-banned. */
  suppressed: Set<string>;
  /** Upper bound on options, from the person's capability context. */
  maxChoices: number;
  /** Stable seed so the composed spec is reproducible. */
  seed: string;
}

export interface ComposedExperience {
  title: string;
  subtitle: string;
  invitation_text: string;
  reason_detail: string;
  steps: ExperienceStep[];
  provenance: ProvenanceRef[];
  completion_message: string;
}

export type Composer = (ctx: ComposerContext) => ComposedExperience | null;

export interface ExperienceTemplate {
  id: ExperienceTemplateId;
  reason: ExperienceReason;
  /** Retrieval this template needs. Fed straight into the evidence gatherer. */
  need: EvidenceRequest["need"];
  interaction: InteractionMode;
  answer_model: "single_expected" | "ordered_sequence";
  /** Rungs this template is capable of offering; a rung with no real data behind it is dropped at compose time. */
  scaffolding: AssistanceLevel[];
  measurement: ExperienceMeasurementPlan;
  /**
   * How long a composed spec stays valid. Personal content goes stale at very
   * different rates: "what happened this morning" is worthless tomorrow, a
   * wedding photograph is not.
   */
  freshness_hours: number;
  modality: "visual_choice" | "text_choice" | "photo_plus_voice";
  compose: Composer;
}

// -- Shared helpers ----------------------------------------------------------

function provenanceFor(
  entity_id: string,
  entity_type: ProvenanceRef["entity_type"],
  opts: Partial<ProvenanceRef> = {}
): ProvenanceRef {
  return {
    entity_id,
    entity_type,
    source: opts.source ?? "repository",
    verified: opts.verified ?? true,
    confidence: opts.confidence ?? 1,
    consent_scope: opts.consent_scope ?? "all",
    sensitivity: opts.sensitivity ?? "low",
  };
}

interface ChoiceSeed {
  entityId: string;
  label: string;
  media?: ResolvedMedia | null;
}

/**
 * Build the option set. Returns null when there are not enough real
 * distractors -- the caller must then treat the template as ineligible rather
 * than inventing an option (Sections 32/34).
 */
function buildChoices(
  correct: ChoiceSeed,
  distractorPool: ChoiceSeed[],
  ctx: ComposerContext,
  affirmation: string
): ExperienceChoice[] | null {
  const seen = new Set([correct.label.toLowerCase(), correct.entityId]);
  const usable = distractorPool.filter((d) => {
    const key = d.label.toLowerCase();
    if (seen.has(key) || seen.has(d.entityId)) return false;
    seen.add(key);
    seen.add(d.entityId);
    return true;
  });

  if (usable.length < 1) return null;

  // Prefer distractors that were not just used, but fall back to them rather
  // than dropping below two options.
  const fresh = usable.filter((d) => !ctx.suppressed.has(d.entityId));
  const ordered = [...fresh, ...usable.filter((d) => ctx.suppressed.has(d.entityId))];
  const picked = ordered.slice(0, Math.max(1, ctx.maxChoices - 1));

  const all: ExperienceChoice[] = [
    {
      id: `ch_${hashString(correct.entityId).toString(36)}`,
      label: correct.label,
      media: correct.media ?? null,
      is_expected: true,
      source_entity_id: correct.entityId,
      affirmation,
    },
    ...picked.map((d) => ({
      id: `ch_${hashString(d.entityId).toString(36)}`,
      label: d.label,
      media: d.media ?? null,
      is_expected: false,
      source_entity_id: d.entityId,
      // Section 26: never harsh. The retry line does the gentle correcting.
      affirmation: "",
    })),
  ];

  return seededShuffle(all, `${ctx.seed}:${correct.entityId}`);
}

/**
 * Assemble the assistance ladder. Rungs whose supporting data is missing are
 * simply absent -- a cue must never be composed out of nothing.
 */
function buildScaffolds(input: {
  contextualCue?: { text: string; sources: string[] } | null;
  modalityMedia?: ResolvedMedia | null;
  modalityText?: string;
  choices: ExperienceChoice[];
  partialReveal?: { text: string; sources: string[] } | null;
  fullSupport: { text: string; sources: string[] };
  ctx: ComposerContext;
}): ScaffoldRung[] {
  const rungs: ScaffoldRung[] = [];

  if (input.contextualCue) {
    rungs.push({
      level: 1,
      kind: "contextual_cue",
      text: input.contextualCue.text,
      media: null,
      source_entity_ids: input.contextualCue.sources,
    });
  }

  if (input.modalityMedia || input.modalityText) {
    rungs.push({
      level: 2,
      kind: "modality_change",
      text: input.modalityText || "Here is the photograph again — take your time with it.",
      media: input.modalityMedia ?? null,
      source_entity_ids: input.modalityMedia ? [input.modalityMedia.media_id] : [],
    });
  }

  // Narrowing is only meaningful when there is something to narrow.
  if (input.choices.length > 2) {
    const expected = input.choices.find((c) => c.is_expected)!;
    const other = input.choices.find((c) => !c.is_expected)!;
    rungs.push({
      level: 3,
      kind: "narrowed_choices",
      text: "Let's make it simpler — just these two.",
      media: null,
      keep_choice_ids: [expected.id, other.id],
      source_entity_ids: [expected.source_entity_id, other.source_entity_id],
    });
  }

  if (input.partialReveal) {
    rungs.push({
      level: 4,
      kind: "partial_reveal",
      text: input.partialReveal.text,
      media: null,
      source_entity_ids: input.partialReveal.sources,
    });
  }

  rungs.push({
    level: 5,
    kind: "full_support",
    text: input.fullSupport.text,
    media: null,
    source_entity_ids: input.fullSupport.sources,
  });

  // Renumber so the ladder is always contiguous from S1 regardless of which
  // rungs had data. A ladder with holes would make "next hint" skip levels.
  return rungs.map((r, i) => ({ ...r, level: (i + 1) as AssistanceLevel }));
}

function firstLetterHint(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return ch ? `Their name begins with "${ch}".` : "";
}

/** Rough time-of-day bucket, used to keep temporal distractors honest. */
function bucketOfMinutes(min: number | null): string {
  if (min === null) return "unknown";
  if (min < 360) return "night";
  if (min < 720) return "morning";
  if (min < 1020) return "afternoon";
  return "evening";
}

function bucketOfEvent(e: EvidenceEvent, timeZone: string): string {
  const m = new Date(e.scheduled_at);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(m)
  );
  return bucketOfMinutes(hour * 60);
}

function dayWord(offset: number): string {
  if (offset === 0) return "today";
  if (offset === -1) return "yesterday";
  if (offset === 1) return "tomorrow";
  return offset < 0 ? `${Math.abs(offset)} days ago` : `in ${offset} days`;
}

/** People who are not the answer, as distractors. Real relationships only. */
function peopleDistractors(people: EvidencePerson[], excludeNames: string[]): ChoiceSeed[] {
  const excluded = new Set(excludeNames.map((n) => n.toLowerCase()));
  return people
    .filter((p) => p.verified && !excluded.has(p.name.toLowerCase()))
    .map((p) => ({ entityId: p.id, label: p.name }));
}

// -- The templates -----------------------------------------------------------

const SAFE_COMPLETION = "That was lovely to do together.";

/**
 * EVENT_RECALL -- "What happened this morning?"
 * Grounded in an event that actually occurred on the target day.
 * Distractors are real events from OTHER days, and routines anchored to a
 * different part of the day: things that are genuinely part of this person's
 * life, just not the answer to this question.
 */
const eventRecall: ExperienceTemplate = {
  id: "EVENT_RECALL",
  reason: "RECENT_ACTIVITY_RECALL",
  need: { dayEvents: true, dayOffsets: [0, -1, -2], routines: true, people: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "autobiographical_memory",
    what_is_observed: "Recall of a recent event from the person's own day, under the assistance level reached.",
    quality_factors: ["language_match", "assistance_level", "device_context", "time_since_event"],
  },
  freshness_hours: 12,
  modality: "text_choice",
  compose: (ctx) => {
    const { ev } = ctx;
    const offsets = [0, -1, -2];
    const byOffset = offsets.map((o) => ({ o, events: (ev.eventsByDay[o] ?? []).filter((e) => e.past) }));
    const target = byOffset.find((b) => b.events.length > 0);
    if (!target) return null;

    const fresh = target.events.filter((e) => !ctx.suppressed.has(e.id));
    const correctEvent = (fresh[0] ?? target.events[0]) as EvidenceEvent;
    const bucket = bucketOfEvent(correctEvent, ev.person.time_zone);

    const otherDayEvents: ChoiceSeed[] = byOffset
      .filter((b) => b.o !== target.o)
      .flatMap((b) => b.events)
      .map((e) => ({ entityId: e.id, label: e.title }));

    const offBucketRoutines: ChoiceSeed[] = ev.routines
      .filter((r) => bucketOfMinutes(r.minutes) !== bucket)
      .map((r) => ({ entityId: r.id, label: r.title }));

    const sameDayOthers: ChoiceSeed[] = target.events
      .filter((e) => e.id !== correctEvent.id)
      .map((e) => ({ entityId: e.id, label: e.title }));

    const choices = buildChoices(
      { entityId: correctEvent.id, label: correctEvent.title },
      [...otherDayEvents, ...offBucketRoutines, ...sameDayOthers],
      ctx,
      "Yes — that's right."
    );
    if (!choices) return null;

    const when = dayWord(target.o);
    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: `Which of these happened ${when}?`,
      media: null,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: choices.map((c) => c.source_entity_id),
      scaffolds: buildScaffolds({
        contextualCue: correctEvent.location_name
          ? { text: `It was at ${correctEvent.location_name}${correctEvent.clock ? `, around ${correctEvent.clock}` : ""}.`, sources: [correctEvent.id] }
          : null,
        modalityText: `Let's read it again slowly: which of these happened ${when}?`,
        choices,
        partialReveal: correctEvent.person_name
          ? { text: `${correctEvent.person_name} was part of it.`, sources: [correctEvent.id] }
          : null,
        fullSupport: { text: `${correctEvent.title} — that's what happened ${when}.`, sources: [correctEvent.id] },
        ctx,
      }),
    };

    return {
      title: `Something about ${when}`,
      subtitle: "A small moment from your own day",
      invitation_text: `Would you like to remember something from ${when}?`,
      reason_detail: `Composed from event ${correctEvent.id} on day offset ${target.o}.`,
      steps: [step],
      provenance: [
        provenanceFor(correctEvent.id, "event"),
        ...choices.filter((c) => !c.is_expected).map((c) => provenanceFor(c.source_entity_id, "event")),
      ],
      completion_message: SAFE_COMPLETION,
    };
  },
};

/**
 * WHO_WAS_THERE -- "Who came to see you yesterday?"
 * Requires an event that actually names a person.
 */
const whoWasThere: ExperienceTemplate = {
  id: "WHO_WAS_THERE",
  reason: "FAMILY_MEMORY",
  need: { dayEvents: true, dayOffsets: [0, -1, -2], people: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "autobiographical_memory",
    what_is_observed: "Recall of who was present at a recent event in the person's own life.",
    quality_factors: ["language_match", "assistance_level", "relationship_familiarity"],
  },
  freshness_hours: 24,
  modality: "text_choice",
  compose: (ctx) => {
    const { ev } = ctx;
    const candidates = [0, -1, -2]
      .flatMap((o) => (ev.eventsByDay[o] ?? []).filter((e) => e.past && !!e.person_name));
    if (candidates.length === 0) return null;

    const event = candidates.find((e) => !ctx.suppressed.has(e.id)) ?? candidates[0];
    const name = event.person_name!;
    const distractors = peopleDistractors(ev.people, [name]);

    const choices = buildChoices({ entityId: `${event.id}:${name}`, label: name }, distractors, ctx, `Yes — that's ${name}.`);
    if (!choices) return null;

    const when = dayWord(event.day_offset);
    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: `Who was with you ${when}?`,
      media: null,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: choices.map((c) => c.source_entity_id),
      scaffolds: buildScaffolds({
        contextualCue: { text: `It was ${event.title.toLowerCase()}, at ${event.location_name}.`, sources: [event.id] },
        modalityText: `Take your time. Who was with you ${when}?`,
        choices,
        partialReveal: event.relationship
          ? { text: `It was your ${event.relationship}.`, sources: [event.id] }
          : { text: firstLetterHint(name), sources: [event.id] },
        fullSupport: { text: `It was ${name}.`, sources: [event.id] },
        ctx,
      }),
    };

    return {
      title: `Someone who was with you ${when}`,
      subtitle: "A moment with family",
      invitation_text: `Shall we remember who was with you ${when}?`,
      reason_detail: `Composed from event ${event.id} naming ${name}.`,
      steps: [step],
      provenance: [provenanceFor(event.id, "event"), ...ev.people.filter((p) => choices.some((c) => c.source_entity_id === p.id)).map((p) => provenanceFor(p.id, "person"))],
      completion_message: SAFE_COMPLETION,
    };
  },
};

/**
 * WHO_IS_COMING -- preparation for a confirmed upcoming visit.
 * Only confirmed/expected, non-expired events reach here: listUpcomingEvents
 * excludes cancelled ones in SQL, so a cancelled visit can never become
 * "who is coming today?" (Section 58).
 */
const whoIsComing: ExperienceTemplate = {
  id: "WHO_IS_COMING",
  reason: "UPCOMING_EVENT_PREPARATION",
  need: { upcoming: true, people: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "prospective_orientation",
    what_is_observed: "Orientation to a confirmed upcoming event and who it involves.",
    quality_factors: ["language_match", "assistance_level", "time_until_event"],
  },
  freshness_hours: 6,
  modality: "text_choice",
  compose: (ctx) => {
    const { ev } = ctx;
    const withPerson = ev.upcoming.filter((e) => !!e.person_name);
    if (withPerson.length === 0) return null;

    const event = withPerson[0];
    const name = event.person_name!;
    const distractors = peopleDistractors(ev.people, [name]);
    const choices = buildChoices({ entityId: `${event.id}:${name}`, label: name }, distractors, ctx, `Yes — ${name} is coming.`);
    if (!choices) return null;

    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: "Who are we getting ready for?",
      media: null,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: choices.map((c) => c.source_entity_id),
      scaffolds: buildScaffolds({
        contextualCue: { text: `${event.title} — at ${event.location_name}${event.clock ? `, ${event.clock}` : ""}.`, sources: [event.id] },
        modalityText: "Let's read it again: who are we getting ready for?",
        choices,
        partialReveal: event.relationship ? { text: `It's your ${event.relationship}.`, sources: [event.id] } : { text: firstLetterHint(name), sources: [event.id] },
        fullSupport: { text: `It's ${name}.`, sources: [event.id] },
        ctx,
      }),
    };

    return {
      title: "Getting ready",
      subtitle: "Someone is coming to see you",
      invitation_text: "Shall we get ready together for your visitor?",
      reason_detail: `Composed from confirmed upcoming event ${event.id}.`,
      steps: [step],
      provenance: [provenanceFor(event.id, "event")],
      completion_message: "Everything is ready. That was nice to do together.",
    };
  },
};

/**
 * PERSON_RECOGNITION -- a real photograph of a real person.
 *
 * The photo is found by walking the knowledge graph: person -> memory (via
 * memory_people) -> primary photo, falling back to an explicit avatar. No
 * identity is ever INFERRED from a photograph; the link has to already exist
 * in the data (Section 14).
 */
const personRecognition: ExperienceTemplate = {
  id: "PERSON_RECOGNITION",
  reason: "FAMILIAR_PERSON_RECOGNITION",
  need: { people: true, memories: true, media: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "person_recognition",
    what_is_observed: "Recognition of a familiar person from a family photograph.",
    quality_factors: ["visual_quality", "assistance_level", "language_match", "photo_age"],
  },
  freshness_hours: 24 * 14,
  modality: "photo_plus_voice",
  compose: (ctx) => {
    const { ev } = ctx;

    // A portrait has to be declared, never inferred.
    //
    // This used to fall back to "any photo attached to any memory this person
    // is linked to", which is not the same thing at all: the memory of Purnima
    // weaving a mekhela for her daughter is linked to the daughter, so "Who is
    // this?" was asked over a photograph of silk cloth. A memory FEATURING
    // someone is not a picture OF them, and guessing otherwise teaches a wrong
    // association about a real family member. Only an explicit avatar counts.
    const photoFor = (p: EvidencePerson): { media: ResolvedMedia; via: string } | null => {
      if (!p.avatar_media_id) return null;
      const m = ev.media.get(p.avatar_media_id);
      return m ? { media: m, via: p.id } : null;
    };

    const withPhotos = ev.people
      .filter((p) => p.verified)
      .map((p) => ({ person: p, photo: photoFor(p) }))
      .filter((x): x is { person: EvidencePerson; photo: { media: ResolvedMedia; via: string } } => x.photo !== null);

    if (withPhotos.length === 0) return null;

    const chosen = withPhotos.find((x) => !ctx.suppressed.has(x.person.id)) ?? withPhotos[0];
    const distractors = peopleDistractors(ev.people, [chosen.person.name]);
    const choices = buildChoices(
      { entityId: chosen.person.id, label: chosen.person.name },
      distractors,
      ctx,
      `Yes — that's ${chosen.person.name}.`
    );
    if (!choices) return null;

    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: "Who is this?",
      media: chosen.photo.media,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: [chosen.person.id, chosen.photo.media.media_id, ...choices.map((c) => c.source_entity_id)],
      scaffolds: buildScaffolds({
        contextualCue: chosen.person.relationship
          ? { text: `This is someone very close to you — your ${chosen.person.relationship}.`, sources: [chosen.person.id] }
          : null,
        modalityMedia: chosen.photo.media,
        choices,
        partialReveal: { text: firstLetterHint(chosen.person.name), sources: [chosen.person.id] },
        fullSupport: { text: `That's ${chosen.person.name}.`, sources: [chosen.person.id] },
        ctx,
      }),
    };

    return {
      title: "A familiar face",
      subtitle: "From your own photographs",
      invitation_text: "Would you like to look at a photograph together?",
      reason_detail: `Composed from person ${chosen.person.id}, photo ${chosen.photo.media.media_id} via ${chosen.photo.via}.`,
      steps: [step],
      provenance: [
        provenanceFor(chosen.person.id, "person"),
        provenanceFor(chosen.photo.media.media_id, "media"),
      ],
      completion_message: SAFE_COMPLETION,
    };
  },
};

/** PHOTO_MEMORY_RECALL -- a real photograph, matched to the memory it belongs to. */
const photoMemoryRecall: ExperienceTemplate = {
  id: "PHOTO_MEMORY_RECALL",
  reason: "FAMILY_MEMORY",
  need: { memories: true, media: true, people: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "autobiographical_memory",
    what_is_observed: "Association of a family photograph with the life event it belongs to.",
    quality_factors: ["visual_quality", "assistance_level", "language_match"],
  },
  freshness_hours: 24 * 14,
  modality: "photo_plus_voice",
  compose: (ctx) => {
    const { ev } = ctx;
    const withPhoto = ev.memories
      .map((m) => ({ memory: m, media: m.media_refs.map((id) => ev.media.get(id)).find(Boolean) as ResolvedMedia | undefined }))
      .filter((x): x is { memory: EvidenceMemory; media: ResolvedMedia } => !!x.media);

    if (withPhoto.length === 0) return null;

    const chosen = withPhoto.find((x) => !ctx.suppressed.has(x.memory.id)) ?? withPhoto[0];
    const distractors: ChoiceSeed[] = ev.memories
      .filter((m) => m.id !== chosen.memory.id)
      .map((m) => ({ entityId: m.id, label: m.title }));

    const choices = buildChoices(
      { entityId: chosen.memory.id, label: chosen.memory.title },
      distractors,
      ctx,
      "Yes — you remembered."
    );
    if (!choices) return null;

    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: "Do you remember this? Which of these is it from?",
      media: chosen.media,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: [chosen.memory.id, chosen.media.media_id, ...choices.map((c) => c.source_entity_id)],
      scaffolds: buildScaffolds({
        contextualCue: chosen.memory.approximate_period
          ? { text: `This is from around ${chosen.memory.approximate_period}.`, sources: [chosen.memory.id] }
          : null,
        modalityMedia: chosen.media,
        choices,
        partialReveal: chosen.memory.description
          ? { text: chosen.memory.description.split(/(?<=\.)\s/)[0], sources: [chosen.memory.id] }
          : null,
        fullSupport: { text: `${chosen.memory.title}.`, sources: [chosen.memory.id] },
        ctx,
      }),
    };

    return {
      title: "A photograph from your life",
      subtitle: chosen.memory.approximate_period || "From your own album",
      invitation_text: "There's a photograph here. Shall we look at it together?",
      reason_detail: `Composed from memory ${chosen.memory.id} with photo ${chosen.media.media_id}.`,
      steps: [step],
      provenance: [provenanceFor(chosen.memory.id, "memory", { confidence: chosen.memory.confidence, source: chosen.memory.source, consent_scope: chosen.memory.consent_scope, sensitivity: chosen.memory.sensitivity }), provenanceFor(chosen.media.media_id, "media")],
      completion_message: SAFE_COMPLETION,
    };
  },
};

/** PLACE_RECOGNITION -- a real photograph of a place the person knows. */
const placeRecognition: ExperienceTemplate = {
  id: "PLACE_RECOGNITION",
  reason: "PLACE_MEMORY",
  need: { places: true, media: true },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "place_recognition",
    what_is_observed: "Recognition of a familiar place from a photograph.",
    quality_factors: ["visual_quality", "assistance_level", "language_match"],
  },
  freshness_hours: 24 * 14,
  modality: "photo_plus_voice",
  compose: (ctx) => {
    const { ev } = ctx;
    const withPhoto = ev.places
      .map((p) => ({ place: p, media: p.media_refs.map((id) => ev.media.get(id)).find(Boolean) as ResolvedMedia | undefined }))
      .filter((x): x is { place: EvidencePlace; media: ResolvedMedia } => !!x.media);

    if (withPhoto.length === 0) return null;

    const chosen = withPhoto.find((x) => !ctx.suppressed.has(x.place.id)) ?? withPhoto[0];
    const distractors: ChoiceSeed[] = ev.places
      .filter((p) => p.id !== chosen.place.id)
      .map((p) => ({ entityId: p.id, label: p.name }));

    const choices = buildChoices(
      { entityId: chosen.place.id, label: chosen.place.name },
      distractors,
      ctx,
      "Yes — that's the one."
    );
    if (!choices) return null;

    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: "Which place is this?",
      media: chosen.media,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: [chosen.place.id, chosen.media.media_id, ...choices.map((c) => c.source_entity_id)],
      scaffolds: buildScaffolds({
        contextualCue: chosen.place.significance
          ? { text: chosen.place.significance, sources: [chosen.place.id] }
          : null,
        modalityMedia: chosen.media,
        choices,
        partialReveal: { text: firstLetterHint(chosen.place.name), sources: [chosen.place.id] },
        fullSupport: { text: `This is ${chosen.place.name}.`, sources: [chosen.place.id] },
        ctx,
      }),
    };

    return {
      title: "A place you know well",
      subtitle: "From your own world",
      invitation_text: "Shall we look at a place you know?",
      reason_detail: `Composed from place ${chosen.place.id} with photo ${chosen.media.media_id}.`,
      steps: [step],
      provenance: [provenanceFor(chosen.place.id, "place"), provenanceFor(chosen.media.media_id, "media")],
      completion_message: SAFE_COMPLETION,
    };
  },
};

/**
 * ROUTINE_SEQUENCE -- "What usually comes after X?"
 *
 * Built over the real, time-ordered anchors of the person's day: standing
 * routines plus today's non-medication events. Needs at least three anchors,
 * so there is a genuine "after" and at least one real alternative. Medication
 * doses are deliberately excluded (see module header).
 */
const routineSequence: ExperienceTemplate = {
  id: "ROUTINE_SEQUENCE",
  reason: "DAILY_LIFE_SEQUENCE",
  need: { routines: true, dayEvents: true, dayOffsets: [0] },
  interaction: "single_choice",
  answer_model: "single_expected",
  scaffolding: [1, 2, 3, 4, 5],
  measurement: {
    domain: "routine_sequencing",
    what_is_observed: "Sequencing of the person's own daily anchors.",
    quality_factors: ["assistance_level", "language_match", "time_of_day"],
  },
  freshness_hours: 24,
  modality: "text_choice",
  compose: (ctx) => {
    const { ev } = ctx;

    type Anchor = { id: string; label: string; minutes: number; kind: "routine" | "event" };
    const anchors: Anchor[] = [
      ...ev.routines
        .filter((r: EvidenceRoutine) => r.minutes !== null)
        .map((r) => ({ id: r.id, label: r.title, minutes: r.minutes as number, kind: "routine" as const })),
      ...(ev.eventsByDay[0] ?? []).map((e) => {
        const hhmm = new Intl.DateTimeFormat("en-GB", {
          timeZone: ev.person.time_zone, hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(new Date(e.scheduled_at));
        const [h, m] = hhmm.split(":").map(Number);
        return { id: e.id, label: e.title, minutes: h * 60 + m, kind: "event" as const };
      }),
    ].sort((a, b) => a.minutes - b.minutes);

    // Distinct labels only: two rows describing the same daily tea would make
    // "what comes after" have two defensible answers.
    const deduped: Anchor[] = [];
    const seenLabels = new Set<string>();
    for (const a of anchors) {
      const key = a.label.toLowerCase();
      if (seenLabels.has(key)) continue;
      seenLabels.add(key);
      deduped.push(a);
    }

    if (deduped.length < 3) return null;

    const pivotIndex = 0;
    const pivot = deduped[pivotIndex];
    const answer = deduped[pivotIndex + 1];
    const distractors: ChoiceSeed[] = deduped
      .slice(pivotIndex + 2)
      .map((a) => ({ entityId: a.id, label: a.label }));

    const choices = buildChoices(
      { entityId: answer.id, label: answer.label },
      distractors,
      ctx,
      "Yes — that's what comes next."
    );
    if (!choices) return null;

    const step: ExperienceStep = {
      step_id: "s1",
      step_index: 0,
      prompt: `What usually comes after ${pivot.label}?`,
      media: null,
      interaction: "single_choice",
      choices,
      expected_choice_ids: [choices.find((c) => c.is_expected)!.id],
      gentle_retry: "Not quite — here's a little hint.",
      source_entity_ids: [pivot.id, ...choices.map((c) => c.source_entity_id)],
      scaffolds: buildScaffolds({
        contextualCue: { text: `${pivot.label} is early in your day. The next one comes soon after.`, sources: [pivot.id] },
        modalityText: `Let's think about your day in order. What comes after ${pivot.label}?`,
        choices,
        partialReveal: { text: firstLetterHint(answer.label), sources: [answer.id] },
        fullSupport: { text: `After ${pivot.label} comes ${answer.label}.`, sources: [pivot.id, answer.id] },
        ctx,
      }),
    };

    return {
      title: "The shape of your day",
      subtitle: "What usually comes next",
      invitation_text: "Shall we walk through your day together?",
      reason_detail: `Composed from day anchors ${pivot.id} -> ${answer.id}.`,
      steps: [step],
      provenance: [pivot, answer].map((a) => provenanceFor(a.id, a.kind === "routine" ? "routine" : "event")),
      completion_message: SAFE_COMPLETION,
    };
  },
};

export const EXPERIENCE_TEMPLATES: ExperienceTemplate[] = [
  personRecognition,
  whoWasThere,
  eventRecall,
  photoMemoryRecall,
  whoIsComing,
  placeRecognition,
  routineSequence,
];

export function templateById(id: ExperienceTemplateId): ExperienceTemplate | undefined {
  return EXPERIENCE_TEMPLATES.find((t) => t.id === id);
}

/** Union of the retrieval needs of a set of templates -- the query-shaped plan. */
export function mergeNeeds(templates: ExperienceTemplate[]): EvidenceRequest["need"] {
  const need: EvidenceRequest["need"] = {};
  const offsets = new Set<number>();
  for (const t of templates) {
    for (const [k, v] of Object.entries(t.need)) {
      if (k === "dayOffsets") {
        for (const o of (v as number[]) ?? []) offsets.add(o);
      } else if (v) {
        (need as any)[k] = true;
      }
    }
  }
  if (need.dayEvents) need.dayOffsets = Array.from(offsets).sort((a, b) => b - a);
  return need;
}
