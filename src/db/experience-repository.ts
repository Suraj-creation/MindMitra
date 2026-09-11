// Persistence for the Experience Engine: validated specs and the Section 45
// event stream that becomes Experience Memory (Section 20).
//
// Separate from person-data-repository.ts because these are writes about what
// the system *did*, not reads of what the person's life *is*. Every read is
// still person_id-scoped -- experience history is personal data.

import { queryDb } from "./neon";
import {
  ExperienceEventInput,
  ExperienceSpec,
  ExperienceTrace,
  ExperienceValidation,
} from "../intelligence/experience/types";

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface StoredSpecRow {
  id: string;
  person_id: string;
  template_id: string;
  reason: string;
  spec: ExperienceSpec;
  trace: ExperienceTrace;
  validation: ExperienceValidation;
  expires_at: string;
  created_at: string;
}

export async function saveExperienceSpec(input: {
  spec: ExperienceSpec;
  trace: ExperienceTrace;
  validation: ExperienceValidation;
}): Promise<void> {
  const { spec, trace, validation } = input;
  const sourceEntityIds = Array.from(new Set(spec.steps.flatMap((s) => s.source_entity_ids)));
  await queryDb(
    `INSERT INTO experience_specs
       (id, person_id, template_id, reason, reason_detail, title, language, difficulty,
        source_entity_ids, spec, trace, validation, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO NOTHING`,
    [
      spec.spec_id, spec.person_id, spec.template_id, spec.reason, spec.reason_detail,
      spec.title, spec.language, spec.difficulty,
      JSON.stringify(sourceEntityIds), JSON.stringify(spec), JSON.stringify(trace),
      JSON.stringify(validation), spec.expires_at,
    ]
  );
}

/**
 * Fetch a stored spec for a deep link. Person-scoped and expiry-checked in
 * SQL: a link to someone else's experience, or to an experience about a day
 * that has passed, resolves to nothing rather than to stale personal content.
 */
export async function getExperienceSpec(personId: string, specId: string): Promise<StoredSpecRow | null> {
  const rows = await queryDb<any>(
    `SELECT * FROM experience_specs
     WHERE id = $1 AND person_id = $2 AND expires_at > NOW()`,
    [specId, personId]
  );
  return rows[0] ?? null;
}

export interface RecentExperienceSummary {
  /** Templates used recently -- used to diversify, not to ban (Section 36). */
  recent_template_ids: string[];
  /** Templates the person said "not now" to recently -- do not re-offer immediately (Section 37). */
  declined_template_ids: string[];
  /** Entities played recently; deprioritised so the same photo is not asked about twice in a day. */
  suppressed_entity_ids: string[];
  /** Suggestions made in the current cooldown window. The platform is not an engagement trap. */
  suggestions_in_window: number;
}

/**
 * What has already been offered and played. Drives template diversification
 * and suggestion frequency, both of which the planner needs before it decides
 * anything.
 */
export async function getRecentExperience(
  personId: string,
  opts: { lookbackHours?: number; suggestionWindowHours?: number } = {}
): Promise<RecentExperienceSummary> {
  const lookback = opts.lookbackHours ?? 48;
  const suggestionWindow = opts.suggestionWindowHours ?? 2;

  const rows = await queryDb<any>(
    `SELECT event_type, template_id, source_entity_ids, occurred_at
     FROM experience_events
     WHERE person_id = $1 AND occurred_at > NOW() - ($2 || ' hours')::interval
     ORDER BY occurred_at DESC
     LIMIT 400`,
    [personId, String(lookback)]
  );

  const recent = new Set<string>();
  const declined = new Set<string>();
  const suppressed = new Set<string>();
  let suggestionsInWindow = 0;
  const windowStart = Date.now() - suggestionWindow * 3600_000;

  for (const r of rows) {
    if (r.template_id && (r.event_type === "EXPERIENCE_STARTED" || r.event_type === "EXPERIENCE_COMPLETED")) {
      recent.add(r.template_id);
    }
    if (r.template_id && r.event_type === "EXPERIENCE_DECLINED") {
      declined.add(r.template_id);
    }
    if (r.event_type === "EXPERIENCE_SUGGESTED" && new Date(r.occurred_at).getTime() >= windowStart) {
      suggestionsInWindow++;
    }
    if (r.event_type === "EXPERIENCE_RESPONSE" && Array.isArray(r.source_entity_ids)) {
      for (const id of r.source_entity_ids) suppressed.add(String(id));
    }
  }

  return {
    recent_template_ids: Array.from(recent),
    declined_template_ids: Array.from(declined),
    suppressed_entity_ids: Array.from(suppressed),
    suggestions_in_window: suggestionsInWindow,
  };
}

/**
 * Append telemetry. Idempotent on idempotency_key so the offline outbox can
 * re-send a queued batch after reconnect without double-counting (Section 41/63).
 * Returns how many rows were actually new.
 */
export async function recordExperienceEvents(events: ExperienceEventInput[]): Promise<number> {
  let written = 0;
  for (const e of events) {
    const rows = await queryDb<any>(
      `INSERT INTO experience_events
         (id, person_id, spec_id, template_id, reason, event_type, step_id, step_index,
          response, expected_response, outcome, assistance_level, modality, language,
          latency_ms, measurement_quality, measurement_conditions, source_entity_ids,
          context, occurred_at, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
               COALESCE($20::timestamptz, NOW()), $21)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [
        newId("xev"), e.person_id, e.spec_id ?? null, e.template_id ?? null, e.reason ?? null,
        e.event_type, e.step_id ?? null, e.step_index ?? null,
        e.response ?? null, e.expected_response ?? null, e.outcome ?? null,
        e.assistance_level ?? 0, e.modality ?? null, e.language ?? null,
        e.latency_ms ?? null, e.measurement_quality ?? null,
        JSON.stringify(e.measurement_conditions ?? {}),
        JSON.stringify(e.source_entity_ids ?? []),
        JSON.stringify(e.context ?? {}),
        e.occurred_at ?? null,
        e.idempotency_key ?? newId("idem"),
      ]
    );
    if (rows.length > 0) written++;
  }
  return written;
}

/**
 * Section 46/47 -- the longitudinal read. Participation and assistance patterns,
 * never a score. Deliberately returns counts and conditions rather than any
 * derived "improvement" number: interpreting these is the projection layer's
 * job, under clinician-authored rules, not this query's.
 */
export async function summariseExperienceParticipation(
  personId: string,
  sinceDays = 7
): Promise<{
  by_outcome: Record<string, number>;
  by_template: Record<string, number>;
  by_assistance_level: Record<string, number>;
  usable_observations: number;
  low_quality_observations: number;
  declined: number;
  abandoned: number;
}> {
  const rows = await queryDb<any>(
    `SELECT event_type, template_id, outcome, assistance_level, measurement_quality
     FROM experience_events
     WHERE person_id = $1 AND occurred_at > NOW() - ($2 || ' days')::interval`,
    [personId, String(sinceDays)]
  );

  const byOutcome: Record<string, number> = {};
  const byTemplate: Record<string, number> = {};
  const byAssistance: Record<string, number> = {};
  let usable = 0;
  let lowQuality = 0;
  let declined = 0;
  let abandoned = 0;

  for (const r of rows) {
    if (r.outcome) byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
    if (r.template_id) byTemplate[r.template_id] = (byTemplate[r.template_id] ?? 0) + 1;
    if (r.event_type === "EXPERIENCE_RESPONSE") {
      const lvl = `S${r.assistance_level ?? 0}`;
      byAssistance[lvl] = (byAssistance[lvl] ?? 0) + 1;
      const q = r.measurement_quality === null || r.measurement_quality === undefined ? null : Number(r.measurement_quality);
      // Section 23: a poor-quality interaction is still recorded, it just does not
      // count as a capability signal.
      if (q !== null && q < 0.6) lowQuality++;
      else usable++;
    }
    if (r.event_type === "EXPERIENCE_DECLINED") declined++;
    if (r.event_type === "EXPERIENCE_ABANDONED") abandoned++;
  }

  return {
    by_outcome: byOutcome,
    by_template: byTemplate,
    by_assistance_level: byAssistance,
    usable_observations: usable,
    low_quality_observations: lowQuality,
    declined,
    abandoned,
  };
}
