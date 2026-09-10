"use client";

import { LoaderCircle, Mic, MicOff, PhoneCall, RotateCcw, Send, Volume2, VolumeX, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import type { CompanionAction, CompanionTurn, CompanionVoiceMeta, VoiceCapability } from "@/lib/api";
import { cancelEmpathicSpeech, speakEmpathicText } from "@/lib/empathic-speech";

type CompanionPanelProps = {
  prompt: string;
  sendTurn: (message: string) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
  quickPrompts?: string[];
  onAction?: (action: CompanionAction) => void;
};

export function CompanionPanel({ prompt, sendTurn, voice, quickPrompts, onAction }: CompanionPanelProps) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [action, setAction] = useState<CompanionAction | null>(null);
  const [voiceMeta, setVoiceMeta] = useState<CompanionVoiceMeta | null>(null);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [teleManasNumber, setTeleManasNumber] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const defaultQuickPrompts = quickPrompts ?? [
    "What is happening today?",
    "Tell me about granddaughter Rina",
    "Can we listen to a gentle song?",
    "Where am I right now?",
  ];

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voice?.language || "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setMessage(transcript);
          void submit(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [voice]);

  const toggleListening = () => {
    cancelEmpathicSpeech();
    setIsSpeaking(false);

    if (!recognitionRef.current) {
      setError("Microphone recognition is not supported in this browser. You can tap the prompt or type below.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const submit = async (nextMessage: string) => {
    const trimmed = nextMessage.trim();
    if (!trimmed || isSending) return;

    cancelEmpathicSpeech();
    setIsSpeaking(false);
    setError("");
    setIsSending(true);
    try {
      const turn = await sendTurn(trimmed);
      setAnswer(turn.answer);
      setAction(turn.action || null);
      setVoiceMeta(turn.voice_meta || null);
      setMessage("");

      // Check if crisis obligations attached
      if ((turn as any).crisis_number || (turn as any).obligations?.some((o: string) => o.includes("14416"))) {
        setTeleManasNumber("14416");
      } else {
        setTeleManasNumber(null);
      }
    } catch {
      setError("I could not reach MindMitra just now. You can try again, or choose Help.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(message);
  };

  // Speak response using high-fidelity Empathic Female Speech Synthesis
  const speakAnswer = (textToSpeak?: string, meta?: CompanionVoiceMeta | null) => {
    const text = textToSpeak || answer;
    if (!text) return;

    const currentMeta = meta !== undefined ? meta : voiceMeta;

    speakEmpathicText({
      text,
      pitch: currentMeta?.recommended_pitch,
      rate: currentMeta?.recommended_rate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    if (answer) {
      speakAnswer(answer, voiceMeta);
    }
  }, [answer, voiceMeta]);

  return (
    <section aria-label="Talk with MindMitra" className="companion-panel">
      {/* Primary Voice Action / Spoken Prompt */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          className="person-primary-action flex-1"
          disabled={isSending}
          onClick={() => void submit(prompt)}
          type="button"
        >
          {isSending ? (
            <LoaderCircle aria-hidden="true" className="is-spinning" size={30} />
          ) : (
            <Send aria-hidden="true" size={30} />
          )}
          <span>{isSending ? "One moment, Purnima baideu…" : prompt}</span>
        </button>

        {/* Big accessible Microphone Button */}
        <button
          aria-label={isListening ? "Listening to you... tap to stop" : "Tap to speak to MindMitra"}
          className={`px-6 py-4 rounded-xl min-h-[76px] font-bold flex items-center justify-center gap-2 text-lg transition-all ${
            isListening
              ? "bg-[#dc2626] text-white animate-pulse shadow-lg scale-105"
              : "bg-[#eee1cc] text-[#5e6f4a] hover:bg-[#d8b878]/50 active:scale-95"
          }`}
          onClick={toggleListening}
          type="button"
        >
          {isListening ? (
            <>
              <MicOff size={28} className="animate-bounce" />
              <span>Listening…</span>
            </>
          ) : (
            <>
              <Mic size={28} />
              <span>Tap to Speak</span>
            </>
          )}
        </button>
      </div>

      {/* Familiar Quick Conversation Prompts */}
      <div className="flex flex-wrap gap-2 pt-1" aria-label="Quick questions">
        {defaultQuickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => void submit(qp)}
            disabled={isSending}
            className="text-sm sm:text-base bg-[#f7eadc] hover:bg-[#eee1cc] active:scale-95 border border-[#e6ddcf] text-[#332f29] px-3.5 py-2 rounded-full font-medium transition-colors"
          >
            "{qp}"
          </button>
        ))}
      </div>

      {/* Text Form Fallback */}
      <form className="companion-form" onSubmit={handleSubmit}>
        <label htmlFor="companion-message">Or type a message to MindMitra</label>
        <div className="companion-form__controls">
          <input
            id="companion-message"
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type anything here gently…"
            value={message}
            disabled={isSending}
          />
          <button
            aria-label="Send your message"
            className="companion-send"
            disabled={!message.trim() || isSending}
            type="submit"
          >
            <Send aria-hidden="true" size={24} />
            <span>Send</span>
          </button>
        </div>
      </form>

      {/* Answer Display */}
      {answer && (
        <div aria-live="polite" className="companion-answer shadow-sm border border-[#e6ddcf]">
          {isSpeaking && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e6ddcf]/60 text-xs font-semibold text-[#5e6f4a]">
              <span className="flex gap-1 items-end h-3">
                <span className="w-1 bg-[#5e6f4a] animate-bounce h-2"></span>
                <span className="w-1 bg-[#5e6f4a] animate-bounce h-3 [animation-delay:0.15s]"></span>
                <span className="w-1 bg-[#5e6f4a] animate-bounce h-2 [animation-delay:0.3s]"></span>
              </span>
              <span>MindMitra speaking with gentle voice…</span>
            </div>
          )}

          <p className="text-xl sm:text-2xl text-[#332f29] leading-relaxed">{answer}</p>

          {/* Action Card if suggested */}
          {action && (
            <div className="mt-4 pt-3 border-t border-[#e6ddcf]/70">
              <button
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#eee1cc] hover:bg-[#d8b878]/60 active:scale-95 text-[#332f29] text-base font-bold border border-[#d8b878] shadow-sm transition-all"
                onClick={() => onAction && onAction(action)}
                type="button"
              >
                <Sparkles size={18} className="text-[#5e6f4a]" />
                <span>{action.label}</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#e6ddcf]/70">
            <div className="flex items-center gap-4">
              <button
                className="companion-listen flex items-center gap-2 text-base font-bold text-[#5e6f4a] hover:underline"
                onClick={() => speakAnswer()}
                type="button"
              >
                <Volume2 aria-hidden="true" size={22} />
                <span>Listen again</span>
              </button>

              {isSpeaking && (
                <button
                  className="flex items-center gap-1 text-sm font-bold text-[#dc2626] hover:underline"
                  onClick={() => {
                    cancelEmpathicSpeech();
                    setIsSpeaking(false);
                  }}
                  type="button"
                >
                  <VolumeX size={18} />
                  <span>Mute</span>
                </button>
              )}
            </div>

            {teleManasNumber && (
              <a
                href={`tel:${teleManasNumber}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg text-sm font-bold shadow hover:bg-[#b91c1c]"
              >
                <PhoneCall size={16} />
                <span>Call Tele-MANAS {teleManasNumber} (Free 24x7)</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error state with retry */}
      {error && (
        <div className="companion-error" role="status">
          <p>{error}</p>
          <button onClick={() => void submit(message || prompt)} type="button">
            <RotateCcw aria-hidden="true" size={22} />
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
