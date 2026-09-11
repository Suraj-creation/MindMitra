import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Heart,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  CloudRain,
  Phone,
  Video,
  Send,
  Printer,
  Tablet,
  Check,
  SearchCheck,
  UserPlus,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Moon,
  Utensils,
  Brain,
  Smile,
  Pill,
  Home,
} from "lucide-react";

// Safe mapping for server-provided sensory fabric icon names
const FABRIC_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  bedtime: Moon,
  restaurant: Utensils,
  neurology: Brain,
  sentiment_calm: Smile,
  pill: Pill,
  home_eco: Home,
  clock: Clock,
  heart: Heart,
  sparkles: Sparkles,
  shield: ShieldCheck,
  rain: CloudRain,
  moon: Moon,
  utensils: Utensils,
  brain: Brain,
  smile: Smile,
  home: Home,
};

function resolveFabricIcon(icon: any): React.ComponentType<{ size?: number; className?: string }> {
  if (!icon) return Heart;
  if (typeof icon === "function" || (typeof icon === "object" && icon.$$typeof)) {
    return icon;
  }
  if (typeof icon === "string") {
    const key = icon.toLowerCase().trim();
    if (FABRIC_ICON_MAP[key]) {
      return FABRIC_ICON_MAP[key];
    }
  }
  return Heart;
}
import { api } from "../lib/api";
import { CaregiverHeader, type CaregiverTab } from "./caregiver/CaregiverHeader";
import { SupportLevelModal } from "./caregiver/SupportLevelModal";
import { EvidenceModal } from "./caregiver/EvidenceModal";
import { ClinicalBriefModal } from "./caregiver/ClinicalBriefModal";
import { TabletMirrorModal } from "./caregiver/TabletMirrorModal";
import { CaregiverNotesModal } from "./caregiver/CaregiverNotesModal";
import { PersonCapabilitiesTab } from "./caregiver/PersonCapabilitiesTab";
import { ChangesInsightsTab } from "./caregiver/ChangesInsightsTab";
import { ActivitiesRoutineTab } from "./caregiver/ActivitiesRoutineTab";
import { CareTasksAlertsTab } from "./caregiver/CareTasksAlertsTab";
import { ReportsConsultTab } from "./caregiver/ReportsConsultTab";

export const CaregiverCopilot: React.FC = () => {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState<CaregiverTab>("today");
  const [lang, setLang] = useState<"en" | "as">("en");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Modals state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isClinicalBriefOpen, setIsClinicalBriefOpen] = useState(false);
  const [isTabletMirrorOpen, setIsTabletMirrorOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Dynamic Data State
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [supportLevel, setSupportLevel] = useState(2);
  const [supportReason, setSupportReason] = useState(
    "Benefits from structured auditory cues for morning medication and warm companionship during the late afternoon veranda transition."
  );

  // Interactive Copilot Query State
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<any>(null);

  // Quick Action feedback
  const [comfortChecked, setComfortChecked] = useState(false);
  const [weatherMarked, setWeatherMarked] = useState(false);

  // Fetch overview data from backend on load
  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await api.getCaregiverOverview();
      if (data) {
        setOverviewData(data);
        if (data.support_level) {
          setSupportLevel(data.support_level.level ?? 2);
          setSupportReason(data.support_level.reason ?? "");
        }
        if (data.decision_triad?.what_can_do_now) {
          setTasks(data.decision_triad.what_can_do_now);
        }
      }
    } catch (err) {
      console.error("Failed to fetch caregiver overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // Handle task toggling
  const handleToggleTask = async (taskId: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );

    try {
      await api.toggleCareTask(taskId);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Revert if error
      loadOverview();
    }
  };

  // Handle task postponement
  const handlePostponeTask = async (taskId: string) => {
    try {
      await api.postponeCareTask(taskId, 30);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, due_date_label: "Postponed +30m" } : t
        )
      );
    } catch (err) {
      console.error("Failed to postpone task:", err);
    }
  };

  // Handle support level save
  const handleSaveSupportLevel = async (level: number, reason: string) => {
    try {
      const res = await api.updateSupportLevel(level, reason);
      if (res?.supportLevel) {
        setSupportLevel(res.supportLevel.level);
        setSupportReason(res.supportLevel.reason);
      }
    } catch (err) {
      console.error("Failed to update support level:", err);
    }
  };

  // Handle copilot question submit
  const handleQueryCopilot = async (questionToAsk?: string) => {
    const query = questionToAsk || copilotQuery;
    if (!query.trim()) return;

    setCopilotLoading(true);
    try {
      const res = await api.queryCaregiverCopilot(query.trim());
      setCopilotResponse(res);
      setCopilotQuery("");
    } catch (err) {
      console.error("Failed to query copilot:", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Handle Vernacular Audio Briefing playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textToRead =
        lang === "as"
          ? "নমস্কাৰ অনু। আজি তেজপুৰৰ ঘৰত শান্ত পুৱা। আইতা পূৰ্ণিমা দেৱী শান্তিত আছে। পুৱাৰ ঔষধ নিয়মীয়াকৈ দিয়া হৈছে। বৰষুণৰ বাবে খোজ কঢ়া পলম হৈছে, আবেলি চাৰি বজাত চাহ আৰু বিহু গীত বজাব পাৰে।"
          : "Good morning Anu. MindMitra Caregiver briefing for Aitâ Purnima Devi. Aitâ is resting peacefully in Tezpur. Morning medication was verified. Continuous monsoon rain has shifted outdoor courtyard walks to indoor photo reminiscence. Warm cardamom tea is recommended at 4:00 PM.";

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported in this browser.");
    }
  };

  // Care circles list
  const careCircle = [
    { name: "Anu", relation: "Daughter & Primary", location: "On-site, Tezpur", avatar: "A", primary: true },
    { name: "Rina", relation: "Granddaughter", location: "Bangalore (Video Anchor)", avatar: "R" },
    { name: "Bikash", relation: "Son", location: "Guwahati (Backup)", avatar: "B" },
    { name: "Rumi Saikia", relation: "ASHA / Health Worker", location: "Tezpur PHC (Weekly)", avatar: "RS" },
  ];

  // Daily Context Snapshot (Daily Fabric)
  const dailyFabric = overviewData?.daily_fabric || [
    {
      domain: "Night Rest & Waking",
      status: "7h 15m · 2 Brief Wakings",
      score: "Stable",
      detail: "Settled by 10:15 PM with Borxongit flute. Awakened briefly at 2:10 AM & 4:30 AM without distress.",
      icon: Clock,
      color: "#1a3826",
    },
    {
      domain: "Meals & Hydration",
      status: "85% Eaten · 1.4L Hydration",
      score: "Normal Intake",
      detail: "Aitâ enjoyed traditional kumol saul and curd with jaggery. Warm ginger water consumed after breakfast.",
      icon: Heart,
      color: "#1a3826",
    },
    {
      domain: "Memory & Movement",
      status: "4.1s Photo Latency · Courtyard",
      score: "Engaged",
      detail: "Recognized 1978 Kaziranga family photo with warm recall. Courtyard walk replaced by veranda sitting due to rain.",
      icon: Sparkles,
      color: "#904d00",
    },
    {
      domain: "Mood & Presence",
      status: "Serene & Receptive",
      score: "Good Spirit",
      detail: "Hummed familiar Bihu tune while watching courtyard rain; responsive to Anu's conversation in Assamese.",
      icon: Heart,
      color: "#1a3826",
    },
    {
      domain: "Medication Verification",
      status: "100% Morning Adherence",
      score: "Verified by Anu",
      detail: "Cardioprotective dose taken on schedule with warm milk. Evening dose set in brass box compartment.",
      icon: ShieldCheck,
      color: "#1a3826",
    },
    {
      domain: "Home Environment",
      status: "24°C · Rain Clearing",
      score: "Safe & Quiet",
      detail: "Living room tablet active with calm clock. Hallway nightlights operational; ambient humidity 78%.",
      icon: CloudRain,
      color: "#1a3826",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fef9f0] text-[#1d1c16] font-sans pb-20 selection:bg-[#ffdcc3] selection:text-[#904d00]">
      {/* ── Caregiver Copilot Header & Tab Navigation ── */}
      <CaregiverHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        onToggleLang={() => setLang(lang === "en" ? "as" : "en")}
        onPlayBriefingAudio={handleToggleAudio}
        isPlayingAudio={isPlayingAudio}
        onOpenNotes={() => setIsNotesModalOpen(true)}
        supportLevel={supportLevel}
        syncedAgo="2m ago"
      />

      {/* Atmospheric Ribbon Banner */}
      <div className="bg-[#f2ede4] border-b border-[#c2c8c1]/60 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#424843]">
            <span className="w-2 h-2 rounded-full bg-[#1a3826] animate-pulse" />
            <span className="font-semibold text-[#032212]">
              {lang === "as" ? "ৰাতিপুৱাৰ শুভ বাৰ্তা" : "Morning Harmony Briefing"}
            </span>
            <span className="text-[#c2c8c1]">•</span>
            <span>Tezpur Valley · 24°C Morning Mist Clearing</span>
          </div>

          <div className="flex items-center gap-3 text-[#466550]">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={14} /> Memory Firewall Protected
            </span>
            <span className="text-[#c2c8c1]">•</span>
            <button
              onClick={() => setIsTabletMirrorOpen(true)}
              className="flex items-center gap-1 font-semibold text-[#1a3826] hover:underline"
            >
              <Tablet size={13} /> Aitâ’s Screen Sanctuary Active
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Render Active Tab Sub-view */}
        {activeTab === "person-capabilities" && (
          <PersonCapabilitiesTab
            onOpenSupportModal={() => setIsSupportModalOpen(true)}
            supportLevel={supportLevel}
          />
        )}

        {activeTab === "changes-insights" && (
          <ChangesInsightsTab onOpenEvidence={() => setIsEvidenceModalOpen(true)} />
        )}

        {activeTab === "activities-routine" && <ActivitiesRoutineTab />}

        {activeTab === "care-tasks-alerts" && (
          <CareTasksAlertsTab
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onPostponeTask={handlePostponeTask}
            onRefresh={loadOverview}
          />
        )}

        {activeTab === "reports-consult" && (
          <ReportsConsultTab
            onOpenClinicalBrief={() => setIsClinicalBriefOpen(true)}
            doctorName="Dr. B. K. Barua"
            appointmentDate="September 24, 2026"
          />
        )}

        {/* ── TODAY TAB (The Primary Comprehensive Living Dashboard) ── */}
        {activeTab === "today" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Section 1: Person Identity & Living Sanctuary */}
            <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Identity Profile */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#f2ede4] border border-[#c2c8c1]/80 flex items-center justify-center text-[#1a3826] shrink-0 font-serif font-bold text-2xl sm:text-3xl shadow-inner">
                    P
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#032212] tracking-tight">
                        Aitâ · Purnima Devi
                      </h1>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00]">
                        Level {supportLevel} Support
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#424843] mt-1 flex flex-wrap items-center gap-2">
                      <span>Tezpur Ancestral Home, Sonitpur</span>
                      <span className="text-[#c2c8c1]">•</span>
                      <span>Age 74</span>
                      <span className="text-[#c2c8c1]">•</span>
                      <span className="text-[#1a3826] font-medium">Anu On-site</span>
                    </p>
                    <p className="text-xs text-[#727972] mt-2 max-w-2xl leading-relaxed">
                      {supportReason ||
                        "Benefits from structured auditory cues for morning medication and warm companionship during the late afternoon veranda transition."}
                    </p>
                  </div>
                </div>

                {/* Scaffolding CTA & Live Status */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                  <button
                    onClick={() => setIsSupportModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea] hover:bg-[#f2ede4] text-xs font-semibold text-[#032212] transition-colors shadow-2xs flex items-center justify-center gap-2"
                  >
                    <span>Update Support Guide</span>
                    <ChevronRight size={14} className="text-[#904d00]" />
                  </button>

                  <button
                    onClick={() => setIsTabletMirrorOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#1a3826] text-white hover:bg-[#032212] text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <Tablet size={14} />
                    <span>View Screen Sanctuary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: The Core Decision Triad */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-serif text-[#032212]">
                    The Decision Triad (What Truly Matters)
                  </h2>
                  <p className="text-xs text-[#424843]">
                    Caregiver attention is precious. MindMitra compresses 24 hours of ambient telemetry into three unambiguous focal points.
                  </p>
                </div>
                <span className="hidden sm:inline-flex text-xs font-semibold text-[#466550] bg-[#c8ebd1] px-3 py-1 rounded-full items-center gap-1">
                  <ShieldCheck size={14} /> Governed Attention Budget
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2A. What Matters Today (The Only Thing Requiring Mindful Care Today) */}
                <div className="lg:col-span-1 bg-[#ffffff] border-2 border-[#1a3826] rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00] bg-[#ffdcc3]/50 px-2.5 py-0.5 rounded-md">
                        1. What Matters Today
                      </span>
                      <span className="text-[11px] font-semibold text-[#1a3826] bg-[#c8ebd1] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> 88% Reliability
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-serif text-[#032212] leading-snug">
                      Slight Evening Restlessness & Slower Photo Response
                    </h3>

                    <p className="text-xs text-[#1d1c16] leading-relaxed">
                      "Aitâ's tablet interaction latency rose slightly (4.1s vs 3.8s baseline), and she experienced two brief sleep wakings."
                    </p>

                    {/* Practical Reason Box */}
                    <div className="p-3 bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a3826]">
                        <CloudRain size={14} /> Likely Practical Reason
                      </div>
                      <p className="text-xs text-[#424843] leading-relaxed">
                        Continuous Tezpur monsoon drizzle prevented customary veranda strolling; combined with Anu's recent 48h travel to Guwahati.
                      </p>
                    </div>

                    {/* What This Does NOT Mean Box */}
                    <div className="p-3 bg-[#f2ede4] border border-[#c2c8c1]/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ba1a1a]">
                        <Info size={14} /> What This Does NOT Mean
                      </div>
                      <p className="text-xs text-[#424843] leading-relaxed">
                        This is <strong className="font-semibold text-[#032212]">not</strong> sudden neurological deterioration. It is an expected, mild situational response to weather confinement.
                      </p>
                    </div>
                  </div>

                  {/* Actions & Audit Button */}
                  <div className="pt-3 border-t border-[#c2c8c1]/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setComfortChecked(!comfortChecked)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          comfortChecked
                            ? "bg-[#1a3826] text-white"
                            : "bg-[#f8f3ea] border border-[#c2c8c1] text-[#032212] hover:bg-[#f2ede4]"
                        }`}
                      >
                        <Check size={14} />
                        <span>{comfortChecked ? "Comfort Verified" : "Check Comfort"}</span>
                      </button>

                      <button
                        onClick={() => setWeatherMarked(!weatherMarked)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          weatherMarked
                            ? "bg-[#c8ebd1] text-[#022111] border-[#adcfb5]"
                            : "bg-[#ffffff] border-[#c2c8c1] text-[#424843] hover:bg-[#f8f3ea]"
                        }`}
                        title="Acknowledge this was due to monsoon weather"
                      >
                        {weatherMarked ? "✓ Weather Noted" : "Weather Related"}
                      </button>
                    </div>

                    <button
                      onClick={() => setIsEvidenceModalOpen(true)}
                      className="w-full text-center text-xs text-[#904d00] hover:underline font-semibold py-1 flex items-center justify-center gap-1"
                    >
                      <SearchCheck size={14} /> Why am I seeing this? (Evidence Audit)
                    </button>
                  </div>
                </div>

                {/* 2B. What You Can Do Now (3 Priority Serene Steps) */}
                <div className="lg:col-span-1 bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a3826] bg-[#c8ebd1]/60 px-2.5 py-0.5 rounded-md">
                        2. What You Can Do Now
                      </span>
                      <span className="text-xs text-[#727972]">
                        {tasks.filter((t) => t.status === "completed").length} / {tasks.length} Done
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-serif text-[#032212]">
                      3 Prioritized Serene Micro-Steps
                    </h3>

                    <div className="space-y-2.5 pt-1">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                            task.status === "completed"
                              ? "bg-[#f8f3ea]/60 border-[#c2c8c1]/40 opacity-70"
                              : "bg-[#f8f3ea] border-[#c2c8c1] hover:border-[#1a3826]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.status === "completed"}
                            onChange={() => handleToggleTask(task.id)}
                            className="w-4 h-4 rounded-md text-[#1a3826] focus:ring-[#1a3826] border-[#c2c8c1] mt-0.5 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  task.status === "completed"
                                    ? "line-through text-[#727972]"
                                    : "text-[#032212]"
                                }`}
                              >
                                {task.title}
                              </span>
                              <span className="text-[10px] text-[#904d00] font-semibold">
                                {task.due_date_label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#424843] mt-0.5 leading-relaxed">
                              {task.subtext}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("care-tasks-alerts")}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-[#1a3826] bg-[#f2ede4] hover:bg-[#e8e0d4] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View All Care Tasks & Delegation</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 2C. What Can Wait (Caregiver Decompression Shield) */}
                <div className="lg:col-span-1 bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#424843] bg-[#f2ede4] px-2.5 py-0.5 rounded-md">
                        3. What Can Wait
                      </span>
                      <span className="text-xs text-[#466550] font-medium">Decompression Shield</span>
                    </div>

                    <h3 className="text-base font-bold font-serif text-[#032212]">
                      Safe to Postpone (Zero Guilt)
                    </h3>

                    <div className="space-y-2.5 pt-1 text-xs">
                      <div className="p-3 bg-[#ffffff] border border-[#c2c8c1]/60 rounded-xl space-y-1">
                        <span className="font-bold text-[#032212] block">
                          • No Hospital or Clinic Visit Needed
                        </span>
                        <p className="text-[#424843]">
                          Vitals and cognitive indicators are completely stable. Routine quarterly review with Dr. Barua is scheduled for Sept 24.
                        </p>
                      </div>

                      <div className="p-3 bg-[#ffffff] border border-[#c2c8c1]/60 rounded-xl space-y-1">
                        <span className="font-bold text-[#032212] block">
                          • Blood Pressure Check Can Wait
                        </span>
                        <p className="text-[#424843]">
                          Readings have stayed between 124/80 and 128/84. Next routine check is due on CHW Rumi's Thursday visit.
                        </p>
                      </div>

                      <div className="p-3 bg-[#ffffff] border border-[#c2c8c1]/60 rounded-xl space-y-1">
                        <span className="font-bold text-[#032212] block">
                          • Do Not Alter Aitâ's Tablet Settings
                        </span>
                        <p className="text-[#424843]">
                          Screen Sanctuary is operating in calm ambient mode with bird songs and Borxongit flute melodies.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassurance Banner */}
                  <div className="p-3.5 bg-[#c8ebd1]/40 border border-[#adcfb5] rounded-2xl text-center">
                    <div className="text-xs font-bold text-[#022111]">
                      ✓ You are completely caught up on everything else today.
                    </div>
                    <div className="text-[11px] text-[#466550] mt-0.5">
                      Relax and enjoy the quiet evening with Aitâ.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aitâ's Circle of Care (Family & CHW Orchestration) */}
            <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c2c8c1]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold font-serif text-[#032212]">
                    Aitâ’s Circle of Care
                  </h2>
                  <p className="text-xs text-[#424843]">
                    Synchronized family members, medical backup, and community health worker.
                  </p>
                </div>

                <button
                  onClick={() => alert("Attendant invitation link copied to clipboard.")}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#032212] bg-[#f8f3ea] hover:bg-[#f2ede4] transition-colors"
                >
                  <UserPlus size={14} className="text-[#904d00]" />
                  <span>Invite Attendant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {careCircle.map((member, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      member.primary
                        ? "border-[#1a3826] bg-[#f2ede4] shadow-2xs"
                        : "border-[#c2c8c1]/60 bg-[#ffffff]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a3826] text-[#c8ebd1] font-semibold text-xs flex items-center justify-center">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#032212] flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.primary && (
                            <span className="text-[10px] bg-[#ffdcc3] text-[#904d00] px-1.5 py-0.2 rounded font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#424843]">{member.relation}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#727972] pt-1 border-t border-[#c2c8c1]/30">
                      {member.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Daily Context Snapshot (The Daily Fabric) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-serif text-[#032212]">
                    Daily Context Snapshot (Aitâ's Daily Fabric)
                  </h2>
                  <p className="text-xs text-[#424843]">
                    Six continuous dimensions of well-being logged passively from Tezpur home sensors and family checks.
                  </p>
                </div>
                <span className="text-xs text-[#727972] hidden sm:inline">
                  Updated every 15 minutes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyFabric.map((item: any, idx: number) => {
                  const Icon = resolveFabricIcon(item.icon);
                  const domain = item.domain || item.title || "Observation";
                  const status = item.status || item.badge || "Recorded";
                  const score = item.score || item.subtext || "Stable";
                  const detail = item.detail || item.content || "";
                  return (
                    <div
                      key={item.id || idx}
                      className="bg-[#ffffff] border border-[#c2c8c1] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#1a3826]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#f2ede4] text-[#1a3826]">
                            <Icon size={18} />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#032212] uppercase tracking-wider">
                              {domain}
                            </h3>
                            <span className="text-sm font-serif font-bold text-[#032212]">
                              {status}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#1a3826] bg-[#c8ebd1] px-2 py-0.5 rounded-full">
                          {score}
                        </span>
                      </div>

                      <p className="text-xs text-[#424843] leading-relaxed pt-1 border-t border-[#c2c8c1]/30">
                        {detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Interactive Governed Copilot */}
            <div className="bg-[#ffffff] border-2 border-[#1a3826] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
                    <Sparkles size={14} /> Memory Firewall Grounded Engine
                  </div>
                  <h2 className="text-xl font-bold font-serif text-[#032212]">
                    Caregiver Copilot Consultation
                  </h2>
                  <p className="text-xs text-[#424843] mt-1 max-w-2xl">
                    Ask practical caregiving questions in natural language. Copilot reasons over Aitâ’s verified home telemetry and clinical history, adhering strictly to non-diagnostic safety boundaries.
                  </p>
                </div>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Why is Aitâ restless around 4 PM today?",
                  "How did she do on her morning medications?",
                  "Suggest a gentle Assamese tea-time conversation topic",
                  "Draft Dr. Barua's consultation summary notes",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCopilotQuery(chip);
                      handleQueryCopilot(chip);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#c2c8c1] bg-[#f8f3ea] text-[#032212] hover:bg-[#f2ede4] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Query Input Box */}
              <div className="flex items-center gap-2 p-2 bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl focus-within:ring-2 focus-within:ring-[#1a3826]">
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQueryCopilot()}
                  placeholder="Ask Copilot anything about Aitâ’s day, routine, or tea-time comfort..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#032212] focus:outline-none placeholder-[#727972]"
                />
                <button
                  onClick={() => handleQueryCopilot()}
                  disabled={copilotLoading || !copilotQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#1a3826] text-white hover:bg-[#032212] text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Send size={14} />
                  <span>{copilotLoading ? "Analyzing..." : "Consult"}</span>
                </button>
              </div>

              {/* Copilot Answer Display */}
              {copilotResponse && (
                <div className="p-5 bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#c2c8c1]/40 pb-2">
                    <span className="text-xs font-bold text-[#1a3826] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#904d00]" /> Copilot Analysis
                    </span>
                    <span className="text-[11px] text-[#466550] font-medium">
                      Memory Firewall Verified
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1d1c16] leading-relaxed">
                    {copilotResponse.answer}
                  </p>

                  {copilotResponse.context_hypothesis && (
                    <div className="p-3 bg-[#f2ede4] rounded-xl text-xs text-[#424843]">
                      <strong className="text-[#032212]">Context Hypothesis:</strong>{" "}
                      {copilotResponse.context_hypothesis}
                    </div>
                  )}

                  {copilotResponse.gentle_action && (
                    <div className="p-3 bg-[#c8ebd1]/40 border border-[#adcfb5] rounded-xl text-xs text-[#022111]">
                      <strong className="text-[#1a3826]">Suggested Gentle Action:</strong>{" "}
                      {copilotResponse.gentle_action}
                    </div>
                  )}

                  {/* Provenance Footer */}
                  <div className="text-[11px] text-[#727972] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#c2c8c1]/30">
                    <span>
                      {copilotResponse.provenance ||
                        "Cited 3 verifiable sensor logs from Tezpur living room."}
                    </span>
                    <span className="text-[#ba1a1a] font-medium">
                      Non-Diagnostic Caregiver Scaffolding Only
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Ambient Footer Anchors & Clinical Portal Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Dr. Barua Bridge Card */}
              <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
                      Clinician Bridge
                    </span>
                    <span className="text-xs text-[#1a3826] bg-[#c8ebd1] px-2.5 py-0.5 rounded-full font-semibold">
                      Next: Sept 24
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-[#032212]">
                    Dr. B. K. Barua (Guwahati Neurologist)
                  </h3>
                  <p className="text-xs text-[#424843] leading-relaxed">
                    Quarterly review summary ready. Compresses 90 days of domestic medication, sleep, and recall logs into a 1-page printable medical brief.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsClinicalBriefOpen(true)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a3826] text-white hover:bg-[#032212] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Export Doctor’s Brief</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("reports-consult")}
                    className="px-4 py-2.5 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#032212] hover:bg-[#f8f3ea] transition-colors"
                  >
                    View Synthesis
                  </button>
                </div>
              </div>

              {/* Emergency & Tele-MANAS Support Card */}
              <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a]">
                      Emergency & Tele-Support
                    </span>
                    <span className="text-xs text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full font-semibold">
                      24/7 National Line
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-[#032212]">
                    Tele-MANAS & Local Assistance
                  </h3>
                  <p className="text-xs text-[#424843] leading-relaxed">
                    If Aitâ ever experiences acute disorientation or medical distress, immediate 24/7 tele-counseling is available in Assamese via India's Tele-MANAS helpline.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="tel:14416"
                    className="flex-1 py-2.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-center"
                  >
                    <Phone size={14} />
                    <span>Call Tele-MANAS (14416)</span>
                  </a>
                  <button
                    onClick={() => alert("Connecting to Tezpur Civil Hospital Emergency Desk: 03712-220011")}
                    className="px-4 py-2.5 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#032212] hover:bg-[#f8f3ea] transition-colors"
                  >
                    Tezpur Hospital
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      <SupportLevelModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        currentLevel={supportLevel}
        currentReason={supportReason}
        onSave={handleSaveSupportLevel}
      />

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        evidence={
          overviewData?.decision_triad?.what_matters_today?.evidence || [
            {
              id: "ev-1",
              title: "Ancestral Photo Match Response Latency",
              timestamp: "11:30 AM Today",
              detail: "Response latency increased by 0.3s (4.1s vs 3.8s 14-day median) during Kaziranga photo match.",
              reliability: 92,
            },
            {
              id: "ev-2",
              title: "Bedside Motion Sensor Waking Logs",
              timestamp: "02:10 AM & 04:30 AM",
              detail: "Logged two brief nocturnal bed exits for water; returned to sleep within 8 minutes.",
              reliability: 96,
            },
            {
              id: "ev-3",
              title: "Tezpur Weather Station Precipitation Sensor",
              timestamp: "Continuous 72h",
              detail: "Heavy continuous monsoon rain in Tezpur valley confined customary morning courtyard walks.",
              reliability: 99,
            },
          ]
        }
        observation={
          overviewData?.decision_triad?.what_matters_today?.observation ||
          "Activity & evening relaxation were lower than her personal baseline for the 3rd day; 2 brief sleep wakings logged."
        }
        practicalReason={
          overviewData?.decision_triad?.what_matters_today?.practical_reason ||
          "Heavy continuous monsoon drizzle in Tezpur prevented customary courtyard strolls, compounded by primary caregiver Anu's recent 48-hour travel to Guwahati."
        }
        whatThisDoesNotMean={
          overviewData?.decision_triad?.what_matters_today?.what_this_does_not_mean ||
          "This is not sudden neurological decline or medical illness. It is a mild situational adjustment to weather confinement and domestic routine changes."
        }
      />

      <ClinicalBriefModal
        isOpen={isClinicalBriefOpen}
        onClose={() => setIsClinicalBriefOpen(false)}
        patientName="Purnima Devi (Aitâ)"
        doctorName="Dr. B. K. Barua"
        appointmentDate="September 24, 2026"
      />

      <TabletMirrorModal
        isOpen={isTabletMirrorOpen}
        onClose={() => setIsTabletMirrorOpen(false)}
      />

      <CaregiverNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        initialObservations={overviewData?.observations || []}
        onNoteAdded={loadOverview}
      />
    </div>
  );
};
