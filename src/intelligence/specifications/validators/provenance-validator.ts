import { GameExperienceSpecification, ValidationDetail } from "../types";

export class ProvenanceValidator {
  public static readonly NAME = "ProvenanceValidator";
  public static readonly MIN_CONFIDENCE_THRESHOLD = 0.75;

  public static validate(
    spec: GameExperienceSpecification,
    options?: { allowUnverifiedWithFlag?: boolean }
  ): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    const refs = spec.provenance_references;
    if (!refs || refs.length === 0) {
      errors.push("Provenance failed: Specification contains zero provenance references.");
      return { validator_name: this.NAME, passed: false, errors, warnings };
    }

    const validSources = new Set(["caregiver", "chw", "clinician", "person"]);
    const verifiedStatuses = new Set([
      "caregiver_verified",
      "chw_verified",
      "clinician_verified",
    ]);

    for (const ref of refs) {
      // 1. Source validity
      if (!validSources.has(ref.source)) {
        errors.push(
          `Provenance failed: Entity '${ref.entity_id}' has invalid source '${ref.source}'.`
        );
      }

      // 2. Verification status
      if (!verifiedStatuses.has(ref.verification_status)) {
        if (options?.allowUnverifiedWithFlag) {
          warnings.push(
            `Provenance warning: Entity '${ref.entity_id}' is unverified, allowed only under audit flag.`
          );
        } else {
          errors.push(
            `Provenance failed: Entity '${ref.entity_id}' has unverified status '${ref.verification_status}'. Verified status is required for game runtime.`
          );
        }
      }

      // 3. Confidence threshold
      if (typeof ref.confidence !== "number" || ref.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
        errors.push(
          `Provenance failed: Entity '${ref.entity_id}' confidence (${ref.confidence}) is below required minimum ${this.MIN_CONFIDENCE_THRESHOLD}.`
        );
      }

      // 4. Verification signatory
      if (!ref.verified_by || ref.verified_by.trim() === "") {
        errors.push(
          `Provenance failed: Entity '${ref.entity_id}' is missing a verified_by signatory.`
        );
      }
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        checked_references_count: refs.length,
        min_confidence_checked: this.MIN_CONFIDENCE_THRESHOLD,
      },
    };
  }
}
