// Validation gate (Section 33). Nothing reaches the renderer without passing.
//
// The composers are deterministic and grounded by construction, so in normal
// operation every stage passes. That is the point: this is the gate that makes
// the guarantee enforceable rather than merely intended, and it is the gate a
// future LLM-composed spec would have to pass through unchanged.
//
// Deliberately separate from SpecificationValidatorPipeline
// (src/intelligence/specifications/validators/) -- that pipeline validates the
// legacy GameExperienceSpecification shape field by field
// (memory_place_bindings, sequence[].stimulus, per-game scaffolding enums) and
// cannot be pointed at a different type. The *policy* is the same one, applied
// to the generic spec.

import { ExperienceEvidence } from "./evidence";
import {
  ExperienceSpec,
  ExperienceValidation,
  ValidationStage,
} from "./types";

/** Language that would turn an activity into a clinical claim (Section 22). */
const FORBIDDEN_OUTPUT = [
  /\bmemory score\b/i,
  /\bbrain score\b/i,
  /\bcognitive score\b/i,
  /\bdementia\b/i,
  /\balzheimer/i,
  /\bprogression\b/i,
  /\byour memory (is|has) (improv|declin|worsen|getting)/i,
  /\byou (failed|lost|scored)\b/i,
  /\bwrong answer\b/i,
  /\bincorrect\b/i,
  /\btest\b/i,
  /\bassessment\b/i,
];

function stage(name: string, errors: string[], warnings: string[] = []): ValidationStage {
  return { stage: name, passed: errors.length === 0, errors, warnings };
}

/** Every person-facing string in the spec, so the safety sweep cannot miss one. */
function personFacingStrings(spec: ExperienceSpec): string[] {
  const out = [spec.title, spec.subtitle, spec.invitation_text, spec.completion.message, spec.completion.graceful_exit];
  for (const s of spec.steps) {
    out.push(s.prompt, s.gentle_retry);
    if (s.prompt_localised) out.push(s.prompt_localised);
    for (const c of s.choices) out.push(c.label, c.affirmation);
    for (const r of s.scaffolds) out.push(r.text);
    if (s.media) out.push(s.media.alt_text);
  }
  return out.filter(Boolean);
}

export function validateExperienceSpec(
  spec: ExperienceSpec,
  evidence: ExperienceEvidence
): ExperienceValidation {
  const stages: ValidationStage[] = [];

  // 1. SCHEMA -------------------------------------------------------------
  {
    const e: string[] = [];
    if (!spec.spec_id) e.push("spec_id missing");
    if (!spec.person_id) e.push("person_id missing");
    if (!spec.steps.length) e.push("spec has no steps");
    for (const s of spec.steps) {
      if (!s.prompt?.trim()) e.push(`step ${s.step_id}: empty prompt`);
      if (s.interaction === "single_choice") {
        if (s.choices.length < 2) e.push(`step ${s.step_id}: fewer than 2 choices`);
        if (s.expected_choice_ids.length !== 1) e.push(`step ${s.step_id}: single_choice needs exactly one expected answer`);
      }
      const ids = new Set(s.choices.map((c) => c.id));
      for (const exp of s.expected_choice_ids) {
        if (!ids.has(exp)) e.push(`step ${s.step_id}: expected choice ${exp} is not among the choices`);
      }
      if (s.choices.filter((c) => c.is_expected).length !== s.expected_choice_ids.length) {
        e.push(`step ${s.step_id}: is_expected flags disagree with expected_choice_ids`);
      }
    }
    stages.push(stage("schema", e));
  }

  // 2. SOURCE + ENTITY ----------------------------------------------------
  // Every option, cue and media reference must name a record that was actually
  // retrieved for THIS person in THIS request. This is the stage that makes
  // "the system must never invent the person's life" checkable.
  {
    const e: string[] = [];
    const known = new Set<string>();
    for (const m of evidence.memories) known.add(m.id);
    for (const p of evidence.places) known.add(p.id);
    for (const p of evidence.people) known.add(p.id);
    for (const r of evidence.routines) known.add(r.id);
    for (const list of Object.values(evidence.eventsByDay)) for (const ev of list) known.add(ev.id);
    for (const ev of evidence.upcoming) known.add(ev.id);
    for (const id of evidence.media.keys()) known.add(id);

    // Composite ids of the form "<eventId>:<name>" name a field of a retrieved
    // record rather than a record of its own; the record half must be known.
    const isKnown = (id: string) => known.has(id) || known.has(id.split(":").slice(0, 2).join(":"));

    for (const s of spec.steps) {
      for (const c of s.choices) {
        if (!isKnown(c.source_entity_id)) {
          e.push(`step ${s.step_id}: choice "${c.label}" has no retrieved source (${c.source_entity_id})`);
        }
        if (c.media && !evidence.media.has(c.media.media_id)) {
          e.push(`step ${s.step_id}: choice media ${c.media.media_id} was not authorized for this person`);
        }
      }
      if (s.media && !evidence.media.has(s.media.media_id)) {
        e.push(`step ${s.step_id}: media ${s.media.media_id} was not authorized for this person`);
      }
      for (const r of s.scaffolds) {
        for (const src of r.source_entity_ids) {
          if (!isKnown(src)) e.push(`step ${s.step_id}: scaffold S${r.level} cites unknown source ${src}`);
        }
      }
    }
    stages.push(stage("source_and_entity", e));
  }

  // 3. PROVENANCE ---------------------------------------------------------
  {
    const e: string[] = [];
    const w: string[] = [];
    if (spec.provenance.length === 0) e.push("spec carries no provenance references");
    for (const p of spec.provenance) {
      if (!p.verified) e.push(`provenance ${p.entity_id} is unverified -- an activity may not present a guess as the person's history`);
      if (p.confidence < 0.5) w.push(`provenance ${p.entity_id} has low confidence (${p.confidence})`);
    }
    stages.push(stage("provenance", e, w));
  }

  // 4. TEMPORAL -----------------------------------------------------------
  {
    const e: string[] = [];
    if (new Date(spec.expires_at).getTime() <= Date.now()) {
      e.push("spec is already expired");
    }
    // Cancelled/expired events are excluded in SQL (listUpcomingEvents /
    // listEventsForDay), so anything reaching here cannot be one. Re-asserted
    // as a belt-and-braces check because "who is coming today" built from a
    // cancelled visit is one of the worst failures this system can produce.
    const cancelled = Object.values(evidence.eventsByDay).flat().filter((ev) => ev.status === "cancelled").map((ev) => ev.id);
    const used = new Set(spec.steps.flatMap((s) => s.source_entity_ids.map((id) => id.split(":").slice(0, 2).join(":"))));
    for (const id of cancelled) {
      if (used.has(id)) e.push(`spec uses cancelled event ${id}`);
    }
    stages.push(stage("temporal", e));
  }

  // 5. CONSENT + AUTHORIZATION -------------------------------------------
  {
    const e: string[] = [];
    for (const p of spec.provenance) {
      if (!["games", "reminiscence", "all", "family"].includes(p.consent_scope)) {
        e.push(`provenance ${p.entity_id} has consent scope "${p.consent_scope}", which does not cover activities`);
      }
      if (p.sensitivity === "high") {
        e.push(`provenance ${p.entity_id} is high-sensitivity and may not be used in an activity`);
      }
    }
    // Cross-person isolation: the spec belongs to exactly one person, and
    // every piece of evidence was person-scoped at the query.
    if (evidence.person.id !== spec.person_id) {
      e.push("spec person_id does not match the person the evidence was retrieved for");
    }
    stages.push(stage("consent_and_authorization", e));
  }

  // 6. SAFETY + CONTENT ---------------------------------------------------
  {
    const e: string[] = [];
    for (const text of personFacingStrings(spec)) {
      const hit = FORBIDDEN_OUTPUT.find((r) => r.test(text));
      if (hit) e.push(`forbidden phrasing in person-facing text: "${text.slice(0, 80)}" matched ${hit}`);
    }
    if (!spec.safety.no_score_shown) e.push("safety.no_score_shown must be true");
    if (!spec.safety.no_timer) e.push("safety.no_timer must be true");
    if (!spec.safety.no_failure_screen) e.push("safety.no_failure_screen must be true");
    if (!spec.safety.stop_always_available) e.push("safety.stop_always_available must be true");
    if (!spec.safety.skip_always_available) e.push("safety.skip_always_available must be true");
    // A ladder that cannot reach full support can strand someone mid-activity.
    for (const s of spec.steps) {
      if (!s.scaffolds.some((r) => r.kind === "full_support")) {
        e.push(`step ${s.step_id}: assistance ladder has no full-support rung`);
      }
    }
    stages.push(stage("safety_and_content", e));
  }

  const rejection_reasons = stages.flatMap((s) => s.errors);
  return {
    is_valid: rejection_reasons.length === 0,
    validated_at: new Date().toISOString(),
    stages,
    rejection_reasons,
  };
}
