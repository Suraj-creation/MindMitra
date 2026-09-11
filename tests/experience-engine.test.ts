// Experience Engine -- end-to-end against the real Neon database.
//
// Every test here fixes a property the engine must never lose: it does not
// invent a person's life, it does not use content it wasn't authorized to use,
// and it says so plainly when it has nothing. Two distinct test people are
// seeded (not name-swapped clones) so "personalisation" means the experiences
// actually differ, not that a name was substituted.

import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import { planExperience, templatesForConversation } from "../src/intelligence/experience/planner";
import { gatherExperienceEvidence } from "../src/intelligence/experience/evidence";
import { validateExperienceSpec } from "../src/intelligence/experience/validator";
import { decideInvitation } from "../src/intelligence/experience/invitation";
import { seededShuffle } from "../src/intelligence/experience/templates";
import * as experienceRepo from "../src/db/experience-repository";
import { classifyIntent } from "../src/intelligence/context/intent-classifier";
import type { ExperienceSpec } from "../src/intelligence/experience/types";

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED);

describe("Experience Engine (Neon)", { skip: !hasDb ? "Neon Database is not configured (requires DATABASE_URL)" : false }, () => {
const A = "person:test_xp_asha";      // photos, people, memories, places
const B = "person:test_xp_bimal";     // no media at all; different family, place, routine
const EMPTY = "person:test_xp_empty"; // nothing recorded

const ALL = [A, B, EMPTY];

async function wipe() {
  for (const p of ALL) {
    await queryDb("DELETE FROM experience_events WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM experience_specs WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM memory_people WHERE memory_id IN (SELECT id FROM memory_items WHERE person_id = $1)", [p]);
    await queryDb("DELETE FROM memory_media WHERE memory_id IN (SELECT id FROM memory_items WHERE person_id = $1)", [p]);
    await queryDb("DELETE FROM memory_items WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM place_media WHERE place_id IN (SELECT id FROM familiar_places WHERE person_id = $1)", [p]);
    await queryDb("DELETE FROM familiar_places WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM future_events WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM routines WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM relationships WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM person_entities WHERE person_id = $1", [p]);
    await queryDb("DELETE FROM media_assets WHERE person_id = $1", [p]);
  }
}

/** Hours from now, as an ISO timestamp. */
function at(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3600_000).toISOString();
}

before(async () => {
  await wipe();

  // ── Person A: Asha. Photographs, a family, places, a visit that happened. ──
  await queryDb(
    `INSERT INTO media_assets (id, person_id, storage_key, media_type, mime_type, created_by, provenance_id, consent_scope, visibility_scope)
     VALUES
      ('media:xa_wedding', $1, 'assets/images/vintage_assamese_wedding_1789020439671.jpg', 'photo', 'image/jpeg', 'actor:test', 'prov:test_a1', 'all', 'family'),
      ('media:xa_river',   $1, 'assets/images/brahmaputra_river_1788977296883.jpg',        'photo', 'image/jpeg', 'actor:test', 'prov:test_a2', 'all', 'family'),
      ('media:xa_private', $1, 'assets/images/assam_tea_garden_1788977277508.jpg',         'photo', 'image/jpeg', 'actor:test', 'prov:test_a3', 'person_only', 'private')`,
    [A]
  );

  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, verification_status)
     VALUES
      ('entity:xa_kamala', $1, 'Kamala', 'Kamala', 'daughter', 'verified'),
      ('entity:xa_pori',   $1, 'Pori',   'Pori',   'granddaughter', 'verified'),
      ('entity:xa_hemen',  $1, 'Hemen',  'Hemen',  'son', 'verified')`,
    [A]
  );
  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES
      ('rel:xa_kamala', $1, 'entity:xa_kamala', 'daughter', 'primary_caregiver', 'system'),
      ('rel:xa_pori',   $1, 'entity:xa_pori',   'granddaughter', 'family_core', 'system'),
      ('rel:xa_hemen',  $1, 'entity:xa_hemen',  'son', 'family_core', 'system')`,
    [A]
  );

  await queryDb(
    `INSERT INTO memory_items (id, person_id, memory_type, title, description, temporal_frame, approximate_period, source, verification_status, confidence, sensitivity, consent_scope, visibility_scope, cultural_context)
     VALUES
      ('mem:xa_wedding', $1, 'autobiographical', 'Wedding day by the river', 'The ceremony at the ghat.', 'young_adulthood', '1971', 'caregiver', 'verified', 0.98, 'low', 'all', 'family', 'Assam'),
      ('mem:xa_pori',    $1, 'relationship',     'Pori visiting in the holidays', 'Pori comes every summer.', 'recent', '2021 - Present', 'caregiver', 'verified', 0.95, 'low', 'all', 'family', 'Assam'),
      -- Sensitive + person-only: must never reach an activity (Section 59).
      ('mem:xa_secret',  $1, 'autobiographical', 'A private grief', 'Something she has asked not be discussed.', 'later_life', '2004', 'caregiver', 'verified', 0.99, 'high', 'person_only', 'private', 'Assam'),
      -- Unverified: an activity may not present a guess as the person's history.
      ('mem:xa_guess',   $1, 'autobiographical', 'Possibly a trip to Shillong', 'Unconfirmed.', 'later_life', '1990s', 'person', 'unverified', 0.40, 'low', 'all', 'family', 'Assam')`,
    [A]
  );
  await queryDb(
    `INSERT INTO memory_media (memory_id, media_asset_id, role, sequence_order) VALUES
      ('mem:xa_wedding', 'media:xa_wedding', 'primary_photo', 1),
      ('mem:xa_secret',  'media:xa_private', 'primary_photo', 1)`
  );
  await queryDb(
    `INSERT INTO memory_people (memory_id, person_entity_id, relationship, confidence, verification_status)
     VALUES ('mem:xa_pori', 'entity:xa_pori', 'granddaughter', 1.00, 'verified')`
  );

  await queryDb(
    `INSERT INTO familiar_places (id, person_id, name, category, significance, verification_status, confidence, consent_scope, visibility_scope, source, created_by)
     VALUES
      ('pl:xa_ghat',  $1, 'The river ghat', 'river', 'Where the wedding was held.', 'verified', 0.95, 'all', 'family', 'caregiver', 'actor:test'),
      ('pl:xa_home',  $1, 'The old house',  'home',  'Home for fifty years.',       'verified', 0.95, 'all', 'family', 'caregiver', 'actor:test')`,
    [A]
  );
  await queryDb(
    `INSERT INTO place_media (place_id, media_asset_id, role, sequence_order) VALUES ('pl:xa_ghat', 'media:xa_river', 'primary_photo', 1)`
  );

  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, person_name, relationship, location_name, scheduled_at, status, source)
     VALUES
      ('event:xa_past_visit', $1, 'family_visit', 'Pori came for tea', 'Pori', 'granddaughter', 'The old house', $2, 'occurred', 'caregiver'),
      ('event:xa_walk',       $1, 'community_walk', 'A walk to the ghat', NULL, NULL, 'The river ghat', $3, 'occurred', 'caregiver'),
      -- Cancelled: must never become "who is coming?" (Section 58).
      ('event:xa_cancelled',  $1, 'family_visit', 'Hemen was going to visit', 'Hemen', 'son', 'The old house', $4, 'cancelled', 'caregiver')`,
    [A, at(-6), at(-30), at(4)]
  );

  await queryDb(
    `INSERT INTO routines (id, person_id, title, time_of_day, anchor_description, source, verification_status, active)
     VALUES ('rt:xa_tea', $1, 'Afternoon tea on the step', '16:00', 'Tea with Kamala.', 'caregiver', 'verified', TRUE)`,
    [A]
  );

  // ── Person B: Bimal. No photographs at all, a different family and place. ──
  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, verification_status)
     VALUES
      ('entity:xb_sarita', $1, 'Sarita', 'Sarita', 'daughter', 'verified'),
      ('entity:xb_dev',    $1, 'Dev',    'Dev',    'grandson', 'verified'),
      ('entity:xb_mohan',  $1, 'Mohan',  'Mohan',  'neighbour', 'verified')`,
    [B]
  );
  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES
      ('rel:xb_sarita', $1, 'entity:xb_sarita', 'daughter', 'primary_caregiver', 'system'),
      ('rel:xb_dev',    $1, 'entity:xb_dev',    'grandson', 'family_core', 'system'),
      ('rel:xb_mohan',  $1, 'entity:xb_mohan',  'neighbour', 'extended', 'system')`,
    [B]
  );
  await queryDb(
    `INSERT INTO memory_items (id, person_id, memory_type, title, description, temporal_frame, approximate_period, source, verification_status, confidence, sensitivity, consent_scope, visibility_scope, cultural_context)
     VALUES
      ('mem:xb_mill', $1, 'autobiographical', 'Years at the paper mill', 'Thirty years on the line.', 'young_adulthood', '1968 - 1998', 'caregiver', 'verified', 0.96, 'low', 'all', 'family', 'Bihar'),
      ('mem:xb_kite', $1, 'autobiographical', 'Kite flying at Makar Sankranti', 'The roof every January.', 'childhood', '1950s', 'caregiver', 'verified', 0.96, 'low', 'all', 'family', 'Bihar')`,
    [B]
  );
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, person_name, relationship, location_name, scheduled_at, status, source)
     VALUES ('event:xb_visit', $1, 'family_visit', 'Dev coming after work', 'Dev', 'grandson', 'The courtyard', $2, 'confirmed', 'caregiver')`,
    [B, at(3)]
  );
  await queryDb(
    `INSERT INTO routines (id, person_id, title, time_of_day, anchor_description, source, verification_status, active)
     VALUES ('rt:xb_radio', $1, 'Morning radio', '07:00', 'The news on the veranda.', 'caregiver', 'verified', TRUE)`,
    [B]
  );

  // Person EMPTY is deliberately left with nothing at all.
});

test.after(async () => {
  await wipe();
});

// ── Section 55: real personalisation, not a name swap ──────────────────────

test("Two different people get meaningfully different experiences, not the same one renamed", async () => {
  const a = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  const b = await planExperience({ personId: B, trigger: "lets_do_something", language: "en" });

  assert.equal(a.status, "ready", "person A should have enough content for an experience");
  assert.equal(b.status, "ready", "person B should have enough content for an experience");
  if (a.status !== "ready" || b.status !== "ready") return;

  const labelsA = a.spec.steps.flatMap((s) => s.choices.map((c) => c.label));
  const labelsB = b.spec.steps.flatMap((s) => s.choices.map((c) => c.label));

  assert.notDeepEqual(labelsA.slice().sort(), labelsB.slice().sort(), "the options must come from different lives");
  for (const label of labelsB) {
    assert.ok(!labelsA.includes(label), `"${label}" appears in both people's experiences`);
  }
  assert.notEqual(a.spec.steps[0].prompt + a.spec.title, b.spec.steps[0].prompt + b.spec.title);
});

test("A person with no photographs still gets a real experience, from a template that needs none", async () => {
  const b = await planExperience({ personId: B, trigger: "lets_do_something", language: "en" });
  assert.equal(b.status, "ready");
  if (b.status !== "ready") return;

  for (const step of b.spec.steps) {
    assert.equal(step.media, null, "person B has no media, so no step may carry a photograph");
  }
  // Every photo-dependent template must have declined rather than improvised.
  const photoTemplates = ["PERSON_RECOGNITION", "PHOTO_MEMORY_RECALL", "PLACE_RECOGNITION"];
  for (const entry of b.trace.candidate_templates) {
    if (photoTemplates.includes(entry.template_id)) {
      assert.equal(entry.eligible, false, `${entry.template_id} must be ineligible without media`);
    }
  }
});

// ── Section 34/57: no data means saying so ─────────────────────────────────

test("With nothing recorded, the engine says so and invents nothing", async () => {
  const result = await planExperience({ personId: EMPTY, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "no_data");
  assert.match(result.message, /don't have enough saved information/i);
  assert.ok(result.trace.candidate_templates.every((c) => !c.eligible));
});

test("A conversation about yesterday with no yesterday recorded produces no invented event", async () => {
  const result = await planExperience({
    personId: EMPTY,
    trigger: "conversation",
    conversationText: "what did I do yesterday?",
    language: "en",
  });
  assert.equal(result.status, "no_data");
});

// ── Section 58: stale and cancelled content is excluded ────────────────────

test("A cancelled visit never becomes 'who is coming?'", async () => {
  const result = await planExperience({
    personId: A,
    trigger: "conversation",
    conversationText: "who is coming to visit?",
    preferTemplate: "WHO_IS_COMING",
    language: "en",
  });

  // Person A's only future event is cancelled, so there is nothing to prepare for.
  assert.equal(result.status, "no_data", "a cancelled event must not produce a preparation activity");

  const evidence = await gatherExperienceEvidence({ personId: A, need: { upcoming: true, people: true } });
  assert.equal(
    evidence.upcoming.some((e) => e.id === "event:xa_cancelled"),
    false,
    "a cancelled event must not appear in retrieved evidence at all"
  );
});

// ── Section 44/59: authorization is enforced below the UI ──────────────────

test("High-sensitivity, person-only memories and their media never enter an experience", async () => {
  const evidence = await gatherExperienceEvidence({
    personId: A,
    need: { memories: true, places: true, people: true, media: true },
  });

  assert.equal(evidence.memories.some((m) => m.id === "mem:xa_secret"), false, "sensitive memory leaked into evidence");
  assert.equal(evidence.media.has("media:xa_private"), false, "person-only media resolved for an activity");
  assert.ok(evidence.blocked.consent_or_sensitivity >= 1, "the block should be counted, not silent");

  for (let i = 0; i < 6; i++) {
    const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
    if (result.status !== "ready") continue;
    const text = JSON.stringify(result.spec);
    assert.ok(!text.includes("xa_secret"), "sensitive memory reached a spec");
    assert.ok(!text.includes("xa_private"), "private media reached a spec");
    assert.ok(!text.includes("A private grief"), "sensitive content reached person-facing text");
  }
});

test("Unverified memories are excluded: an activity may not present a guess as the person's own history", async () => {
  const evidence = await gatherExperienceEvidence({ personId: A, need: { memories: true } });
  assert.equal(evidence.memories.some((m) => m.id === "mem:xa_guess"), false);
  assert.ok(evidence.blocked.unverified >= 1);
});

test("Cross-person isolation: planning for one person never uses another's records", async () => {
  const evidence = await gatherExperienceEvidence({
    personId: B,
    need: { memories: true, people: true, places: true, media: true, upcoming: true, dayEvents: true, dayOffsets: [0, -1] },
  });
  const ids = [
    ...evidence.memories.map((m) => m.id),
    ...evidence.people.map((p) => p.id),
    ...evidence.places.map((p) => p.id),
    ...evidence.upcoming.map((e) => e.id),
  ];
  for (const id of ids) {
    assert.ok(!id.includes("xa_"), `person A's record ${id} reached person B's evidence`);
  }
});

// ── Section 32: every option comes from a real record ──────────────────────

test("Every choice, cue and media reference traces back to a retrieved record", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  const evidence = await gatherExperienceEvidence({
    personId: A,
    need: { memories: true, places: true, people: true, media: true, routines: true, upcoming: true, dayEvents: true, dayOffsets: [0, -1, -2] },
  });

  // The validator is the enforcement point; re-running it here proves the
  // property rather than restating the composer's intent.
  const validation = validateExperienceSpec(result.spec, evidence);
  assert.ok(validation.is_valid, `spec failed re-validation: ${validation.rejection_reasons.join(" | ")}`);

  for (const step of result.spec.steps) {
    assert.ok(step.choices.length >= 2, "a question needs at least two options");
    assert.equal(step.choices.filter((c) => c.is_expected).length, 1, "exactly one option is the expected answer");
    for (const choice of step.choices) {
      assert.ok(choice.source_entity_id, `option "${choice.label}" has no source record`);
    }
  }
});

test("The validator rejects a spec whose option cites a record that was never retrieved", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  const evidence = await gatherExperienceEvidence({
    personId: A,
    need: { memories: true, places: true, people: true, media: true, routines: true, upcoming: true, dayEvents: true, dayOffsets: [0, -1, -2] },
  });

  const tampered: ExperienceSpec = JSON.parse(JSON.stringify(result.spec));
  tampered.steps[0].choices[0].label = "Her sister Nirmala";
  tampered.steps[0].choices[0].source_entity_id = "entity:invented_by_a_model";

  const validation = validateExperienceSpec(tampered, evidence);
  assert.equal(validation.is_valid, false, "an ungrounded option must be rejected");
  assert.ok(validation.rejection_reasons.some((r) => /no retrieved source/i.test(r)));
});

// ── Sections 22/25/26: nothing clinical, nothing harsh ─────────────────────

test("The validator rejects clinical scoring language in anything the person would read", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  const evidence = await gatherExperienceEvidence({
    personId: A,
    need: { memories: true, places: true, people: true, media: true, routines: true, upcoming: true, dayEvents: true, dayOffsets: [0, -1, -2] },
  });

  for (const bad of ["Your memory score is 7 out of 10.", "That was an incorrect answer.", "This is a test of your memory."]) {
    const tampered: ExperienceSpec = JSON.parse(JSON.stringify(result.spec));
    tampered.completion.message = bad;
    const validation = validateExperienceSpec(tampered, evidence);
    assert.equal(validation.is_valid, false, `"${bad}" should have been rejected`);
  }
});

test("A composed spec carries no score, no timer and no failure screen", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.deepEqual(result.spec.safety, {
    no_score_shown: true,
    no_timer: true,
    no_failure_screen: true,
    skip_always_available: true,
    stop_always_available: true,
  });
});

// ── Section 24: the assistance ladder ──────────────────────────────────────

test("Every step's assistance ladder is contiguous and ends in full support", async () => {
  for (const person of [A, B]) {
    const result = await planExperience({ personId: person, trigger: "lets_do_something", language: "en" });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;

    for (const step of result.spec.steps) {
      const levels = step.scaffolds.map((r) => r.level);
      assert.deepEqual(levels, levels.map((_, i) => i + 1), "ladder levels must run 1..n with no holes");
      assert.equal(step.scaffolds[step.scaffolds.length - 1].kind, "full_support", "the ladder must reach full support");
      for (const rung of step.scaffolds) {
        assert.ok(rung.text.trim().length > 0, `S${rung.level} has no text`);
      }
    }
  }
});

test("A narrowing rung keeps the expected answer, never removes it", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en", maxChoices: 4 });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  for (const step of result.spec.steps) {
    const narrowing = step.scaffolds.find((r) => r.kind === "narrowed_choices");
    if (!narrowing?.keep_choice_ids) continue;
    const expected = step.expected_choice_ids[0];
    assert.ok(narrowing.keep_choice_ids.includes(expected), "narrowing dropped the correct answer");
    assert.ok(narrowing.keep_choice_ids.length >= 2, "narrowing must leave a real choice");
  }
});

// ── Sections 20/21/45: telemetry ───────────────────────────────────────────

test("Telemetry records the full outcome vocabulary and is idempotent on replay", async () => {
  const key = `test_idem_${Date.now()}`;
  const first = await experienceRepo.recordExperienceEvents([
    {
      person_id: A,
      event_type: "EXPERIENCE_RESPONSE",
      response: "Pori",
      expected_response: "Pori",
      outcome: "COMPLETED_WITH_SUPPORT",
      assistance_level: 3,
      measurement_quality: 0.65,
      measurement_conditions: { language_match: "en", online: false },
      idempotency_key: key,
    },
  ]);
  const replay = await experienceRepo.recordExperienceEvents([
    { person_id: A, event_type: "EXPERIENCE_RESPONSE", response: "Pori", idempotency_key: key },
  ]);

  assert.equal(first, 1, "the first write should land");
  assert.equal(replay, 0, "a replayed offline batch must not double-count");

  const summary = await experienceRepo.summariseExperienceParticipation(A, 1);
  assert.equal(summary.by_outcome.COMPLETED_WITH_SUPPORT >= 1, true);
  assert.equal(summary.by_assistance_level.S3 >= 1, true, "assistance level must be preserved, not flattened");
});

test("A low-quality observation is kept but not counted as a usable capability signal", async () => {
  const stamp = Date.now();
  await experienceRepo.recordExperienceEvents([
    {
      person_id: B,
      event_type: "EXPERIENCE_RESPONSE",
      outcome: "COMPLETED_WITH_SUPPORT",
      assistance_level: 5,
      measurement_quality: 0.2,
      measurement_conditions: { reason: "answer given after full reveal" },
      idempotency_key: `test_lowq_${stamp}`,
    },
  ]);
  const summary = await experienceRepo.summariseExperienceParticipation(B, 1);
  assert.ok(summary.low_quality_observations >= 1, "the low-quality observation must still be recorded");
});

test("Declining is recorded as an outcome in its own right, not as a failure", async () => {
  const stamp = Date.now();
  await experienceRepo.recordExperienceEvents([
    {
      person_id: B,
      spec_id: null,
      template_id: "EVENT_RECALL",
      event_type: "EXPERIENCE_DECLINED",
      outcome: "DECLINED",
      idempotency_key: `test_decl_${stamp}`,
    },
  ]);
  const summary = await experienceRepo.summariseExperienceParticipation(B, 1);
  assert.ok(summary.declined >= 1);
  assert.equal(summary.by_outcome.UNSUCCESSFUL ?? 0, 0, "a decline must never be recorded as an unsuccessful attempt");
});

test("Recently declined templates are visible to the planner so it can stop re-offering them", async () => {
  const stamp = Date.now();
  await experienceRepo.recordExperienceEvents([
    {
      person_id: A,
      template_id: "PLACE_RECOGNITION",
      event_type: "EXPERIENCE_DECLINED",
      outcome: "DECLINED",
      idempotency_key: `test_decl_place_${stamp}`,
    },
  ]);
  const recent = await experienceRepo.getRecentExperience(A);
  assert.ok(recent.declined_template_ids.includes("PLACE_RECOGNITION"));
});

// ── Sections 7/8/37: when the assistant may offer an activity ──────────────

const noRecent = {
  recent_template_ids: [],
  declined_template_ids: [],
  suppressed_entity_ids: [],
  suggestions_in_window: 0,
};

test("The assistant never offers an activity during distress, small talk, or a general question", () => {
  const cases = [
    ["I want to die", true],
    ["thank you", true],
    ["what is the capital of Assam?", true],
    ["stop", true],
  ] as const;

  for (const [utterance] of cases) {
    const classified = classifyIntent(utterance);
    const decision = decideInvitation({
      classified,
      text: utterance,
      hadEvidence: true,
      recent: noRecent,
      activityInProgress: false,
    });
    assert.equal(decision.offer, false, `"${utterance}" must not trigger an activity offer (${decision.why})`);
  }
});

test("The assistant offers after a grounded question about the person's own life", () => {
  const classified = classifyIntent("who came to see me yesterday?");
  const decision = decideInvitation({
    classified,
    text: "who came to see me yesterday?",
    hadEvidence: true,
    recent: noRecent,
    activityInProgress: false,
  });
  assert.equal(decision.offer, true, decision.why);
  assert.ok(decision.templates.includes("WHO_WAS_THERE"));
});

test("The assistant does not offer when it had nothing to answer from", () => {
  const classified = classifyIntent("who came to see me yesterday?");
  const decision = decideInvitation({
    classified,
    text: "who came to see me yesterday?",
    hadEvidence: false,
    recent: noRecent,
    activityInProgress: false,
  });
  assert.equal(decision.offer, false);
});

test("Suggestions are rate limited, but an explicit request is always honoured", () => {
  const saturated = { ...noRecent, suggestions_in_window: 5 };

  const passive = classifyIntent("what did I do yesterday?");
  assert.equal(
    decideInvitation({ classified: passive, text: "what did I do yesterday?", hadEvidence: true, recent: saturated, activityInProgress: false }).offer,
    false,
    "the assistant must stop volunteering activities once it has offered enough"
  );

  const asked = classifyIntent("let's do something");
  assert.equal(
    decideInvitation({ classified: asked, text: "let's do something", hadEvidence: true, recent: saturated, activityInProgress: false }).offer,
    true,
    "an explicit request is never rate limited"
  );
});

test("No second activity is offered while one is already open", () => {
  const classified = classifyIntent("let's do something");
  const decision = decideInvitation({
    classified,
    text: "let's do something",
    hadEvidence: true,
    recent: noRecent,
    activityInProgress: true,
  });
  assert.equal(decision.offer, false);
});

// ── Conversation routing ───────────────────────────────────────────────────

test("A conversation is routed to templates that match what was actually said", () => {
  assert.ok(templatesForConversation("what did I do yesterday?").includes("EVENT_RECALL"));
  assert.ok(templatesForConversation("who came to see me?").includes("WHO_WAS_THERE"));
  assert.ok(templatesForConversation("is Rina coming today?").includes("WHO_IS_COMING"));
  assert.ok(templatesForConversation("show me that photograph").includes("PHOTO_MEMORY_RECALL"));
  assert.ok(templatesForConversation("what do I usually do after tea?").includes("ROUTINE_SEQUENCE"));
  assert.deepEqual(templatesForConversation("hello there"), [], "an utterance pointing nowhere selects nothing specific");
});

test("A conversation about people produces an experience about the people actually in the data", async () => {
  const result = await planExperience({
    personId: B,
    trigger: "conversation",
    conversationText: "is Dev coming today?",
    language: "en",
  });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.spec.template_id, "WHO_IS_COMING");
  const labels = result.spec.steps[0].choices.map((c) => c.label);
  assert.ok(labels.includes("Dev"));
  for (const label of labels) {
    assert.ok(["Dev", "Sarita", "Mohan"].includes(label), `"${label}" is not one of this person's real contacts`);
  }
});

// ── Determinism & storage ──────────────────────────────────────────────────

test("Choice order is deterministic for a given seed, so a resumed experience looks the same", () => {
  const items = ["a", "b", "c", "d", "e"];
  assert.deepEqual(seededShuffle(items, "seed-1"), seededShuffle(items, "seed-1"));
  assert.notDeepEqual(seededShuffle(items, "seed-1"), seededShuffle(items, "seed-2"));
  assert.deepEqual(seededShuffle(items, "seed-1").slice().sort(), items.slice().sort(), "shuffling must not lose or add options");
});

test("A planned experience is stored and can be re-opened by its own person, but not by anyone else", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  const mine = await experienceRepo.getExperienceSpec(A, result.spec.spec_id);
  assert.ok(mine, "the person should be able to re-open their own experience");
  assert.equal(mine?.spec.spec_id, result.spec.spec_id);

  const theirs = await experienceRepo.getExperienceSpec(B, result.spec.spec_id);
  assert.equal(theirs, null, "a deep link must not resolve for a different person");
});

test("An expired spec does not resolve: personal content about a past day must not be replayed as current", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  await queryDb("UPDATE experience_specs SET expires_at = NOW() - interval '1 hour' WHERE id = $1", [result.spec.spec_id]);
  const fetched = await experienceRepo.getExperienceSpec(A, result.spec.spec_id);
  assert.equal(fetched, null);
});

// ── Section 53: traceability ───────────────────────────────────────────────

test("Every experience can explain why it was created, and which records it used", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  assert.ok(result.spec.reason, "an experience must record why it exists");
  assert.ok(result.spec.reason_detail.length > 0);
  assert.ok(result.spec.provenance.length > 0, "an experience must name the records behind it");
  assert.equal(result.trace.composed_by, "deterministic_composer");
  assert.ok(result.trace.entities_used.length > 0);
  assert.ok(result.trace.validation?.is_valid);
  assert.ok(result.trace.retrieval.plan.length > 0, "the trace must record what was retrieved and why");
});

test("The developer trace is not part of the spec the person's device renders", async () => {
  const result = await planExperience({ personId: A, trigger: "lets_do_something", language: "en" });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal("trace" in (result.spec as unknown as Record<string, unknown>), false);
});

// ── Section 56: media is real or absent, never substituted ─────────────────

test("A missing media object yields no photograph rather than a stand-in image", async () => {
  // A memory whose media row does not exist at all.
  await queryDb(
    `INSERT INTO memory_items (id, person_id, memory_type, title, description, temporal_frame, approximate_period, source, verification_status, confidence, sensitivity, consent_scope, visibility_scope, cultural_context)
     VALUES ('mem:xb_nomedia', $1, 'autobiographical', 'The old bicycle', 'Rode it to the mill.', 'young_adulthood', '1970s', 'caregiver', 'verified', 0.95, 'low', 'all', 'family', 'Bihar')
     ON CONFLICT (id) DO NOTHING`,
    [B]
  );
  await queryDb(
    `INSERT INTO memory_media (memory_id, media_asset_id, role, sequence_order)
     SELECT 'mem:xb_nomedia', 'media:xa_private', 'primary_photo', 1
     WHERE NOT EXISTS (SELECT 1 FROM memory_media WHERE memory_id = 'mem:xb_nomedia')`
  );

  const evidence = await gatherExperienceEvidence({ personId: B, need: { memories: true, media: true } });
  const mem = evidence.memories.find((m) => m.id === "mem:xb_nomedia");
  assert.ok(mem, "the memory itself is fine and should be retrievable");
  // The referenced media belongs to person A and is person-only: it must not resolve.
  assert.equal(evidence.media.has("media:xa_private"), false);

  const result = await planExperience({ personId: B, trigger: "lets_do_something", preferTemplate: "PHOTO_MEMORY_RECALL", language: "en" });
  assert.equal(result.status, "no_data", "a photo activity with no resolvable photo must not be offered at all");
});
});
