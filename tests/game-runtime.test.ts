import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultTemplateRegistry,
  GameTemplateRegistry,
} from "../src/game-runtime/templates/registry.js";
import { validateGameExperienceSpec } from "../src/game-runtime/validation/spec-validator.js";
import {
  getNextScaffoldingLevel,
  getScaffoldingWeight,
  resolveScaffoldingStep,
} from "../src/game-runtime/runtime/scaffolding-ladder.js";
import { GameSessionRuntime } from "../src/game-runtime/runtime/game-session-runtime.js";
import {
  staticTimelineSpecLevelA,
  personalisedPrepareForSpecLevelB,
  dynamicComposedTimelineSpecLevelC,
} from "../src/game-runtime/specs/sample-specs.js";
import { GameExperienceSpecification } from "../src/game-runtime/types.js";

// ── Test Suite 1: Game Template Registry ─────────────────────────────────────
test("GameTemplateRegistry: contains ratified deterministic game templates", () => {
  const templates = defaultTemplateRegistry.list();
  assert.ok(templates.length >= 2, "Must register at least 2 deterministic templates");

  const timelineTemplate = defaultTemplateRegistry.get("my_life_timeline");
  assert.ok(timelineTemplate, "my_life_timeline template must be registered");
  assert.equal(timelineTemplate.cognitive_family, "autobiographical_sequencing");
  assert.ok(timelineTemplate.supported_primitives.includes("recognition"));
  assert.ok(timelineTemplate.supported_primitives.includes("ordering"));
  assert.ok(timelineTemplate.supported_primitives.includes("hint"));
  assert.ok(timelineTemplate.supported_primitives.includes("graceful_skip"));
  assert.ok(timelineTemplate.supported_primitives.includes("completion"));
  assert.equal(timelineTemplate.offline_capability, true);

  // Validate template safety & dignity constraints
  assert.equal(timelineTemplate.safety_constraints.require_verified_memories, true);
  assert.equal(timelineTemplate.dignity_constraints.ban_failure_labels, true);
  assert.equal(timelineTemplate.dignity_constraints.ban_competitive_scoring, true);
  assert.equal(timelineTemplate.dignity_constraints.ban_visible_countdown, true);

  const prepareTemplate = defaultTemplateRegistry.get("prepare_for");
  assert.ok(prepareTemplate, "prepare_for template must be registered");
  assert.equal(prepareTemplate.cognitive_family, "prospective_orientation");
  assert.ok(prepareTemplate.supported_primitives.includes("sequencing"));
  assert.ok(prepareTemplate.supported_primitives.includes("reminder_action"));
});

// ── Test Suite 2: Deterministic Specification Validation ─────────────────────
test("SpecValidator: validates Static Deterministic Spec (Level A)", () => {
  const res = validateGameExperienceSpec(staticTimelineSpecLevelA);
  assert.equal(res.valid, true, "Static Level A spec must be valid");
  assert.equal(res.errors.length, 0);
  assert.equal(res.template_matched, "tmpl_my_life_timeline_v1");
});

test("SpecValidator: validates Parametrically Personalised Spec (Level B)", () => {
  const res = validateGameExperienceSpec(personalisedPrepareForSpecLevelB);
  assert.equal(res.valid, true, "Personalised Level B spec must be valid");
  assert.equal(res.errors.length, 0);
  assert.equal(res.template_matched, "tmpl_prepare_for_v1");
});

test("SpecValidator: validates Dynamically Composed Spec (Level C)", () => {
  const res = validateGameExperienceSpec(dynamicComposedTimelineSpecLevelC);
  assert.equal(res.valid, true, "Dynamic Level C spec must be valid");
  assert.equal(res.errors.length, 0);
  assert.equal(res.template_matched, "tmpl_my_life_timeline_v1");
});

test("SpecValidator: deterministically rejects unknown template keys", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    template_key: "non_existent_rogue_game",
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("UNKNOWN_TEMPLATE")),
    "Must reject unregistered template key"
  );
});

test("SpecValidator: deterministically rejects out-of-bounds difficulty levels", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    difficulty: 5, // Template allows [1, 3]
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("INVALID_DIFFICULTY")),
    "Must reject difficulty out of range"
  );
});

test("SpecValidator: deterministically rejects disallowed modalities", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    modality: "virtual_reality_haptic" as any,
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("DISALLOWED_MODALITY")),
    "Must reject disallowed modality"
  );
});

test("SpecValidator: deterministically rejects missing mandatory content slots", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    content_bindings: {}, // Missing required 'milestones'
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("MISSING_REQUIRED_SLOT")),
    "Must reject missing required slot"
  );
});

test("SpecValidator: deterministically rejects insufficient slot items", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    content_bindings: {
      milestones: [
        {
          id: "single_milestone",
          title: "Only One Milestone",
          approximate_year: "1960",
          chronological_order: 1,
        },
      ], // Minimum required is 2
    },
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("INSUFFICIENT_SLOT_ITEMS")),
    "Must enforce minimum slot cardinality"
  );
});

test("SpecValidator: enforces dignity invariants by rejecting failure and scoring phrases", () => {
  const badSpec = {
    ...staticTimelineSpecLevelA,
    instructions: {
      primary_prompt: "You got a wrong answer and failed the test!",
      spoken_prompt: "Hurry up before countdown timer runs out!",
      success_celebration: "You won!",
    },
  };
  const res = validateGameExperienceSpec(badSpec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.includes("DIGNITY_VIOLATION") || e.includes("SAFETY_VIOLATION")),
    "Must reject failure labels or countdown timers"
  );
});

// ── Test Suite 3: Scaffolding Ladder ─────────────────────────────────────────
test("ScaffoldingLadder: ascends strictly through 6-tier progression", () => {
  const ladder = [
    "independent",
    "contextual_cue",
    "modality_shift",
    "narrowed_choice",
    "partial_reveal",
    "full_support",
  ] as const;

  for (let i = 0; i < ladder.length - 1; i++) {
    const next = getNextScaffoldingLevel(ladder[i]);
    assert.equal(next, ladder[i + 1], `Level ${ladder[i]} must advance to ${ladder[i + 1]}`);
  }

  // Cap at full_support
  assert.equal(getNextScaffoldingLevel("full_support"), "full_support");
});

test("ScaffoldingLadder: assistance weights scale smoothly from 0.0 to 1.0", () => {
  assert.equal(getScaffoldingWeight("independent"), 0.0);
  assert.equal(getScaffoldingWeight("contextual_cue"), 0.2);
  assert.equal(getScaffoldingWeight("modality_shift"), 0.4);
  assert.equal(getScaffoldingWeight("narrowed_choice"), 0.6);
  assert.equal(getScaffoldingWeight("partial_reveal"), 0.8);
  assert.equal(getScaffoldingWeight("full_support"), 1.0);
});

test("ScaffoldingLadder: resolves appropriate cues without exposing failure", () => {
  const ctx = {
    step_name: "test_step",
    primary_stimulus: "Which milestone came earlier?",
    contextual_text: "Notice the school uniform.",
    family_voice_url: "/audio/sample.mp3",
    family_voice_speaker: "Anu",
    candidate_choices: ["opt_a", "opt_b", "opt_c", "opt_d"],
    target_id: "opt_a",
  };

  const indepCue = resolveScaffoldingStep("independent", ctx);
  assert.equal(indepCue.full_support_active, false);
  assert.equal(indepCue.active_choices?.length, 4);

  const narrowedCue = resolveScaffoldingStep("narrowed_choice", ctx);
  assert.equal(narrowedCue.active_choices?.length, 2, "Narrowed choice must reduce to 2 options");
  assert.ok(narrowedCue.active_choices?.includes("opt_a"));

  const fullSupportCue = resolveScaffoldingStep("full_support", ctx);
  assert.equal(fullSupportCue.full_support_active, true);
  assert.equal(fullSupportCue.revealed_anchor_id, "opt_a");
});

// ── Test Suite 4: Game Session Runtime State Machine ─────────────────────────
test("GameSessionRuntime: manages state lifecycle from start to completion", () => {
  const runtime = new GameSessionRuntime(staticTimelineSpecLevelA, 2);
  let state = runtime.getState();
  assert.equal(state.status, "idle");
  assert.equal(state.current_scaffolding_level, "independent");

  // 1. Start Session
  runtime.start();
  state = runtime.getState();
  assert.equal(state.status, "in_progress");

  // 2. Pause and Resume
  runtime.pause();
  assert.equal(runtime.getState().status, "paused");
  runtime.resume();
  assert.equal(runtime.getState().status, "in_progress");

  // 3. Request Scaffolding
  const nextLvl = runtime.requestScaffolding();
  assert.equal(nextLvl, "contextual_cue");
  assert.equal(runtime.getState().current_scaffolding_level, "contextual_cue");

  // 4. Record Trial
  const trial1 = runtime.recordTrial({
    step_name: "timeline_comparison",
    stimulus: "Milestone A vs Milestone B",
    user_selection: "ms_school_days",
    is_affirmative_match: true,
    latency_ms: 1850,
  });
  assert.equal(trial1.trial_index, 1);
  assert.equal(trial1.completion_state, "assisted");
  assert.equal(trial1.is_affirmative_match, true);
  assert.ok(trial1.measurement_quality > 0.9);

  // 5. Advance Step
  runtime.advanceStep();
  assert.equal(runtime.getState().current_step_index, 1);

  // 6. Graceful Skip
  const skipTrial = runtime.gracefulSkip("timeline_ordering", "Advancing with dignity");
  assert.equal(skipTrial.completion_state, "skipped");
  assert.equal(skipTrial.is_affirmative_match, true, "Graceful skip never marks as failure");

  // 7. Complete Session
  const outcome = runtime.complete();
  assert.equal(outcome.total_trials, 2);
  assert.equal(outcome.completed_steps, 1);
  assert.equal(outcome.skipped_steps, 1);
  assert.ok(outcome.engagement_score >= 0.7 && outcome.engagement_score <= 1.0);
  assert.ok(outcome.experience_episode, "Must synthesize ExperienceEpisode");
  assert.equal(outcome.experience_episode.template_key, "my_life_timeline");
  assert.ok(outcome.celebration_message.length > 0);
});

test("GameSessionRuntime: detects fatigue on persistent slow latency", () => {
  const runtime = new GameSessionRuntime(staticTimelineSpecLevelA, 5);
  runtime.start();

  // Record 3 very slow trials (> 10s)
  runtime.recordTrial({
    step_name: "step_1",
    stimulus: "Stimulus 1",
    user_selection: "opt_1",
    is_affirmative_match: true,
    latency_ms: 12000,
  });
  runtime.recordTrial({
    step_name: "step_2",
    stimulus: "Stimulus 2",
    user_selection: "opt_2",
    is_affirmative_match: true,
    latency_ms: 14000,
  });
  runtime.recordTrial({
    step_name: "step_3",
    stimulus: "Stimulus 3",
    user_selection: "opt_3",
    is_affirmative_match: true,
    latency_ms: 11000,
  });

  const state = runtime.getState();
  assert.equal(state.fatigue_detected, true, "Fatigue must be detected on repeated slow latency");
});

// ── Test Suite 5: Engine Data Independence ───────────────────────────────────
test("Data Independence: engine executes completely custom person & location spec", () => {
  const customPersonSpec: GameExperienceSpecification = {
    id: "spec_custom_delhi_elder",
    person_id: "person:harish_sharma",
    template_key: "prepare_for",
    template_version: "1.2.0",
    version: "1.2.0",
    generation_mode: "parametrically_personalised_level_b",
    title: "Prepare-For: Evening Walk & Tea",
    subtitle: "Lodi Gardens Routine",
    objective: "Gentle preparation for evening stroll in Delhi with son Vikram.",
    cognitive_family: "prospective_orientation",
    difficulty: 1,
    modality: "visual_tactile",
    culture: "delhi_urban",
    temporal_frame: "future",
    content_bindings: {
      event: {
        id: "evt_walk",
        title: "Evening Lodi Garden Stroll",
        scheduled_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        formatted_time: "5:30 PM",
        location: "Lodi Gardens Gate 2",
        visitor_name: "Son Vikram",
        relationship: "Son",
      },
      preparation_steps: [
        { id: "step_shoes", step_number: 1, label: "Lace comfortable walking shoes" },
        { id: "step_water", step_number: 2, label: "Fill insulated water flask" },
      ],
      preparation_items: [
        { id: "item_shoes", label: "Walking Shoes", category: "comfort", icon: "👟", is_relevant: true },
        { id: "item_flask", label: "Water Flask", category: "comfort", icon: "🍶", is_relevant: true },
      ],
    },
    scaffolding: {
      ladder: ["independent", "contextual_cue", "full_support"],
      hint_available: true,
      contextual_text_cue: "Vikram will wait by the gate at five thirty.",
      retry_policy: "gentle_encouragement",
    },
    instructions: {
      primary_prompt: "Who is walking with you this evening?",
      spoken_prompt: "Who is joining you for your evening stroll today?",
      success_celebration: "You are ready for a peaceful evening stroll.",
    },
    provenance_refs: ["prov:delhi_caregiver"],
    validation_status: {
      grounding_passed: true,
      consent_passed: true,
      safety_passed: true,
      dignity_passed: true,
      schema_passed: true,
      all_passed: true,
    },
    dignity_contract: {
      no_failure_states: true,
      no_visible_countdown: true,
      no_comparative_scoring: true,
      gentle_closure: true,
    },
  };

  const validation = validateGameExperienceSpec(customPersonSpec);
  assert.equal(validation.valid, true, "Custom data-driven specification must validate without error");

  const runtime = new GameSessionRuntime(validation.validated_spec!, 2);
  runtime.start();
  runtime.recordTrial({
    step_name: "prepare_for_walk",
    stimulus: "Evening walk preparation",
    user_selection: "Vikram",
    is_affirmative_match: true,
    latency_ms: 1200,
  });
  const outcome = runtime.complete();
  assert.equal(outcome.completed_steps, 1);
  assert.equal(outcome.person_id, "person:harish_sharma");
  assert.equal(outcome.experience_episode.person_id, "person:harish_sharma");
});
