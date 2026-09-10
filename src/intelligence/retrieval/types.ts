import {
  ConsentScope,
  FamiliarPlace,
  FamiliarRoute,
  FutureEvent,
  GameGenerationMode,
  GameSpec,
  MediaAsset,
  MemoryExperienceHistory,
  MemoryItem,
  MemorySource,
  MemoryVerificationStatus,
  RouteSegment,
  SensitivityLevel,
  TemporalFrame,
  VisibilityScope,
} from "../../domain/cognitive-experience";

// ── 1. Preserved Metadata for All Retrieved Objects ─────────────────────────
export interface PreservedMetadata {
  id: string;
  type: "memory" | "place" | "route" | "media" | "person" | "voice_note" | "future_event" | "experience";
  provenance: string; // provenance_id or created_by
  verification: MemoryVerificationStatus;
  confidence: number;
  consent: ConsentScope;
  freshness: {
    created_at: string;
    updated_at: string;
    age_days: number;
    is_stale: boolean;
  };
  sensitivity: SensitivityLevel;
  visibility: VisibilityScope;
  is_verified: boolean;
  unverified_claim: boolean;
}

export interface BoundedRetrievedObject<T> {
  metadata: PreservedMetadata;
  data: T;
  search_metrics?: {
    lexical_score?: number;
    semantic_similarity?: number;
    graph_distance?: number;
    composite_relevance?: number;
  };
}

// ── 2. Candidate Structures with Explicit Ranking Breakdowns ─────────────────

export interface Game7RankingBreakdown {
  familiarity: number;           // 0.0 - 1.0 (weight 0.15)
  verification: number;          // 0.0 - 1.0 (weight 0.20)
  personal_relevance: number;    // 0.0 - 1.0 (weight 0.15)
  modality_availability: number; // 0.0 - 1.0 (weight 0.10)
  prior_engagement: number;      // 0.0 - 1.0 (weight 0.10)
  repetition_cooldown: number;   // 0.0 - 1.0 (weight 0.10) (1.0 = fresh, 0.0 = overused)
  emotional_appropriateness: number; // 0.0 - 1.0 (weight 0.05)
  current_context: number;       // 0.0 - 1.0 (weight 0.05)
  caregiver_eligibility: number; // 0.0 - 1.0 (weight 0.05)
  language_culture: number;      // 0.0 - 1.0 (weight 0.05)
  final_rank_score: number;      // 0.0 - 1.0 weighted composite
}

export interface ReminiscenceCandidate extends BoundedRetrievedObject<MemoryItem> {
  ranking: Game7RankingBreakdown;
  associated_media: MediaAsset[];
  associated_people: Array<{
    id: string;
    name: string;
    relationship: string;
    verified: boolean;
  }>;
  associated_voice_notes: Array<{
    id: string;
    speaker_name: string;
    relationship: string;
    audio_url: string;
    transcript: string;
    language: string;
    verified: boolean;
  }>;
  cultural_tags: string[];
  cooldown_suppressed: boolean;
}

export interface Game8RankingBreakdown {
  route_verification: number;    // 0.0 - 1.0 (weight 0.20)
  familiarity: number;           // 0.0 - 1.0 (weight 0.15)
  confidence: number;            // 0.0 - 1.0 (weight 0.15)
  recent_relevance: number;      // 0.0 - 1.0 (weight 0.10)
  destination_relevance: number; // 0.0 - 1.0 (weight 0.10)
  landmark_availability: number; // 0.0 - 1.0 (weight 0.10)
  route_completeness: number;    // 0.0 - 1.0 (weight 0.10)
  safety_eligibility: number;    // 0.0 - 1.0 (weight 0.10)
  final_rank_score: number;      // 0.0 - 1.0 weighted composite
}

export interface FamiliarRouteCandidate extends BoundedRetrievedObject<FamiliarRoute> {
  ranking: Game8RankingBreakdown;
  segments: RouteSegment[];
  start_place?: FamiliarPlace;
  destination_place?: FamiliarPlace;
  key_decision_points_count: number;
  sensory_cues_available: boolean;
  is_eligible_for_game: boolean;
}

export interface FamiliarPlaceCandidate extends BoundedRetrievedObject<FamiliarPlace> {
  associated_routes_count: number;
  sensory_cues_count: number;
  is_eligible_for_game: boolean;
}

// ── 3. Personalisation Context & Current Context ────────────────────────────

export interface PersonalisationContext {
  person: {
    id: string;
    display_name: string;
    honorific: string;
    preferred_language: string;
    culture: string;
    location: string;
  };
  capability: {
    recognition: number;
    photo_recognition: number;
    recall: number;
    audio_recall: number;
    sequencing: number;
    attention_span_minutes: number;
    guidance_tolerance: "high" | "moderate" | "minimal";
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

export interface CurrentContext {
  person_id: string;
  timestamp: string;
  time_of_day: "early_morning" | "morning" | "afternoon" | "evening" | "night";
  active_routine?: {
    id: string;
    name: string;
    time: string;
    items: string[];
  };
  upcoming_events: FutureEvent[];
  recent_fatigue_signals: string[];
  ambient_environment: {
    noise_level: "quiet" | "moderate" | "busy";
    lighting: "daylight" | "indoor_warm" | "dim";
  };
}

// ── 4. Purpose-Specific Game Context Packs ──────────────────────────────────

export interface Game7ContextPack {
  game_id: "game_7_reminiscence_journey";
  person_id: string;
  generated_at: string;
  snapshot_id: string;
  memories: ReminiscenceCandidate[];
  people: Array<{ id: string; name: string; relationship: string; verified: boolean; phone?: string }>;
  places: FamiliarPlaceCandidate[];
  music: Array<{
    id: string;
    title: string;
    genre: "bamboo_flute" | "tanpura_drone" | "bihu_folk" | "river_soundscape";
    cultural_origin: string;
    audio_url: string;
  }>;
  voice_recordings: Array<{
    id: string;
    speaker_name: string;
    relationship: string;
    audio_url: string;
    transcript: string;
    language: string;
    verified: boolean;
  }>;
  family_stories: Array<{
    id: string;
    memory_id: string;
    title: string;
    narrative: string;
    teller: string;
  }>;
  recent_experience: {
    sessions_count: number;
    average_engagement: number;
    recent_recalled_memory_ids: string[];
    suppressed_memory_ids: string[];
  };
  capability_context: PersonalisationContext["capability"];
  difficulty_recommendation: 1 | 2 | 3;
  firewall_audit: {
    passed: boolean;
    unverified_claims_flagged: number;
    private_items_blocked: number;
    sensitive_items_blocked: number;
    stale_items_blocked: number;
    cross_person_blocked: number;
  };
}

export interface Game8ContextPack {
  game_id: "game_8_route_builder";
  person_id: string;
  generated_at: string;
  snapshot_id: string;
  destination: FamiliarPlaceCandidate;
  route: FamiliarRouteCandidate;
  landmarks: Array<{
    id: string;
    name: string;
    order: number;
    visual_cue: string;
    sensory_description?: string;
    is_key_decision_point: boolean;
  }>;
  route_confidence: number;
  recent_route_experience: {
    sessions_count: number;
    average_latency_ms: number;
    route_success_rate: number;
    previous_routes_attempted: string[];
  };
  difficulty_recommendation: 1 | 2 | 3;
  scaffolding_recommendation: {
    mode: "visual_cue" | "family_voice" | "contextual_prompt" | "step_by_step";
    prompt: string;
    speaker?: string;
  };
  firewall_audit: {
    passed: boolean;
    unverified_claims_flagged: number;
    low_confidence_routes_excluded: number;
    private_items_blocked: number;
    sensitive_items_blocked: number;
    cross_person_blocked: number;
  };
}

// ── 5. Bounded LangGraph Orchestration State ────────────────────────────────

export type OrchestrationIntent =
  | { type: "play_game_7"; target_memory_id?: string; temporal_frame?: TemporalFrame }
  | { type: "play_game_8"; target_route_id?: string; target_destination_id?: string }
  | { type: "play_timeline"; target_memory_id?: string; mode?: string }
  | { type: "play_prepare_for"; target_event_id?: string }
  | { type: "preview_game_context"; game: "game_7" | "game_8" };

export interface LangGraphState {
  // 1. Intent
  intent: OrchestrationIntent;
  person_id: string;
  
  // 2. Context Retrieval
  raw_retrieved?: {
    memories: BoundedRetrievedObject<MemoryItem>[];
    places: BoundedRetrievedObject<FamiliarPlace>[];
    routes: BoundedRetrievedObject<FamiliarRoute>[];
    experiences: MemoryExperienceHistory[];
    personalisation: PersonalisationContext;
    current_context: CurrentContext;
  };
  firewall_passed: boolean;
  firewall_violations: string[];

  // 3. Candidate Ranking
  ranked_reminiscence_candidates?: ReminiscenceCandidate[];
  ranked_route_candidates?: FamiliarRouteCandidate[];

  // 4. Personalisation
  personalisation_pack?: {
    cultural_anchor: string;
    language: string;
    honorific: string;
    family_anchors: string[];
  };

  // 5. Difficulty
  selected_difficulty?: 1 | 2 | 3;
  scaffolding_choice?: {
    mode: "visual_cue" | "family_voice" | "contextual_prompt" | "step_by_step";
    hint_available: boolean;
    family_speaker?: string;
  };

  // 6. Game Template Selection
  selected_template?: "reminiscence_journey_my_world" | "route_builder_familiar_places" | "my_life_timeline" | "prepare_for";
  context_pack?: Game7ContextPack | Game8ContextPack;

  // 7. Specification Generation
  generated_spec?: GameSpec;
  snapshot_id?: string;
  reconstruction_hash?: string;
  
  // Execution tracking
  execution_steps: Array<{
    node: string;
    timestamp: string;
    duration_ms: number;
    status: "ok" | "failed" | "skipped";
    details?: string;
  }>;
  error?: string;
}
