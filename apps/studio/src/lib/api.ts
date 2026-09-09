/**
 * Typed API client for the MindMitra backend.
 *
 * In production this connects to the FastAPI server. In dev it reads
 * NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 *
 * Types are GENERATED from the backend OpenAPI schema (@mindmitra/domain) —
 * no hand-mirrored duplicates. Regenerate with `pnpm gen:types`; CI fails on
 * drift (tech-stack.md §38, CLAUDE.md §6).
 */

import type {
  BaselineResponse,
  ConsentGrantView,
  InjectDeclineResponse,
  ObservationResponse,
  ObservationSignals,
  PwmReadResponse,
  SafetyCheckResponse,
  SeedResponse,
} from "@mindmitra/domain";
import type { PersonSession } from "@/lib/person-session";

export type {
  Alert,
  BaselineResponse,
  CaregiverCard,
  CardFact,
  CardHypothesis,
  ConsentGrantView,
  InjectDeclineResponse,
  ObservationResponse,
  ObservationSignals,
  ProvenanceEnvelope,
  PwmReadResponse,
  SeedResponse,
  SeedScenario,
} from "@mindmitra/domain";

// The safety endpoint's response is exported under a friendlier name.
export type { SafetyCheckResponse as SafetyCheckResult } from "@mindmitra/domain";

const BASE = typeof window !== "undefined" ? "" : (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : "");

export type CompanionAction = {
  type: "navigate" | "call_contact" | "start_activity" | "play_music" | "show_media";
  label: string;
  target?: string;
  phone?: string;
  payload?: any;
};

export type CompanionVoiceMeta = {
  persona: string;
  recommended_pitch: number;
  recommended_rate: number;
  emotion: string;
};

export type CompanionTurn = {
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
  action?: CompanionAction | null;
  voice_meta?: CompanionVoiceMeta;
  crisis_number?: string | null;
  obligations?: string[];
};

export type VoiceCapability = {
  provider: string;
  realtime_available: boolean;
  language: string;
  language_tier: string;
  speech_input_supported: boolean;
  speech_output_supported: boolean;
  fallback: string;
  note: string;
};

type DeviceLoginResponse = {
  access_token: string;
};

type MeResponse = {
  subject_kind: "human" | "person_device";
  persons: Array<{
    person_id: string;
    display_name: string;
    role: string;
    preferred_language: string;
    language_tier: string;
  }>;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

function authorisedHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function getAuthorised<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: authorisedHeaders(token),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function postAuthorised<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authorisedHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async loginDevice(personId: string, deviceSecret: string): Promise<{ accessToken: string }> {
    const response = await post<DeviceLoginResponse>("/v1/auth/device-login", {
      person_id: personId,
      device_secret: deviceSecret,
    });
    return { accessToken: response.access_token };
  },

  async getPersonSession(token: string): Promise<PersonSession> {
    const identity = await getAuthorised<MeResponse>("/v1/auth/me", token);
    const person = identity.persons.find((candidate) => candidate.role === "person");
    if (!person || identity.subject_kind !== "person_device") {
      throw new Error("This tablet is not connected to a person profile.");
    }
    return { personId: person.person_id, displayName: person.display_name };
  },

  sendCompanionTurn: (
    token: string,
    personId: string,
    message: string,
    context?: {
      surface?: string;
      current_entity?: string;
      current_task?: string;
      history?: Array<{ role: "user" | "assistant"; text: string }>;
    },
  ) =>
    postAuthorised<CompanionTurn>(`/v1/persons/${personId}/companion/turn`, token, {
      message,
      surface: context?.surface,
      current_entity: context?.current_entity,
      current_task: context?.current_task,
      history: context?.history,
      speakable: true,
    }),

  getVoiceCapability: (token: string, personId: string) =>
    getAuthorised<VoiceCapability>(`/v1/persons/${personId}/voice/capability`, token),

  submitObservation: (
    person_id: string,
    domain: string,
    value: number,
    signals: ObservationSignals,
  ) =>
    post<ObservationResponse>("/v1/observations", {
      person_id,
      domain,
      value,
      signals,
    }),

  checkSafety: (text: string, role_target = "primary_caregiver") =>
    post<SafetyCheckResponse>("/v1/safety/check", { text, role_target }),

  getBaseline: (person_id: string, domain: string) =>
    get<BaselineResponse>(`/v1/baseline/${person_id}/${domain}`),

  // Observation → baseline → alert → caregiver card
  injectDecline: (days: number) =>
    post<InjectDeclineResponse>("/v1/demo/inject-decline", { days }),

  // Memory Firewall demo
  seedDemo: () => post<SeedResponse>("/v1/demo/seed", {}),

  readPwmFact: (
    actor_id: string,
    person_id: string,
    fact_id: string,
    purpose: string,
  ) =>
    post<PwmReadResponse>("/v1/pwm/read", {
      actor_id,
      person_id,
      fact_id,
      purpose,
    }),

  grantConsent: (person_id: string, grantee_role: string, category: string, purpose: string) =>
    post<ConsentGrantView>("/v1/identity/consent/grant", {
      person_id,
      grantee_role,
      category,
      purpose,
    }),

  revokeConsent: (person_id: string, grantee_role: string, category: string, purpose: string) =>
    post<ConsentGrantView>("/v1/identity/consent/revoke", {
      person_id,
      grantee_role,
      category,
      purpose,
    }),

  health: () => get<{ status: string; app: string; env: string }>("/health"),
};
