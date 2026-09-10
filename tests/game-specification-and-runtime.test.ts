import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  GroundingValidator,
  ProvenanceValidator,
  ConsentValidator,
  SensitivityValidator,
  DignityValidator,
  SchemaValidator,
  SafetyValidator,
  SpecificationValidatorPipeline,
} from "../src/intelligence/specifications/validators/index.js";
import { DeterministicSpecGenerator } from "../src/intelligence/specifications/generators/deterministic-spec-generator.js";
import { OfflineSpecCache } from "../src/intelligence/specifications/cache/offline-spec-cache.js";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "../src/intelligence/retrieval/context-pack-builder.js";
import { GameExperienceSpecification } from "../src/intelligence/specifications/types.js";

describe("Game Specification Architecture & Deterministic Runtime Layer", () => {
  const personId = "person:purnima";
  let validGame7Spec: GameExperienceSpecification;
  let validGame8Spec: GameExperienceSpecification;

  beforeEach(() => {
    OfflineSpecCache.clearCache();
    const g7Pack = buildGame7ContextPack(personId);
    validGame7Spec = DeterministicSpecGenerator.generateGame7Specification(g7Pack, "recognition");

    const g8Pack = buildGame8ContextPack(personId);
    validGame8Spec = DeterministicSpecGenerator.generateGame8Specification(g8Pack, "destination_recognition");
  });

  describe("1. SchemaValidator", () => {
    it("should accept compliant specifications", () => {
      const result = SchemaValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should reject specification with missing spec_id or person_id", () => {
      const invalidSpec = { ...validGame7Spec, spec_id: "" };
      const result = SchemaValidator.validate(invalidSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("spec_id")));
    });

    it("should reject specifications with more than 6 steps to prevent cognitive fatigue", () => {
      const cloned = JSON.parse(JSON.stringify(validGame7Spec));
      while (cloned.sequence.length < 8) {
        cloned.sequence.push({ ...cloned.sequence[0], step_id: `step_${cloned.sequence.length}` });
      }
      const result = SchemaValidator.validate(cloned);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("maximum cognitive limit")));
    });

    it("should reject touch targets smaller than 48px", () => {
      const invalidSpec = JSON.parse(JSON.stringify(validGame7Spec));
      invalidSpec.accessibility_configuration.minimum_touch_target_px = 36;
      const result = SchemaValidator.validate(invalidSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("at least 48px")));
    });
  });

  describe("2. GroundingValidator", () => {
    it("should pass when all memories and places belong to the active person", () => {
      const result = GroundingValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should reject hallucinated or ungrounded memory IDs", () => {
      const ungroundedSpec = JSON.parse(JSON.stringify(validGame7Spec));
      ungroundedSpec.memory_place_bindings.memory_ids.push("mem:hallucinated_unreal_memory_999");
      const result = GroundingValidator.validate(ungroundedSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("Grounding failed")));
    });

    it("should reject route builder spec without grounded route_id", () => {
      const ungroundedSpec = JSON.parse(JSON.stringify(validGame8Spec));
      ungroundedSpec.memory_place_bindings.route_id = "rt:unverified_alien_route";
      const result = GroundingValidator.validate(ungroundedSpec);
      assert.strictEqual(result.passed, false);
    });
  });

  describe("3. ProvenanceValidator", () => {
    it("should pass when entities have caregiver/clinician verified provenance and high confidence", () => {
      const result = ProvenanceValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should reject entities with unverified status from runtime", () => {
      const unverifiedSpec = JSON.parse(JSON.stringify(validGame7Spec));
      unverifiedSpec.provenance_references[0].verification_status = "unverified";
      const result = ProvenanceValidator.validate(unverifiedSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("unverified status")));
    });

    it("should reject entities with confidence below 0.75 threshold", () => {
      const lowConfidenceSpec = JSON.parse(JSON.stringify(validGame7Spec));
      lowConfidenceSpec.provenance_references[0].confidence = 0.60;
      const result = ProvenanceValidator.validate(lowConfidenceSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("below required minimum")));
    });
  });

  describe("4. ConsentValidator", () => {
    it("should pass for entities with 'games' or 'reminiscence' consent scopes", () => {
      const result = ConsentValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should reject private visibility entities from game runtime", () => {
      const privateSpec = JSON.parse(JSON.stringify(validGame7Spec));
      privateSpec.provenance_references[0].visibility_scope = "private";
      const result = ConsentValidator.validate(privateSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("private visibility scope")));
    });
  });

  describe("5. SensitivityValidator", () => {
    it("should pass for low and medium sensitivity milestones", () => {
      const result = SensitivityValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should block entities with 'high' sensitivity (trauma/grief)", () => {
      const highSensSpec = JSON.parse(JSON.stringify(validGame7Spec));
      highSensSpec.provenance_references[0].sensitivity = "high";
      const result = SensitivityValidator.validate(highSensSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("prohibited from game runtime")));
    });

    it("should block distress-inducing vocabulary in prompts", () => {
      const distressSpec = JSON.parse(JSON.stringify(validGame7Spec));
      distressSpec.prompt.welcome_prompt = "Let us talk about the sudden hospitalization last winter.";
      const result = SensitivityValidator.validate(distressSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("distress-inducing keyword")));
    });
  });

  describe("6. DignityValidator", () => {
    it("should pass respectful, elder-honoring language", () => {
      const result = DignityValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should reject infantilizing phrases like 'good boy' or 'smart cookie'", () => {
      const infantilizingSpec = JSON.parse(JSON.stringify(validGame7Spec));
      infantilizingSpec.sequence[0].feedback.affirmation = "Good girl! You did it like a smart cookie!";
      const result = DignityValidator.validate(infantilizingSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("infantilizing phrase")));
    });

    it("should reject harsh deficit phrasing like 'wrong answer' or 'you failed'", () => {
      const harshSpec = JSON.parse(JSON.stringify(validGame7Spec));
      harshSpec.sequence[0].feedback.affirmation = "Wrong answer, cognitive decline detected.";
      const result = DignityValidator.validate(harshSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("harsh deficit")));
    });

    it("should reject countdown and time-pressure phrasing", () => {
      const timerSpec = JSON.parse(JSON.stringify(validGame7Spec));
      timerSpec.sequence[0].prompt.primary_prompt = "Hurry up, time is running out to tap!";
      const result = DignityValidator.validate(timerSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("time-pressure phrase")));
    });

    it("should reject competitive gamification language", () => {
      const compSpec = JSON.parse(JSON.stringify(validGame7Spec));
      compSpec.completion.celebration_message = "New High Score! You are ranked #1 on the leaderboard!";
      const result = DignityValidator.validate(compSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("competitive gamification phrase")));
    });
  });

  describe("7. SafetyValidator", () => {
    it("should enforce non-negotiable dementia-friendly safety invariants", () => {
      const result = SafetyValidator.validate(validGame7Spec);
      assert.strictEqual(result.passed, true);
    });

    it("should reject specifications that allow failure screens", () => {
      const unsafeSpec = JSON.parse(JSON.stringify(validGame7Spec));
      unsafeSpec.safety_constraints.no_failure_screen = false;
      const result = SafetyValidator.validate(unsafeSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("no_failure_screen")));
    });

    it("should reject specifications that introduce countdown timers", () => {
      const unsafeSpec = JSON.parse(JSON.stringify(validGame7Spec));
      unsafeSpec.safety_constraints.no_countdown_timers = false;
      const result = SafetyValidator.validate(unsafeSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("no_countdown_timers")));
    });

    it("should reject specifications where graceful exit is disabled", () => {
      const unsafeSpec = JSON.parse(JSON.stringify(validGame7Spec));
      unsafeSpec.safety_constraints.graceful_exit_always_available = false;
      const result = SafetyValidator.validate(unsafeSpec);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes("graceful_exit_always_available")));
    });
  });

  describe("8. Master Specification Pipeline & Runtime Gate", () => {
    it("should assert validity and return comprehensive validation summary", () => {
      const summary = SpecificationValidatorPipeline.validate(validGame7Spec);
      assert.strictEqual(summary.is_valid, true);
      assert.strictEqual(Object.keys(summary.validators).length, 7);
      assert.strictEqual(summary.rejection_reasons.length, 0);
    });

    it("should throw a blocking error when an invalid specification attempts to reach runtime", () => {
      const invalidSpec = JSON.parse(JSON.stringify(validGame7Spec));
      invalidSpec.safety_constraints.no_failure_screen = false;

      assert.throws(() => {
        SpecificationValidatorPipeline.assertValidForRuntime(invalidSpec);
      }, /GameRuntimeSecurityGate/);
    });
  });

  describe("9. Scaffolding Progression in Deterministic Generators", () => {
    it("should generate Game 7 across all 5 reminiscence scaffolding levels", () => {
      const g7Pack = buildGame7ContextPack(personId);
      const levels = [
        "recognition",
        "cued_recognition",
        "reduced_cue",
        "multimodal_cue",
        "recall_reminiscence",
      ] as const;

      for (const lvl of levels) {
        const spec = DeterministicSpecGenerator.generateGame7Specification(g7Pack, lvl);
        assert.strictEqual(spec.scaffolding.current_level, lvl);
        assert.ok(spec.sequence.length > 0);
        // All levels must pass all 7 validators
        const validation = SpecificationValidatorPipeline.validate(spec);
        assert.strictEqual(validation.is_valid, true);
      }
    });

    it("should generate Game 8 across all 5 route builder scaffolding levels", () => {
      const g8Pack = buildGame8ContextPack(personId);
      const levels = [
        "destination_recognition",
        "obvious_route",
        "landmark_sequencing",
        "reduced_visual_cues",
        "independent_route_recall",
      ] as const;

      for (const lvl of levels) {
        const spec = DeterministicSpecGenerator.generateGame8Specification(g8Pack, lvl);
        assert.strictEqual(spec.scaffolding.current_level, lvl);
        assert.ok(spec.sequence.length > 0);
        const validation = SpecificationValidatorPipeline.validate(spec);
        assert.strictEqual(validation.is_valid, true);
      }
    });
  });

  describe("10. Offline Specification Cache", () => {
    it("should cache validated specifications with checksums", () => {
      const result = OfflineSpecCache.saveValidatedSpecification(validGame7Spec);
      assert.strictEqual(result.success, true);
      assert.ok(result.checksum);

      const retrieved = OfflineSpecCache.getCachedSpecification(validGame7Spec.spec_id);
      assert.notStrictEqual(retrieved, null);
      assert.strictEqual(retrieved?.spec_id, validGame7Spec.spec_id);
    });

    it("should refuse to cache specifications that have not been validated or failed validation", () => {
      const unvalidatedSpec = { ...validGame7Spec, validation_result: undefined };
      const result = OfflineSpecCache.saveValidatedSpecification(unvalidatedSpec as any);
      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes("failed validation"));
    });

    it("should retrieve latest cached specification for offline play", () => {
      OfflineSpecCache.saveValidatedSpecification(validGame7Spec);
      OfflineSpecCache.saveValidatedSpecification(validGame8Spec);

      const latestG7 = OfflineSpecCache.getLatestCachedSpecification(
        personId,
        "reminiscence_journey_my_world"
      );
      assert.strictEqual(latestG7?.spec_id, validGame7Spec.spec_id);

      const latestG8 = OfflineSpecCache.getLatestCachedSpecification(
        personId,
        "route_builder_familiar_places"
      );
      assert.strictEqual(latestG8?.spec_id, validGame8Spec.spec_id);
    });
  });
});
