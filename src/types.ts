export type RoleSurface =
  | "person"
  | "caregiver"
  | "asha"
  | "clinical"
  | "demos"
  | "prototypes"
  | "assets";

export type PersonSection = "day" | "life" | "activity" | "help";

export interface VoiceCapability {
  supported: boolean;
  tier: string;
  default_voice: string;
  rate?: number;
  pitch?: number;
}

export interface PersonSession {
  personId: string;
  displayName: string;
  preferredLanguage: string;
  village: string;
}

export interface CompanionAction {
  type: "navigate" | "call_contact" | "start_activity" | "play_music" | "show_media" | "provide_scaffold" | "set_reminder";
  label: string;
  target?: string;
  phone?: string;
  payload?: Record<string, any>;
}

export interface CompanionVoiceMeta {
  persona: string;
  recommended_pitch: number;
  recommended_rate: number;
  emotion?: string;
  audio_base64?: string;
}

export interface UIContextContract {
  surface: RoleSurface;
  route?: string;
  page?: string; // "day" | "life" | "activity" | "people" | "help" | etc.
  visible_entity?: {
    type: "person" | "photo" | "event" | "routine" | "medication";
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
  } | null;
  active_game?: {
    game_id: string;
    title: string;
    task_type?: string;
    round_id?: string | number;
    current_question?: string;
    current_task_index?: number;
    total_tasks?: number;
    scaffold_level?: string;
    allowed_actions?: string[];
  } | null;
  current_task?: string;
  audio_playing?: boolean;
}

export interface CompanionTurn {
  request_id?: string;
  answer: string;
  asText?: string; // Assamese translation
  intent?: string;
  path?: "deterministic" | "generated";
  provider?: "google_gemini" | "sarvam_ai" | "deterministic";
  model?: string;
  latency_ms?: number;
  sources?: Array<{
    id?: string;
    fact_id?: string;
    title?: string;
    text?: string;
    source_type?: string;
    verified?: boolean;
    confidence?: number;
  }>;
  suggestedAction?: string;
  action?: CompanionAction | null;
  voice_meta?: CompanionVoiceMeta;
  context_snapshot?: UIContextContract;
  safety_passed?: boolean;
  speakable?: boolean;
}

export interface InjectDeclineResponse {
  days: number;
  attention_exhaustion?: number;
  status?: string;
  priorities?: string[];
  card?: {
    title: string;
    urgency: "L1" | "L2" | "L3" | string;
    observation: string;
    hypothesis: string;
    action: string;
    timestamp: string;
    facts: Array<{ id: string; text: string; date: string }>;
  };
  alert?: {
    level: string;
    domain: string;
    variance: string;
  } | string;
}

export interface SafetyCheckResponse {
  allowed: boolean;
  blocked_rules: Array<{ code: string; label: string }>;
  is_crisis: boolean;
  helpline?: string;
  clean_text?: string;
}

export interface ObservationSignals {
  audibility: number;
  snr: number;
  camera_lighting: number;
  touch_jitter: number;
  battery_low: boolean;
  network_rtt_ms: number;
  language_detected: string;
}

export interface ObservationResponse {
  quality_score: number;
  accepted: boolean;
  flags: string[];
  deviation_from_baseline: number;
}

export interface PwmReadResponse {
  allowed: boolean;
  actor: string;
  purpose: string;
  fact: string;
  reason?: string;
}

export interface UserOnboardingProfile {
  completed: boolean;
  name: string;
  honorific: "aita" | "baideu" | "custom";
  place: string;
  subplace: string;
  language: string;
  joys: string[];
  sensitivities: string[];
  trustedCaregiverName: string;
  trustedCaregiverPhone: string;
  completedAt?: string;
}

