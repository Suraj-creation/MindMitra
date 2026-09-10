export type TemporalFrame = "past" | "childhood" | "young_adulthood" | "later_life" | "recent" | "present" | "future";
export type MemoryVerificationStatus = "unverified" | "caregiver_verified" | "chw_verified" | "clinician_verified";
export type MemorySource = "person" | "caregiver" | "chw" | "clinician" | "system_obs" | "model_inference";
export type ConsentScope = "person_only" | "family" | "games" | "reminiscence" | "all";
export type VisibilityScope = "private" | "family" | "clinical";
export type SensitivityLevel = "low" | "medium" | "high";

export interface MediaAsset {
  id: string;
  person_id: string;
  storage_key: string;
  media_type: "photo" | "audio" | "video" | "document";
  mime_type: string;
  thumbnail_url?: string;
  url: string;
  title: string;
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
  provenance_id: string;
  status: "active" | "archived";
}

export interface MemoryMedia {
  id: string;
  memory_id: string;
  media_asset_id: string;
  role: "primary_photo" | "supporting_photo" | "voice_note" | "document";
  caption?: string;
  display_order: number;
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryPerson {
  id: string;
  memory_id: string;
  person_entity_id: string;
  name: string;
  relationship: string;
  role_in_memory?: string; // e.g. "groom", "student", "companion"
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryVoiceNote {
  id: string;
  memory_id: string;
  media_asset_id?: string;
  speaker_name: string;
  relationship: string;
  audio_url: string;
  transcript: string;
  language: string; // e.g. "as", "en", "hi"
  duration_seconds?: number;
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
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
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
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
  created_by: string;
  created_at: string;
  updated_at: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

export interface FamiliarPlace {
  id: string;
  person_id: string;
  name: string;
  assamese_name?: string;
  category: "home" | "school" | "workplace" | "river_ghat" | "temple_naamghar" | "tea_garden" | "market" | "veranda_courtyard" | "relative_home" | "other";
  significance: string; // Personal meaning e.g. "Safe primary residence near river"
  description: string;
  landmark_cues: string[]; // e.g. ["Old veranda with green bamboo railing", "Courtyard mango tree"]
  sensory_cues?: {
    visual?: string[];
    auditory?: string[];
    olfactory?: string[];
  };
  approximate_period?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null; // Optional: coordinates never required for cognitive games
  media_refs: string[]; // media_asset IDs
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

export interface RouteSegment {
  id: string;
  route_id: string;
  segment_order: number;
  from_landmark: string;
  to_landmark: string;
  visual_cue: string;
  sensory_description?: string;
  turn_instruction?: "straight" | "turn_left" | "turn_right" | "arrive" | "cross_courtyard";
  photo_asset_id?: string;
  is_key_decision_point: boolean;
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamiliarRoute {
  id: string;
  person_id: string;
  title: string;
  assamese_title?: string;
  description: string;
  start_place_id: string;
  destination_place_id: string;
  routine_frequency?: "daily" | "weekly" | "past_routine" | "occasional";
  estimated_walk_time_mins?: number;
  difficulty: 1 | 2 | 3;
  segments?: RouteSegment[];
  source: MemorySource;
  verification_status: MemoryVerificationStatus;
  confidence: number;
  consent_scope: ConsentScope;
  visibility_scope: VisibilityScope;
  sensitivity: SensitivityLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

export interface MemoryExperienceHistory {
  id: string;
  person_id: string;
  game_key: "reminiscence_journey_my_world" | "route_builder_familiar_places" | "my_life_timeline" | "prepare_for" | "experience_braid" | string;
  target_entity_type: "memory" | "place" | "route";
  target_entity_id: string;
  interaction_type: "recognition" | "sequencing" | "landmark_identification" | "voice_reminiscence" | "route_tracing";
  latency_ms: number;
  assistance_level: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
  recall_success: boolean;
  engagement_score: number; // 0.0 - 1.0
  notes?: string;
  recorded_at: string;
}

export interface GameContextSnapshot {
  id: string;
  person_id: string;
  game_key: "reminiscence_journey_my_world" | "route_builder_familiar_places" | string;
  snapshot_timestamp: string;
  capability_summary: {
    recognition: number;
    photo_recognition: number;
    recall: number;
    sequencing: number;
    recommended_difficulty: 1 | 2 | 3;
    max_choice_count: 2 | 3 | 4;
  };
  eligible_memories_count: number;
  eligible_places_count: number;
  eligible_routes_count: number;
  eligible_memory_ids: string[];
  eligible_place_ids: string[];
  eligible_route_ids: string[];
  verification_hash: string;
  created_at: string;
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
    places: Array<FamiliarPlace | { id: string; name: string; significance: string }>;
    routes?: FamiliarRoute[];
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
  step_name?: string;
  stimulus?: string;
  user_selection?: string;
  is_correct?: boolean;
  is_success?: boolean;
  latency_ms: number;
  assistance_level: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
  hint_used?: boolean;
  hints_used_count?: number;
  completion_state?: "success" | "assisted" | "skipped";
  measurement_quality_q?: number;
  item_id?: string;
  item_type?: string;
  presented_at?: string;
  responded_at?: string;
  modality?: string;
  difficulty_level?: number;
  user_action?: string;
  notes?: string;
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
    environment?: string;
    session_duration_sec?: number;
    offline_generated?: boolean;
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
    applied?: boolean;
    reason_if_skipped?: string;
  };
  created_at: string;
  trials_telemetry?: GameTrialTelemetry[];
  skips_count?: number;
  completion_status?: "completed" | "abandoned" | "paused" | string;
  provenance_audit?: {
    verified_records_count?: number;
    unverified_records_count?: number;
    data_layer_version?: string;
    [key: string]: any;
  };

  // Extended Personal Cognitive Data Layer dimensions
  game_template?: string;
  game_spec_id?: string;
  target_content?: {
    memory_ids?: string[];
    place_ids?: string[];
    route_id?: string;
    waypoints?: string[];
    people_refs?: string[];
  };
  difficulty?: number;
  scaffolding_level?: string;
  modality?: string;
  assistance?: {
    level: "none" | "visual_cue" | "family_voice" | "caregiver_prompt";
    assisted_count: number;
    assistance_rate: number;
  };
  hints?: {
    requested_count: number;
    types_used: string[];
  };
  completion?: {
    completed_gracefully: boolean;
    all_steps_completed: boolean;
    keepsake_woven: boolean;
  };
  skip?: {
    skipped_count: number;
    skipped_step_indices: number[];
  };
  engagement?: {
    score: number;
    qualitative: "high_interest" | "calm_contentment" | "mild_hesitation" | "rest_requested";
  };
  interaction_quality?: {
    mean_latency_ms: number;
    latency_variance?: number;
    touch_target_stability: "steady" | "mild_hesitation" | "assisted";
    fatigue_detected: boolean;
  };
  measurement_quality_details?: {
    q_score: number;
    valid_for_capability_update: boolean;
    degradation_reasons: string[];
  };
  provenance?: {
    provenance_refs: string[];
    verified_by_actors: string[];
    verification_status_summary: string;
  };
  cross_game_implications?: {
    recognized_place_ids?: string[];
    struggled_landmark_ids?: string[];
    recommended_next_game?: string;
    recommended_scaffolding_level?: string;
  };
  idempotency_key?: string;
}

// ── TEMPORAL ORIENTATION ENGINE DOMAIN MODELS ───────────────────────────────

export type TemporalEventType =
  | "family_visit"
  | "routine_tea"
  | "market_trip"
  | "festival"
  | "medical_appointment"
  | "community_activity"
  | "courtyard_routine"
  | "cultural_preparation";

export type TemporalEventStatus = "expected" | "confirmed" | "occurred" | "cancelled";

export type ScaffoldLevel = "S0" | "S1" | "S2" | "S3" | "S4" | "S5";

export interface TemporalEvent {
  id: string;
  person_id: string;
  event_type: TemporalEventType;
  title: string;
  assamese_title?: string;
  description: string;
  start_at: string; // ISO timestamp
  end_at?: string;
  temporal_frame: "past" | "recent" | "present" | "future";
  status: TemporalEventStatus;
  confidence: number;
  verification_status: MemoryVerificationStatus;
  provenance: string;
  source: MemorySource;
  consent_scope: ConsentScope;
  sensitivity: SensitivityLevel;
  valid_from: string;
  valid_until?: string;
  people_refs: Array<{
    person_entity_id: string;
    name: string;
    relationship: string;
    verified: boolean;
    photo_url?: string;
  }>;
  media_refs: string[];
  location: string;
  routine_anchor_id?: string;
  created_at: string;
  updated_at: string;
}

export type TemporalOrientationTemplateKey = "daily_orientation" | "temporal_sorting" | "temporal_story";

export interface ScaffoldStep {
  level: ScaffoldLevel;
  title: string;
  instruction: string;
  cue_text?: string;
  photo_url?: string;
  voice_speaker?: string;
  voice_transcript?: string;
  voice_audio_url?: string;
  options?: Array<{
    id: string;
    label: string;
    assamese_label?: string;
    is_target?: boolean;
  }>;
  full_resolution?: string;
}

export interface TemporalOrientationContextPack {
  person: {
    id: string;
    display_name: string;
    honorific: string;
    preferred_language: string;
    culture: string;
    location: string;
  };
  now: {
    current_local_date: string;
    day_of_week: string;
    assamese_day: string;
    part_of_day: "morning" | "afternoon" | "evening" | "night";
    assamese_part_of_day: string;
    current_routine: string;
    current_environment: string;
    local_time_formatted: string;
  };
  yesterday: {
    events: TemporalEvent[];
    meaningful_anchor?: TemporalEvent;
    narrative_summary: string;
    assamese_summary: string;
  };
  today: {
    events: TemporalEvent[];
    routines: Array<{ id: string; name: string; assamese_name?: string; time: string; items: string[] }>;
    meaningful_anchor?: TemporalEvent;
    narrative_summary: string;
    assamese_summary: string;
  };
  tomorrow: {
    events: TemporalEvent[];
    meaningful_anchor?: TemporalEvent;
    narrative_summary: string;
    assamese_summary: string;
    has_confirmed_event: boolean;
  };
  familiar_people: Array<{
    id: string;
    name: string;
    relationship: string;
    verified: boolean;
    photo_url?: string;
  }>;
  media_assets: MediaAsset[];
  cultural_context: {
    season: string;
    assamese_season: string;
    upcoming_cultural_anchor?: string;
    customary_greeting: string;
  };
  capability: {
    present_orientation: number;
    recent_recognition: number;
    recent_recall: number;
    future_recognition: number;
    future_recall: number;
    temporal_ordering: number;
    photo_support_utility: number;
    voice_support_utility: number;
    recommended_scaffolding_start: ScaffoldLevel;
  };
  constraints: {
    language: string;
    consent_active: boolean;
    sensitive_events_excluded: number;
    cancelled_events_excluded: number;
    stale_events_excluded: number;
  };
  provenance_ids: string[];
  snapshot_id: string;
  generated_at: string;
}

export interface TemporalOrientationSpec {
  id: string;
  person_id: string;
  template_key: TemporalOrientationTemplateKey;
  version: string;
  generation_mode: GameGenerationMode;
  title: string;
  assamese_title: string;
  subtitle: string;
  objective: string;
  cognitive_family: "temporal_orientation" | "prospective_awareness" | "temporal_sequencing";
  temporal_frames: Array<"yesterday" | "today" | "tomorrow">;
  anchors: {
    recent: {
      event_id?: string;
      title: string;
      assamese_title?: string;
      description: string;
      photo_url?: string;
      person_name?: string;
      relationship?: string;
      provenance: string;
    };
    current: {
      routine_id?: string;
      title: string;
      assamese_title?: string;
      description: string;
      time_of_day: string;
      provenance: string;
    };
    upcoming: {
      event_id?: string;
      title: string;
      assamese_title?: string;
      description: string;
      person_name?: string;
      relationship?: string;
      is_confirmed: boolean;
      provenance: string;
    };
  };
  tasks: Array<{
    task_id: string;
    task_primitive:
      | "temporal_recognition"
      | "temporal_classification"
      | "recent_event_recognition"
      | "future_event_recognition"
      | "temporal_sorting"
      | "temporal_story_reflection";
    prompt: string;
    assamese_prompt: string;
    temporal_target: "yesterday" | "today" | "tomorrow";
    interactive_type: "orient_narrative" | "tap_sort" | "choice_match" | "story_step";
    sort_items?: Array<{
      id: string;
      title: string;
      assamese_title?: string;
      correct_frame: "yesterday" | "today" | "tomorrow";
      icon_type?: string;
      photo_url?: string;
      person_label?: string;
    }>;
    choice_options?: Array<{
      id: string;
      label: string;
      assamese_label?: string;
      is_target: boolean;
      photo_url?: string;
    }>;
    scaffolding_ladder: Record<ScaffoldLevel, ScaffoldStep>;
  }>;
  difficulty_profile: {
    present_orientation_level: number;
    recent_recall_mode: "photo_cued" | "choice_based" | "open_prompt";
    future_recall_mode: "choice_based" | "narrative_anchored";
    scaffolding_mode: "adaptive" | "gentle_encouragement";
  };
  spoken_guidance: {
    greeting: string;
    orientation_prompt: string;
    encouragement: string;
    comfort_phrase: string;
  };
  provenance_refs: string[];
  validation_status: {
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
    all_passed: boolean;
    validation_timestamp: string;
    validation_errors?: string[];
  };
  snapshot_id: string;
  expires_at?: string;
}

export interface TemporalOrientationTrialTelemetry {
  session_id: string;
  trial_index: number;
  task_primitive: string;
  temporal_frame: "yesterday" | "today" | "tomorrow" | "all";
  stimulus: string;
  user_selection?: string;
  latency_ms: number;
  scaffold_level_used: ScaffoldLevel;
  hints_requested_count: number;
  assistance_provided: "none" | "contextual_cue" | "photo_voice_cue" | "narrowed_choices" | "full_support";
  completion_state: "success" | "assisted" | "gracefully_skipped";
  compromised_trial: boolean;
  compromise_reasons?: string[];
  valid_for_baseline: boolean;
  timestamp: string;
}

