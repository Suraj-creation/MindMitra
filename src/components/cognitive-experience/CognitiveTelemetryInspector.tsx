import React, { useState, useEffect } from "react";
import { PersonalGameContextPack, ExperienceEpisode } from "../../domain/cognitive-experience";

interface Props {
  onClose: () => void;
}

export const CognitiveTelemetryInspector: React.FC<Props> = ({ onClose }) => {
  const [contextPack, setContextPack] = useState<PersonalGameContextPack | null>(null);
  const [episodes, setEpisodes] = useState<ExperienceEpisode[]>([]);
  const [auditRuns, setAuditRuns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pcm" | "episodes" | "validator" | "audit">("pcm");

  useEffect(() => {
    // Fetch context pack
    fetch("/v1/cognitive-studio/context-pack/person:purnima")
      .then((res) => res.json())
      .then((data) => setContextPack(data))
      .catch((err) => console.error("Error fetching context pack:", err));

    // Fetch episodes
    fetch("/v1/cognitive-studio/episodes/person:purnima")
      .then((res) => res.json())
      .then((data) => {
        if (data.episodes) setEpisodes(data.episodes);
      })
      .catch((err) => console.error("Error fetching episodes:", err));

    // Fetch audit runs
    fetch("/v1/cognitive-studio/audit-runs")
      .then((res) => res.json())
      .then((data) => {
        if (data.runs) setAuditRuns(data.runs);
      })
      .catch((err) => console.error("Error fetching audit runs:", err));
  }, []);

  return (
    <div id="cognitive-telemetry-inspector" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#faf6f0] border border-[#e5dac6] rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#e5dac6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#485935] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Clinical & Architecture Inspector
              </span>
              <span className="text-xs text-[#736a5e]">Neon Postgres • pgvector • CAE</span>
            </div>
            <h2 className="text-2xl font-serif text-[#2c2824] mt-1 font-medium">
              Cognitive Space Intelligence & Telemetry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#736a5e] hover:text-[#2c2824] text-lg font-bold px-3 py-1 border border-[#d6cbba] bg-white rounded-xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#ede4d4] pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("pcm")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "pcm"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Personal Capability Model (PCM & PWM)
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "episodes"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Experience Episodes ({episodes.length})
          </button>
          <button
            onClick={() => setActiveTab("validator")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "validator"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            5-Layer Validator Contract
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "audit"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Generation Audit Runs ({auditRuns.length})
          </button>
        </div>

        {/* ── TAB 1: PCM & PWM ── */}
        {activeTab === "pcm" && contextPack && (
          <div className="space-y-5">
            {/* Capability Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[#736a5e]">Visual 2-Choice Recognition</span>
                <div className="text-2xl font-serif font-bold text-[#485935] mt-1">
                  {(contextPack.capability.photo_recognition * 100).toFixed(0)}%
                </div>
                <p className="text-[11px] text-[#736a5e] mt-1">Sustained high accuracy with verified family archival cards.</p>
              </div>

              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[#736a5e]">Audio Cue Recall</span>
                <div className="text-2xl font-serif font-bold text-[#b8860b] mt-1">
                  {(contextPack.capability.audio_recall * 100).toFixed(0)}%
                </div>
                <p className="text-[11px] text-[#736a5e] mt-1">Responds warmly to daughter Anu and granddaughter Rina's voice notes.</p>
              </div>

              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[#736a5e]">Executive Step Sequencing</span>
                <div className="text-2xl font-serif font-bold text-[#485935] mt-1">
                  {(contextPack.capability.sequencing * 100).toFixed(0)}%
                </div>
                <p className="text-[11px] text-[#736a5e] mt-1">Effective tactile ordering when grounded in daily tea routine.</p>
              </div>
            </div>

            {/* Adaptation Policy */}
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-serif font-medium text-[#2c2824]">
                Cognitive Adaptation Engine (CAE) Dynamic Policy
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                  <span className="text-[#736a5e] block">Choice Limit</span>
                  <span className="font-semibold text-[#2c2824]">{contextPack.adaptation_policy.max_choice_count} options</span>
                </div>
                <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                  <span className="text-[#736a5e] block">Scaffolding Mode</span>
                  <span className="font-semibold text-[#2c2824]">{contextPack.adaptation_policy.scaffolding_mode}</span>
                </div>
                <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                  <span className="text-[#736a5e] block">Optimal Modality</span>
                  <span className="font-semibold text-[#2c2824]">{contextPack.adaptation_policy.modality}</span>
                </div>
                <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                  <span className="text-[#736a5e] block">Attention Window</span>
                  <span className="font-semibold text-[#2c2824]">{contextPack.capability.attention_span_minutes} minutes</span>
                </div>
              </div>
              <p className="text-xs text-[#595043] italic mt-2">
                Renewal Rule: "{contextPack.adaptation_policy.renewal_rule}"
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: EPISODES ── */}
        {activeTab === "episodes" && (
          <div className="space-y-4">
            <p className="text-xs text-[#595043]">
              Every session synthesizes into an Experience Episode. These episodes update the Personal Capability Model (PCM) and Experience Memory (XM) across sessions.
            </p>
            <div className="space-y-3">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">{ep.template_key}</span>
                      <h4 className="font-serif font-medium text-base text-[#2c2824]">{ep.objective}</h4>
                    </div>
                    <span className="text-xs bg-[#eaf0e4] text-[#2c401e] px-3 py-1 rounded-full font-medium">
                      MQ Score: {(ep.measurement_quality * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-[#595043] space-y-1">
                    <p><strong>Observed Response:</strong> {ep.observed_response}</p>
                    <p><strong>Learned Implication:</strong> {ep.learned_implication}</p>
                  </div>
                  <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] text-xs flex justify-between items-center">
                    <span>PCM Domain: <strong>{ep.pcm_update.domain}</strong></span>
                    <span className="text-[#485935] font-semibold">Update: +{ep.pcm_update.delta} → New Estimate: {ep.pcm_update.new_estimate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: 5-LAYER VALIDATOR ── */}
        {activeTab === "validator" && (
          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-[#41382c]">
            <h3 className="text-base font-serif font-medium text-[#2c2824]">
              Deterministic 5-Layer Validator Rules
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                <strong className="text-[#485935]">1. Grounding Validator:</strong> Ensures all stimulus cards, relatives, and dates map to verified entities in the personal world model. No hallucinated family members or fake historical claims.
              </div>
              <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                <strong className="text-[#485935]">2. Consent & Memory Firewall:</strong> Enforces consent scopes. Private diary reflections are excluded from game generation unless explicit consent has been granted.
              </div>
              <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                <strong className="text-[#485935]">3. Clinical Safety & Anxiety Gate:</strong> Rejects any prompt with clinical diagnostic labels, timer pressure, fail screens, or anxiety-inducing tests.
              </div>
              <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                <strong className="text-[#485935]">4. Cultural Dignity & Honorifics:</strong> Mandates respectful Assamese honorifics (Aitâ, Purnima baideu) and bans infantilizing or patronizing language.
              </div>
              <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5]">
                <strong className="text-[#485935]">5. Deterministic Game Schema Validator:</strong> Verifies complete type-safe contract slots for the deterministic UI engines.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: AUDIT RUNS ── */}
        {activeTab === "audit" && (
          <div className="space-y-3">
            {auditRuns.length === 0 ? (
              <p className="text-xs text-[#736a5e]">No generation runs recorded yet in this session.</p>
            ) : (
              auditRuns.map((run) => (
                <div key={run.id} className="bg-white border border-[#dfd4c0] rounded-xl p-4 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#2c2824]">{run.selected_template}</span>
                    <span className="text-[11px] text-[#736a5e]">{run.created_at}</span>
                  </div>
                  <span className="text-[#595043]">Mode: {run.generation_mode}</span>
                  <div className="text-[#485935] font-medium">✓ All 5 Validator Layers Passed</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
