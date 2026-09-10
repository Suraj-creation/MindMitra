import { GameExperienceSpecification, ValidationDetail } from "../types";

export class ConsentValidator {
  public static readonly NAME = "ConsentValidator";

  public static validate(spec: GameExperienceSpecification): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    const refs = spec.provenance_references;
    if (!refs || refs.length === 0) {
      errors.push("Consent failed: No provenance records available to verify consent.");
      return { validator_name: this.NAME, passed: false, errors, warnings };
    }

    const permittedGameScopes = new Set(["games", "reminiscence", "all"]);

    for (const ref of refs) {
      // 1. Consent scope check
      if (!permittedGameScopes.has(ref.consent_scope)) {
        errors.push(
          `Consent failed: Entity '${ref.entity_id}' has consent_scope '${ref.consent_scope}'. Only 'games', 'reminiscence', or 'all' are permitted in games.`
        );
      }

      // 2. Private visibility isolation
      if (ref.visibility_scope === "private") {
        errors.push(
          `Consent failed: Entity '${ref.entity_id}' has private visibility scope. Private items are strictly barred from game runtime.`
        );
      }
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        checked_consent_count: refs.length,
      },
    };
  }
}
