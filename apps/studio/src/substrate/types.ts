/**
 * MindMitra Personal Intelligence Data Substrate — Domain Types & Ontological Contracts
 *
 * Implements the 10 core architectural domains:
 * 1. IDENTITY / ACCESS
 * 2. PERSONAL WORLD
 * 3. TEMPORAL
 * 4. CONVERSATION
 * 5. INTERACTION (Append-only Event Substrate)
 * 6. COGNITIVE EXPERIENCE (Experience Memory)
 * 7. PERSONAL INTELLIGENCE (Conditioned PCM, Assistance Policies, Goals)
 * 8. MEMORY (Governed Provenance & Lifecycle)
 * 9. KNOWLEDGE / ONTOLOGY (Typed Nodes & Edges)
 * 10. GOVERNANCE (Measurement Quality, Safety Gateway, Audit)
 * + MEDIA (Backblaze B2 Metadata)
 */

// ── 1. IDENTITY / ACCESS ───────────────────────────────────────────────────

export type RoleType =
  | "person"
  | "primary_caregiver"
  | "secondary_caregiver"
  | "asha_chw"
  | "clinician"
  | "admin"
  | "auditor"
  | "system";

export type KinshipType =
  | "self"
  | "daughter"
  | "son"
  | "granddaughter"
  | "grandson"
  | "spouse"
  | "sibling"
  | "friend"
  | "neighbour"
  | "asha_worker"
  | "doctor"
  | "caregiver";

export type ConsentCategory =
  | "personal_identity"
  | "life_story_memory"
  | "activity_telemetry"
  | "voice_biometrics"
  | "clinical_observations"
  | "location_context"
  | "media_assets"
  | "assistance_policies";

export type ConsentPurpose =
  | "personalisation"
  | "care_coordination"
  | "clinical_review"
  | "emergency_safety"
  | "research"; // Strictly restricted

export interface PersonRecord {
  person_id: string;
  tenant_id: string;
  display_name: string;
  given_name?: string;
  family_name?: string;
  preferred_language: string; // e.g. "as" (Assamese), "bn", "hi", "en"
  secondary_languages?: string[];
  language_tier: "tier_1" | "tier_2" | "tier_3";
  cultural_profile: {
    region: string; // "Tezpur, Sonitpur, Assam"
    traditions: string[];
    dietary_rituals: string[];
    music_preferences: string[];
    address_honorific: string; // "Purnima baideu" / "Aitâ"
  };
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ActorAccount {
  actor_id: string;
  person_id: string;
  role: RoleType;
  display_name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  relationship_to_person?: KinshipType;
  created_at: string;
}

export interface ConsentGrant {
  consent_id: string;
  person_id: string;
  grantee_actor_id: string;
  grantee_role: RoleType;
  category: ConsentCategory;
  purpose: ConsentPurpose;
  is_granted: boolean;
  granted_by: string; // Actor ID or "person:self"
  granted_at: string;
  revoked_at?: string | null;
  valid_until?: string | null;
}

// ── 2. PERSONAL WORLD ──────────────────────────────────────────────────────

export type TemporalFrame = "past" | "present" | "future";

export interface PersonalEntity {
  entity_id: string;
  person_id: string;
  entity_type: "person" | "place" | "object" | "life_event" | "story" | "music" | "fact";
  name: string;
  description: string;
  temporal_frame: TemporalFrame;
  cultural_notes?: string;
  is_verified: boolean;
  provenance_id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonContact {
  contact_id: string;
  person_id: string;
  full_name: string;
  call_name: string; // e.g. "Anu", "Rina"
  kinship: KinshipType;
  relationship_label: string; // "Daughter (Elder)", "Granddaughter in Guwahati"
  location: string;
  phone: string;
  is_emergency_contact: boolean;
  call_priority: number;
  photo_media_id?: string;
  familiarity_score: number; // 0.0 - 1.0
  notes?: string;
}

export interface PlaceEntity {
  place_id: string;
  person_id: string;
  name: string; // "Ancestral Courtyard", "Brahmaputra Ghat"
  location_type: "home" | "ancestral" | "town" | "clinic" | "sacred" | "garden";
  significance: string;
  emotional_valence: "very_positive" | "calming" | "neutral" | "sensitive";
  media_ids?: string[];
}

export interface LifeEventEntity {
  event_id: string;
  person_id: string;
  title: string;
  description: string;
  year_or_era: string; // "1972", "Spring 1985", "Every Rongali Bihu"
  season?: string;
  associated_place_id?: string;
  associated_people_ids: string[];
  associated_media_ids: string[];
  emotional_valence: "uplifting" | "nostalgic" | "peaceful";
  narrative_snippet: string;
}

// ── 3. TEMPORAL & ROUTINES ─────────────────────────────────────────────────

export type EventStatus = "expected" | "confirmed" | "occurred" | "cancelled";

export interface TemporalEvent {
  temporal_event_id: string;
  person_id: string;
  title: string;
  description: string;
  temporal_frame: TemporalFrame;
  event_status: EventStatus;
  scheduled_at: string;
  duration_minutes?: number;
  valid_from: string;
  valid_to: string;
  source: string;
  location?: string;
  associated_person_id?: string;
}

export interface DailyRoutine {
  routine_id: string;
  person_id: string;
  title: string; // "Evening Cardamom Tea with Anu"
  time_of_day: "morning" | "midday" | "afternoon" | "evening" | "night";
  scheduled_time: string; // "16:00"
  importance: "essential" | "calming" | "social" | "nourishment";
  steps: RoutineStep[];
  preferred_assistance_strategy: string; // "visual_initiation_cue"
}

export interface RoutineStep {
  step_id: string;
  step_number: number;
  label: string; // "Boil water with ginger and cardamom"
  cue_text: string;
  media_cue_id?: string;
  assistance_trigger_seconds: number; // if hesitation > 30s
}

// ── 4. CONVERSATION ────────────────────────────────────────────────────────

export interface ConversationSession {
  session_id: string;
  person_id: string;
  surface: string; // "day" | "life" | "activity" | "people" | "help" | "companion_drawer"
  started_at: string;
  ended_at?: string;
  modality: "voice" | "touch" | "multimodal";
  total_turns: number;
  dominant_affect?: string;
}

export interface ConversationTurn {
  turn_id: string;
  session_id: string;
  person_id: string;
  role: "user" | "assistant" | "system";
  text: string;
  audio_b2_key?: string;
  latency_ms: number;
  intent: string;
  entities_referenced: string[];
  safety_passed: boolean;
  action_triggered?: {
    type: string;
    target: string;
    payload?: any;
  };
  provenance_id: string;
  created_at: string;
}

// ── 5. INTERACTION & EVENT SUBSTRATE (Append-Only) ─────────────────────────

export type InteractionSignal =
  | "start"
  | "completion"
  | "abandonment"
  | "retry"
  | "hesitation"
  | "backtracking"
  | "help_request"
  | "hint_request"
  | "repeated_action"
  | "response_latency"
  | "interruption"
  | "navigation_failure"
  | "replay"
  | "pause_resume"
  | "assistant_typed_action"
  | "ASSISTANT_TYPED_ACTION";

export interface InteractionEvent {
  event_id: string;
  person_id: string;
  session_id: string;
  timestamp: string;
  surface: string; // e.g. "day", "life", "activity", "people", "help"
  route: string;
  component: string;
  event_type: InteractionSignal;
  entity_id?: string;
  activity_id?: string;
  conversation_id?: string;
  input_modality: "touch" | "voice" | "gesture" | "system";
  language: string; // "as", "bn", "en", etc.
  duration_ms?: number;
  latency_ms?: number;
  result: "success" | "partial" | "abandoned" | "assisted" | "failed" | "neutral";
  assistance_level: "none" | "visual_cue" | "relational_voice_cue" | "step_demonstration" | "caregiver_guided";
  measurement_quality_score?: number; // 0.0 - 1.0
  provenance_id: string;
  metadata?: Record<string, any>;
}

// ── 6. COGNITIVE EXPERIENCE & EXPERIENCE MEMORY ────────────────────────────

export interface CognitiveActivity {
  activity_id: string;
  slug: string; // "family_memory_match", "flower_garland_sequencing", "tea_routine_ordering"
  name: string;
  cognitive_domain: "memory" | "attention" | "executive" | "language" | "spatial" | "reminiscence";
  target_objective: string;
  modality: "touch" | "voice" | "photo+voice" | "multimodal";
  supported_difficulties: Array<"recognition" | "cued_recall" | "free_recall" | "sequencing">;
  cultural_adaptation: {
    region: string;
    motifs: string[];
    familiar_items: string[];
  };
}

export interface ExperienceEpisode {
  episode_id: string;
  person_id: string;
  activity_id: string;
  activity_name: string;
  timestamp: string;
  context: {
    time_of_day: string;
    environment: string; // "familiar_living_room", "noisy_courtyard"
    companions_present: string[]; // ["daughter:anu"]
    fatigue_level: "low" | "moderate" | "high";
    temporal_frame: TemporalFrame;
  };
  cognitive_objective: string; // "family_person_recognition"
  content_bound: string[]; // ["person:rina", "person:anu", "place:tezpur_home"]
  difficulty: "recognition" | "cued_recall" | "free_recall" | "sequencing";
  modality: string; // "photo+voice"
  content_familiarity: "highly_familiar" | "moderate" | "novel";
  assistance_used: {
    scaffolding_level: string; // "visual_relational_cue"
    cues_offered: string[];
    successful_cue?: string;
  };
  response: {
    recognition_success: boolean;
    cued_recall_success: boolean;
    free_recall_success: boolean;
    response_latency_ms: number;
    hesitation_detected: boolean;
    abandoned: boolean;
    help_requests_count: number;
  };
  engagement: {
    voluntary_initiation: boolean;
    completed: boolean;
    affect_signal: "peaceful" | "smiling" | "neutral" | "anxious" | "withdrawn";
  };
  measurement_quality: {
    score: number; // 0.0 - 1.0
    gate: "sufficient" | "insufficient_data";
    reasons: string[];
  };
  human_feedback?: {
    caregiver_note?: string;
    chw_note?: string;
    observed_post_mood?: string;
  };
  learned_implication: {
    strategy_effectiveness: "effective" | "neutral" | "ineffective";
    recommended_hint: string;
    task_category: string;
  };
  provenance_id: string;
}

// ── 7. PERSONAL INTELLIGENCE: CAPABILITY, POLICIES & GOALS ─────────────────

export interface CapabilityObservation {
  observation_id: string;
  person_id: string;
  domain:
    | "memory_recognition"
    | "memory_cued_recall"
    | "memory_free_recall"
    | "working_memory"
    | "attention_sustained"
    | "executive_sequencing"
    | "executive_initiation"
    | "language_comprehension"
    | "orientation_time_place"
    | "functional_adl_assistance";
  observed_value: number; // 0.0 - 100.0 or assistance grade
  confidence: number; // 0.0 - 1.0
  condition_tags: string[]; // ["morning", "familiar_home", "daughter_present", "low_noise"]
  source_episode_id: string;
  measurement_quality_gate: "sufficient" | "insufficient_data";
  observed_at: string;
  provenance_id: string;
}

export interface PersonalCapabilityState {
  state_id: string;
  person_id: string;
  domain: string;
  conditioned_estimate: string; // e.g. "Reliable face recognition with visual cue; free recall of names unprompted requires assistance"
  numeric_estimate?: number;
  uncertainty: number; // 0.0 - 1.0 (higher = wider tolerance)
  condition_tags: string[]; // e.g. ["familiar_environment", "morning", "low_noise"]
  trend: "stable" | "improving" | "gradual_decline" | "variable" | "insufficient_data";
  evidence_count: number;
  last_observed_at: string;
  updated_at: string;
}

export interface AssistancePolicy {
  policy_id: string;
  person_id: string;
  task_domain: string; // e.g. "familiar_person_recall", "tea_routine_ordering", "time_orientation"
  preferred_strategy: string; // "visual_recognition_first", "relational_voice_cue", "step_by_step_visual"
  fallback_strategy: string; // "relational_voice_cue", "gentle_caregiver_call"
  confidence: number; // 0.0 - 1.0
  evidence_count: number;
  success_rate: number;
  last_reinforced_at: string;
  condition_constraints: string[];
  is_clinician_locked?: boolean;
}

export interface PersonalGoal {
  goal_id: string;
  person_id: string;
  statement: string; // "Keep making my own cardamom tea with Anu in the afternoon"
  language: string; // "as", "en"
  scope: "momentary_intention" | "daily_goal" | "standing_goal";
  source: "person_stated" | "caregiver_stated" | "inferred_from_routine";
  status: "active" | "supported" | "at_risk" | "achieved" | "paused";
  required_capabilities: string[];
  safety_class: "everyday" | "needs_supervision" | "needs_clinical_input";
  target_routine_id?: string;
  created_at: string;
  updated_at: string;
}

// ── 8. MEMORY: GOVERNED PROVENANCE & LIFECYCLE ─────────────────────────────

export type MemoryAuthorityClass =
  | "system/authoritative"
  | "person verified"
  | "family confirmed"
  | "caregiver reported"
  | "CHW reported"
  | "clinician/system record"
  | "user utterance"
  | "behavioral observation"
  | "inferred"
  | "model generated";

export type MemoryLifecycleState =
  | "candidate"
  | "active"
  | "reinforced"
  | "stale"
  | "superseded"
  | "conflicted"
  | "retracted"
  | "private"
  | "shared";

export type EvidenceVerificationLevel =
  | "verified"
  | "reported"
  | "observed"
  | "inferred"
  | "conflicted"
  | "unknown";

export interface MemoryItem {
  memory_id: string;
  person_id: string;
  statement: string; // "Granddaughter Rina studies computer science in Guwahati and loves Purnima's til pitha."
  category: "biography" | "preference" | "family" | "routine" | "medical_care" | "sensory_comfort";
  temporal_frame: TemporalFrame;
  authority_class: MemoryAuthorityClass;
  lifecycle_state: MemoryLifecycleState;
  evidence_level: EvidenceVerificationLevel;
  confidence: number;
  valid_from: string;
  valid_to?: string | null;
  superseded_by?: string | null;
  provenance_id: string;
  reinforcement_count: number;
  last_reinforced_at: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryEvidenceLink {
  link_id: string;
  memory_id: string;
  evidence_type: "interaction_event" | "experience_episode" | "conversation_turn" | "media_photo" | "caregiver_log" | "chw_report";
  evidence_id: string;
  source_authority: MemoryAuthorityClass;
  confidence_contribution: number;
  notes?: string;
  created_at: string;
}

// ── 9. KNOWLEDGE & ONTOLOGY ────────────────────────────────────────────────

export type OntologyNodeType =
  | "Person"
  | "Relationship"
  | "Kinship"
  | "Place"
  | "Object"
  | "LifeEvent"
  | "Story"
  | "Photo"
  | "Video"
  | "Music"
  | "Routine"
  | "RoutineStep"
  | "Reminder"
  | "Task"
  | "Activity"
  | "ActivitySession"
  | "ActivityStep"
  | "Attempt"
  | "Assistance"
  | "Outcome"
  | "Goal"
  | "Intention"
  | "Preference"
  | "Observation"
  | "Capability"
  | "ExperienceEpisode"
  | "Memory"
  | "Conversation"
  | "ConversationTurn"
  | "Action"
  | "Event"
  | "Language"
  | "CulturalConcept"
  | "Appointment"
  | "Visit"
  | "Organization"
  | "CareContext";

export type OntologyRelationshipType =
  | "PERSON_HAS_RELATIONSHIP_PERSON"
  | "PERSON_LIVES_AT_PLACE"
  | "PERSON_KNOWS_PERSON"
  | "PERSON_REMEMBERS_EVENT"
  | "PHOTO_DEPICTS_PERSON"
  | "PHOTO_ASSOCIATED_WITH_EVENT"
  | "EVENT_OCCURRED_AT_PLACE"
  | "EVENT_INVOLVES_PERSON"
  | "PERSON_ENJOYS_MUSIC"
  | "PERSON_HAS_ROUTINE_ROUTINE"
  | "ACTIVITY_SESSION_INSTANCE_OF_ACTIVITY"
  | "ACTIVITY_SESSION_USED_MEDIA_PHOTO"
  | "ACTIVITY_SESSION_GENERATED_OBSERVATION"
  | "OBSERVATION_SUPPORTS_CAPABILITY"
  | "EXPERIENCE_USED_STRATEGY_ASSISTANCE_POLICY"
  | "CONVERSATION_REFERENCES_ENTITY"
  | "CONVERSATION_RESULTED_IN_ACTION"
  | "ACTION_PRODUCED_OUTCOME"
  | "PERSON_HOLDS_GOAL"
  | "GOAL_DRAWS_ON_CAPABILITY"
  | "MEMORY_GROUNDED_IN_EVIDENCE";

export interface OntologyNode {
  node_id: string;
  person_id: string;
  node_type: OntologyNodeType;
  label: string;
  canonical_name: string;
  properties: Record<string, any>;
  embedding_vector?: number[];
  created_at: string;
  updated_at: string;
}

export interface OntologyEdge {
  edge_id: string;
  person_id: string;
  relationship: OntologyRelationshipType;
  source_node_id: string;
  target_node_id: string;
  temporal_metadata: {
    valid_from: string;
    valid_to?: string | null;
    observed_at?: string;
    occurred_at?: string;
    superseded_at?: string | null;
  };
  evidence_level: EvidenceVerificationLevel;
  confidence: number;
  provenance_id: string;
}

// ── 10. GOVERNANCE & AUDIT ─────────────────────────────────────────────────

export interface ProvenanceRecord {
  provenance_id: string;
  source_class: MemoryAuthorityClass;
  author_actor_id: string; // e.g. "actor:anu", "person:purnima", "system:tablet_sensor", "model:gemini"
  verification_status: EvidenceVerificationLevel;
  verified_by?: string;
  timestamp: string;
  certifier_role?: RoleType;
  digital_signature?: string;
  context_hash?: string;
}

export interface MeasurementQualityRecord {
  record_id: string;
  event_id?: string;
  episode_id?: string;
  audibility: number; // 0.0 - 1.0
  visibility: number; // 0.0 - 1.0
  fatigue_factor: number; // 0.0 - 1.0
  assistance_factor: number; // 1.0 (unassisted) down to 0.0 (fully assisted)
  device_factor: number; // 1.0 or 0.0
  subject_confirmed: boolean;
  language_match: boolean;
  composite_score: number;
  dominant_issue: string | null;
  gate: "sufficient" | "insufficient_data";
  evaluated_at: string;
}

export interface AuditEventRecord {
  audit_id: string;
  actor_id: string;
  person_id: string;
  action: "READ" | "WRITE" | "DELETE" | "REVOKE" | "FIREWALL_DENY" | "FIREWALL_ALLOW" | "MODEL_GENERATED_GUARD";
  target_table: string;
  target_id: string;
  purpose: string;
  result: "SUCCESS" | "DENIED" | "GUARD_BLOCKED";
  reason?: string;
  timestamp: string;
}

// ── MEDIA METADATA (Backblaze B2 Object Integration) ───────────────────────

export interface MediaMetadataRecord {
  media_id: string;
  person_id: string;
  b2_object_key: string; // e.g. "media/person_purnima/photos/bihu_courtyard_1985.jpg"
  b2_bucket: string; // e.g. "mindmitra-secure-vault"
  mime_type: string; // "image/jpeg", "audio/mp4"
  byte_size: number;
  dimensions?: { width: number; height: number };
  duration_seconds?: number;
  semantic_description: string;
  depicted_person_ids: string[];
  associated_place_id?: string;
  associated_event_id?: string;
  historical_date_text?: string; // "April 1985, Rongali Bihu"
  consent_scope: ConsentCategory;
  provenance_id: string;
  created_at: string;
}
