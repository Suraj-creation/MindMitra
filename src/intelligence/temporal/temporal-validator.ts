import {
  TemporalOrientationContextPack,
  TemporalOrientationSpec,
} from "../../domain/cognitive-experience";

export interface TemporalValidationResult {
  all_passed: boolean;
  schema_passed: boolean;
  data_authorization_passed: boolean;
  consent_passed: boolean;
  provenance_passed: boolean;
  verification_passed: boolean;
  temporal_validity_passed: boolean;
  freshness_passed: boolean;
  sensitivity_passed: boolean;
  safety_passed: boolean;
  dignity_passed: boolean;
  personalization_passed: boolean;
  validation_errors: string[];
}

export class TemporalValidator {
  /**
   * 12-layer validation of Temporal Orientation Specifications.
   */
  public static validate(
    spec: TemporalOrientationSpec,
    contextPack?: TemporalOrientationContextPack
  ): TemporalValidationResult {
    const errors: string[] = [];

    // 1. Schema Validation
    let schema_passed = true;
    if (!spec.id || !spec.person_id || !spec.template_key || !spec.tasks || spec.tasks.length === 0) {
      schema_passed = false;
      errors.push("Schema failure: Missing required top-level spec fields or empty tasks.");
    }

    // 2. Data Authorization (Cross-person bounds)
    let data_authorization_passed = true;
    if (contextPack && contextPack.person.id !== spec.person_id) {
      data_authorization_passed = false;
      errors.push(`Data Authorization failure: Cross-person leak detected. Spec person: ${spec.person_id}, Context person: ${contextPack.person.id}`);
    }

    // 3. Consent Validation
    let consent_passed = true;
    if (contextPack && !contextPack.constraints.consent_active) {
      consent_passed = false;
      errors.push("Consent failure: Active consent is false in context pack.");
    }

    // 4. Provenance Validation
    let provenance_passed = true;
    if (!spec.provenance_refs || spec.provenance_refs.length === 0) {
      provenance_passed = false;
      errors.push("Provenance failure: No provenance references found in spec.");
    }

    // 5. Verification Validation
    let verification_passed = true;
    if (!spec.anchors.recent.provenance || !spec.anchors.upcoming.provenance) {
      verification_passed = false;
      errors.push("Verification failure: Anchors missing source provenance.");
    }

    // 6. Temporal Validity Validation (CRITICAL)
    let temporal_validity_passed = true;
    // Check if upcoming anchor contains cancelled keyword or cancelled event id
    const upcomingTitle = spec.anchors.upcoming.title.toLowerCase();
    if (upcomingTitle.includes("cancelled") || upcomingTitle.includes("postponed")) {
      temporal_validity_passed = false;
      errors.push("Temporal validity failure: Cancelled event leaked into upcoming anchor!");
    }
    if (spec.anchors.upcoming.event_id?.includes("cancelled")) {
      temporal_validity_passed = false;
      errors.push("Temporal validity failure: Cancelled event ID found in upcoming anchor!");
    }

    // 7. Freshness Validation
    let freshness_passed = true;
    if (contextPack && contextPack.generated_at) {
      const generatedAt = new Date(contextPack.generated_at).getTime();
      const ageHours = (Date.now() - generatedAt) / (1000 * 60 * 60);
      if (ageHours > 48) {
        freshness_passed = false;
        errors.push(`Freshness failure: Context pack generated ${ageHours.toFixed(1)} hours ago.`);
      }
    }

    // 8. Sensitivity Validation
    let sensitivity_passed = true;
    const forbiddenWords = ["funeral", "death", "hospital emergency", "debt", "accident"];
    const allText = JSON.stringify(spec).toLowerCase();
    for (const word of forbiddenWords) {
      if (allText.includes(word)) {
        sensitivity_passed = false;
        errors.push(`Sensitivity failure: Forbidden distressing term '${word}' detected in specification.`);
        break;
      }
    }

    // 9. Safety Validation
    let safety_passed = true;
    // Ensure no sudden rapid countdowns or alarms
    if (allText.includes("seconds left") || allText.includes("time expired") || allText.includes("hurry")) {
      safety_passed = false;
      errors.push("Safety failure: High anxiety time pressure detected in spec.");
    }

    // 10. Dignity Validation
    let dignity_passed = true;
    const condescendingWords = ["wrong", "failed", "loser", "score 0", "retry quiz", "stupid"];
    for (const word of condescendingWords) {
      if (allText.includes(word)) {
        dignity_passed = false;
        errors.push(`Dignity failure: Condescending or competitive term '${word}' detected in specification.`);
        break;
      }
    }

    // 11. Personalization Validation
    let personalization_passed = true;
    if (spec.person_id === "person:purnima") {
      if (!spec.assamese_title) {
        personalization_passed = false;
        errors.push("Personalization failure: Missing Assamese title for Purnima.");
      }
    }

    const all_passed =
      schema_passed &&
      data_authorization_passed &&
      consent_passed &&
      provenance_passed &&
      verification_passed &&
      temporal_validity_passed &&
      freshness_passed &&
      sensitivity_passed &&
      safety_passed &&
      dignity_passed &&
      personalization_passed;

    return {
      all_passed,
      schema_passed,
      data_authorization_passed,
      consent_passed,
      provenance_passed,
      verification_passed,
      temporal_validity_passed,
      freshness_passed,
      sensitivity_passed,
      safety_passed,
      dignity_passed,
      personalization_passed,
      validation_errors: errors,
    };
  }
}
