import type {
  VoiceCapability,
  CompanionTurn,
  InjectDeclineResponse,
  SafetyCheckResponse,
  ObservationSignals,
  ObservationResponse,
  PwmReadResponse,
} from "../types";

export const api = {
  async getVoiceCapability(_token: string, personId: string): Promise<VoiceCapability> {
    try {
      const res = await fetch(`/v1/persons/${encodeURIComponent(personId)}/voice/capability`);
      if (!res.ok) throw new Error("Failed to fetch voice capability");
      return await res.json();
    } catch {
      return {
        supported: true,
        tier: "tier_1",
        default_voice: "as-IN-Standard-A",
        rate: 0.9,
        pitch: 1.0,
      };
    }
  },

  async sendCompanionTurn(
    _token: string,
    personId: string,
    message: string
  ): Promise<CompanionTurn> {
    const res = await fetch(`/v1/persons/${encodeURIComponent(personId)}/companion/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send companion turn");
    return await res.json();
  },

  async injectDecline(days: number): Promise<InjectDeclineResponse> {
    const res = await fetch("/v1/demo/inject-decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    if (!res.ok) throw new Error("Failed to inject decline");
    return await res.json();
  },

  async checkSafety(text: string): Promise<SafetyCheckResponse> {
    const res = await fetch("/v1/safety/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to check safety");
    return await res.json();
  },

  async submitObservation(
    personId: string,
    domain: string,
    score: number,
    signals: ObservationSignals
  ): Promise<ObservationResponse> {
    const res = await fetch("/v1/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId, domain, score, signals }),
    });
    if (!res.ok) throw new Error("Failed to submit observation");
    return await res.json();
  },

  async readPwmFact(
    actor: string,
    personId: string,
    fact: string,
    purpose: string
  ): Promise<PwmReadResponse> {
    const res = await fetch("/v1/pwm/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor, person_id: personId, fact_id: fact, purpose }),
    });
    if (!res.ok) throw new Error("Failed to read PWM fact");
    return await res.json();
  },
};
