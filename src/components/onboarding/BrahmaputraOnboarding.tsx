import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Languages,
  Wind,
  Waves,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Flower2,
  Coffee,
  Music,
  Trees,
  BookOpen,
  Camera,
  Heart,
  Users,
  Building2,
  Stethoscope,
  Store,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Lock,
  Sparkles,
  Sliders,
  Plane,
  Eye,
  Database,
  Loader2,
} from "lucide-react";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";
import type { OnboardingProfile, RoleSurface } from "../../types";

import brahmaputraDawnImg from "../../assets/images/brahmaputra_aerial_dawn_1789164620302.jpg";
import courtyardMorningImg from "../../assets/images/assamese_courtyard_morning_1789164640851.jpg";
import mugaSilkTextureImg from "../../assets/images/muga_silk_texture_1789164655623.jpg";

interface BrahmaputraOnboardingProps {
  onComplete: (profile: OnboardingProfile) => void;
  onSelectSurface?: (surface: RoleSurface) => void;
}

export const BrahmaputraOnboarding: React.FC<BrahmaputraOnboardingProps> = ({
  onComplete,
  onSelectSurface,
}) => {
  // Flight phase: "intro_flight" (cinematic landscape flyover) -> "questions" (progressive disclosure steps 1-6) -> "sanctuary_ready" (step 7)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFlyingIntro, setIsFlyingIntro] = useState<boolean>(true);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collected gentle profile
  const [name, setName] = useState<string>("Aitâ Purnima");
  // The value stored here is the word the companion will actually SAY, not the
// label on the card. Storing the card label meant the assistant greeted people
// as "Namaskar Man (পুৰুষ / ককা)" -- it read a gender category aloud as a name.
// An empty string is a real choice: "prefer not to say" means use the name.
  const [honorific, setHonorific] = useState<string>("Aitâ");
  const [workRole, setWorkRole] = useState<string>("Teacher (শিক্ষকতা)");
  const [preferredLang, setPreferredLang] = useState<string>("Assamese (অসমীয়া)");
  const [globalLang, setGlobalLang] = useState<string>("as");
  const [voiceAssistanceActive, setVoiceAssistanceActive] = useState<boolean>(true);
  const [selectedJoys, setSelectedJoys] = useState<string[]>([
    "Courtyard & Gardening",
    "Assam Tea & Snacks",
    "Borgeet & Folk Music",
    "Stories & Old Photos",
    "Nature & River Walks",
    "Family & Grandchildren",
  ]);
  const [comfortStyles, setComfortStyles] = useState<string[]>([
    "Short and simple",
    "Tell me aloud with gentle voice",
    "Show me with pictures & photos",
  ]);
  const [avoidances, setAvoidances] = useState<string[]>([
    "Avoid sudden loud sounds or rapid chatter",
    "No memory tests or quizzes when forgetting a word",
    "Hurried pace or crowded fast screens",
  ]);

  // Dynamic user inputs
  const [customWorkRole, setCustomWorkRole] = useState<string>("");
  const [showAddJoyInput, setShowAddJoyInput] = useState<boolean>(false);
  const [customJoyText, setCustomJoyText] = useState<string>("");
  const [showAddAvoidanceInput, setShowAddAvoidanceInput] = useState<boolean>(false);
  const [customAvoidanceText, setCustomAvoidanceText] = useState<string>("");
  const [isSavingToDb, setIsSavingToDb] = useState<boolean>(false);
  const [dbSavedSuccess, setDbSavedSuccess] = useState<boolean | null>(null);

  // Hydrate from DB or local storage on initial mount
  useEffect(() => {
    fetch("/v1/onboarding?person_id=person:purnima")
      .then((res) => res.json())
      .then((data) => {
        if (data.found && data.profile) {
          if (data.profile.name) setName(data.profile.name);
          if (data.profile.honorific) setHonorific(data.profile.honorific);
          if (data.profile.work_background) setWorkRole(data.profile.work_background);
          if (data.profile.preferred_language) setPreferredLang(data.profile.preferred_language);
          if (Array.isArray(data.profile.joys) && data.profile.joys.length > 0) {
            setSelectedJoys(data.profile.joys);
          }
          if (Array.isArray(data.profile.explanation_style) && data.profile.explanation_style.length > 0) {
            setComfortStyles(data.profile.explanation_style);
          }
          if (Array.isArray(data.profile.avoidances) && data.profile.avoidances.length > 0) {
            setAvoidances(data.profile.avoidances);
          }
        }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("mindmitra_onboarding_profile");
          if (raw) {
            const p = JSON.parse(raw);
            if (p.name) setName(p.name);
            if (p.honorific) setHonorific(p.honorific);
            if (p.workBackground) setWorkRole(p.workBackground);
            if (p.preferredLanguage) setPreferredLang(p.preferredLanguage);
            if (Array.isArray(p.joys) && p.joys.length > 0) setSelectedJoys(p.joys);
            if (Array.isArray(p.explanationStyle) && p.explanationStyle.length > 0) setComfortStyles(p.explanationStyle);
            if (Array.isArray(p.avoidances) && p.avoidances.length > 0) setAvoidances(p.avoidances);
          }
        } catch {
          // safe fallback
        }
      });
  }, []);

  const stepTitles = [
    "Agoman • The Welcome",
    "How to Refer to You",
    "Life Identity & Work",
    "Language Comfort",
    "What Brings You Joy",
    "Comfort & Communication",
    "Sanctuary Prepared",
  ];

  const assameseAudioPrompts = [
    "নমস্কাৰ। আপোনাৰ মনৰ শান্তিলৈ স্বাগতম। আপোনাক আমি কি বুলি মাতিম?",
    "আমি আপোনাক কেনেদৰে সন্মানেৰে সম্বোধন কৰাটো বিচাৰে?",
    "আপুনি কি কাম কৰিছিল বা কি ভাল পাইছিল?",
    "কোনটো ভাষাত কথা পাতি আপুনি আটাইতকৈ আৰাম অনুভৱ কৰে?",
    "আপুনি কি কি কৰি মনত শান্তি আৰু আনন্দ পায়?",
    "আপুনি কথাবোৰ কেনেদৰে বুজি পাবলৈ ভাল পায়?",
    "আপোনাৰ প্ৰশান্তিৰ চোতালখন সুন্দৰকৈ সাজু হৈ উঠিছে।",
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const toggleAmbientSound = () => {
    if (isAmbientPlaying) {
      ambientAudio.stop();
      setIsAmbientPlaying(false);
      showToast("Ambient river breeze quieted.");
    } else {
      ambientAudio.playCourtyardSounds();
      setIsAmbientPlaying(true);
      showToast("Gentle Brahmaputra River breeze playing...");
    }
  };

  const playStepAudioPrompt = (stepNum: number) => {
    const text = assameseAudioPrompts[stepNum - 1] || "নমস্কাৰ";
    speakWarmly(text, {
      lang: globalLang === "en" ? "en-IN" : "as-IN",
      onEnd: () => {},
    });
    showToast(`Voice guide: "${text}"`);
  };

  const speakGreetingName = () => {
    const greetingName = (name || "").trim() || "পূৰ্ণিমা বাইদেউ";
    const greetingText = `নমস্কাৰ ${greetingName}, আপোনাক পাই নথৈ আনন্দিত হ'লো।`;
    speakWarmly(greetingText, { lang: "as-IN" });
    showToast(greetingText);
  };

  const toggleJoy = (joyName: string) => {
    setSelectedJoys((prev) =>
      prev.includes(joyName) ? prev.filter((j) => j !== joyName) : [...prev, joyName]
    );
  };

  const toggleComfortStyle = (style: string) => {
    setComfortStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleAvoidance = (item: string) => {
    setAvoidances((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSaveCustomJoy = () => {
    if (customJoyText.trim().length > 0) {
      const trimmed = customJoyText.trim();
      setSelectedJoys((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      showToast(`Added beloved anchor: "${trimmed}"`);
      setCustomJoyText("");
      setShowAddJoyInput(false);
    }
  };

  const handleSaveCustomAvoidance = () => {
    if (customAvoidanceText.trim().length > 0) {
      const trimmed = customAvoidanceText.trim();
      setAvoidances((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      showToast(`Added comfort boundary: "${trimmed}"`);
      setCustomAvoidanceText("");
      setShowAddAvoidanceInput(false);
    }
  };

  const handleStepTransition = (step: number) => {
    cancelEmpathicSpeech();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinishOnboarding = async () => {
    setIsSavingToDb(true);
    const finalWorkRole =
      workRole === "Other..." && customWorkRole.trim()
        ? customWorkRole.trim()
        : workRole;

    const trimmedName = name.trim() || "পূৰ্ণিমা দেৱী";

    const profile: OnboardingProfile = {
      name: trimmedName,
      honorific,
      workBackground: finalWorkRole,
      preferredLanguage: preferredLang,
      joys: selectedJoys,
      explanationStyle: comfortStyles,
      avoidances,
      completedAt: new Date().toISOString(),
    };

    // 1. Persist to Neon DB via backend endpoint
    try {
      showToast("Recording your preferences into sanctuary database...");
      const res = await fetch("/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          name: profile.name,
          honorific: profile.honorific,
          workBackground: profile.workBackground,
          preferredLanguage: profile.preferredLanguage,
          joys: profile.joys,
          explanationStyle: profile.explanationStyle,
          avoidances: profile.avoidances,
        }),
      });

      if (res.ok) {
        setDbSavedSuccess(true);
        showToast("✓ Recorded in database! Name and preferences synced.");
      } else {
        setDbSavedSuccess(false);
      }
    } catch (err) {
      console.warn("DB save warning, caching locally:", err);
      setDbSavedSuccess(false);
    }

    // 2. Cache in localStorage for immediate offline fallback
    try {
      localStorage.setItem("mindmitra_onboarding_profile", JSON.stringify(profile));
      localStorage.setItem("mindmitra_elder_name", profile.name);
      localStorage.setItem("mindmitra_elder_honorific", honorific);
      localStorage.setItem("mindmitra_preferred_lang", preferredLang);
      localStorage.setItem("mindmitra_onboarding_completed_v1", "true");
      window.dispatchEvent(new CustomEvent("onboarding_profile_updated", { detail: profile }));
    } catch {
      // safe storage fallback
    }

    setTimeout(() => {
      setIsSavingToDb(false);
      onComplete(profile);
    }, 700);
  };

  // Background image selection based on flight phase:
  // Intro / Step 1-2: Aerial Brahmaputra river at dawn
  // Step 3-5: Transitioning into Courtyard / Tea Garden Homestead
  // Step 6-7: Tactile Muga silk / courtyard sanctuary
  const currentBgImage =
    currentStep <= 2
      ? brahmaputraDawnImg
      : currentStep <= 5
      ? courtyardMorningImg
      : mugaSilkTextureImg;

  return (
    <div className="relative min-h-screen w-full bg-[#fef9f0] text-[#1d1c16] antialiased overflow-x-hidden flex flex-col justify-between selection:bg-[#ffdcc3]">
      {/* ================= BACKGROUND CINEMATIC CANVAS ================= */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#1a3826]">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-out"
          style={{
            backgroundImage: `url(${currentBgImage})`,
            transform: isFlyingIntro ? "scale(1.08)" : "scale(1.02)",
            opacity: 0.68,
          }}
        />
        {/* Living Silk & Mist washes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fef9f0] via-[#fef9f0]/75 to-[#fef9f0]/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#032212]/30 via-transparent to-[#fef9f0]/90" />
        <div className="absolute inset-0 bg-[#032212]/10 backdrop-blur-[1.5px]" />
      </div>

      {/* ================= FLOATING HEADER BAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 md:px-8 pointer-events-none">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#fef9f0]/92 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#c2c8c1]/40 pointer-events-auto">
          <div className="w-6 h-6 rounded-full bg-[#1a3826] flex items-center justify-center text-white">
            <Heart size={14} />
          </div>
          <span className="font-serif text-[18px] tracking-tight text-[#032212] font-bold">
            MindMitra
          </span>
          <span className="text-[#424843] text-[13px] border-l border-[#c2c8c1]/60 pl-2.5 ml-1 hidden sm:inline font-sans">
            Brahmaputra Serenity Journey
          </span>
        </div>

        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Global Language Selector */}
          <div className="flex items-center bg-[#fef9f0]/92 backdrop-blur-xl rounded-full px-3 py-1.5 text-[#424843] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#c2c8c1]/40">
            <Languages className="w-4 h-4 mr-1.5 text-[#904d00]" />
            <select
              aria-label="Language Selector"
              className="bg-transparent text-sm font-sans text-[#1d1c16] focus:outline-none cursor-pointer pr-1"
              value={globalLang}
              onChange={(e) => {
                setGlobalLang(e.target.value);
                showToast(`Language set to: ${e.target.value.toUpperCase()}`);
              }}
            >
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="brx">बड़ो (Bodo)</option>
              <option value="ne">नेपाली (Nepali)</option>
            </select>
          </div>

          {/* Ambient River & Courtyard Sound Toggle */}
          <button
            aria-label="Toggle Brahmaputra Ambient Sound"
            onClick={toggleAmbientSound}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#c2c8c1]/40 transition-all ${
              isAmbientPlaying
                ? "bg-[#c8ebd1] text-[#032212]"
                : "bg-[#fef9f0]/92 text-[#424843] hover:text-[#032212]"
            }`}
            title="River Mist Ambiance"
          >
            {isAmbientPlaying ? <Waves className="w-5 h-5 animate-pulse" /> : <Wind className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ================= MAIN ONBOARDING JOURNEY CONTAINER ================= */}
      <main className="w-full min-h-screen relative z-10 flex flex-col justify-between pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        {isFlyingIntro ? (
          <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center items-center text-center my-auto py-8 animate-fadeIn">
            {/* Environmental pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fef9f0]/90 backdrop-blur-xl border border-[#c2c8c1]/60 text-[#904d00] font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 shadow-xs">
              <Plane className="w-4 h-4 text-[#1a3826]" />
              <span>Northeast India • Brahmaputra River Valley at Dawn</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#032212] font-bold leading-tight mb-3 drop-shadow-xs">
              Moving through the landscape, arriving at your world.
            </h1>
            <p className="font-serif text-lg sm:text-xl text-[#904d00] font-normal mb-4">
              ব্ৰহ্মপুত্ৰৰ শীতল বতাহ আৰু পুৱাৰ কুঁৱলী ফালি আপোনাৰ প্ৰশান্তিৰ চোতাললৈ...
            </p>
            <p className="font-sans text-[#424843] text-sm sm:text-base leading-relaxed max-w-xl mb-8">
              A serene, culturally grounded introduction to your companion. Not a hospital intake, not a questionnaire—simply a quiet conversation to get to know you.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsFlyingIntro(false);
                  handleStepTransition(1);
                  if (!isAmbientPlaying) {
                    toggleAmbientSound();
                  }
                }}
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-serif text-base font-bold shadow-xl shadow-[#032212]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Begin Serenity Journey • যাত্ৰা আৰম্ভ কৰক</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleAmbientSound}
                className="w-full sm:w-auto h-14 px-6 rounded-full bg-[#fef9f0]/92 hover:bg-white text-[#1d1c16] font-sans text-sm font-semibold shadow-md border border-[#c2c8c1]/60 flex items-center justify-center gap-2 transition-all"
              >
                {isAmbientPlaying ? <Waves className="w-4 h-4 text-[#1a3826]" /> : <Wind className="w-4 h-4 text-[#904d00]" />}
                <span>{isAmbientPlaying ? "River Ambiance Active" : "Play River Mist Sound"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center my-auto py-4">
          {/* ================= STEPPER PROGRESS HEADER ================= */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#904d00] inline-block animate-pulse" />
                <span className="font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#904d00]">
                  Step {Math.min(currentStep, 6)} of 6
                </span>
                <span className="text-[#c2c8c1] text-sm mx-1 hidden sm:inline">|</span>
                <span className="font-sans text-xs sm:text-sm text-[#424843] hidden sm:inline">
                  {stepTitles[currentStep - 1] || "Journey"}
                </span>
              </div>

              {/* Audio Guide Button */}
              <button
                type="button"
                onClick={() => playStepAudioPrompt(currentStep)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ece8df]/90 hover:bg-[#ffdcc3] text-[#032212] backdrop-blur-md border border-[#c2c8c1]/50 transition-all text-xs sm:text-sm font-medium shadow-xs"
              >
                <Volume2 className="w-4 h-4 text-[#904d00]" />
                <span>Listen in অসমীয়া / English</span>
              </button>
            </div>

            {/* Stepper Track */}
            <div className="w-full h-2 rounded-full bg-[#e7e2d9]/80 overflow-hidden shadow-inner flex">
              <div
                className="h-full bg-[#1a3826] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(Math.min(currentStep, 6) / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* ================= MULTI-STEP CARD WRAPPER ================= */}
          <div className="relative bg-[#fef9f0]/94 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_16px_40px_rgba(3,34,18,0.08)] border border-white/70">
            {/* ================= STEP 1: AGOMAN (WELCOME & NAME) ================= */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#904d00] font-sans text-xs sm:text-sm tracking-wider uppercase font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Agoman (আগমন) • The Welcome</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#032212] font-bold leading-tight">
                    Namaskar. Welcome to MindMitra.
                  </h1>
                  <p className="font-serif text-base sm:text-lg text-[#904d00] font-normal">
                    নমস্কাৰ। আপোনাৰ মনৰ শান্তিলৈ স্বাগতম।
                  </p>
                  <p className="font-sans text-[#424843] text-sm sm:text-base leading-relaxed pt-1">
                    A serene, dignified space shaped by your world, your memories, and the quiet rhythm of the
                    river. Take all the time you need.
                  </p>
                </div>

                {/* Cultural Reverence Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1]/40 flex items-start gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#c8ebd1] text-[#032212] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Flower2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#424843] space-y-1">
                    <span className="font-sans font-semibold text-[#1d1c16] block">
                      Designed with Reverence for Assam &amp; the Northeast
                    </span>
                    <span>
                      From the morning river mist of Majuli to familiar courtyard chimes, this companion listens
                      with heart and speaks your tongue.
                    </span>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2 pt-1">
                  <label htmlFor="elder-name-input" className="block font-sans text-base sm:text-lg font-medium text-[#1d1c16]">
                    What should we call you?{" "}
                    <span className="text-[#904d00] block sm:inline font-normal text-sm sm:text-base">
                      (আপোনাক আমি কি বুলি মাতিম?)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="elder-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aitâ, Purnima baideu, Koka, or your preferred name"
                      className="w-full h-14 px-4 sm:px-5 rounded-2xl bg-white border-2 border-[#c2c8c1]/70 focus:border-[#1a3826] focus:ring-0 text-[#032212] font-serif text-lg sm:text-xl placeholder:text-[#727972]/60 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={speakGreetingName}
                      title="Hear warm greeting"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#904d00] hover:bg-[#f2ede4] transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#424843] italic">
                    MindMitra will use this name to greet you warmly every day.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <div className="flex items-center gap-2 text-[#424843] text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#904d00]" />
                    <span>Private, gentle &amp; elder-friendly</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStepTransition(2)}
                    className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Continue • আগবাঢ়ক</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: RESPECTFUL HONORIFIC ================= */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <span className="font-sans text-xs sm:text-sm text-[#904d00] tracking-wider uppercase font-semibold">
                    Step 2 • সন্মানেৰে সম্বোধন
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#032212] font-bold">
                    How would you like us to refer to you?
                  </h2>
                  <p className="font-serif text-base text-[#904d00] font-normal">
                    আমি আপোনাক কেনেদৰে উল্লেখ কৰাটো বিচাৰে?
                  </p>
                  <p className="font-sans text-sm sm:text-base text-[#424843]">
                    Helps us address you with traditional elder respect and familiar warmth in your language.
                  </p>
                </div>

                {/* Identity Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {[
                    {
                      label: "Woman (মহিলা)",
                      subtext: "Baideu / Aitâ (বাইদেউ / আইতা)",
                      value: "Aitâ",
                    },
                    {
                      label: "Man (পুৰুষ)",
                      subtext: "Dada / Koka / Khura (ককা / দাদা)",
                      value: "Koka",
                    },
                    {
                      label: "Another identity",
                      subtext: "Gender-neutral friendly respect",
                      value: "Bandhu",
                    },
                    {
                      label: "Prefer not to say",
                      subtext: "Just use my chosen name",
                      value: "",
                    },
                  ].map((item) => {
                    const isSelected = honorific === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => {
                          setHonorific(item.value);
                          showToast(`Tone updated: ${item.label}`);
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-[#1a3826] bg-[#e8efe9] shadow-sm"
                            : "border-[#c2c8c1]/50 bg-[#f8f3ea] hover:border-[#1a3826]/70"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-serif text-base sm:text-lg text-[#032212] font-bold">
                            {item.label}
                          </div>
                          <div className="font-sans text-xs sm:text-sm text-[#424843]">
                            {item.subtext}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-[#1a3826] border-[#1a3826] text-white"
                              : "border-[#c2c8c1]"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preview Banner */}
                <div className="p-3.5 rounded-xl bg-[#c8ebd1]/40 text-[#022111] text-xs sm:text-sm flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-[#1a3826] flex-shrink-0" />
                  <span>
                    We'll warmly refer to you with respect as{" "}
                    <strong>{name || "Aitâ"}</strong>.
                  </span>
                </div>

                {/* Nav Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(1)}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepTransition(3)}
                      className="h-12 px-4 text-[#424843] hover:text-[#1d1c16] font-sans text-sm transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(3)}
                      className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: LIFE IDENTITY & WORK ================= */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <span className="font-sans text-xs sm:text-sm text-[#904d00] tracking-wider uppercase font-semibold">
                    Step 3 • জীৱনৰ কাম আৰু পৰিচয়
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#032212] font-bold">
                    What kind of work did you do, or do you do?
                  </h2>
                  <p className="font-serif text-base text-[#904d00] font-normal">
                    আপুনি কি কাম কৰিছিল বা ভাল পাইছিল?
                  </p>
                  <p className="font-sans text-sm sm:text-base text-[#424843]">
                    We weave familiar memories, stories, and tools from your life into peaceful daily activities.
                  </p>
                </div>

                {/* Work Role Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    {
                      label: "Teacher",
                      subtext: "শিক্ষকতা",
                      icon: <BookOpen className="w-5 h-5" />,
                      value: "Teacher (শিক্ষকতা)",
                    },
                    {
                      label: "Farmer",
                      subtext: "খেতি-বাতি",
                      icon: <Trees className="w-5 h-5" />,
                      value: "Farmer / Cultivator (খেতি-বাতি)",
                    },
                    {
                      label: "Weaver / Crafts",
                      subtext: "তাঁত শাল / শিল্প",
                      icon: <PenTool className="w-5 h-5" />,
                      value: "Weaver / Crafts (তাঁত শাল / শিল্প)",
                    },
                    {
                      label: "Homemaker",
                      subtext: "গৃহিণী",
                      icon: <Flower2 className="w-5 h-5" />,
                      value: "Homemaker (গৃহিণী)",
                    },
                    {
                      label: "Govt / Office",
                      subtext: "কাৰ্যালয় সেৱা",
                      icon: <Building2 className="w-5 h-5" />,
                      value: "Government / Office Worker",
                    },
                    {
                      label: "Healthcare",
                      subtext: "চিকিৎসা সেৱা",
                      icon: <Stethoscope className="w-5 h-5" />,
                      value: "Healthcare / Doctor",
                    },
                    {
                      label: "Business",
                      subtext: "ব্যৱসায় / দোকান",
                      icon: <Store className="w-5 h-5" />,
                      value: "Business / Shop",
                    },
                    {
                      label: "Other...",
                      subtext: "অন্যান্য বৃত্তি",
                      icon: <Sparkles className="w-5 h-5" />,
                      value: "Other...",
                    },
                  ].map((role) => {
                    const isSelected = workRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setWorkRole(role.value);
                          showToast(`Familiar anchor set: ${role.label}`);
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-28 ${
                          isSelected
                            ? "border-[#1a3826] bg-[#c8ebd1]/30 shadow-xs"
                            : "border-[#c2c8c1]/40 bg-[#f8f3ea] hover:border-[#1a3826]"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-[#1a3826] text-white" : "bg-[#ece8df] text-[#904d00]"
                          }`}
                        >
                          {role.icon}
                        </div>
                        <div>
                          <div className="font-serif text-sm sm:text-base text-[#032212] font-bold">
                            {role.label}
                          </div>
                          <div className="font-sans text-xs text-[#424843]">{role.subtext}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {workRole === "Other..." && (
                  <div className="mt-1 p-3.5 rounded-2xl bg-white border border-[#1a3826] shadow-xs">
                    <label className="block font-sans text-xs text-[#904d00] font-semibold mb-1">
                      Specify your vocation, trade, or craft (আপোনাৰ বৃত্তি লিখক):
                    </label>
                    <input
                      type="text"
                      value={customWorkRole}
                      onChange={(e) => setCustomWorkRole(e.target.value)}
                      placeholder="e.g. Potter, Boatman, Singer, Fisher, Storyteller, Bamboo Artisan..."
                      className="w-full h-11 px-3.5 rounded-xl border border-[#c2c8c1] bg-[#fdfaf5] font-sans text-sm text-[#032212] focus:border-[#1a3826] focus:outline-none"
                      autoFocus
                    />
                  </div>
                )}

                {/* Nav Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(2)}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepTransition(4)}
                      className="h-12 px-4 text-[#424843] hover:text-[#1d1c16] font-sans text-sm transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(4)}
                      className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: LANGUAGE COMFORT ================= */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <span className="font-sans text-xs sm:text-sm text-[#904d00] tracking-wider uppercase font-semibold">
                    Step 4 • মাতৃভাষা আৰু কথোপকথন
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#032212] font-bold">
                    What language do you feel most comfortable speaking?
                  </h2>
                  <p className="font-serif text-base text-[#904d00] font-normal">
                    কোনটো ভাষাত কথা পাতি আপুনি আটাইতকৈ আৰাম অনুভৱ কৰে?
                  </p>
                </div>

                {/* Language Choice Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { native: "অসমীয়া", eng: "Assamese", value: "Assamese (অসমীয়া)" },
                    { native: "English", eng: "English", value: "English" },
                    { native: "বাংলা", eng: "Bengali", value: "Bengali (বাংলা)" },
                    { native: "बड़ो", eng: "Bodo", value: "Bodo (বড়ো)" },
                    { native: "नेपाली", eng: "Nepali", value: "Nepali (নেপালী)" },
                    { native: "Khasi", eng: "Khasi", value: "Khasi" },
                    { native: "हिन्दी", eng: "Hindi", value: "Hindi" },
                  ].map((lang) => {
                    const isSelected = preferredLang === lang.value;
                    return (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => {
                          setPreferredLang(lang.value);
                          showToast(`Preferred tongue: ${lang.native}`);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-[#1a3826] bg-[#c8ebd1]/30 shadow-xs"
                            : "border-[#c2c8c1]/40 bg-[#f8f3ea] hover:border-[#1a3826]"
                        }`}
                      >
                        <div className="font-serif text-base sm:text-lg text-[#032212] font-bold">
                          {lang.native}
                        </div>
                        <div className="font-sans text-xs sm:text-sm text-[#424843]">{lang.eng}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Voice Companion Toggle Card */}
                <div className="p-4 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] flex items-center justify-center text-[#904d00]">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-sans text-sm font-semibold text-[#1d1c16]">
                        Voice Companion Preference
                      </div>
                      <div className="font-sans text-xs sm:text-sm text-[#424843]">
                        Listen in Assamese (অসমীয়াত শুনক) / Read in English
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceAssistanceActive((prev) => !prev);
                      showToast(
                        voiceAssistanceActive ? "Voice assistance quieted." : "Voice assistance enabled."
                      );
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      voiceAssistanceActive
                        ? "bg-[#c8ebd1] text-[#032212]"
                        : "bg-[#e7e2d9] text-[#424843]"
                    }`}
                  >
                    {voiceAssistanceActive ? "Active • সক্ৰিয়" : "Muted • অফ কৰা"}
                  </button>
                </div>

                {/* Nav Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(3)}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepTransition(5)}
                      className="h-12 px-4 text-[#424843] hover:text-[#1d1c16] font-sans text-sm transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(5)}
                      className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: WHAT BRINGS YOU JOY ================= */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <span className="font-sans text-xs sm:text-sm text-[#904d00] tracking-wider uppercase font-semibold">
                    Step 5 • আপোনাৰ মন ভাল লগা কথাবোৰ
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#032212] font-bold">
                    What are some things you enjoy?
                  </h2>
                  <p className="font-serif text-base text-[#904d00] font-normal">
                    আপুনি কি কি কৰি মনত আনন্দ পায়?
                  </p>
                  <p className="font-sans text-xs sm:text-sm text-[#424843]">
                    Tap to select as many as you wish. These anchor your calm morning and evening reflections:
                  </p>
                </div>

                {/* Joy Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      label: "Courtyard & Gardening",
                      as: "ফুলনি আৰু তুলসীৰ তল",
                      icon: <Flower2 className="w-5 h-5" />,
                    },
                    {
                      label: "Assam Tea & Snacks",
                      as: "বগা চাহ আৰু পিঠা-জলপান",
                      icon: <Coffee className="w-5 h-5" />,
                    },
                    {
                      label: "Borgeet & Folk Music",
                      as: "গীত, সুৰ আৰু খোল-তাল",
                      icon: <Music className="w-5 h-5" />,
                    },
                    {
                      label: "Weaving & Handicrafts",
                      as: "তাঁত বাতি আৰু পাট-মুগা",
                      icon: <PenTool className="w-5 h-5" />,
                    },
                    {
                      label: "Stories & Old Photos",
                      as: "স্মৃতি, পুৰণি ফটো আৰু সাধু",
                      icon: <Camera className="w-5 h-5" />,
                    },
                    {
                      label: "Prayer & Altar",
                      as: "নাম-কীৰ্তন / পূজা সেৱা",
                      icon: <Sparkles className="w-5 h-5" />,
                    },
                    {
                      label: "Nature & River Walks",
                      as: "নৈৰ পাৰৰ শীতল বতাহ",
                      icon: <Waves className="w-5 h-5" />,
                    },
                    {
                      label: "Family & Grandchildren",
                      as: "নাতি-নাতিনীৰ মৰমৰ কথা",
                      icon: <Users className="w-5 h-5" />,
                    },
                  ].map((item) => {
                    const isSelected = selectedJoys.includes(item.label);
                    return (
                      <div
                        key={item.label}
                        onClick={() => toggleJoy(item.label)}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? "border-[#1a3826] bg-[#e8efe9] shadow-xs"
                            : "border-[#c2c8c1]/40 bg-[#f8f3ea] hover:border-[#1a3826]"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "bg-[#1a3826] text-white" : "bg-[#ece8df] text-[#032212]"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-sm sm:text-base text-[#032212] font-semibold">
                            {item.label}
                          </div>
                          <div className="font-sans text-xs text-[#424843]">{item.as}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1a3826]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Joy Prompt */}
                {showAddJoyInput ? (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#1a3826] shadow-xs flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="text"
                      value={customJoyText}
                      onChange={(e) => setCustomJoyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCustomJoy();
                      }}
                      placeholder="e.g. Tokari Geet at dusk, watching migratory birds at Deepor Beel..."
                      className="flex-1 w-full h-10 px-3 rounded-lg border border-[#c2c8c1] bg-[#fdfaf5] font-sans text-xs sm:text-sm text-[#032212] focus:outline-none focus:border-[#1a3826]"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handleSaveCustomJoy}
                        className="px-4 py-2 rounded-lg bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212] transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddJoyInput(false);
                          setCustomJoyText("");
                        }}
                        className="px-3 py-2 rounded-lg text-[#424843] text-xs hover:bg-[#f2ede4] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddJoyInput(true)}
                    className="p-3 rounded-xl bg-[#f2ede4] border border-dashed border-[#727972] hover:border-[#1a3826] text-[#424843] hover:text-[#032212] transition-colors text-xs sm:text-sm font-sans flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#904d00]" />
                    <span>+ Add something else that brings you peace... (আন কিবা স্মৃতি)</span>
                  </button>
                )}

                {/* Nav Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(4)}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepTransition(6)}
                      className="h-12 px-4 text-[#424843] hover:text-[#1d1c16] font-sans text-sm transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(6)}
                      className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 6: COMFORT & CAREFULNESS ================= */}
            {currentStep === 6 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <span className="font-sans text-xs sm:text-sm text-[#904d00] tracking-wider uppercase font-semibold">
                    Step 6 • কথা কোৱাৰ আৰাম আৰু পদ্ধতি
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#032212] font-bold">
                    How do you like things explained?
                  </h2>
                  <p className="font-serif text-base text-[#904d00] font-normal">
                    আপুনি কথাবোৰ কেনেদৰে বুজি পাবলৈ ভাল পায়?
                  </p>
                </div>

                {/* Explanation Style Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      label: "Short and simple",
                      subtext: "চমু আৰু সহজ ভাষা",
                      icon: <BookOpen className="w-5 h-5" />,
                    },
                    {
                      label: "Tell me aloud with gentle voice",
                      subtext: "মোক মাতি কওক",
                      icon: <Volume2 className="w-5 h-5" />,
                    },
                    {
                      label: "Show me with pictures & photos",
                      subtext: "ছবি আৰু ফটোৰে দেখুৱাওক",
                      icon: <Camera className="w-5 h-5" />,
                    },
                    {
                      label: "A little more detail",
                      subtext: "বিস্তৃত ব্যাখ্যা",
                      icon: <Eye className="w-5 h-5" />,
                    },
                  ].map((style) => {
                    const isSelected = comfortStyles.includes(style.label);
                    return (
                      <div
                        key={style.label}
                        onClick={() => toggleComfortStyle(style.label)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-[#1a3826] bg-[#e8efe9] shadow-xs"
                            : "border-[#c2c8c1]/40 bg-[#f8f3ea] hover:border-[#1a3826]"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-[#1a3826] text-white" : "bg-[#ece8df] text-[#032212]"
                          }`}
                        >
                          {style.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-serif text-sm sm:text-base text-[#032212] font-bold">
                            {style.label}
                          </div>
                          <div className="font-sans text-xs text-[#424843]">{style.subtext}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1a3826]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Sensitivities & Avoidances List */}
                <div className="pt-2 space-y-2.5">
                  <label className="block font-sans font-semibold text-[#1d1c16] text-sm">
                    Anything you'd rather avoid?{" "}
                    <span className="text-[#904d00] font-normal">
                      (অশান্তি বা অপ্ৰস্তুত নকৰিবলৈ সাৱধানতা)
                    </span>
                  </label>
                  <div className="space-y-2">
                    {[
                      "Avoid sudden loud sounds or rapid chatter (অত্যাধিক শব্দ বা বেগাই কোৱা কথা)",
                      "No memory tests or quizzes when forgetting a word (ভুল শুধৰাই দিয়াৰ হেঁচা নাই)",
                      "Hurried pace or crowded fast screens (ধীৰ-স্থিৰ বতাহৰ দৰে গতি)",
                    ].map((item) => {
                      const key = item.split(" (")[0];
                      const isChecked = avoidances.includes(key);
                      return (
                        <label
                          key={item}
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f3ea] border border-[#c2c8c1]/40 cursor-pointer hover:bg-[#f2ede4] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAvoidance(key)}
                            className="w-5 h-5 rounded text-[#1a3826] focus:ring-[#1a3826] accent-[#1a3826]"
                          />
                          <span className="font-sans text-xs sm:text-sm text-[#1d1c16]">{item}</span>
                        </label>
                      );
                    })}

                    {/* Any custom avoidances */}
                    {avoidances
                      .filter(
                        (a) =>
                          !a.includes("sudden loud") &&
                          !a.includes("memory tests") &&
                          !a.includes("Hurried pace")
                      )
                      .map((customAvoid) => (
                        <label
                          key={customAvoid}
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#e8efe9] border border-[#1a3826]/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleAvoidance(customAvoid)}
                            className="w-5 h-5 rounded text-[#1a3826] focus:ring-[#1a3826] accent-[#1a3826]"
                          />
                          <span className="font-sans text-xs sm:text-sm text-[#032212] font-medium">
                            {customAvoid}
                          </span>
                        </label>
                      ))}
                  </div>

                  {/* Add Custom Avoidance Input */}
                  {showAddAvoidanceInput ? (
                    <div className="p-3.5 rounded-2xl bg-white border border-[#1a3826] shadow-xs flex flex-col sm:flex-row gap-2 items-center">
                      <input
                        type="text"
                        value={customAvoidanceText}
                        onChange={(e) => setCustomAvoidanceText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCustomAvoidance();
                        }}
                        placeholder="e.g. Please speak slowly, do not show strobe lights..."
                        className="flex-1 w-full h-10 px-3 rounded-lg border border-[#c2c8c1] bg-[#fdfaf5] font-sans text-xs sm:text-sm text-[#032212] focus:outline-none focus:border-[#1a3826]"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={handleSaveCustomAvoidance}
                          className="px-4 py-2 rounded-lg bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212]"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddAvoidanceInput(false);
                            setCustomAvoidanceText("");
                          }}
                          className="px-3 py-2 rounded-lg text-[#424843] text-xs hover:bg-[#f2ede4]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddAvoidanceInput(true)}
                      className="p-2.5 text-xs text-[#904d00] hover:text-[#032212] font-sans font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ Add custom sensitivity or care boundary (অন্যান্য সাৱধানতা)</span>
                    </button>
                  )}
                </div>

                {/* Nav Buttons */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(5)}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepTransition(7)}
                    className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-sans text-base font-semibold shadow-md flex items-center gap-2 transition-all"
                  >
                    <span>Complete Sanctuary • সম্পূৰ্ণ কৰক</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 7: SANCTUARY READY ================= */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#904d00] font-sans text-xs sm:text-sm tracking-wider uppercase font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#1a3826]" />
                      <span>Sanctuary Prepared • আপোনাৰ বাবে সাজু</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#032212] font-bold">
                      Your Personal Sanctuary is Ready, {name.trim() || "পূৰ্ণিমা দেৱী"}.
                    </h2>
                    <p className="font-serif text-base sm:text-lg text-[#904d00] font-normal">
                      আপোনাৰ প্ৰশান্তিৰ চোতালখন সুন্দৰকৈ সজাই তোলা হৈছে।
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-[#c8ebd1] flex items-center justify-center flex-shrink-0 shadow-xs border border-[#adcfb5]">
                    <Flower2 className="w-8 h-8 text-[#032212]" />
                  </div>
                </div>

                {/* Dignified Seed Summary Bento */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1]/40 flex flex-col gap-4">
                  {/* Profile Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c2c8c1]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ffdcc3] text-[#2f1500] font-serif text-lg font-bold flex items-center justify-center">
                        {(name.trim() || "P").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-serif text-base sm:text-lg text-[#032212] font-bold flex items-center gap-2">
                          <span>{name.trim() || "পূৰ্ণিমা দেৱী"}</span>
                          <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-md bg-[#e2dcce] text-[#424843]">
                            {workRole === "Other..." && customWorkRole.trim() ? customWorkRole.trim() : workRole}
                          </span>
                        </div>
                        <div className="font-sans text-xs text-[#424843]">
                          Primary Tongue: {preferredLang} • River Rhythm Mode Active
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-full bg-[#adcfb5] text-[#2f4d3a] font-sans text-xs font-medium flex items-center gap-1.5 shadow-2xs">
                        <Database className="w-3.5 h-3.5" />
                        Neon PostgreSQL Connected
                      </span>
                    </div>
                  </div>

                  {/* Seamless Clinical / Care Context Integration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#fef9f0] border border-[#c2c8c1]/30">
                      <div className="flex items-center gap-1.5 text-[#904d00] mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-sans text-xs font-semibold">House Connection</span>
                      </div>
                      <div className="font-sans text-xs sm:text-sm text-[#1d1c16] font-medium">
                        Caregiver Anu is connected
                      </div>
                      <div className="text-[11px] text-[#424843] pt-0.5">Family circle linked securely</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#fef9f0] border border-[#c2c8c1]/30">
                      <div className="flex items-center gap-1.5 text-[#904d00] mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="font-sans text-xs font-semibold">Care Plan Sync</span>
                      </div>
                      <div className="font-sans text-xs sm:text-sm text-[#1d1c16] font-medium">
                        Support Level 2
                      </div>
                      <div className="text-[11px] text-[#424843] pt-0.5">
                        Gentle pacing &amp; zero memory tests
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#fef9f0] border border-[#c2c8c1]/30">
                      <div className="flex items-center gap-1.5 text-[#904d00] mb-1">
                        <Coffee className="w-4 h-4" />
                        <span className="font-sans text-xs font-semibold">Anchored Joys</span>
                      </div>
                      <div className="font-sans text-xs sm:text-sm text-[#1d1c16] font-medium truncate">
                        {selectedJoys.slice(0, 3).join(", ") || "Tea, Borgeet & River"}
                      </div>
                      <div className="text-[11px] text-[#424843] pt-0.5">
                        {selectedJoys.length} joy anchors ready
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warm Primary CTA */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#c2c8c1]/30">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(6)}
                    disabled={isSavingToDb}
                    className="h-12 px-6 rounded-full bg-[#e7e2d9] hover:bg-[#ded9d1] text-[#1d1c16] font-sans text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Adjust Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    disabled={isSavingToDb}
                    className="h-14 px-10 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-serif text-base sm:text-lg font-bold shadow-xl shadow-[#032212]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#fe932c] disabled:opacity-80"
                  >
                    {isSavingToDb ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Recording into Database... (সংৰক্ষণ হৈ আছে)</span>
                      </>
                    ) : (
                      <>
                        <span>Step into My Day (আজিৰ দিনটোলৈ যাওঁ ব’লক)</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= GENTLE FOOTER ================= */}
          <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#424843]">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#904d00]" />
              <span>Assamese, Bengali, Bodo, Khasi &amp; English Speech Support Active</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFlyingIntro(true);
                  showToast("Floating over Brahmaputra river mist...");
                }}
                className="hover:text-[#032212] transition-colors flex items-center gap-1 font-sans"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Flyover View</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleStepTransition(1)}
                className="hover:text-[#032212] transition-colors flex items-center gap-1 font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Journey</span>
              </button>
              <span>•</span>
              <span className="font-sans text-[#424843]/80">MindMitra • সোঁৱৰণি সংগী</span>
            </div>
          </footer>
        </div>
      )}
      </main>

      {/* ================= FLOATING AUDIO TOAST ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a3826] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 z-50 text-xs sm:text-sm animate-fadeIn">
          <Volume2 className="w-4 h-4 text-[#fe932c] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
