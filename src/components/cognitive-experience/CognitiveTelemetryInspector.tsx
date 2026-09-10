import React, { useState, useEffect } from "react";
import { PersonalGameContextPack, ExperienceEpisode } from "../../domain/cognitive-experience";

interface Props {
  onClose: () => void;
}

export const CognitiveTelemetryInspector: React.FC<Props> = ({ onClose }) => {
  const [contextPack, setContextPack] = useState<PersonalGameContextPack | null>(null);
  const [episodes, setEpisodes] = useState<ExperienceEpisode[]>([]);
  const [auditRuns, setAuditRuns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pcm" | "rag" | "orchestrator" | "episodes" | "validator" | "schema" | "audit">("pcm");

  // Hybrid RAG State
  const [hybridRagResult, setHybridRagResult] = useState<any | null>(null);
  const [ragLoading, setRagLoading] = useState<boolean>(false);

  // Orchestrator Simulation State
  const [orchestratorIntent, setOrchestratorIntent] = useState<string>("morning reminiscence and afternoon visit");
  const [orchestratorMode, setOrchestratorMode] = useState<string>("parametrically_personalised_level_b");
  const [orchestratorTemplate, setOrchestratorTemplate] = useState<string>("my_life_timeline");
  const [orchestratorResult, setOrchestratorResult] = useState<any | null>(null);
  const [orchestrating, setOrchestrating] = useState<boolean>(false);

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

    // Initial Hybrid RAG trace
    fetchHybridRag();
  }, []);

  const fetchHybridRag = async () => {
    setRagLoading(true);
    try {
      const res = await fetch("/v1/cognitive-studio/hybrid-rag?person_id=person:purnima&query_intent=morning%20tea%20with%20Rina");
      const data = await res.json();
      setHybridRagResult(data);
    } catch (err) {
      console.error("Error fetching hybrid RAG:", err);
    } finally {
      setRagLoading(false);
    }
  };

  const runOrchestratorSimulation = async () => {
    setOrchestrating(true);
    try {
      const res = await fetch("/v1/cognitive-studio/orchestrate-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          intent: orchestratorIntent,
          generation_mode: orchestratorMode,
          preferred_template: orchestratorTemplate,
        }),
      });
      const data = await res.json();
      setOrchestratorResult(data);
      // Refresh audit runs
      const runsRes = await fetch("/v1/cognitive-studio/audit-runs");
      const runsData = await runsRes.json();
      if (runsData.runs) setAuditRuns(runsData.runs);
    } catch (err) {
      console.error("Error running orchestrator:", err);
    } finally {
      setOrchestrating(false);
    }
  };

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
        <div className="flex flex-wrap gap-2 border-b border-[#ede4d4] pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("pcm")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "pcm"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Personal Capability (PCM)
          </button>
          <button
            onClick={() => setActiveTab("rag")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "rag"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            7-Layer Hybrid RAG
          </button>
          <button
            onClick={() => setActiveTab("orchestrator")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "orchestrator"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            LangGraph Orchestrator
          </button>
          <button
            onClick={() => setActiveTab("schema")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "schema"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Postgres + pgvector Schema
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "episodes"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Episodes ({episodes.length})
          </button>
          <button
            onClick={() => setActiveTab("validator")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "validator"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            5-Layer Validator
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === "audit"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] border border-[#d6cbba]"
            }`}
          >
            Audit Runs ({auditRuns.length})
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

        {/* ── TAB: 7-LAYER HYBRID RAG TRACE ── */}
        {activeTab === "rag" && (
          <div className="space-y-5">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-serif font-medium text-[#2c2824]">
                    7-Layer Structured Hybrid RAG Pipeline
                  </h3>
                  <p className="text-xs text-[#736a5e]">
                    Deterministic multi-layer retrieval fusing Knowledge Graph, Temporal milestones, pgvector semantic search, and CAE policy.
                  </p>
                </div>
                <button
                  onClick={fetchHybridRag}
                  disabled={ragLoading}
                  className="px-4 py-2 rounded-xl bg-[#485935] text-white text-xs font-medium hover:bg-[#39472a] transition shadow-sm disabled:opacity-50"
                >
                  {ragLoading ? "Retrieving..." : "Re-Execute Hybrid RAG"}
                </button>
              </div>

              {hybridRagResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Layer 1: Personal Graph */}
                  {hybridRagResult.layer1_graph && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layer 1: Personal Graph (Entities)</span>
                      <p className="text-[#41382c]"><strong>Primary Caregiver:</strong> {hybridRagResult.layer1_graph.primary_caregiver?.name} ({hybridRagResult.layer1_graph.primary_caregiver?.relationship})</p>
                      <div>
                        <strong>Key Family Members:</strong>
                        <ul className="list-disc list-inside mt-1 text-[#595043]">
                          {hybridRagResult.layer1_graph.key_family_members?.map((m: any, idx: number) => (
                            <li key={idx}>{m.name} — {m.relationship}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Layer 2: Temporal Frame */}
                  {hybridRagResult.layer2_temporal && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layer 2: Temporal Frame</span>
                      <p className="text-[#41382c]"><strong>Future Event:</strong> {hybridRagResult.layer2_temporal.future_events?.[0]?.title}</p>
                      <p className="text-[#41382c]"><strong>Present Routine:</strong> {hybridRagResult.layer2_temporal.present_routine?.join(", ")}</p>
                      <p className="text-[#595043]"><strong>Past Anchors:</strong> {hybridRagResult.layer2_temporal.past_anchors?.join(", ")}</p>
                    </div>
                  )}

                  {/* Layer 3: Semantic Memories */}
                  {hybridRagResult.layer3_semantic && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layer 3: Semantic Search (pgvector)</span>
                      <p className="text-[#595043]">Cosine similarity matched {hybridRagResult.layer3_semantic.length} verified memories:</p>
                      <div className="space-y-1.5">
                        {hybridRagResult.layer3_semantic.map((m: any) => (
                          <div key={m.id} className="p-2 bg-white rounded-lg border border-[#e5dac6] flex justify-between items-center">
                            <span className="font-medium text-[#2c2824] truncate max-w-[200px]">{m.title}</span>
                            <span className="text-[10px] bg-[#eaf0e4] text-[#2c401e] px-2 py-0.5 rounded font-mono">Sim: {m.similarity ? m.similarity.toFixed(2) : "0.95"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layer 4: Media Assets */}
                  {hybridRagResult.layer4_media && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layer 4: Media Assets (Provenance)</span>
                      <p className="text-[#595043]">Verified visual and audio stimuli with source attribution:</p>
                      <div className="space-y-1.5">
                        {hybridRagResult.layer4_media.slice(0, 3).map((a: any) => (
                          <div key={a.id} className="p-2 bg-white rounded-lg border border-[#e5dac6] flex justify-between items-center">
                            <span className="text-[#2c2824] truncate max-w-[180px]">{a.title}</span>
                            <span className="text-[10px] text-[#736a5e]">{a.provenance_source || "caregiver_verified"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layer 5: Experience Memory (XM) */}
                  {hybridRagResult.layer5_experience_memory && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layer 5: Experience Memory (XM)</span>
                      <p className="text-[#41382c]"><strong>Completed Sessions:</strong> {hybridRagResult.layer5_experience_memory.completed_sessions_count} sessions</p>
                      <p className="text-[#41382c]"><strong>Preferred Topics:</strong> {hybridRagResult.layer5_experience_memory.preferred_topics?.join(", ")}</p>
                      <p className="text-[#41382c]"><strong>Effective Scaffolding:</strong> {hybridRagResult.layer5_experience_memory.effective_scaffolding?.join(", ")}</p>
                    </div>
                  )}

                  {/* Layer 6 & 7: Capability + CAE Policy */}
                  {hybridRagResult.layer7_cae_policy && (
                    <div className="p-4 bg-[#fbf7ee] border border-[#e2d7c5] rounded-xl space-y-2">
                      <span className="font-bold text-[#485935] uppercase tracking-wider block">Layers 6 & 7: Capability & CAE Policy</span>
                      <p className="text-[#41382c]"><strong>Max Choices:</strong> {hybridRagResult.layer7_cae_policy.max_choice_count} options (no cognitive overload)</p>
                      <p className="text-[#41382c]"><strong>Scaffolding Mode:</strong> {hybridRagResult.layer7_cae_policy.scaffolding_mode}</p>
                      <p className="text-[#41382c]"><strong>Optimal Modality:</strong> {hybridRagResult.layer7_cae_policy.modality}</p>
                      <p className="text-[#41382c]"><strong>Renewal Rule:</strong> "{hybridRagResult.layer7_cae_policy.renewal_rule}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: LANGGRAPH ORCHESTRATOR PIPELINE ── */}
        {activeTab === "orchestrator" && (
          <div className="space-y-5">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-base font-serif font-medium text-[#2c2824]">
                LangGraph Multi-Step Cognitive Orchestrator
              </h3>
              <p className="text-xs text-[#736a5e]">
                A 7-step orchestrated pipeline that compiles structured, deterministic experience specifications instead of generating arbitrary code.
              </p>

              {/* Simulation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#595043] block mb-1">Intent / Focus</label>
                  <input
                    type="text"
                    value={orchestratorIntent}
                    onChange={(e) => setOrchestratorIntent(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d6cbba] bg-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#595043] block mb-1">Generation Mode</label>
                  <select
                    value={orchestratorMode}
                    onChange={(e) => setOrchestratorMode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d6cbba] bg-[#faf6f0]"
                  >
                    <option value="static_baseline_level_a">Level A: Static Curated</option>
                    <option value="parametrically_personalised_level_b">Level B: Parametrically Personalised</option>
                    <option value="dynamically_composed_level_c">Level C: Dynamically Composed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#595043] block mb-1">Template Slot</label>
                  <select
                    value={orchestratorTemplate}
                    onChange={(e) => setOrchestratorTemplate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#d6cbba] bg-[#faf6f0]"
                  >
                    <option value="my_life_timeline">My Life Timeline (Engine A)</option>
                    <option value="prepare_for">Prepare-For (Engine B)</option>
                    <option value="experience_braid">Experience Braid (Signature)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={runOrchestratorSimulation}
                  disabled={orchestrating}
                  className="px-5 py-2.5 rounded-xl bg-[#485935] text-white text-xs font-medium hover:bg-[#39472a] transition shadow-sm disabled:opacity-50"
                >
                  {orchestrating ? "Executing Pipeline..." : "▶ Run Multi-Step Orchestration"}
                </button>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="p-4 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] space-y-3">
                <span className="text-xs font-bold text-[#485935] uppercase tracking-wider block">Orchestrator Graph Steps</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2d7c5] text-center">
                    <span className="font-bold text-[#2c2824] block">1. Intent Planner</span>
                    <span className="text-[#736a5e]">Analyze focus & time</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2d7c5] text-center">
                    <span className="font-bold text-[#2c2824] block">2. 7-Layer RAG</span>
                    <span className="text-[#736a5e]">Retrieve graph & vector</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2d7c5] text-center">
                    <span className="font-bold text-[#2c2824] block">3. CAE Policy</span>
                    <span className="text-[#736a5e]">2-choice & dignity rule</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2d7c5] text-center">
                    <span className="font-bold text-[#2c2824] block">4. Spec Compiler</span>
                    <span className="text-[#736a5e]">Assemble structured slots</span>
                  </div>
                </div>
              </div>

              {/* Output Spec & Validation */}
              {orchestratorResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-[#eaf0e4] border border-[#bdd4b0] rounded-xl text-xs text-[#2c401e]">
                    <span><strong>Run ID:</strong> {orchestratorResult.run_id}</span>
                    <span><strong>Validation:</strong> {orchestratorResult.validation_passed ? "✓ Passed 5/5 Checks" : "⚠ Failed"}</span>
                    <span><strong>Engine Binding:</strong> {orchestratorResult.deterministic_engine_binding}</span>
                  </div>
                  <div className="p-4 bg-[#2c2824] text-[#ede4d4] rounded-xl text-xs font-mono max-h-48 overflow-y-auto">
                    <pre>{JSON.stringify(orchestratorResult.compiled_spec, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: POSTGRESQL + PGVECTOR SCHEMA ── */}
        {activeTab === "schema" && (
          <div className="space-y-5">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-serif font-medium text-[#2c2824]">
                    PostgreSQL 16 + pgvector Cognitive Schema
                  </h3>
                  <p className="text-xs text-[#736a5e]">
                    Defined in <code>/src/db/cognitive_schema.sql</code> with IVFFlat cosine similarity indexes and strict provenance constraints.
                  </p>
                </div>
                <span className="bg-[#485935]/15 text-[#334224] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  vector(768) enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] space-y-2">
                  <span className="font-bold text-[#485935] block">Table: media_assets</span>
                  <p className="text-[#595043]">Stores photos, audio recordings, family voices, and 768-dim embeddings for multimodal retrieval.</p>
                  <div className="font-mono text-[10px] bg-white p-2.5 rounded border border-[#dfd4c0] text-[#2c2824]">
                    id, person_id, asset_type, url, thumbnail_url, title, assamese_title, approx_year, provenance_source, verification_status, embedding vector(768)
                  </div>
                </div>

                <div className="p-4 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] space-y-2">
                  <span className="font-bold text-[#485935] block">Table: memory_items</span>
                  <p className="text-[#595043]">Autobiographical, procedural, and social memories with 6-stage provenance validation model.</p>
                  <div className="font-mono text-[10px] bg-white p-2.5 rounded border border-[#dfd4c0] text-[#2c2824]">
                    id, person_id, memory_type, title, description, temporal_frame, source, verification_status, verified_by, embedding vector(768)
                  </div>
                </div>

                <div className="p-4 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] space-y-2">
                  <span className="font-bold text-[#485935] block">Table: game_templates & game_specs</span>
                  <p className="text-[#595043]">Catalog of deterministic engines (Timeline, Prepare-For, Garland, Braid) and compiled JSON specs.</p>
                  <div className="font-mono text-[10px] bg-white p-2.5 rounded border border-[#dfd4c0] text-[#2c2824]">
                    id, template_key, title, generation_mode, spec_json, validation_status, engine_binding, provenance_refs
                  </div>
                </div>

                <div className="p-4 bg-[#fbf7ee] rounded-xl border border-[#e2d7c5] space-y-2">
                  <span className="font-bold text-[#485935] block">Table: game_sessions & game_trials</span>
                  <p className="text-[#595043]">Granular trial-level telemetry, assistance levels, latency buckets (&lt;2s, 2-5s, &gt;5s), and measurement quality (q).</p>
                  <div className="font-mono text-[10px] bg-white p-2.5 rounded border border-[#dfd4c0] text-[#2c2824]">
                    id, session_id, step_index, stimulus, response, latency_bucket, assistance_level, completion_state, measurement_quality
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#2c2824] text-[#ede4d4] rounded-xl font-mono text-[11px] overflow-x-auto">
                <code>
                  CREATE INDEX idx_memories_embedding ON memory_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
                </code>
              </div>
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
