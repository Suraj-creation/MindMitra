import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";
import { CompanionAction, CompanionTurn, RoleSurface, UIContextContract } from "../types";
import {
  decideTranscript,
  relistenDelayMs,
  shouldRelisten,
  stateAfterSpeaking,
  type VoiceState,
} from "../lib/voice-turn-taking";

// Explicit voice session states (Prompt 4 §31) live in lib/voice-turn-taking.
// MINIMIZED/CLOSED are not states here -- they are the absence of a session
// (voiceSessionActive=false), which is what makes "only minimize or stop ends
// the session" enforceable rather than aspirational.
export type { VoiceState };

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
  /** A calm, declinable offer of a real planned activity (Sections 6-8). */
  experience_invitation?: CompanionTurn["experience_invitation"];
  timestamp: string;
}

interface CompanionContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isListening: boolean;
  isSpeaking: boolean;
  /** True while the continuous voice loop is open; only minimize/stop clears it. */
  voiceSessionActive: boolean;
  voiceState: VoiceState;
  liveTranscript: string;
  turns: ChatMessage[];
  selectedLanguage: "as" | "en";
  setSelectedLanguage: (lang: "as" | "en") => void;
  currentContext: UIContextContract;
  updateContext: (partial: Partial<UIContextContract>) => void;
  sendTurn: (messageOverride?: string) => Promise<void>;
  /** Opens the continuous voice session (and starts listening). */
  startListening: () => void;
  /** Ends the continuous voice session. */
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
      // A greeting, not a claim. The previous version asserted where the person
      // was and who was in the house with them, and carried a fabricated
      // "verified_family_record" source to back it up -- provenance for a fact
      // that nothing had actually retrieved.
      text: "Namaskar. I am right here with you. What would you like to ask?",
      asText: "নমস্কাৰ। মই আপোনাৰ লগতে আছোঁ।",
      intent: "greeting",
      provider: "deterministic",
      model: "greeting",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const actionHandlersRef = useRef<Array<(action: CompanionAction) => void>>([]);
  const animIntervalRef = useRef<any>(null);

  // ── Continuous voice session (Prompt 4 §29-§34) ───────────────────────────
  //
  // Voice used to be one-shot: recognition ran with continuous = false, its
  // onend set isListening(false), and nothing ever re-armed it -- so after a
  // single answer the microphone was simply dead until the person found and
  // tapped it again. These refs hold the session so the loop
  // LISTENING -> PROCESSING -> SPEAKING -> LISTENING can close on itself.
  //
  // Refs rather than state because the recognition and audio callbacks are
  // registered once and would otherwise capture stale values from the render
  // they were created in.
  const sessionActiveRef = useRef(false);
  const recognitionRunningRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const spokenTextRef = useRef("");
  const restartTimerRef = useRef<any>(null);
  const sendTurnRef = useRef<((m?: string) => Promise<void>) | null>(null);
  const startRecognitionRef = useRef<(() => void) | null>(null);

  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

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
    speakingRef.current = false;
    spokenTextRef.current = "";
    setIsSpeaking(false);
  }, []);

  // Re-arm the microphone. This is the step that was missing entirely: the
  // session stays open across turns, so after speaking (or after a recognition
  // pass that produced nothing) listening resumes on its own and the person
  // never has to hunt for the microphone mid-conversation.
  const scheduleRelisten = useCallback((delayMs = 250) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (!sessionActiveRef.current) return;
    restartTimerRef.current = setTimeout(() => {
      const ok = shouldRelisten({
        sessionActive: sessionActiveRef.current,
        processing: processingRef.current,
        recognitionRunning: recognitionRunningRef.current,
        speaking: speakingRef.current,
      });
      if (ok) startRecognitionRef.current?.();
    }, delayMs);
  }, []);

  // Spoken voice playback via Sarvam TTS or the Web Speech API.
  const speakResponse = useCallback(
    async (textToSpeak: string, asText?: string) => {
      cancelSpeaking();
      const targetText = selectedLanguage === "as" && asText ? asText : textToSpeak;
      speakingRef.current = true;
      spokenTextRef.current = `${textToSpeak} ${asText || ""}`;
      setIsSpeaking(true);
      if (sessionActiveRef.current) setVoiceState("speaking");

      // Whatever ends the utterance -- finished, failed, or barged in on --
      // hands control back to listening exactly once.
      let settled = false;
      const finishSpeaking = () => {
        if (settled) return;
        settled = true;
        speakingRef.current = false;
        spokenTextRef.current = "";
        setIsSpeaking(false);
        setVoiceState(stateAfterSpeaking(sessionActiveRef.current));
        if (sessionActiveRef.current) scheduleRelisten(150);
      };

      try {
        const langCode = selectedLanguage === "as" ? "as-IN" : "en-IN";
        const base64Audio = await api.synthesizeSpeech(targetText, langCode, "priya");
        if (base64Audio) {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          currentAudioElemRef.current = audio;
          audio.onended = finishSpeaking;
          audio.onerror = () => fallbackBrowserSpeech(targetText);
          // Listen through our own speech so "stop" can interrupt it (§32).
          if (sessionActiveRef.current) scheduleRelisten(400);
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("Sarvam TTS synthesis fallback to browser synthesis:", err);
      }

      fallbackBrowserSpeech(targetText);

      function fallbackBrowserSpeech(speech: string) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          finishSpeaking();
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

        utterance.onend = finishSpeaking;
        utterance.onerror = finishSpeaking;

        speechSynthRef.current = utterance;
        if (sessionActiveRef.current) scheduleRelisten(400);
        window.speechSynthesis.speak(utterance);
      }
    },
    [cancelSpeaking, scheduleRelisten, selectedLanguage]
  );

  // Send turn to backend
  const sendTurn = useCallback(
    async (messageOverride?: string) => {
      const prompt = (messageOverride || liveTranscript).trim();
      if (!prompt) return;

      cancelSpeaking();
      setLiveTranscript("");
      setIsListening(false);
      processingRef.current = true;
      if (sessionActiveRef.current) setVoiceState("processing");

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
          provider: turnResult.provider || "deterministic",
          model: turnResult.model || "unknown",
          sources: turnResult.sources,
          action: turnResult.action,
          experience_invitation: turnResult.experience_invitation ?? null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setTurns((prev) => [...prev, assistantTurn]);
        processingRef.current = false;

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

        // A failed request is an UNAVAILABLE state, not a licence to invent.
        // This fallback used to assert that the person's daughter was in the
        // house -- a personal claim, made up client-side, at the exact moment
        // the system had verified nothing at all.
        const fallbackTurn: ChatMessage = {
          id: `fallback_${Date.now()}`,
          role: "assistant",
          text: "I can't check that right now. Let's try again in a moment.",
          asText: "এইমুহূৰ্তত মই এইটো চাব পৰা নাই। অলপ পিছত আকৌ চাওঁ।",
          intent: "unavailable",
          provider: "deterministic",
          model: "client_fallback",
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setTurns((prev) => [...prev, fallbackTurn]);
        processingRef.current = false;
        speakResponse(fallbackTurn.text, fallbackTurn.asText);
      } finally {
        processingRef.current = false;
      }
    },
    [cancelSpeaking, currentContext, liveTranscript, selectedLanguage, speakResponse, turns]
  );

  // Handlers registered on the recognition instance run for the life of the
  // session, so they read the latest sendTurn through a ref instead of closing
  // over whichever render created them.
  useEffect(() => {
    sendTurnRef.current = sendTurn;
  }, [sendTurn]);

  // ── Recognition loop ──────────────────────────────────────────────────────

  const handleFinalTranscript = useCallback(
    (finalTranscript: string) => {
      const said = finalTranscript.trim();
      const decision = decideTranscript(said, {
        speaking: speakingRef.current,
        currentlySpeaking: spokenTextRef.current,
      });

      if (decision === "ignore_echo") {
        // The assistant hearing itself -- discard and keep listening.
        setLiveTranscript("");
        return;
      }

      if (decision === "obey_and_relisten") {
        // A bare "stop" is a command, not a question: honour it and hand the
        // microphone straight back without generating a reply.
        cancelSpeaking();
        setLiveTranscript("");
        setVoiceState("listening");
        scheduleRelisten(150);
        return;
      }

      if (decision === "interrupt_and_send") {
        // Genuine barge-in: cut the speech off now rather than waiting for it.
        cancelSpeaking();
      }

      setLiveTranscript(said);
      sendTurnRef.current?.(said);
    },
    [cancelSpeaking, scheduleRelisten]
  );

  /** Low-level: start one recognition pass. Idempotent. */
  const startRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    if (recognitionRunningRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      setVoiceState("error");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === "as" ? "as-IN" : "en-IN";

      recognition.onstart = () => {
        recognitionRunningRef.current = true;
        setIsListening(true);
        if (!speakingRef.current) setVoiceState("listening");
        setLiveTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            handleFinalTranscript(event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
            if (!speakingRef.current) setLiveTranscript(interim);
          }
        }
      };

      recognition.onerror = (event: any) => {
        // "no-speech" and "aborted" are ordinary in a long-running session --
        // a quiet pause must not end the conversation.
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          sessionActiveRef.current = false;
          setVoiceSessionActive(false);
          setVoiceState("error");
        }
      };

      recognition.onend = () => {
        recognitionRunningRef.current = false;
        setIsListening(false);
        // The loop closes here: unless the session was deliberately ended,
        // listening starts again on its own.
        if (sessionActiveRef.current) {
          scheduleRelisten(relistenDelayMs({ speaking: speakingRef.current }));
        } else {
          setVoiceState("idle");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      // start() throws if an instance is somehow already running; recover by
      // retrying on the normal cadence instead of dropping the session.
      recognitionRunningRef.current = false;
      console.warn("Could not start speech recognition:", err);
      if (sessionActiveRef.current) scheduleRelisten(600);
    }
  }, [handleFinalTranscript, scheduleRelisten, selectedLanguage]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  /** Opens the continuous voice session. It stays open until minimize/stop. */
  const startListening = useCallback(() => {
    cancelSpeaking();
    sessionActiveRef.current = true;
    setVoiceSessionActive(true);
    setVoiceState("listening");
    startRecognition();
  }, [cancelSpeaking, startRecognition]);

  /** Ends the continuous voice session (the only thing that does). */
  const stopListening = useCallback(() => {
    sessionActiveRef.current = false;
    setVoiceSessionActive(false);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort?.() ?? recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    recognitionRunningRef.current = false;
    setIsListening(false);
    setLiveTranscript("");
    setVoiceState(speakingRef.current ? "speaking" : "idle");
  }, []);

  // Minimizing or closing the panel ends the session and the speech with it
  // (§34) -- the microphone must never stay live behind a closed panel.
  useEffect(() => {
    if (!isOpen && sessionActiveRef.current) {
      stopListening();
      cancelSpeaking();
    }
  }, [isOpen, stopListening, cancelSpeaking]);

  // Tear down on unmount so no timer or recognition instance outlives the app.
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore
      }
    };
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
        voiceSessionActive,
        voiceState,
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
