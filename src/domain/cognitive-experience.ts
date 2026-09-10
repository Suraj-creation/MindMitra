export type TemporalFrame = "past" | "childhood" | "young_adulthood" | "later_life" | "recent" | "present" | "future";
export type MemoryVerificationStatus = "unverified" | "verified" | "rejected" | "caregiver_verified" | "chw_verified" | "clinician_verified";
export type MemorySource = "person" | "caregiver" | "chw" | "clinician" | "system" | "system_obs" | "model_inference";
export type ConsentScope = "person_only" | "family" | "games" | "reminiscence" | "all";
export type FutureEventStatus = "expected" | "confirmed" | "occurred" | "cancelled";

export interface PersonEntity {
  id: string;
  person_id: string;
  name: string;
  assamese_name?: string;
  display_name: string;
  relationship_to_person: string;
  avatar_media_id?: string;
  phone?: string;
  is_emergency_contact: boolean;
  can_verify_memories: boolean;
  verification_status: MemoryVerificationStatus;
  created_at: string;
}

export interface Relationship {
  id: string;
  person_id: string;
  related_entity_id: string;
  related_person_name: string;
  relationship_type: string;
  closeness_level: "primary_caregiver" | "family_core" | "extended" | "community_chw" | "clinical";
  verification_status: MemoryVerificationStatus;
  verified_by?: string;
  notes?: string;
  created_at: string;
}

export interface LifeEvent {
  id: string;
  person_id: string;
  title: string;
  assamese_title?: string;
  description: string;
  event_type: "milestone" | "career" | "family" | "education" | "cultural" | "residence";
  era_period: string;
  approximate_year?: number;
  cultural_significance?: string;
  primary_media_id?: string;
  linked_memory_ids?: string[];
  verification_status: MemoryVerificationStatus;
  verified_by?: string;
  sensitivity: "low" | "medium" | "high";
  game_eligible: boolean;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  person_id: string;
  storage_backend?: "b2" | "s3" | "local";
  b2_bucket?: string;
  b2_file_id?: string;
  storage_key: string;
  media_type: "photo" | "audio" | "video" | "document";
  mime_type: string;
  file_size_bytes?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  url: string;
  title: string;
  created_by: string;
  created_at: string;
  visibility_scope: "private" | "family" | "clinical";
  consent_scope: ConsentScope;
  provenance_id: string;
  status: "active" | "archived" | "deleted";
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
  verified_by?: string;
  verified_at?: string;
  confidence: number;
  sensitivity: "low" | "medium" | "high";
  is_sensitive?: boolean;
  game_eligible?: boolean;
  visibility_scope?: "private" | "family" | "clinical";
  consent_scope?: ConsentScope;
  cultural_context: string; // e.g. "Tezpur, Assam / Rongali Bihu / Teaching"
  life_event_id?: string;
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
    media_asset_id?: string;
    b2_audio_key?: string;
  }>;
  embedding_vector?: number[];
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
  status: FutureEventStatus;
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  preparation_steps?: string[];
  valid_until?: string;
}

export interface MemoryFirewallQuery {
  actor_id: string;
  actor_role: "person_self" | "primary_caregiver" | "secondary_caregiver" | "chw" | "clinician" | "system_agent";
  purpose: "personal_view" | "care_coordination" | "game_generation" | "clinical_assessment" | "research";
  person_id: string;
  requested_memory_ids?: string[];
  target_cognitive_family?: string;
  allow_sensitive?: boolean;
  require_verified?: boolean;
}

export interface MemoryFirewallEvaluation {
  allowed: boolean;
  decision: "ALLOW" | "DENY" | "PARTIAL";
  reason: string;
  actor_id: string;
  actor_role: string;
  purpose: string;
  filtered_memories: MemoryItem[];
  excluded_memories: Array<{
    id: string;
    title: string;
    exclusion_reason: string;
  }>;
  timestamp: string;
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

// ── Additional Core Database Entities (Neon PostgreSQL + pgvector) ──────────

export interface MemoryMedia {
  memory_id: string;
  media_asset_id: string;
  role: "primary_photo" | "supporting_photo" | "background_music" | "document";
  sequence_order: number;
}

export interface MemoryPeople {
  memory_id: string;
  person_entity_id: string;
  relationship: string;
  confidence: number;
  verification_status: MemoryVerificationStatus;
}

export interface MemoryVoiceNote {
  id: string;
  memory_id: string;
  speaker_entity_id: string;
  speaker_name: string;
  relationship: string;
  media_asset_id?: string;
  transcript: string;
  language: string;
  consent_scope: ConsentScope;
  verification_status: MemoryVerificationStatus;
}

export interface GameTemplate {
  id: string;
  template_key: "my_life_timeline" | "prepare_for" | "experience_braid" | "memory_match" | "courtyard_sensory";
  version: string;
  title: string;
  cognitive_family: "autobiographical_sequencing" | "prospective_orientation" | "semantic_association" | "executive_planning";
  supported_modalities: string[];
  supported_difficulty_range: [number, number];
  offline_capable: boolean;
  schema: Record<string, any>;
  safety_constraints: Record<string, any>;
}

export interface GameSession {
  id: string;
  person_id: string;
  game_spec_id: string;
  started_at: string;
  ended_at?: string;
  status: "in_progress" | "completed" | "abandoned" | "fatigue_halted";
  device_context: Record<string, any>;
  language: string;
  fatigue_context: {
    continuous_minutes: number;
    slowed_taps_detected: boolean;
    assistance_spike: boolean;
  };
}

export interface GameTrial {
  id: string;
  session_id: string;
  step_index: number;
  stimulus: string;
  response: string;
  response_type: "choice" | "reorder" | "voice_tap" | "reminder_toggle";
  latency_bucket: "<2s" | "2-5s" | ">5s";
  latency_ms: number;
  assistance_level: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
  hint_used: boolean;
  completion_state: "success" | "assisted" | "skipped";
  measurement_quality: number; // 0.0 - 1.0
  created_at: string;
}

export interface GameGenerationRun {
  id: string;
  person_id: string;
  request_id: string;
  template_candidates: string[];
  selected_template: string;
  generation_mode: GameGenerationMode;
  context_refs: string[];
  retrieval_refs: string[];
  model: string;
  prompt_version: string;
  spec_version: string;
  validation_results: {
    grounding_passed: boolean;
    consent_passed: boolean;
    safety_passed: boolean;
    dignity_passed: boolean;
    schema_passed: boolean;
    all_passed: boolean;
    violations: string[];
  };
  fallback_reason?: string;
  created_at: string;
}

// ── 9 Personalization Dimensions ─────────────────────────────────────────────
export interface PersonalizationContext9D {
  person: { id: string; name: string; honorific: string };
  memory: MemoryItem[];
  context: { location: string; time_of_day: string; environmental_calm: boolean };
  capability: { recognition_pct: number; sequencing_pct: number; max_choice_count: number };
  history: { recent_sessions: number; last_completed: string };
  preferences: { visual_photo_first: boolean; family_voices: string[]; liked_topics: string[] };
  time: { current_slot: "morning" | "afternoon" | "evening"; upcoming_event?: string };
  culture: { region: string; dialect: string; tea_tradition: string; seasonal_festival: string };
  goal: { active_goal_id: string; objective: string };
  modality: "photo_plus_voice" | "visual_tactile" | "multi_modal";
  assistance: "none" | "visual_cue" | "family_voice" | "step_by_step";
}

// ── 7-Layer Hybrid RAG Query & Result ─────────────────────────────────────────
export interface HybridRetrievalQuery {
  person_id: string;
  query_intent: string;
  temporal_filter?: TemporalFrame;
  include_media?: boolean;
  required_verification?: MemoryVerificationStatus;
}

export interface HybridRetrievalResult {
  layer1_graph: {
    primary_caregiver: { name: string; relationship: string; phone: string };
    key_family_members: Array<{ name: string; relationship: string }>;
    grounded_locations: string[];
  };
  layer2_temporal: {
    past_anchors: string[];
    present_routine: string;
    future_events: FutureEvent[];
  };
  layer3_semantic: MemoryItem[];
  layer4_media: MediaAsset[];
  layer5_experience_memory: {
    effective_modalities: string[];
    effective_scaffolding: string[];
    recent_accuracy_rate: number;
    recommended_duration_mins: number;
  };
  layer6_capability: {
    autobiographical_recognition_score: number;
    executive_sequencing_score: number;
    free_recall_score: number;
    recommended_difficulty: 1 | 2 | 3;
    max_choices: 2 | 3;
  };
  layer7_cae_policy: {
    action: "engage_familiar" | "introduce_scaffold" | "soothe_fatigue";
    scaffold_progression: string;
    target_cognitive_family: "autobiographical_sequencing" | "prospective_orientation" | "executive_planning";
  };
  assembled_context_pack: PersonalGameContextPack;
}

