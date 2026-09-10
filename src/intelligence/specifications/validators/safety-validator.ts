import { GameExperienceSpecification, ValidationDetail } from "../types";

export class SafetyValidator {
  public static readonly NAME = "SafetyValidator";

  public static validate(spec: GameExperienceSpecification): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sc = spec.safety_constraints;
    if (!sc) {
      errors.push("Safety failed: safety_constraints block is missing.");
      return { validator_name: this.NAME, passed: false, errors, warnings };
    }

    // 1. Mandatory safety flags
    if (sc.no_failure_screen !== true) {
      errors.push(
        "Safety failed: 'no_failure_screen' must be true. Dementia care principles strictly ban failure screens."
      );
    }

    if (sc.no_harsh_wrong_language !== true) {
      errors.push(
        "Safety failed: 'no_harsh_wrong_language' must be true. Negative evaluative feedback causes distress."
      );
    }

    if (sc.no_competitive_scoring !== true) {
      errors.push(
        "Safety failed: 'no_competitive_scoring' must be true. Competitive scoring triggers anxiety."
      );
    }

    if (sc.no_countdown_timers !== true) {
      errors.push(
        "Safety failed: 'no_countdown_timers' must be true. Countdown timers cause cognitive freezing and agitation."
      );
    }

    if (sc.graceful_exit_always_available !== true) {
      errors.push(
        "Safety failed: 'graceful_exit_always_available' must be true. Elders must be able to exit peacefully at any step."
      );
    }

    if (sc.skip_allowed_without_penalty !== true) {
      errors.push(
        "Safety failed: 'skip_allowed_without_penalty' must be true. Skipping any step must never penalize the participant."
      );
    }

    if (sc.pause_allowed !== true) {
      errors.push(
        "Safety failed: 'pause_allowed' must be true. Pausing for tea or rest must always be accommodated."
      );
    }

    // 2. Cognitive fatigue limits
    if (sc.max_trials_per_session > 6) {
      errors.push(
        `Safety failed: max_trials_per_session (${sc.max_trials_per_session}) exceeds safe cognitive limit of 6.`
      );
    }

    // 3. Graceful completion exit check
    if (!spec.completion?.graceful_exit_text) {
      errors.push(
        "Safety failed: 'completion.graceful_exit_text' is missing. A warm, reassuring exit statement is required."
      );
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        safety_checks_verified: 8,
      },
    };
  }
}
