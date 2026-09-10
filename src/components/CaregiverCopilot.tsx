import React, { useState } from "react";
import {
  Bell,
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  Lock,
  Unlock,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
} from "lucide-react";
import { api } from "../lib/api";
import type { InjectDeclineResponse } from "../types";

export const CaregiverCopilot: React.FC = () => {
  const [attentionUsed, setAttentionUsed] = useState(1);
  const [declineDays, setDeclineDays] = useState(3);
  const [declineResult, setDeclineResult] = useState<InjectDeclineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    "anu_family": true,
    "meena_health": true,
    "dr_barman_clinical": true,
    "research_external": false,
  });

  const runDeclineInjection = async () => {
    setLoading(true);
    try {
      const res = await api.injectDecline(declineDays);
      setDeclineResult(res);
      setAttentionUsed((prev) => Math.min(2, prev + 1));
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = (key: string) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6ddcf]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a85e46] bg-[#ffdba8]/40 px-2.5 py-1 rounded-md">
              Caregiver Copilot · Surface C2
            </span>
            <span className="text-xs text-[#7a7a71]">Caring for Purnima Devi</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
            Anu’s Care Dashboard
          </h1>
          <p className="text-sm text-[#6b6b63] mt-1 max-w-xl">
            Gentle oversight without alarm fatigue. AI detects and retrieves; family retains agency; clinicians diagnose.
          </p>
        </div>

        {/* Attention Budget Gauge */}
        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-4 rounded-2xl sm:text-right">
          <div className="flex items-center sm:justify-end gap-2 text-sm font-semibold text-[#332f29]">
            <Bell size={18} className="text-[#a85e46]" />
            <span>Attention Budget</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#a85e46] mt-1">
            {attentionUsed} <span className="text-sm text-[#7a7a71]">/ 2 allowed today</span>
          </p>
          <p className="text-xs text-[#7a7a71] mt-0.5">
            Strict cap prevents notification burnout
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3-Layer Decline Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Status Banner */}
          <div className="bg-[#f7eadc] border border-[#e6ddcf] p-5 rounded-2xl">
            <h2 className="text-lg font-bold font-serif text-[#332f29] flex items-center gap-2">
              <CheckCircle size={20} className="text-[#6b8f6b]" />
              Today’s Morning Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf]">
                <p className="text-xs text-[#7a7a71]">Sleep Continuity</p>
                <p className="text-lg font-bold text-[#332f29] mt-1">7h 15m</p>
                <p className="text-[11px] text-[#6b8f6b] mt-0.5">Calm night</p>
              </div>
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf]">
                <p className="text-xs text-[#7a7a71]">Tea & Morning Stroll</p>
                <p className="text-lg font-bold text-[#332f29] mt-1">Completed</p>
                <p className="text-[11px] text-[#6b8f6b] mt-0.5">8:15 AM on verandah</p>
              </div>
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf]">
                <p className="text-xs text-[#7a7a71]">Next Milestone</p>
                <p className="text-lg font-bold text-[#332f29] mt-1">CHW Visit</p>
                <p className="text-[11px] text-[#1e7a88] mt-0.5">Meena at 4:30 PM</p>
              </div>
            </div>
          </div>

          {/* Decline Card Generator / 3-Layer Contract */}
          <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-serif text-[#332f29] flex items-center gap-2">
                  <TrendingDown size={20} className="text-[#d97706]" />
                  Three-Layer Decline Card
                </h2>
                <p className="text-xs text-[#6b6b63] mt-0.5">
                  Invariant 3: Clear separation of Observation, Hypothesis, and Action
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a7a71]">Simulate window:</span>
                <select
                  value={declineDays}
                  onChange={(e) => setDeclineDays(Number(e.target.value))}
                  className="text-xs bg-[#fbf1e3] border border-[#e6ddcf] rounded-lg px-2 py-1 text-[#332f29]"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                </select>
                <button
                  type="button"
                  onClick={runDeclineInjection}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-[#a85e46] text-white text-xs font-semibold hover:bg-[#8f4f3a] transition-colors"
                >
                  {loading ? "Checking…" : "Run Analysis"}
                </button>
              </div>
            </div>

            {/* Generated Card Display */}
            {declineResult ? (
              <div className="p-5 bg-[#fbf1e3] border-2 border-[#d97706] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#ffdba8] text-[#9a3c04]">
                    {declineResult.alert.level}
                  </span>
                  <span className="text-xs text-[#7a7a71]">{declineResult.card.timestamp}</span>
                </div>

                <div className="space-y-3">
                  {/* Layer 1: Observation */}
                  <div className="p-3 bg-white/70 rounded-lg border border-[#e6ddcf]">
                    <p className="text-xs font-bold text-[#a85e46] uppercase tracking-wider">
                      Layer 1 · Objective Observation
                    </p>
                    <p className="text-sm text-[#332f29] font-medium mt-1">
                      {declineResult.card.observation}
                    </p>
                  </div>

                  {/* Layer 2: Hypothesis */}
                  <div className="p-3 bg-white/70 rounded-lg border border-[#e6ddcf]">
                    <p className="text-xs font-bold text-[#d97706] uppercase tracking-wider">
                      Layer 2 · Hypothesis (Non-diagnostic)
                    </p>
                    <p className="text-sm text-[#332f29] mt-1">
                      {declineResult.card.hypothesis}
                    </p>
                  </div>

                  {/* Layer 3: Action */}
                  <div className="p-3 bg-[#e5ece0] rounded-lg border border-[#ccd9c2]">
                    <p className="text-xs font-bold text-[#5e6f4a] uppercase tracking-wider">
                      Layer 3 · Suggested Gentle Action
                    </p>
                    <p className="text-sm text-[#38452d] font-medium mt-1">
                      {declineResult.card.action}
                    </p>
                  </div>
                </div>

                {/* Provenance Facts */}
                <div className="pt-3 border-t border-[#e6ddcf] text-xs text-[#6b6b63] space-y-1">
                  <p className="font-semibold text-[#332f29]">Underlying Provenance Facts:</p>
                  {declineResult.card.facts.map((f) => (
                    <p key={f.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                      <span>{f.text} ({f.date})</span>
                    </p>
                  ))}
                </div>

                <div className="p-2.5 bg-[#f7eadc] rounded-lg text-[11px] text-[#7a7a71] flex items-start gap-1.5">
                  <Info size={14} className="shrink-0 mt-0.5 text-[#a85e46]" />
                  <span>
                    Mandatory clinical safety guarantee: MindMitra does not diagnose dementia progression or alter medications.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#fbf1e3] border border-dashed border-[#e6ddcf] rounded-xl text-center text-[#7a7a71]">
                <FileText size={32} className="mx-auto text-[#d6d3d1] mb-2" />
                <p className="text-sm font-medium">No active decline alerts</p>
                <p className="text-xs mt-0.5">Click 'Run Analysis' to simulate a 3-day or 7-day variance check.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Memory Firewall & Consent Engine */}
        <div className="space-y-6">
          <div className="bg-[#f7eadc] border border-[#e6ddcf] p-5 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold font-serif text-[#332f29] flex items-center gap-2">
              <Shield size={20} className="text-[#5e6f4a]" />
              Memory Firewall Grants
            </h2>
            <p className="text-xs text-[#6b6b63]">
              Deterministic access control governing Purnima’s personal memory vault and health facts.
            </p>

            <div className="space-y-3">
              {/* Anu Family */}
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#332f29]">Anu (Primary Caregiver)</p>
                  <p className="text-xs text-[#7a7a71]">Family stories & daily routines</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConsent("anu_family")}
                  className={`p-2 rounded-lg border transition-colors ${
                    consents.anu_family
                      ? "bg-[#6b8f6b] text-white border-[#6b8f6b]"
                      : "bg-white text-[#7a7a71] border-[#e6ddcf]"
                  }`}
                >
                  {consents.anu_family ? <Unlock size={16} /> : <Lock size={16} />}
                </button>
              </div>

              {/* Meena CHW */}
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#332f29]">Meena (ASHA Worker)</p>
                  <p className="text-xs text-[#7a7a71]">Screening & adherence facts</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConsent("meena_health")}
                  className={`p-2 rounded-lg border transition-colors ${
                    consents.meena_health
                      ? "bg-[#6b8f6b] text-white border-[#6b8f6b]"
                      : "bg-white text-[#7a7a71] border-[#e6ddcf]"
                  }`}
                >
                  {consents.meena_health ? <Unlock size={16} /> : <Lock size={16} />}
                </button>
              </div>

              {/* Dr Barman */}
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#332f29]">Dr. Barman (Neurologist)</p>
                  <p className="text-xs text-[#7a7a71]">Clinical evidence & trajectories</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConsent("dr_barman_clinical")}
                  className={`p-2 rounded-lg border transition-colors ${
                    consents.dr_barman_clinical
                      ? "bg-[#6b8f6b] text-white border-[#6b8f6b]"
                      : "bg-white text-[#7a7a71] border-[#e6ddcf]"
                  }`}
                >
                  {consents.dr_barman_clinical ? <Unlock size={16} /> : <Lock size={16} />}
                </button>
              </div>

              {/* Research External */}
              <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#332f29]">Secondary Research</p>
                  <p className="text-xs text-[#dc2626] font-medium">De-identification required</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConsent("research_external")}
                  className={`p-2 rounded-lg border transition-colors ${
                    consents.research_external
                      ? "bg-[#dc2626] text-white border-[#dc2626]"
                      : "bg-white text-[#7a7a71] border-[#e6ddcf]"
                  }`}
                >
                  {consents.research_external ? <Unlock size={16} /> : <Lock size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
