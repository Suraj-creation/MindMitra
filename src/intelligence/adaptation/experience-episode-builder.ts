import {
  ExperienceEpisode,
  GameTrialTelemetry,
  GameGenerationMode,
} from "../../domain/cognitive-experience";
import { GameExperienceSpecification } from "../specifications/types";

export interface SessionInteractionMeta {
  session_id?: string;
  hints_requested?: number;
  hint_types_used?: string[];
  assistance_level?: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
  assisted_trials_count?: number;
  skipped_indices?: number[];
  completed_gracefully?: boolean;
  keepsake_woven?: boolean;
  time_of_day?: string;
  environment?: string;
  session_duration_sec?: number;
  offline_generated?: boolean;
  qualitative_engagement?: "high_interest" | "calm_contentment" | "mild_hesitation" | "rest_requested";
  touch_target_stability?: "steady" | "mild_hesitation" | "assisted";
  recognized_place_ids?: string[];
  struggled_landmark_ids?: string[];
}

export class ExperienceEpisodeBuilder {
  public static readonly MEASUREMENT_QUALITY_THRESHOLD = 0.65;

  /**
   * Synthesize a rich Experience Episode adhering to MindMitra's Personal Cognitive Data Layer contract.
   * Experiences are never reduced to a score; rich qualitative, contextual, and capability observations are preserved.
   */
  public static buildEpisode(params: {
    personId: string;
    templateKey: string;
    objective?: string;
    difficulty?: number;
    modality?: string;
    trials: GameTrialTelemetry[];
    domain?: string;
    meta?: SessionInteractionMeta;
  }): ExperienceEpisode {
    const totalTrials = params.trials.length;
    const hintsCount = params.meta?.hints_requested ?? params.trials.filter((t) => (t.hints_used_count || 0) > 0 || t.hint_used).length;
    const skippedIndices = params.meta?.skipped_indices ?? params.trials.filter((t) => t.completion_state === "skipped" || t.user_action === "skip").map((t) => t.trial_index);
    const assistedCount = params.meta?.assisted_trials_count ?? params.trials.filter((t) => t.assistance_level && t.assistance_level !== "none").length;
    const assistanceRate = totalTrials > 0 ? assistedCount / totalTrials : 0;

    const latencies = params.trials.map((t) => t.latency_ms).filter((l) => typeof l === "number" && l > 0);
    const meanLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 2400;
    const latencyVariance = latencies.length > 1
      ? Math.round(latencies.reduce((sum, val) => sum + Math.pow(val - meanLatency, 2), 0) / latencies.length)
      : 0;

    let q = 1.0;
    const degradationReasons: string[] = [];

    const primaryAssistance = params.meta?.assistance_level || (assistedCount > 0 ? "visual_cue" : "none");
    if (primaryAssistance === "caregiver_prompt") {
      q -= 0.35;
      degradationReasons.push("External caregiver prompt assistance utilized");
    } else if (primaryAssistance === "family_voice") {
      q -= 0.08;
      degradationReasons.push("Scaffolded family audio guidance accessed");
    } else if (primaryAssistance === "visual_cue") {
      q -= 0.12;
      degradationReasons.push("Highlighted visual stepping cue requested");
    }

    if (hintsCount > 0) {
      const hintPenalty = Math.min(0.24, hintsCount * 0.08);
      q -= hintPenalty;
      degradationReasons.push(`${hintsCount} gentle hint(s) consulted`);
    }

    if (skippedIndices.length > 0) {
      q -= Math.min(0.25, skippedIndices.length * 0.12);
      degradationReasons.push(`${skippedIndices.length} step(s) gently bypassed`);
    }

    if (meanLatency > 12000) {
      q -= 0.15;
      degradationReasons.push("Prolonged cognitive hesitation observed");
    }

    q = Math.max(0.0, Math.min(1.0, Math.round(q * 100) / 100));
    const validForCapabilityUpdate = q >= ExperienceEpisodeBuilder.MEASUREMENT_QUALITY_THRESHOLD;

    let engagementScore = 0.92;
    if (primaryAssistance === "caregiver_prompt") engagementScore -= 0.1;
    if (skippedIndices.length > 1) engagementScore -= 0.12;
    if (hintsCount > 2) engagementScore -= 0.05;
    engagementScore = Math.max(0.65, Math.min(0.99, Math.round(engagementScore * 100) / 100));

    const sessionId = params.meta?.session_id || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const episode: ExperienceEpisode = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      session_id: sessionId,
      person_id: params.personId,
      template_key: params.templateKey,
      generation_mode: "parametrically_personalised_level_b",
      objective: params.objective || "Cognitive experience",
      context: {
        time_of_day: params.meta?.time_of_day || "10:30 AM",
        modality: params.modality || "photo_plus_voice",
        difficulty: params.difficulty || 1,
        environment: params.meta?.environment || "Veranda / Home Living Space",
        session_duration_sec: params.meta?.session_duration_sec || 120,
        offline_generated: params.meta?.offline_generated || false,
      },
      engagement_score: engagementScore,
      assistance_rate: assistanceRate,
      measurement_quality: q,
      observed_response: `Engaged with ${params.trials.length} trials in ${params.templateKey}. Mean latency ${meanLatency}ms.`,
      learned_implication: validForCapabilityUpdate
        ? `Valid observation (Q=${q}) confirms stable capability.`
        : `Assistance or hesitation observed (Q=${q}). Skipped from capability model update.`,
      pcm_update: {
        domain: params.domain || "autobiographical_memory",
        delta: validForCapabilityUpdate ? 0.02 : 0,
        new_estimate: 0.91,
        applied: validForCapabilityUpdate,
        reason_if_skipped: validForCapabilityUpdate ? undefined : `Measurement Quality Q=${q} < 0.65 threshold`,
      },
      trials_telemetry: params.trials,
      skips_count: skippedIndices.length,
      completion_status: skippedIndices.length === 0 ? "completed" : "completed",
      idempotency_key: `idem_${sessionId}_${params.templateKey}`,
      provenance_audit: {
        verified_records_count: 2,
        unverified_records_count: 0,
        data_layer_version: "2.1.0",
      },
      created_at: now,
    };

    return episode;
  }

  /**
   * Synthesize a rich Experience Episode adhering to MindMitra's Personal Cognitive Data Layer contract.
   * Experiences are never reduced to a score; rich qualitative, contextual, and capability observations are preserved.
   */
  public static buildFromGameSession(
    personId: string,
    spec: GameExperienceSpecification,
    telemetry: GameTrialTelemetry[],
    meta?: SessionInteractionMeta
  ): ExperienceEpisode {
    const now = new Date().toISOString();
    const sessionId = meta?.session_id || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const templateKey = spec.game_template;

    // 1. Calculate trial metrics
    const totalTrials = telemetry.length;
    const hintsCount = meta?.hints_requested ?? telemetry.filter((t) => t.hint_used).length;
    const skippedIndices = meta?.skipped_indices ?? telemetry.filter((t) => t.completion_state === "skipped").map((t) => t.trial_index);
    const assistedCount = meta?.assisted_trials_count ?? telemetry.filter((t) => t.assistance_level !== "none").length;
    const assistanceRate = totalTrials > 0 ? assistedCount / totalTrials : 0;

    // Latency distribution
    const latencies = telemetry.map((t) => t.latency_ms).filter((l) => typeof l === "number" && l > 0);
    const meanLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 2400;
    const latencyVariance = latencies.length > 1
      ? Math.round(latencies.reduce((sum, val) => sum + Math.pow(val - meanLatency, 2), 0) / latencies.length)
      : 0;
    const isFatigued = (meta?.session_duration_sec || 0) > 600 || meanLatency > 8000;

    // 2. Rigorous Measurement Quality (Q) calculation
    const degradationReasons: string[] = [];
    let q = 1.0;

    const primaryAssistance = meta?.assistance_level || (assistedCount > 0 ? "visual_cue" : "none");
    if (primaryAssistance === "caregiver_prompt") {
      q -= 0.35;
      degradationReasons.push("External caregiver prompt assistance utilized");
    } else if (primaryAssistance === "family_voice") {
      q -= 0.08;
      degradationReasons.push("Scaffolded family audio guidance accessed");
    } else if (primaryAssistance === "visual_cue") {
      q -= 0.12;
      degradationReasons.push("Highlighted visual stepping cue requested");
    }

    if (hintsCount > 0) {
      const hintPenalty = Math.min(0.24, hintsCount * 0.08);
      q -= hintPenalty;
      degradationReasons.push(`${hintsCount} gentle hint(s) consulted`);
    }

    if (skippedIndices.length > 0) {
      q -= Math.min(0.25, skippedIndices.length * 0.12);
      degradationReasons.push(`${skippedIndices.length} step(s) gently bypassed`);
    }

    if (meanLatency > 12000) {
      q -= 0.15;
      degradationReasons.push("Prolonged cognitive hesitation observed");
    }

    q = Math.max(0.0, Math.min(1.0, Math.round(q * 100) / 100));
    const validForCapabilityUpdate = q >= ExperienceEpisodeBuilder.MEASUREMENT_QUALITY_THRESHOLD;

    // 3. Compute Engagement Score & Qualitative Mood
    let engagementScore = 0.92;
    if (primaryAssistance === "caregiver_prompt") engagementScore -= 0.1;
    if (skippedIndices.length > 1) engagementScore -= 0.12;
    if (hintsCount > 2) engagementScore -= 0.05;
    engagementScore = Math.max(0.65, Math.min(0.99, Math.round(engagementScore * 100) / 100));

    const qualitativeEngagement = meta?.qualitative_engagement || (
      skippedIndices.length > 1 ? "rest_requested" :
      hintsCount > 1 ? "mild_hesitation" :
      engagementScore >= 0.90 ? "high_interest" : "calm_contentment"
    );

    // 4. Content and target bindings extraction
    const memoryIds: string[] = spec.memory_place_bindings?.memory_ids || [];
    const placeIds: string[] = spec.memory_place_bindings?.place_ids || [];
    let routeId: string | undefined = spec.memory_place_bindings?.route_id;
    const waypoints: string[] = [];

    const steps = spec.sequence || [];
    steps.forEach((step) => {
      if (step.stimulus?.landmark_cue) waypoints.push(step.stimulus.landmark_cue);
    });

    const scaffoldingLevel = spec.scaffolding?.current_level || "recognition";
    const difficultyLevel = spec.difficulty || 1;
    const provRefs = spec.provenance_references || [];

    // 5. Formulate human-centered observed response & clinical learned implication
    let observedResponse = "";
    let learnedImplication = "";
    let domain = "autobiographical_memory";
    let delta = 0.02;

    if (templateKey === "reminiscence_journey_my_world") {
      domain = scaffoldingLevel === "recall_reminiscence" ? "free_recall" : "photo_recognition";
      observedResponse = `Engaged with ${steps.length} life memories (${scaffoldingLevel} tier) in Tezpur cultural setting. Response fluency was ${meanLatency < 3500 ? "brisk and confident" : "deliberate and contemplative"}.`;
      learnedImplication = validForCapabilityUpdate
        ? `High-fidelity observation confirms stable ${scaffoldingLevel} capacity with ${Math.round(engagementScore * 100)}% affective engagement.`
        : `Session exhibited assistance/hesitation (Q=${q}). Retained for qualitative experience history without biasing capability model.`;
    } else if (templateKey === "route_builder_familiar_places") {
      domain = scaffoldingLevel === "independent_route_recall" ? "spatial_orientation" : "waypoint_sequencing";
      observedResponse = `Navigated familiar pathway to ${steps[steps.length - 1]?.stimulus?.landmark_cue || "destination"} (${scaffoldingLevel}). Landmark orientation was ${meanLatency < 4000 ? "clear and intuitive" : "supported by sensory stepping stones"}.`;
      learnedImplication = validForCapabilityUpdate
        ? `Spatial waypoint sequencing confirmed stable at difficulty level ${difficultyLevel}.`
        : `Navigational hesitation noted (Q=${q}). Maintained at current scaffolding tier to preserve confidence.`;
    }

    // 6. Cross-Game Learning Inference
    const crossGame: ExperienceEpisode["cross_game_implications"] = {};
    if (templateKey === "reminiscence_journey_my_world") {
      // If place memories recognized with high confidence, propose for Game 8
      if (placeIds.length > 0 && q >= 0.75) {
        crossGame.recognized_place_ids = placeIds;
        crossGame.recommended_next_game = "route_builder_familiar_places";
      }
    } else if (templateKey === "route_builder_familiar_places") {
      // If struggled with any landmark or hint used on landmark, recommend Game 7 grounding
      if (hintsCount > 0 || primaryAssistance !== "none") {
        crossGame.struggled_landmark_ids = meta?.struggled_landmark_ids || (waypoints.length > 0 ? [waypoints[0]] : []);
        crossGame.recommended_next_game = "reminiscence_journey_my_world";
        crossGame.recommended_scaffolding_level = "recognition";
      }
    }

    const episode: ExperienceEpisode = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      session_id: sessionId,
      person_id: personId,
      template_key: templateKey,
      generation_mode: "parametrically_personalised_level_b",
      objective: spec.prompt?.session_title || spec.objective || "Personal Cognitive Experience",
      context: {
        time_of_day: meta?.time_of_day || "10:30 AM",
        modality: spec.modality,
        difficulty: difficultyLevel,
        environment: meta?.environment || "Veranda / Home Living Space",
        session_duration_sec: meta?.session_duration_sec || Math.round((latencies.reduce((a, b) => a + b, 0) / 1000) + 15),
        offline_generated: meta?.offline_generated || false,
      },
      engagement_score: engagementScore,
      assistance_rate: assistanceRate,
      measurement_quality: q,
      observed_response: observedResponse,
      learned_implication: learnedImplication,
      pcm_update: {
        domain,
        delta: validForCapabilityUpdate ? delta : 0,
        new_estimate: 0.91, // will be resolved by PersonalCapabilityModel
        applied: validForCapabilityUpdate,
        reason_if_skipped: validForCapabilityUpdate ? undefined : `Measurement quality Q=${q} below threshold 0.65 (${degradationReasons.join("; ")})`,
      },
      created_at: now,

      // Extended Personal Cognitive Data Layer fields
      game_template: templateKey,
      game_spec_id: spec.spec_id,
      target_content: {
        memory_ids: memoryIds.length > 0 ? memoryIds : undefined,
        place_ids: placeIds.length > 0 ? placeIds : undefined,
        route_id: routeId,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
      },
      difficulty: difficultyLevel,
      scaffolding_level: scaffoldingLevel,
      modality: spec.modality,
      assistance: {
        level: primaryAssistance,
        assisted_count: assistedCount,
        assistance_rate: assistanceRate,
      },
      hints: {
        requested_count: hintsCount,
        types_used: meta?.hint_types_used || (hintsCount > 0 ? ["sensory_cue"] : []),
      },
      completion: {
        completed_gracefully: meta?.completed_gracefully ?? true,
        all_steps_completed: skippedIndices.length === 0,
        keepsake_woven: meta?.keepsake_woven ?? true,
      },
      skip: {
        skipped_count: skippedIndices.length,
        skipped_step_indices: skippedIndices,
      },
      engagement: {
        score: engagementScore,
        qualitative: qualitativeEngagement,
      },
      interaction_quality: {
        mean_latency_ms: meanLatency,
        latency_variance: latencyVariance,
        touch_target_stability: meta?.touch_target_stability || "steady",
        fatigue_detected: isFatigued,
      },
      measurement_quality_details: {
        q_score: q,
        valid_for_capability_update: validForCapabilityUpdate,
        degradation_reasons: degradationReasons,
      },
      provenance: {
        provenance_refs: provRefs.map((p) => p.entity_id),
        verified_by_actors: Array.from(new Set(provRefs.map((p) => p.verified_by))),
        verification_status_summary: provRefs.every((p) => p.verification_status.includes("verified"))
          ? "all_verified_safe"
          : "bounded_claims_present",
      },
      cross_game_implications: crossGame,
      idempotency_key: `idem_${sessionId}_${spec.spec_id}`,
    };

    return episode;
  }
}
