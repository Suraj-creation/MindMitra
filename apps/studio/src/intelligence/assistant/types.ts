/**
 * MindMitra Conversational Intelligence Architecture (Phase 3)
 * Typed Contracts for Intent/Goal Model, Action Model, Next-Best-Assistance & Multimodal Payloads
 */

import type { KinshipType, RoleType } from "@/substrate/types";

// ── 1. INTENT & GOAL MODEL ──────────────────────────────────────────────────

export type UtteranceIntentType =
  | "talk_about_today"
  | "see_person"
  | "find_photo"
  | "remember_something"
  | "ask_about_memory"
  | "see_what_happened_yesterday"
  | "play_something"
  | "start_activity"
  | "continue_activity"
  | "navigate_somewhere"
  | "see_reminders"
  | "create_reminder"
  | "play_music"
  | "call_someone"
  | "get_help"
  | "orient_to_situation"
  | "stop_leave_activity"
  | "unknown_conversational";

export type GoalStatus =
  | "candidate"
  | "confirmed"
  | "active"
  | "completed"
  | "abandoned";

export interface ConversationGoal {
  goal_id: string;
  session_id: string;
  intent_type: UtteranceIntentType;
  title: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  target_entity?: string;
  target_action?: string;
  context_clues: Record<string, any>;
}

// ── 2. NEXT-BEST-ASSISTANCE DECISION CLASSES ────────────────────────────────

export type NextBestAssistanceClass =
  | "ANSWER"
  | "SHOW"
  | "NAVIGATE"
  | "REMIND"
  | "START_ACTIVITY"
  | "CONTINUE_ACTIVITY"
  | "CALL_PERSON"
  | "PLAY_MUSIC"
  | "ORIENT"
  | "ASK_CLARIFICATION"
  | "HUMAN_HANDOFF"
  | "DO_NOTHING";

// ── 3. TYPED ACTION MODEL ───────────────────────────────────────────────────

export type ActionType =
  | "show_person"
  | "show_photo"
  | "show_memory"
  | "navigate_to"
  | "start_activity"
  | "resume_activity"
  | "play_music"
  | "create_reminder"
  | "request_human_help"
  | "call_person"
  | "show_routine"
  | "show_timeline";

export interface TypedAction<T = any> {
  action_id: string;
  type: ActionType;
  label: string;
  target?: string;
  parameters: T;
  authorized: boolean;
  consent_verified: boolean;
  audit_id?: string;
  status: "pending" | "executed" | "denied" | "failed";
  error?: string;
}

export interface ShowPersonParams {
  person_id: string;
  display_name: string;
  relationship: KinshipType;
  phone?: string;
  avatar_url?: string;
  recent_topic?: string;
}

export interface ShowPhotoParams {
  asset_id: string;
  url: string;
  caption: string;
  year?: number;
  season?: string;
  location?: string;
  depicted_people: string[];
}

export interface ShowMemoryParams {
  memory_id: string;
  headline: string;
  narrative: string;
  approx_year?: number;
  tags: string[];
  verified: boolean;
}

export interface NavigateToParams {
  section: "day" | "life" | "activity" | "people" | "help";
  subview?: string;
  highlight_id?: string;
}

export interface StartActivityParams {
  activity_id: string;
  title: string;
  step_index: number;
  total_steps: number;
  difficulty: "gentle" | "moderate" | "guided";
  cue_level: "none" | "visual" | "verbal" | "demonstration";
}

export interface PlayMusicParams {
  track_id: string;
  title: string;
  genre: "bamboo_flute" | "bihu_folk" | "naam_kirtan" | "instrumental";
  artist?: string;
  calming_score: number;
}

export interface CreateReminderParams {
  reminder_id: string;
  title: string;
  scheduled_time: string;
  recurrence?: "daily" | "once";
  requires_caregiver_ack: boolean;
}

export interface CallPersonParams {
  contact_id: string;
  name: string;
  phone: string;
  role: RoleType;
  relationship?: KinshipType;
}

export interface ShowRoutineParams {
  time_of_day: "morning" | "afternoon" | "evening" | "night";
  items: Array<{ id: string; time: string; label: string; completed: boolean }>;
}

export interface ShowTimelineParams {
  target_day: "today" | "yesterday" | string;
  events: Array<{ time: string; description: string; category: string }>;
}

// ── 4. MULTIMODAL RESPONSE PAYLOADS ─────────────────────────────────────────

export interface PersonCardPayload {
  person_id: string;
  display_name: string;
  relationship: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
}

export interface PhotoCardPayload {
  asset_id: string;
  url: string;
  title: string;
  caption: string;
  year?: number;
  place?: string;
  people?: string[];
}

export interface MemoryCardPayload {
  memory_id: string;
  title: string;
  detail: string;
  year?: number;
  verified: boolean;
  provenance: string;
}

export interface MusicCardPayload {
  track_id: string;
  title: string;
  genre: string;
  duration_seconds: number;
  is_playing: boolean;
}

export interface ActivityCardPayload {
  activity_id: string;
  title: string;
  current_step: string;
  step_number: number;
  total_steps: number;
  assistance_hint?: string;
}

export interface RoutineCardPayload {
  date_label: string;
  time_of_day: string;
  scheduled_items: Array<{
    time: string;
    label: string;
    completed: boolean;
    urgent?: boolean;
  }>;
}

export interface MultimodalPayload {
  spoken_text: string;
  display_text: string;
  person_card?: PersonCardPayload;
  photo_card?: PhotoCardPayload;
  memory_card?: MemoryCardPayload;
  music_card?: MusicCardPayload;
  activity_card?: ActivityCardPayload;
  routine_card?: RoutineCardPayload;
  action?: TypedAction;
}

// ── 5. CURRENT CONTEXT MODEL ────────────────────────────────────────────────

export interface UIClientContext {
  surface?: "day" | "life" | "activity" | "people" | "help" | string;
  current_entity?: string;
  current_photo_id?: string;
  current_person_id?: string;
  current_task?: string;
  activity_state?: {
    activity_id: string;
    title: string;
    step: number;
    total_steps: number;
    attempts_on_step: number;
    difficulty: "gentle" | "moderate" | "guided";
    last_cue?: "visual" | "verbal" | "physical";
  };
  recent_utterances?: Array<{ role: "user" | "assistant"; text: string; timestamp?: string }>;
}

// ── 6. EXPERIENCE LEARNING & MEMORY LIFECYCLE ───────────────────────────────

export interface ExperienceEpisodeCandidate {
  episode_id: string;
  person_id: string;
  task_context: string;
  cue_provided: string;
  cue_modality: "visual_photo" | "verbal_prompt" | "demonstration" | "auditory";
  outcome: "success" | "partial_success" | "frustration" | "unresponsive";
  latency_seconds?: number;
  measurement_quality: number;
  notes: string;
  recorded_at: string;
}

export interface MemoryProposalCandidate {
  proposal_id: string;
  person_id: string;
  statement: string;
  category: "preference" | "routine" | "kinship_detail" | "interest";
  confidence: number;
  source_turn: string;
  requires_caregiver_confirmation: boolean;
}

// ── 7. ASSISTANT TURN RESULT ────────────────────────────────────────────────

export interface AssistantTurnResponse {
  turn_id: string;
  session_id: string;
  person_id: string;
  utterance: string;
  inferred_intent: UtteranceIntentType;
  confidence: number;
  resolved_context: {
    surface: string;
    active_entity?: string;
    in_activity: boolean;
    time_of_day: string;
  };
  active_goals: ConversationGoal[];
  next_best_assistance: NextBestAssistanceClass;
  multimodal: MultimodalPayload;
  grounding: {
    is_grounded: boolean;
    evidence_count: number;
    conflicts_detected: boolean;
    unknown_detected: boolean;
    hedged: boolean;
  };
  action_result?: {
    executed: boolean;
    action_type: ActionType;
    audit_id?: string;
    details?: any;
  };
  experience_evidence?: ExperienceEpisodeCandidate;
  memory_proposal?: MemoryProposalCandidate;
  safety: {
    passed: boolean;
    crisis_routed: boolean;
    crisis_number?: string;
  };
}
