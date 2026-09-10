// Empathic Speech Synthesis Helper for MindMitra
// Speaks with tender, respectful, unhurried cadence in Assamese or regional English

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export function speakWarmly(text: string, options: SpeechOptions = {}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.88; // Gentle, unhurried
    utterance.pitch = options.pitch ?? 1.05; // Warm, affectionate
    utterance.lang = options.lang ?? "as-IN";

    // Attempt to pick a natural regional female voice if available
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(
      (v) =>
        v.lang.startsWith("as") ||
        v.lang.startsWith("bn") ||
        v.lang === "en-IN" ||
        v.name.includes("India")
    );
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    if (options.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options.onError) {
      utterance.onerror = (e) => options.onError?.(e);
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Empathic speech synthesis fallback:", err);
  }
}

export function cancelEmpathicSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Graceful no-op
  }
}
