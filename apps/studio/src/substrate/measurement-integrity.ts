/**
 * MindMitra Measurement Integrity Engine & Longitudinal Adaptation Pipeline
 *
 * Implements the 7-step pipeline:
 * raw event
 * → normalized event
 * → measurement quality
 * → experience episode
 * → observation
 * → candidate memory/capability/preference
 * → validation
 * → persistent personal model update
 */

import {
  InteractionEvent,
  MeasurementQualityRecord,
  ExperienceEpisode,
  CapabilityObservation,
  PersonalCapabilityState,
  AssistancePolicy,
} from "./types";

export interface RawInteractionPayload {
  person_id: string;
  session_id: string;
  surface: string;
  route: string;
  component: string;
  event_type: string;
  input_modality: "touch" | "voice" | "gesture" | "system";
  language: string;
  duration_ms?: number;
  latency_ms?: number;
  result?: "success" | "partial" | "abandoned" | "assisted" | "failed" | "neutral";
  assistance_level?: "none" | "visual_cue" | "relational_voice_cue" | "step_demonstration" | "caregiver_guided";
  signals?: {
    audibility?: number;
    visibility?: number;
    fatigue_factor?: number;
    was_assisted?: boolean;
    device_ok?: boolean;
    subject_confirmed?: boolean;
    language_match?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface PipelineStepTelemetry {
  step_number: number;
  step_name: string;
  status: "PASSED" | "GATED" | "MODIFIED" | "REJECTED";
  summary: string;
  data: any;
}

export interface PipelineExecutionReport {
  pipeline_id: string;
  person_id: string;
  started_at: string;
  completed_at: string;
  passed_measurement_gate: boolean;
  persisted_to_model: boolean;
  steps: PipelineStepTelemetry[];
}

/**
 * Step 2 & 3: Compute Measurement Quality Score & Certification Gate
 */
export function evaluateMeasurementQuality(
  recordId: string,
  signals: {
    audibility?: number;
    visibility?: number;
    fatigue_factor?: number;
    was_assisted?: boolean;
    device_ok?: boolean;
    subject_confirmed?: boolean;
    language_match?: boolean;
  } = {},
  eventId?: string,
  episodeId?: string
): MeasurementQualityRecord {
  const audibility = Math.max(0, Math.min(1, signals.audibility ?? 0.9));
  const visibility = Math.max(0, Math.min(1, signals.visibility ?? 0.9));
  const fatigue_factor = Math.max(0, Math.min(1, signals.fatigue_factor ?? 0.85));
  const was_assisted = signals.was_assisted ?? false;
  const device_ok = signals.device_ok ?? true;
  const subject_confirmed = signals.subject_confirmed ?? true;
  const language_match = signals.language_match ?? true;

  const components: Record<string, number> = {
    audibility,
    visibility,
    fatigue_factor,
    assistance_factor: was_assisted ? 0.3 : 1.0,
    device_factor: device_ok ? 1.0 : 0.0,
    subject_factor: subject_confirmed ? 1.0 : 0.0,
    language_factor: language_match ? 1.0 : 0.3,
  };

  // Geometric mean of continuous acoustic, visual, and alertness indicators
  const continuous = [audibility, visibility, fatigue_factor];
  let base_q = 0.0;
  if (!continuous.some((v) => v === 0)) {
    const logSum = continuous.reduce((acc, v) => acc + Math.log(v), 0);
    base_q = Math.exp(logSum / continuous.length);
  }

  let composite =
    base_q *
    components.assistance_factor *
    components.device_factor *
    components.subject_factor *
    components.language_factor;

  composite = Math.max(0, Math.min(1, composite));

  let dominant_issue: string | null = null;
  let minVal = 1.0;
  for (const [k, v] of Object.entries(components)) {
    if (v < minVal) {
      minVal = v;
      dominant_issue = k;
    }
  }

  const gate: "sufficient" | "insufficient_data" =
    composite >= 0.4 && device_ok && subject_confirmed
      ? "sufficient"
      : "insufficient_data";

  return {
    record_id: recordId,
    event_id: eventId,
    episode_id: episodeId,
    audibility,
    visibility,
    fatigue_factor,
    assistance_factor: components.assistance_factor,
    device_factor: components.device_factor,
    subject_confirmed,
    language_match,
    composite_score: Number(composite.toFixed(3)),
    dominant_issue,
    gate,
    evaluated_at: new Date().toISOString(),
  };
}

/**
 * Executes the full 7-step longitudinal adaptation pipeline.
 */
export function processInteractionThroughPipeline(
  raw: RawInteractionPayload,
  currentCapability?: PersonalCapabilityState,
  currentPolicy?: AssistancePolicy
): {
  report: PipelineExecutionReport;
  normalizedEvent: InteractionEvent;
  mqRecord: MeasurementQualityRecord;
  episode?: ExperienceEpisode;
  observation?: CapabilityObservation;
  updatedCapability?: PersonalCapabilityState;
  updatedPolicy?: AssistancePolicy;
} {
  const steps: PipelineStepTelemetry[] = [];
  const pipelineId = `pipe_${Date.now()}`;
  const now = new Date().toISOString();

  // Step 1: Raw Event Ingestion
  steps.push({
    step_number: 1,
    step_name: "Raw Event Ingestion",
    status: "PASSED",
    summary: `Captured raw interaction '${raw.event_type}' on surface '${raw.surface}'`,
    data: { event_type: raw.event_type, surface: raw.surface, modality: raw.input_modality },
  });

  // Step 2: Normalized Event Formatting
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const normalizedEvent: InteractionEvent = {
    event_id: eventId,
    person_id: raw.person_id,
    session_id: raw.session_id,
    timestamp: now,
    surface: raw.surface,
    route: raw.route,
    component: raw.component,
    event_type: raw.event_type as any,
    input_modality: raw.input_modality,
    language: raw.language,
    duration_ms: raw.duration_ms || 1200,
    latency_ms: raw.latency_ms || 850,
    result: raw.result || "success",
    assistance_level: raw.assistance_level || "none",
    provenance_id: `prov_${Date.now()}`,
    metadata: raw.metadata,
  };

  steps.push({
    step_number: 2,
    step_name: "Normalized Event",
    status: "PASSED",
    summary: `Structured into append-only event schema (${normalizedEvent.result}, assistance: ${normalizedEvent.assistance_level})`,
    data: normalizedEvent,
  });

  // Step 3: Measurement Quality Evaluation
  const mqRecord = evaluateMeasurementQuality(
    `mq_${Date.now()}`,
    raw.signals || {},
    eventId
  );
  normalizedEvent.measurement_quality_score = mqRecord.composite_score;

  steps.push({
    step_number: 3,
    step_name: "Measurement Quality Certification",
    status: mqRecord.gate === "sufficient" ? "PASSED" : "GATED",
    summary: `Quality Score: ${mqRecord.composite_score} (Gate: ${mqRecord.gate}, dominant issue: ${mqRecord.dominant_issue || "none"})`,
    data: mqRecord,
  });

  // Step 4: Experience Episode Creation (Experience Memory)
  const episodeId = `ep_${Date.now()}`;
  const isHelpful = raw.result === "success" || raw.result === "assisted";
  const episode: ExperienceEpisode = {
    episode_id: episodeId,
    person_id: raw.person_id,
    activity_id: raw.metadata?.activity_id || "activity:family_recall",
    activity_name: raw.metadata?.activity_name || "Family Familiar Recall",
    timestamp: now,
    context: {
      time_of_day: raw.metadata?.time_of_day || "morning",
      environment: raw.metadata?.environment || "familiar_veranda",
      companions_present: raw.metadata?.companions_present || ["daughter:anu"],
      fatigue_level: raw.signals?.fatigue_factor && raw.signals.fatigue_factor < 0.5 ? "high" : "low",
      temporal_frame: "present",
    },
    cognitive_objective: raw.metadata?.cognitive_objective || "family_person_recognition",
    content_bound: raw.metadata?.content_bound || ["person:rina", "place:tezpur_home"],
    difficulty: raw.metadata?.difficulty || "recognition",
    modality: raw.input_modality === "voice" ? "voice" : "photo+voice",
    content_familiarity: "highly_familiar",
    assistance_used: {
      scaffolding_level: raw.assistance_level || "none",
      cues_offered: raw.metadata?.cues_offered || ["visual_photo_cue"],
      successful_cue: isHelpful ? raw.metadata?.successful_cue || "visual_photo_cue" : undefined,
    },
    response: {
      recognition_success: raw.result === "success",
      cued_recall_success: raw.result === "assisted",
      free_recall_success: raw.result === "success" && raw.assistance_level === "none",
      response_latency_ms: raw.latency_ms || 850,
      hesitation_detected: (raw.latency_ms || 0) > 3000,
      abandoned: raw.result === "abandoned",
      help_requests_count: raw.event_type === "help_request" ? 1 : 0,
    },
    engagement: {
      voluntary_initiation: true,
      completed: raw.result !== "abandoned",
      affect_signal: "peaceful",
    },
    measurement_quality: {
      score: mqRecord.composite_score,
      gate: mqRecord.gate,
      reasons: mqRecord.dominant_issue ? [mqRecord.dominant_issue] : ["high_quality_interaction"],
    },
    learned_implication: {
      strategy_effectiveness: isHelpful ? "effective" : "ineffective",
      recommended_hint:
        raw.assistance_level === "visual_cue"
          ? "Visual relational cues significantly raise familiar recognition"
          : "Voice-only initiation requires calm repetition in quiet surroundings",
      task_category: "familiar_person_recall",
    },
    provenance_id: normalizedEvent.provenance_id,
  };

  steps.push({
    step_number: 4,
    step_name: "Experience Episode Formed",
    status: "PASSED",
    summary: `Structured Experience Memory episode '${episode.activity_name}' with context and strategy outcome`,
    data: episode,
  });

  // Step 5: Derive Candidate Observation
  const observation: CapabilityObservation = {
    observation_id: `obs_${Date.now()}`,
    person_id: raw.person_id,
    domain: "memory_recognition",
    observed_value: raw.result === "success" ? 92.0 : raw.result === "assisted" ? 75.0 : 40.0,
    confidence: mqRecord.composite_score,
    condition_tags: [episode.context.time_of_day, episode.context.environment, "low_fatigue"],
    source_episode_id: episodeId,
    measurement_quality_gate: mqRecord.gate,
    observed_at: now,
    provenance_id: normalizedEvent.provenance_id,
  };

  steps.push({
    step_number: 5,
    step_name: "Observation Derivation",
    status: mqRecord.gate === "sufficient" ? "PASSED" : "GATED",
    summary: `Derived conditioned capability observation: ${observation.domain} = ${observation.observed_value}`,
    data: observation,
  });

  // Step 6: Measurement Gating Validation
  let updatedCapability: PersonalCapabilityState | undefined = currentCapability;
  let updatedPolicy: AssistancePolicy | undefined = currentPolicy;
  let persisted = false;

  if (mqRecord.gate === "sufficient") {
    // Gate passed: Safely update conditioned capability state (PCM)
    const prevCount = currentCapability?.evidence_count ?? 12;
    const newCount = prevCount + 1;
    const currentUncertainty = currentCapability?.uncertainty ?? 0.25;
    // Uncertainty decreases with high-quality evidence count
    const newUncertainty = Math.max(0.08, currentUncertainty * 0.96);

    updatedCapability = {
      state_id: currentCapability?.state_id || `pcm_${Date.now()}`,
      person_id: raw.person_id,
      domain: "memory_recognition",
      conditioned_estimate:
        "Familiar face & kinship recognition reliable under morning / familiar conditions; benefits from visual priming over unassisted name recall.",
      numeric_estimate: 86.5,
      uncertainty: Number(newUncertainty.toFixed(3)),
      condition_tags: ["familiar_environment", "morning", "low_noise"],
      trend: "stable",
      evidence_count: newCount,
      last_observed_at: now,
      updated_at: now,
    };

    // Step 7: Reinforce Learned Assistance Policy
    if (isHelpful) {
      const policyEvCount = (currentPolicy?.evidence_count ?? 8) + 1;
      const prevSuccess = currentPolicy?.success_rate ?? 0.82;
      const newSuccess = (prevSuccess * (policyEvCount - 1) + 1.0) / policyEvCount;

      updatedPolicy = {
        policy_id: currentPolicy?.policy_id || `pol_${Date.now()}`,
        person_id: raw.person_id,
        task_domain: "familiar_person_recall",
        preferred_strategy: "visual_recognition_first",
        fallback_strategy: "relational_voice_cue",
        confidence: Math.min(0.95, Number(((currentPolicy?.confidence ?? 0.8) + 0.02).toFixed(3))),
        evidence_count: policyEvCount,
        success_rate: Number(newSuccess.toFixed(3)),
        last_reinforced_at: now,
        condition_constraints: ["morning", "low_noise"],
      };
    }

    persisted = true;
    steps.push({
      step_number: 6,
      step_name: "Validation & Certification",
      status: "PASSED",
      summary: "Quality threshold met. Verified evidence authorized to update stable capability state.",
      data: { certified: true, gate: mqRecord.gate },
    });

    steps.push({
      step_number: 7,
      step_name: "Persistent Personal Model Update",
      status: "PASSED",
      summary: `Updated PCM capability (uncertainty: ${updatedCapability.uncertainty}) and reinforced assistance policy (${updatedPolicy?.preferred_strategy})`,
      data: { updatedCapability, updatedPolicy },
    });
  } else {
    // GATED: Low-quality or unconfirmed event is logged, but prevented from contaminating baseline/PCM
    persisted = false;
    steps.push({
      step_number: 6,
      step_name: "Validation & Certification",
      status: "GATED",
      summary: `Measurement quality gate '${mqRecord.gate}' triggered. Dominant issue: '${mqRecord.dominant_issue}'. Model update withheld to protect measurement integrity.`,
      data: { certified: false, gate: mqRecord.gate, dominant_issue: mqRecord.dominant_issue },
    });

    steps.push({
      step_number: 7,
      step_name: "Persistent Personal Model Update",
      status: "REJECTED",
      summary: "No mutation to persistent capability or assistance policies occurred.",
      data: { mutated: false, reason: "integrity_gate_held" },
    });
  }

  const report: PipelineExecutionReport = {
    pipeline_id: pipelineId,
    person_id: raw.person_id,
    started_at: now,
    completed_at: new Date().toISOString(),
    passed_measurement_gate: mqRecord.gate === "sufficient",
    persisted_to_model: persisted,
    steps,
  };

  return {
    report,
    normalizedEvent,
    mqRecord,
    episode,
    observation,
    updatedCapability,
    updatedPolicy,
  };
}
