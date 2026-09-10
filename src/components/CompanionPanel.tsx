import React, { useState, useEffect } from "react";
import { Send, Volume2, RotateCcw, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import type { CompanionTurn, VoiceCapability } from "../types";

interface CompanionPanelProps {
  prompt: string;
  onSendTurn: (message: string) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
}

export const CompanionPanel: React.FC<CompanionPanelProps> = ({ prompt, onSendTurn, voice }) => {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [provenance, setProvenance] = useState<CompanionTurn["sources"]>([]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSubmit = async (textToSubmit: string) => {
    const trimmed = textToSubmit.trim();
    if (!trimmed || isSending) return;
    setError("");
    setIsSending(true);

    try {
      const turn = await onSendTurn(trimmed);
      setAnswer(turn.answer);
      setProvenance(turn.sources);
      setMessage("");

      // Voice read-out if enabled
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        speakText(turn.answer);
      }
    } catch {
      setError("I could not reach MindMitra just now. You can try again, or ask Anu for help.");
    } finally {
      setIsSending(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Gentle, slower rate for elderly cognitive comfort
    utterance.pitch = 1.05;
    utterance.lang = "en-IN";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <section aria-label="Talk with MindMitra" className="companion-panel w-full">
      {/* Quick Prompt Button for One-Tap Independence */}
      <button
        type="button"
        disabled={isSending}
        onClick={() => void handleSubmit(prompt)}
        className="person-primary-action shadow-xs flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {isSending ? (
            <Loader2 className="animate-spin text-white" size={28} />
          ) : (
            <Sparkles size={28} className="text-[#ffdba8]" />
          )}
          <span>{isSending ? "Gathering calm thoughts…" : prompt}</span>
        </div>
        <span className="text-xs bg-white/20 text-white font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
          One Tap
        </span>
      </button>

      {/* Freeform Voice / Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(message);
        }}
        className="companion-form"
      >
        <label htmlFor="companion-message" className="text-sm font-semibold text-[#6b6b63]">
          Or tell MindMitra in your own words:
        </label>
        <div className="companion-form__controls">
          <input
            id="companion-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type anything, like 'Show me my garden' or 'Where is Anu?'"
            className="border border-[#e6ddcf] bg-[#fffaf1] rounded-xl px-4 text-[#332f29] focus:ring-2 focus:ring-[#5e6f4a] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="companion-send shadow-xs hover:opacity-90 transition-opacity"
            aria-label="Send message to MindMitra"
          >
            <Send size={22} />
            <span>Send</span>
          </button>
        </div>
      </form>

      {/* Reassuring Answer Display */}
      {answer && (
        <div className="companion-answer border border-[#e6ddcf] shadow-xs">
          <p className="text-[#332f29] leading-relaxed font-serif text-xl sm:text-2xl">
            {answer}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#e6ddcf]">
            <button
              type="button"
              onClick={() => speakText(answer)}
              className="companion-listen flex items-center gap-2 text-sm text-[#5e6f4a] font-semibold hover:underline"
            >
              <Volume2 size={20} className={isSpeaking ? "animate-pulse text-[#f97b0a]" : ""} />
              <span>{isSpeaking ? "Speaking gently…" : "Listen again"}</span>
            </button>

            {provenance.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#7a7a71]">
                <ShieldCheck size={14} className="text-[#6b8f6b]" />
                <span>Verified by family memory: {provenance[0].text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="companion-error border border-[#e6ddcf] p-4 rounded-xl">
          <p className="text-[#8e3d3d] text-base">{error}</p>
          <button
            type="button"
            onClick={() => void handleSubmit(message || prompt)}
            className="flex items-center gap-2 text-sm text-[#5e6f4a] font-semibold mt-2 hover:underline"
          >
            <RotateCcw size={18} />
            <span>Try again</span>
          </button>
        </div>
      )}
    </section>
  );
};
