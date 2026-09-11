import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Sparkles,
  Phone,
  ArrowRight,
  Compass,
  Play,
  RotateCcw,
  Languages,
  ShieldCheck,
  Activity,
  Layers,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCompanion } from "../context/CompanionContext";
import { CompanionAction } from "../types";

export function FloatingVoiceCompanion() {
  const {
    isOpen,
    setIsOpen,
    isListening,
    isSpeaking,
    liveTranscript,
    turns,
    selectedLanguage,
    setSelectedLanguage,
    currentContext,
    sendTurn,
    startListening,
    stopListening,
    cancelSpeaking,
    triggerAction,
    clearHistory,
    audioLevels,
  } = useCompanion();

  const [textInput, setTextInput] = useState("");
  const [showInspector, setShowInspector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages to bottom on new turns
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, isOpen, liveTranscript]);

  const handleSendMessage = async (msg?: string) => {
    const toSend = (msg || textInput).trim();
    if (!toSend || isSending) return;
    setIsSending(true);
    setTextInput("");
    try {
      await sendTurn(toSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionClick = (action: CompanionAction) => {
    triggerAction(action);
  };

  // Dynamic context suggestions based on page and active game
  const getContextSuggestions = (): string[] => {
    if (currentContext.active_game) {
      return [
        "Help me with this step",
        "Give me a gentle clue",
        "Which memory is this?",
        "What should I look at first?",
      ];
    }

    if (currentContext.visible_entity?.type === "person") {
      const name = currentContext.visible_entity.name || "her";
      return [
        `Tell me about ${name}`,
        `When will ${name} call?`,
        `Call ${name} now`,
        "Show our family photos",
      ];
    }

    if (currentContext.visible_entity?.type === "photo") {
      return [
        "Where was this photo taken?",
        "Who is standing with me?",
        "Tell me about this Bihu day",
        "Play peaceful bamboo flute",
      ];
    }

    if (currentContext.page === "day") {
      return [
        "What is happening today?",
        "When is my afternoon tea?",
        "Where is daughter Anu?",
        "Play peaceful flute music",
      ];
    }

    if (currentContext.page === "life") {
      return [
        "Show my wedding photos",
        "Play Assamese bamboo flute",
        "Tell me about Tezpur riverbank",
        "Where did we plant the Nahor tree?",
      ];
    }

    if (currentContext.page === "activity") {
      return [
        "What activity should we do?",
        "Let's weave marigold garland",
        "Let's prepare cardamom tea",
        "Play gentle courtyard sounds",
      ];
    }

    if (currentContext.page === "help") {
      return [
        "Where am I right now?",
        "Call daughter Anu",
        "Call granddaughter Rina",
        "Help me take a deep breath",
      ];
    }

    return [
      "What is happening today?",
      "When is tea time?",
      "Tell me about my family",
      "Play morning flute music",
    ];
  };

  const contextLabel = (): { title: string; subtitle: string; icon: string } => {
    if (currentContext.active_game) {
      return {
        title: currentContext.active_game.title,
        subtitle: `Task: ${currentContext.active_game.current_question || "Active Play"}`,
        icon: "🧩",
      };
    }
    if (currentContext.visible_entity?.type === "person") {
      return {
        title: `Viewing ${currentContext.visible_entity.name || "Loved Person"}`,
        subtitle: currentContext.visible_entity.description || "Family relationship",
        icon: "🌸",
      };
    }
    if (currentContext.visible_entity?.type === "photo") {
      return {
        title: currentContext.visible_entity.title || "Family Photograph",
        subtitle: "Ancestral album in Tezpur",
        icon: "🖼️",
      };
    }
    if (currentContext.page === "day") {
      return { title: "Day Overview", subtitle: "Tuesday · Tezpur Sanctuary", icon: "☀️" };
    }
    if (currentContext.page === "life") {
      return { title: "Life Memories", subtitle: "Photos, Stories & Flute Ragas", icon: "📖" };
    }
    if (currentContext.page === "activity") {
      return { title: "Gentle Activities", subtitle: "Sensory & Cognitive Joy", icon: "✨" };
    }
    if (currentContext.page === "people") {
      return { title: "Loved People", subtitle: "Family & Care Circle", icon: "🤝" };
    }
    if (currentContext.page === "help") {
      return { title: "Help & Reassurance", subtitle: "Home grounding & emergency", icon: "🛡️" };
    }
    return { title: "Personal Sanctuary", subtitle: "Tezpur, Assam", icon: "🌿" };
  };

  const currentInfo = contextLabel();

  return (
    <>
      {/* ── 1. EXPANDED CONVERSATIONAL VOICE OVERLAY ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[430px] max-h-[82vh] flex flex-col bg-stone-900/95 backdrop-blur-xl text-stone-100 rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden font-sans"
            style={{
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.6), 0 0 35px rgba(16, 185, 129, 0.15)",
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#142c1f] via-[#1b3d2b] to-[#12281c] border-b border-emerald-600/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  {isSpeaking && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
                    </span>
                  )}
                  {isListening && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white tracking-tight">MindMitra</h3>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                      সহচৰী
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 flex items-center gap-1">
                    <span>{isSpeaking ? "Speaking gently..." : isListening ? "Listening closely..." : "Voice companion ready"}</span>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                {/* Language Switcher */}
                <button
                  onClick={() => setSelectedLanguage(selectedLanguage === "as" ? "en" : "as")}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-100 transition border border-white/10 flex items-center gap-1"
                  title="Toggle Language (Assamese / English)"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{selectedLanguage === "as" ? "অসমীয়া" : "EN"}</span>
                </button>

                {/* Cancel speaking / barge-in */}
                {isSpeaking && (
                  <button
                    onClick={cancelSpeaking}
                    className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition border border-amber-500/30"
                    title="Stop speaking"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}

                {/* Minimize */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition"
                  title="Minimize"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Context Banner */}
            <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-800/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate text-emerald-200">
                <span className="text-sm">{currentInfo.icon}</span>
                <span className="font-semibold text-white truncate">{currentInfo.title}</span>
                <span className="text-emerald-400/80 truncate hidden sm:inline">· {currentInfo.subtitle}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-900/80 text-[10px] text-emerald-300 border border-emerald-700/50">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified Safe</span>
                </span>
              </div>
            </div>

            {/* Conversation Turns Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[360px] min-h-[160px] scrollbar-thin scrollbar-thumb-stone-700">
              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${turn.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl p-3.5 text-sm ${
                      turn.role === "user"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm shadow-md"
                        : "bg-stone-800/90 text-stone-100 rounded-tl-sm border border-stone-700/60 shadow-lg"
                    }`}
                  >
                    {turn.role === "assistant" && (
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-stone-700/40 text-[11px] text-emerald-400">
                        <span className="font-semibold">MindMitra</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                          {turn.provider === "sarvam_ai" ? (
                            <span className="text-amber-400">Sarvam 105B</span>
                          ) : turn.provider === "google_gemini" ? (
                            <span className="text-emerald-300">Gemini Flash</span>
                          ) : (
                            <span className="text-stone-400">Safe Rule</span>
                          )}
                          <span>{turn.timestamp}</span>
                        </div>
                      </div>
                    )}

                    {/* Primary Text */}
                    <p className="leading-relaxed">
                      {selectedLanguage === "as" && turn.asText ? turn.asText : turn.text}
                    </p>

                    {/* Bilingual toggle / subtitle if in Assamese */}
                    {selectedLanguage === "as" && turn.asText && turn.text !== turn.asText && (
                      <p className="mt-1.5 pt-1.5 border-t border-stone-700/30 text-xs text-stone-300 italic opacity-90">
                        {turn.text}
                      </p>
                    )}

                    {/* Sources Provenance Tag */}
                    {turn.sources && turn.sources.length > 0 && (
                      <div className="mt-2 pt-1 border-t border-stone-700/30 text-[10px] text-emerald-300/80 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{turn.sources[0].title || turn.sources[0].text}</span>
                      </div>
                    )}

                    {/* Action Button Attachment */}
                    {turn.action && (
                      <div className="mt-3 pt-2 border-t border-stone-700/50">
                        <button
                          type="button"
                          onClick={() => handleActionClick(turn.action!)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center justify-between gap-2 shadow-md transition transform active:scale-95"
                        >
                          <span className="flex items-center gap-1.5">
                            {turn.action.type === "call_contact" && <Phone className="w-3.5 h-3.5 text-amber-300" />}
                            {turn.action.type === "play_music" && <Play className="w-3.5 h-3.5 text-amber-300" />}
                            {turn.action.type === "navigate" && <Compass className="w-3.5 h-3.5 text-emerald-300" />}
                            {turn.action.type === "provide_scaffold" && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                            <span>{turn.action.label}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Live interim transcript when user is speaking */}
              {isListening && liveTranscript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <div className="bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-2xl p-2.5 max-w-[85%] italic flex items-center gap-2">
                    <span className="animate-pulse">🎙️</span>
                    <span>"{liveTranscript}"</span>
                  </div>
                </motion.div>
              )}

              {/* Sending status */}
              {isSending && (
                <div className="flex items-center gap-2 text-xs text-stone-400 p-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Thinking with loving care...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Context-Aware Action Chips */}
            <div className="px-4 py-2 bg-stone-950/70 border-t border-stone-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {getContextSuggestions().map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-xs text-emerald-200/90 border border-stone-700/60 transition shrink-0 hover:border-emerald-500/40"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Bottom Voice & Text Interaction Dock */}
            <div className="p-4 bg-gradient-to-t from-stone-950 via-stone-900 to-stone-900/90 border-t border-stone-800">
              {/* Audio Wave Visualizer during Speaking/Listening */}
              {(isSpeaking || isListening) && (
                <div className="mb-3 flex items-center justify-center gap-1.5 py-1">
                  <span className="text-[11px] font-medium text-emerald-400 mr-2">
                    {isSpeaking ? "MindMitra speaking:" : "Listening:"}
                  </span>
                  {audioLevels.map((h, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${isSpeaking ? "bg-amber-400" : "bg-emerald-400"}`}
                      animate={{ height: `${Math.max(6, h / 3.5)}px` }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                  {isSpeaking && (
                    <button
                      onClick={cancelSpeaking}
                      className="ml-3 text-[11px] text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <VolumeX className="w-3 h-3" /> Stop
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Large Center Voice-to-Voice Microphone Button */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative p-3.5 rounded-2xl flex items-center justify-center text-white transition-all transform active:scale-95 shadow-lg ${
                    isListening
                      ? "bg-gradient-to-r from-red-600 to-rose-700 ring-4 ring-rose-500/40 animate-pulse"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-400/30"
                  }`}
                  aria-label={isListening ? "Stop listening" : "Talk with MindMitra"}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Text input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex-1 flex items-center gap-1.5 bg-stone-800/80 rounded-2xl px-3 py-1.5 border border-stone-700 focus-within:border-emerald-500 transition"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      selectedLanguage === "as"
                        ? "পূৰ্ণিমা বাইদেউ, কিবা সুধিব নেকি..."
                        : "Ask anything, or tap microphone..."
                    }
                    className="flex-1 bg-transparent text-sm text-stone-100 placeholder-stone-400 focus:outline-none py-1.5"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isSending}
                    className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white transition"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Inspector & Reset toggle footer */}
              <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400">
                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className="hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>{showInspector ? "Hide Context Details" : "Context & Multi-Model Engine"}</span>
                </button>

                <button
                  type="button"
                  onClick={clearHistory}
                  className="hover:text-stone-200 flex items-center gap-1 transition"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>

              {/* Developer / Context Inspector Drawer */}
              <AnimatePresence>
                {showInspector && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 text-[10px] text-stone-300 space-y-1.5 overflow-hidden"
                  >
                    <div className="font-mono text-emerald-400 font-semibold flex items-center justify-between">
                      <span>PAGE & GAME CONTEXT CONTRACT</span>
                      <span className="text-stone-500">Live Wire</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-stone-400">Surface:</span>{" "}
                        <span className="text-white font-mono">{currentContext.surface}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Page:</span>{" "}
                        <span className="text-white font-mono">{currentContext.page}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Visible:</span>{" "}
                        <span className="text-emerald-300 font-mono">
                          {currentContext.visible_entity?.name || currentContext.visible_entity?.title || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Active Game:</span>{" "}
                        <span className="text-amber-300 font-mono">
                          {currentContext.active_game?.game_id || "None"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-stone-800 flex items-center justify-between text-[10px]">
                      <span>Model Cascade:</span>
                      <span className="text-emerald-300">Gemini Flash → Sarvam AI (105B) → Rule</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. CRAFTED SMALL ROUND FLOATED BUTTON OVER THE WHOLE PAGE ── */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative group"
        >
          {/* Ambient pulsating status glow */}
          <div
            className={`absolute -inset-1.5 rounded-full blur-md opacity-70 transition-all duration-700 ${
              isListening
                ? "bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 opacity-90 animate-pulse"
                : isSpeaking
                ? "bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-90 animate-pulse"
                : "bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 group-hover:opacity-100"
            }`}
          />

          {/* Core circular floating button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative flex items-center justify-center rounded-full p-4 text-white shadow-2xl transition-colors border ${
              isListening
                ? "bg-gradient-to-br from-rose-700 to-red-800 border-rose-400/60"
                : isSpeaking
                ? "bg-gradient-to-br from-[#1a3826] to-[#255238] border-amber-400/60"
                : "bg-gradient-to-br from-[#152e20] via-[#1a3826] to-[#234c34] border-emerald-400/40 hover:border-emerald-300"
            }`}
            style={{
              width: "60px",
              height: "60px",
            }}
            aria-label="Open voice companion MindMitra"
            aria-expanded={isOpen}
          >
            {/* Ping indicator ring */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isListening ? "bg-rose-400" : isSpeaking ? "bg-amber-400" : "bg-emerald-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-[#152e20] ${
                isListening ? "bg-rose-500" : isSpeaking ? "bg-amber-400" : "bg-emerald-500"
              }`} />
            </span>

            {/* Icon depending on state */}
            {isListening ? (
              <MicOff className="w-7 h-7 text-white animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-7 h-7 text-amber-300 animate-bounce" />
            ) : (
              <Mic className="w-7 h-7 text-emerald-200 group-hover:text-white transition" />
            )}
          </button>

          {/* Hover Tooltip Card */}
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-stone-900/95 text-white text-xs py-1.5 px-3 rounded-xl whitespace-nowrap shadow-xl border border-emerald-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-emerald-300">Talk with MindMitra</span>
              <span className="text-stone-400 text-[10px]">(Voice & Chat)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
