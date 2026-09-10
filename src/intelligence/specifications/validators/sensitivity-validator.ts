import { GameExperienceSpecification, ValidationDetail } from "../types";

export class SensitivityValidator {
  public static readonly NAME = "SensitivityValidator";

  public static validate(
    spec: GameExperienceSpecification,
    options?: { allowHighSensitivityWithOverride?: boolean }
  ): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    const refs = spec.provenance_references;

    // Check sensitivity level on references
    for (const ref of refs) {
      if (ref.sensitivity === "high") {
        if (options?.allowHighSensitivityWithOverride) {
          warnings.push(
            `Sensitivity warning: Entity '${ref.entity_id}' has high sensitivity but was allowed via clinical override.`
          );
        } else {
          errors.push(
            `Sensitivity failed: Entity '${ref.entity_id}' is flagged as 'high' sensitivity. High sensitivity items (trauma, conflict, distress) are prohibited from game runtime.`
          );
        }
      } else if (ref.sensitivity === "medium") {
        warnings.push(
          `Sensitivity notice: Entity '${ref.entity_id}' has medium sensitivity. Verify emotional suitability with caregiver.`
        );
      }
    }

    // Inspect prompts and descriptions for sensitive distress keywords
    const distressKeywords = [
      "funeral",
      "hospitalization",
      "accident",
      "bankruptcy",
      "divorce",
      "lawsuit",
      "tragedy",
      "conflict",
      "debt",
    ];

    const stringifySpec = JSON.stringify({
      objective: spec.objective,
      prompt: spec.prompt,
      sequence: spec.sequence.map((s) => ({
        title: s.title,
        prompt: s.prompt,
        stimulus: s.stimulus,
      })),
    }).toLowerCase();

    for (const kw of distressKeywords) {
      if (stringifySpec.includes(kw)) {
        errors.push(
          `Sensitivity failed: Specification text contains distress-inducing keyword '${kw}'.`
        );
      }
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        checked_references: refs.length,
        distress_keywords_checked: distressKeywords.length,
      },
    };
  }
}
