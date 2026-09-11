// Experience Engine -- the contracts.
//
// One generic ExperienceSpec, rendered by one deterministic renderer. The
// renderer must not know where the content came from; it executes the spec.
//
// This is deliberately NOT src/intelligence/specifications/types.ts
// (GameExperienceSpecification). That type is the two bespoke engines' runtime
// contract: it hard-codes `game_template: "reminiscence_journey_my_world" |
// "route_builder_familiar_places"`, `memory_place_bindings`, and per-game
// scaffolding enums, and the ReminiscenceJourneyEngine/RouteBuilderEngine
// components are written against those fields. A generic engine cannot be
// expressed in it without widening every one of those unions and adding
// optionality that would weaken the existing engines' type safety. The two
// coexist: legacy specs keep the legacy pipeline, generic ones use this.

export type ExperienceTemplateId =
  | "EVENT_RECALL"
  | "WHO_WAS_THERE"
  | "WHO_IS_COMING"
  | "PERSON_RECOGNITION"
  | "PHOTO_MEMORY_RECALL"
  | "PLACE_RECOGNITION"
  | "ROUTINE_SEQUENCE";

/** Section 9 -- why this experience exists. Internal; never shown to the person. */
export type ExperienceReason =
  | "RECENT_ACTIVITY_RECALL"
  | "FAMILY_MEMORY"
  | "UPCOMING_EVENT_PREPARATION"
  | "ROUTINE_RECALL"
  | "FAMILIAR_PERSON_RECOGNITION"
  | "PLACE_MEMORY"
  | "MUSIC_MEMORY"
  | "PREVIOUS_EXPERIENCE_FOLLOWUP"
  | "DAILY_LIFE_SEQUENCE"
  | "CONVERSATION_CONTEXT"
  | "PERSON_PREFERENCE";

/** Section 21 -- gameplay outcome is never reduced to win/loss. */
export type ExperienceOutcome =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "UNSUCCESSFUL"
  | "DECLINED"
  | "ABANDONED"
  | "COMPLETED_WITH_SUPPORT"
  | "COMPLETED_TOGETHER"
  | "UNABLE_TO_ASSESS";

/** Section 45 -- the event vocabulary. Mirrors the CHECK constraint in schema v4. */
export type ExperienceEventType =
  | "EXPERIENCE_SUGGESTED"
  | "EXPERIENCE_ACCEPTED"
  | "EXPERIENCE_DECLINED"
  | "EXPERIENCE_STARTED"
  | "EXPERIENCE_STEP_STARTED"
  | "EXPERIENCE_RESPONSE"
  | "EXPERIENCE_CORRECT"
  | "EXPERIENCE_INCORRECT"
  | "EXPERIENCE_CUE"
  | "EXPERIENCE_ASSISTED"
  | "EXPERIENCE_COMPLETED"
  | "EXPERIENCE_COMPLETED_WITH_SUPPORT"
  | "EXPERIENCE_ABANDONED"
  | "EXPERIENCE_PAUSED"
  | "EXPERIENCE_RESUMED";

/** Section 24 -- S0 independent through S5 full support. */
export type AssistanceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type InteractionMode = "single_choice" | "ordering";

/**
 * A media reference that has already passed authorization and been resolved to
 * something the browser can load. `source` records how it resolved so a
 * missing B2 object is visible rather than silently swapped for a stand-in
 * (Section 56 -- no placeholder ever substitutes for a missing media object).
 */
export interface ResolvedMedia {
  media_id: string;
  media_type: "photo" | "audio" | "video" | "document";
  url: string;
  alt_text: string;
  source: "b2_presigned" | "local_asset" | "absolute_url";
  storage_key: string;
  expires_at?: string;
}

export interface ProvenanceRef {
  entity_id: string;
  entity_type: "memory" | "place" | "person" | "event" | "routine" | "media" | "medication";
  source: string;
  verified: boolean;
  confidence: number;
  consent_scope: string;
  sensitivity: string;
}

export interface ExperienceChoice {
  id: string;
  label: string;
  /** Present only where the template is genuinely visual. */
  media: ResolvedMedia | null;
  is_expected: boolean;
  /** The real record this option came from. Nothing here is invented (Section 32). */
  source_entity_id: string;
  /** Spoken on selection. Warm, never a score. */
  affirmation: string;
}

/**
 * One rung of the assistance ladder. Every rung's text is composed from real
 * retrieved fields -- a cue that invents a detail is worse than no cue.
 */
export interface ScaffoldRung {
  level: AssistanceLevel;
  kind: "contextual_cue" | "modality_change" | "narrowed_choices" | "partial_reveal" | "full_support";
  text: string;
  media: ResolvedMedia | null;
  /** For narrowed_choices: which choice ids survive. */
  keep_choice_ids?: string[];
  source_entity_ids: string[];
}

export interface ExperienceStep {
  step_id: string;
  step_index: number;
  prompt: string;
  /** Optional second-language rendering; absent rather than machine-guessed. */
  prompt_localised?: string;
  media: ResolvedMedia | null;
  interaction: InteractionMode;
  choices: ExperienceChoice[];
  expected_choice_ids: string[];
  scaffolds: ScaffoldRung[];
  gentle_retry: string;
  source_entity_ids: string[];
}

export interface ExperienceMeasurementPlan {
  /** What is being observed. Never a clinical score (Section 22). */
  domain:
    | "autobiographical_memory"
    | "temporal_orientation"
    | "person_recognition"
    | "place_recognition"
    | "routine_sequencing"
    | "prospective_orientation";
  what_is_observed: string;
  /** Conditions that determine whether this observation is usable (Section 23). */
  quality_factors: string[];
}

export interface ExperienceSpec {
  spec_id: string;
  person_id: string;
  created_at: string;
  expires_at: string;
  template_id: ExperienceTemplateId;
  reason: ExperienceReason;
  /** Internal one-liner: which record drove this. Not person-facing. */
  reason_detail: string;
  title: string;
  subtitle: string;
  /** Section 38 -- the calm invitation. No "AI generated", no confidence numbers. */
  invitation_text: string;
  language: string;
  difficulty: 1 | 2 | 3;
  modality: "visual_choice" | "text_choice" | "photo_plus_voice";
  steps: ExperienceStep[];
  completion: {
    message: string;
    graceful_exit: string;
  };
  measurement_plan: ExperienceMeasurementPlan;
  provenance: ProvenanceRef[];
  safety: {
    no_score_shown: boolean;
    no_timer: boolean;
    no_failure_screen: boolean;
    skip_always_available: boolean;
    stop_always_available: boolean;
  };
}

// -- Validation --------------------------------------------------------------

export interface ValidationStage {
  stage: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExperienceValidation {
  is_valid: boolean;
  validated_at: string;
  stages: ValidationStage[];
  rejection_reasons: string[];
}

// -- Developer trace (Sections 53/54) -- never rendered in the Person App -----

export interface ExperienceTrace {
  requested_at: string;
  trigger: "lets_do_something" | "conversation" | "deep_link";
  conversation_text?: string;
  candidate_templates: Array<{
    template_id: ExperienceTemplateId;
    eligible: boolean;
    reason: string;
  }>;
  selected_template: ExperienceTemplateId | null;
  retrieval: {
    plan: string[];
    counts: Record<string, number>;
    blocked: Record<string, number>;
  };
  entities_used: string[];
  media_used: Array<{ media_id: string; source: string }>;
  recent_experience: {
    recent_template_ids: string[];
    declined_template_ids: string[];
    suppressed_entity_ids: string[];
  };
  validation: ExperienceValidation | null;
  composed_by: "deterministic_composer";
  duration_ms: number;
}

/**
 * What the planner returns. A refusal is a first-class result: "there isn't
 * enough saved information for that" is the correct answer far more often than
 * a fabricated question (Section 34).
 */
export type PlanResult =
  | { status: "ready"; spec: ExperienceSpec; trace: ExperienceTrace }
  | {
      status: "no_data";
      /** Person-facing, plain, no system framing. */
      message: string;
      /** Internal. */
      detail: string;
      trace: ExperienceTrace;
    }
  | {
      status: "invalid";
      message: string;
      detail: string;
      trace: ExperienceTrace;
    };

// -- Telemetry input ---------------------------------------------------------

export interface ExperienceEventInput {
  person_id: string;
  spec_id?: string | null;
  template_id?: string | null;
  reason?: string | null;
  event_type: ExperienceEventType;
  step_id?: string | null;
  step_index?: number | null;
  response?: string | null;
  expected_response?: string | null;
  outcome?: ExperienceOutcome | null;
  assistance_level?: AssistanceLevel;
  modality?: string | null;
  language?: string | null;
  latency_ms?: number | null;
  measurement_quality?: number | null;
  measurement_conditions?: Record<string, unknown>;
  source_entity_ids?: string[];
  context?: Record<string, unknown>;
  occurred_at?: string;
  idempotency_key?: string;
}
