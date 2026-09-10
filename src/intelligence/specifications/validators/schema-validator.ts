import { GameExperienceSpecification, ValidationDetail } from "../types";

export class SchemaValidator {
  public static readonly NAME = "SchemaValidator";

  public static validate(spec: any): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!spec || typeof spec !== "object") {
      return {
        validator_name: this.NAME,
        passed: false,
        errors: ["Schema failed: Specification is null or not an object."],
        warnings,
      };
    }

    // 1. Root fields
    if (typeof spec.spec_id !== "string" || !spec.spec_id.trim()) {
      errors.push("Schema failed: 'spec_id' must be a non-empty string.");
    }
    if (typeof spec.person_id !== "string" || !spec.person_id.trim()) {
      errors.push("Schema failed: 'person_id' must be a non-empty string.");
    }
    if (
      spec.game_template !== "reminiscence_journey_my_world" &&
      spec.game_template !== "route_builder_familiar_places"
    ) {
      errors.push(
        `Schema failed: 'game_template' must be either 'reminiscence_journey_my_world' or 'route_builder_familiar_places'. Received '${spec.game_template}'.`
      );
    }
    if (![1, 2, 3].includes(spec.difficulty)) {
      errors.push(
        `Schema failed: 'difficulty' must be 1, 2, or 3. Received '${spec.difficulty}'.`
      );
    }
    if (
      ![
        "photo_plus_voice",
        "visual_tactile",
        "multimodal",
        "audio_guided",
      ].includes(spec.modality)
    ) {
      errors.push(
        `Schema failed: 'modality' has invalid value '${spec.modality}'.`
      );
    }

    // 2. Sequence check
    if (!Array.isArray(spec.sequence) || spec.sequence.length === 0) {
      errors.push("Schema failed: 'sequence' must be a non-empty array of steps.");
    } else {
      if (spec.sequence.length > 6) {
        errors.push(
          `Schema failed: 'sequence' length (${spec.sequence.length}) exceeds maximum cognitive limit of 6 steps per session.`
        );
      }

      spec.sequence.forEach((step: any, idx: number) => {
        if (!step.step_id || typeof step.step_id !== "string") {
          errors.push(`Schema failed: Step[${idx}] is missing a valid 'step_id'.`);
        }
        if (!step.title || typeof step.title !== "string") {
          errors.push(`Schema failed: Step[${idx}] is missing a valid 'title'.`);
        }
        if (!step.prompt || !step.prompt.primary_prompt) {
          errors.push(
            `Schema failed: Step[${idx}] is missing 'prompt.primary_prompt'.`
          );
        }
        if (!step.feedback || !step.feedback.affirmation) {
          errors.push(
            `Schema failed: Step[${idx}] is missing 'feedback.affirmation'.`
          );
        }
        if (!step.hints || !step.hints.level_1_gentle_reminder) {
          errors.push(
            `Schema failed: Step[${idx}] is missing 'hints.level_1_gentle_reminder'.`
          );
        }

        // Choice count check
        if (step.allowed_responses?.options) {
          const optCount = step.allowed_responses.options.length;
          if (optCount > 4) {
            errors.push(
              `Schema failed: Step[${idx}] has ${optCount} options. Maximum allowed for cognitive safety is 4.`
            );
          }
        }
      });
    }

    // 3. Safety Constraints
    if (!spec.safety_constraints || typeof spec.safety_constraints !== "object") {
      errors.push("Schema failed: 'safety_constraints' object is missing.");
    }

    // 4. Accessibility Config
    if (
      !spec.accessibility_configuration ||
      typeof spec.accessibility_configuration !== "object"
    ) {
      errors.push("Schema failed: 'accessibility_configuration' object is missing.");
    } else {
      if (spec.accessibility_configuration.minimum_touch_target_px < 48) {
        errors.push(
          `Schema failed: 'minimum_touch_target_px' must be at least 48px. Received ${spec.accessibility_configuration.minimum_touch_target_px}px.`
        );
      }
    }

    // 5. Completion Config
    if (!spec.completion || typeof spec.completion !== "object") {
      errors.push("Schema failed: 'completion' configuration is missing.");
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        steps_count: Array.isArray(spec.sequence) ? spec.sequence.length : 0,
      },
    };
  }
}
