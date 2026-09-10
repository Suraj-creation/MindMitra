"use client";

import {
  Bookmark,
  Calendar,
  CheckCircle2,
  Flower,
  HeartHandshake,
  Image as ImageIcon,
  LoaderCircle,
  MessageCircle,
  Mic,
  MicOff,
  Music,
  PhoneCall,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import type { CompanionAction, CompanionTurn, CompanionVoiceMeta, VoiceCapability } from "@/lib/api";
import {
  cancelEmpathicSpeech,
  findBestEmpathicVoice,
  speakEmpathicText,
} from "@/lib/empathic-speech";

type MessageItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  action?: CompanionAction | null;
  sources?: Array<{ fact_id: string; source_type: string; verified: boolean; text: string }>;
  voice_meta?: CompanionVoiceMeta | null;
  multimodal?: any | null;
  goals?: any[];
  next_best_assistance?: string | null;
};

type PersistentCompanionDrawerProps = {
  currentSection: "day" | "life" | "activity" | "people" | "help";
  onNavigate: (section: "day" | "life" | "activity" | "people" | "help") => void;
  onQuickCall: (name: string, phone: string) => void;
  sendTurn: (
    message: string,
    context?: {
      surface?: string;
      current_entity?: string;
      current_task?: string;
      history?: Array<{ role: "user" | "assistant"; text: string }>;
    }
  ) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
};

export function PersistentCompanionDrawer({
  currentSection,
  onNavigate,
  onQuickCall,
  sendTurn,
  voice,
  isOpen,
  onToggle,
}: PersistentCompanionDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "initial_greeting",
      role: "assistant",
      text: "Namaskar Purnima baideu. I am right here beside you with a warm heart. What would you like to know or do today?",
      timestamp: "Just now",
      action: { type: "navigate", label: "See Today's Plan", target: "day" },
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [teleManasNumber, setTeleManasNumber] = useState<string | null>(null);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Context-aware Quick Prompt chips based on current section
  const getContextualPrompts = () => {
    switch (currentSection) {
      case "life":
        return [
          "Show me Rina",
          "Show me my wedding",
          "Tell me about the Bihu festival photo",
          "Play the morning bamboo flute raga",
        ];
      case "activity":
        return [
          "Help me weave a flower garland",
          "What goes into afternoon cardamom tea?",
          "Can we do a slow courtyard breath?",
          "I want to stop and rest",
        ];
      case "people":
        return [
          "Show me Rina",
          "Call daughter Anu",
          "Tell me about Bikash in Bengaluru",
          "Who is Meena the health worker?",
        ];
      case "help":
        return [
          "Where am I right now?",
          "I feel a little anxious, stay with me",
          "Please call daughter Anu right now",
          "Is someone in the house with me?",
        ];
      case "day":
      default:
        return [
          "Show me what I need to do today",
          "Show me what I did yesterday",
          "Show me Rina",
          "Play bamboo flute music",
        ];
    }
  };

  // Section context label for UI badge
  const sectionLabel = {
    day: "Aware of My Day & Routine",
    life: "Aware of Family Photos & Memories",
    activity: "Aware of Flower & Tea Activities",
    people: "Aware of Loved Family Members",
    help: "Aware of Immediate Care & Safety",
  }[currentSection];

  // Initialize Speech Recognition
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
          setInputMessage(transcript);
          void submitMessage(transcript);
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
      setError("Microphone recognition is not supported in this browser. You can tap the quick questions or type below.");
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

  const speakText = (text: string, meta?: CompanionVoiceMeta | null) => {
    speakEmpathicText({
      text,
      pitch: meta?.recommended_pitch ?? 1.06,
      rate: meta?.recommended_rate ?? 0.88,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handlePreviewVoice = () => {
    speakText("Namaskar Purnima baideu. I am right here with you, speaking with love and calm care.");
  };

  const submitMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    cancelEmpathicSpeech();
    setIsSpeaking(false);
    setError("");
    setIsSending(true);

    const userMessage: MessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      // Assemble multi-turn history
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const turn = await sendTurn(trimmed, {
        surface: currentSection,
        history: historyPayload,
      });

      const assistantMessage: MessageItem = {
        id: turn.request_id || `asst_${Date.now()}`,
        role: "assistant",
        text: turn.answer,
        timestamp: "Just now",
        action: turn.action,
        sources: turn.sources,
        voice_meta: turn.voice_meta || null,
        multimodal: turn.multimodal || null,
        goals: turn.goals || [],
        next_best_assistance: turn.next_best_assistance || null,
      };

      if (Array.isArray(turn.goals) && turn.goals.length > 0) {
        setActiveGoals(turn.goals);
      }

      setMessages((prev) => [...prev, assistantMessage]);

      if (turn.crisis_number || turn.obligations?.some((o: string) => o.includes("14416"))) {
        setTeleManasNumber("14416");
      } else {
        setTeleManasNumber(null);
      }

      // Automatically speak with warm female voice tuned with recommended acoustic parameters
      speakText(turn.answer, turn.voice_meta);
    } catch {
      setError("I could not reach MindMitra just now, Purnima baideu. You can tap to try again or ask daughter Anu.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitMessage(inputMessage);
  };

  const handleActionClick = (action: CompanionAction) => {
    const actType = String(action.type || "");
    if ((actType === "navigate" || actType === "navigate_to") && action.target) {
      onNavigate(action.target as any);
      onToggle(false);
    } else if (actType === "call_contact" || actType === "call_person") {
      const targetName = action.target || (action.payload?.name) || "Contact";
      const phone = action.phone || action.payload?.phone || (targetName.includes("Rina") ? "+91 94350 98765" : "+91 98640 12345");
      onQuickCall(targetName, phone);
    } else if (actType === "start_activity" || actType === "resume_activity") {
      onNavigate("activity");
      onToggle(false);
    } else if (actType === "show_media" || actType === "play_music" || actType === "show_photo" || actType === "show_memory") {
      onNavigate("life");
      onToggle(false);
    } else if (actType === "show_person") {
      onNavigate("people");
      onToggle(false);
    } else if (actType === "show_routine" || actType === "show_timeline") {
      onNavigate("day");
      onToggle(false);
    }
  };

  return (
    <>
      {/* Floating Persistent Launcher Button (Always available across all screens) */}
      {!isOpen && (
        <aside
          aria-label="Companion Launcher"
          className="fixed bottom-6 right-6 z-40"
          id="companion-floating-launcher"
        >
          <button
            aria-label="Open MindMitra Empathic Voice Companion"
            className="group flex items-center gap-3 px-5 py-3.5 bg-[#5e6f4a] hover:bg-[#4d5c3c] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 border-2 border-[#d8b878]"
            onClick={() => onToggle(true)}
            type="button"
          >
            <div className="relative">
              <span className="flex h-3 w-3 absolute -top-1 -right-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d8b878] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d8b878]"></span>
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <HeartHandshake size={24} />
              </div>
            </div>
            <div className="text-left pr-1">
              <p className="text-base font-bold leading-tight flex items-center gap-1.5">
                <span>Talk with MindMitra</span>
                <Sparkles size={14} className="text-[#d8b878]" />
              </p>
              <p className="text-xs text-white/80 font-medium">Warm Empathic Voice</p>
            </div>
          </button>
        </aside>
      )}

      {/* Slide-over Conversational Sheet */}
      {isOpen && (
        <section
          aria-label="MindMitra Voice Conversation"
          className="fixed inset-y-0 right-0 w-full sm:w-[460px] md:w-[500px] bg-[#fbf7f0] border-l border-[#e6ddcf] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
          id="companion-drawer-panel"
        >
          {/* Header */}
          <header className="p-4 sm:p-5 bg-[#5e6f4a] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-[#d8b878]">
                <HeartHandshake size={28} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <span>MindMitra</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-[#d8b878] text-[#332f29] rounded-full">
                    Empathic Voice
                  </span>
                </h2>
                <p className="text-xs text-white/85 font-medium flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{sectionLabel}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Preview gentle voice"
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={handlePreviewVoice}
                title="Hear my voice"
                type="button"
              >
                <Volume2 size={22} />
              </button>
              <button
                aria-label="Close conversation drawer"
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={() => {
                  cancelEmpathicSpeech();
                  setIsSpeaking(false);
                  onToggle(false);
                }}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
          </header>

          {/* Active Speaking / Soundwave Status Bar */}
          {isSpeaking && (
            <div className="px-4 py-2 bg-[#d8b878]/30 border-b border-[#d8b878]/50 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#5e6f4a]">
              <div className="flex items-center gap-2">
                <span className="flex gap-1 items-end h-4">
                  <span className="w-1 bg-[#5e6f4a] animate-bounce h-2"></span>
                  <span className="w-1 bg-[#5e6f4a] animate-bounce h-4 [animation-delay:0.15s]"></span>
                  <span className="w-1 bg-[#5e6f4a] animate-bounce h-3 [animation-delay:0.3s]"></span>
                </span>
                <span>MindMitra is speaking softly…</span>
              </div>
              <button
                className="flex items-center gap-1 text-xs text-[#dc2626] font-bold hover:underline"
                onClick={() => {
                  cancelEmpathicSpeech();
                  setIsSpeaking(false);
                }}
                type="button"
              >
                <VolumeX size={15} />
                <span>Mute</span>
              </button>
            </div>
          )}

          {/* Conversation History Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active Goals Ribbon */}
            {activeGoals.filter((g) => g.status === "active").length > 0 && (
              <div className="p-3 bg-[#5e6f4a]/10 border border-[#5e6f4a]/20 rounded-xl flex items-center justify-between text-xs text-[#5e6f4a]">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[#5e6f4a] shrink-0" />
                  <div>
                    <span className="font-bold">Active Focus: </span>
                    <span className="font-medium text-[#332f29]">
                      {activeGoals.find((g) => g.status === "active")?.title}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#5e6f4a] text-white rounded-full">
                  Governed
                </span>
              </div>
            )}

            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm text-base sm:text-lg leading-relaxed ${
                    item.role === "user"
                      ? "bg-[#5e6f4a] text-white rounded-br-none"
                      : "bg-white text-[#332f29] border border-[#e6ddcf] rounded-bl-none"
                  }`}
                >
                  <p>{item.text}</p>

                  {/* Re-listen button for assistant messages */}
                  {item.role === "assistant" && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e6ddcf]/70 text-xs sm:text-sm text-[#5e6f4a]">
                      <button
                        className="inline-flex items-center gap-1.5 font-bold hover:underline"
                        onClick={() => speakText(item.text, item.voice_meta)}
                        type="button"
                      >
                        <Volume2 size={16} />
                        <span>Listen again</span>
                      </button>
                      {item.next_best_assistance && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-[#eee1cc] text-[#5e6f4a] rounded">
                          {item.next_best_assistance}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Multimodal Card Renders */}
                {item.multimodal?.person_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-white rounded-2xl p-4 border-2 border-[#d8b878] shadow-md space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#eee1cc] text-[#5e6f4a] flex items-center justify-center font-bold text-lg border border-[#d8b878]">
                        <User size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-[#332f29] truncate">
                          {item.multimodal.person_card.display_name}
                        </h4>
                        <p className="text-xs font-semibold text-[#5e6f4a]">
                          {item.multimodal.person_card.relationship}
                        </p>
                      </div>
                    </div>
                    {item.multimodal.person_card.notes && (
                      <p className="text-xs text-[#6b6255] italic bg-[#fbf7f0] p-2 rounded-lg">
                        {item.multimodal.person_card.notes}
                      </p>
                    )}
                    <div className="pt-1 flex items-center gap-2">
                      {item.multimodal.person_card.phone && (
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#5e6f4a] hover:bg-[#4d5c3c] text-white rounded-xl text-xs font-bold shadow-sm"
                          onClick={() => onQuickCall(item.multimodal.person_card.display_name, item.multimodal.person_card.phone)}
                          type="button"
                        >
                          <PhoneCall size={14} /> Call ({item.multimodal.person_card.phone})
                        </button>
                      )}
                      <button
                        className="inline-flex items-center justify-center px-3 py-2 bg-[#eee1cc] hover:bg-[#d8b878]/60 text-[#332f29] rounded-xl text-xs font-bold"
                        onClick={() => { onNavigate("people"); onToggle(false); }}
                        type="button"
                      >
                        View Loved People
                      </button>
                    </div>
                  </div>
                )}

                {item.multimodal?.photo_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-white rounded-2xl p-4 border border-[#e6ddcf] shadow-md space-y-2">
                    <div className="flex items-center gap-2 text-[#5e6f4a] text-xs font-bold uppercase tracking-wider">
                      <ImageIcon size={16} />
                      <span>Family Photograph</span>
                      {item.multimodal.photo_card.year && (
                        <span className="ml-auto px-2 py-0.5 bg-[#eee1cc] text-[#332f29] rounded text-[11px]">
                          {item.multimodal.photo_card.year}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-[#332f29]">
                      {item.multimodal.photo_card.title}
                    </h4>
                    <p className="text-sm text-[#4a4237] leading-relaxed">
                      {item.multimodal.photo_card.caption}
                    </p>
                    {item.multimodal.photo_card.place && (
                      <p className="text-xs text-[#8e8579] font-medium">
                        📍 {item.multimodal.photo_card.place}
                      </p>
                    )}
                    {Array.isArray(item.multimodal.photo_card.people) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.multimodal.photo_card.people.map((p: string, idx: number) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 bg-[#fbf7f0] border border-[#e6ddcf] rounded-full text-[#5e6f4a] font-medium">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item.multimodal?.memory_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-[#fbf7f0] rounded-2xl p-4 border border-[#d8b878] shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5e6f4a] font-bold">
                      <span className="flex items-center gap-1.5">
                        <Bookmark size={15} /> Cherished Life Memory
                      </span>
                      {item.multimodal.memory_card.verified && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 size={12} /> Grounded
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-[#332f29]">
                      {item.multimodal.memory_card.title}
                    </h4>
                    <p className="text-sm text-[#4a4237] leading-relaxed">
                      {item.multimodal.memory_card.detail}
                    </p>
                  </div>
                )}

                {item.multimodal?.music_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center">
                        <Music size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">
                          {item.multimodal.music_card.title}
                        </h4>
                        <p className="text-xs text-emerald-700 font-medium">
                          {item.multimodal.music_card.genre}
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-3 py-1.5 bg-[#5e6f4a] text-white text-xs font-bold rounded-lg shadow hover:bg-[#4d5c3c]"
                      onClick={() => { onNavigate("life"); onToggle(false); }}
                      type="button"
                    >
                      Listen
                    </button>
                  </div>
                )}

                {item.multimodal?.activity_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Flower size={15} /> Guided Activity Step
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[11px]">
                        Step {item.multimodal.activity_card.step_number} of {item.multimodal.activity_card.total_steps}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-amber-950">
                      {item.multimodal.activity_card.title}
                    </h4>
                    <p className="text-sm text-amber-900 leading-relaxed font-medium">
                      {item.multimodal.activity_card.current_step}
                    </p>
                    {item.multimodal.activity_card.assistance_hint && (
                      <p className="text-xs text-amber-800 italic bg-amber-100/70 p-2 rounded-lg">
                        💡 {item.multimodal.activity_card.assistance_hint}
                      </p>
                    )}
                    <button
                      className="w-full mt-1 py-2 bg-[#5e6f4a] hover:bg-[#4d5c3c] text-white text-xs font-bold rounded-xl shadow"
                      onClick={() => { onNavigate("activity"); onToggle(false); }}
                      type="button"
                    >
                      Continue in Activities View
                    </button>
                  </div>
                )}

                {item.multimodal?.routine_card && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[80%] bg-white rounded-2xl p-4 border border-[#e6ddcf] shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5e6f4a] font-bold">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={15} /> Daily Schedule
                      </span>
                      <span className="text-[11px] text-[#6b6255]">
                        {item.multimodal.routine_card.date_label}
                      </span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {item.multimodal.routine_card.scheduled_items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[#fbf7f0] border border-[#e6ddcf]/70">
                          {it.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-[#5e6f4a] shrink-0" />
                          )}
                          <span className="font-bold text-[#5e6f4a]">{it.time}</span>
                          <span className={`flex-1 ${it.completed ? "line-through text-[#8e8579]" : "font-medium text-[#332f29]"}`}>
                            {it.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected Action Button if action exists */}
                {item.action && (
                  <div className="mt-2 ml-1">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eee1cc] hover:bg-[#d8b878]/60 active:scale-95 text-[#332f29] text-sm sm:text-base font-bold border border-[#d8b878] shadow-sm transition-all"
                      onClick={() => handleActionClick(item.action!)}
                      type="button"
                    >
                      {(item.action.type === "call_contact" || item.action.type === ("call_person" as any)) && <PhoneCall size={18} className="text-[#5e6f4a]" />}
                      {(item.action.type === "start_activity" || item.action.type === ("resume_activity" as any)) && <Flower size={18} className="text-[#5e6f4a]" />}
                      {(item.action.type === "play_music") && <Music size={18} className="text-[#5e6f4a]" />}
                      {(item.action.type === "navigate" || item.action.type === ("navigate_to" as any) || item.action.type === ("show_person" as any)) && <Sparkles size={18} className="text-[#5e6f4a]" />}
                      <span>{item.action.label}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* In-Flight Sending Indicator */}
            {isSending && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-[#e6ddcf] p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3 text-[#5e6f4a] text-base font-semibold">
                  <LoaderCircle className="animate-spin text-[#5e6f4a]" size={20} />
                  <span>Thinking gently for you, Purnima baideu…</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between">
                <span>{error}</span>
                <button
                  className="font-bold underline ml-2 inline-flex items-center gap-1"
                  onClick={() => void submitMessage("Hello MindMitra")}
                  type="button"
                >
                  <RotateCcw size={14} /> Retry
                </button>
              </div>
            )}

            {/* Crisis Tele-MANAS notice */}
            {teleManasNumber && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center space-y-2">
                <p className="text-sm font-semibold text-red-900">
                  Purnima baideu, if you ever feel uneasy, national mental health support is free and immediate:
                </p>
                <a
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold shadow-md hover:bg-red-700 text-base"
                  href={`tel:${teleManasNumber}`}
                >
                  <PhoneCall size={18} />
                  <span>Call Tele-MANAS {teleManasNumber} (24x7)</span>
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Quick Question Suggestions */}
          <div className="px-4 py-2 border-t border-[#e6ddcf] bg-[#f7eadc]/50">
            <p className="text-xs font-bold text-[#5e6f4a] mb-1.5 uppercase tracking-wide">
              Suggestions for {currentSection === "day" ? "today" : currentSection}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getContextualPrompts().map((qp, idx) => (
                <button
                  key={idx}
                  className="text-xs sm:text-sm bg-white hover:bg-[#eee1cc] active:scale-95 border border-[#e6ddcf] text-[#332f29] px-3 py-1.5 rounded-full font-medium transition-colors"
                  disabled={isSending}
                  onClick={() => void submitMessage(qp)}
                  type="button"
                >
                  "{qp}"
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Spoken & Text Controls */}
          <footer className="p-4 bg-white border-t border-[#e6ddcf] space-y-3">
            {/* Primary Big Voice Button */}
            <button
              aria-label={isListening ? "Listening to you... tap to finish" : "Tap to speak to MindMitra"}
              className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all shadow-md active:scale-98 ${
                isListening
                  ? "bg-[#dc2626] text-white animate-pulse"
                  : "bg-[#5e6f4a] text-white hover:bg-[#4d5c3c]"
              }`}
              disabled={isSending}
              onClick={toggleListening}
              type="button"
            >
              {isListening ? (
                <>
                  <MicOff className="animate-bounce" size={26} />
                  <span>Listening to you… tap when done</span>
                </>
              ) : (
                <>
                  <Mic size={26} />
                  <span>Tap to Speak Gently</span>
                </>
              )}
            </button>

            {/* Accessible Text Input Form */}
            <form className="flex items-center gap-2" onSubmit={handleSubmitForm}>
              <input
                className="flex-1 px-4 py-3 bg-[#fbf7f0] border border-[#e6ddcf] rounded-xl text-base text-[#332f29] focus:outline-none focus:ring-2 focus:ring-[#5e6f4a] placeholder-[#8e8579]"
                disabled={isSending}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Or type here gently…"
                value={inputMessage}
              />
              <button
                aria-label="Send typed message"
                className="px-4 py-3 bg-[#eee1cc] hover:bg-[#d8b878]/60 active:scale-95 text-[#5e6f4a] rounded-xl font-bold transition-all disabled:opacity-50"
                disabled={!inputMessage.trim() || isSending}
                type="submit"
              >
                <Send size={20} />
              </button>
            </form>
          </footer>
        </section>
      )}
    </>
  );
}
