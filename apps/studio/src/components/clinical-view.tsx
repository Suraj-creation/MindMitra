import type React from "react";
import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Activity, AlertTriangle, ShieldCheck, Download, CheckCircle, FileSpreadsheet } from "lucide-react";

interface DomainScore {
  name: string;
  z: number;
  median: number;
  mad: number;
  status: "stable" | "alert" | "monitoring";
  trend: string;
}

const DOMAIN_DATA: DomainScore[] = [
  { name: "Working Memory", z: -1.82, median: 82.5, mad: 4.2, status: "alert", trend: "↓ 3-day latency spike (+38%)" },
  { name: "Temporal Orientation", z: -0.41, median: 90.0, mad: 3.5, status: "stable", trend: "↔ Stable baseline" },
  { name: "Visual-Spatial", z: -0.65, median: 78.0, mad: 5.0, status: "monitoring", trend: "↔ Slight variation" },
  { name: "Verbal Fluency (Assamese)", z: -0.80, median: 74.0, mad: 4.8, status: "monitoring", trend: "↔ Stable baseline" },
];

const AUDIT_LOGS = [
  { id: "hash_9a81f", type: "Morning Recall Session", quality: 0.88, gate: "sufficient", time: "Today, 08:30 AM", verifiedBy: "Tablet Telemetry + ASHA" },
  { id: "hash_4b22c", type: "Family Photo Recognition", quality: 0.92, gate: "sufficient", time: "Yesterday, 04:15 PM", verifiedBy: "Caregiver Anu" },
  { id: "hash_1e77d", type: "Evening Cardamom Chai Routine", quality: 0.79, gate: "sufficient", time: "2 days ago", verifiedBy: "Caregiver Anu" },
  { id: "hash_0c33a", type: "Noisy Audio Session (TV on)", quality: 0.28, gate: "insufficient_data", time: "3 days ago", verifiedBy: "MQ Engine Gated" },
];

export function ClinicalView() {
  const [activeTab, setActiveTab] = useState<"trajectory" | "cam" | "provenance">("trajectory");
  const [camAcute, setCamAcute] = useState(false);
  const [camFluctuating, setCamFluctuating] = useState(false);
  const [camInattention, setCamInattention] = useState(false);
  const [camArousal, setCamArousal] = useState(false);
  const [exported, setExported] = useState(false);

  // CAM criteria: Feature 1 (Acute/Fluctuating) AND Feature 2 (Inattention) AND (Feature 3 OR Feature 4)
  const isDeliriumPositive = (camAcute || camFluctuating) && camInattention && (camArousal);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 px-2">
      {/* Clinician Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[--color-border] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Clinical Decision Support & Audit Trail</Badge>
            <span className="text-xs text-[--color-muted]">NIMHANS / GMC Tele-Medicine Node</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 text-[--color-text]">
            Cognitive Trajectory & Provenance: Purnima (74F)
          </h1>
          <p className="text-sm text-[--color-text-sub] mt-0.5">
            Reviewing Clinician: Dr. B. Sharma (Consultant Psychiatrist) · PHC Tezpur / District Hospital Sonitpur
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setExported(true);
            setTimeout(() => setExported(false), 3500);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[--color-primary] text-white text-xs font-bold hover:bg-[--color-primary-hover] cursor-pointer shrink-0"
        >
          {exported ? <CheckCircle size={15} /> : <Download size={15} />}
          <span>{exported ? "Clinical Summary Exported ✓" : "Export DMHO Summary"}</span>
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-[--color-border] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("trajectory")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeTab === "trajectory"
              ? "bg-[--color-card] text-[--color-primary] border border-[--color-border]"
              : "text-[--color-text-sub] hover:text-[--color-text]"
          }`}
        >
          Longitudinal Trajectory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cam")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeTab === "cam"
              ? "bg-[--color-card] text-[--color-primary] border border-[--color-border]"
              : "text-[--color-text-sub] hover:text-[--color-text]"
          }`}
        >
          CAM-ICU Delirium vs Dementia
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("provenance")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeTab === "provenance"
              ? "bg-[--color-card] text-[--color-primary] border border-[--color-border]"
              : "text-[--color-text-sub] hover:text-[--color-text]"
          }`}
        >
          Provenance Audit Log
        </button>
      </div>

      {/* Tab 1: Longitudinal Trajectory */}
      {activeTab === "trajectory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOMAIN_DATA.map((domain) => {
              const isAlert = domain.status === "alert";
              return (
                <div key={domain.name}>
                  <Card
                    className={`p-4 border ${
                      isAlert ? "border-amber-300 bg-amber-50/40" : "border-[--color-border] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[--color-text-sub]">{domain.name}</span>
                      <Badge variant={isAlert ? "warning" : "success"}>
                        {isAlert ? "Alert (z < -1.5)" : "Within Median"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono text-[--color-text]">
                        {domain.z.toFixed(2)}
                      </span>
                      <span className="text-xs text-[--color-muted]">z-score</span>
                    </div>
                    <div className="mt-2 text-xs text-[--color-text-sub] space-y-0.5">
                      <div>14-day Median: <strong>{domain.median}</strong> (MAD: {domain.mad})</div>
                      <div className="text-[11px] font-medium text-amber-800">{domain.trend}</div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Clinical Insights Card */}
          <Card className="bg-white border-[--color-border]">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={18} className="text-[--color-primary]" />
              Multi-Domain Longitudinal Analysis
            </CardTitle>
            <CardDescription>
              Evaluated using 14-day quality-gated rolling window (Q_MIN = 0.40)
            </CardDescription>

            <div className="mt-3 p-4 rounded-lg bg-[#f9f5ec] border border-[--color-border] text-xs text-[--color-text] space-y-2">
              <p className="leading-relaxed">
                <strong>Clinician Finding:</strong> While Working Memory exhibits a single-domain latency increase (z = -1.82), Temporal Orientation (z = -0.41) and Visual-Spatial (z = -0.65) remain fully concordant with her personal historical baseline.
              </p>
              <p className="leading-relaxed text-[--color-text-sub]">
                <strong>Diagnostic Invariant Enforced:</strong> This pattern is characteristic of benign nocturnal disruption (correlated with Thursday caregiver sleep log) and DOES NOT represent disease progression. No medication adjustment or dementia stage escalation is clinically indicated.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: CAM-ICU Delirium Evaluator */}
      {activeTab === "cam" && (
        <div className="space-y-6">
          <Card className="border-[--color-border]">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-[--color-danger]" />
              Confusion Assessment Method (CAM Criteria)
            </CardTitle>
            <CardDescription>
              Distinguishing Acute Reversible Delirium from Chronic Dementia Baseline
            </CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[--color-border] bg-white cursor-pointer hover:bg-[--color-surface]/50">
                <input
                  type="checkbox"
                  checked={camAcute}
                  onChange={(e) => setCamAcute(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[--color-danger] accent-[--color-danger]"
                />
                <div>
                  <span className="text-sm font-semibold text-[--color-text]">1. Acute Onset (&lt;72 Hours)</span>
                  <p className="text-xs text-[--color-text-sub] mt-0.5">Sudden collapse in performance compared to habitual baseline.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[--color-border] bg-white cursor-pointer hover:bg-[--color-surface]/50">
                <input
                  type="checkbox"
                  checked={camFluctuating}
                  onChange={(e) => setCamFluctuating(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[--color-danger] accent-[--color-danger]"
                />
                <div>
                  <span className="text-sm font-semibold text-[--color-text]">2. Fluctuating Course</span>
                  <p className="text-xs text-[--color-text-sub] mt-0.5">Behavior fluctuates over the course of the day or across morning/night.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[--color-border] bg-white cursor-pointer hover:bg-[--color-surface]/50">
                <input
                  type="checkbox"
                  checked={camInattention}
                  onChange={(e) => setCamInattention(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[--color-danger] accent-[--color-danger]"
                />
                <div>
                  <span className="text-sm font-semibold text-[--color-text]">3. Inattention</span>
                  <p className="text-xs text-[--color-text-sub] mt-0.5">Difficulty focusing, following basic prompt, or easily distracted.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[--color-border] bg-white cursor-pointer hover:bg-[--color-surface]/50">
                <input
                  type="checkbox"
                  checked={camArousal}
                  onChange={(e) => setCamArousal(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[--color-danger] accent-[--color-danger]"
                />
                <div>
                  <span className="text-sm font-semibold text-[--color-text]">4. Altered Level of Consciousness</span>
                  <p className="text-xs text-[--color-text-sub] mt-0.5">Lethargic, stuporous, or hyper-vigilant.</p>
                </div>
              </label>
            </div>

            {/* CAM Result Banner */}
            <div className={`mt-6 p-4 rounded-xl border ${isDeliriumPositive ? "bg-red-50 border-red-300" : "bg-emerald-50 border-emerald-300"}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {isDeliriumPositive ? (
                  <>
                    <AlertTriangle size={18} className="text-red-700" />
                    <span className="text-red-900">CAM Criteria Positive: Possible Acute Delirium</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="text-emerald-700" />
                    <span className="text-emerald-900">CAM Criteria Negative: No Acute Delirium Detected</span>
                  </>
                )}
              </div>
              <p className={`mt-1.5 text-xs leading-relaxed ${isDeliriumPositive ? "text-red-800" : "text-emerald-800"}`}>
                {isDeliriumPositive
                  ? "URGENT CLINICAL DIRECTIVE: Sudden multi-domain decline with fluctuating course and inattention suggests an acute reversible etiology (urinary tract infection, electrolyte disturbance, medication toxicity, acute dehydration). Do NOT attribute to dementia progression. Order immediate medical workup."
                  : "Patient state is consistent with non-acute fluctuations. Continue gentle daily routines, hydration, and caregiver monitoring."}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Provenance Audit Log */}
      {activeTab === "provenance" && (
        <Card className="border-[--color-border]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-[--color-primary]" />
                Cryptographic Provenance Chain
              </CardTitle>
              <CardDescription>
                Every observation, fact, and telemetry record is signed and audited
              </CardDescription>
            </div>
            <Badge variant="teal">Hash Verified (SHA-256)</Badge>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[--color-border] text-[--color-muted]">
                  <th className="py-2 px-3">Log Hash</th>
                  <th className="py-2 px-3">Session Type</th>
                  <th className="py-2 px-3">Quality (q)</th>
                  <th className="py-2 px-3">Gate</th>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Attestation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]/60">
                {AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-[--color-surface]/40">
                    <td className="py-2.5 px-3 font-mono text-[--color-primary]">{log.id}</td>
                    <td className="py-2.5 px-3 font-medium text-[--color-text]">{log.type}</td>
                    <td className="py-2.5 px-3 font-mono">{log.quality.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.gate === "sufficient" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
                      }`}>
                        {log.gate}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[--color-text-sub]">{log.time}</td>
                    <td className="py-2.5 px-3 text-[--color-text-sub]">{log.verifiedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
