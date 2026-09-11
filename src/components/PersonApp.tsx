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
  Pill,
  Database,
} from "lucide-react";
import { SaveMemoryStudio } from "./cognitive-experience/SaveMemoryStudio";
import { CognitiveExperienceSpace } from "./cognitive-experience/CognitiveExperienceSpace";
import { FullDayScheduleModal } from "./FullDayScheduleModal";
import { RinaCallModal } from "./RinaCallModal";
import { InfrastructureStatusModal } from "./InfrastructureStatusModal";
import { MedicationRemindersPanel } from "./medications/MedicationRemindersPanel";
import { MedicationAudioNotificationModal } from "./medications/MedicationAudioNotificationModal";
import { CaregiverDosageModal } from "./medications/CaregiverDosageModal";
import { useCompanion } from "../context/CompanionContext";
import { medicationStore } from "../intelligence/medication-store";
import { MedicationReminder, MedicationDoseInput } from "../domain/medication";
import { api } from "../lib/api";
import { ambientAudio } from "../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../lib/empathic-speech";
import type { PersonSection, VoiceCapability, PersonSession, RoleSurface, OnboardingProfile } from "../types";
import { MemoryItem, MediaAsset, FamiliarPlace, FutureEvent, PersonalGameContextPack } from "../domain/cognitive-experience";

interface PersonAppProps {
  onSelectSurface?: (surface: RoleSurface) => void;
  initialProfile?: OnboardingProfile | null;
}

const PERSON_ID = "person:purnima";

const ASSAMESE_WEEKDAYS = ["দেওবাৰ", "সোমবাৰ", "মঙ্গলবাৰ", "বুধবাৰ", "বৃহস্পতিবাৰ", "শুক্রবাৰ", "শনিবাৰ"];
const ASSAMESE_MONTHS = [
  "জানুৱাৰী",
  "ফেব্ৰুৱাৰী",
  "মার্চ",
  "এপ্ৰিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগষ্ট",
  "ছেপ্টেম্বৰ",
  "অক্টোবৰ",
  "নৱেম্বৰ",
  "ডিচেম্বৰ",
];

export const PersonApp: React.FC<PersonAppProps> = ({ onSelectSurface, initialProfile }) => {
  // Navigation tabs: "day" | "life" | "activity" | "people" | "help"
  const [activeSection, setActiveSection] = useState<PersonSection>("day");
  const [language, setLanguage] = useState<"as" | "en">("as");
  const [showSaveMemoryModal, setShowSaveMemoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRinaModal, setShowRinaModal] = useState(false);
  const [showInfraModal, setShowInfraModal] = useState(false);
  const [savedMemories, setSavedMemories] = useState<MemoryItem[]>([]);
  const companion = useCompanion();

  // Deep link into one specific, already-planned experience (Sections 6B/52).
  // Seeded from the URL so a link is shareable and survives a reload, and also
  // set directly when the companion's offer is accepted in-session.
  const [pendingExperienceId, setPendingExperienceId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("experience");
  });

  // Real backend content for "My Day" (upcoming) and "My Life" (memories/places/media)
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [places, setPlaces] = useState<FamiliarPlace[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<FutureEvent[]>([]);
  const [familiarPeople, setFamiliarPeople] = useState<PersonalGameContextPack["world"]["people"]>([]);
  const [lifeLoadState, setLifeLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function loadPersonContent() {
      setLifeLoadState("loading");
      try {
        const [memRes, mediaRes, placesRes, eventsRes, peopleRes] = await Promise.all([
          fetch(`/v1/memories?person_id=${encodeURIComponent(PERSON_ID)}`),
          fetch(`/v1/media-assets?person_id=${encodeURIComponent(PERSON_ID)}`),
          fetch(`/v1/places?person_id=${encodeURIComponent(PERSON_ID)}`),
          fetch(`/v1/future-events?person_id=${encodeURIComponent(PERSON_ID)}`),
          fetch(`/v1/people?person_id=${encodeURIComponent(PERSON_ID)}`),
        ]);
        if (!memRes.ok || !mediaRes.ok || !placesRes.ok || !eventsRes.ok || !peopleRes.ok) {
          throw new Error("One or more person-content requests failed");
        }
        const [memData, mediaData, placesData, eventsData, peopleData] = await Promise.all([
          memRes.json(),
          mediaRes.json(),
          placesRes.json(),
          eventsRes.json(),
          peopleRes.json(),
        ]);
        if (cancelled) return;
        setMemories(memData.items || []);
        setMediaAssets(mediaData.items || []);
        setPlaces(placesData.items || []);
        setUpcomingEvents(
          (eventsData.items || [])
            .slice()
            .sort((a: FutureEvent, b: FutureEvent) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        );
        setFamiliarPeople(peopleData.items || []);
        setLifeLoadState("ready");
      } catch (err) {
        if (!cancelled) {
          console.warn("Failed to load person content:", err);
          setLifeLoadState("error");
        }
      }
    }
    loadPersonContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveMediaUrl = (mediaRefs: string[] | undefined): string | undefined =>
    mediaRefs?.length ? mediaAssets.find((m) => m.id === mediaRefs[0])?.url : undefined;

  // Sync section with floating companion context
  useEffect(() => {
    companion.updateContext({
      surface: "person",
      page: activeSection,
      current_task: activeSection === "activity" ? "Cognitive Experience & Sensory Calm" : undefined,
    });
  }, [activeSection, companion.updateContext]);

  // Audio / Sound states
  const [courtyardAudioPlaying, setCourtyardAudioPlaying] = useState(false);
  const [fluteAudioPlaying, setFluteAudioPlaying] = useState(false);
  const [isSpeakingGuidance, setIsSpeakingGuidance] = useState(false);

  // Companion chat draft text (voice transcript & real turns live in the shared CompanionContext)
  const [companionInput, setCompanionInput] = useState("");
  // Dynamic Elder Profile (initialized from props, DB, or cached storage)
  const [elderProfile, setElderProfile] = useState<{
    name: string;
    honorific: string;
    workBackground: string;
    preferredLanguage: string;
    joys: string[];
    explanationStyle: string[];
    avoidances: string[];
  }>(() => {
    if (initialProfile) {
      return {
        name: initialProfile.name || "পূৰ্ণিমা দেৱী",
        honorific: initialProfile.honorific || "Woman (মহিলা / বাইদেউ / আইতা)",
        workBackground: initialProfile.workBackground || "Teacher (শিক্ষকতা)",
        preferredLanguage: initialProfile.preferredLanguage || "Assamese (অসমীয়া)",
        joys: initialProfile.joys || ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
        explanationStyle: initialProfile.explanationStyle || ["Short and simple"],
        avoidances: initialProfile.avoidances || [],
      };
    }
    try {
      const localProfileRaw = localStorage.getItem("mindmitra_onboarding_profile");
      const localName = localStorage.getItem("mindmitra_elder_name");
      if (localProfileRaw) {
        const parsed = JSON.parse(localProfileRaw);
        return {
          name: parsed.name || localName || "পূৰ্ণিমা দেৱী",
          honorific: parsed.honorific || "Woman (মহিলা / বাইদেউ / আইতা)",
          workBackground: parsed.workBackground || "Teacher (শিক্ষকতা)",
          preferredLanguage: parsed.preferredLanguage || "Assamese (অসমীয়া)",
          joys: parsed.joys || ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
          explanationStyle: parsed.explanationStyle || ["Short and simple"],
          avoidances: parsed.avoidances || [],
        };
      }
      if (localName) {
        return {
          name: localName,
          honorific: "Woman (মহিলা / বাইদেউ / আইতা)",
          workBackground: "Teacher (শিক্ষকতা)",
          preferredLanguage: "Assamese (অসমীয়া)",
          joys: ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
          explanationStyle: ["Short and simple"],
          avoidances: [],
        };
      }
    } catch {}
    return {
      name: "পূৰ্ণিমা দেৱী",
      honorific: "Woman (মহিলা / বাইদেউ / আইতা)",
      workBackground: "Teacher (শিক্ষকতা)",
      preferredLanguage: "Assamese (অসমীয়া)",
      joys: ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
      explanationStyle: ["Short and simple"],
      avoidances: [],
    };
  });

  const [session, setSession] = useState<PersonSession>(() => ({
    personId: "person:purnima",
    displayName: elderProfile.name,
    preferredLanguage: elderProfile.preferredLanguage,
    village: "তেজপুৰ, অসম (Tezpur, Assam)",
  }));

  // Fetch live profile from DB on mount & listen to real-time sync events
  useEffect(() => {
    let cancelled = false;

    async function syncProfileFromDb() {
      try {
        const res = await fetch(`/v1/onboarding?person_id=${encodeURIComponent(PERSON_ID)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.found && data.profile) {
            const p = data.profile;
            const liveName = (p.name || "").trim() || "পূৰ্ণিমা দেৱী";
            setElderProfile({
              name: liveName,
              honorific: p.honorific || "Woman (মহিলা / বাইদেউ / আইতা)",
              workBackground: p.work_background || "Teacher (শিক্ষকতা)",
              preferredLanguage: p.preferred_language || "Assamese (অসমীয়া)",
              joys: Array.isArray(p.joys) && p.joys.length > 0 ? p.joys : ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
              explanationStyle: Array.isArray(p.explanation_style) ? p.explanation_style : [],
              avoidances: Array.isArray(p.avoidances) ? p.avoidances : [],
            });
            setSession((prev) => ({
              ...prev,
              displayName: liveName,
              preferredLanguage: p.preferred_language || prev.preferredLanguage,
            }));
            return;
          }
        }

        // Fallback: check /v1/auth/me
        const authRes = await fetch("/v1/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (!cancelled && authData.name) {
            const liveName = authData.name;
            setElderProfile((prev) => ({ ...prev, name: liveName }));
            setSession((prev) => ({ ...prev, displayName: liveName }));
          }
        }
      } catch (err) {
        console.warn("Could not sync live DB profile, keeping local cache:", err);
      }
    }

    // Only fetch if initialProfile wasn't already provided, or as a background validation
    syncProfileFromDb();

    // Event listener for storage / tab synchronization and custom onboarding event
    const onStorage = () => syncProfileFromDb();
    window.addEventListener("storage", onStorage);
    window.addEventListener("onboarding_profile_updated", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("onboarding_profile_updated", onStorage);
    };
  }, []);

  useEffect(() => {
    if (initialProfile) {
      const liveName = (initialProfile.name || "").trim() || "পূৰ্ণিমা দেৱী";
      setElderProfile({
        name: liveName,
        honorific: initialProfile.honorific || "Woman (মহিলা / বাইদেউ / আইতা)",
        workBackground: initialProfile.workBackground || "Teacher (শিক্ষকতা)",
        preferredLanguage: initialProfile.preferredLanguage || "Assamese (অসমীয়া)",
        joys: initialProfile.joys && initialProfile.joys.length > 0 ? initialProfile.joys : ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music"],
        explanationStyle: initialProfile.explanationStyle || ["Short and simple"],
        avoidances: initialProfile.avoidances || [],
      });
      setSession((prev) => ({
        ...prev,
        displayName: liveName,
        preferredLanguage: initialProfile.preferredLanguage || prev.preferredLanguage,
      }));
    }
  }, [initialProfile]);

  const [dateLabel, setDateLabel] = useState("");
  const [assameseDateLabel, setAssameseDateLabel] = useState("");
  const [nowTimeLabel, setNowTimeLabel] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );
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

  // Medication Reminders & Dosage Sync state
  const [medications, setMedications] = useState<MedicationReminder[]>(() =>
    medicationStore.getAll("person:purnima")
  );
  const [activeMedicationAlert, setActiveMedicationAlert] = useState<MedicationReminder | null>(null);

  const handleMarkMedicationTaken = (id: string) => {
    const updated = medicationStore.markTaken(id, new Date().toISOString(), "Anu (Daughter)");
    if (updated) {
      setMedications(medicationStore.getAll("person:purnima"));
      if (updated.associatedRoutineKey) {
        setRoutineCompleted((s) => ({ ...s, [updated.associatedRoutineKey]: true }));
      }
    }
  };

  const handleAddMedication = (input: MedicationDoseInput) => {
    medicationStore.add(input, "person:purnima");
    setMedications(medicationStore.getAll("person:purnima"));
  };

  const handleUpdateMedication = (id: string, updates: Partial<MedicationReminder>) => {
    medicationStore.update(id, updates);
    setMedications(medicationStore.getAll("person:purnima"));
  };

  const handleDeleteMedication = (id: string) => {
    medicationStore.delete(id);
    setMedications(medicationStore.getAll("person:purnima"));
  };

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
    // Intl's as-IN locale data is unavailable in most JS engines (falls back to
    // English silently, no exception) -- use a fixed weekday/month table instead.
    const asWeekday = ASSAMESE_WEEKDAYS[now.getDay()];
    const asMonth = ASSAMESE_MONTHS[now.getMonth()];
    setAssameseDateLabel(`${asWeekday}, ${now.getDate()} ${asMonth}`);

    return () => {
      ambientAudio.stop();
      cancelEmpathicSpeech();
    };
  }, []);

  useEffect(() => {
    const tick = () => setNowTimeLabel(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
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

    const nextEvents = upcomingEvents.slice(0, 2);
    const eventLineEn = nextEvents.length
      ? nextEvents
          .map(
            (e) =>
              `At ${new Date(e.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}, ${e.title.toLowerCase()}${e.person_name ? ` with ${e.person_name}` : ""}`
          )
          .join(", and ")
      : "Today is unhurried, with no fixed plans yet";
    const eventLineAs = nextEvents.length
      ? nextEvents
          .map(
            (e) =>
              `${new Date(e.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} বজাত ${e.title}${e.person_name ? ` (${e.person_name})` : ""}`
          )
          .join(", ")
      : "আজি কোনো নির্দিষ্ট পৰিকল্পনা নাই, সময়টো শান্তিৰে কটাব পাৰে";

    const guidanceText =
      language === "as"
        ? `নমস্কাৰ ${elderProfile.name}। আজি ${assameseDateLabel || dateLabel}। আপুনি আপোনাৰ তেজপুৰৰ ঘৰত শান্তিৰে আছে। ${eventLineAs}।`
        : `Namaskar ${elderProfile.name}. Today is ${dateLabel}. You are resting peacefully at your Tezpur home. ${eventLineEn}.`;

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

  // Handle actions dispatched by floating companion
  useEffect(() => {
    return companion.registerActionHandler((action) => {
      if (action.type === "navigate" && action.target) {
        if (["day", "life", "activity", "people", "help"].includes(action.target)) {
          setActiveSection(action.target as any);
        }
      } else if (action.type === "call_contact" && action.target) {
        if (action.target.toLowerCase().includes("rina")) {
          setShowRinaModal(true);
        } else if (action.phone && action.risk === "low") {
          // Deliberate exception (crisis escalation): dial immediately, no
          // confirmation step -- see server.ts's Tele-MANAS action comment.
          window.location.href = `tel:${action.phone}`;
        } else if (action.phone) {
          if (window.confirm(`Call ${action.target} now?`)) {
            window.location.href = `tel:${action.phone}`;
          }
        }
      } else if (action.type === "suggest_experience") {
        // An offer, not an instruction. Opening the activity surface with the
        // experience id makes the companion's suggestion land on the exact
        // activity it planned, rather than a generic page the person then has
        // to search. It is only ever dispatched when the person taps the offer.
        const experienceId = (action.payload?.experience_id as string) || null;
        if (experienceId) setPendingExperienceId(experienceId);
        setActiveSection("activity");
      } else if (action.type === "start_activity") {
        setActiveSection("activity");
      } else if (action.type === "play_music") {
        setActiveSection("life");
        if (!fluteAudioPlaying) {
          toggleFluteSound();
        }
      }
    });
  }, [companion, fluteAudioPlaying]);

  // Handle Companion turn -- routed through the shared CompanionContext so
  // typed and spoken input use the exact same backend brain (safety checks included).
  const handleSendTurn = (customPrompt?: string) => {
    const textToSend = customPrompt || companionInput;
    if (!textToSend.trim()) return;
    setCompanionInput("");
    companion.sendTurn(textToSend);
  };

  const handleMicClick = () => {
    if (companion.isListening) {
      companion.stopListening();
      return;
    }
    companion.startListening();
  };

  const scrollToCompanion = () => {
    companion.setIsOpen(true);
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
          {/* Neon DB Telemetry Pill */}
          <button
            type="button"
            onClick={() => setShowInfraModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 shadow-2xs transition"
            title="Neon PostgreSQL Database: Connected (Click for live telemetry & Backblaze status)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database size={13} className="text-emerald-700" />
            <span className="hidden sm:inline">Neon DB</span>
          </button>

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

          {/* Revisit Onboarding Journey */}
          {onSelectSurface && (
            <button
              type="button"
              onClick={() => onSelectSurface("onboarding")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea] hover:bg-[#f2ede4] text-xs font-semibold text-[#1a3826] shadow-2xs transition"
              title="Edit sanctuary profile or revisit onboarding flight"
            >
              <Sparkles size={13} className="text-[#904d00]" />
              <span className="hidden sm:inline">Revisit Onboarding</span>
              <span className="sm:hidden">Onboarding</span>
            </button>
          )}

          {/* Profile Avatar Pill */}
          <div
            onClick={() => onSelectSurface?.("onboarding")}
            className="flex items-center gap-2 bg-[#f8f3ea] hover:bg-[#f2ede4] cursor-pointer border border-[#c2c8c1]/60 px-3 py-1.5 rounded-2xl shadow-2xs transition"
            title="Profile details · Tap to revisit onboarding"
          >
            <div className="w-8 h-8 rounded-full bg-[#1a3826] text-white font-serif font-bold text-xs flex items-center justify-center ring-2 ring-[#81a28a]/40">
              {(elderProfile.name || "পূ").slice(0, 1)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#1d1c16] leading-tight">
                {elderProfile.name}
              </p>
              <p className="text-[10px] text-[#424843]">
                {elderProfile.workBackground || "Tezpur, Assam"}
              </p>
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
                  নমস্কাৰ, {elderProfile.name}
                </h1>
                <p className="text-lg sm:text-xl font-serif text-[#c8ebd1] font-light">
                  Namaskar, {elderProfile.name}. You are peacefully home.
                </p>
                <p className="text-xs sm:text-sm text-white/80 max-w-2xl font-sans pt-1 leading-relaxed">
                  {nowTimeLabel} · {dateLabel} ({assameseDateLabel}). The air carries the scent of fresh tea leaves and rain over the river.
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
            {lifeLoadState === "loading" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading today's schedule">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 h-40 animate-pulse" />
                ))}
              </div>
            )}

            {lifeLoadState === "error" && (
              <div className="bg-[#fef3c7] border border-[#fbbf24]/60 rounded-3xl p-6 text-sm text-[#854d0e]">
                We couldn't reach the schedule right now. Please check your connection, or ask a family member for help.
              </div>
            )}

            {lifeLoadState === "ready" && upcomingEvents.length === 0 && (
              <div className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-8 text-center text-sm text-[#424843]">
                Nothing planned yet today. Enjoy a quiet, unhurried moment.
              </div>
            )}

            {lifeLoadState === "ready" && upcomingEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.slice(0, 3).map((event) => {
                  const isCall = event.event_type === "family_visit" || /call/i.test(event.title);
                  const Icon = isCall ? Phone : event.event_type === "routine_tea" ? Coffee : Flame;
                  const timeLabel = new Date(event.scheduled_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const done = !!routineCompleted[event.id];
                  return (
                    <div
                      key={event.id}
                      className="bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#1a3826]/40 transition shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#904d00] bg-[#ffdcc3] px-2.5 py-1 rounded-lg">
                            {timeLabel}
                          </span>
                          <div className="w-10 h-10 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center">
                            <Icon size={20} />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-serif font-bold text-[#1d1c16]">{event.title}</h3>
                          {(event.location || event.description) && (
                            <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">
                              {event.description || `At ${event.location}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#c2c8c1]/40 flex items-center justify-between">
                        {event.person_name?.toLowerCase().includes("rina") ? (
                          <button
                            type="button"
                            onClick={() => setShowRinaModal(true)}
                            className="w-full py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <span>See Rina's Photo or Call</span>
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <>
                            <span className="text-[11px] font-medium text-[#1a3826] bg-[#eaf0e4] px-2.5 py-1 rounded-md">
                              {event.person_name ? `With ${event.person_name}` : "Today"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRoutineCompleted((s) => ({ ...s, [event.id]: !s[event.id] }))}
                              className="text-xs font-semibold text-[#424843] hover:text-[#1a3826] flex items-center gap-1"
                            >
                              <CheckCircle2
                                size={18}
                                className={done ? "text-[#1a3826] fill-[#1a3826]/20" : "text-[#c2c8c1]"}
                              />
                              <span>{done ? "Ready" : "Mark"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── 2.5 SECTION: MEDICATION REMINDERS & SCHEDULE SYNC (ঔষধৰ সময়সূচী) ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <MedicationRemindersPanel
              medications={medications}
              language={language}
              routineCompleted={routineCompleted}
              onMarkTaken={handleMarkMedicationTaken}
              onAddMedication={handleAddMedication}
              onUpdateMedication={handleUpdateMedication}
              onDeleteMedication={handleDeleteMedication}
              onOpenFullSchedule={() => setShowScheduleModal(true)}
            />
          </div>

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
                  Small, tender activities personalized for {elderProfile.name}. No rush, no scores.
                </p>
                {elderProfile.joys && elderProfile.joys.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {elderProfile.joys.map((joy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaf0e4] text-[#1a3826] border border-[#81a28a]/40 text-[11px] font-medium"
                      >
                        <Sparkles size={11} className="text-[#904d00]" />
                        <span>{joy}</span>
                      </span>
                    ))}
                  </div>
                )}
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
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1" aria-live="polite">
                {companion.turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      turn.role === "user"
                        ? "bg-[#1a3826] text-white ml-8 sm:ml-16 font-medium"
                        : "bg-white border border-[#c2c8c1]/60 text-[#1d1c16] mr-8 sm:mr-16 shadow-2xs"
                    }`}
                  >
                    {turn.role === "assistant" && turn.asText && turn.asText !== turn.text && (
                      <p className="font-serif font-bold text-base text-[#1a3826] mb-1">
                        {turn.asText}
                      </p>
                    )}
                    <p className={turn.role === "assistant" ? "text-xs text-[#424843]" : ""}>
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
                    companion.isListening
                      ? "bg-red-700 text-white animate-pulse"
                      : "bg-[#1a3826] hover:bg-[#2d5a3f] text-white"
                  }`}
                >
                  <Mic size={20} />
                  <span>{companion.isListening ? "Listening with care..." : "Tap to Speak gently (কওক)"}</span>
                </button>

                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    id="companion-chat-input"
                    name="companion-chat-input"
                    value={companionInput}
                    onChange={(e) => setCompanionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
                    placeholder="Type a gentle question or memory..."
                    aria-label="Type a gentle question or memory"
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

          {/* The dynamic experience region, with all existing engines preserved
              beneath it as the always-available layer. */}
          <CognitiveExperienceSpace
            onBackToDay={() => setActiveSection("day")}
            initialExperienceId={pendingExperienceId}
            onExperienceConsumed={() => {
              setPendingExperienceId(null);
              // Drop the query parameter so going back and forward doesn't
              // re-open a finished activity (Section 64).
              if (typeof window !== "undefined" && window.location.search.includes("experience=")) {
                const url = new URL(window.location.href);
                url.searchParams.delete("experience");
                window.history.replaceState({}, "", url.pathname + url.search);
              }
            }}
          />

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
                    {resolveMediaUrl(mem.media_refs) ? (
                      <img src={resolveMediaUrl(mem.media_refs)} alt={mem.title} className="w-14 h-14 rounded-xl object-cover" />
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

          {/* Memories & Places (real data from the person's verified life story) */}
          {lifeLoadState === "loading" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading memories">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl h-72 animate-pulse" />
              ))}
            </div>
          )}

          {lifeLoadState === "error" && (
            <div className="bg-[#fef3c7] border border-[#fbbf24]/60 rounded-3xl p-6 text-sm text-[#854d0e]">
              We couldn't reach your memories right now. Please check your connection, or ask a family member for help.
            </div>
          )}

          {lifeLoadState === "ready" && memories.length === 0 && places.length === 0 && (
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-10 text-center text-sm text-[#424843]">
              No memories saved yet. Tap "Save Memory" above to add your first cherished moment.
            </div>
          )}

          {lifeLoadState === "ready" && (memories.length > 0 || places.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memories.map((mem) => {
                const img = resolveMediaUrl(mem.media_refs);
                return (
                  <div key={mem.id} className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
                    {img && <img src={img} alt={mem.assamese_title || mem.title} className="w-full h-56 object-cover" />}
                    <div className="p-5">
                      <h3 className="font-serif font-bold text-xl text-[#1d1c16]">{mem.title}</h3>
                      {mem.approximate_period && (
                        <p className="text-[11px] font-semibold text-[#904d00] mt-0.5">{mem.approximate_period}</p>
                      )}
                      <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">{mem.description}</p>
                      <span className="inline-block mt-2 text-[10px] font-semibold text-[#1a3826]">
                        {mem.verification_status === "unverified" ? "Pending family verification" : "Family verified"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {places.map((place) => {
                const img = resolveMediaUrl(place.media_refs);
                return (
                  <div key={place.id} className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition">
                    {img && <img src={img} alt={place.assamese_name || place.name} className="w-full h-56 object-cover" />}
                    <div className="p-5">
                      <h3 className="font-serif font-bold text-xl text-[#1d1c16]">{place.name}</h3>
                      <p className="text-xs text-[#424843] mt-1.5 leading-relaxed">{place.description || place.significance}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

          {lifeLoadState === "loading" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading your family and care team">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl h-56 animate-pulse" />
              ))}
            </div>
          )}

          {lifeLoadState === "error" && (
            <div className="bg-[#fef3c7] border border-[#fbbf24]/60 rounded-3xl p-6 text-sm text-[#854d0e]">
              We couldn't reach your family circle right now. Please check your connection, or ask a family member for help.
            </div>
          )}

          {lifeLoadState === "ready" && familiarPeople.length === 0 && (
            <div className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-10 text-center text-sm text-[#424843]">
              No one has been added to your circle yet.
            </div>
          )}

          {lifeLoadState === "ready" && familiarPeople.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {familiarPeople.map((person) => {
                const isRina = person.name.toLowerCase().includes("rina");
                const photoUrl = isRina ? "/assets/images/rina_granddaughter_portrait_1789020459100.jpg" : undefined;
                const initial = person.name.charAt(0);
                const isAsha = /asha|health/i.test(person.relationship);
                const accent = isAsha ? "#0369a1" : "#904d00";
                const relationshipLabel = person.relationship.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={person.id} className="bg-[#f8f3ea] border border-[#c2c8c1] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="space-y-3">
                      {photoUrl ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#1a3826]/30">
                          <img src={photoUrl} alt={person.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-serif font-bold"
                          style={{ backgroundColor: `${accent}1a`, color: accent }}
                        >
                          {initial}
                        </div>
                      )}
                      <div>
                        <span
                          className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: `${accent}1a`, color: accent }}
                        >
                          {relationshipLabel}
                        </span>
                        <h3 className="text-xl font-serif font-bold text-[#1d1c16] mt-1">{person.name}</h3>
                        {!person.verified && (
                          <p className="text-[11px] text-[#904d00] mt-1">Pending family verification</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isRina) {
                          setShowRinaModal(true);
                          return;
                        }
                        speakWarmly(`Calling ${person.name}. They will be notified right away.`);
                        if (person.phone) window.location.href = `tel:${person.phone}`;
                      }}
                      className="w-full py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      style={{ backgroundColor: accent }}
                    >
                      <PhoneCall size={14} />
                      <span>Call {person.name.split(" ")[0]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
          medications={medications}
          onPlayMedicationAudio={(med) => setActiveMedicationAlert(med)}
          onToggleMedicationTaken={handleMarkMedicationTaken}
        />
      )}

      {activeMedicationAlert && (
        <MedicationAudioNotificationModal
          medication={activeMedicationAlert}
          language={language}
          onClose={() => setActiveMedicationAlert(null)}
          onMarkTaken={(id) => {
            handleMarkMedicationTaken(id);
            setActiveMedicationAlert(null);
          }}
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

      <InfrastructureStatusModal
        isOpen={showInfraModal}
        onClose={() => setShowInfraModal(false)}
      />
    </div>
  );
};
