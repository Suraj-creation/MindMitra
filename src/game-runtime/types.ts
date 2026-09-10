import {
  GameSpec,
  GameTrialTelemetry,
  ExperienceEpisode,
  TemporalFrame,
  MemoryVerificationStatus,
  ConsentScope,
  GameGenerationMode,
} from "../domain/cognitive-experience";

// ── Interaction Primitives ───────────────────────────────────────────────────
export type InteractionPrimitive =
  | "recognition"
  | "selection"
  | "matching"
  | "ordering"
  | "sequencing"
  | "recall"
  | "association"
  | "audio_playback"
  | "image_presentation"
  | "hint"
  | "graceful_skip"
  | "completion"
  | "reminder_action";

// ── Scaffolding Ladder ───────────────────────────────────────────────────────
// Progression: independent → contextual_cue → modality_shift → narrowed_choice → partial_reveal → full_support
export type ScaffoldingLevel =
  | "independent"
  | "contextual_cue"
  | "modality_shift"
  | "narrowed_choice"
  | "partial_reveal"
  | "full_support";

export const SCAFFOLDING_LADDER_ORDER: ScaffoldingLevel[] = [
  "independent",
  "contextual_cue",
  "modality_shift",
  "narrowed_choice",
  "partial_reveal",
  "full_support",
];

// ── Modalities & Difficulties ────────────────────────────────────────────────
export type GameModality =
  | "photo_plus_voice"
  | "visual_tactile"
  | "audio_guided"
  | "multi_modal";

export type GameDifficultyLevel = 1 | 2 | 3;

export interface GameDifficultyConfig {
  level: GameDifficultyLevel;
  choice_count: number;
  initial_scaffolding: ScaffoldingLevel;
  allow_drag_reordering: boolean;
  auto_cue_after_ms: number;
  retry_policy: "gentle_encouragement" | "auto_advance";
}

export interface GameScaffoldingConfig {
  ladder: ScaffoldingLevel[];
  current_level: ScaffoldingLevel;
  cues: Partial<Record<ScaffoldingLevel, {
    description?: string;
    text_cue?: string;
    audio_url?: string;
    speaker_name?: string;
    highlight_key?: string;
  }>>;
}

// ── Safety & Dignity Constraints ─────────────────────────────────────────────
export interface GameSafetyConstraints {
  require_verified_memories: boolean;
  disallow_high_sensitivity: boolean;
  min_confidence_score: number;
  prohibited_terms: string[];
  max_session_duration_minutes: number;
}

export interface GameDignityConstraints {
  ban_failure_labels: boolean; // Always true (Never expose "wrong", "failed", "incorrect")
  ban_competitive_scoring: boolean; // Always true (No leaderboards, points, rank)
  ban_visible_countdown: boolean; // Always true (No stressful countdown clocks)
  require_positive_completion: boolean; // Always true (Every activity concludes gracefully)
  gentle_encouragement_text: string;
}

// ── Content Slot Definition ──────────────────────────────────────────────────
export interface GameContentSlot {
  slot_key: string;
  label: string;
  description: string;
  required: boolean;
  entity_type:
    | "memory"
    | "media"
    | "person"
    | "life_event"
    | "future_event"
    | "sequence_step"
    | "item_choice"
    | "voice_note"
    | "prompt_text";
  cardinality: "single" | "multiple";
  min_count?: number;
  max_count?: number;
}

// ── Template Definition ──────────────────────────────────────────────────────
export interface GameTemplate {
  id: string;
  template_key: string;
  version: string;
  title: string;
  assamese_title?: string;
  cognitive_objective: string;
  cognitive_family:
    | "autobiographical_sequencing"
    | "prospective_orientation"
    | "semantic_association"
    | "executive_planning";
  supported_primitives: InteractionPrimitive[];
  content_slots: GameContentSlot[];
  allowed_modalities: GameModality[];
  difficulty_range: [GameDifficultyLevel, GameDifficultyLevel];
  scaffolding_ladder: ScaffoldingLevel[];
  safety_constraints: GameSafetyConstraints;
  dignity_constraints: GameDignityConstraints;
  offline_capability: boolean;
  required_provenance_level: MemoryVerificationStatus;
  required_freshness: "any" | "recent_30_days" | "same_day";
  required_consent_scope: ConsentScope;
}

// ── Structured Game Experience Specification ─────────────────────────────────
export interface GameExperienceSpecification extends Omit<GameSpec, "template_key"> {
  template_key: string;
  template_version: string;
  difficulty_config?: GameDifficultyConfig;
  scaffolding: {
    ladder: ScaffoldingLevel[];
    hint_available: boolean;
    family_voice_prompt?: {
      speaker_name: string;
      relationship: string;
      text: string;
      audio_url?: string;
    };
    contextual_text_cue?: string;
    retry_policy: "gentle_encouragement" | "auto_advance";
  };
  content_bindings: Record<string, any>;
  dignity_contract: {
    no_failure_states: boolean;
    no_visible_countdown: boolean;
    no_comparative_scoring: boolean;
    gentle_closure: boolean;
  };
}

// ── Game Content Bindings ────────────────────────────────────────────────────
// 1. My Life Timeline Content Bindings
export interface TimelineMilestoneBinding {
  id: string;
  title: string;
  assamese_title?: string;
  approximate_year: string;
  era_label: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  voice_note_url?: string;
  voice_note_transcript?: string;
  speaker_name?: string;
  chronological_order: number;
}

export interface MyLifeTimelineContentBindings {
  milestones: TimelineMilestoneBinding[];
  comparison_pair?: {
    first_milestone_id: string;
    second_milestone_id: string;
    earlier_milestone_id: string;
    stimulus_prompt: string;
  };
  narrative_summary?: string;
}

// 2. Prepare-For Content Bindings
export interface PreparationStepBinding {
  id: string;
  step_number: number;
  label: string;
  assamese_label?: string;
  detail?: string;
  icon?: string;
}

export interface PreparationItemBinding {
  id: string;
  label: string;
  assamese_label?: string;
  category: "ritual" | "hospitality" | "comfort" | "personal";
  icon?: string;
  is_relevant: boolean;
}

export interface PrepareForContentBindings {
  event: {
    id: string;
    title: string;
    scheduled_at: string;
    formatted_time: string;
    location: string;
    visitor_name?: string;
    relationship?: string;
    photo_url?: string;
    phone_number?: string;
  };
  visitor_choices?: Array<{
    id: string;
    name: string;
    relationship: string;
    photo_url: string;
    is_expected: boolean;
  }>;
  preparation_steps: PreparationStepBinding[];
  preparation_items: PreparationItemBinding[];
  call_action_available?: boolean;
  reminder_action_available?: boolean;
}

// ── Trial Telemetry & Outcome ────────────────────────────────────────────────
export interface GameTrialRecord {
  id: string;
  trial_index: number;
  step_name: string;
  stimulus: string;
  user_selection: string;
  is_affirmative_match: boolean; // Internal measurement flag (never exposed as "wrong")
  latency_ms: number;
  scaffolding_level: ScaffoldingLevel;
  hint_used: boolean;
  completion_state: "success" | "assisted" | "skipped";
  measurement_quality: number; // 0.0 - 1.0
  recorded_at: string;
}

export interface GameOutcome {
  session_id: string;
  person_id: string;
  template_key: string;
  generation_mode: GameGenerationMode;
  total_trials: number;
  completed_steps: number;
  skipped_steps: number;
  average_latency_ms: number;
  scaffolding_assistance_rate: number;
  highest_scaffolding_used: ScaffoldingLevel;
  engagement_score: number; // 0.0 - 1.0
  measurement_quality: number; // 0.0 - 1.0
  celebration_message: string;
  experience_episode: ExperienceEpisode;
}

// ── Session State Machine ────────────────────────────────────────────────────
export type GameSessionStatus =
  | "idle"
  | "in_progress"
  | "paused"
  | "completed"
  | "fatigue_halted"
  | "exited";

export interface GameSessionRuntimeState {
  session_id: string;
  spec_id: string;
  template_key: string;
  person_id: string;
  status: GameSessionStatus;
  current_step_index: number;
  total_steps: number;
  current_scaffolding_level: ScaffoldingLevel;
  trials: GameTrialRecord[];
  started_at: number;
  elapsed_active_ms: number;
  last_activity_at: number;
  paused_at?: number;
  fatigue_detected: boolean;
}

// ── Validation Result ────────────────────────────────────────────────────────
export interface SpecValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  template_matched?: string;
  validated_spec?: GameExperienceSpecification;
}
