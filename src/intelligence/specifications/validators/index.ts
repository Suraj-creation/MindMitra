import {
  GameExperienceSpecification,
  ValidationSummary,
  ValidationDetail,
} from "../types";
import { GroundingValidator } from "./grounding-validator";
import { ProvenanceValidator } from "./provenance-validator";
import { ConsentValidator } from "./consent-validator";
import { SensitivityValidator } from "./sensitivity-validator";
import { DignityValidator } from "./dignity-validator";
import { SchemaValidator } from "./schema-validator";
import { SafetyValidator } from "./safety-validator";

export {
  GroundingValidator,
  ProvenanceValidator,
  ConsentValidator,
  SensitivityValidator,
  DignityValidator,
  SchemaValidator,
  SafetyValidator,
};

export class SpecificationValidatorPipeline {
  /**
   * Runs all 7 validators in sequence.
   * Invariant: Invalid specifications must never reach the runtime.
   */
  public static validate(
    spec: GameExperienceSpecification,
    options?: {
      groundingContext?: {
        memories?: Array<{ id: string; person_id: string }>;
        places?: Array<{ id: string; person_id: string }>;
        routes?: Array<{ id: string; person_id: string }>;
        people?: Array<{ id: string }>;
      };
      allowUnverifiedWithFlag?: boolean;
      allowHighSensitivityWithOverride?: boolean;
    }
  ): ValidationSummary {
    const validatorsMap: Record<string, ValidationDetail> = {};
    const rejectionReasons: string[] = [];

    // 1. SchemaValidator
    const schemaResult = SchemaValidator.validate(spec);
    validatorsMap[SchemaValidator.NAME] = schemaResult;
    if (!schemaResult.passed) {
      rejectionReasons.push(...schemaResult.errors);
    }

    // 2. GroundingValidator
    const groundingResult = GroundingValidator.validate(
      spec,
      options?.groundingContext
    );
    validatorsMap[GroundingValidator.NAME] = groundingResult;
    if (!groundingResult.passed) {
      rejectionReasons.push(...groundingResult.errors);
    }

    // 3. ProvenanceValidator
    const provenanceResult = ProvenanceValidator.validate(spec, {
      allowUnverifiedWithFlag: options?.allowUnverifiedWithFlag,
    });
    validatorsMap[ProvenanceValidator.NAME] = provenanceResult;
    if (!provenanceResult.passed) {
      rejectionReasons.push(...provenanceResult.errors);
    }

    // 4. ConsentValidator
    const consentResult = ConsentValidator.validate(spec);
    validatorsMap[ConsentValidator.NAME] = consentResult;
    if (!consentResult.passed) {
      rejectionReasons.push(...consentResult.errors);
    }

    // 5. SensitivityValidator
    const sensitivityResult = SensitivityValidator.validate(spec, {
      allowHighSensitivityWithOverride: options?.allowHighSensitivityWithOverride,
    });
    validatorsMap[SensitivityValidator.NAME] = sensitivityResult;
    if (!sensitivityResult.passed) {
      rejectionReasons.push(...sensitivityResult.errors);
    }

    // 6. DignityValidator
    const dignityResult = DignityValidator.validate(spec);
    validatorsMap[DignityValidator.NAME] = dignityResult;
    if (!dignityResult.passed) {
      rejectionReasons.push(...dignityResult.errors);
    }

    // 7. SafetyValidator
    const safetyResult = SafetyValidator.validate(spec);
    validatorsMap[SafetyValidator.NAME] = safetyResult;
    if (!safetyResult.passed) {
      rejectionReasons.push(...safetyResult.errors);
    }

    const isValid = rejectionReasons.length === 0;

    const summary: ValidationSummary = {
      is_valid: isValid,
      validated_at: new Date().toISOString(),
      validators: validatorsMap,
      rejection_reasons: rejectionReasons,
    };

    // Attach summary to spec
    spec.validation_result = summary;

    return summary;
  }

  /**
   * Enforces runtime gate. Throws if invalid.
   */
  public static assertValidForRuntime(
    spec: GameExperienceSpecification,
    options?: Parameters<typeof SpecificationValidatorPipeline.validate>[1]
  ): void {
    const summary = this.validate(spec, options);
    if (!summary.is_valid) {
      throw new Error(
        `[GameRuntimeSecurityGate] Invalid specification rejected from runtime: ${summary.rejection_reasons.join(
          " | "
        )}`
      );
    }
  }
}
