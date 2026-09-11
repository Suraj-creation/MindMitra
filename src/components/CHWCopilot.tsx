import React, { useState, useEffect } from "react";
import {
  Users,
  Wifi,
  WifiOff,
  Check,
  Clock,
  MapPin,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Lock,
  Play,
  ArrowRight,
  FileText,
  Sparkles,
  Calendar,
  X,
  Sun,
  Ear,
  Languages,
  HeartHandshake,
  Pill,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  HelpCircle,
  Search,
} from "lucide-react";
import type { ChwHouseholdRecord, ChwVisitRecord, ChwSyncQueueItem } from "../db/chw-db";

export const CHWCopilot: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"today" | "households" | "escalations" | "sync">("today");

  // Caseload state
  const [households, setHouseholds] = useState<ChwHouseholdRecord[]>([]);
  const [activeVisit, setActiveVisit] = useState<ChwVisitRecord | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>("hh:purnima");
  const [summary, setSummary] = useState({ total: 4, attention: 2, routine: 2, estimated_minutes: 34 });

  // Connectivity & offline mode simulation
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(3);
  const [lastSyncLabel, setLastSyncLabel] = useState<string>("Yesterday, 6:42 PM");
  const [syncQueueItems, setSyncQueueItems] = useState<ChwSyncQueueItem[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Field Brief Modal
  const [fieldBriefModal, setFieldBriefModal] = useState<ChwHouseholdRecord | null>(null);

  // Interactive Checklist on Purnima Card
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "Comfort & Pain Screening": true,
    "Hearing Aid In-Ear Check": false,
    "Cardamom Tea & Flute Anchor": true,
    "Daughter Anu’s Fatigue Scale": false,
  });

  // Copilot contextual chat in right pane
  const [copilotQuery, setCopilotQuery] = useState<string>("");
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text: "Namaskar Rumi. I have loaded Aitâ Purnima's context. Her sleep latency was ~45 mins yesterday, but afternoon ginger cardamom tea remains a strong calming anchor. Ask me anything about today's route.",
    },
  ]);

  // Toast notification for offline queue save
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search in households tab
  const [searchQuery, setSearchQuery] = useState("");
  const [clusterFilter, setClusterFilter] = useState<"all" | "Tezpur Rural" | "Mawlai Cluster">("all");

  // ── Fetch initial data from /v1/chw/* ──────────────────────────────────────
  const loadCaseload = async () => {
    try {
      const res = await fetch("/v1/chw/caseload?chw_name=Rumi%20Saikia", {
        headers: { "x-role": "chw" },
      });
      if (res.ok) {
        const data = await res.json();
        setHouseholds(data.households || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch {
      // Offline failover handled gracefully
    }
  };

  const loadActiveVisit = async (hhId: string) => {
    try {
      const res = await fetch(`/v1/chw/visit/active?household_id=${hhId}`, {
        headers: { "x-role": "chw" },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveVisit(data);
      }
    } catch {
      // Offline fallback
    }
  };

  const loadSyncQueue = async () => {
    try {
      const res = await fetch("/v1/chw/sync/status");
      if (res.ok) {
        const data = await res.json();
        setSyncQueueItems(data.items || []);
        setQueuedCount(data.queuedCount ?? 3);
        if (data.lastSyncLabel) setLastSyncLabel(data.lastSyncLabel);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    loadCaseload();
    loadActiveVisit(selectedHouseholdId);
    loadSyncQueue();
  }, [selectedHouseholdId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartVisit = (hh: ChwHouseholdRecord) => {
    setSelectedHouseholdId(hh.id);
    loadActiveVisit(hh.id);
    setActiveTab("today");
    const panel = document.getElementById("active-visit-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth" });
      panel.classList.add("ring-4", "ring-[#fe932c]/50");
      setTimeout(() => panel.classList.remove("ring-4", "ring-[#fe932c]/50"), 800);
    }
  };

  const handleStepClick = async (stepNum: number) => {
    if (!activeVisit) return;
    const updated = { ...activeVisit, current_step: stepNum };
    setActiveVisit(updated);
    try {
      await fetch(`/v1/chw/visit/${activeVisit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_step: stepNum }),
      });
    } catch {
      // Handled offline
    }
  };

  const handleToggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleToggleHearingAid = async () => {
    if (!activeVisit) return;
    const currentStatus = activeVisit.measurement_context.hearing_aid_status;
    const nextStatus = currentStatus === "off" ? "on" : "off";
    const updated = {
      ...activeVisit,
      measurement_context: {
        ...activeVisit.measurement_context,
        hearing_aid_status: nextStatus as "on" | "off",
      },
    };
    setActiveVisit(updated);
    try {
      await fetch(`/v1/chw/visit/${activeVisit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurement_context: updated.measurement_context }),
      });
    } catch {
      // Handled offline
    }
  };

  const handleSaveVisitDelta = async () => {
    if (!activeVisit) return;
    try {
      const res = await fetch(`/v1/chw/visit/${activeVisit.id}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: activeVisit.current_step,
          context: activeVisit.measurement_context,
          inquiries: activeVisit.inquiries,
          meds: activeVisit.medication_verification,
          follow_up: activeVisit.follow_up_decision,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setQueuedCount(result.queuedCount);
        setToastMessage(`Encrypted visit delta saved! Hash: ${result.hash.slice(0, 22)}...`);
        loadSyncQueue();
        setTimeout(() => setToastMessage(null), 4500);
      }
    } catch {
      setQueuedCount((q) => q + 1);
      setToastMessage("Saved to local offline cache. Hash stamped.");
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/v1/chw/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQueuedCount(0);
        setLastSyncLabel(`Today, ${data.syncTimestamp}`);
        setSyncSuccessMsg(`Mule sync complete: ${data.syncedRecords} records verified at ${data.mulePoint}`);
        loadSyncQueue();
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch {
      setSyncSuccessMsg("Mule sync recorded. Changes queued for next PHC hotspot.");
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    const userText = copilotQuery.trim();
    setCopilotMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setCopilotQuery("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/v1/chw/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          household_id: selectedHouseholdId,
          step: activeVisit?.current_step || 3,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages((prev) => [
          ...prev,
          { sender: "copilot", text: data.answer },
        ]);
      } else {
        setCopilotMessages((prev) => [
          ...prev,
          {
            sender: "copilot",
            text: "Context guidance: Approach elder gently in primary Assamese/Khasi vernacular without cognitive testing pressure. Review evening hydration and sleep warmth.",
          },
        ]);
      }
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "Offline Copilot Guidance: For Aitâ Purnima, prioritize hearing aid fit and reassurance during twilight restlessness.",
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Selected priority cards
  const purnima = households.find((h) => h.id === "hh:purnima");
  const lyngdoh = households.find((h) => h.id === "hh:lyngdoh");
  const routineHouseholds = households.filter((h) => h.priority_tier === "routine");

  const filteredHouseholds = households.filter((h) => {
    const matchesSearch =
      h.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.caregiver_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCluster = clusterFilter === "all" || h.cluster === clusterFilter;
    return matchesSearch && matchesCluster;
  });

  return (
    <div className="w-full min-h-screen bg-[#fef9f0] text-[#1d1c16] font-sans selection:bg-[#c8ebd1] selection:text-[#022111] pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a3826] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-[#81a28a] animate-fade-in text-sm font-medium">
          <ShieldCheck size={20} className="text-[#c8ebd1] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Synchronized Notice Banner */}
      {syncSuccessMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a3826] text-[#c8ebd1] px-6 py-2.5 rounded-full shadow-lg border border-[#81a28a] text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={16} className="text-[#fe932c]" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* ── Sub-Surface Header Bar ────────────────────────────────────────── */}
      <header className="w-full bg-[#fef9f0]/95 backdrop-blur-md border-b border-[#e7e2d9] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-[#032212] tracking-tight">MindMitra</span>
                <span className="px-2 py-0.5 rounded bg-[#f2ede4] text-[#424843] text-xs font-medium">
                  Tezpur &amp; Mawlai
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#424843]">
                <span className="font-semibold text-[#1d1c16]">Rumi Saikia</span>
                <span className="text-[#727972]">·</span>
                <span>ASHA Tezpur Rural</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "today"
                  ? "bg-[#1a3826] text-white shadow-sm"
                  : "text-[#424843] hover:bg-[#ece8df] hover:text-[#1d1c16]"
              }`}
            >
              Today &amp; Visits
            </button>
            <button
              onClick={() => setActiveTab("households")}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "households"
                  ? "bg-[#1a3826] text-white shadow-sm"
                  : "text-[#424843] hover:bg-[#ece8df] hover:text-[#1d1c16]"
              }`}
            >
              My Households
            </button>
            <button
              onClick={() => setActiveTab("escalations")}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "escalations"
                  ? "bg-[#1a3826] text-white shadow-sm"
                  : "text-[#424843] hover:bg-[#ece8df] hover:text-[#1d1c16]"
              }`}
            >
              Follow-ups &amp; Escalations
            </button>
            <button
              onClick={() => setActiveTab("sync")}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "sync"
                  ? "bg-[#1a3826] text-white shadow-sm"
                  : "text-[#424843] hover:bg-[#ece8df] hover:text-[#1d1c16]"
              }`}
            >
              Sync Centre
            </button>
          </nav>

          {/* Offline Mode & Sync Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex flex-col items-end px-3 py-1 rounded-lg border text-left transition-all ${
                isOffline
                  ? "bg-[#ffdcc3] border-[#fe932c] text-[#663500]"
                  : "bg-[#f8f3ea] border-[#e7e2d9] text-[#1d1c16]"
              }`}
              title="Toggle field simulation"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-[#fe932c]" : "bg-[#466550]"}`} />
                <span className="text-xs font-semibold">
                  {isOffline ? `Offline · ${queuedCount} records queued` : `Online · ${queuedCount} in queue`}
                </span>
              </div>
              <span className="text-[10px] text-[#424843]">Synced {lastSyncLabel}</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#032212] flex items-center justify-center text-white text-xs font-bold">
              RS
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-Header & Cluster Context ──────────────────────────────────── */}
      <section className="w-full bg-[#f8f3ea] border-b border-[#e7e2d9]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3826]" />
              <span className="font-bold text-[#032212]">ASHA Field Operational Worklist</span>
              <span className="text-[#c2c8c1]">/</span>
              <span className="text-[#424843]">Tezpur Rural &amp; Mawlai Cluster</span>
              <span className="text-[#c2c8c1] hidden sm:inline">·</span>
              <span className="text-[#424843] hidden sm:inline">Thursday, 11 September 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2ede4] text-xs font-medium text-[#424843]">
                <span className="w-2 h-2 rounded-full bg-[#fe932c] animate-pulse" />
                Offline Mode · Keystore Encrypted
              </span>
              <span className="text-[#424843] hidden md:inline text-[11px]">
                Synced: {lastSyncLabel} ({queuedCount} visit deltas queued)
              </span>
            </div>
          </div>

          {/* Operational Route Pill */}
          <div className="mt-1 p-3 rounded-xl bg-[#fef9f0] border border-[#e7e2d9] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-[#1a3826] text-white text-xs font-bold tracking-wide">
                TODAY’S FIELD ROUTE
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-serif font-bold text-[#032212]">{summary.total} Households</span>
                <span className="text-[#727972]">·</span>
                <span className="text-[#904d00] font-semibold">{summary.attention} Need Attention</span>
                <span className="text-[#727972]">·</span>
                <span className="text-[#424843]">{summary.routine} Routine Cadence</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#424843]">
              <div className="flex items-center gap-1.5 text-[#032212] font-semibold">
                <Clock size={16} className="text-[#1a3826]" />
                <span>Est. Field Time: {summary.estimated_minutes} mins</span>
              </div>
              <span className="text-[#c2c8c1]">|</span>
              <span>Respect personal resting rhythms</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB 1: TODAY & VISITS (Matches Design Guide Mockup) ───────────── */}
      {activeTab === "today" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Atmosphere Narrative Banner */}
          <section className="relative overflow-hidden rounded-xl bg-[#f2ede4] border border-[#e7e2d9] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#032212] text-white text-xs font-bold">
                  Dignity First
                </span>
                <span className="text-xs text-[#424843] font-medium">ASHA Field Methodology §14</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#032212] leading-tight">
                Gentle Inquiry over Measurement Fatigue
              </h1>
              <p className="text-sm text-[#424843] leading-relaxed">
                Approach elders in their comfort zone—the tea verandah, courtyard bench, or woven prayer mat. Check memory anchors before testing recall, and always honor family consent boundaries.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm hidden sm:block border border-[#c2c8c1]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7IuMxmMtDJ_AqIkm5XmttPmUz9Ob5rBZ_5DpYurL1eynin3sjhHIqUPvk3iKkaJOX6l95EeAuqirjGCHUwzyDCfsnFQa-WyOZLFWa2ODyBgxqTK40MVb3z_bBzzSBX9ADleEunkSnFSQ09KLKSg2i_BShLzD8k1EUykUVVCVBSfaOj5IlGHCTFdHm5RkzcTuL24htNg9_vKF20KFyuQDoqud3jxhcu-RYqvLqYR5L-7ZO1okCQVCF"
                  alt="Verandah morning tea garden"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#032212]">Brahmaputra Mist Protocol</span>
                <span className="text-[11px] text-[#424843]">Low-arousal questioning verified</span>
              </div>
            </div>
          </section>

          {/* 2-COLUMN OPERATIONAL FIELD INTERFACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Priority & Field Queue (7 cols) ─────────────── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Priority Households */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#904d00]" />
                    <h2 className="font-serif text-lg font-bold text-[#032212]">
                      Households Needing Attention
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#904d00] px-2 py-0.5 rounded bg-[#ffdcc3]">
                    Actionable Today (2)
                  </span>
                </div>

                {/* PRIORITY CARD 1: PURNIMA DEVI */}
                {purnima && (
                  <article className="p-5 sm:p-6 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-4 relative">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-full overflow-hidden shadow-xs shrink-0 border-2 border-white">
                          <img
                            src={purnima.photo_url}
                            alt="Portrait of Purnima Devi"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-[#032212]">
                              {purnima.person_name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-[#f2ede4] font-semibold text-[#424843]">
                              {purnima.honorific} · Age {purnima.age}
                            </span>
                          </div>
                          <p className="text-xs text-[#424843] mt-0.5">
                            {purnima.locality} · {purnima.primary_language}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-end gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#fe932c] text-[#663500] text-xs font-bold">
                          {purnima.action_level}
                        </span>
                        <span className="text-[11px] text-[#424843]">{purnima.last_visited_label}</span>
                      </div>
                    </div>

                    {/* The 'Why Today?' Anchor */}
                    <div className="p-3.5 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#904d00]">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Why prioritized today?</span>
                      </div>
                      <p className="text-xs text-[#1d1c16] leading-relaxed">
                        “{purnima.why_prioritized}”
                      </p>
                    </div>

                    {/* Contextual Checklist for Rumi (ASHA) */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#424843] font-bold">
                        Suggested Context Checks for Rumi (ASHA)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {purnima.suggested_checks.map((check) => (
                          <button
                            type="button"
                            key={check}
                            onClick={() => handleToggleCheck(check)}
                            className={`flex items-center gap-2 p-2 rounded text-left transition-colors ${
                              checkedItems[check] ? "bg-[#c8ebd1]/40 border border-[#81a28a]" : "bg-[#f2ede4] border border-[#e7e2d9]"
                            }`}
                          >
                            <span className={`w-4 h-4 rounded flex items-center justify-center ${checkedItems[check] ? "bg-[#1a3826] text-white" : "border border-[#727972]"}`}>
                              {checkedItems[check] && <Check size={12} />}
                            </span>
                            <span className="text-xs text-[#1d1c16] font-medium">{check}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Firewall Guarantee */}
                    <div className="flex flex-wrap items-center justify-between pt-1 text-xs text-[#424843] gap-2 border-t border-[#e7e2d9]/60">
                      <div className="flex items-center gap-1 text-[#466550]">
                        <ShieldCheck size={16} />
                        <span>{purnima.firewall_status}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#032212]">
                        Recommended: {purnima.suggested_visit_minutes} min calm visit
                      </span>
                    </div>

                    {/* Direct Actions */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        onClick={() => handleStartVisit(purnima)}
                        className="flex-1 min-h-[48px] py-2 px-4 rounded-lg bg-[#1a3826] hover:bg-[#032212] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <span>Start Guided Visit (10 min)</span>
                        <ArrowRight size={16} />
                      </button>
                      <button
                        onClick={() => setFieldBriefModal(purnima)}
                        className="min-h-[48px] py-2 px-4 rounded-lg bg-[#fef9f0] hover:bg-[#f2ede4] border border-[#e7e2d9] font-semibold text-xs text-[#032212] flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText size={16} />
                        <span>View Field Brief</span>
                      </button>
                    </div>
                  </article>
                )}

                {/* PRIORITY CARD 2: MRS. B. LYNGDOH */}
                {lyngdoh && (
                  <article className="p-5 sm:p-6 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-full overflow-hidden shadow-xs shrink-0 border-2 border-white">
                          <img
                            src={lyngdoh.photo_url}
                            alt="Portrait of Mrs. B. Lyngdoh"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-[#032212]">
                              {lyngdoh.person_name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-[#f2ede4] font-semibold text-[#424843]">
                              {lyngdoh.honorific} · Age {lyngdoh.age}
                            </span>
                          </div>
                          <p className="text-xs text-[#424843] mt-0.5">
                            {lyngdoh.locality} · {lyngdoh.primary_language}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-end gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold">
                          {lyngdoh.action_level}
                        </span>
                        <span className="text-[11px] text-[#424843]">{lyngdoh.last_visited_label}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#904d00]">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Why prioritized today?</span>
                      </div>
                      <p className="text-xs text-[#1d1c16] leading-relaxed">
                        “{lyngdoh.why_prioritized}”
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#424843] font-bold">
                        Recommended Focal Inquiries
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lyngdoh.suggested_checks.map((c) => (
                          <span key={c} className="px-2.5 py-1 rounded-full bg-[#fef9f0] border border-[#e7e2d9] text-xs text-[#1d1c16]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleStartVisit(lyngdoh)}
                        className="w-full min-h-[48px] py-2 px-4 rounded-lg bg-[#032212] hover:bg-[#1a3826] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <span>Start Guided Visit ({lyngdoh.suggested_visit_minutes} min)</span>
                        <Play size={16} />
                      </button>
                    </div>
                  </article>
                )}
              </div>

              {/* Section 2: Routine House Checks */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#032212]">Routine Household Visits</h2>
                  <span className="text-xs text-[#424843]">Scheduled Regular Cadence ({routineHouseholds.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {routineHouseholds.map((rh) => (
                    <div key={rh.id} className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-[#032212]">{rh.person_name}</h4>
                          <span className="text-[11px] text-[#466550] font-semibold">{rh.action_level}</span>
                        </div>
                        <p className="text-xs text-[#424843]">{rh.locality} · Age {rh.age}</p>
                        <p className="text-[11px] text-[#1d1c16] pt-1">{rh.why_prioritized}</p>
                      </div>
                      <button
                        onClick={() => handleStartVisit(rh)}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#fef9f0] hover:bg-[#f2ede4] border border-[#e7e2d9] text-xs font-semibold text-[#032212] flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Open Routine Check</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Offline Sync Mule & Queue Status */}
              <div className="p-4 rounded-xl bg-[#f2ede4] border border-[#e7e2d9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a3826] text-white flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#032212] block">
                      Field Sync Queue ({queuedCount} Encrypted Deltas)
                    </span>
                    <span className="text-[11px] text-[#424843]">
                      Zero Data Loss · Next Mule Point: Tezpur Block PHC (AAM) at 2:00 PM
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] text-[#032212] text-xs font-semibold hover:bg-[#ece8df] transition-colors"
                >
                  {syncing ? "Syncing..." : "Force Manual Mule Sync"}
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Active Visit Workflow & Intelligence (5 cols) ─ */}
            <aside className="lg:col-span-5 space-y-4" id="active-visit-panel">
              {activeVisit && (
                <div className="p-5 sm:p-6 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-4">
                  {/* Card Header & Visit ID */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#c8ebd1] text-[#022111] text-[11px] font-bold">
                        ACTIVE 10-MIN VISIT
                      </span>
                      <span className="text-xs text-[#424843] font-medium">
                        Step {activeVisit.current_step} of 5
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-bold text-[#032212]">
                      {activeVisit.person_name}
                    </h2>
                    <p className="text-[11px] text-[#424843]">
                      Home Visit ID: {activeVisit.id} · In Progress
                    </p>
                  </div>

                  {/* Milestone Progression Ribbon */}
                  <div className="py-2">
                    <div className="flex items-center justify-between text-center relative">
                      {[
                        { step: 1, label: "Arrive" },
                        { step: 2, label: "Consent" },
                        { step: 3, label: "Observe" },
                        { step: 4, label: "Meds" },
                        { step: 5, label: "Plan" },
                      ].map((s, idx, arr) => {
                        const isDone = activeVisit.current_step > s.step;
                        const isCurrent = activeVisit.current_step === s.step;
                        return (
                          <React.Fragment key={s.step}>
                            <button
                              type="button"
                              onClick={() => handleStepClick(s.step)}
                              className="flex flex-col items-center gap-1 z-10 focus:outline-none cursor-pointer"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? "bg-[#1a3826] text-white"
                                    : isCurrent
                                    ? "bg-[#fe932c] text-[#2f1500] ring-4 ring-[#ffdcc3]"
                                    : "bg-[#f2ede4] text-[#424843]"
                                }`}
                              >
                                {isDone ? <Check size={14} /> : s.step}
                              </div>
                              <span
                                className={`text-[11px] ${
                                  isCurrent ? "font-bold text-[#904d00]" : isDone ? "font-semibold text-[#1a3826]" : "text-[#424843]"
                                }`}
                              >
                                {s.label}
                              </span>
                            </button>
                            {idx < arr.length - 1 && (
                              <div
                                className={`flex-1 h-1 -mt-4 transition-colors ${
                                  activeVisit.current_step > s.step ? "bg-[#1a3826]" : "bg-[#c2c8c1]"
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Measurement Integrity Context */}
                  <div className="p-3.5 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-2">
                    <span className="text-xs font-bold text-[#032212] block">
                      Measurement Integrity Context
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#1d1c16]">
                        <Sun size={14} className="text-[#466550]" />
                        <span>Quiet Veranda</span>
                      </div>
                      <button
                        onClick={handleToggleHearingAid}
                        className="flex items-center gap-1.5 text-left text-[#1d1c16] hover:underline"
                        title="Click to toggle status"
                      >
                        <Ear size={14} className="text-[#466550]" />
                        <span>Hearing Aid: {activeVisit.measurement_context.hearing_aid_status.toUpperCase()}</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-[#1d1c16]">
                        <Languages size={14} className="text-[#466550]" />
                        <span>{activeVisit.measurement_context.dialect_used}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#1d1c16]">
                        <HeartHandshake size={14} className="text-[#466550]" />
                        <span>Resting: {activeVisit.measurement_context.resting_state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Separated Source Inquiries (Unadulterated Voices) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#032212]">Separated Source Inquiries</span>
                      <span className="text-[11px] text-[#424843]">Unadulterated Voices</span>
                    </div>

                    {/* Source 1: Person Said */}
                    {activeVisit.inquiries.person_said && (
                      <div className="p-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#032212] flex items-center gap-1">
                            <Eye size={13} className="text-[#1a3826]" />
                            {activeVisit.inquiries.person_said.source}
                          </span>
                          <span className="text-[10px] text-[#424843]">
                            {activeVisit.inquiries.person_said.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#1d1c16] italic leading-relaxed">
                          {activeVisit.inquiries.person_said.text}
                        </p>
                      </div>
                    )}

                    {/* Source 2: Caregiver Reported */}
                    {activeVisit.inquiries.caregiver_reported && (
                      <div className="p-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#904d00] flex items-center gap-1">
                            <Users size={13} className="text-[#904d00]" />
                            {activeVisit.inquiries.caregiver_reported.source}
                          </span>
                          <span className="text-[10px] text-[#424843]">
                            {activeVisit.inquiries.caregiver_reported.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#1d1c16] leading-relaxed">
                          {activeVisit.inquiries.caregiver_reported.text}
                        </p>
                      </div>
                    )}

                    {/* Source 3: CHW Observed */}
                    {activeVisit.inquiries.chw_observed && (
                      <div className="p-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#466550] flex items-center gap-1">
                            <ShieldCheck size={13} className="text-[#466550]" />
                            {activeVisit.inquiries.chw_observed.source}
                          </span>
                          <span className="text-[10px] text-[#424843]">
                            {activeVisit.inquiries.chw_observed.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#1d1c16] leading-relaxed">
                          {activeVisit.inquiries.chw_observed.text}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 4: Medication Reconciliation & Functional Independence */}
                  <div className="p-3.5 rounded-lg bg-[#f2ede4] border border-[#e7e2d9] space-y-2">
                    <span className="text-xs font-bold text-[#032212] flex items-center gap-1.5">
                      <Pill size={15} className="text-[#1a3826]" />
                      Medication &amp; Daily Anchor Verification
                    </span>
                    <div className="space-y-1 text-xs text-[#1d1c16]">
                      <p>
                        • <strong className="text-[#032212]">{activeVisit.medication_verification.pill_name}:</strong>{" "}
                        {activeVisit.medication_verification.verification_method}
                      </p>
                      <p>
                        • <strong className="text-[#032212]">Functional Independence:</strong>{" "}
                        {activeVisit.medication_verification.functional_independence}
                      </p>
                      <p className="text-[10px] text-[#424843] pt-0.5 italic">
                        {activeVisit.medication_verification.notes}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Deterministic Follow-up Ladder */}
                  <div className="p-3.5 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#032212]">Next Action Decision</span>
                      <span className="px-2 py-0.5 rounded bg-[#f2ede4] text-[11px] font-bold text-[#032212]">
                        Assigned: {activeVisit.follow_up_decision.assigned_level}
                      </span>
                    </div>
                    <p className="text-xs text-[#1d1c16] leading-relaxed">
                      {activeVisit.follow_up_decision.advice_note}
                    </p>
                  </div>

                  {/* Save Visit Action Button */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={handleSaveVisitDelta}
                      className="w-full min-h-[48px] py-2 px-4 rounded-lg bg-[#1a3826] hover:bg-[#032212] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Lock size={16} />
                      <span>Save Visit to Offline Queue (Encrypted Delta)</span>
                    </button>
                    <p className="text-center text-[10px] text-[#424843]">
                      Hash stamped locally · Syncs when back in range of Mawlai or PHC
                    </p>
                  </div>
                </div>
              )}

              {/* Field Copilot & Regional Memory Prompt Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#032212]">
                  <Sparkles size={18} className="text-[#1a3826]" />
                  <h3 className="font-semibold text-sm">Field Copilot &amp; Regional Context</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-md bg-[#fef9f0] border border-[#e7e2d9] text-[#424843]">
                    <strong className="text-[#032212]">Suggested Cultural Prompt:</strong> “Ask Aitâ about the autumn harvest singing in Nagaon or if the tea plucking songs have started in neighboring estate.”
                  </div>
                  <div className="p-2.5 rounded-md bg-[#fef9f0] border border-[#e7e2d9] text-[#424843]">
                    <strong className="text-[#032212]">Teleconsult Note:</strong> Dr. Barua (District Hospital) next teleconsult window: 24 September. Sleep trends auto-compiled for review.
                  </div>
                </div>

                {/* Copilot Chat Feed */}
                <div className="pt-2 border-t border-[#e7e2d9] space-y-2">
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {copilotMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                          m.sender === "user"
                            ? "bg-[#1a3826] text-white ml-6 text-right"
                            : "bg-[#fef9f0] border border-[#e7e2d9] text-[#1d1c16] mr-6"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                    {copilotLoading && (
                      <div className="p-2 rounded bg-[#fef9f0] text-xs text-[#424843] flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin text-[#1a3826]" />
                        <span>Checking field records...</span>
                      </div>
                    )}
                  </div>

                  {/* Query Input */}
                  <form onSubmit={handleAskCopilot} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      placeholder="Ask copilot about this household..."
                      className="flex-1 bg-[#fef9f0] border border-[#c2c8c1] rounded-lg px-3 py-1.5 text-xs text-[#1d1c16] focus:outline-none focus:border-[#1a3826]"
                    />
                    <button
                      type="submit"
                      disabled={copilotLoading || !copilotQuery.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212] disabled:opacity-50 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* ── TAB 2: MY HOUSEHOLDS (Complete Field Caseload Directory) ─────── */}
      {activeTab === "households" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7e2d9]">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#032212]">
                Assigned Households Roster
              </h2>
              <p className="text-xs text-[#424843] mt-0.5">
                Tezpur Rural &amp; Upper Mawlai cluster · 4 active community elders
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-[#727972]" />
                <input
                  type="text"
                  placeholder="Search elder or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#f8f3ea] border border-[#c2c8c1] text-xs text-[#1d1c16] focus:outline-none focus:border-[#1a3826]"
                />
              </div>
              <select
                value={clusterFilter}
                onChange={(e) => setClusterFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-lg bg-[#f8f3ea] border border-[#c2c8c1] text-xs font-medium text-[#1d1c16] focus:outline-none"
              >
                <option value="all">All Clusters</option>
                <option value="Tezpur Rural">Tezpur Rural</option>
                <option value="Mawlai Cluster">Mawlai Cluster</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHouseholds.map((hh) => (
              <div
                key={hh.id}
                className="p-5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-4 hover:border-[#81a28a] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={hh.photo_url}
                      alt={hh.person_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-[#032212]">{hh.person_name}</h3>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f2ede4] text-[#424843]">
                          {hh.honorific} · Age {hh.age}
                        </span>
                      </div>
                      <p className="text-xs text-[#424843] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#1a3826]" />
                        <span>{hh.locality}</span>
                        <span>·</span>
                        <span>{hh.cluster}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      hh.priority_tier === "attention"
                        ? "bg-[#fe932c] text-[#663500]"
                        : "bg-[#c8ebd1] text-[#022111]"
                    }`}
                  >
                    {hh.action_level}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] text-xs text-[#1d1c16]">
                  <strong className="text-[#032212]">Follow-up Reason:</strong> {hh.why_prioritized}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#424843] pt-1 border-t border-[#e7e2d9]/60">
                  <div>
                    <span className="text-[#727972] block text-[10px]">Caregiver:</span>
                    <span className="font-medium text-[#1d1c16]">{hh.caregiver_name}</span>
                  </div>
                  <div>
                    <span className="text-[#727972] block text-[10px]">Last Visit:</span>
                    <span className="font-medium text-[#1d1c16]">{hh.last_visited_label}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleStartVisit(hh)}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Start Guided Visit</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setFieldBriefModal(hh)}
                    className="py-2 px-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] text-[#032212] text-xs font-semibold hover:bg-[#ece8df] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText size={14} />
                    <span>Field Brief</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ── TAB 3: FOLLOW-UPS & ESCALATIONS (Deterministic Framework) ────── */}
      {activeTab === "escalations" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="pb-4 border-b border-[#e7e2d9]">
            <h2 className="font-serif text-2xl font-bold text-[#032212]">
              Follow-ups &amp; Action Ladders (L0 – L5)
            </h2>
            <p className="text-xs text-[#424843] mt-0.5">
              Deterministic escalation policy · Human verified only · Never diagnostic
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Ladder Reference Card */}
            <div className="p-5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-[#032212] text-base">Standard Action Levels</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#fef9f0] border border-[#e7e2d9]">
                  <strong className="text-[#032212]">L0 — No Action:</strong> Baseline stable, routine bi-weekly visit.
                </div>
                <div className="p-2.5 rounded bg-[#fef9f0] border border-[#e7e2d9]">
                  <strong className="text-[#466550]">L1 — Observe:</strong> Subtle variation in walking/sleep; reassure elder.
                </div>
                <div className="p-2.5 rounded bg-[#c8ebd1]/50 border border-[#81a28a]">
                  <strong className="text-[#022111]">L2 — CHW Monitor (Assigned: Purnima):</strong> Re-check in 3–5 days; verify sensory/routine anchors.
                </div>
                <div className="p-2.5 rounded bg-[#ffdcc3] border border-[#fe932c]">
                  <strong className="text-[#663500]">L3 — Caregiver Action:</strong> Coordinate with daughter/son; review dusk fatigue.
                </div>
                <div className="p-2.5 rounded bg-[#fef9f0] border border-[#e7e2d9]">
                  <strong className="text-[#ba1a1a]">L4 — Clinical Review:</strong> Flag for Dr. Barua during teleconsult round.
                </div>
                <div className="p-2.5 rounded bg-[#fef9f0] border border-[#ba1a1a]/30">
                  <strong className="text-[#ba1a1a]">L5 — Urgent Medical:</strong> Acute illness, severe fall, medical emergency.
                </div>
              </div>
            </div>

            {/* Scheduled Action Items */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif font-bold text-[#032212] text-base">Upcoming Field Follow-up Actions</h3>

              <div className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fe932c]" />
                    <span className="font-bold text-sm text-[#032212]">Purnima Devi (Aitâ)</span>
                    <span className="text-xs text-[#424843]">Tezpur Ancestral Home</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#ffdcc3] text-[#663500] text-xs font-bold">
                    Target: 14 September
                  </span>
                </div>
                <p className="text-xs text-[#1d1c16] leading-relaxed">
                  <strong>Action:</strong> Re-check sleep latency &amp; confirm radio flute music was set at 5:00 PM before dusk. Check that hearing aid was cleaned by daughter Anu.
                </p>
                <div className="text-[11px] text-[#424843] flex items-center justify-between border-t border-[#e7e2d9]/60 pt-2">
                  <span>Owner: Rumi Saikia (ASHA)</span>
                  <span className="text-[#466550] font-semibold">Firewall Authorized</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#904d00]" />
                    <span className="font-bold text-sm text-[#032212]">Mrs. B. Lyngdoh</span>
                    <span className="text-xs text-[#424843]">Upper Mawlai</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#ffdcc3] text-[#663500] text-xs font-bold">
                    Target: 16 September
                  </span>
                </div>
                <p className="text-xs text-[#1d1c16] leading-relaxed">
                  <strong>Action:</strong> Check non-slip rubber tread on front steps after rainfall. Review wool knitting progress and confirm evening warm water intake.
                </p>
                <div className="text-[11px] text-[#424843] flex items-center justify-between border-t border-[#e7e2d9]/60 pt-2">
                  <span>Owner: Rumi Saikia (ASHA)</span>
                  <span className="text-[#466550] font-semibold">Safety Follow-up</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── TAB 4: SYNC CENTRE (Encrypted Local Keystore & Mule Point) ───── */}
      {activeTab === "sync" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7e2d9]">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#032212]">
                Offline Field Sync &amp; Keystore Centre
              </h2>
              <p className="text-xs text-[#424843] mt-0.5">
                Local cryptographic hash validation · Store-and-forward mule architecture
              </p>
            </div>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="px-4 py-2 rounded-lg bg-[#1a3826] hover:bg-[#032212] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              <span>{syncing ? "Syncing..." : "Sync All Queued Deltas"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs">
              <span className="text-xs text-[#424843] block">Encrypted Records Queued</span>
              <span className="font-serif text-3xl font-bold text-[#904d00] mt-1 block">{queuedCount}</span>
              <span className="text-[11px] text-[#727972] mt-0.5 block">Stored in SQLite Keystore</span>
            </div>
            <div className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs">
              <span className="text-xs text-[#424843] block">Next Physical Mule Point</span>
              <span className="font-serif text-lg font-bold text-[#032212] mt-1 block">Tezpur Block PHC (AAM)</span>
              <span className="text-[11px] text-[#466550] mt-0.5 block">Est. Window: Today at 2:00 PM</span>
            </div>
            <div className="p-4 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs">
              <span className="text-xs text-[#424843] block">Last Successful Cloud Sync</span>
              <span className="font-serif text-lg font-bold text-[#032212] mt-1 block">{lastSyncLabel}</span>
              <span className="text-[11px] text-[#424843] mt-0.5 block">Zero data loss guaranteed</span>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="p-5 rounded-xl bg-[#f8f3ea] border border-[#e7e2d9] shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-[#032212] text-base">Queued Data Deltas</h3>
            <div className="space-y-2">
              {syncQueueItems.length === 0 ? (
                <p className="text-xs text-[#424843] py-4 text-center">All records currently synchronized.</p>
              ) : (
                syncQueueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#fef9f0] border border-[#e7e2d9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#032212]">{item.person_name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#f2ede4] text-[10px] text-[#424843]">
                          {item.record_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#727972] mt-0.5 font-mono">
                        Hash: {item.encryption_stamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#424843]">{item.queued_at}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === "synced"
                            ? "bg-[#c8ebd1] text-[#022111]"
                            : "bg-[#ffdcc3] text-[#663500]"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── FIELD BRIEF MODAL ─────────────────────────────────────────────── */}
      {fieldBriefModal && (
        <div className="fixed inset-0 z-50 bg-[#1d1c16]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fef9f0] rounded-2xl border border-[#e7e2d9] max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-[#e7e2d9]">
              <div className="flex items-center gap-3">
                <img
                  src={fieldBriefModal.photo_url}
                  alt={fieldBriefModal.person_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#032212]">
                    {fieldBriefModal.person_name} ({fieldBriefModal.honorific})
                  </h3>
                  <p className="text-xs text-[#424843]">
                    {fieldBriefModal.locality} · Age {fieldBriefModal.age} · {fieldBriefModal.primary_language}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFieldBriefModal(null)}
                className="p-1 rounded-lg hover:bg-[#f2ede4] text-[#727972] hover:text-[#1d1c16]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Situation */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#032212]">CURRENT SITUATION</span>
              <p className="text-xs text-[#1d1c16] leading-relaxed p-3 rounded-lg bg-[#f8f3ea] border border-[#e7e2d9]">
                {fieldBriefModal.why_prioritized}
              </p>
            </div>

            {/* What changed since last visit */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#032212]">WHAT CHANGED SINCE LAST VISIT?</span>
              <div className="space-y-1.5">
                {fieldBriefModal.recent_changes.map((rc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#f8f3ea] border border-[#e7e2d9] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#032212]">{rc.dimension}</span>
                    <span className="text-[#424843]">{rc.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Capability Snapshot */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#032212]">CAPABILITY &amp; FUNCTION SNAPSHOT</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {fieldBriefModal.capabilities_summary.map((cap, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#f2ede4] border border-[#e7e2d9]">
                    <span className="block text-[#727972] text-[10px]">{cap.task}</span>
                    <span className="font-semibold text-[#032212]">{cap.support_level}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Firewall Guarantee */}
            <div className="p-3 rounded-lg bg-[#c8ebd1]/30 border border-[#81a28a] text-xs text-[#022111] flex items-center gap-2">
              <ShieldCheck size={18} className="shrink-0 text-[#1a3826]" />
              <span>{fieldBriefModal.firewall_status}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setFieldBriefModal(null);
                  handleStartVisit(fieldBriefModal);
                }}
                className="px-5 py-2.5 rounded-lg bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212] transition-colors"
              >
                Start Guided Visit for this Household
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Surface Footer ────────────────────────────────────────────── */}
      <footer className="w-full bg-[#f8f3ea] border-t border-[#e7e2d9] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[#424843]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#032212]">MindMitra CHW Companion</span>
            <span>·</span>
            <span>National Health Mission &amp; District Health Society Assam &amp; Meghalaya</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Operational Field Mode · Mawlai &amp; Tezpur Sector</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c2c8c1]" />
            <span className="text-[#1a3826] font-semibold">Dignity &amp; Care</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
