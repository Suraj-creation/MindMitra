import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  Sparkles,
  MapPin,
  Heart,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Coffee,
  Music,
  Flower2,
  Image as ImageIcon,
  PhoneCall,
  Flame,
  User,
  Trees,
  Sun,
  Wind,
  Smile,
  Info,
} from "lucide-react";
import { ambientAudio } from "../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../lib/empathic-speech";
import {
  loadOnboardingProfile,
  saveOnboardingProfile,
  DEFAULT_PROFILE,
} from "../lib/onboarding-storage";
import type { UserOnboardingProfile } from "../types";

interface OnboardingExperienceProps {
  onComplete: (profile: UserOnboardingProfile) => void;
  onCancel?: () => void;
  initialProfile?: UserOnboardingProfile;
}

// Places grounded in Northeast India
const PLACES = [
  {
    id: "tezpur",
    title: "Tezpur (তেজপুৰ)",
    region: "Sonitpur, Assam",
    desc: "Town of eternal historic gardens, ancient ponds, and peaceful Brahmaputra riverbanks.",
    img: "/assets/images/brahmaputra_river_1788977296883.jpg",
  },
  {
    id: "guwahati",
    title: "Guwahati (গুৱাহাটী)",
    region: "Kamrup, Assam",
    desc: "The sacred gateway on the wide river, where the mist embraces the Nilachal hills.",
    img: "/assets/images/ne_aerial_dawn_1788980040728.jpg",
  },
  {
    id: "dibrugarh",
    title: "Dibrugarh (ডিব্ৰুগড়)",
    region: "Upper Assam",
    desc: "Lush rolling tea estates, cool morning river breeze, and sweet Assamese birdsong.",
    img: "/assets/images/assam_tea_garden_1788977277508.jpg",
  },
  {
    id: "silchar",
    title: "Silchar (শিলচৰ)",
    region: "Barak Valley",
    desc: "Serene valley slopes, quiet courtyard verandas, and gentle southern rains.",
    img: "/assets/images/assamese_courtyard_1788980055319.jpg",
  },
];

const HONORIFICS = [
  {
    id: "aita",
    label: "Aitâ (আইতা)",
    meaning: "Grandmother — tender, deep respect and warmth",
    spoken: "আইতা",
  },
  {
    id: "baideu",
    label: "Baideu (বাইদেউ)",
    meaning: "Elder Sister — loving, gentle companionship",
    spoken: "বাইদেউ",
  },
  {
    id: "maa",
    label: "Maa (মা)",
    meaning: "Mother — cherished familial reverence",
    spoken: "মা",
  },
  {
    id: "none",
    label: "Just my name (কেৱল মোৰ নাম)",
    meaning: "Direct, personal, and familiar",
    spoken: "",
  },
];

const GENTLE_JOYS = [
  {
    id: "tea_ceremony",
    icon: Coffee,
    title: "Morning tea on the veranda (চাহৰ জুতি)",
    desc: "Warm freshly boiled Assam tea with crushed green cardamom and fresh ginger.",
    img: "/assets/images/assamese_tea_ceremony_1789020488707.jpg",
  },
  {
    id: "flute_ragas",
    icon: Music,
    title: "Bamboo flute ragas (বাঁহীৰ সুৰ)",
    desc: "Peaceful morning folk ragas, Assamese flute melodies, and soothing river tunes.",
    img: "/assets/images/ne_aerial_dawn_1788980040728.jpg",
  },
  {
    id: "marigolds",
    icon: Flower2,
    title: "Courtyard flowers & nahor (ফুলৰ যত্ন)",
    desc: "Tending bright golden Gendhu phul, sweet Nahor blossoms, and holy tulsi.",
    img: "/assets/images/assamese_courtyard_1788980055319.jpg",
  },
  {
    id: "family_photos",
    icon: ImageIcon,
    title: "Family albums & photos (পুৰণি ছবি)",
    desc: "Looking at cherished wedding photographs and smiles under the courtyard mango tree.",
    img: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
  },
  {
    id: "muga_weaving",
    icon: Sparkles,
    title: "Weaving golden muga silk (তাঁতৰ শাল)",
    desc: "The rhythmic tactile calm of loom shuttles, golden silk threads, and traditional gamosa.",
    img: "/assets/images/muga_silk_weave_1788980069393.jpg",
  },
  {
    id: "loved_ones_call",
    icon: PhoneCall,
    title: "Calls from loved ones (মৰমৰ মাত)",
    desc: "Hearing granddaughter Rina's cheerful voice and laughter from Guwahati in the evening.",
    img: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
  },
];

const CALM_PROTECTIONS = [
  {
    id: "no_quizzing",
    title: "Never quiz, test, or evaluate memory",
    desc: "MindMitra is your loving companion, never an examiner. No testing or stressful recall requests.",
    badge: "Dignity First",
  },
  {
    id: "no_rushing",
    title: "No rushing or hurried speech",
    desc: "Everything moves at your natural, gentle pace. Infinite patience and soothing cadence.",
    badge: "Unhurried Pace",
  },
  {
    id: "acoustic_peace",
    title: "Shield from loud, sudden noises",
    desc: "Only soft acoustic tones and gentle ambient breezes. No sudden alarms or loud ringers.",
    badge: "Gentle Audio",
  },
  {
    id: "dim_light_protection",
    title: "Evening reassurance at twilight",
    desc: "Extra grounding warmth and family presence as dusk settles over the courtyard.",
    badge: "Sundown Calm",
  },
  {
    id: "traditional_diet",
    title: "Courtyard herbal & tea rituals",
    desc: "Reminders tailored to gentle vegetarian meals, warm herbal water, and afternoon tea.",
    badge: "Nourishment",
  },
];

export const OnboardingExperience: React.FC<OnboardingExperienceProps> = ({
  onComplete,
  onCancel,
  initialProfile,
}) => {
  // Step: 0: Aerial Flyover / Intro, 1: Place & Roots, 2: Person & Dignity, 3: Gentle Joys, 4: Protecting Calm, 5: Arrival & Care
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Profile drafting state
  const [name, setName] = useState<string>(initialProfile?.name || "পূৰ্ণিমা দেৱী");
  const [honorific, setHonorific] = useState<string>(initialProfile?.honorific || "aita");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("tezpur");
  const [customPlace, setCustomPlace] = useState<string>("");
  const [language, setLanguage] = useState<"as" | "en">(initialProfile?.language || "as");
  const [selectedJoys, setSelectedJoys] = useState<string[]>(
    initialProfile?.joys || ["tea_ceremony", "flute_ragas", "marigolds", "family_photos"]
  );
  const [selectedProtections, setSelectedProtections] = useState<string[]>(
    initialProfile?.sensitivities || ["no_quizzing", "no_rushing", "dim_light_protection"]
  );

  // Start peaceful ambient sound on mount
  useEffect(() => {
    ambientAudio.playCourtyardSounds();
    setAmbientPlaying(true);

    return () => {
      ambientAudio.stop();
      cancelEmpathicSpeech();
    };
  }, []);

  const toggleAmbient = () => {
    if (ambientPlaying) {
      ambientAudio.stop();
      setAmbientPlaying(false);
    } else {
      if (currentStep <= 1) {
        ambientAudio.playCourtyardSounds();
      } else {
        ambientAudio.playFolkFlute();
      }
      setAmbientPlaying(true);
    }
  };

  const speakCurrentStepNarrative = (text: string) => {
    if (isSpeaking) {
      cancelEmpathicSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakWarmly(text, {
      rate: 0.85,
      pitch: 1.05,
      lang: language === "as" ? "as-IN" : "en-IN",
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleToggleJoy = (joyId: string) => {
    setSelectedJoys((prev) =>
      prev.includes(joyId) ? prev.filter((id) => id !== joyId) : [...prev, joyId]
    );
  };

  const handleToggleProtection = (protId: string) => {
    setSelectedProtections((prev) =>
      prev.includes(protId) ? prev.filter((id) => id !== protId) : [...prev, protId]
    );
  };

  const handleComplete = () => {
    const chosenPlaceObj = PLACES.find((p) => p.id === selectedPlaceId);
    const resolvedPlace = customPlace.trim() || chosenPlaceObj?.title || "তেজপুৰ, অসম (Tezpur, Assam)";

    const finishedProfile: UserOnboardingProfile = {
      completed: true,
      name: name.trim() || "পূৰ্ণিমা দেৱী",
      honorific,
      place: resolvedPlace,
      subplace: chosenPlaceObj?.region || "Assam",
      language,
      joys: selectedJoys,
      sensitivities: selectedProtections,
      trustedCaregiverName: "Anu (Daughter / জীয়ৰী)",
      trustedCaregiverPhone: "+91 98640 12345",
      completedAt: new Date().toISOString(),
    };

    saveOnboardingProfile(finishedProfile);
    onComplete(finishedProfile);
  };

  // Resolve current background image based on step to give a flying-in cinematic progression
  const getStepBackgroundImage = () => {
    switch (currentStep) {
      case 0:
        return "/assets/images/ne_aerial_dawn_1788980040728.jpg"; // High altitude aerial over misty hills
      case 1:
        return PLACES.find((p) => p.id === selectedPlaceId)?.img || "/assets/images/brahmaputra_river_1788977296883.jpg"; // River landscape & valley
      case 2:
        return "/assets/images/assamese_courtyard_1788980055319.jpg"; // Courtyard home arrival
      case 3:
        return "/assets/images/assamese_tea_ceremony_1789020488707.jpg"; // Warm tea & gentle joys
      case 4:
        return "/assets/images/ne_aerial_dawn_1788980040728.jpg"; // Calm misty sanctuary
      case 5:
      default:
        return "/assets/images/assamese_courtyard_1788980055319.jpg"; // Sunlit veranda home
    }
  };

  const stepTitles = [
    "Northeast Horizon",
    "Place & Roots",
    "Your Name & Dignity",
    "Gentle Joys",
    "Protecting Calm",
    "Welcome Home",
  ];

  return (
    <div
      id="onboarding-cinematic-container"
      className="relative min-h-screen w-full bg-[#122119] text-[#fef9f0] overflow-hidden flex flex-col justify-between select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Background cinematic image with smooth motion */}
      <motion.div
        key={getStepBackgroundImage()}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <img
          src={getStepBackgroundImage()}
          alt="Northeast Indian Landscape"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.08]"
        />
        {/* Deep atmospheric gradients matching Brahmaputra mist palette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101e16] via-[#101e16]/65 to-[#101e16]/40" />
        <div className="absolute inset-0 bg-radial at-center from-transparent via-[#101e16]/30 to-[#101e16]/80" />
      </motion.div>

      {/* Top Bar: MindMitra Identity, Sound Control & Step Progress */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 flex items-center justify-center backdrop-blur-md shadow-sm">
            <Sparkles className="w-5 h-5 text-[#ffdcc3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#fef9f0]">
                MindMitra
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffdcc3]/20 text-[#ffdcc3] font-medium border border-[#ffdcc3]/30">
                মনমিত্ৰ
              </span>
            </div>
            <p className="text-xs text-[#ffdcc3]/75 hidden sm:block">
              Cognitive Companion of Northeast India
            </p>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="hidden md:flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {stepTitles.map((title, idx) => (
            <button
              key={title}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className="flex items-center gap-1.5 transition-all text-left"
              title={title}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-7 bg-[#ffdcc3]"
                    : idx < currentStep
                    ? "w-2 bg-[#ffdcc3]/60"
                    : "w-2 bg-white/20"
                }`}
              />
            </button>
          ))}
          <span className="text-xs text-[#ffdcc3]/80 font-medium ml-2">
            {currentStep + 1} / {stepTitles.length}
          </span>
        </div>

        {/* Sensory Controls (Ambient Audio + Voice Guidance) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-onboarding-ambient"
            type="button"
            onClick={toggleAmbient}
            className={`p-2.5 rounded-full transition-all backdrop-blur-md border ${
              ambientPlaying
                ? "bg-[#ffdcc3]/20 text-[#ffdcc3] border-[#ffdcc3]/40 shadow-sm"
                : "bg-black/30 text-white/60 border-white/10 hover:text-white"
            }`}
            title={ambientPlaying ? "Mute ambient acoustic sounds" : "Play calming ambient sounds"}
          >
            {ambientPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs px-3 py-2 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all border border-white/10"
            >
              Skip to Home
            </button>
          )}
        </div>
      </header>

      {/* Main Content Stage with Smooth Transitions */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ── STEP 0: Northeast Landscape Aerial Flyover ─────────────────── */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 text-center sm:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 backdrop-blur-md text-[#ffdcc3] text-sm">
                <Wind className="w-4 h-4 text-[#ffdcc3]" />
                <span>Brahmaputra Mist & Ancient Hills • ব্ৰহ্মপুত্ৰৰ সমীৰণ</span>
              </div>

              <div className="space-y-4 max-w-2xl">
                <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight text-[#fef9f0] tracking-tight">
                  Over the mist of the eastern hills, where the great river carries ancient whispers...
                </h1>
                <p className="text-lg sm:text-xl text-[#ffdcc3]/90 leading-relaxed font-light">
                  Welcome to MindMitra. A calm, dignified presence crafted with deep reverence for your rhythm,
                  your memories, and your loved ones.
                </p>
                <p className="text-base text-[#fef9f0]/75 font-serif italic">
                  "নমস্কাৰ। আপোনাৰ স্মৃতি, আপোনাৰ সুখ, আৰু আপোনাৰ শান্তিৰ বাবে আমি ইয়াত আছোঁ।"
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  id="btn-onboarding-start"
                  type="button"
                  onClick={() => {
                    cancelEmpathicSpeech();
                    setCurrentStep(1);
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ffdcc3] hover:bg-[#ffe7d5] text-[#14231b] font-medium text-lg flex items-center justify-center gap-3 shadow-lg shadow-black/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Begin Gentle Journey (যাত্ৰা আৰম্ভ কৰক)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    speakCurrentStepNarrative(
                      "Welcome to MindMitra. Across the misty eastern hills of Assam, we are arriving at your world. Let us begin a quiet, gentle journey together."
                    )
                  }
                  className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center gap-2.5 text-base transition-all"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-[#ffdcc3] animate-pulse" : ""}`} />
                  <span>{isSpeaking ? "Pause Narration" : "Listen in Warm Voice"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Place & Roots ──────────────────────────────────────── */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 text-[#ffdcc3] text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Place & Ancestral Grounding • জন্মভূমিৰ পৰশ</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#fef9f0] font-normal">
                  Where does your heart feel most at peace?
                </h2>
                <p className="text-base text-[#ffdcc3]/85">
                  Every home has its own quiet warmth, its own breeze, and its own river.
                </p>
              </div>

              {/* Grid of Northeast Places */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {PLACES.map((place) => {
                  const isSelected = selectedPlaceId === place.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`p-4 rounded-2xl text-left transition-all border relative backdrop-blur-md flex items-start gap-4 ${
                        isSelected
                          ? "bg-[#ffdcc3]/20 border-[#ffdcc3] shadow-md ring-1 ring-[#ffdcc3]"
                          : "bg-black/35 hover:bg-black/50 border-white/10 text-white/80"
                      }`}
                    >
                      <img
                        src={place.img}
                        alt={place.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-white/15 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-lg font-semibold text-[#fef9f0] truncate">
                            {place.title}
                          </h3>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#ffdcc3] flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-[#14231b]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#ffdcc3] mt-0.5">{place.region}</p>
                        <p className="text-xs text-white/75 mt-1.5 line-clamp-2 leading-relaxed">
                          {place.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom village / ancestral home input */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-[#ffdcc3]/85 mb-1.5">
                  Or enter your cherished village or ancestral town:
                </label>
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={customPlace}
                    onChange={(e) => setCustomPlace(e.target.value)}
                    placeholder="e.g. Kaliabor, Majuli, Golaghat, Jorhat..."
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#ffdcc3] text-sm backdrop-blur-md"
                  />
                  <MapPin className="absolute right-3.5 top-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: The Person & Dignity ───────────────────────────────── */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 text-[#ffdcc3] text-xs font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Arriving at the Veranda • নাম আৰু মৰমৰ সম্বোধন</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#fef9f0] font-normal">
                  What sweet name brings you comfort when someone calls you?
                </h2>
                <p className="text-base text-[#ffdcc3]/85">
                  We address you with dignity, familial affection, and complete patience.
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-2 max-w-lg">
                <label className="block text-sm font-medium text-[#ffdcc3]">
                  Your Name (আপোনাৰ নাম)
                </label>
                <div className="relative">
                  <input
                    id="input-onboarding-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. পূৰ্ণিমা দেৱী (Purnima Devi)"
                    className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#ffdcc3] text-xl font-serif backdrop-blur-md"
                  />
                  <Smile className="absolute right-4 top-4 w-6 h-6 text-[#ffdcc3]/60 pointer-events-none" />
                </div>
              </div>

              {/* Respectful Honorific Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#ffdcc3]">
                  How should MindMitra address you in conversation?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HONORIFICS.map((h) => {
                    const isSelected = honorific === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setHonorific(h.id);
                          // Audible preview
                          const greeting =
                            language === "as"
                              ? `নমস্কাৰ ${name} ${h.spoken}`
                              : `Namaskar ${name} ${h.label.split(" ")[0]}`;
                          speakWarmly(greeting, { rate: 0.88, pitch: 1.05 });
                        }}
                        className={`p-4 rounded-2xl text-left border transition-all backdrop-blur-md flex items-center justify-between ${
                          isSelected
                            ? "bg-[#ffdcc3]/20 border-[#ffdcc3] text-white shadow-md ring-1 ring-[#ffdcc3]"
                            : "bg-black/35 hover:bg-black/50 border-white/10 text-white/80"
                        }`}
                      >
                        <div>
                          <div className="font-serif font-medium text-lg text-[#fef9f0]">
                            {h.label}
                          </div>
                          <div className="text-xs text-[#ffdcc3]/75 mt-1">{h.meaning}</div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#ffdcc3] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-[#14231b]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-white/70">Preferred voice language:</span>
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setLanguage("as")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      language === "as"
                        ? "bg-[#ffdcc3] text-[#14231b]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    অসমীয়া (Assamese)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      language === "en"
                        ? "bg-[#ffdcc3] text-[#14231b]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    English (Indian)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Gentle Joys ────────────────────────────────────────── */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 text-[#ffdcc3] text-xs font-medium">
                  <Heart className="w-3.5 h-3.5 text-[#ffdcc3]" />
                  <span>Small Everyday Delights • মনৰ আনন্দ</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#fef9f0] font-normal">
                  What quiet moments bring peace to your spirit?
                </h2>
                <p className="text-base text-[#ffdcc3]/85">
                  Care begins with the simple joys that ground your morning and soothe your evening.
                </p>
              </div>

              {/* Gentle Joys Multi-select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {GENTLE_JOYS.map((joy) => {
                  const isSelected = selectedJoys.includes(joy.id);
                  const Icon = joy.icon;
                  return (
                    <button
                      key={joy.id}
                      type="button"
                      onClick={() => handleToggleJoy(joy.id)}
                      className={`p-4 rounded-2xl text-left border transition-all relative backdrop-blur-md flex flex-col justify-between min-h-[140px] ${
                        isSelected
                          ? "bg-[#ffdcc3]/20 border-[#ffdcc3] shadow-md ring-1 ring-[#ffdcc3]"
                          : "bg-black/35 hover:bg-black/50 border-white/10 text-white/75"
                      }`}
                    >
                      <div className="flex items-start justify-between w-full mb-2">
                        <div
                          className={`p-2 rounded-xl ${
                            isSelected
                              ? "bg-[#ffdcc3] text-[#14231b]"
                              : "bg-white/10 text-white/80"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#ffdcc3] border-[#ffdcc3] text-[#14231b]"
                              : "border-white/30 bg-black/20"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[#fef9f0] leading-snug">
                          {joy.title}
                        </h4>
                        <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                          {joy.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Protecting Your Calm ───────────────────────────────── */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 text-[#ffdcc3] text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ffdcc3]" />
                  <span>Respect & Sensitivities • মৰ্য্যাদা আৰু সুৰক্ষা</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#fef9f0] font-normal">
                  How can we best protect your quiet calm?
                </h2>
                <p className="text-base text-[#ffdcc3]/85">
                  Just as important as joy is knowing what feels heavy or tiring. We promise to protect your peace.
                </p>
              </div>

              {/* Protective cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {CALM_PROTECTIONS.map((prot) => {
                  const isSelected = selectedProtections.includes(prot.id);
                  return (
                    <button
                      key={prot.id}
                      type="button"
                      onClick={() => handleToggleProtection(prot.id)}
                      className={`p-4 rounded-2xl text-left border transition-all relative backdrop-blur-md flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-[#ffdcc3]/20 border-[#ffdcc3] shadow-md ring-1 ring-[#ffdcc3]"
                          : "bg-black/35 hover:bg-black/50 border-white/10 text-white/75"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-[#ffdcc3] border-[#ffdcc3] text-[#14231b]"
                            : "border-white/30 bg-black/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-base font-semibold text-[#fef9f0]">
                            {prot.title}
                          </h4>
                        </div>
                        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-[#ffdcc3] border border-white/10 font-medium">
                          {prot.badge}
                        </span>
                        <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                          {prot.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dignity Promise Notice */}
              <div className="p-4 rounded-2xl bg-[#ffdcc3]/10 border border-[#ffdcc3]/25 backdrop-blur-md flex items-center gap-3.5">
                <ShieldCheck className="w-6 h-6 text-[#ffdcc3] shrink-0" />
                <p className="text-xs sm:text-sm text-[#fef9f0]/90 font-light">
                  <strong className="text-[#ffdcc3] font-medium">Our Dignity Oath:</strong> MindMitra will never label you, test your memory, or treat you like a clinical subject. You are in your home, among family.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Welcome Home & Gentle Introduction to Care ─────────── */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdcc3]/15 border border-[#ffdcc3]/30 text-[#ffdcc3] text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#ffdcc3]" />
                  <span>Sanctuary Ready • আপোনাৰ বাবে প্ৰস্তুত</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#fef9f0] font-normal leading-tight">
                  Your courtyard is peaceful, {name}{" "}
                  {honorific !== "none" ? HONORIFICS.find((h) => h.id === honorific)?.spoken : ""}.
                </h2>
                <p className="text-lg text-[#ffdcc3]/90 max-w-xl">
                  Everything you love has been woven together. Your daughter Anu is nearby in the house,
                  granddaughter Rina will call at dusk, and your tea is always warm.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md space-y-1">
                  <span className="text-xs text-[#ffdcc3] uppercase tracking-wider font-semibold">
                    Home & Roots
                  </span>
                  <p className="font-serif text-base text-[#fef9f0]">
                    {customPlace.trim() ||
                      PLACES.find((p) => p.id === selectedPlaceId)?.title ||
                      "Tezpur, Assam"}
                  </p>
                  <p className="text-xs text-white/60">Courtyard & Riverbank</p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md space-y-1">
                  <span className="text-xs text-[#ffdcc3] uppercase tracking-wider font-semibold">
                    Cherished Joys
                  </span>
                  <p className="font-serif text-base text-[#fef9f0]">
                    {selectedJoys.length} Moments of Calm
                  </p>
                  <p className="text-xs text-white/60">Tea, Flute & Memories</p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md space-y-1">
                  <span className="text-xs text-[#ffdcc3] uppercase tracking-wider font-semibold">
                    Trusted Circle
                  </span>
                  <p className="font-serif text-base text-[#fef9f0]">Anu & Rina</p>
                  <p className="text-xs text-white/60">Tele-MANAS 14416 active</p>
                </div>
              </div>

              {/* Ready Action CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  id="btn-onboarding-complete"
                  type="button"
                  onClick={handleComplete}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#ffdcc3] hover:bg-[#ffe7d5] text-[#14231b] font-medium text-lg flex items-center justify-center gap-3 shadow-xl shadow-black/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Step into Your Day (দিনটো আৰম্ভ কৰক)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    speakCurrentStepNarrative(
                      `Namaskar ${name}. Your personal sanctuary is ready. You are safe in your ancestral home in Tezpur. Let us begin your day together with calm and joy.`
                    )
                  }
                  className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center gap-2 text-base transition-all"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-[#ffdcc3] animate-pulse" : ""}`} />
                  <span>{isSpeaking ? "Pause Narration" : "Hear Blessing"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar (Previous / Next Buttons) */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-6 sm:pb-8 flex items-center justify-between">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={() => {
              cancelEmpathicSpeech();
              setCurrentStep((s) => Math.max(0, s - 1));
            }}
            className="px-5 py-2.5 rounded-full bg-black/35 hover:bg-black/50 text-white/80 hover:text-white border border-white/10 backdrop-blur-md flex items-center gap-2 text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep > 0 && currentStep < 5 && (
          <button
            id={`btn-onboarding-next-${currentStep}`}
            type="button"
            onClick={() => {
              cancelEmpathicSpeech();
              setCurrentStep((s) => Math.min(5, s + 1));
            }}
            className="px-7 py-3 rounded-full bg-[#ffdcc3] hover:bg-[#ffe7d5] text-[#14231b] font-medium text-sm flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Continue (আগবাঢ়ক)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
};
