import React, { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Heart,
  Sun,
  Coffee,
  Trees,
  CheckCircle2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Wind,
  PhoneCall,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Music,
  Mic,
  Send,
  User,
  Users,
  Flower2,
  Flame,
  ArrowRight,
  Play,
  Pause,
  Info,
} from "lucide-react";
import { SaveMemoryStudio } from "./cognitive-experience/SaveMemoryStudio";
import { CognitiveExperienceSpace } from "./cognitive-experience/CognitiveExperienceSpace";
import { FullDayScheduleModal } from "./FullDayScheduleModal";
import { RinaCallModal } from "./RinaCallModal";
import { api } from "../lib/api";
import { ambientAudio } from "../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../lib/empathic-speech";
import type { PersonSection, VoiceCapability, PersonSession, RoleSurface } from "../types";
import { MemoryItem } from "../domain/cognitive-experience";

interface PersonAppProps {
  onSelectSurface?: (surface: RoleSurface) => void;
}

export const PersonApp: React.FC<PersonAppProps> = ({ onSelectSurface }) => {
  // Navigation tabs: "day" | "life" | "activity" | "people" | "help"
  const [activeSection, setActiveSection] = useState<PersonSection | "people">("day");
  const [language, setLanguage] = useState<"as" | "en">("as");
  const [showSaveMemoryModal, setShowSaveMemoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRinaModal, setShowRinaModal] = useState(false);
  const [savedMemories, setSavedMemories] = useState<MemoryItem[]>([]);

  // Audio / Sound states
  const [courtyardAudioPlaying, setCourtyardAudioPlaying] = useState(false);
  const [fluteAudioPlaying, setFluteAudioPlaying] = useState(false);
  const [isSpeakingGuidance, setIsSpeakingGuidance] = useState(false);

  // Companion Chat state
  const [companionInput, setCompanionInput] = useState("");
  const [companionTurns, setCompanionTurns] = useState<Array<{ sender: "user" | "companion"; text: string; asText?: string }>>([
    {
      sender: "companion",
      text: "Namaskar, Purnima baideu. You are safe in your Tezpur home. The morning sun is bright, and your daughter Anu is preparing fragrant tea in the kitchen.",
      asText: "নমস্কাৰ পূৰ্ণিমা বাইদেউ। আপুনি আপোনাৰ তেজপুৰৰ ঘৰত সুৰক্ষিতভাৱে আছে। ৰাতিপুৱাৰ ৰ’দ ওলাইছে, আৰু আপোনাৰ জীয়ৰী অনুৱে পাকঘৰত চাহ বনাইছে।",
    },
  ]);
  const [isListening, setIsListening] = useState(false);

  const [session] = useState<PersonSession>({
    personId: "person:purnima",
    displayName: "পূৰ্ণিমা দেৱী",
    preferredLanguage: "Assamese / English",
    village: "তেজপুৰ, অসম (Tezpur, Assam)",
  });

  const [dateLabel, setDateLabel] = useState("");
  const [assameseDateLabel, setAssameseDateLabel] = useState("");
  const [routineCompleted, setRoutineCompleted] = useState<Record<string, boolean>>({
    morning_stroll: true,
    tea: true,
    breakfast: true,
    lunch: false,
    afternoon_tea: false,
    rina_call: false,
    prayer: false,
    night_rest: false,
  });

  // Breathing loop for calming activities
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Breathe in gently" | "Hold with calm" | "Release slowly">("Breathe in gently");

  const companionSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const formattedEn = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now);
    setDateLabel(formattedEn);
    setAssameseDateLabel("বৃহস্পতিবাৰ, ১০ ছেপ্টেম্বৰ");

    return () => {
      ambientAudio.stop();
      cancelEmpathicSpeech();
    };
  }, []);

  useEffect(() => {
    if (!breathingActive) return;
    const interval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === "Breathe in gently") return "Hold with calm";
        if (prev === "Hold with calm") return "Release slowly";
        return "Breathe in gently";
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [breathingActive]);

  // Audio Guidance Speech
  const toggleAudioGuidance = () => {
    if (isSpeakingGuidance) {
      cancelEmpathicSpeech();
      setIsSpeakingGuidance(false);
      return;
    }
    setIsSpeakingGuidance(true);
    const guidanceText =
      language === "as"
        ? "নমস্কাৰ পূৰ্ণিমা বাইদেউ। আজি বৃহস্পতিবাৰ। আপুনি আপোনাৰ তেজপুৰৰ ঘৰত শান্তিৰে আছে। চাৰি বজাত অনুৰ সৈতে চাহ খোৱাৰ সময় হ’ব আৰু পাঁচ বজাত গুৱাহাটীৰ পৰা নাতিনী ৰীনাই ফোন কৰিব।"
        : "Namaskar Purnima baideu. Today is Thursday. You are resting peacefully at your Tezpur home. At 4 PM, you will share warm cardamom tea with Anu, and at 5 PM, granddaughter Rina will call from Guwahati.";

    speakWarmly(guidanceText, {
      rate: 0.88,
      pitch: 1.05,
      onEnd: () => setIsSpeakingGuidance(false),
      onError: () => setIsSpeakingGuidance(false),
    });
  };

  // Courtyard Sound Toggle
  const toggleCourtyardSound = () => {
    if (courtyardAudioPlaying) {
      ambientAudio.stop();
      setCourtyardAudioPlaying(false);
    } else {
      ambientAudio.stop();
      setFluteAudioPlaying(false);
      ambientAudio.playCourtyardSounds();
      setCourtyardAudioPlaying(true);
    }
  };

  // Peaceful Flute Toggle
  const toggleFluteSound = () => {
    if (fluteAudioPlaying) {
      ambientAudio.stop();
      setFluteAudioPlaying(false);
    } else {
      ambientAudio.stop();
      setCourtyardAudioPlaying(false);
      ambientAudio.playFolkFlute();
      setFluteAudioPlaying(true);
    }
  };

  // Handle Companion turn
  const handleSendTurn = (customPrompt?: string) => {
    const textToSend = customPrompt || companionInput;
    if (!textToSend.trim()) return;

    const newTurns = [
      ...companionTurns,
      { sender: "user" as const, text: textToSend },
    ];
    setCompanionTurns(newTurns);
    setCompanionInput("");

    let replyEn = "I am here with you, Purnima baideu. Everything is peaceful and well organized for you today.";
    let replyAs = "মই আপোনাৰ লগত আছো পূৰ্ণিমা বাইদেউ। আজিৰ সকলোখিনি আপোনাৰ বাবে অতি শান্ত আৰু সুন্দৰ হৈ আছে।";

    const lower = textToSend.toLowerCase();
    if (lower.includes("rina") || lower.includes("ৰীনা") || lower.includes("call")) {
      replyEn = "Your granddaughter Rina is calling from Guwahati today at 5:00 PM. She is eager to hear your voice and share her university news.";
      replyAs = "আপোনাৰ নাতিনী ৰীনাই আজি বিয়লি ৫:০০ বজাত গুৱাহাটীৰ পৰা ফোন কৰিব। তাই আপোনাৰ আশীৰ্বাদ ল’বলৈ আৰু মনৰ কথা ক’বলৈ অধীৰ হৈ বাট চাই আছে।";
    } else if (lower.includes("happening") || lower.includes("today") || lower.includes("দিনলিপি")) {
      replyEn = "This morning you had your fresh morning tea. At 4:00 PM, warm cardamom tea with fresh rice pitha is prepared with Anu. At 5:00 PM, Rina will call.";
      replyAs = "আজি পুৱা আপুনি চাহ খাইছে। ৪:০০ বজাত অনুৰ লগত ইলাচী চাহ আৰু পিঠা খোৱা হ’ব, আৰু ৫:০০ বজাত ৰীনাৰ ফোন আহিব।";
    } else if (lower.includes("flute") || lower.includes("song") || lower.includes("গান") || lower.includes("বাঁহী")) {
      replyEn = "Let me play a tender Assamese bamboo flute raga from the Brahmaputra valley for you.";
      replyAs = "আহক, মই আপোনালৈ ব্ৰহ্মপুত্ৰৰ এটি শান্ত আৰু সুমধুৰ বাঁহীৰ সুৰ বজায় দিওঁ।";
      ambientAudio.playFolkFlute();
      setFluteAudioPlaying(true);
    } else if (lower.includes("tezpur") || lower.includes("river") || lower.includes("ঘাট")) {
      replyEn = "Tezpur is blooming today with green tea terraces. The gentle waters of the Brahmaputra are quiet under the soft sky.";
      replyAs = "তেজপুৰৰ চাহ বাগিচাৰ সেউজীয়া পাতবোৰ বতাহত হালিছে। ব্ৰহ্মপুত্ৰৰ শান্ত নদীঘাটৰ বতাহজাক অতি স্নিগ্ধ আৰু শীতল।";
    }

    setTimeout(() => {
      setCompanionTurns((prev) => [
        ...prev,
        { sender: "companion", text: replyEn, asText: replyAs },
      ]);
      speakWarmly(language === "as" ? replyAs : replyEn, {
        rate: 0.88,
        pitch: 1.05,
      });
    }, 600);
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    speakWarmly(
      language === "as"
        ? "কওক পূৰ্ণিমা বাইদেউ, মই শুনি আছো।"
        : "Speak gently, Purnima baideu, I am listening.",
      {
        onEnd: () => {
          setTimeout(() => {
            setIsListening(false);
            handleSendTurn("What is happening today?");
          }, 3000);
        },
      }
    );
  };

  const scrollToCompanion = () => {
    if (activeSection !== "day") {
      setActiveSection("day");
    }
    setTimeout(() => {
      companionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <div className="w-full min-h-screen bg-[#fef9f0] text-[#1d1c16] flex flex-col font-sans pb-16">
      {/* ── TOP STICKY APPLICATION HEADER ── */}
      <header className="sticky top-0 z-40 bg-[#fef9f0]/90 backdrop-blur-md border-b border-[#c2c8c1]/40 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition shadow-xs">
        {/* Brand & Location Context */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1a3826] text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-2xl">spa</span>
          </div>
          <div>
            <div className="font-serif font-bold text-2xl tracking-tight text-[#1d1c16] leading-none flex items-center gap-1.5">
              <span>MindMitra</span>
              <span className="text-[11px] font-sans font-semibold text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded-full hidden sm:inline">
                Sanctuary
              </span>
            </div>
            <div className="text-[11px] text-[#424843] font-medium tracking-wide mt-1">
              <span>{assameseDateLabel}</span>
              <span className="hidden md:inline"> · {dateLabel}</span>
              <span className="text-[#1a3826] font-semibold"> · তেজপুৰ (Tezpur)</span>
            </div>
          </div>
        </div>

        {/* Primary Navigation Pills */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-1.5 bg-[#f2ede4] p-1.5 rounded-2xl border border-[#c2c8c1]/40 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveSection("day")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeSection === "day"
                ? "bg-[#1a3826] text-white shadow-[0_2px_8px_rgba(26,56,38,0.18)]"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <CalendarDays size={16} />
            <span>My Day (আজিৰ দিন)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("life")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeSection === "life"
                ? "bg-[#1a3826] text-white shadow-[0_2px_8px_rgba(26,56,38,0.18)]"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <ImageIcon size={16} />
            <span>My Life (জীৱন)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("activity")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeSection === "activity"
                ? "bg-[#1a3826] text-white shadow-[0_2px_8px_rgba(26,56,38,0.18)]"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Sparkles size={16} />
            <span>Let's Do Something (কিবা এটা কৰোঁ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("people")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeSection === "people"
                ? "bg-[#1a3826] text-white shadow-[0_2px_8px_rgba(26,56,38,0.18)]"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Users size={16} />
            <span>People (পৰিয়াল)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("help")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeSection === "help"
                ? "bg-[#904d00] text-white shadow-[0_2px_8px_rgba(144,77,0,0.2)]"
                : "text-[#424843] hover:text-[#904d00] hover:bg-[#ffdcc3]/40"
            }`}
          >
            <Heart size={16} />
            <span>Help (সহায়)</span>
          </button>
        </nav>

        {/* Right Actions: Language, Audio Guidance, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage((l) => (l === "as" ? "en" : "as"))}
            className="px-3 py-1.5 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea] hover:bg-[#f2ede4] text-xs font-semibold text-[#1d1c16] shadow-2xs transition"
            title="Switch Language"
          >
            {language === "as" ? "অসমীয়া (AS)" : "English (EN)"}
          </button>

          {/* Audio Guidance Button */}
          <button
            type="button"
            onClick={toggleAudioGuidance}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition border shadow-xs ${
              isSpeakingGuidance
                ? "bg-[#fe932c] text-white border-[#904d00] animate-pulse"
                : "bg-[#f8f3ea] text-[#1a3826] border-[#c2c8c1] hover:bg-[#f2ede4]"
            }`}
            title="Play Audio Guidance for today"
            aria-label="Audio Guidance"
          >
            {isSpeakingGuidance ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Profile Avatar Pill */}
          <div className="flex items-center gap-2 bg-[#f8f3ea] border border-[#c2c8c1]/60 px-3 py-1.5 rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#1a3826] text-white font-serif font-bold text-xs flex items-center justify-center ring-2 ring-[#81a28a]/40">
              পূ
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#1d1c16] leading-tight">
                {session.displayName}
              </p>
              <p className="text-[10px] text-[#424843]">Tezpur, Assam</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-[#f2ede4] border-b border-[#c2c8c1]/40 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection("day")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeSection === "day" ? "bg-[#1a3826] text-white" : "text-[#424843]"
          }`}
        >
          My Day
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("life")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeSection === "life" ? "bg-[#1a3826] text-white" : "text-[#424843]"
          }`}
        >
          My Life
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("activity")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeSection === "activity" ? "bg-[#1a3826] text-white" : "text-[#424843]"
          }`}
        >
          Let's Do Something
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("people")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeSection === "people" ? "bg-[#1a3826] text-white" : "text-[#424843]"
          }`}
        >
          People
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("help")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeSection === "help" ? "bg-[#904d00] text-white" : "text-[#424843]"
          }`}
        >
          Help
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: MY DAY (PRIMARY LANDING PAGE MATCHING IMAGE 1.PNG)
         ───────────────────────────────────────────────────────────── */}
      {activeSection === "day" && (
        <div className="w-full space-y-12 animate-fadeIn">
          {/* ── 1. HERO SECTION: TEZPUR TEA GARDEN SANCTUARY ── */}
          <section className="relative w-full overflow-hidden bg-[#032212] text-white shadow-lg">
            {/* Background Image with Misted Scrim */}
            <div className="absolute inset-0 z-0">
              <img
                src="/assets/images/assam_tea_garden_1788977277508.jpg"
                alt="Tezpur rolling tea gardens"
                className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 transform duration-1000"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://storage.googleapis.com/maker-suite-media-prod/applets/8c098952-596c-4e02-bb5c-f895cfa0cb6e/assam_tea_garden_1788977277508.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#032212] via-[#032212]/70 to-[#032212]/30" />
            </div>

            {/* Hero Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16 space-y-8">
              {/* Cultural Context Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#c8ebd1]">
                  <Sun size={14} className="text-[#ffdcc3]" />
                  <span>তেজপুৰ, অসম · Tezpur · Gentle Sun 24°C</span>
                </span>
                <span className="inline-flex items-center gap-2 bg-[#1a3826]/80 backdrop-blur-md border border-[#81a28a]/40 px-3.5 py-1.5 rounded-full text-xs font-medium text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Anu is close by in the house (অনু ওচৰতে আছে)</span>
                </span>
              </div>

              {/* Dignified Assamese Greeting */}
              <div className="max-w-3xl space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#adcfb5]">
                  প্ৰভাতৰ শুভেচ্ছা · Peaceful Morning
                </p>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
                  নমস্কাৰ, পূৰ্ণিমা বাইদেউ
                </h1>
                <p className="text-lg sm:text-xl font-serif text-[#c8ebd1] font-light">
                  Namaskar, Purnima baideu. You are peacefully home.
                </p>
                <p className="text-xs sm:text-sm text-white/80 max-w-2xl font-sans pt-1 leading-relaxed">
                  10:30 am · Thursday, 10 September (বৃহস্পতিবাৰ). The air carries the scent of fresh tea leaves and rain over the river.
                </p>
              </div>

              {/* FOCAL CARD: RIGHT NOW (এতিয়া) Courtyard time */}
              <div className="bg-[#fef9f0] text-[#1d1c16] rounded-3xl p-6 sm:p-7 border-2 border-[#adcfb5]/30 shadow-xl max-w-2xl transform transition hover:-translate-y-0.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#ffdcc3] text-[#904d00] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fe932c]" />
                      RIGHT NOW (এতিয়া) Courtyard time
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1d1c16] mt-2">
                      Gentle courtyard breeze & birdsong
                    </h2>
                    <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                      Quiet morning in the veranda garden overlooking the tall areca palms and flowering marigolds.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleCourtyardSound}
                    className={`shrink-0 px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition shadow-md ${
                      courtyardAudioPlaying
                        ? "bg-[#fe932c] text-white hover:bg-[#e07f20]"
                        : "bg-[#1a3826] text-white hover:bg-[#2d5a3f]"
                    }`}
                  >
                    {courtyardAudioPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                    <span>
                      {courtyardAudioPlaying ? "Pause Courtyard Sounds" : "Listen to courtyard sounds"}
                    </span>
                  </button>
                </div>

                {courtyardAudioPlaying && (
                  <div className="mt-4 pt-3 border-t border-[#c2c8c1]/40 flex items-center justify-between text-xs text-[#1a3826]">
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1 h-3 items-end">
                        <span className="w-1 bg-[#1a3826] h-2 animate-pulse" />
                        <span className="w-1 bg-[#1a3826] h-3 animate-pulse delay-75" />
                        <span className="w-1 bg-[#1a3826] h-1.5 animate-pulse delay-150" />
                      </span>
                      <span className="font-medium">Playing soothing Tezpur breeze & river acoustics</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCourtyardSound}
                      className="underline font-semibold"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── 2. SECTION: WHAT COMES NEXT TODAY (আজিৰ দিনলিপি · DAILY HARMONY) ── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-[#c2c8c1]/40">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
                  আজিৰ দিনলিপি · DAILY HARMONY
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1">
                  What Comes Next Today
                </h2>
                <p className="text-xs sm:text-sm text-[#424843] mt-0.5">
                  A slow, unhurried afternoon crafted around your favorite moments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="text-xs font-semibold text-[#1a3826] bg-[#f2ede4] hover:bg-[#ece8df] border border-[#c2c8c1] px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-2xs"
              >
                <CalendarDays size={15} />
                <span>View full day schedule</span>
              </button>
            </div>

            {/* 3 Timeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: 4:00 PM Tea with Anu */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#1a3826]/40 transition shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#904d00] bg-[#ffdcc3] px-2.5 py-1 rounded-lg">
                      4:00 PM
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center">
                      <Coffee size={20} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1d1c16]">
                      Cardamom Tea with Anu
                    </h3>
                    <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                      Warm ginger-elaichi tea & homemade fresh rice pitha on the back veranda.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#c2c8c1]/40 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#1a3826] bg-[#eaf0e4] px-2.5 py-1 rounded-md">
                    Prepared gently at 3:45 PM
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoutineCompleted((s) => ({ ...s, afternoon_tea: !s.afternoon_tea }))}
                    className="text-xs font-semibold text-[#424843] hover:text-[#1a3826] flex items-center gap-1"
                  >
                    <CheckCircle2
                      size={18}
                      className={routineCompleted.afternoon_tea ? "text-[#1a3826] fill-[#1a3826]/20" : "text-[#c2c8c1]"}
                    />
                    <span>{routineCompleted.afternoon_tea ? "Ready" : "Mark"}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: 5:00 PM Rina calls from Guwahati */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#1a3826]/40 transition shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7e22ce] bg-[#f3e8ff] px-2.5 py-1 rounded-lg">
                      5:00 PM
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
                      <Phone size={20} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1d1c16]">
                      Rina calls from Guwahati
                    </h3>
                    <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                      Your granddaughter will dial in to share evening stories and laugh together.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#c2c8c1]/40">
                  <button
                    type="button"
                    onClick={() => setShowRinaModal(true)}
                    className="w-full py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <span>See Rina's Photo or Call</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: 7:30 PM Evening Prayer & Light Meal */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#1a3826]/40 transition shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#854d0e] bg-[#fef08a] px-2.5 py-1 rounded-lg">
                      7:30 PM
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#fef08a] text-[#854d0e] flex items-center justify-center">
                      <Flame size={20} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1d1c16]">
                      Evening Prayer & Light Meal
                    </h3>
                    <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                      Earthen oil lamp (diya) lighting at the Gosai-Ghar, followed by soft khichdi.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#c2c8c1]/40 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#424843]">
                    Soft flute melodies will play
                  </span>
                  <button
                    type="button"
                    onClick={toggleFluteSound}
                    className="text-xs font-semibold text-[#1a3826] underline hover:text-[#2d5a3f]"
                  >
                    {fluteAudioPlaying ? "Pause Flute" : "Play Melodies"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. SECTION: SOMETHING MEANINGFUL TO DO (মনৰ আনন্দ · GENTLE JOYS) ── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-[#c2c8c1]/40">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
                  মনৰ আনন্দ · GENTLE JOYS
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1">
                  Something Meaningful to Do
                </h2>
                <p className="text-xs sm:text-sm text-[#424843] mt-0.5">
                  Small, tender activities that feel like home. No rush, no scores.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection("activity")}
                className="text-xs font-semibold text-[#1a3826] hover:underline flex items-center gap-1"
              >
                <span>Explore all cognitive activities</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 4 Cultural Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Activity 1: Listen to a Peaceful Song */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center">
                    <Music size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0369a1]">
                      Melody & Peace
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-0.5">
                      Listen to a Peaceful Song
                    </h3>
                    <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                      Traditional Assamese Borxongit and soothing bamboo flute melodies from Tezpur.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={toggleFluteSound}
                    className={`w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                      fluteAudioPlaying
                        ? "bg-[#0369a1] text-white shadow-xs"
                        : "bg-[#1a3826] hover:bg-[#2d5a3f] text-white shadow-xs"
                    }`}
                  >
                    {fluteAudioPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span>{fluteAudioPlaying ? "Pause Peaceful Song" : "Play Peaceful Music"}</span>
                  </button>
                </div>
              </div>

              {/* Activity 2: Make a Flower Garland */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
                    <Flower2 size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                      Gentle Hands
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-0.5">
                      Make a Flower Garland
                    </h3>
                    <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                      Anu has kept marigolds in the brass vessel. A simple, fragrant craft for the altar.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("activity")}
                    className="w-full py-3 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>See Step-by-Step Garland Guide</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Activity 3: See Family Photographs */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00]">
                      Cherished Memories
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-0.5">
                      See Family Photographs
                    </h3>
                    <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                      Rina's school days in Tezpur, Bikash at the tea bungalow, and old Bihu festivities.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("life")}
                    className="w-full py-3 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>Turn Photo Pages</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Activity 4: Call Rina in Guwahati */}
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
                    <PhoneCall size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7e22ce]">
                      Family Calling
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-0.5">
                      Call Rina in Guwahati
                    </h3>
                    <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                      Your beloved granddaughter. One simple tap immediately connects you to her voice.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRinaModal(true)}
                    className="w-full py-3 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>Tap to Call Rina Now</span>
                    <PhoneCall size={14} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── 4. SECTION: TALK WITH MINDMITRA COMPANION (মৰমৰ মনমিত্ৰ) ── */}
          <section ref={companionSectionRef} className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
            <div className="bg-[#f8f3ea] border border-[#c2c8c1]/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#c2c8c1]/40">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
                    মৰমৰ মনমিত্ৰ · LOVING ASSISTANT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1">
                    Talk with MindMitra Companion
                  </h2>
                  <p className="text-xs sm:text-sm text-[#424843]">
                    Ask about your day, listen to stories from Tezpur, or ask who is visiting.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleAudioGuidance}
                  className="px-4 py-2 rounded-xl bg-[#eaf0e4] text-[#1a3826] text-xs font-semibold hover:bg-[#d8e6cf] flex items-center gap-1.5 transition"
                >
                  <Volume2 size={15} />
                  <span>Read aloud to me</span>
                </button>
              </div>

              {/* Conversation Display */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {companionTurns.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      turn.sender === "user"
                        ? "bg-[#1a3826] text-white ml-8 sm:ml-16 font-medium"
                        : "bg-white border border-[#c2c8c1]/60 text-[#1d1c16] mr-8 sm:mr-16 shadow-2xs"
                    }`}
                  >
                    {turn.sender === "companion" && turn.asText && (
                      <p className="font-serif font-bold text-base text-[#1a3826] mb-1">
                        {turn.asText}
                      </p>
                    )}
                    <p className={turn.sender === "companion" ? "text-xs text-[#424843]" : ""}>
                      {turn.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Pills */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#424843]">
                  Suggested gentle questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What is happening today?",
                    "When will Rina call me?",
                    "Can we hear a Bihu flute song?",
                    "Tell me about the Tezpur river ghat",
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendTurn(p)}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#ece8df] border border-[#c2c8c1] text-xs font-medium text-[#1d1c16] transition shadow-2xs"
                    >
                      “{p}”
                    </button>
                  ))}
                </div>
              </div>

              {/* Interaction Input & Large Mic Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition shadow-md ${
                    isListening
                      ? "bg-red-700 text-white animate-pulse"
                      : "bg-[#1a3826] hover:bg-[#2d5a3f] text-white"
                  }`}
                >
                  <Mic size={20} />
                  <span>{isListening ? "Listening with care..." : "Tap to Speak gently (কওক)"}</span>
                </button>

                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    value={companionInput}
                    onChange={(e) => setCompanionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
                    placeholder="Type a gentle question or memory..."
                    className="flex-1 bg-white border border-[#c2c8c1] rounded-2xl px-4 py-3 text-sm text-[#1d1c16] placeholder-[#727972] focus:outline-none focus:ring-2 focus:ring-[#1a3826]/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTurn()}
                    className="p-3 bg-[#1a3826] text-white rounded-2xl hover:bg-[#2d5a3f] transition shadow-xs"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: LET'S DO SOMETHING (PRESERVING 100% OF EXISTING SYSTEM)
         ───────────────────────────────────────────────────────────── */}
      {activeSection === "activity" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
          {/* Empathetic Breadcrumb Bar */}
          <div className="flex items-center justify-between bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl px-5 py-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3826]" />
              <span className="text-xs font-semibold text-[#1a3826] uppercase tracking-wider">
                Cognitive Experience Space · Tezpur Home
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("day")}
              className="text-xs font-bold text-[#1a3826] hover:underline flex items-center gap-1"
            >
              ← Back to My Day
            </button>
          </div>

          {/* The Complete CognitiveExperienceSpace with all 8 games & engines preserved */}
          <CognitiveExperienceSpace onBackToDay={() => setActiveSection("day")} />

          {/* Gentle Calming Breathing Exercise (from original PersonApp) */}
          <div className="bg-[#f8f3ea] border border-[#c2c8c1] p-6 sm:p-8 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold text-[#1d1c16] font-serif mb-4 flex items-center gap-2">
              <Wind size={22} className="text-[#0369a1]" />
              Gentle Calming Breath (প্ৰাণায়াম)
            </h2>

            <div className="flex flex-col items-center justify-center p-6 bg-white border border-[#c2c8c1]/60 rounded-2xl text-center">
              <div
                className={`w-32 h-32 rounded-full border-4 border-[#1a3826] flex items-center justify-center transition-all duration-1000 ${
                  breathingActive ? "scale-110 bg-[#eaf0e4]" : "bg-[#fef9f0]"
                }`}
              >
                <Wind size={36} className="text-[#1a3826]" />
              </div>
              <p className="text-2xl font-serif font-bold text-[#1d1c16] mt-4">
                {breathingActive ? breathingPhase : "Gentle 4-4 Breathing"}
              </p>
              <p className="text-xs text-[#424843] max-w-sm mt-1 leading-relaxed">
                A calm, guided rhythm to soothe tension and bring clarity to this peaceful moment.
              </p>

              <button
                type="button"
                onClick={() => setBreathingActive(!breathingActive)}
                className="mt-5 px-7 py-2.5 rounded-full bg-[#1a3826] text-white font-semibold text-sm hover:bg-[#2d5a3f] transition-colors shadow-xs"
              >
                {breathingActive ? "Pause breathing" : "Begin breathing rhythm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: MY LIFE (FAMILIAR PLACES & MEMORIES)
         ───────────────────────────────────────────────────────────── */}
      {activeSection === "life" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#c2c8c1]/40">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
                জীৱনৰ স্মৃতি · CHERISHED LIFE CHAPTERS
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1">
                Familiar Places & Memories from Assam
              </h2>
              <p className="text-xs sm:text-sm text-[#424843] mt-0.5">
                Every place has a scent, a song, and the people who love you.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSaveMemoryModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Sparkles size={14} />
              <span>Save Memory (স্মৃতি সংৰক্ষণ)</span>
            </button>
          </div>

          {/* Custom Added Memories */}
          {savedMemories.length > 0 && (
            <div className="p-5 bg-[#f8f3ea] rounded-3xl border border-[#c2c8c1] space-y-3">
              <p className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Recently Added to Sanctuary
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedMemories.map((mem) => (
                  <div key={mem.id} className="bg-white p-4 rounded-2xl border border-[#c2c8c1]/60 flex items-center gap-3.5 shadow-2xs">
                    {mem.media_refs?.[0] ? (
                      <img src={mem.media_refs[0]} alt={mem.title} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#ffdcc3] flex items-center justify-center text-[#904d00]">
                        <Heart size={22} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-[#1d1c16]">{mem.title}</p>
                      <p className="text-xs text-[#424843] line-clamp-1">{mem.description || "Cherished memory"}</p>
                      <span className="text-[10px] text-[#1a3826] font-semibold">
                        {mem.source === "caregiver" ? "Caregiver verified" : "Pending verification"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Memory Vignettes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tezpur Tea Garden */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
              <img
                src="/assets/images/assam_tea_garden_1788977277508.jpg"
                alt="Assam rolling tea gardens"
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[#1d1c16]">
                  The Green Hills of Tezpur
                </h3>
                <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                  You used to walk near the tea estate in the cool mornings with your teacher friends. Do you remember the fresh fragrance of young tea leaves?
                </p>
              </div>
            </div>

            {/* Brahmaputra River */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
              <img
                src="/assets/images/brahmaputra_river_1788977296883.jpg"
                alt="Sunset over Brahmaputra river"
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[#1d1c16]">
                  Evening on the Brahmaputra
                </h3>
                <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                  The gentle ferry boats gliding across the golden water at twilight. A peaceful sight you always watched together from the river ghat.
                </p>
              </div>
            </div>

            {/* Teaching Career Days */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
              <img
                src="/assets/images/vintage_teacher_memory_1789020507713.jpg"
                alt="Teaching days"
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[#1d1c16]">
                  Tezpur Girls' School (১৯৮২)
                </h3>
                <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                  Thirty years of teaching literature and Assamese poetry. Hundreds of students still hold your blessings in their hearts.
                </p>
              </div>
            </div>

            {/* 1968 Wedding */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
              <img
                src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                alt="Wedding ceremony"
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[#1d1c16]">
                  Wedding in Jorhat (১৯৬৮)
                </h3>
                <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                  Dressed in traditional golden Muga silk mekhela sador, surrounded by the fragrance of fresh jasmine and courtyard shehnai melodies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: PEOPLE (পৰিয়াল আৰু মানুহ)
         ───────────────────────────────────────────────────────────── */}
      {activeSection === "people" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
          <div className="pb-3 border-b border-[#c2c8c1]/40">
            <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
              পৰিয়াল আৰু আপোন মানুহ · FAMILY CIRCLE
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1">
              Your Loved Ones & Care Team
            </h2>
            <p className="text-xs sm:text-sm text-[#424843] mt-0.5">
              People who know you, cherish you, and are here to help whenever you wish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Granddaughter Rina */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#1a3826]/30">
                  <img
                    src="/assets/images/rina_granddaughter_portrait_1789020459100.jpg"
                    alt="Rina"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#7e22ce] bg-[#f3e8ff] px-2 py-0.5 rounded-md">
                    Granddaughter · নাতিনী
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-1">
                    Rina Borah
                  </h3>
                  <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                    Working at Guwahati University. Calls every afternoon at 5:00 PM.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRinaModal(true)}
                className="w-full py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <PhoneCall size={14} />
                <span>Call Rina</span>
              </button>
            </div>

            {/* Daughter Anu */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center text-3xl font-serif font-bold">
                  অনু
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded-md">
                    Daughter & Caregiver · জীয়ৰী
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-1">
                    Anu Devi
                  </h3>
                  <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                    Living with you in Tezpur. Currently in the kitchen preparing afternoon refreshments.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  speakWarmly("Calling Anu in the veranda kitchen. She will come right away.");
                }}
                className="w-full py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <PhoneCall size={14} />
                <span>Call Anu in Kitchen</span>
              </button>
            </div>

            {/* ASHA Health Worker Meena */}
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-3xl font-serif font-bold">
                  মীনা
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#0369a1] bg-[#e0f2fe] px-2 py-0.5 rounded-md">
                    ASHA Community Worker · আশা কর্মী
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-1">
                    Meena Saikia
                  </h3>
                  <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                    Local Kamrup / Tezpur healthcare support worker. Visits every Tuesday for blood pressure and wellness checks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  speakWarmly("Connecting to ASHA worker Meena Saikia.");
                }}
                className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#025684] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <PhoneCall size={14} />
                <span>Call Meena (ASHA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: HELP (সহায় আৰু সুৰক্ষা)
         ───────────────────────────────────────────────────────────── */}
      {activeSection === "help" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
          {/* Safe Place Banner */}
          <div className="p-6 bg-[#eaf0e4] border border-[#bdd4b0] rounded-3xl flex items-start gap-4 shadow-xs">
            <ShieldCheck size={32} className="text-[#1a3826] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#1d1c16]">
                You are safe at home (আপুনি নিজৰ ঘৰত সুৰক্ষিত)
              </h2>
              <p className="text-sm text-[#1a3826] mt-1 leading-relaxed">
                You are in your familiar home in Tezpur, Assam. Your daughter Anu is close by in the house. You don't have to worry about anything.
              </p>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => {
                speakWarmly("Calling Anu. She is notified immediately.");
              }}
              className="p-6 rounded-3xl bg-[#1a3826] text-white flex items-center gap-4 text-left font-semibold text-base hover:bg-[#2d5a3f] transition-all shadow-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <PhoneCall size={28} />
              </div>
              <div>
                <div className="text-lg font-serif">Call Anu (Daughter)</div>
                <div className="text-xs text-white/80 font-normal mt-0.5">
                  Anu will come right to your room
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                speakWarmly("Calling Meena Saikia, your ASHA community worker.");
              }}
              className="p-6 rounded-3xl bg-[#0369a1] text-white flex items-center gap-4 text-left font-semibold text-base hover:bg-[#025684] transition-all shadow-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <PhoneCall size={28} />
              </div>
              <div>
                <div className="text-lg font-serif">Call Meena (ASHA Worker)</div>
                <div className="text-xs text-white/80 font-normal mt-0.5">
                  Village community healthcare support
                </div>
              </div>
            </button>
          </div>

          {/* Government Tele-MANAS Emergency Lifeline */}
          <div className="p-6 bg-[#ffdcc3]/80 border border-[#fe932c]/60 rounded-3xl space-y-2 text-left shadow-xs">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              Government Tele-MANAS Emergency Lifeline (টেলি-মানস হেল্পলাইন)
            </span>
            <p className="text-xl font-serif font-bold text-[#2f1500]">
              Dial 14416 or 1800-891-4416
            </p>
            <p className="text-xs text-[#424843]">
              24x7 toll-free mental health and elder distress helpline provided by the Government of India and Tezpur Mental Health Institute.
            </p>
          </div>
        </div>
      )}

      {/* ── FLOATING BUTTON: TALK WITH MINDMITRA (BOTTOM RIGHT) ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={scrollToCompanion}
          className="bg-[#1a3826] hover:bg-[#2d5a3f] text-white px-5 py-3.5 rounded-full flex items-center gap-2.5 shadow-xl border border-white/20 transition transform hover:scale-105"
          aria-label="Talk with MindMitra"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <Mic size={18} />
          <span className="text-xs sm:text-sm font-semibold">Talk with MindMitra</span>
        </button>
      </div>

      {/* ── FOOTER: SANCTUARY, STATUS & ECO-SYSTEM BINDING ── */}
      <footer className="mt-16 bg-[#f2ede4] border-t border-[#c2c8c1]/60 px-4 sm:px-8 py-8 space-y-6 text-[#424843]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-base text-[#1a3826]">spa</span>
            <span>MindMitra Sanctuary · Private, gentle, and designed with Assamese elder respect.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#1a3826] font-semibold">
              <CheckCircle2 size={15} />
              <span>Anu connected</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#904d00] font-semibold">
              <Phone size={15} />
              <span>Tele-MANAS 14416 Ready</span>
            </span>
          </div>
        </div>

        {/* Eco-System Surface Switcher matching image specification */}
        <div className="max-w-7xl mx-auto pt-4 border-t border-[#c2c8c1]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#1d1c16]">Eco-System: Northeast Journey ·</span>
            <button
              type="button"
              onClick={() => onSelectSurface?.("person")}
              className="px-2.5 py-1 rounded-lg bg-[#1a3826] text-white font-semibold shadow-2xs"
            >
              Person App (Active)
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("caregiver")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              Caregiver Copilot
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("asha")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              ASHA Caseload
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("clinical")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              Clinical Bridge
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("demos")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              Invariant Labs
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("prototypes")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              Stitch Prototypes
            </button>
            <button
              type="button"
              onClick={() => onSelectSurface?.("assets")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-[#1d1c16] font-medium border border-[#c2c8c1]/60"
            >
              Asset Studio
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#727972]">
            <span>• MindMitra Sanctuary · Tezpur Home</span>
            <span>✓ Connected with Caregiver Anu</span>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {showScheduleModal && (
        <FullDayScheduleModal
          onClose={() => setShowScheduleModal(false)}
          routineCompleted={routineCompleted}
          onToggleRoutine={(key) =>
            setRoutineCompleted((s) => ({ ...s, [key]: !s[key] }))
          }
        />
      )}

      {showRinaModal && (
        <RinaCallModal onClose={() => setShowRinaModal(false)} />
      )}

      {showSaveMemoryModal && (
        <SaveMemoryStudio
          onClose={() => setShowSaveMemoryModal(false)}
          onMemoryAdded={(mem) => setSavedMemories((prev) => [mem, ...prev])}
          defaultRole="person"
        />
      )}
    </div>
  );
};
