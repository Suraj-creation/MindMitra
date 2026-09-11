import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";
import { CompanionAction, CompanionTurn, RoleSurface, UIContextContract } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  asText?: string;
  intent?: string;
  provider?: string;
  model?: string;
  sources?: Array<{ id?: string; title?: string; text?: string; source_type?: string }>;
  action?: CompanionAction | null;
  timestamp: string;
}

interface CompanionContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isListening: boolean;
  isSpeaking: boolean;
  liveTranscript: string;
  turns: ChatMessage[];
  selectedLanguage: "as" | "en";
  setSelectedLanguage: (lang: "as" | "en") => void;
  currentContext: UIContextContract;
  updateContext: (partial: Partial<UIContextContract>) => void;
  sendTurn: (messageOverride?: string) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  cancelSpeaking: () => void;
  triggerAction: (action: CompanionAction) => void;
  registerActionHandler: (handler: (action: CompanionAction) => void) => () => void;
  clearHistory: () => void;
  audioLevels: number[];
}

const CompanionContext = createContext<CompanionContextType | null>(null);

const DEFAULT_PERSON_ID = "person:purnima";

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"as" | "en">("as");
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 40, 60, 45, 20]);

  // Context awareness state
  const [currentContext, setCurrentContext] = useState<UIContextContract>({
    surface: "person",
    page: "day",
    route: "/person",
    visible_entity: null,
    active_game: null,
  });

  const [turns, setTurns] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      text: "Namaskar Purnima baideu. I am right here beside you in Tezpur. How can I help you feel peaceful and clear right now?",
      asText: "নমস্কাৰ পূৰ্ণিমা বাইদেউ। মই তেজপুৰত আপোনাৰ কাষতেই আছোঁ। আজি আপোনাৰ দিনটো শান্ত আৰু আনন্দময় কৰিবলৈ মই কিদৰে সহায় কৰিব পাৰোঁ?",
      intent: "greeting",
      provider: "google_gemini",
      model: "gemini-2.5-flash",
      sources: [
        {
          title: "Ancestral Home in Tezpur",
          text: "Purnima's family home with daughter Anu in Tezpur, Assam",
          source_type: "verified_family_record",
        },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const actionHandlersRef = useRef<Array<(action: CompanionAction) => void>>([]);
  const animIntervalRef = useRef<any>(null);

  const updateContext = useCallback((partial: Partial<UIContextContract>) => {
    setCurrentContext((prev) => ({
      ...prev,
      ...partial,
      visible_entity: partial.visible_entity !== undefined ? partial.visible_entity : prev.visible_entity,
      active_game: partial.active_game !== undefined ? partial.active_game : prev.active_game,
    }));
  }, []);

  const registerActionHandler = useCallback((handler: (action: CompanionAction) => void) => {
    actionHandlersRef.current.push(handler);
    return () => {
      actionHandlersRef.current = actionHandlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  const triggerAction = useCallback((action: CompanionAction) => {
    actionHandlersRef.current.forEach((handler) => {
      try {
        handler(action);
      } catch (err) {
        console.warn("Action handler failed:", err);
      }
    });
  }, []);

  // Voice wave animation generator for speaking/listening state
  useEffect(() => {
    if (isListening || isSpeaking) {
      animIntervalRef.current = setInterval(() => {
        setAudioLevels([
          Math.floor(10 + Math.random() * 85),
          Math.floor(15 + Math.random() * 95),
          Math.floor(25 + Math.random() * 100),
          Math.floor(30 + Math.random() * 95),
          Math.floor(15 + Math.random() * 80),
          Math.floor(10 + Math.random() * 60),
        ]);
      }, 120);
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      setAudioLevels([12, 18, 28, 35, 24, 14]);
    }
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [isListening, isSpeaking]);

  // Cancel speaking / Barge-in capability
  const cancelSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioElemRef.current) {
      currentAudioElemRef.current.pause();
      currentAudioElemRef.current.currentTime = 0;
      currentAudioElemRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Spoken voice playback via Web Speech API or Sarvam TTS
  const speakResponse = useCallback(
    async (textToSpeak: string, asText?: string) => {
      cancelSpeaking();
      setIsSpeaking(true);

      const targetText = selectedLanguage === "as" && asText ? asText : textToSpeak;

      // Try Sarvam TTS for natural Indian voice synthesis first
      try {
        const langCode = selectedLanguage === "as" ? "as-IN" : "en-IN";
        const base64Audio = await api.synthesizeSpeech(targetText, langCode, "priya");
        if (base64Audio) {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          currentAudioElemRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => fallbackBrowserSpeech(targetText);
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("Sarvam TTS synthesis fallback to browser synthesis:", err);
      }

      fallbackBrowserSpeech(targetText);

      function fallbackBrowserSpeech(speech: string) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setIsSpeaking(false);
          return;
        }

        const clean = speech.replace(/\[ACTION:[^\]]+\]/g, "").trim();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.88; // Gentle, comforting pace
        utterance.pitch = 1.05; // Gentle, warm tone

        // Look for Indian English / Indic voices if available
        const voices = window.speechSynthesis.getVoices();
        const indicVoice = voices.find(
          (v) =>
            v.lang.startsWith("as") ||
            v.lang.startsWith("hi") ||
            v.lang.startsWith("en-IN") ||
            v.name.toLowerCase().includes("india") ||
            v.name.toLowerCase().includes("neerja")
        );
        if (indicVoice) utterance.voice = indicVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    },
    [cancelSpeaking, selectedLanguage]
  );

  // Send turn to backend
  const sendTurn = useCallback(
    async (messageOverride?: string) => {
      const prompt = (messageOverride || liveTranscript).trim();
      if (!prompt) return;

      cancelSpeaking();
      setLiveTranscript("");
      setIsListening(false);

      const userTurn: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setTurns((prev) => [...prev, userTurn]);

      try {
        const historyPayload = turns.slice(-6).map((t) => ({
          role: t.role,
          text: t.text,
        }));

        const turnResult: CompanionTurn = await api.sendCompanionTurn(
          "demo-token",
          DEFAULT_PERSON_ID,
          prompt,
          currentContext,
          historyPayload,
          selectedLanguage
        );

        const assistantTurn: ChatMessage = {
          id: turnResult.request_id || `asst_${Date.now()}`,
          role: "assistant",
          text: turnResult.answer,
          asText: turnResult.asText,
          intent: turnResult.intent,
          provider: turnResult.provider || "google_gemini",
          model: turnResult.model || "gemini-2.5-flash",
          sources: turnResult.sources,
          action: turnResult.action,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setTurns((prev) => [...prev, assistantTurn]);

        // Speak aloud
        speakResponse(turnResult.answer, turnResult.asText);

        // If turn has an action, optionally notify handlers
        if (turnResult.action) {
          // Auto-execute certain gentle actions if appropriate or let user tap
          console.info("[Companion] Action proposed:", turnResult.action);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn("Companion turn failed:", errorMsg);

        const fallbackTurn: ChatMessage = {
          id: `fallback_${Date.now()}`,
          role: "assistant",
          text: "Purnima baideu, you are safe in your home in Tezpur. Daughter Anu is right here in the house with you, and I am right here beside you.",
          asText: "পূৰ্ণিমা বাইদেউ, আপুনি তেজপুৰৰ নিজৰ ঘৰতে সুৰক্ষিত আছে। অনু কাষতে আছে আৰু মই আপোনাৰ লগতে আছোঁ।",
          intent: "grounded_reassurance",
          provider: "deterministic",
          model: "deterministic_resilience_v1",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setTurns((prev) => [...prev, fallbackTurn]);
        speakResponse(fallbackTurn.text, fallbackTurn.asText);
      }
    },
    [cancelSpeaking, currentContext, liveTranscript, selectedLanguage, speakResponse, turns]
  );

  // Web Speech Recognition handler
  const startListening = useCallback(() => {
    cancelSpeaking();

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      // Simulated voice prompt for demo
      setLiveTranscript("What is happening today, and when is tea?");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === "as" ? "as-IN" : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setLiveTranscript(finalTranscript);
            // Auto send on final utterance
            setTimeout(() => {
              sendTurn(finalTranscript);
            }, 300);
          } else {
            interim += event.results[i][0].transcript;
            setLiveTranscript(interim);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsListening(false);
    }
  }, [cancelSpeaking, selectedLanguage, sendTurn]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const clearHistory = useCallback(() => {
    cancelSpeaking();
    setTurns([]);
  }, [cancelSpeaking]);

  return (
    <CompanionContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isListening,
        isSpeaking,
        liveTranscript,
        turns,
        selectedLanguage,
        setSelectedLanguage,
        currentContext,
        updateContext,
        sendTurn,
        startListening,
        stopListening,
        cancelSpeaking,
        triggerAction,
        registerActionHandler,
        clearHistory,
        audioLevels,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    throw new Error("useCompanion must be used within a CompanionProvider");
  }
  return ctx;
}
