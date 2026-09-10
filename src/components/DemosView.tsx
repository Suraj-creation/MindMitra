import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Lock,
  Unlock,
  AlertOctagon,
  TrendingDown,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  PhoneCall,
  Flame,
} from "lucide-react";
import { api } from "../lib/api";
import type { SafetyCheckResponse, ObservationSignals, ObservationResponse, PwmReadResponse } from "../types";

export const DemosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"safety" | "mq" | "firewall" | "delirium">("safety");

  // Safety Lab State
  const [safetyInput, setSafetyInput] = useState(
    "Purnima's daughter Rina lives in Guwahati and calls every Sunday afternoon."
  );
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResponse | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  // MQ Gate State
  const [signals, setSignals] = useState<ObservationSignals>({
    audibility: 0.85,
    snr: 0.8,
    camera_lighting: 0.75,
    touch_jitter: 0.15,
    battery_low: false,
    network_rtt_ms: 120,
    language_detected: "Assamese (Kamrupi)",
  });
  const [mqResult, setMqResult] = useState<ObservationResponse | null>(null);

  // Memory Firewall State
  const [firewallActor, setFirewallActor] = useState("actor:anu");
  const [firewallFact, setFirewallFact] = useState("f_rina");
  const [firewallPurpose, setFirewallPurpose] = useState("personalisation");
  const [firewallResult, setFirewallResult] = useState<PwmReadResponse | null>(null);

  // Delirium State
  const [deliriumTriggered, setDeliriumTriggered] = useState(false);

  // Run initial safety test
  useEffect(() => {
    void handleRunSafety(safetyInput);
    void handleRunMq(signals);
  }, []);

  const handleRunSafety = async (text: string) => {
    setSafetyLoading(true);
    try {
      const res = await api.checkSafety(text);
      setSafetyResult(res);
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleRunMq = async (newSignals: ObservationSignals) => {
    const res = await api.submitObservation("person:purnima", "orientation", 75, newSignals);
    setMqResult(res);
  };

  const handleRunFirewall = async () => {
    const res = await api.readPwmFact(firewallActor, "person:purnima", firewallFact, firewallPurpose);
    setFirewallResult(res);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#e6ddcf]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d97706] bg-[#ffdba8]/50 px-2.5 py-1 rounded-md">
            Architectural Verification Labs
          </span>
          <span className="text-xs text-[#7a7a71]">SIH 2026 PS26003 Invariants</span>
        </div>
        <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
          Interactive Invariant Labs
        </h1>
        <p className="text-sm text-[#6b6b63] mt-1 max-w-2xl">
          Test and verify the 5 core mathematical and clinical invariants defined in the MindMitra specification.
        </p>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "safety"
                ? "bg-[#5e6f4a] text-white shadow-xs"
                : "bg-[#f7eadc] text-[#6b6b63] hover:text-[#332f29]"
            }`}
          >
            <ShieldCheck size={16} />
            <span>1. Safety Gateway (10 Checks)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mq")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "mq"
                ? "bg-[#2596a3] text-white shadow-xs"
                : "bg-[#f7eadc] text-[#6b6b63] hover:text-[#332f29]"
            }`}
          >
            <Activity size={16} />
            <span>2. Measurement Quality (MQ Gate)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("firewall")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "firewall"
                ? "bg-[#a85e46] text-white shadow-xs"
                : "bg-[#f7eadc] text-[#6b6b63] hover:text-[#332f29]"
            }`}
          >
            <Lock size={16} />
            <span>3. Memory Firewall & Consent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delirium")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "delirium"
                ? "bg-[#dc2626] text-white shadow-xs"
                : "bg-[#f7eadc] text-[#6b6b63] hover:text-[#332f29]"
            }`}
          >
            <AlertOctagon size={16} />
            <span>4. Acute L5 Delirium Rule</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Safety Gateway */}
      {activeTab === "safety" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold font-serif text-[#332f29] flex items-center gap-2">
              <ShieldCheck size={22} className="text-[#5e6f4a]" />
              Deterministic 10-Check Safety Waterfall
            </h2>
            <p className="text-xs text-[#6b6b63]">
              Every generated utterance must pass a strict linear waterfall. If any check fails, execution immediately halts and fallbacks engage.
            </p>

            {/* Presets */}
            <div>
              <p className="text-xs font-semibold text-[#7a7a71] mb-2">Try Verification Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = "Purnima's daughter Rina lives in Guwahati and calls every Sunday afternoon.";
                    setSafetyInput(text);
                    void handleRunSafety(text);
                  }}
                  className="px-3 py-1.5 bg-[#fbf1e3] border border-[#e6ddcf] hover:border-[#5e6f4a] rounded-lg text-xs text-[#332f29] font-medium"
                >
                  ✓ Safe Reminiscence Memory
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = "You have dementia stage 3 and your brain is progressing worse.";
                    setSafetyInput(text);
                    void handleRunSafety(text);
                  }}
                  className="px-3 py-1.5 bg-[#fbf1e3] border border-[#e6ddcf] hover:border-[#dc2626] rounded-lg text-xs text-[#dc2626] font-medium"
                >
                  ✕ Diagnostic / Staging Violation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = "You should take 10mg donepezil daily to fix your memory.";
                    setSafetyInput(text);
                    void handleRunSafety(text);
                  }}
                  className="px-3 py-1.5 bg-[#fbf1e3] border border-[#e6ddcf] hover:border-[#d97706] rounded-lg text-xs text-[#d97706] font-medium"
                >
                  ✕ Medication Dosage Violation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = "I feel so hopeless, I just want to die.";
                    setSafetyInput(text);
                    void handleRunSafety(text);
                  }}
                  className="px-3 py-1.5 bg-[#ffefd4] border border-[#ffdba8] hover:border-[#9a3c04] rounded-lg text-xs text-[#9a3c04] font-medium"
                >
                  ⚠ Crisis Signal (Tele-MANAS)
                </button>
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2 pt-2">
              <label htmlFor="safety-input-field" className="text-xs font-bold text-[#6b6b63]">
                Candidate Utterance under Inspection:
              </label>
              <textarea
                id="safety-input-field"
                rows={3}
                value={safetyInput}
                onChange={(e) => setSafetyInput(e.target.value)}
                className="w-full rounded-xl border border-[#e6ddcf] bg-[#fffaf1] p-3 text-sm text-[#332f29] focus:ring-2 focus:ring-[#5e6f4a] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleRunSafety(safetyInput)}
                disabled={safetyLoading}
                className="px-4 py-2 bg-[#5e6f4a] text-white text-xs font-semibold rounded-lg hover:bg-[#48583a] transition-colors"
              >
                {safetyLoading ? "Checking Rules…" : "Run 10-Check Waterfall"}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-[#332f29]">
              Inspection Verdict
            </h3>

            {safetyResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    safetyResult.passed
                      ? "bg-[#e5ece0] border-[#ccd9c2] text-[#38452d]"
                      : safetyResult.blocked_by === "crisis"
                      ? "bg-[#ffefd4] border-[#ffdba8] text-[#7d330a]"
                      : "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]"
                  }`}
                >
                  {safetyResult.passed ? (
                    <CheckCircle2 size={24} className="text-[#6b8f6b] shrink-0" />
                  ) : safetyResult.blocked_by === "crisis" ? (
                    <PhoneCall size={24} className="text-[#ea580c] shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-[#dc2626] shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {safetyResult.passed
                        ? "ALL 10 CHECKS PASSED"
                        : safetyResult.blocked_by === "crisis"
                        ? "CRISIS DETECTED · TELE-MANAS"
                        : `BLOCKED BY RULE: ${safetyResult.blocked_by?.toUpperCase()}`}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed">
                      {safetyResult.explanation}
                    </p>
                    {safetyResult.crisis_number && (
                      <p className="text-xs font-mono font-bold mt-2 bg-white/70 px-2 py-1 rounded inline-block">
                        Helpline: {safetyResult.crisis_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Checklist Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-[#7a7a71] mb-1">Check Waterfall Status:</p>
                  {safetyResult.check_results.map((c) => (
                    <div
                      key={c.check}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fbf1e3] border border-[#e6ddcf]"
                    >
                      <span className="capitalize font-mono text-[#332f29]">{c.check}</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          c.passed
                            ? "text-[#6b8f6b] bg-[#e5ece0]"
                            : "text-[#dc2626] bg-[#fee2e2]"
                        }`}
                      >
                        {c.passed ? "PASS" : "BLOCK"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Measurement Quality Gate */}
      {activeTab === "mq" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#332f29] flex items-center gap-2">
                <Activity size={22} className="text-[#2596a3]" />
                Measurement Quality (MQ) Gate
              </h2>
              <p className="text-xs text-[#6b6b63] mt-1">
                Invariant 4: Bad data cannot raise an alarm. If sensor audibility or environmental signals are corrupted, the system refuses to score rather than generating false decline alerts.
              </p>
            </div>

            <div className="space-y-4">
              {/* Audibility Slider */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#332f29]">Acoustic Audibility (Speech Volume)</span>
                  <span className="font-mono text-[#2596a3]">
                    {(signals.audibility * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={signals.audibility}
                  onChange={(e) => {
                    const next = { ...signals, audibility: Number(e.target.value) };
                    setSignals(next);
                    void handleRunMq(next);
                  }}
                  className="w-full accent-[#2596a3]"
                />
                <p className="text-[11px] text-[#7a7a71]">
                  Threshold: Must be &gt;= 20% to avoid mistaking ambient village noise for speech pauses.
                </p>
              </div>

              {/* SNR Slider */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#332f29]">Signal-to-Noise Ratio (SNR)</span>
                  <span className="font-mono text-[#2596a3]">
                    {(signals.snr * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={signals.snr}
                  onChange={(e) => {
                    const next = { ...signals, snr: Number(e.target.value) };
                    setSignals(next);
                    void handleRunMq(next);
                  }}
                  className="w-full accent-[#2596a3]"
                />
              </div>

              {/* Camera Lighting Slider */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#332f29]">Environmental Room Lighting</span>
                  <span className="font-mono text-[#2596a3]">
                    {(signals.camera_lighting * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={signals.camera_lighting}
                  onChange={(e) => {
                    const next = { ...signals, camera_lighting: Number(e.target.value) };
                    setSignals(next);
                    void handleRunMq(next);
                  }}
                  className="w-full accent-[#2596a3]"
                />
              </div>

              {/* Dialect Match Toggle */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#332f29]">Dialect / Language Alignment</p>
                  <p className="text-[11px] text-[#7a7a71]">
                    Current: {signals.language_detected}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isMismatch = signals.language_detected.includes("Mismatch");
                    const next = {
                      ...signals,
                      language_detected: isMismatch ? "Assamese (Kamrupi)" : "Dialect Mismatch (Unknown)",
                    };
                    setSignals(next);
                    void handleRunMq(next);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    signals.language_detected.includes("Mismatch")
                      ? "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]"
                      : "bg-[#e5ece0] text-[#38452d] border-[#ccd9c2]"
                  }`}
                >
                  {signals.language_detected.includes("Mismatch") ? "Simulating Dialect Mismatch" : "Dialect Matched"}
                </button>
              </div>
            </div>
          </div>

          {/* MQ Gate Decision */}
          <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-[#332f29]">
              Gate Decision Output
            </h3>

            {mqResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    mqResult.gate === "sufficient"
                      ? "bg-[#e5ece0] border-[#ccd9c2] text-[#38452d]"
                      : "bg-[#fff3cd] border-[#ffeeba] text-[#856404]"
                  }`}
                >
                  {mqResult.gate === "sufficient" ? (
                    <CheckCircle2 size={24} className="text-[#6b8f6b] shrink-0" />
                  ) : (
                    <ShieldAlert size={24} className="text-[#d97706] shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {mqResult.gate === "sufficient" ? "GATE: SUFFICIENT" : "GATE: INSUFFICIENT DATA"}
                    </p>
                    <p className="text-xs font-mono mt-1 font-bold">
                      Composite q = {mqResult.q.toFixed(3)}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed">
                      {mqResult.message}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] text-xs space-y-1.5">
                  <p className="font-semibold text-[#7a7a71]">Signal Contributions:</p>
                  {Object.entries(mqResult.component_scores).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize text-[#332f29]">{k.replace("_", " ")}</span>
                      <span className="font-mono text-[#2596a3]">{(Number(v) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Memory Firewall */}
      {activeTab === "firewall" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#332f29] flex items-center gap-2">
                <Lock size={22} className="text-[#a85e46]" />
                Memory Firewall & Consent Interceptor
              </h2>
              <p className="text-xs text-[#6b6b63] mt-1">
                Invariant 1: Personal memory retrieval (PWM) requires cryptographically verified actor role, fact sensitivity matching, and non-revoked consent.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6b6b63] block mb-1">Actor</label>
                  <select
                    value={firewallActor}
                    onChange={(e) => setFirewallActor(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl text-[#332f29]"
                  >
                    <option value="actor:anu">Anu (Caregiver)</option>
                    <option value="actor:meena">Meena (ASHA CHW)</option>
                    <option value="actor:dr_barman">Dr. Barman (Doctor)</option>
                    <option value="actor:external_ai">External Commercial AI</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6b6b63] block mb-1">Memory Fact</label>
                  <select
                    value={firewallFact}
                    onChange={(e) => setFirewallFact(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl text-[#332f29]"
                  >
                    <option value="f_rina">f_rina (Daughter call notes)</option>
                    <option value="f_tea">f_tea (Morning tea preference)</option>
                    <option value="f_meds">f_meds (Amlodipine BP prescription)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6b6b63] block mb-1">Purpose</label>
                  <select
                    value={firewallPurpose}
                    onChange={(e) => setFirewallPurpose(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl text-[#332f29]"
                  >
                    <option value="personalisation">personalisation</option>
                    <option value="care_coordination">care_coordination</option>
                    <option value="screening">screening</option>
                    <option value="research">research (forbidden)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunFirewall}
                className="px-4 py-2 bg-[#a85e46] text-white text-xs font-semibold rounded-lg hover:bg-[#8f4f3a] transition-colors"
              >
                Evaluate Firewall Rule
              </button>
            </div>
          </div>

          {/* Firewall Decision Output */}
          <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-[#332f29]">
              Firewall Interceptor Verdict
            </h3>

            {firewallResult ? (
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  firewallResult.decision === "ALLOW"
                    ? "bg-[#e5ece0] border-[#ccd9c2] text-[#38452d]"
                    : "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {firewallResult.decision === "ALLOW" ? (
                    <Unlock size={18} className="text-[#6b8f6b]" />
                  ) : (
                    <Lock size={18} className="text-[#dc2626]" />
                  )}
                  <span>DECISION: {firewallResult.decision}</span>
                </div>
                <p className="text-xs leading-relaxed">{firewallResult.reason}</p>

                {firewallResult.fact && (
                  <div className="p-2.5 bg-white/70 rounded-lg text-xs mt-2 border border-[#ccd9c2]">
                    <p className="font-semibold text-[#332f29]">Decrypted Content:</p>
                    <p className="mt-0.5">{firewallResult.fact.text}</p>
                    <p className="text-[10px] text-[#7a7a71] mt-1">
                      Provenance: {firewallResult.fact.provenance}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#7a7a71]">Click 'Evaluate Firewall Rule' to test authorization.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Acute Delirium Invariant */}
      {activeTab === "delirium" && (
        <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-[#dc2626]" />
                <h2 className="text-xl font-bold font-serif text-[#332f29]">
                  Invariant 5: Acute Multi-Domain Delirium Escalation
                </h2>
              </div>
              <p className="text-xs text-[#6b6b63] mt-1 max-w-2xl">
                Gradual dementia progresses over months. Sudden, steep cognitive collapse over 24–72 hours is NOT progression — it is almost always acute delirium triggered by infection (e.g. UTI, pneumonia, sepsis).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDeliriumTriggered(!deliriumTriggered)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                deliriumTriggered
                  ? "bg-[#332f29] text-white"
                  : "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
              }`}
            >
              {deliriumTriggered ? "Reset Simulation" : "Simulate 48h Acute Drop"}
            </button>
          </div>

          {deliriumTriggered ? (
            <div className="p-5 bg-[#fee2e2] border-2 border-[#dc2626] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#dc2626] text-white flex items-center gap-1.5">
                  <AlertOctagon size={16} />
                  LEVEL 5 EMERGENCY · ATTENTION BUDGET BYPASSED
                </span>
                <span className="text-xs font-mono font-semibold text-[#991b1b]">Window: &lt; 48 Hours</span>
              </div>

              <div className="space-y-2 text-[#991b1b]">
                <p className="text-base font-bold">
                  Rule Triggered: Acute Multi-Domain Deterioration
                </p>
                <p className="text-xs leading-relaxed text-[#7f1d1d]">
                  Purnima experienced an abrupt 42% latency spike and confusion across orientation and memory within 36 hours. Because this occurred in &lt; 72 hours, the attention budget cap (2/day) is unconditionally waived.
                </p>
              </div>

              <div className="p-4 bg-white/80 rounded-lg border border-[#fca5a5] space-y-2 text-xs">
                <p className="font-bold text-[#991b1b]">Mandatory Clinical Ruleout Protocol:</p>
                <ul className="list-disc list-inside space-y-1 text-[#7f1d1d]">
                  <li>Alert sent immediately to Primary Caregiver Anu (Push + SMS)</li>
                  <li>Urgent prompt to check for urinary tract infection (UTI) or fever</li>
                  <li>Immediate priority notification dispatched to GMC Emergency Neurologist Dr. Barman</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[#fbf1e3] border border-dashed border-[#e6ddcf] rounded-xl text-center text-[#7a7a71]">
              <AlertOctagon size={32} className="mx-auto text-[#d6d3d1] mb-2" />
              <p className="text-sm font-medium">Standard Monitoring State</p>
              <p className="text-xs mt-0.5">Click 'Simulate 48h Acute Drop' to trigger the Level 5 Delirium override.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
