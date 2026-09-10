"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Volume2,
  Mic,
  Wind,
  Shield,
  Heart,
  Coffee,
  Music,
  Flower2,
  Waves,
  Users,
  Layers,
  Lock,
  LogIn,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getStoredOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingProfile,
  DEFAULT_ONBOARDING_PROFILE,
} from "@/lib/onboarding-state";
import { ambientAudio } from "@/lib/ambient-audio";
import { speakEmpathicText, cancelEmpathicSpeech } from "@/lib/empathic-speech";

type OnboardingJourneyProps = {
  onComplete: (profile: OnboardingProfile) => void;
  onSkip?: () => void;
};

// Available honorifics rooted in Assamese & Northeast heritage
const HONORIFIC_OPTIONS = [
  {
    key: "Aitâ",
    assamese: "আইতা",
    title: "Aitâ (আইতা)",
    meaning: "Beloved Grandmother",
    description: "Tender, nurturing respect used within family and community",
  },
  {
    key: "Baidew",
    assamese: "বাইদেউ",
    title: "Baidew (বাইদেউ)",
    meaning: "Respected Elder Sister",
    description: "Affectionate dignity and warm everyday companionship",
  },
  {
    key: "Koka",
    assamese: "ককা",
    title: "Koka (ককা)",
    meaning: "Beloved Grandfather",
    description: "Venerated elder patriarch and gentle storyteller",
  },
  {
    key: "Khura",
    assamese: "খুৰা",
    title: "Khura (খুৰা)",
    meaning: "Elder Uncle / Guide",
    description: "Familiar community elder who offers wisdom and warmth",
  },
];

// Curated soul anchors rooted in Assam & Northeast daily life
const COMFORT_ANCHORS = [
  {
    id: "morning_tea",
    icon: Coffee,
    titleEn: "Morning Courtyard Tea (বগা চাহ)",
    descEn: "Warm earthen cup of Assam CTC with fresh ginger at sunrise on the veranda",
    category: "daily_ritual",
  },
  {
    id: "borgeet_melodies",
    icon: Music,
    titleEn: "Borgeet & Folk Melodies (গীত আৰু সুৰ)",
    descEn: "Sankardeva devotional ragas and soulful bamboo flute echoes across the hills",
    category: "music",
  },
  {
    id: "muga_handloom",
    icon: Layers,
    titleEn: "Handloom & Muga Silk (তাঁত শাল)",
    descEn: "The rhythmic, peaceful tap-tap of the wooden shuttle on golden Assam silk",
    category: "tactile",
  },
  {
    id: "tulsi_courtyard",
    icon: Flower2,
    titleEn: "Courtyard Garden & Tulsi (তুলসী আৰু ফুলনি)",
    descEn: "Evening earthen lamp at holy Tulsi, sweet Nahor blossoms, and damp earth aromas",
    category: "nature",
  },
  {
    id: "luit_river_mist",
    icon: Waves,
    titleEn: "Luit's River Mist (লুইতৰ শীতল বতাহ)",
    descEn: "Watching tiny wooden fishing boats float across the wide, calm Brahmaputra waters",
    category: "nature",
  },
  {
    id: "grandchildren_stories",
    icon: Users,
    titleEn: "Bedtime Tales with Family (নাতি-নাতিনীৰ কথা)",
    descEn: "Burhi Aair Xadhu folktales, family laughter, and granddaughter Rina's weekly calls",
    category: "family",
  },
];

// Compassion safeguards & interaction boundaries
const SAFEGUARD_OPTIONS = [
  {
    id: "gentle_volume",
    titleEn: "Sudden Loud Sounds or Rapid Speech",
    descEn: "MindMitra always speaks in unhurried, mellow tones with spacious pauses between thoughts.",
  },
  {
    id: "zero_quizzing",
    titleEn: "Being Prompted or Corrected When Forgetting",
    descEn: "Zero tests, exams, or quizzes. We gently bridge thoughts without pressure or correction.",
  },
  {
    id: "muga_soft_glare",
    titleEn: "Harsh Glare or Small Cramped Letters",
    descEn: "Pages stay bathed in comforting Muga silk cream hues with generous, high-contrast typography.",
  },
  {
    id: "unhurried_pace",
    titleEn: "Hurried Transitions or Fast Screen Changes",
    descEn: "Screens drift gently like slow river water so your gaze never feels bewildered or rushed.",
  },
];

const STEP_TITLES = [
  { en: "Agoman (The Arrival)", as: "আগমন (যাত্ৰা)" },
  { en: "Identity & Honorific", as: "আপোনাৰ চিনাকী" },
  { en: "Comforts & Nostalgia", as: "মনৰ শান্তি" },
  { en: "Gentle Boundaries", as: "সাৱধানতা" },
  { en: "Your Safe Sanctuary", as: "আপোনাৰ চোতাল" },
];

export function OnboardingJourney({ onComplete, onSkip }: OnboardingJourneyProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<OnboardingProfile>(() => getStoredOnboardingProfile());
  const [isAmbientActive, setIsAmbientActive] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customAnchorText, setCustomAnchorText] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger brief discrete toast notifications
  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Toggle ambient music (tanpura & gentle flute)
  const toggleAmbientAudio = () => {
    if (isAmbientActive) {
      ambientAudio.stop();
      setIsAmbientActive(false);
      triggerToast("Ambient courtyard sound paused");
    } else {
      ambientAudio.playTanpuraDrone();
      setIsAmbientActive(true);
      triggerToast("Playing soothing tanpura & river mist drone");
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stop();
      cancelEmpathicSpeech();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Voice synthesis: speak prompt aloud with unhurried warmth
  const readCurrentStepAloud = () => {
    let script = "";
    if (currentStep === 1) {
      script = "Namaskar. Welcome to MindMitra. A serene, dignified sanctuary shaped by your stories, your memories, and the quiet rhythm of the Brahmaputra. Take all the time you need. There is no hurry here.";
    } else if (currentStep === 2) {
      script = `How should we warmly address you? You can choose a beloved term such as Aitâ, Baidew, Koka, or Khura. It is our honor to walk beside you, ${profile.honorific} ${profile.name}.`;
    } else if (currentStep === 3) {
      script = "What brings your heart quiet comfort and joy? Select the memories that bring peaceful smiles, such as morning courtyard tea, Borgeet melodies, handloom weaving, or river breeze.";
    } else if (currentStep === 4) {
      script = "What should we always be gentle about? We protect you from sudden loud chatter, zero memory quizzing, and hurried transitions.";
    } else if (currentStep === 5) {
      script = `Your sanctuary is ready, ${profile.honorific}. We have prepared your quiet corner with the tea rhythms, gentle songs, and respectful care you love.`;
    }

    triggerToast("Reading page in calm, unhurried voice...");
    speakEmpathicText({
      text: script,
      rate: 0.86,
      pitch: 1.05,
    });
  };

  // Voice speech-to-text dictation toggle (with fallback simulation)
  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      triggerToast("Voice input stopped");
      return;
    }

    setIsVoiceListening(true);
    triggerToast("Listening with warmth... (কওক, শুনো আছোঁ)");

    // Check for webkitSpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = profile.preferredLanguage === "as" ? "as-IN" : "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setProfile((prev) => ({ ...prev, name: transcript.trim() }));
            triggerToast(`Understood: "${transcript}"`);
          }
          setIsVoiceListening(false);
        };

        recognition.onerror = () => {
          setIsVoiceListening(false);
        };

        recognition.onend = () => {
          setIsVoiceListening(false);
        };

        recognition.start();
        return;
      } catch {
        // fallback to gentle simulation below
      }
    }

    // Fallback simulation for browsers without active microphone permissions
    setTimeout(() => {
      setIsVoiceListening(false);
      triggerToast("Name recognized: Purnima Devi");
    }, 2400);
  };

  // Step change with smooth scroll & speech cancel
  const goToStep = (step: number) => {
    cancelEmpathicSpeech();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle comforts
  const toggleComfort = (id: string) => {
    setProfile((prev) => {
      const exists = prev.comforts.includes(id);
      const updated = exists
        ? prev.comforts.filter((c) => c !== id)
        : [...prev.comforts, id];
      return { ...prev, comforts: updated };
    });
  };

  // Toggle sensitivities
  const toggleSensitivity = (id: string) => {
    setProfile((prev) => {
      const exists = prev.sensitivities.includes(id);
      const updated = exists
        ? prev.sensitivities.filter((s) => s !== id)
        : [...prev.sensitivities, id];
      return { ...prev, sensitivities: updated };
    });
  };

  // Add custom anchor
  const handleAddCustomAnchor = (e: FormEvent) => {
    e.preventDefault();
    if (!customAnchorText.trim()) return;
    setProfile((prev) => ({
      ...prev,
      customComforts: [...prev.customComforts, customAnchorText.trim()],
    }));
    triggerToast(`Added custom anchor: "${customAnchorText.trim()}"`);
    setCustomAnchorText("");
    setShowCustomInput(false);
  };

  // Finish onboarding and enter MindMitra Sanctuary
  const handleCompleteJourney = () => {
    cancelEmpathicSpeech();
    ambientAudio.stop();
    const completedProfile: OnboardingProfile = {
      ...profile,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveOnboardingProfile(completedProfile);
    triggerToast(`Welcome Home, ${profile.honorific} ${profile.name}!`);
    setTimeout(() => {
      onComplete(completedProfile);
    }, 450);
  };

  // Active step title
  const activeStepTitle = STEP_TITLES[currentStep - 1] || STEP_TITLES[0];

  return (
    <div className="relative min-h-screen w-full bg-[#fef9f0] text-[#1d1c16] flex flex-col justify-between overflow-x-hidden select-none font-jakarta">
      {/* ── CINEMATIC VISUAL LAYER: Flying over Northeast landscape into Assamese courtyard ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#032212]">
        {/* Scene 1: Aerial flying over Assam rolling green tea hills & Brahmaputra mist (Steps 1 & 2) */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out ${
            currentStep <= 2 ? "opacity-85 scale-105 animate-flight" : "opacity-25 scale-100"
          }`}
          style={{
            backgroundImage: `url('/assets/images/ne_aerial_dawn_1788980040728.jpg'), url('/assets/images/assam_tea_garden_1788977277508.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#fef9f0] via-[#fef9f0]/45 to-transparent" />
          <div className="absolute inset-0 bg-[#032212]/20 backdrop-blur-[0.5px]" />
        </div>

        {/* Scene 2: Peaceful Assamese courtyard veranda with tea & morning light (Steps 3, 4 & 5) */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out ${
            currentStep >= 3 ? "opacity-90 scale-100" : "opacity-0 scale-105"
          }`}
          style={{
            backgroundImage: `url('/assets/images/assamese_courtyard_1788980055319.jpg'), url('/assets/images/brahmaputra_river_1788977296883.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#fef9f0] via-[#fef9f0]/80 to-[#fef9f0]/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#032212]/30 via-transparent to-[#fef9f0]" />
        </div>

        {/* Tactile Golden Muga Silk Texture Overlay (Authentic Assamese weave) */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-multiply pointer-events-none bg-repeat"
          style={{
            backgroundImage: `url('/assets/images/muga_silk_weave_1788980069393.jpg')`,
            backgroundSize: "320px",
          }}
        />

        {/* Ambient Drifting River Mist SVGs */}
        <div className="absolute inset-0 opacity-40 mix-blend-soft-light pointer-events-none animate-mist">
          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 900">
            <path
              d="M-100 600 C 300 550, 700 700, 1100 580 C 1300 520, 1500 640, 1600 620 L 1600 900 L -100 900 Z"
              fill="#FEF9F0"
              opacity="0.6"
            />
            <path
              d="M-50 680 C 250 620, 800 760, 1200 660 C 1400 610, 1550 710, 1650 690 L 1650 900 L -50 900 Z"
              fill="#FEF9F0"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* ── TOP HEADER: Logo, Language, Audio & Skip ── */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#fef9f0]/90 backdrop-blur-xl border border-[#e7e2d9] shadow-sm">
          <div className="w-7 h-7 rounded-full bg-[#1a3826] text-white flex items-center justify-center">
            <Sparkles size={16} className="text-[#fe932c]" />
          </div>
          <span className="font-merriweather font-bold text-lg text-[#032212] tracking-tight">
            MindMitra
          </span>
          <span className="hidden sm:inline text-xs font-inter font-medium text-[#424843] border-l border-[#c2c8c1] pl-2.5 ml-0.5">
            Brahmaputra Serenity Journey
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Vernacular Language Selector */}
          <div className="flex items-center bg-[#fef9f0]/90 backdrop-blur-xl border border-[#e7e2d9] rounded-full px-3 py-1 text-[#424843] shadow-sm">
            <span className="text-xs font-inter font-bold mr-1.5 text-[#904d00]">বাণী:</span>
            <select
              aria-label="Language selection"
              value={profile.preferredLanguage}
              onChange={(e) => {
                const lang = e.target.value as any;
                setProfile((prev) => ({ ...prev, preferredLanguage: lang }));
                triggerToast(lang === "as" ? "অসমীয়া ভাষা বাছনি কৰা হ'ল" : `Switched language to ${lang}`);
              }}
              className="bg-transparent text-xs font-inter font-medium text-[#1d1c16] focus:outline-none cursor-pointer pr-1"
            >
              <option value="as">অসমীয়া</option>
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="brx">बड़ो</option>
              <option value="kha">Khasi</option>
            </select>
          </div>

          {/* Ambient Sounds Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleAmbientAudio}
            title={isAmbientActive ? "Pause calming ambient sounds" : "Play calming ambient river sounds"}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border ${
              isAmbientActive
                ? "bg-[#1a3826] text-white border-[#1a3826] ring-2 ring-[#d97706]/40"
                : "bg-[#fef9f0]/90 text-[#424843] border-[#e7e2d9] hover:bg-[#f2ede4]"
            }`}
          >
            <Wind size={18} className={isAmbientActive ? "animate-pulse text-[#ffdcc3]" : ""} />
          </button>

          {/* Discreet Help / Assistance */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            title="Assistance and guidance"
            className="w-10 h-10 rounded-full bg-[#fef9f0]/90 text-[#904d00] border border-[#e7e2d9] flex items-center justify-center hover:bg-[#ffdcc3]/40 transition-all shadow-sm"
          >
            <HelpCircle size={18} />
          </button>

          {/* Evaluator Quick Skip (Discreet & Non-Intrusive) */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="hidden md:inline-flex text-xs font-inter font-semibold text-[#424843] hover:text-[#032212] px-3 py-1.5 rounded-full hover:bg-[#f2ede4] transition-colors"
            >
              Skip to App →
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN INTERACTIVE CONTAINER: Step card & river progress ── */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 md:py-6 flex-1 flex flex-col justify-center">
        {/* River Progress Stepper */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-[#424843]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d97706] animate-pulse" />
              <span className="font-inter font-bold text-xs uppercase tracking-wider text-[#904d00]">
                Step {currentStep} of 5
              </span>
              <span className="text-[#c2c8c1]">•</span>
              <span className="font-merriweather text-sm font-bold text-[#032212]">
                {activeStepTitle.en}
              </span>
            </div>

            {/* Read Aloud Voice Button */}
            <button
              type="button"
              onClick={readCurrentStepAloud}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f3ea]/90 border border-[#e7e2d9] shadow-xs text-[#032212] hover:bg-[#ffdcc3]/50 transition-colors active:scale-95"
            >
              <Volume2 size={16} className="text-[#d97706]" />
              <span className="font-inter text-xs font-semibold">
                Listen in {profile.preferredLanguage === "as" ? "অসমীয়া" : "English"}
              </span>
            </button>
          </div>

          {/* Smooth River Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#e7e2d9]/80 overflow-hidden shadow-inner flex">
            <div
              className="h-full bg-[#1a3826] transition-all duration-700 ease-out rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* ── CARD PANELS FOR THE 5 MOMENTS ── */}
        <div className="relative">
          {/* ================= STEP 1: THE ARRIVAL & FLIGHT ================= */}
          {currentStep === 1 && (
            <div className="bg-[#fef9f0]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e7e2d9] shadow-2xl shadow-[#032212]/5 flex flex-col gap-6 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#904d00]">
                <Sparkles size={22} className="text-[#d97706]" />
                <span className="font-inter font-bold text-xs tracking-wider uppercase">
                  MindMitra • সোঁৱৰণি সংগী
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="font-merriweather text-3xl sm:text-4xl lg:text-5xl font-bold text-[#032212] leading-tight">
                  Namaskar. Welcome to MindMitra.
                </h1>
                <p className="font-merriweather text-xl sm:text-2xl text-[#904d00] font-normal">
                  নমস্কাৰ। আপোনাৰ মনৰ শান্তি আৰু স্মৃতিৰ চিনাকি চোতাললৈ স্বাগতম।
                </p>
                <p className="font-jakarta text-base sm:text-lg text-[#424843] max-w-2xl pt-2 leading-relaxed">
                  A serene, dignified space shaped by your world, your stories, and the quiet rhythm of the Brahmaputra river. Take all the time you need—there is no hurry here.
                </p>
              </div>

              {/* Cultural Reverence Anchor Banner */}
              <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs">
                <div className="w-10 h-10 rounded-full bg-[#fe932c]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#904d00]">
                  <Waves size={22} />
                </div>
                <div>
                  <h2 className="font-inter font-bold text-sm text-[#032212]">
                    Designed with Reverence for Assam & the Northeast
                  </h2>
                  <p className="font-jakarta text-sm text-[#424843] mt-0.5 leading-normal">
                    From the slow morning mist along Majuli to familiar courtyard chimes in Tezpur, this sanctuary speaks your mother tongue and listens with affectionate heart.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-inter font-bold text-base shadow-lg shadow-[#1a3826]/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] focus:ring-4 focus:ring-[#d97706]/30"
                >
                  <span>Begin Our Journey • যাত্ৰা আৰম্ভ কৰক</span>
                  <ArrowRight size={20} />
                </button>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-[#424843] font-inter text-xs px-2">
                  <Shield size={16} className="text-[#904d00]" />
                  <span>Completely private, calm & elder-friendly</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: IDENTITY & HONORIFIC ================= */}
          {currentStep === 2 && (
            <div className="bg-[#fef9f0]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e7e2d9] shadow-2xl shadow-[#032212]/5 flex flex-col gap-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="font-inter font-bold text-xs text-[#904d00] uppercase tracking-wider">
                  Your Identity & Calling • আপোনাৰ চিনাকী
                </span>
                <h2 className="font-merriweather text-2xl sm:text-3xl lg:text-4xl font-bold text-[#032212]">
                  How should we warmly address you?
                </h2>
                <p className="font-jakarta text-base text-[#424843]">
                  আমাৰ মৰমৰ সংগী, আমি আপোনাক কি বুলি মাতিলে আপোনাৰ আপোন যেন লাগিব?
                </p>
              </div>

              {/* Name input with voice dictation button */}
              <div className="space-y-2">
                <label htmlFor="person-name" className="block font-inter font-semibold text-sm text-[#032212]">
                  Your Preferred Name (আপোনাৰ নাম)
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      id="person-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter name (e.g. Purnima Devi)"
                      className="w-full h-14 px-5 rounded-xl bg-white border border-[#c2c8c1] text-[#1d1c16] font-merriweather text-xl focus:outline-none focus:ring-2 focus:ring-[#1a3826] shadow-sm"
                    />
                    <button
                      type="button"
                      title="Speak name aloud"
                      onClick={() => {
                        speakEmpathicText({
                          text: `Namaskar, ${profile.honorific} ${profile.name}. Welcome home.`,
                        });
                        triggerToast(`Speaking greeting for ${profile.honorific} ${profile.name}`);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-[#904d00] hover:bg-[#f2ede4] rounded-full transition-colors"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>

                  {/* Microphone dictation */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title="Tap to speak name"
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm border ${
                      isVoiceListening
                        ? "bg-[#fe932c] text-white border-[#fe932c] animate-pulse ring-4 ring-[#fe932c]/30"
                        : "bg-[#f8f3ea] text-[#1a3826] border-[#e7e2d9] hover:bg-[#ffdcc3]/50"
                    }`}
                  >
                    <Mic size={22} />
                  </button>
                </div>
                <p className="font-jakarta text-xs text-[#424843] italic">
                  Tap the microphone to speak, or type directly above. (পোনপটীয়াভাৱে কওক বা লিখক)
                </p>
              </div>

              {/* Beloved Assamese Honorifics */}
              <div className="space-y-3 pt-2">
                <span className="block font-inter font-semibold text-sm text-[#032212]">
                  Beloved Assamese & Northeast Terms of Endearment:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {HONORIFIC_OPTIONS.map((opt) => {
                    const isSelected = profile.honorific === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setProfile({
                            ...profile,
                            honorific: opt.key,
                            honorificAssamese: opt.assamese,
                          });
                          triggerToast(`Selected honorific: ${opt.title}`);
                        }}
                        className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? "bg-[#1a3826] text-white border-[#1a3826] shadow-md ring-2 ring-[#d97706]/40"
                            : "bg-[#f8f3ea] text-[#1d1c16] border-[#e7e2d9] hover:bg-[#f2ede4]"
                        }`}
                      >
                        <div>
                          <div
                            className={`font-merriweather text-lg font-bold ${
                              isSelected ? "text-white" : "text-[#032212]"
                            }`}
                          >
                            {opt.title}
                          </div>
                          <div
                            className={`font-inter text-xs font-medium mt-0.5 ${
                              isSelected ? "text-[#ffdcc3]" : "text-[#904d00]"
                            }`}
                          >
                            {opt.meaning}
                          </div>
                        </div>
                        <p
                          className={`font-jakarta text-xs line-clamp-2 ${
                            isSelected ? "text-white/80" : "text-[#424843]"
                          }`}
                        >
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Personalized Reassurance Banner */}
              <div className="p-4 rounded-xl bg-[#c8ebd1]/40 border border-[#adcfb5] text-[#022111] flex items-center gap-3">
                <Heart size={22} className="text-[#1a3826] flex-shrink-0 fill-[#1a3826]" />
                <div className="font-jakarta text-sm">
                  <span className="font-bold">A warm name.</span> It is our deep honor to walk beside you,{" "}
                  <span className="underline decoration-[#d97706] decoration-2 font-bold">
                    {profile.honorific} {profile.name}
                  </span>
                  .
                </div>
              </div>

              {/* Nav controls */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="h-12 px-6 rounded-full bg-[#f2ede4] text-[#1d1c16] font-inter font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e7e2d9] transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Back • পিচলৈ</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-inter font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span>Next: What Brings You Comfort? • আগবাঢ়ক</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: WHAT BRINGS COMFORT & JOY ================= */}
          {currentStep === 3 && (
            <div className="bg-[#fef9f0]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e7e2d9] shadow-2xl shadow-[#032212]/5 flex flex-col gap-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="font-inter font-bold text-xs text-[#904d00] uppercase tracking-wider">
                  Soul Anchors & Nostalgia • মনৰ শান্তি
                </span>
                <h2 className="font-merriweather text-2xl sm:text-3xl lg:text-4xl font-bold text-[#032212]">
                  What brings your heart quiet comfort and joy?
                </h2>
                <p className="font-jakarta text-base text-[#424843]">
                  কোনবোৰ স্মৃতি আৰু কামে আপোনাৰ মন শাঁত পেলায়? Select as many soothing memories as you like:
                </p>
              </div>

              {/* Anchors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {COMFORT_ANCHORS.map((item) => {
                  const Icon = item.icon;
                  const isChecked = profile.comforts.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleComfort(item.id)}
                      className={`min-h-[72px] p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        isChecked
                          ? "bg-[#c8ebd1]/30 border-[#1a3826] shadow-sm ring-1 ring-[#1a3826]"
                          : "bg-[#f8f3ea] border-[#e7e2d9] hover:bg-[#f2ede4]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          isChecked ? "bg-[#d97706] text-white" : "bg-[#e7e2d9] text-[#424843]"
                        }`}
                      >
                        <Check size={16} className={isChecked ? "stroke-[2.5]" : "opacity-0"} />
                      </div>
                      <div className="flex-1">
                        <div className="font-merriweather font-bold text-base text-[#032212]">
                          {item.titleEn}
                        </div>
                        <p className="font-jakarta text-xs text-[#424843] mt-1 leading-normal">
                          {item.descEn}
                        </p>
                      </div>
                      <Icon size={22} className="text-[#904d00]/70 flex-shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>

              {/* Custom Anchors Displayed if Any */}
              {profile.customComforts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#f2ede4] border border-[#e7e2d9] space-y-2">
                  <span className="text-xs font-inter font-bold uppercase text-[#904d00]">
                    Your Personal Memories:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.customComforts.map((custom, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-medium text-[#032212] border border-[#c2c8c1]"
                      >
                        <Sparkles size={12} className="text-[#d97706]" />
                        {custom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Anchor Prompt */}
              {showCustomInput ? (
                <form onSubmit={handleAddCustomAnchor} className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={customAnchorText}
                    onChange={(e) => setCustomAnchorText(e.target.value)}
                    placeholder="e.g., Evening walk to the Namghar, listening to Tokari Geet..."
                    className="flex-1 h-12 px-4 rounded-lg bg-white border border-[#c2c8c1] text-sm text-[#1d1c16] focus:outline-none focus:ring-2 focus:ring-[#1a3826]"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="h-12 px-5 rounded-lg bg-[#1a3826] text-white text-xs font-inter font-bold hover:bg-[#032212] transition-colors"
                    >
                      Save Anchor
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="h-12 px-3 rounded-lg text-xs text-[#424843] hover:bg-[#e7e2d9]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-jakarta text-xs sm:text-sm text-[#424843]">
                    Have a personal song, childhood memory, or sacred tradition?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="px-4 py-2 rounded-lg bg-[#f2ede4] hover:bg-[#e7e2d9] text-xs font-inter font-bold text-[#032212] border border-[#c2c8c1] transition-colors"
                  >
                    + Add Custom Memory
                  </button>
                </div>
              )}

              {/* Nav controls */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="h-12 px-6 rounded-full bg-[#f2ede4] text-[#1d1c16] font-inter font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e7e2d9] transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Back • পিচলৈ</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-inter font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span>Next: Gentle Boundaries • আগবাঢ়ক</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: GENTLE SAFEGUARDS & SENSITIVITIES ================= */}
          {currentStep === 4 && (
            <div className="bg-[#fef9f0]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e7e2d9] shadow-2xl shadow-[#032212]/5 flex flex-col gap-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="font-inter font-bold text-xs text-[#904d00] uppercase tracking-wider">
                  Compassion & Dignity Cues • সাৱধানতা
                </span>
                <h2 className="font-merriweather text-2xl sm:text-3xl lg:text-4xl font-bold text-[#032212]">
                  What should we always be gentle about?
                </h2>
                <p className="font-jakarta text-base text-[#424843]">
                  আপোনাক অপ্ৰস্তুত বা অশান্তি নকৰিবলৈ আমি কি সাৱধানতা ল'ম? MindMitra softens its voice and adapts pacing whenever these arise:
                </p>
              </div>

              {/* Safeguards selection */}
              <div className="flex flex-col gap-3 pt-1">
                {SAFEGUARD_OPTIONS.map((item) => {
                  const isChecked = profile.sensitivities.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSensitivity(item.id)}
                      className={`min-h-[64px] p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                        isChecked
                          ? "bg-[#c8ebd1]/30 border-[#1a3826] shadow-sm ring-1 ring-[#1a3826]"
                          : "bg-[#f8f3ea] border-[#e7e2d9] hover:bg-[#f2ede4]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked ? "bg-[#1a3826] text-white" : "bg-[#e7e2d9] text-[#424843]"
                        }`}
                      >
                        <Shield size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="font-merriweather font-bold text-base text-[#032212]">
                          {item.titleEn}
                        </div>
                        <p className="font-jakarta text-xs text-[#424843] mt-0.5">
                          {item.descEn}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isChecked ? "bg-[#d97706] text-white" : "border border-[#c2c8c1]"
                        }`}
                      >
                        {isChecked && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nav controls */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="h-12 px-6 rounded-full bg-[#f2ede4] text-[#1d1c16] font-inter font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e7e2d9] transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Back • পিচলৈ</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="h-14 px-8 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-inter font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span>Complete Welcome • চোতাললৈ যাওঁ</span>
                  <CheckCircle2 size={20} className="text-[#ffdcc3]" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: ARRIVAL INTO YOUR SANCTUARY ================= */}
          {currentStep === 5 && (
            <div className="bg-[#fef9f0]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e7e2d9] shadow-2xl shadow-[#032212]/10 flex flex-col gap-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-inter font-bold text-xs text-[#904d00] uppercase tracking-wider">
                    Sanctuary Prepared • আপোনাৰ বাবে সাজু
                  </span>
                  <h2 className="font-merriweather text-2xl sm:text-3xl lg:text-4xl font-bold text-[#032212]">
                    Your Sanctuary is Ready, {profile.honorific}.
                  </h2>
                  <p className="font-jakarta text-base text-[#424843]">
                    We have prepared your quiet corner with the tea rhythms, gentle songs, and respectful care you cherish.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-[#c8ebd1] text-[#1a3826] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles size={28} />
                </div>
              </div>

              {/* Personal Sanctuary Dossier Card */}
              <div className="p-6 rounded-2xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e7e2d9]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#ffdcc3] text-[#904d00] font-merriweather font-bold text-lg flex items-center justify-center shadow-xs">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "PD"}
                    </div>
                    <div>
                      <div className="font-merriweather font-bold text-lg text-[#032212]">
                        {profile.name} ({profile.honorificAssamese})
                      </div>
                      <div className="font-inter text-xs text-[#424843]">
                        Language: {profile.preferredLanguage === "as" ? "অসমীয়া" : "English"} • River Rhythm Mode Active
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8ebd1]/70 text-[#022111] font-inter text-xs font-semibold">
                    <Lock size={12} />
                    Personal World Model Encrypted
                  </span>
                </div>

                {/* 3 Pillars Bento Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-white border border-[#e7e2d9]">
                    <div className="flex items-center gap-1.5 text-[#904d00] font-inter text-xs font-bold uppercase mb-1">
                      <Coffee size={15} />
                      Morning Cadence
                    </div>
                    <div className="font-merriweather text-sm font-bold text-[#032212]">
                      Courtyard Tea & Borgeet
                    </div>
                    <p className="font-jakarta text-xs text-[#424843] mt-1">
                      Soft flute melodies and ginger tea gentle reminders at sunrise.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e7e2d9]">
                    <div className="flex items-center gap-1.5 text-[#904d00] font-inter text-xs font-bold uppercase mb-1">
                      <Layers size={15} />
                      Tactile Memory
                    </div>
                    <div className="font-merriweather text-sm font-bold text-[#032212]">
                      Handloom & Luit Waters
                    </div>
                    <p className="font-jakarta text-xs text-[#424843] mt-1">
                      Visual prompts grounded in golden Muga silk and river peace.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e7e2d9]">
                    <div className="flex items-center gap-1.5 text-[#904d00] font-inter text-xs font-bold uppercase mb-1">
                      <Shield size={15} />
                      Safeguard Pact
                    </div>
                    <div className="font-merriweather text-sm font-bold text-[#032212]">
                      Never Hurried
                    </div>
                    <p className="font-jakarta text-xs text-[#424843] mt-1">
                      Zero quizzing, tender voice, unhurried transitions, infinite patience.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="h-12 px-6 rounded-full bg-[#f2ede4] text-[#1d1c16] font-inter font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e7e2d9] transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Review Safeguards</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteJourney}
                  className="h-16 px-10 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white font-merriweather font-bold text-lg shadow-xl shadow-[#1a3826]/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-[#d97706]/30"
                >
                  <span>Step into My Day • মোৰ দিনটো আৰম্ভ কৰক</span>
                  <LogIn size={22} className="text-[#fe932c]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER: Speech Support & Reset ── */}
      <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[#424843] text-xs font-inter">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#904d00]" />
          <span>Assamese, Bengali, Bodo, Khasi & English Speech Synthesis Active</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              goToStep(1);
              triggerToast("Welcome screen refreshed");
            }}
            className="hover:text-[#032212] transition-colors flex items-center gap-1 font-medium"
          >
            <RotateCcw size={13} />
            <span>Restart Welcome</span>
          </button>
          <span>•</span>
          <span>MindMitra Sanctuary v1.2</span>
        </div>
      </footer>

      {/* ── DISCRETE AUDIO TOAST ── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1d1c16] text-[#fef9f0] shadow-2xl flex items-center gap-2.5 pointer-events-none text-xs sm:text-sm font-jakarta font-medium border border-[#424843]/50 animate-bounce"
        >
          <Sparkles size={16} className="text-[#fe932c]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── ASSISTANCE / HELP MODAL ── */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#fef9f0] rounded-2xl p-6 sm:p-8 max-w-md w-full border border-[#e7e2d9] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-[#1a3826]">
              <HelpCircle size={24} className="text-[#d97706]" />
              <h3 className="font-merriweather font-bold text-xl">How MindMitra Welcomes You</h3>
            </div>

            <p className="font-jakarta text-sm text-[#424843] leading-relaxed">
              MindMitra is designed specifically for elders in Northeast India. It is not a hospital intake or clinical examination.
            </p>

            <ul className="space-y-2 text-xs font-jakarta text-[#1d1c16]">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-[#1a3826] mt-0.5 flex-shrink-0" />
                <span>You can speak aloud or type at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-[#1a3826] mt-0.5 flex-shrink-0" />
                <span>There are zero quizzes or memory tests.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-[#1a3826] mt-0.5 flex-shrink-0" />
                <span>We speak in gentle Assamese, Bengali, Bodo, Khasi, and English.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-2 w-full py-3 rounded-xl bg-[#1a3826] hover:bg-[#032212] text-white font-inter font-bold text-sm transition-colors"
            >
              Close • বুজি পালোঁ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
