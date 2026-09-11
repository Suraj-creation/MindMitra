import type {
  VoiceCapability,
  CompanionTurn,
  InjectDeclineResponse,
  SafetyCheckResponse,
  ObservationSignals,
  ObservationResponse,
  PwmReadResponse,
} from "../types";
import type { ExperienceSpec } from "../intelligence/experience/types";

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
    message: string,
    context?: any,
    history?: Array<{ role: "user" | "assistant"; text: string }>,
    language?: "as" | "en"
  ): Promise<CompanionTurn> {
    const res = await fetch(`/v1/persons/${encodeURIComponent(personId)}/companion/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        surface: context?.surface || "person",
        page: context?.page || "day",
        route: context?.route,
        visible_entity: context?.visible_entity,
        active_game: context?.active_game,
        current_task: context?.current_task,
        history,
        language: language || "as",
      }),
    });
    if (!res.ok) throw new Error("Failed to send companion turn");
    return await res.json();
  },

  async synthesizeSpeech(text: string, language: string = "en-IN", speaker: string = "priya"): Promise<string> {
    const res = await fetch("/api/tts/sarvam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language_code: language, speaker }),
    });
    if (!res.ok) throw new Error("TTS synthesis failed");
    const data = await res.json();
    return data.audioBase64;
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

  // ── Caregiver Copilot Dedicated APIs ──
  async getCaregiverOverview(): Promise<any> {
    const res = await fetch("/v1/caregiver/overview");
    if (!res.ok) throw new Error("Failed to fetch caregiver overview");
    return await res.json();
  },

  async updateSupportLevel(level: number, reason: string): Promise<any> {
    const res = await fetch("/v1/caregiver/support-level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, reason }),
    });
    if (!res.ok) throw new Error("Failed to update support level");
    return await res.json();
  },

  async toggleCareTask(taskId: string): Promise<any> {
    const res = await fetch(`/v1/caregiver/tasks/${encodeURIComponent(taskId)}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to toggle care task");
    return await res.json();
  },

  async postponeCareTask(taskId: string, minutes = 30): Promise<any> {
    const res = await fetch(`/v1/caregiver/tasks/${encodeURIComponent(taskId)}/postpone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    if (!res.ok) throw new Error("Failed to postpone care task");
    return await res.json();
  },

  async submitCareObservation(category: string, note: string, tags: string[] = []): Promise<any> {
    const res = await fetch("/v1/caregiver/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, note, tags }),
    });
    if (!res.ok) throw new Error("Failed to submit care observation");
    return await res.json();
  },

  async queryCaregiverCopilot(question: string): Promise<any> {
    const res = await fetch("/v1/caregiver/copilot/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to query caregiver copilot");
    return await res.json();
  },

  async getClinicalBrief(): Promise<any> {
    const res = await fetch("/v1/caregiver/clinical-brief");
    if (!res.ok) throw new Error("Failed to fetch clinical brief");
    return await res.json();
  },

  // ── Experience Engine ──
  //
  // planExperience never throws for "nothing to offer": a `no_data` result is
  // a normal answer the caller must render as a plain sentence, not an error
  // state (Section 34). Only a transport failure rejects.
  async planExperience(input: {
    personId: string;
    trigger?: "lets_do_something" | "conversation" | "deep_link";
    conversationText?: string;
    preferTemplate?: string;
    language?: "as" | "en";
    maxChoices?: number;
  }): Promise<ExperiencePlanResponse> {
    const res = await fetch("/v1/experiences/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: input.personId,
        trigger: input.trigger || "lets_do_something",
        conversation_text: input.conversationText,
        prefer_template: input.preferTemplate,
        language: input.language || "en",
        max_choices: input.maxChoices,
      }),
    });
    if (!res.ok) throw new Error("Failed to plan experience");
    return await res.json();
  },

  async getExperience(personId: string, specId: string): Promise<ExperiencePlanResponse> {
    const res = await fetch(
      `/v1/experiences/${encodeURIComponent(specId)}?person_id=${encodeURIComponent(personId)}`
    );
    if (!res.ok) {
      return { status: "no_data", message: "That activity isn't available any more." };
    }
    return await res.json();
  },
};

export interface ExperiencePlanResponse {
  status: "ready" | "no_data" | "invalid" | "not_found";
  spec?: ExperienceSpec;
  message?: string;
}
