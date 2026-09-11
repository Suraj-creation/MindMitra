/**
 * MindMitra: Sarvam AI Integration Service
 * Provides full fallback for LLM conversational chat, Text-to-Speech (TTS), and Speech-to-Text (STT).
 * Specially optimized for Indic languages (Assamese, Hindi, Bengali, Indian English).
 */

export interface SarvamChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface SarvamTTSOptions {
  speaker?: "priya" | "ritu" | "aditya" | "pooja" | "neha" | "rohan";
  targetLanguageCode?: string; // e.g. "en-IN", "as-IN", "hi-IN"
  pace?: number;
}

const DEFAULT_SARVAM_KEY = "sk_591hdikc_WwGzsgMmBuV7JOGiqu7ah1iA";

export function getSarvamApiKey(): string {
  return (process.env.SARVAM_API_KEY || DEFAULT_SARVAM_KEY).trim();
}

/**
 * Chat completion via Sarvam AI API
 */
export async function callSarvamChat(
  prompt: string,
  options: SarvamChatOptions = {}
): Promise<{ text: string; model: string; latencyMs: number }> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error("Sarvam API key is not configured.");
  }

  const model = options.model || "sarvam-105b-conversations";
  const messages: Array<{ role: string; content: string }> = [];

  if (options.systemInstruction) {
    messages.push({
      role: "system",
      content: options.systemInstruction,
    });
  }

  if (Array.isArray(options.history) && options.history.length > 0) {
    for (const h of options.history) {
      messages.push({
        role: h.role,
        content: h.content,
      });
    }
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const start = Date.now();
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 300,
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sarvam Chat API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const choice = data.choices?.[0];
  const outputText = choice?.message?.content || "";

  return {
    text: outputText.trim(),
    model,
    latencyMs,
  };
}

/**
 * Text-to-Speech synthesis via Sarvam AI Bulbul v3
 */
export async function callSarvamTTS(
  text: string,
  options: SarvamTTSOptions = {}
): Promise<{ audioBase64: string; mimeType: string; latencyMs: number }> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error("Sarvam API key is not configured.");
  }

  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Text is required for TTS synthesis.");
  }

  const speaker = options.speaker || "priya";
  const targetLanguageCode = options.targetLanguageCode || "en-IN";

  const start = Date.now();
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      inputs: [cleanText],
      target_language_code: targetLanguageCode,
      speaker,
      model: "bulbul:v3",
      pace: options.pace ?? 0.95,
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sarvam TTS API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const audios = data.audios;
  if (!Array.isArray(audios) || audios.length === 0) {
    throw new Error("No audio content returned from Sarvam TTS.");
  }

  return {
    audioBase64: audios[0],
    mimeType: "audio/wav",
    latencyMs,
  };
}

/**
 * Speech-to-Text transcription via Sarvam AI Saaras v3
 */
export async function callSarvamSTT(
  audioBuffer: Buffer,
  mimeType: string = "audio/wav",
  languageCode: string = "as-IN"
): Promise<{ transcript: string; languageCode: string; latencyMs: number }> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error("Sarvam API key is not configured.");
  }

  const start = Date.now();
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", blob, "audio.wav");
  formData.append("model", "saaras:v3");
  formData.append("language_code", languageCode);

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: formData,
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sarvam STT API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  return {
    transcript: data.transcript || "",
    languageCode: data.language_code || languageCode,
    latencyMs,
  };
}

export const sarvamService = {
  isConfigured: () => Boolean(getSarvamApiKey()),
  getApiKey: getSarvamApiKey,
  chatCompletion: callSarvamChat,
  synthesizeSpeech: callSarvamTTS,
  transcribeAudio: callSarvamSTT,
};

