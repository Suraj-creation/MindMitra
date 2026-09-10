import React, { useState } from "react";
import {
  Stethoscope,
  TrendingUp,
  Activity,
  FileCheck2,
  Calendar,
  ShieldAlert,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

interface EvidenceItem {
  id: string;
  date: string;
  domain: string;
  score: number;
  qualityQ: number;
  source: string;
  notes: string;
}

const EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: "ev_01",
    date: "Sep 7, 2026",
    domain: "Orientation",
    score: 82,
    qualityQ: 0.94,
    source: "CHW Meena Field Visit",
    notes: "Accurate recognition of day, season, and village ward.",
  },
  {
    id: "ev_02",
    date: "Sep 5, 2026",
    domain: "Recall",
    score: 68,
    qualityQ: 0.88,
    source: "Tablet Memory Exercise",
    notes: "2 of 3 words remembered after 2 minutes delay.",
  },
  {
    id: "ev_03",
    date: "Aug 28, 2026",
    domain: "Attention",
    score: 75,
    qualityQ: 0.91,
    source: "Conversation Latency Sensor",
    notes: "Calm turn-taking rhythm, response latency ~3.4s.",
  },
  {
    id: "ev_04",
    date: "Aug 15, 2026",
    domain: "Language",
    score: 85,
    qualityQ: 0.95,
    source: "Folk Song Reminiscence",
    notes: "Spontaneous recitation of traditional Bihu couplets.",
  },
];

export const ClinicalBridge: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"14d" | "90d" | "180d">("90d");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const handleSaveNote = () => {
    if (!doctorNotes.trim()) return;
    setSavedNotes((prev) => [doctorNotes.trim(), ...prev]);
    setDoctorNotes("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6ddcf]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#332f29] bg-[#e7e5e4] px-2.5 py-1 rounded-md">
              Clinical Bridge · Surface C4
            </span>
            <span className="text-xs text-[#7a7a71]">GMC Neurology Department</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
            Clinician Evidence Dashboard
          </h1>
          <p className="text-sm text-[#6b6b63] mt-1 max-w-2xl">
            Governing principle: AI detects, retrieves, and structures longitudinal evidence with provenance. Licensed clinicians diagnose, prescribe, and decide.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-[#f7eadc] border border-[#e6ddcf] p-1.5 rounded-xl text-xs">
          {(["14d", "90d", "180d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeRange === r
                  ? "bg-[#332f29] text-white"
                  : "text-[#6b6b63] hover:text-[#332f29]"
              }`}
            >
              {r === "14d" ? "14 Days" : r === "90d" ? "90 Days" : "6 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Invariant Warning Card: Refuse to Diagnose */}
      <div className="p-4 bg-[#fbf1e3] border-l-4 border-[#5e6f4a] border-y border-r border-[#e6ddcf] rounded-xl flex items-start gap-3">
        <ShieldAlert size={22} className="text-[#5e6f4a] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#332f29] uppercase tracking-wider">
            Invariant 2: Inherent Algorithmic Non-Diagnostic Boundary
          </p>
          <p className="text-xs text-[#6b6b63] mt-0.5 leading-relaxed">
            The platform provides verifiable sensor metrics, MMSE/MoCA proxies, and provenance-stamped observation logs. It does not output diagnostic labels, dementia staging, or automated pharmaceutical changes.
          </p>
        </div>
      </div>

      {/* Trajectory & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Metric Cards */}
        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-4 rounded-2xl">
          <p className="text-xs text-[#7a7a71]">Orientation Index</p>
          <p className="text-2xl font-bold font-mono text-[#332f29] mt-1">82%</p>
          <p className="text-[11px] text-[#6b8f6b] mt-1">Within baseline band (±4%)</p>
        </div>

        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-4 rounded-2xl">
          <p className="text-xs text-[#7a7a71]">Recall & Retention</p>
          <p className="text-2xl font-bold font-mono text-[#332f29] mt-1">68%</p>
          <p className="text-[11px] text-[#d97706] mt-1">Mild variance (-8% 14d)</p>
        </div>

        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-4 rounded-2xl">
          <p className="text-xs text-[#7a7a71]">Attention / Latency</p>
          <p className="text-2xl font-bold font-mono text-[#332f29] mt-1">75%</p>
          <p className="text-[11px] text-[#6b8f6b] mt-1">Stable interaction pacing</p>
        </div>

        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-4 rounded-2xl">
          <p className="text-xs text-[#7a7a71]">Sensor Quality Weight (q)</p>
          <p className="text-2xl font-bold font-mono text-[#2596a3] mt-1">0.93</p>
          <p className="text-[11px] text-[#1e7a88] mt-1">High confidence telemetry</p>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6ddcf]">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#332f29]">
              Longitudinal Evidence Blocks
            </h2>
            <p className="text-xs text-[#6b6b63]">
              Every point preserves source provenance and sensor quality weight q
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert("Exporting verifiable FHIR clinical summary for GMC Hospital…")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e6ddcf] text-xs font-semibold text-[#332f29] hover:bg-[#fbf1e3] transition-colors"
          >
            <Download size={14} />
            <span>Export Clinical Summary</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e6ddcf] text-[#7a7a71]">
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Cognitive Domain</th>
                <th className="py-2.5 px-3 font-semibold">Observed Score</th>
                <th className="py-2.5 px-3 font-semibold">Quality (q)</th>
                <th className="py-2.5 px-3 font-semibold">Provenance Source</th>
                <th className="py-2.5 px-3 font-semibold">Clinical Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ddcf]">
              {EVIDENCE_DATA.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#fbf1e3]/60 transition-colors">
                  <td className="py-3 px-3 font-medium text-[#332f29]">{ev.date}</td>
                  <td className="py-3 px-3 font-semibold text-[#5e6f4a]">{ev.domain}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#332f29]">{ev.score}%</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[#2596a3] font-semibold">
                      {ev.qualityQ.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#6b6b63]">{ev.source}</td>
                  <td className="py-3 px-3 text-[#332f29] max-w-xs">{ev.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Neurologist Clinical Consultation Note Pad */}
      <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold font-serif text-[#332f29]">
          Doctor’s Consultation & Decision Log
        </h2>
        <p className="text-xs text-[#6b6b63]">
          Recorded directly by Dr. Barman into the patient's verified health ledger.
        </p>

        <div className="space-y-3">
          <textarea
            rows={3}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Record clinical impressions, rule out reversible causes, or order follow-up labs…"
            className="w-full rounded-xl border border-[#e6ddcf] bg-[#fffaf1] p-3.5 text-sm text-[#332f29] focus:ring-2 focus:ring-[#332f29] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={!doctorNotes.trim()}
            className="px-4 py-2 bg-[#332f29] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            Append Verified Clinical Assessment
          </button>
        </div>

        {savedNotes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e6ddcf] space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a7a71]">Recent Entries</p>
            {savedNotes.map((note, idx) => (
              <div key={idx} className="p-3 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl text-xs text-[#332f29]">
                <p className="font-semibold">Dr. Barman · Just now</p>
                <p className="mt-1">{note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
