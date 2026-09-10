"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sun,
  Home,
  Coffee,
  Phone,
  Volume2,
  PlayCircle,
  Flower2,
  Image as ImageIcon,
  Heart,
  Sparkles,
  Mic,
  Send,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Radio,
  Music,
  StopCircle,
  HelpCircle,
  Users,
} from "lucide-react";
import { ambientAudio } from "@/lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech, isSpeechSynthesisActive } from "@/lib/empathic-speech";
import type { VoiceCapability } from "@/lib/api";

type PersonDayViewProps = {
  displayName?: string;
  onNavigate: (section: "day" | "life" | "activity" | "people" | "help") => void;
  sendTurn?: (message: string) => Promise<any>;
  voice?: VoiceCapability | null;
  onQuickCall: (name: string, phone: string) => void;
  onSelectEcosystemRole?: (role: string) => void;
};

export function PersonDayView({
  displayName = "Purnima",
  onNavigate,
  sendTurn,
  voice,
  onQuickCall,
  onSelectEcosystemRole,
}: PersonDayViewProps) {
  // Courtyard ambient sound state
  const [isPlayingCourtyard, setIsPlayingCourtyard] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Full day schedule expander state
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  // Companion interactive state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [companionInput, setCompanionInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companionMessage, setCompanionMessage] = useState<{
    text: string;
    assamese?: string;
    isGreeting?: boolean;
  }>({
    text: "নমস্কাৰ পূৰ্ণিমা বাইদেউ। আজি তেজপুৰত সুন্দৰ ফৰকাল বতৰ। মই আপোনাৰ কাষতেই আছো—আজিৰ দিনটো কেনেকুৱা লাগিল বা কিবা গান শুনিব বিচাৰে নেকি?",
    assamese: "Namaskar Purnima baideu. Today the weather in Tezpur is pleasantly sunny. I am right here by your side—would you like to hear a song or know what comes next?",
    isGreeting: true,
  });

  const conversationRef = useRef<HTMLDivElement>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stop();
      cancelEmpathicSpeech();
    };
  }, []);

  // Courtyard audio toggle
  const toggleCourtyardSounds = () => {
    if (isPlayingCourtyard) {
      ambientAudio.stop();
      setIsPlayingCourtyard(false);
    } else {
      setIsPlayingMusic(false);
      ambientAudio.playCourtyardSounds();
      setIsPlayingCourtyard(true);
    }
  };

  // Music toggle
  const toggleMusicSounds = () => {
    if (isPlayingMusic) {
      ambientAudio.stop();
      setIsPlayingMusic(false);
    } else {
      setIsPlayingCourtyard(false);
      ambientAudio.playFolkFlute();
      setIsPlayingMusic(true);
    }
  };

  // Speak companion message aloud
  const handleSpeakAloud = (textToSpeak?: string) => {
    const text = textToSpeak || `${companionMessage.text} ${companionMessage.assamese || ""}`;
    if (isSpeechSynthesisActive()) {
      cancelEmpathicSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakWarmly(text, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Microphone toggle & speech interaction
  const handleToggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // Simulate gentle attentive listening window, then generate empathic response
    setTimeout(() => {
      setIsListening(false);
      const responses = [
        {
          text: "আপুনি বৰ শান্তভাৱে ক'লে। আজি বিয়লি ৪ বজাত অনুৱে আপোনাৰ কাৰণে গৰম ইলাচি চাহ আৰু পিঠা লৈ আহিব।",
          assamese: "You spoke so gently. At 4:00 PM today, Anu will bring warm cardamom tea and fresh pitha on the veranda.",
        },
        {
          text: "ৰিনাই গুৱাহাটীৰ পৰা ৫ বজাত ফোন কৰিব। তাই কাইলৈ তেজপুৰলৈ আহিবলৈ মন কৰিছে বুলি ক'লে।",
          assamese: "Rina will call from Guwahati at 5:00 PM. She mentioned she is eager to visit you in Tezpur soon.",
        },
        {
          text: "বৰগীত আৰু বাঁহীৰ সুৰ আপোনাৰ বৰ প্ৰিয়। আমি এতিয়া এটা শান্ত বিহু বাঁহীৰ সুৰ বজাওঁ নেকি?",
          assamese: "You cherish the peaceful Borxongit and bamboo flute. Shall we play a gentle Assamese melody together?",
        },
      ];
      const picked = responses[Math.floor(Math.random() * responses.length)];
      setCompanionMessage(picked);
      handleSpeakAloud(`${picked.text} ${picked.assamese}`);
    }, 2800);
  };

  // Submit typed query or thought starter
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSubmitting(true);
    setCompanionInput("");

    if (sendTurn) {
      try {
        const res = await sendTurn(queryText);
        if (res && res.text) {
          setCompanionMessage({
            text: res.text,
            assamese: res.assameseHint || "আপোনাৰ কাষতেই আছোঁ।",
          });
          handleSpeakAloud(res.text);
          setIsSubmitting(false);
          return;
        }
      } catch {
        // fallback to curated empathic response below
      }
    }

    // Curated empathic responses matching Assam cultural context
    setTimeout(() => {
      let reply = {
        text: "নমস্কাৰ। আজিৰ দিনটো বৰ সুন্দৰ আৰু শান্ত। আপোনাৰ চাহ আৰু গান সকলো সময়মতে প্ৰস্তুত আছে।",
        assamese: "Namaskar. Today is calm and sunny. Your tea, music, and family calls are all prepared peacefully.",
      };

      const lower = queryText.toLowerCase();
      if (lower.includes("rina") || lower.includes("call")) {
        reply = {
          text: "ৰিনাই আজি ঠিক আবেলি ৫ বজাত গুৱাহাটীৰ পৰা ফোন কৰিব। তাইৰ ফটোখন আপুনি 'People' পৃষ্ঠাতো চাব পাৰে।",
          assamese: "Rina will call today right at 5:00 PM from Guwahati. You can also see her photo on the People page.",
        };
      } else if (lower.includes("song") || lower.includes("flute") || lower.includes("bihu") || lower.includes("গান")) {
        reply = {
          text: "আমি এটা শান্ত বাঁহীৰ সুৰ আৰম্ভ কৰিছোঁ। ব্ৰহ্মপুত্ৰৰ পাৰৰ বতাহজাকৰ দৰেই ই আপোনাৰ মনটো জুৰাব।",
          assamese: "We have started a soothing bamboo flute melody. Like the gentle breeze on the Brahmaputra, it brings calm.",
        };
        ambientAudio.playFolkFlute();
        setIsPlayingMusic(true);
      } else if (lower.includes("tezpur") || lower.includes("ghat") || lower.includes("ঘাট")) {
        reply = {
          text: "তেজপুৰৰ অগ্নিগড় আৰু নদীৰ ঘাটত এতিয়া বতাহজাক বৰ শীতল। চাহ বাগিচাবোৰত নতুন কুঁহিপাত ওলাইছে।",
          assamese: "At Agnigarh and the Tezpur river ghat, the breeze is cool. Fresh tender leaves are shining in the tea gardens.",
        };
      }

      setCompanionMessage(reply);
      handleSpeakAloud(`${reply.text} ${reply.assamese}`);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="w-full flex flex-col gap-8 md:gap-12 pb-24 text-[#1d1c16]">
      {/* ── 1. Hero Cultural Sanctuary ─────────────────────────────────────── */}
      <section
        aria-label="Cultural Sanctuary Orientation"
        className="relative overflow-hidden rounded-3xl bg-[#fef9f0] border border-[#c2c8c1] shadow-[0_6px_20px_-4px_rgba(26,56,38,0.06),0_2px_6px_-1px_rgba(26,56,38,0.04)]"
      >
        {/* Ambient Heritage Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8VLa593nlZKQmXpyoeWgtv7BjbvUgsNxZyoWli_GBdw1m8s_kE8g_nmcPcaWRqpU00fw7L4JucyOjg0M_jsuLDzhlESPOwcbHrM4hAyyIk8hE0grs7QJauuQiExsnp8PzMytZBfkYfrqxC6W3OzDSH1jrZHnUWrFZjZS0XpzuPXDC7lsCgQ4K0pXJdb1_ribnmOsEbjvu3TwBHhod8trOIXSVUz8nliSYF7eW7Dyyk6XM4zjnckrs"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center mix-blend-soft-light opacity-40 scale-105"
            onError={(e) => {
              // Fallback to local image asset if external fails
              (e.currentTarget as HTMLImageElement).src = "/assets/images/assamese_courtyard_1788980055319.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fef9f0] via-[#fef9f0]/85 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-6 md:gap-8">
          {/* Cultural Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c2c8c1]/40 pb-5">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#f8f3ea] border border-[#c2c8c1]/60 shadow-xs">
              <Sun className="text-[#904d00]" size={18} strokeWidth={2.2} />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#1d1c16]">
                তেজপুৰ, অসম · Tezpur · Gentle Sun 24°C
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#c8ebd1]/40 border border-[#81a28a]/40 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3826] animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-[#1a3826]">
                Anu is close by in the house
              </span>
            </div>
          </div>

          {/* Calming Elder Greeting */}
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#904d00]">
              প্ৰভাতৰ শুভেচ্ছা · Peaceful Morning
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#032212] leading-tight">
              নমস্কাৰ, পূৰ্ণিমা বাইদেউ
              <span className="block text-2xl sm:text-3xl md:text-4xl font-normal text-[#1a3826] mt-1">
                Namaskar, {displayName} baideu. You are peacefully home.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#424843] pt-1 leading-relaxed">
              10:30 am · Thursday, 10 September (বৃহস্পতিবাৰ). The air carries the scent of fresh tea leaves and rain over the river.
            </p>
          </div>

          {/* Orientation Focal Anchor: RIGHT NOW (এতিয়া) */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#f8f3ea] border-2 border-[#1a3826]/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-[#fe932c]/20 text-[#904d00] shrink-0 mt-0.5">
                <Home size={28} strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1a3826] text-white text-xs font-bold uppercase tracking-wider">
                    Right Now (এতিয়া)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#904d00]">
                    Courtyard time
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#032212]">
                  Gentle courtyard breeze & birdsong
                </h2>
                <p className="text-sm sm:text-base text-[#424843]">
                  Quiet morning in the veranda garden overlooking the tall areca palms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCourtyardSounds}
              className={`min-h-[56px] px-6 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-3 transition-all active:scale-98 shadow-sm shrink-0 ${
                isPlayingCourtyard
                  ? "bg-[#fe932c] text-white ring-3 ring-[#904d00]/30"
                  : "bg-[#1a3826] hover:bg-[#032212] text-white"
              }`}
            >
              {isPlayingCourtyard ? (
                <>
                  <StopCircle size={22} className="animate-pulse" />
                  <span>Playing courtyard sounds ♫</span>
                </>
              ) : (
                <>
                  <Volume2 size={22} />
                  <span>Listen to courtyard sounds</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Progressive Rhythm of the Day (What Comes Next Today) ───────── */}
      <section aria-labelledby="rhythm-heading" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#904d00]">
              What Comes Next Today
            </span>
            <h2 id="rhythm-heading" className="font-serif text-2xl sm:text-3xl font-bold text-[#032212] mt-1">
              আজিৰ দিনলিপি · Daily Harmony
            </h2>
            <p className="text-sm sm:text-base text-[#424843] mt-1">
              A slow, unhurried afternoon crafted around your favorite moments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f8f3ea] hover:bg-[#ece8df] border border-[#c2c8c1] text-sm font-bold text-[#1a3826] transition-colors self-start sm:self-auto min-h-[48px]"
          >
            <Calendar size={18} />
            <span>{isScheduleExpanded ? "Hide full day schedule" : "View full day schedule"}</span>
            {isScheduleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Collapsible Full Day Schedule Drawer */}
        {isScheduleExpanded && (
          <div className="p-6 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] shadow-inner flex flex-col gap-4 animate-in fade-in duration-200">
            <h3 className="font-serif text-lg font-bold text-[#032212] flex items-center gap-2">
              <Clock size={18} className="text-[#904d00]" />
              <span>সম্পূৰ্ণ দিনটোৰ সূচী · Complete Restful Schedule</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#c2c8c1]/60 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#2d5a3f] flex items-center gap-1">
                  <CheckCircle2 size={14} /> 7:00 AM (Done)
                </span>
                <p className="text-sm font-bold text-[#1d1c16]">Morning walk along bamboo grove</p>
                <p className="text-xs text-[#424843]">Finished peacefully before breakfast</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#c2c8c1]/60 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#2d5a3f] flex items-center gap-1">
                  <CheckCircle2 size={14} /> 8:30 AM (Done)
                </span>
                <p className="text-sm font-bold text-[#1d1c16]">Breakfast: Kumol saul & curd</p>
                <p className="text-xs text-[#424843]">Served fresh with jaggery</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#c2c8c1]/60 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#904d00]">1:00 PM</span>
                <p className="text-sm font-bold text-[#1d1c16]">Restful lunch & midday nap</p>
                <p className="text-xs text-[#424843]">Light rice with dal and tender vegetables</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#c2c8c1]/60 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#904d00]">9:00 PM</span>
                <p className="text-sm font-bold text-[#1d1c16]">Warm milk & peaceful rest</p>
                <p className="text-xs text-[#424843]">Soothing elder stories & good night</p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Prominent Timeline Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 4:00 PM - Tea */}
          <div className="p-6 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] shadow-sm flex flex-col justify-between gap-6 hover:border-[#1a3826]/60 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#ffdcc3] text-[#904d00] text-xs font-bold">
                  4:00 PM
                </span>
                <div className="p-2 rounded-lg bg-[#fe932c]/20 text-[#904d00]">
                  <Coffee size={20} />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#032212]">
                Cardamom Tea with Anu
              </h3>
              <p className="text-sm text-[#424843] leading-relaxed">
                Warm ginger-elaichi tea & homemade fresh rice pitha on the back veranda.
              </p>
            </div>
            <div className="pt-3 border-t border-[#c2c8c1]/50 flex items-center justify-between text-xs text-[#424843]">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} /> Prepared gently at 3:45 PM
              </span>
              <span className="font-bold text-[#1a3826]">Tea Veranda</span>
            </div>
          </div>

          {/* Card 2: 5:00 PM - Rina's Call */}
          <div className="p-6 rounded-2xl bg-[#f8f3ea] border-2 border-[#1a3826] shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#1a3826] text-white text-xs font-bold">
                  5:00 PM
                </span>
                <div className="p-2 rounded-lg bg-[#c8ebd1] text-[#1a3826]">
                  <Phone size={20} />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#032212]">
                Rina calls from Guwahati
              </h3>
              <p className="text-sm text-[#424843] leading-relaxed">
                Your granddaughter will dial in to share evening stories and laugh together.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onQuickCall("Rina", "+91 98640 54321")}
              className="w-full min-h-[56px] py-3.5 px-4 rounded-xl bg-[#1a3826] hover:bg-[#032212] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
            >
              <Phone size={18} />
              <span>See Rina's Photo or Call</span>
            </button>
          </div>

          {/* Card 3: 7:30 PM - Evening Prayer */}
          <div className="p-6 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] shadow-sm flex flex-col justify-between gap-6 hover:border-[#1a3826]/60 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#ffdcc3] text-[#904d00] text-xs font-bold">
                  7:30 PM
                </span>
                <div className="p-2 rounded-lg bg-[#fe932c]/20 text-[#904d00]">
                  <Sparkles size={20} />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#032212]">
                Evening Prayer & Light Meal
              </h3>
              <p className="text-sm text-[#424843] leading-relaxed">
                Earthen oil lamp diya lighting at Gosai-Ghar, followed by soft khichdi.
              </p>
            </div>
            <div className="pt-3 border-t border-[#c2c8c1]/50 flex items-center justify-between text-xs text-[#424843]">
              <span className="flex items-center gap-1.5 font-medium">
                <Music size={14} /> Soft flute melodies will play
              </span>
              <span className="font-bold text-[#1a3826]">Gosai Ghar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Curated Dementia-Safe Enrichments (Something Meaningful to Do) ─ */}
      <section aria-labelledby="enrichments-heading" className="flex flex-col gap-6">
        <div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#904d00]">
            Something Meaningful to Do
          </span>
          <h2 id="enrichments-heading" className="font-serif text-2xl sm:text-3xl font-bold text-[#032212] mt-1">
            মনৰ আনন্দ · Gentle Joys
          </h2>
          <p className="text-sm sm:text-base text-[#424843] mt-1">
            Activities rooted in your familiar Tezpur rhythm to spark comforting memories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Action 1: Peaceful Song */}
          <div className="group rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#1a3826]/60 transition-all">
            <div className="h-44 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzXyIuAs3SV95dT_JQ9pT1Dn9fh8dxFNC9lz6xP5JcV1Xg9U7LRVEyyX7rHaJwS0QkM4ItNVi4f6h5oP1FdnbfDs5dDxtXq5CbVqVu5GESMzZ9Lj3YUDJUa5S5GEZc2ajEB48pi3uoijfvuh_vKaWH4wPSUm5lGaQlgUvwWpby6FxPsSh_nt1T4tj1TV9O2iA5bv7OqSfZzkXXLq3zqi9kE8kgxsJ7AwvFI3y0xAM6tFj2yrmvMHhv"
                alt="Bamboo flute on woven silk cloth"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/images/muga_silk_weave_1788980069393.jpg";
                }}
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#fef9f0]/90 text-[#032212] text-xs font-bold backdrop-blur-xs">
                Melody & Peace
              </span>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#032212]">
                  Listen to a Peaceful Song
                </h3>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  Traditional Assamese Borxongit and soothing bamboo flute melodies from Tezpur.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleMusicSounds}
                className={`w-full min-h-[56px] py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs ${
                  isPlayingMusic
                    ? "bg-[#fe932c] text-white"
                    : "bg-[#f2ede4] hover:bg-[#1a3826] hover:text-white text-[#1a3826]"
                }`}
              >
                {isPlayingMusic ? (
                  <>
                    <StopCircle size={18} />
                    <span>Stop Song ♫</span>
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} />
                    <span>Play Peaceful Music</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action 2: Flower Garland */}
          <div className="group rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#1a3826]/60 transition-all">
            <div className="h-44 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuGm91pIcoEbN3Ll75juOtt1gZ8TkCT79ck515x815nVEuTXtGa2ndegdGmOd6GdKeykRHqu58Nsnkj55vTH30fbEFlR0gv-SGCwciC3aKZIMvxMEg3ChBherTrOWELjef5OG3HrCfPMhiqzIKa1sXPORzmvqihE-VrAMIuDMdeeZyGCSGY0Vq5MUYBRwvR4ohElNzSR-PUXUNfz3GeplswlkjnN7Dn3m0dYQ5iYw4dVNnwNmsWqBT"
                alt="Golden marigold flowers in brass bowl"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/images/assam_tea_garden_1788977277508.jpg";
                }}
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#fef9f0]/90 text-[#032212] text-xs font-bold backdrop-blur-xs">
                Gentle Hands
              </span>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#032212]">
                  Make a Flower Garland
                </h3>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  Anu has kept marigolds in the brass vessel. A simple, fragrant craft for the altar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("activity")}
                className="w-full min-h-[56px] py-3.5 px-4 rounded-xl bg-[#f2ede4] hover:bg-[#1a3826] hover:text-white text-[#1a3826] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
              >
                <Flower2 size={18} />
                <span>See Step-by-Step Garland Guide</span>
              </button>
            </div>
          </div>

          {/* Action 3: Family Photographs */}
          <div className="group rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#1a3826]/60 transition-all">
            <div className="h-44 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAsIIiolxeUlDS3F8GWlDrny10UWVRsQcrg-LI4rDIKzrA3U3tPlrjIBj0wi2MWR6SEpT0_hEP7aVujnijccybl5G8QbW5f4UuYng44Ozqv4-9yY25RTePR6w4LCp__DmEeYUp-CHzWbldOp0s1cfto68WGQLOapWeAJgt6sMcI1gr5Th1DddDuk-EZ-VX--5KQnWNIX_PBxDpCqyuMB2CAgdl5J1B8NcA7EOu7kvh8SwNcb0Udmct"
                alt="Vintage family photographs on a wooden table"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/images/brahmaputra_river_1788977296883.jpg";
                }}
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#fef9f0]/90 text-[#032212] text-xs font-bold backdrop-blur-xs">
                Cherished Memories
              </span>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#032212]">
                  See Family Photographs
                </h3>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  Rina's school days in Tezpur, Bikash at the tea bungalow, and old Bihu festivities.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("people")}
                className="w-full min-h-[56px] py-3.5 px-4 rounded-xl bg-[#f2ede4] hover:bg-[#1a3826] hover:text-white text-[#1a3826] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
              >
                <ImageIcon size={18} />
                <span>Turn Photo Pages</span>
              </button>
            </div>
          </div>

          {/* Action 4: Call Rina */}
          <div className="group rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#1a3826]/60 transition-all">
            <div className="h-44 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA04hNKs1vH47WZ3BZ_qXvfVdPofXcDMVpS0r13HUdXkHb9O3-G-rGHNAeDQvLbMFOETHl461h_ZmvjDc__c9rt2mcKgwabRn2b_Rdc2rAOqYIfkwXqRJViZ5-LsVK33rqB5DGHdRRWfPg1peLhx0QRFBtO0IuFtzrUKzX_khpcTPFEk8hNyCVBB9RObiu-yxCLc2txpMt6CXp-3Wa4fxj-Wg206Jf8cP1VckfoD2xfmNxtrMUuILZ8"
                alt="Rina smiling warmly in Assam silk attire"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/images/ne_aerial_dawn_1788980040728.jpg";
                }}
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#fef9f0]/90 text-[#032212] text-xs font-bold backdrop-blur-xs">
                Family Calling
              </span>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#032212]">
                  Call Rina in Guwahati
                </h3>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  Your beloved granddaughter. One simple tap immediately connects you to her voice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onQuickCall("Rina", "+91 98640 54321")}
                className="w-full min-h-[56px] py-3.5 px-4 rounded-xl bg-[#1a3826] hover:bg-[#032212] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
              >
                <Phone size={18} />
                <span>Tap to Call Rina Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Ambient Conversational Sanctuary (Talk with MindMitra Companion) ── */}
      <section
        ref={conversationRef}
        aria-labelledby="companion-heading"
        className="rounded-3xl bg-[#f8f3ea] border-2 border-[#1a3826]/20 p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6 sm:gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#904d00] text-xs font-bold tracking-wide">
              <Sparkles size={14} />
              <span>Listening in Assamese (অসমীয়া) & English</span>
            </div>
            <h2 id="companion-heading" className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#032212]">
              Talk with MindMitra Companion
            </h2>
            <p className="text-sm sm:text-base text-[#424843] max-w-xl mx-auto">
              মৰমৰ মনমিত্ৰ · Ask anything in your own words. We can talk about your day, your family, or your songs.
            </p>
          </div>

          {/* Central Microphone Breathing Anchor */}
          <div className="relative flex flex-col items-center gap-3">
            <div className="relative">
              {/* Pulsing Aura Rings */}
              {isListening && (
                <div className="absolute inset-0 -m-6 rounded-full bg-[#fe932c]/20 animate-aura pointer-events-none" />
              )}
              <button
                type="button"
                onClick={handleToggleMic}
                aria-label="Tap to speak with MindMitra"
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isListening
                    ? "bg-[#fe932c] text-white ring-8 ring-[#ffdcc3]"
                    : "bg-[#1a3826] hover:bg-[#032212] text-white"
                }`}
              >
                <Mic size={36} className={isListening ? "animate-bounce" : ""} />
              </button>
            </div>

            <p className="text-sm font-bold text-[#1a3826]">
              {isListening ? "Listening to your gentle voice... (শুনি আছোঁ)" : "Tap to Speak gently (কওক)"}
            </p>
            <p className="text-xs text-[#424843] max-w-xs">
              Speak as slowly as you like. MindMitra is always ready to listen and answer with comfort.
            </p>
          </div>

          {/* Thought Starters Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl">
            {[
              "What is happening today?",
              "When will Rina call me?",
              "Can we hear a Bihu flute song?",
              "Tell me about the Tezpur river ghat",
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => handleSendQuery(promptText)}
                className="px-4 py-2.5 rounded-full bg-white hover:bg-[#f2ede4] border border-[#c2c8c1] text-xs sm:text-sm font-semibold text-[#1d1c16] transition-colors shadow-2xs hover:border-[#1a3826]"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Typed input option for family or quiet mode */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(companionInput);
            }}
            className="w-full max-w-xl flex items-center gap-2 bg-white rounded-2xl p-2 border border-[#c2c8c1] focus-within:border-[#1a3826] focus-within:ring-2 focus-within:ring-[#1a3826]/20 transition-all shadow-xs"
          >
            <input
              type="text"
              value={companionInput}
              onChange={(e) => setCompanionInput(e.target.value)}
              placeholder="Or write anything here gently..."
              className="flex-1 px-4 py-2.5 text-sm sm:text-base text-[#1d1c16] placeholder-[#727972] bg-transparent focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isSubmitting || !companionInput.trim()}
              className="px-5 py-3 rounded-xl bg-[#1a3826] hover:bg-[#032212] disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Send size={16} />
              <span>Ask</span>
            </button>
          </form>

          {/* MindMitra Tender Response Bubble */}
          {companionMessage && (
            <div className="w-full max-w-2xl p-5 sm:p-6 rounded-2xl bg-white border border-[#c2c8c1] shadow-xs text-left flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a3f]" />
                  <span className="font-serif font-bold text-sm text-[#032212]">
                    MindMitra Companion
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeakAloud()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8f3ea] hover:bg-[#ece8df] text-xs font-bold text-[#1a3826] transition-colors"
                >
                  <Volume2 size={14} className={isSpeaking ? "animate-pulse text-[#904d00]" : ""} />
                  <span>{isSpeaking ? "Speaking..." : "Listen Aloud"}</span>
                </button>
              </div>

              <p className="text-base sm:text-lg text-[#032212] font-serif leading-relaxed">
                "{companionMessage.text}"
              </p>
              {companionMessage.assamese && (
                <p className="text-sm text-[#424843] italic border-t border-[#c2c8c1]/40 pt-2">
                  {companionMessage.assamese}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Floating Ambient Voice Pill in Bottom Corner ────────────────── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            conversationRef.current?.scrollIntoView({ behavior: "smooth" });
            handleToggleMic();
          }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#1a3826] hover:bg-[#032212] text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 group border-2 border-[#81a28a]/40"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe932c] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fe932c]" />
          </span>
          <span className="font-serif font-bold text-sm tracking-wide">
            Talk with MindMitra
          </span>
          <Mic size={18} className="text-[#c8ebd1] group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* ── 6. Reassuring Dignified Cultural Footer ────────────────────────── */}
      <footer className="mt-8 border-t border-[#c2c8c1] pt-8 flex flex-col gap-6 text-[#424843]">
        <div className="p-5 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c8ebd1] text-[#1a3826]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-bold text-sm text-[#1d1c16]">
                MindMitra Sanctuary · Private, gentle, and designed with Assamese elder respect.
              </p>
              <p className="text-xs text-[#424843]">
                Anu is notified when you need support · Emergency Tele-MANAS (14416) is always connected.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onQuickCall("Tele-MANAS", "14416")}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#ece8df] border border-[#c2c8c1] text-xs font-bold text-[#ba1a1a] transition-colors"
            >
              Tele-MANAS 14416
            </button>
          </div>
        </div>

        {/* Ecosystem navigation tester */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#727972]">
            <span>MindMitra Ecosystem:</span>
            <span className="font-bold text-[#1a3826]">Person App (Active)</span>
            <span>·</span>
            <span>Caregiver Copilot</span>
            <span>·</span>
            <span>ASHA Caseload</span>
            <span>·</span>
            <span>Clinical Bridge</span>
          </div>
          <p className="text-[#727972]">
            MindMitra · Tezpur Home Sanctuary · All data stays securely on device
          </p>
        </div>
      </footer>
    </div>
  );
}
