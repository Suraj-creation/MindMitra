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

export interface CompanionTurn {
  answer: string;
  sources?: Array<{
    id: string;
    title: string;
    type?: string;
    confidence?: number;
  }>;
  suggestedAction?: string;
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
