/**
 * MindMitra shared TypeScript types and domain definitions.
 * Follows the SIH 2026 PS26003 specification and DESIGN.md guidelines.
 */

export type RoleSurface = "person" | "caregiver" | "chw" | "clinical" | "demos" | "prototypes" | "assets";

export type PersonSection = "day" | "life" | "activity" | "help";

export interface PersonSession {
  personId: string;
  displayName: string;
  preferredLanguage: string;
  village: string;
}

export interface CompanionTurn {
  request_id: string;
  answer: string;
  intent: string;
  path: "deterministic" | "generated" | "fallback";
  sources: Array<{ fact_id: string; source_type: string; verified: boolean; text: string }>;
  gaps: string[];
  conflicting: boolean;
  hedged: boolean;
  safety_passed: boolean;
  speakable: boolean;
}

export interface VoiceCapability {
  provider: string;
  realtime_available: boolean;
  language: string;
  language_tier: string;
  speech_input_supported: boolean;
  speech_output_supported: boolean;
  fallback: string;
  note: string;
}

export interface CheckResultOut {
  check: string;
  passed: boolean;
  reason?: string | null;
}

export interface SafetyCheckResponse {
  passed: boolean;
  blocked_by: string | null;
  explanation: string;
  crisis_number: string | null;
  check_results: CheckResultOut[];
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
  gate: "sufficient" | "insufficient_data";
  q: number;
  message: string;
  language_mismatch: boolean;
  component_scores: Record<string, number>;
}

export interface PwmReadResponse {
  decision: "ALLOW" | "DENY";
  reason: string;
  fact?: {
    id: string;
    category: string;
    text: string;
    provenance: string;
  };
}

export interface SeedResponse {
  status: string;
  person_id: string;
  facts_count: number;
  consents_count: number;
}

export interface InjectDeclineResponse {
  days: number;
  card: {
    title: string;
    urgency: "L1" | "L2" | "L3" | "L4" | "L5";
    observation: string;
    hypothesis: string;
    action: string;
    timestamp: string;
    facts: Array<{ id: string; text: string; date: string }>;
  };
  alert: {
    level: string;
    domain: string;
    variance: string;
  };
}

export interface GeneratedAsset {
  id: string;
  title: string;
  description: string;
  category: "reminiscence" | "cultural" | "interface";
  imageSrc: string;
  prompt: string;
  createdAt: string;
}
