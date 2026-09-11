import React, { useState } from "react";
import { TrendingDown, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, SearchCheck, Info, CloudRain, Clock } from "lucide-react";
import { api } from "../../lib/api";

interface ChangesInsightsTabProps {
  onOpenEvidence: () => void;
}

export const ChangesInsightsTab: React.FC<ChangesInsightsTabProps> = ({ onOpenEvidence }) => {
  const [testingDecline, setTestingDecline] = useState(false);
  const [selectedDays, setSelectedDays] = useState(3);
  const [declineCard, setDeclineCard] = useState<any>(null);

  const handleTestDecline = async (days: number) => {
    setSelectedDays(days);
    setTestingDecline(true);
    try {
      const res = await api.injectDecline(days);
      setDeclineCard(res.card);
    } finally {
      setTestingDecline(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <TrendingDown size={14} /> 14-Day Baseline Comparison
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#032212]">
              Changes & Behavioral Insights
            </h1>
            <p className="text-xs sm:text-sm text-[#424843] mt-1 max-w-2xl leading-relaxed">
              MindMitra measures change exclusively against Aitâ’s personal 14-day median. Fluctuations are framed through practical domestic context (weather, sleep, travel), never alarming diagnoses.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Layer Decline Contract Card */}
      <div className="bg-[#ffffff] border-2 border-[#1a3826] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c2c8c1]/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold">
              L2
            </div>
            <div>
              <div className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Three-Layer Attention Contract Active
              </div>
              <h2 className="text-lg font-bold font-serif text-[#032212]">
                Slight Shift in Evening Relaxation (3-Day Pattern)
              </h2>
            </div>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea] text-xs font-semibold text-[#032212] hover:bg-[#f2ede4] transition-colors"
          >
            <SearchCheck size={14} className="text-[#904d00]" />
            <span>Audit Evidence Sources</span>
          </button>
        </div>

        {/* 3 Strict Layers */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Layer 1: Objective Observation */}
          <div className="p-4 bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#032212] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1a3826] text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Objective Observation</span>
            </div>
            <p className="text-xs text-[#1d1c16] leading-relaxed">
              Tablet interaction latency rose by 0.3s (4.1s vs 3.8s median) and 2 nocturnal awakenings were logged between 1:30 AM and 4:15 AM over the last 72 hours.
            </p>
          </div>

          {/* Layer 2: Non-Diagnostic Hypothesis */}
          <div className="p-4 bg-[#f2ede4] border border-[#c2c8c1] rounded-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1a3826] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1a3826] text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Practical Context</span>
            </div>
            <p className="text-xs text-[#1d1c16] leading-relaxed">
              Heavy continuous monsoon drizzle in Tezpur prevented customary courtyard strolls, compounded by primary caregiver Anu's recent 48-hour travel to Guwahati.
            </p>
          </div>

          {/* Layer 3: Suggested Gentle Action */}
          <div className="p-4 bg-[#c8ebd1]/30 border border-[#adcfb5] rounded-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#022111] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1a3826] text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Gentle Intervention</span>
            </div>
            <p className="text-xs text-[#1d1c16] leading-relaxed">
              Serve warm cardamom ginger tea on the veranda at 4:00 PM with familiar Bihu melodies, and facilitate a video call with granddaughter Rina before dusk.
            </p>
          </div>
        </div>

        {/* Anti-Alarm Notice */}
        <div className="p-3.5 bg-[#f8f3ea] border border-[#ffdcc3] rounded-2xl flex items-start gap-3 text-xs text-[#1d1c16]">
          <Info size={18} className="text-[#904d00] shrink-0 mt-0.5" />
          <p>
            <strong>What This Does NOT Mean:</strong> This is a situational adjustment to weather confinement and domestic routine changes. It is <em>not</em> an indication of sudden neurological decline or medical illness.
          </p>
        </div>
      </div>

      {/* Escalation Level Matrix (L0 to L5) Education */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#c2c8c1]/40 pb-3">
          <h2 className="text-lg font-bold font-serif text-[#032212]">
            MindMitra Sparse Alert Scaffolding Ladder (L0 to L5)
          </h2>
          <p className="text-xs text-[#424843]">
            Our escalation model reflects alert urgency for family caregivers, <strong>never a dementia clinical stage</strong>.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl border border-[#c2c8c1] bg-[#ffffff] space-y-1">
            <div className="font-bold text-[#1a3826]">L0 · Pure Quietude</div>
            <p className="text-[#424843]">No deviation from baseline. App operates in complete ambient calm.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-[#c2c8c1] bg-[#ffffff] space-y-1">
            <div className="font-bold text-[#1a3826]">L1 · Silent Pattern Note</div>
            <p className="text-[#424843]">Minor 1-day variance logged for correlation. No alert sent to caregiver.</p>
          </div>
          <div className="p-3.5 rounded-2xl border-2 border-[#904d00] bg-[#f8f3ea] space-y-1">
            <div className="font-bold text-[#904d00]">L2 · Gentle Observation (Current)</div>
            <p className="text-[#424843]">3-day steady variation. Suggests warm domestic comforting step.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-[#c2c8c1] bg-[#ffffff] space-y-1">
            <div className="font-bold text-[#032212]">L3 · Family Check-in</div>
            <p className="text-[#424843]">4-day pattern. Prompts daughter Anu to review sleep and daily hydration.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-[#c2c8c1] bg-[#ffffff] space-y-1">
            <div className="font-bold text-[#032212]">L4 · Health Worker Sync</div>
            <p className="text-[#424843]">5-day sustained deviation. Flags routine note for CHW Rumi Saikia's Thursday visit.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-[#ba1a1a] bg-[#ffdad6]/30 space-y-1">
            <div className="font-bold text-[#ba1a1a]">L5 · Clinician Consultation Prep</div>
            <p className="text-[#424843]">Prepares consolidated brief for Dr. Barua’s next scheduled appointment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
