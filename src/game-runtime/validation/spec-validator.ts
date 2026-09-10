import {
  GameExperienceSpecification,
  SpecValidationResult,
  GameTemplate,
} from "../types";
import { GameTemplateRegistry, defaultTemplateRegistry } from "../templates/registry";

export function validateGameExperienceSpec(
  spec: any,
  registry: GameTemplateRegistry = defaultTemplateRegistry
): SpecValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic Structure Validation
  if (!spec || typeof spec !== "object") {
    return {
      valid: false,
      errors: ["MALFORMED_SPEC: Specification must be a non-null JSON object."],
      warnings: [],
    };
  }

  // 2. Mandatory Identification & Metadata
  if (!spec.id || typeof spec.id !== "string") {
    errors.push("MISSING_FIELD: Specification must include a non-empty string 'id'.");
  }
  if (!spec.person_id || typeof spec.person_id !== "string") {
    errors.push("MISSING_FIELD: Specification must include a non-empty string 'person_id'.");
  }
  if (!spec.title || typeof spec.title !== "string") {
    errors.push("MISSING_FIELD: Specification must include a non-empty string 'title'.");
  }
  if (!spec.objective || typeof spec.objective !== "string") {
    errors.push("MISSING_FIELD: Specification must include a non-empty string 'objective'.");
  }

  // 3. Template Registration Check
  const templateKey = spec.template_key;
  if (!templateKey || typeof templateKey !== "string") {
    errors.push("MISSING_TEMPLATE_KEY: Specification must specify a valid 'template_key'.");
    return { valid: false, errors, warnings };
  }

  const template = registry.get(templateKey);
  if (!template) {
    errors.push(
      `UNKNOWN_TEMPLATE: Template '${templateKey}' is not registered in the runtime registry.`
    );
    return { valid: false, errors, warnings };
  }

  // 4. Modality Check
  const allowedModalities = template.allowed_modalities;
  if (!spec.modality || !allowedModalities.includes(spec.modality)) {
    errors.push(
      `DISALLOWED_MODALITY: Modality '${spec.modality}' is not permitted for template '${templateKey}'. Allowed: [${allowedModalities.join(", ")}].`
    );
  }

  // 5. Difficulty Level Check
  const [minDiff, maxDiff] = template.difficulty_range;
  if (
    typeof spec.difficulty !== "number" ||
    spec.difficulty < minDiff ||
    spec.difficulty > maxDiff
  ) {
    errors.push(
      `INVALID_DIFFICULTY: Difficulty level '${spec.difficulty}' is outside the template's allowed range [${minDiff}, ${maxDiff}].`
    );
  }

  // 6. Content Bindings Check
  if (!spec.content_bindings || typeof spec.content_bindings !== "object") {
    errors.push("MISSING_CONTENT_BINDINGS: Specification must contain a 'content_bindings' object.");
  } else {
    // Check against template content_slots
    for (const slot of template.content_slots) {
      const boundValue = spec.content_bindings[slot.slot_key];

      if (slot.required && (boundValue === undefined || boundValue === null)) {
        errors.push(
          `MISSING_REQUIRED_SLOT: Content slot '${slot.slot_key}' (${slot.label}) is required by template '${templateKey}' but is missing.`
        );
        continue;
      }

      if (boundValue !== undefined && boundValue !== null) {
        if (slot.cardinality === "multiple") {
          if (!Array.isArray(boundValue)) {
            errors.push(
              `SLOT_TYPE_MISMATCH: Content slot '${slot.slot_key}' must be an array of items.`
            );
          } else {
            if (slot.min_count && boundValue.length < slot.min_count) {
              errors.push(
                `INSUFFICIENT_SLOT_ITEMS: Slot '${slot.slot_key}' requires at least ${slot.min_count} items, but got ${boundValue.length}.`
              );
            }
            if (slot.max_count && boundValue.length > slot.max_count) {
              warnings.push(
                `SLOT_ITEM_OVERFLOW: Slot '${slot.slot_key}' recommends at most ${slot.max_count} items, but got ${boundValue.length}.`
              );
            }
          }
        } else if (slot.cardinality === "single") {
          if (typeof boundValue !== "object" || Array.isArray(boundValue)) {
            errors.push(
              `SLOT_TYPE_MISMATCH: Content slot '${slot.slot_key}' must be a single structured object.`
            );
          }
        }
      }
    }

    // Engine-Specific Deterministic Invariant Checks
    if (templateKey === "my_life_timeline") {
      const milestones = spec.content_bindings.milestones;
      if (Array.isArray(milestones)) {
        milestones.forEach((m: any, idx: number) => {
          if (!m.id || !m.title) {
            errors.push(
              `MALFORMED_MILESTONE: Milestone at index ${idx} is missing mandatory 'id' or 'title'.`
            );
          }
          if (!m.photo_url) {
            warnings.push(
              `MISSING_MEDIA: Milestone '${m.title || idx}' does not specify a 'photo_url'.`
            );
          }
        });
      }
    } else if (templateKey === "prepare_for") {
      const event = spec.content_bindings.event;
      if (event && (!event.title || !event.scheduled_at)) {
        errors.push(
          "MALFORMED_EVENT: 'event' slot in prepare_for requires 'title' and 'scheduled_at'."
        );
      }

      const steps = spec.content_bindings.preparation_steps;
      if (Array.isArray(steps)) {
        steps.forEach((s: any, idx: number) => {
          if (!s.id || !s.label) {
            errors.push(
              `MALFORMED_PREPARATION_STEP: Step at index ${idx} is missing mandatory 'id' or 'label'.`
            );
          }
        });
      }
    }
  }

  // 7. Instructions & Dignity Constraints Check
  if (!spec.instructions || typeof spec.instructions !== "object") {
    errors.push("MISSING_INSTRUCTIONS: Specification must provide an 'instructions' block.");
  } else {
    if (!spec.instructions.primary_prompt) {
      errors.push("MISSING_PRIMARY_PROMPT: Instructions must include 'primary_prompt'.");
    }
    if (!spec.instructions.success_celebration) {
      errors.push(
        "DIGNITY_VIOLATION: Every activity must include a positive 'success_celebration' message."
      );
    }
  }

  // 8. Prohibited Clinical / Failure Terms Check (Dignity & Anti-Slop Safeguards)
  const fullTextToScreen = JSON.stringify({
    title: spec.title,
    subtitle: spec.subtitle,
    objective: spec.objective,
    instructions: spec.instructions,
    content_bindings: spec.content_bindings,
  });

  const prohibitedTerms = template.safety_constraints.prohibited_terms || [];
  for (const term of prohibitedTerms) {
    const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, "i");
    if (wordBoundaryRegex.test(fullTextToScreen)) {
      errors.push(
        `SAFETY_VIOLATION: Text contains prohibited stressful/diagnostic term '${term}'.`
      );
    }
  }

  // Dignity Invariants: Never expose "wrong", "failure", "ranking" or competitive clocks
  const dignityForbidden = ["wrong answer", "you failed", "game over", "strike 1", "countdown timer", "rank #"];
  for (const phrase of dignityForbidden) {
    if (fullTextToScreen.includes(phrase)) {
      errors.push(
        `DIGNITY_VIOLATION: Specification contains forbidden failure/ranking phrase '${phrase}'.`
      );
    }
  }

  // 9. Scaffolding Ladder Conformity
  if (spec.scaffolding) {
    if (spec.scaffolding.ladder && !Array.isArray(spec.scaffolding.ladder)) {
      errors.push("MALFORMED_SCAFFOLDING: 'scaffolding.ladder' must be an array of levels.");
    }
  }

  const valid = errors.length === 0;

  // Construct validated spec with fallback defaults for missing optional dignity contracts
  const validatedSpec: GameExperienceSpecification | undefined = valid
    ? {
        ...spec,
        template_key: templateKey,
        template_version: spec.version || template.version,
        dignity_contract: {
          no_failure_states: true,
          no_visible_countdown: true,
          no_comparative_scoring: true,
          gentle_closure: true,
          ...(spec.dignity_contract || {}),
        },
      }
    : undefined;

  return {
    valid,
    errors,
    warnings,
    template_matched: template.id,
    validated_spec: validatedSpec,
  };
}
