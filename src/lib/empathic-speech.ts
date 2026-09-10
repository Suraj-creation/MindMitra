/**
 * Empathic Voice Synthesis System for MindMitra
 *
 * Provides natural, gentle, emotionally warm female voice synthesis
 * specifically tuned for elder engagement (Purnima Devi, Tezpur, Assam).
 *
 * Prioritizes high-fidelity Natural / Neural female voices across modern browsers
 * with calm, unhurried pacing (rate: ~0.88, pitch: ~1.06).
 */

export type VoiceOption = {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNatural: boolean;
};

// Cache loaded voices
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

/**
 * Finds the highest quality, most natural female voice available.
 * Prioritizes:
 * 1. Natural / Neural Indian English female voices (e.g., Neerja, Heera, Google हिन्दी/English)
 * 2. Natural / Neural British / International female voices (e.g., Sonia, Libby, Google UK English Female)
 * 3. Natural / Neural American female voices (e.g., Jenny, Aria, Samantha)
 * 4. Any female voice with clean pronunciation
 */
export function findBestEmpathicVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  // Ranked heuristics for warm female voices
  const prioritizedKeywords = [
    // Indian English female natural/neural
    (v: SpeechSynthesisVoice) => (v.lang.includes("en-IN") || v.lang.includes("hi-IN")) && (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Female") || v.name.includes("Neerja") || v.name.includes("Heera")),
    // UK English female natural/neural (known for gentle cadence)
    (v: SpeechSynthesisVoice) => v.lang.includes("en-GB") && (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Sonia") || v.name.includes("Libby") || v.name.includes("Female")),
    // Google UK English Female
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("google uk english female"),
    // US English female natural (Jenny, Aria, Samantha)
    (v: SpeechSynthesisVoice) => (v.name.includes("Jenny") || v.name.includes("Aria") || v.name.includes("Samantha")) && (v.name.includes("Natural") || v.name.includes("Neural")),
    // General Indian English
    (v: SpeechSynthesisVoice) => v.lang.includes("en-IN"),
    // General English female
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira")),
    // Any natural/neural English
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Neural")),
    // Any English voice
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
  ];

  for (const matchFn of prioritizedKeywords) {
    const candidate = voices.find(matchFn);
    if (candidate) return candidate;
  }

  return voices[0] || null;
}

export type SpeakOptions = {
  text: string;
  voice?: SpeechSynthesisVoice | null;
  pitch?: number; // default ~1.06
  rate?: number;  // default ~0.88 (unhurried and elder-accessible)
  volume?: number; // default 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakEmpathicText(options: SpeakOptions): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Stop any previous speech immediately (smooth interruption)
  window.speechSynthesis.cancel();

  const text = options.text?.trim();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = options.voice || findBestEmpathicVoice();

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "en-IN";
  }

  // Melodic, warm, unhurried female acoustic parameters
  utterance.pitch = options.pitch ?? 1.06;
  utterance.rate = options.rate ?? 0.88;
  utterance.volume = options.volume ?? 1.0;

  if (options.onStart) {
    utterance.onstart = options.onStart;
  }

  utterance.onend = () => {
    currentUtterance = null;
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (err) => {
    currentUtterance = null;
    if (options.onError) options.onError(err);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function speakWarmly(text: string, options?: Partial<SpeakOptions>): void {
  speakEmpathicText({ text, ...options });
}

export function cancelEmpathicSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeechSynthesisActive(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}
