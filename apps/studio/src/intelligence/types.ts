/**
 * MindMitra Phase 2 — Context Intelligence, Hybrid Retrieval & Governed Orchestration
 *
 * Ontological types and contracts for:
 * 1. Typed Interaction Context (Frontend & Backend context representation)
 * 2. Personal Context Pack (L0-L9 Context Hierarchy & server-side assembly)
 * 3. 6-Lane Hybrid Retrieval (Graph, Temporal, Semantic, Lexical, Media, Structured)
 * 4. Structured Evidence Pack (Confidence, Verification, Provenance, Conflict Detection)
 * 5. Grounding & Anti-Hallucination Guardrails
 * 6. Session & Conversation Compression
 * 7. Governed Orchestration (Agentic RAG with attention budget)
 */

// ── 1. TYPED INTERACTION CONTEXT ──────────────────────────────────────────

export type SurfaceType =
  | "day"
  | "life"
  | "activity"
  | "people"
  | "help"
  | "companion_drawer"
  | "substrate"
  | "clinical_bridge"
  | string;

export interface InteractionContext {
  current_surface: SurfaceType;
  current_route: string; // e.g. "/person/day", "/person/activity/flower_garland"
  current_component: string; // e.g. "PersonDayView", "GarlandSequencingCard"
  current_entity?: string; // e.g. "person:rina", "place:tezpur_home"
  current_media?: string; // photo/video/music asset ID or B2 object key
  current_activity?: string; // e.g. "flower_garland_sequencing"
  current_activity_session?: string; // session ID
  current_activity_step?: number; // step number (e.g. 1, 2, 3)
  current_question_attempt?: number; // attempt index
  current_goal?: string; // e.g. "reminisce about Bihu", "make cardamom tea"
  current_modality: "voice" | "touch" | "multimodal";
  current_language: string; // e.g. "as" (Assamese), "bn", "hi", "en"
  current_session: string; // session ID
}

// ── 2. CONTEXT HIERARCHY (L0 - L9) ────────────────────────────────────────

export type ContextLayerId =
  | "L0_current_utterance"
  | "L1_current_conversation"
  | "L2_current_ui_context"
  | "L3_recent_events"
  | "L4_experience_memory"
  | "L5_personal_world"
  | "L6_capability_preferences"
  | "L7_long_term_memories"
  | "L8_future_context"
  | "L9_external_knowledge";

export interface ContextLayerSpec {
  layer_id: ContextLayerId;
  name: string;
  description: string;
  priority: number; // 0 = highest, 9 = lowest
  estimated_tokens: number;
  always_included?: boolean;
}

export const CONTEXT_LAYERS: Record<ContextLayerId, ContextLayerSpec> = {
  L0_current_utterance: {
    layer_id: "L0_current_utterance",
    name: "Current Utterance",
    description: "The immediate query or prompt spoken or tapped by Purnima",
    priority: 0,
    estimated_tokens: 30,
    always_included: true,
  },
  L1_current_conversation: {
    layer_id: "L1_current_conversation",
    name: "Conversation / Session State",
    description: "Recent compressed multi-turn dialogue within this session",
    priority: 1,
    estimated_tokens: 80,
    always_included: true,
  },
  L2_current_ui_context: {
    layer_id: "L2_current_ui_context",
    name: "UI & Interaction State",
    description: "Active surface, route, component, on-screen entity, and ongoing activity step",
    priority: 2,
    estimated_tokens: 50,
    always_included: true,
  },
  L3_recent_events: {
    layer_id: "L3_recent_events",
    name: "Recent Events & Interactions",
    description: "Interaction telemetry and occurrences from today or yesterday",
    priority: 3,
    estimated_tokens: 90,
  },
  L4_experience_memory: {
    layer_id: "L4_experience_memory",
    name: "Cognitive Experience Memory",
    description: "Past cognitive exercises, hesitation signals, and learned implications",
    priority: 4,
    estimated_tokens: 110,
  },
  L5_personal_world: {
    layer_id: "L5_personal_world",
    name: "Personal World Model",
    description: "Immediate family kinship (Anu, Rina, Bikash), ancestral places, and photos",
    priority: 5,
    estimated_tokens: 120,
  },
  L6_capability_preferences: {
    layer_id: "L6_capability_preferences",
    name: "Conditioned Capabilities & Assistance Policies",
    description: "Conditioned capability states and learned assistance strategies",
    priority: 6,
    estimated_tokens: 85,
  },
  L7_long_term_memories: {
    layer_id: "L7_long_term_memories",
    name: "Long-Term Governed Memories",
    description: "Verified life stories, biography, and enduring emotional anchors",
    priority: 7,
    estimated_tokens: 130,
  },
  L8_future_context: {
    layer_id: "L8_future_context",
    name: "Future Context & Appointments",
    description: "Upcoming phone calls, visits, clinic appointments, and scheduled routines",
    priority: 8,
    estimated_tokens: 70,
  },
  L9_external_knowledge: {
    layer_id: "L9_external_knowledge",
    name: "External Grounded Knowledge",
    description: "Assam cultural calendar (Rongali Bihu), Tele-MANAS helpline 14416",
    priority: 9,
    estimated_tokens: 60,
  },
};

// ── 3. HYBRID RETRIEVAL LANES ─────────────────────────────────────────────

export type RetrievalLane =
  | "GRAPH"
  | "TEMPORAL"
  | "SEMANTIC"
  | "LEXICAL"
  | "MEDIA"
  | "STRUCTURED";

export type QueryShape =
  | "what_now" // e.g. "What should I do now?" -> time + routine + recent activity + capability + preference + future context + goal
  | "who_is" // e.g. "Who is Rina?" -> graph + verified relationship + relevant context
  | "what_did_i_do" // e.g. "What did I do yesterday?" -> temporal events + activity episodes + conversation events + routine events
  | "show_media" // e.g. "Show me my wedding photos" -> lexical/semantic intent + graph + event + media retrieval
  | "activity_help" // e.g. "How do I make the tea?" -> structured routine steps + assistance policy + capability
  | "general_companion"; // General empathic reassurance

// ── 4. STRUCTURED EVIDENCE PACK ───────────────────────────────────────────

export type GroundingVerificationLevel =
  | "verified"
  | "reported"
  | "observed"
  | "inferred"
  | "conflicted"
  | "unknown";

export interface EvidenceItem {
  evidence_id: string;
  entity_id: string;
  source_type:
    | "ontology_graph"
    | "temporal_event"
    | "daily_routine"
    | "memory_vault"
    | "b2_media"
    | "experience_episode"
    | "capability_state"
    | "assistance_policy"
    | "personal_goal"
    | "contact_record"
    | "place_record"
    | "external_safety";
  source_id: string;
  claim_or_statement: string;
  relevance: number; // 0.0 - 1.0
  verification: GroundingVerificationLevel;
  confidence: number; // 0.0 - 1.0
  validity: "valid" | "expired" | "superseded" | "uncertain";
  timestamp: string;
  retrieval_lane: RetrievalLane;
  authorization_scope: string; // e.g. "consent:life_story_memory"
  provenance: {
    author: string;
    source_class: string;
    authority_class: string;
  };
}

export interface EvidenceConflict {
  fact_a_id: string;
  fact_a_statement: string;
  fact_b_id: string;
  fact_b_statement: string;
  conflict_description: string;
}

export interface EvidencePack {
  request_id: string;
  query: string;
  person_id: string;
  total_evidence_count: number;
  items: EvidenceItem[];
  retrieval_lanes_used: RetrievalLane[];
  grounding_summary: {
    verified_count: number;
    partially_verified_count: number;
    conflicting_count: number;
    unknown_count: number;
  };
  conflicts_detected: EvidenceConflict[];
  attention_budget_tokens: number;
  generated_at: string;
}

// ── 5. PERSONAL CONTEXT PACK ──────────────────────────────────────────────

export interface PersonalContextPack {
  context_version: string;
  person_id: string;
  actor_id: string;
  generated_at: string;
  authoritative_time: {
    iso: string;
    formatted_date: string;
    formatted_time: string;
    time_of_day: "morning" | "midday" | "afternoon" | "evening" | "night";
    day_of_week: string;
    timezone: string;
    region_label: string; // "Tezpur, Sonitpur District, Assam"
  };
  interaction_context: InteractionContext;
  selected_layers: ContextLayerId[];

  identity: {
    person_id: string;
    display_name: string;
    honorific: string;
    preferred_language: string;
    language_tier: string;
    cultural_profile: {
      region: string;
      traditions: string[];
      music_preferences: string[];
      dietary_rituals: string[];
    };
  };

  conversation_state: {
    session_id: string;
    active_turns_count: number;
    compressed_summary?: string;
    recent_dialogue: Array<{ role: "user" | "assistant"; text: string }>;
  };

  recent_interactions: Array<{
    surface: string;
    event_type: string;
    timestamp: string;
    result: string;
  }>;

  relevant_people: Array<{
    contact_id: string;
    name: string;
    call_name: string;
    kinship: string;
    relationship_label: string;
    location: string;
    phone: string;
    call_priority: number;
    familiarity_score: number;
  }>;

  relevant_places: Array<{
    place_id: string;
    name: string;
    significance: string;
    emotional_valence: string;
  }>;

  relevant_memories: Array<{
    memory_id: string;
    statement: string;
    category: string;
    authority_class: string;
    verification: GroundingVerificationLevel;
    confidence: number;
  }>;

  relevant_events: Array<{
    event_id: string;
    title: string;
    description: string;
    temporal_frame: string;
    time_label: string;
    status: string;
  }>;

  relevant_media: Array<{
    media_id: string;
    b2_key: string;
    description: string;
    historical_date: string;
    depicted_people: string[];
  }>;

  routines: Array<{
    routine_id: string;
    title: string;
    time_of_day: string;
    scheduled_time: string;
    assistance_strategy: string;
  }>;

  reminders: Array<{
    reminder_id: string;
    title: string;
    due_time: string;
    target: string;
    is_urgent: boolean;
  }>;

  capabilities: Array<{
    domain: string;
    conditioned_estimate: string;
    confidence: number;
    trend: string;
  }>;

  assistance_policies: Array<{
    task_domain: string;
    preferred_strategy: string;
    fallback_strategy: string;
    confidence: number;
  }>;

  future_context: Array<{
    title: string;
    scheduled_at: string;
    status: string;
    relationship_involved?: string;
  }>;

  permissions_and_consent: {
    actor_role: string;
    authorized_categories: string[];
    firewall_status: "passed" | "partially_masked" | "blocked";
  };

  uncertainty: Array<{ domain: string; level: number; note: string }>;
  conflicts: EvidenceConflict[];
  safety_constraints: string[];
}

// ── 6. CONTEXT COMPRESSION ────────────────────────────────────────────────

export interface CompressedSession {
  session_id: string;
  person_id: string;
  compressed_at: string;
  turns_processed: number;
  session_summary: string;
  important_entities: string[];
  active_goals: string[];
  meaningful_decisions: string[];
  actions_triggered: string[];
  outcomes: string[];
  candidate_memories: Array<{
    statement: string;
    category: string;
    source: string;
    requires_confirmation: boolean;
  }>;
  experience_indicators: {
    receptivity: "high" | "moderate" | "low";
    hesitation_noted: boolean;
    assistance_useful: boolean;
  };
}

// ── 7. GOVERNED ORCHESTRATION & AGENTIC RAG ───────────────────────────────

export interface OrchestratorPlan {
  detected_intent: string;
  primary_goal: string;
  query_shape: QueryShape;
  required_layers: ContextLayerId[];
  required_retrieval_lanes: RetrievalLane[];
  attention_budget_tokens: number;
  retrieval_steps: Array<{
    lane: RetrievalLane;
    tool_name: string;
    rationale: string;
  }>;
  requires_second_hop: boolean;
  requires_action: boolean;
  requires_clarification: boolean;
}

export interface GovernedOrchestrationResult {
  orchestration_id: string;
  query: string;
  interaction_context: InteractionContext;
  plan: OrchestratorPlan;
  evidence_pack: EvidencePack;
  grounding_evaluation: {
    is_grounded: boolean;
    confidence: number;
    has_conflicts: boolean;
    unknown_facts_detected: boolean;
    reasoning: string;
    unsupported_claims: string[];
  };
  answer: string;
  action?: {
    type: "navigate" | "call_contact" | "start_activity" | "play_music" | "show_media";
    label: string;
    target?: string;
    phone?: string;
    payload?: any;
  } | null;
  attention_budget_used_tokens: number;
  audit_id: string;
  obligations?: string[];
  crisis_number?: string | null;
}
