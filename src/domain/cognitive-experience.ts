export type TemporalFrame = "past" | "childhood" | "young_adulthood" | "later_life" | "recent" | "present" | "future";
export type MemoryVerificationStatus = "unverified" | "caregiver_verified" | "chw_verified" | "clinician_verified";
export type MemorySource = "person" | "caregiver" | "chw" | "clinician" | "system_obs" | "model_inference";
export type ConsentScope = "person_only" | "family" | "games" | "reminiscence" | "all";

export interface MediaAsset {
  id: string;
  person_id: string;
  storage_key: string;
  media_type: "photo" | "audio" | "video" | "document";
  mime_type: string;
  thumbnail_url?: string;
  url: string;
  title: string;
  created_by: string;
  created_at: string;
  visibility_scope: "private" | "family" | "clinical";
  consent_scope: ConsentScope;
  provenance_id: string;
  status: "active" | "archived";
}

export interface MemoryItem {
  id: string;
  person_id: string;
  memory_type: "autobiographical" | "relationship" | "place" | "event" | "skill" | "routine" | "cultural";
  title: string;
  description: string;
  assamese_title?: string;
  temporal_frame: TemporalFrame;
  approximate_period: string; // e.g. "1958 - 1965", "1968 (Wedding)"
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  sensitivity: "low" | "medium" | "high";
  cultural_context: string; // e.g. "Tezpur, Assam / Rongali Bihu / Teaching"
  media_refs: string[]; // media_asset IDs
  people_refs: Array<{
    person_entity_id: string;
    name: string;
    relationship: string;
    verified: boolean;
  }>;
  voice_notes: Array<{
    id: string;
    speaker_name: string;
    relationship: string;
    audio_url: string;
    transcript: string;
    language: string;
    verified: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface FutureEvent {
  id: string;
  person_id: string;
  event_type: "family_visit" | "routine_tea" | "festival" | "medical_appointment" | "community_walk";
  title: string;
  description?: string;
  person_entity_id?: string;
  person_name?: string;
  relationship?: string;
  location: string;
  scheduled_at: string; // ISO string e.g. "2026-09-10T16:00:00"
  status: "expected" | "confirmed" | "occurred" | "cancelled";
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  preparation_steps?: string[];
  valid_until?: string;
}

export interface PersonalGameContextPack {
  person: {
    id: string;
    display_name: string;
    honorific: string;
    preferred_language: string;
    culture: string;
    location: string;
  };
  world: {
    people: Array<{ id: string; name: string; relationship: string; verified: boolean; phone?: string }>;
    places: Array<{ id: string; name: string; significance: string }>;
    routines: Array<{ id: string; name: string; time: string; items: string[] }>;
    memories: MemoryItem[];
    future_events: FutureEvent[];
  };
  temporal: {
    past: string[];
    present: string[];
    future: string[];
  };
  capability: {
    recognition: number; // e.g. 0.91 (91%)
    photo_recognition: number; // 0.91
    recall: number; // 0.61
    audio_recall: number; // 0.72
    sequencing: number; // 0.78
    attention_span_minutes: number;
    guidance_tolerance: "high" | "moderate" | "minimal";
  };
  experience_memory: {
    completed_sessions_count: number;
    recent_modalities: string[];
    effective_scaffolding: string[];
    fatigue_indicators: string[];
    last_10_sessions_summary: {
      family_recognition_pct: number;
      free_recall_pct: number;
      sequencing_pct: number;
    };
    preferred_topics: string[];
  };
  goals: Array<{
    id: string;
    title: string;
    cognitive_domain: string;
    status: "active" | "achieved";
  }>;
  adaptation_policy: {
    recommended_difficulty: 1 | 2 | 3;
    max_choice_count: 2 | 3 | 4;
    scaffolding_mode: "visual_cue" | "family_voice" | "contextual_prompt" | "step_by_step";
    modality: "photo_plus_voice" | "visual_only" | "tactile_sequencing" | "audio_guided";
    renewal_rule: string;
  };
}

export type GameGenerationMode = "static_level_a" | "parametrically_personalised_level_b" | "dynamically_composed_level_c";

export interface GameSpec {
  id: string;
  person_id: string;
  template_key: "my_life_timeline" | "prepare_for" | "experience_braid" | "memory_match" | "courtyard_sensory";
  version: string;
  generation_mode: GameGenerationMode;
  title: string;
  subtitle: string;
  objective: string;
  cognitive_family: "autobiographical_sequencing" | "prospective_orientation" | "semantic_association" | "executive_planning";
  difficulty: 1 | 2 | 3;
  modality: "photo_plus_voice" | "visual_tactile" | "multi_modal";
  culture: string;
  temporal_frame: TemporalFrame;
  content_bindings: Record<string, any>;
  scaffolding: {
    hint_available: boolean;
    family_voice_prompt?: {
      speaker_name: string;
      relationship: string;
      text: string;
      audio_url?: string;
    };
    visual_guide?: string;
    retry_policy: "gentle_encouragement" | "auto_advance";
  };
  instructions: {
    primary_prompt: string;
    spoken_prompt: string;
    success_celebration: string;
  };
  provenance_refs: string[];
  validation_status: {
    grounding_passed: boolean;
    consent_passed: boolean;
    safety_passed: boolean;
    dignity_passed: boolean;
    schema_passed: boolean;
    all_passed: boolean;
  };
  expires_at?: string;
}

export interface GameTrialTelemetry {
  trial_index: number;
  step_name: string;
  stimulus: string;
  user_selection: string;
  is_correct?: boolean;
  latency_ms: number;
  assistance_level: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
  hint_used: boolean;
  completion_state: "success" | "assisted" | "skipped";
  measurement_quality_q: number;
}

export interface ExperienceEpisode {
  id: string;
  session_id: string;
  person_id: string;
  template_key: string;
  generation_mode: GameGenerationMode;
  objective: string;
  context: {
    time_of_day: string;
    modality: string;
    difficulty: number;
  };
  engagement_score: number; // 0.0 - 1.0
  assistance_rate: number; // e.g. 0.2 (20% assisted)
  measurement_quality: number; // 0.0 - 1.0
  observed_response: string;
  learned_implication: string;
  pcm_update: {
    domain: string;
    delta: number;
    new_estimate: number;
  };
  created_at: string;
}
