import {
  ScaffoldLevel,
  TemporalOrientationContextPack,
  TemporalOrientationSpec,
  TemporalOrientationTemplateKey,
} from "../../domain/cognitive-experience";
import { buildTemporalOrientationContextPack } from "./temporal-context-pack-builder";
import {
  buildDailyOrientationSpec,
  buildTemporalSortingSpec,
  buildTemporalStorySpec,
} from "./temporal-engine-recipes";
import { TemporalValidator } from "./temporal-validator";

export interface TemporalOrchestrationState {
  person_id: string;
  template_intent: TemporalOrientationTemplateKey | "auto";
  context_pack?: TemporalOrientationContextPack;
  selected_template?: TemporalOrientationTemplateKey;
  scaffolding_start_level?: ScaffoldLevel;
  generated_spec?: TemporalOrientationSpec;
  snapshot_id?: string;
  validation_errors?: string[];
  execution_steps: Array<{
    node: string;
    timestamp: string;
    duration_ms: number;
    status: "ok" | "warn" | "fail";
    details: string;
  }>;
}

export class BoundedTemporalOrchestrator {
  private static cachedSpecs: Map<string, TemporalOrientationSpec> = new Map();

  /**
   * Node 1: Intent Normalization
   */
  public static nodeIntent(
    personId: string,
    intent: TemporalOrientationTemplateKey | "auto" = "auto"
  ): TemporalOrchestrationState {
    const start = Date.now();
    let templateKey: TemporalOrientationTemplateKey = "daily_orientation";

    if (intent === "temporal_sorting" || intent === "temporal_story") {
      templateKey = intent;
    } else {
      templateKey = "daily_orientation";
    }

    return {
      person_id: personId,
      template_intent: intent,
      selected_template: templateKey,
      execution_steps: [
        {
          node: "intent_normalization",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Resolved template intent '${intent}' to '${templateKey}' for person ${personId}`,
        },
      ],
    };
  }

  /**
   * Node 2: Temporal Context Retrieval with Memory Firewall
   */
  public static nodeContextRetrieval(
    state: TemporalOrchestrationState,
    referenceDate?: Date
  ): TemporalOrchestrationState {
    const start = Date.now();
    const contextPack = buildTemporalOrientationContextPack(state.person_id, {
      referenceDate,
      customScaffoldingLevel: state.scaffolding_start_level,
    });

    return {
      ...state,
      context_pack: contextPack,
      snapshot_id: contextPack.snapshot_id,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "temporal_context_retrieval",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Retrieved temporal context pack with snapshot ${contextPack.snapshot_id}. Excluded ${contextPack.constraints.cancelled_events_excluded} cancelled and ${contextPack.constraints.stale_events_excluded} stale events.`,
        },
      ],
    };
  }

  /**
   * Node 3: Temporal Capability & Scaffolding Selection
   */
  public static nodeDifficultySelection(
    state: TemporalOrchestrationState
  ): TemporalOrchestrationState {
    const start = Date.now();
    const contextPack = state.context_pack!;
    const capability = contextPack.capability;

    // Start scaffolding at S0 if recognition is good (>0.75), else S1 or S2
    let scaffoldLevel: ScaffoldLevel = "S0";
    if (capability.recent_recognition < 0.6) {
      scaffoldLevel = "S2";
    } else if (capability.recent_recognition < 0.75) {
      scaffoldLevel = "S1";
    }

    return {
      ...state,
      scaffolding_start_level: scaffoldLevel,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "capability_difficulty",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Selected initial scaffolding level '${scaffoldLevel}' based on recognition capability ${capability.recent_recognition}`,
        },
      ],
    };
  }

  /**
   * Node 4: Recipe & Specification Generation
   */
  public static nodeRecipeGeneration(
    state: TemporalOrchestrationState
  ): TemporalOrchestrationState {
    const start = Date.now();
    const contextPack = state.context_pack!;
    const templateKey = state.selected_template || "daily_orientation";

    let spec: TemporalOrientationSpec;
    if (templateKey === "temporal_sorting") {
      spec = buildTemporalSortingSpec(contextPack);
    } else if (templateKey === "temporal_story") {
      spec = buildTemporalStorySpec(contextPack);
    } else {
      spec = buildDailyOrientationSpec(contextPack);
    }

    return {
      ...state,
      generated_spec: spec,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "recipe_generation",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Constructed '${templateKey}' specification with ${spec.tasks.length} interactive tasks.`,
        },
      ],
    };
  }

  /**
   * Node 5: 12-Layer Validation & Safe Caching
   */
  public static nodeValidationAndCaching(
    state: TemporalOrchestrationState
  ): TemporalOrchestrationState {
    const start = Date.now();
    const spec = state.generated_spec!;
    const validation = TemporalValidator.validate(spec, state.context_pack);

    spec.validation_status = {
      ...validation,
      validation_timestamp: new Date().toISOString(),
    };

    if (validation.all_passed) {
      // Cache valid spec
      BoundedTemporalOrchestrator.cachedSpecs.set(spec.snapshot_id, spec);
      BoundedTemporalOrchestrator.cachedSpecs.set(`latest:${spec.person_id}:${spec.template_key}`, spec);
    }

    return {
      ...state,
      generated_spec: spec,
      validation_errors: validation.validation_errors,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "validation_and_caching",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: validation.all_passed ? "ok" : "fail",
          details: validation.all_passed
            ? `All 12 validation layers passed cleanly. Spec cached under snapshot ${spec.snapshot_id}.`
            : `Validation errors: ${validation.validation_errors.join("; ")}`,
        },
      ],
    };
  }

  /**
   * Full bounded pipeline run
   */
  public static orchestrateTemporalExperience(
    personId: string,
    intent: TemporalOrientationTemplateKey | "auto" = "daily_orientation",
    referenceDate?: Date
  ): TemporalOrchestrationState {
    let state = BoundedTemporalOrchestrator.nodeIntent(personId, intent);
    state = BoundedTemporalOrchestrator.nodeContextRetrieval(state, referenceDate);
    state = BoundedTemporalOrchestrator.nodeDifficultySelection(state);
    state = BoundedTemporalOrchestrator.nodeRecipeGeneration(state);
    state = BoundedTemporalOrchestrator.nodeValidationAndCaching(state);

    if (!state.generated_spec?.validation_status.all_passed) {
      throw new Error(`Temporal orchestration failed validation: ${state.validation_errors?.join("; ")}`);
    }

    return state;
  }

  public static getCachedSpec(snapshotId: string): TemporalOrientationSpec | undefined {
    return BoundedTemporalOrchestrator.cachedSpecs.get(snapshotId);
  }

  public static getLatestSpec(personId: string, templateKey: string): TemporalOrientationSpec | undefined {
    return BoundedTemporalOrchestrator.cachedSpecs.get(`latest:${personId}:${templateKey}`);
  }
}
