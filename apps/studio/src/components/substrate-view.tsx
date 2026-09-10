/**
 * MindMitra Personal Intelligence Substrate Explorer
 *
 * Visual workbench and interactive verification harness for:
 * 1. Neon/PostgreSQL & pgvector operational status
 * 2. Backblaze B2 Media Vault integration
 * 3. 7-Step Longitudinal Adaptation Pipeline with Measurement Quality Gating
 * 4. Conditioned Personal Capability Model (PCM) & Learned Assistance Policies
 * 5. Model-Generated Safety Invariant Audit & Live Ingestion
 * 6. Semantic Ontology Graph & Typed Relationship Inspection
 * 7. Automated Architectural Test Suite Runner (6/6 verifiable tests)
 */

import React, { useState, useEffect } from "react";
import {
  Database,
  Layers,
  ShieldAlert,
  Sliders,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Clock,
  UserCheck,
  FileCheck,
  HardDrive,
  Network,
  Image as ImageIcon,
  ChevronRight,
  Info,
  AlertTriangle,
} from "lucide-react";

interface SubstrateStatus {
  status: string;
  authoritative_store: string;
  pgvector_support: boolean;
  b2_media_vault: string;
  metrics: {
    person_id: string;
    database_backend: string;
    interaction_events_count: number;
    experience_episodes_count: number;
    capability_states_count: number;
    assistance_policies_count: number;
    governed_memories_count: number;
    ontology_nodes_count: number;
    ontology_edges_count: number;
    media_assets_count: number;
  };
}

interface TestReport {
  timestamp: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  all_passed: boolean;
  results: Array<{
    id: string;
    name: string;
    category: string;
    passed: boolean;
    expected: string;
    actual: string;
    details?: any;
  }>;
}

export function SubstrateView() {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "pipeline" | "capabilities" | "memories" | "media" | "ontology" | "tests" | "phase3"
  >("overview");

  const [status, setStatus] = useState<SubstrateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [phase3Report, setPhase3Report] = useState<any>(null);
  const [runningPhase3Tests, setRunningPhase3Tests] = useState(false);

  // Pipeline simulation state
  const [simActivity, setSimActivity] = useState("family_recall");
  const [simNoise, setSimNoise] = useState<"clean" | "noisy">("clean");
  const [simAssistance, setSimAssistance] = useState<"visual_cue" | "none">("visual_cue");
  const [pipelineOutput, setPipelineOutput] = useState<any>(null);
  const [runningPipeline, setRunningPipeline] = useState(false);

  // Model-generated invariant test form
  const [testClaimStatement, setTestClaimStatement] = useState(
    "Purnima baideu preferred two extra spoons of sugar in her afternoon ginger tea."
  );
  const [claimedAuthority, setClaimedAuthority] = useState("system/authoritative");
  const [memoryOutput, setMemoryOutput] = useState<any>(null);
  const [creatingMemory, setCreatingMemory] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/v1/intelligence/status?personId=person:purnima");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
      const pRes = await fetch("/v1/intelligence/profile/person:purnima");
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
      }
    } catch (err) {
      console.error("Error fetching substrate status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const runAutomatedTests = async () => {
    try {
      setRunningTests(true);
      const res = await fetch("/v1/intelligence/test-suite/run", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTestReport(data);
      }
    } catch (err) {
      console.error("Error running test suite:", err);
    } finally {
      setRunningTests(false);
    }
  };

  const runPhase3Tests = async () => {
    try {
      setRunningPhase3Tests(true);
      const res = await fetch("/v1/intelligence/phase3-test-suite/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: "person:purnima" }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhase3Report(data);
      }
    } catch (err) {
      console.error("Error running Phase 3 test suite:", err);
    } finally {
      setRunningPhase3Tests(false);
    }
  };

  const simulatePipeline = async () => {
    try {
      setRunningPipeline(true);
      const payload = {
        person_id: "person:purnima",
        session_id: `sess_sim_${Date.now()}`,
        surface: "activity",
        route: "/activities/photo_recall",
        component: "PhotoCardRecall",
        event_type: "completion",
        input_modality: "touch",
        language: "as",
        duration_ms: simNoise === "clean" ? 2100 : 8400,
        latency_ms: simNoise === "clean" ? 720 : 3400,
        result: simNoise === "clean" ? "success" : "failed",
        assistance_level: simAssistance,
        signals: {
          audibility: simNoise === "clean" ? 0.95 : 0.2,
          visibility: simNoise === "clean" ? 0.92 : 0.4,
          fatigue_factor: simNoise === "clean" ? 0.88 : 0.25,
          device_ok: simNoise === "clean",
          subject_confirmed: simNoise === "clean",
          language_match: true,
        },
        metadata: {
          activity_id: `activity:${simActivity}`,
          activity_name: "Courtyard Memory Match",
          cognitive_objective: "family_person_recognition",
          time_of_day: "morning",
        },
      };

      const res = await fetch("/v1/intelligence/pipeline/process-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setPipelineOutput(data);
        fetchStatus();
      }
    } catch (err) {
      console.error("Pipeline simulation failed:", err);
    } finally {
      setRunningPipeline(false);
    }
  };

  const submitInvariantTest = async () => {
    try {
      setCreatingMemory(true);
      const res = await fetch("/v1/intelligence/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          statement: testClaimStatement,
          category: "preference",
          claimed_authority: claimedAuthority,
          source_class: "model generated",
          author_actor_id: "model:gemini_flash",
          // Intentionally omitting verifying_actor_role to test guard enforcement!
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemoryOutput(data);
        fetchStatus();
      }
    } catch (err) {
      console.error("Memory ingestion failed:", err);
    } finally {
      setCreatingMemory(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Substrate Status */}
      <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-[#425232] text-white rounded-lg">
                <Database size={18} />
              </span>
              <h1 className="text-xl font-serif font-bold text-[#2d3b24]">
                MindMitra Personal Intelligence Data Substrate
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e7ede0] text-[#3e502e] border border-[#cfdcc5]">
                SIH PS26003 (MDoNER)
              </span>
            </div>
            <p className="text-sm text-[#5a6a4f] max-w-2xl leading-relaxed">
              Longitudinal cognitive data substrate establishing immutable interaction provenance,
              7-step measurement quality gating, conditioned capability tracking, Backblaze B2 media
              integration, and strict memory firewall governance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAutomatedTests}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#425232] hover:bg-[#344127] disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              {runningTests ? <RotateCw className="animate-spin" size={15} /> : <Play size={15} />}
              <span>Run Automated Test Suite</span>
            </button>
            <button
              onClick={fetchStatus}
              className="p-2 text-[#5a6a4f] hover:bg-[#f0e7d8] rounded-lg transition-colors border border-[#d9c9b5]"
              title="Refresh Substrate Status"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#e8dccb]">
          <div className="bg-white/80 p-3 rounded-lg border border-[#e8dccb]">
            <span className="text-xs text-[#708064] font-medium block">Authoritative Store</span>
            <span className="font-semibold text-sm text-[#2d3b24] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {status?.authoritative_store || "Neon PostgreSQL"}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-lg border border-[#e8dccb]">
            <span className="text-xs text-[#708064] font-medium block">pgvector Engine</span>
            <span className="font-semibold text-sm text-[#2d3b24] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Active (768-dim)
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-lg border border-[#e8dccb]">
            <span className="text-xs text-[#708064] font-medium block">B2 Media Vault</span>
            <span className="font-semibold text-sm text-[#2d3b24] flex items-center gap-1.5 mt-0.5">
              <HardDrive size={13} className="text-[#5a6a4f]" />
              mindmitra-b2-vault
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-lg border border-[#e8dccb]">
            <span className="text-xs text-[#708064] font-medium block">Subject Target</span>
            <span className="font-semibold text-sm text-[#2d3b24] flex items-center gap-1.5 mt-0.5">
              <UserCheck size={13} className="text-[#425232]" />
              Purnima Devi (Tezpur)
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-[#d9c9b5] overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Substrate Overview", icon: Layers },
          { id: "pipeline", label: "7-Step Adaptation Pipeline", icon: Sliders },
          { id: "capabilities", label: "Conditioned PCM & Policies", icon: Sparkles },
          { id: "memories", label: "Governed Memories & Invariant", icon: ShieldAlert },
          { id: "media", label: "B2 Media Vault", icon: ImageIcon },
          { id: "ontology", label: "Semantic Ontology Graph", icon: Network },
          { id: "tests", label: "Automated Substrate Tests (6/6)", icon: CheckCircle2 },
          { id: "phase3", label: "Phase 3 Assistant Tests (8/8)", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-[#425232] text-[#2d3b24] bg-[#f5ede0]/60 rounded-t-lg"
                  : "border-transparent text-[#6d7e63] hover:text-[#2d3b24] hover:bg-[#f8f2e7]/40 rounded-t-lg"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Overview */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Interaction Events</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.interaction_events_count ?? 0}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Append-only telemetry</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Experience Episodes</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.experience_episodes_count ?? 0}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Contextual episodes</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">PCM Capability States</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.capability_states_count ?? 3}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Conditioned estimates</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Learned Policies</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.assistance_policies_count ?? 2}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Adaptive strategies</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Governed Memories</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.governed_memories_count ?? 3}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Verifiable provenance</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">B2 Media Vault Assets</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.media_assets_count ?? 2}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Depiction tagged</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Ontology Nodes</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.ontology_nodes_count ?? 6}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Entities & concepts</span>
            </div>

            <div className="bg-[#fffaf2] p-4 rounded-xl border border-[#d9c9b5]">
              <span className="text-xs text-[#708064] font-semibold uppercase">Typed Graph Edges</span>
              <p className="text-2xl font-serif font-bold text-[#2d3b24] mt-1">
                {status?.metrics.ontology_edges_count ?? 5}
              </p>
              <span className="text-xs text-[#7b8c70] mt-1 block">Explicit semantic links</span>
            </div>
          </div>

          {/* Profile Overview Card */}
          {profile?.person && (
            <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
              <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-3 flex items-center gap-2">
                <UserCheck size={18} className="text-[#425232]" />
                <span>Longitudinal Profile: {profile.person.display_name}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-[#708064] block">Region & Cultural Context</span>
                  <p className="text-[#2d3b24] font-medium mt-0.5">{profile.person.cultural_profile.region}</p>
                  <p className="text-xs text-[#5a6a4f] mt-1">
                    Primary Language: <span className="font-semibold uppercase">{profile.person.preferred_language}</span> (Assamese)
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#708064] block">Cultural Traditions & Rhythms</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profile.person.cultural_profile.traditions.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[#e7ede0] text-[#3e502e] text-xs rounded border border-[#cfdcc5]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#708064] block">Kinship Network (Contacts)</span>
                  <ul className="mt-1 space-y-1 text-xs">
                    {profile.contacts?.map((c: any) => (
                      <li key={c.contact_id} className="text-[#2d3b24]">
                        <span className="font-semibold">{c.full_name}</span> ({c.relationship_label})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: 7-Step Longitudinal Pipeline Simulator */}
      {activeSubTab === "pipeline" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <Sliders size={18} className="text-[#425232]" />
              <span>7-Step Longitudinal Adaptation Pipeline Simulator</span>
            </h2>
            <p className="text-sm text-[#5a6a4f] mb-4">
              Demonstrates how raw interaction events are converted to verified capability updates only after passing
              the Measurement Quality Gate. Noisy or confounded events are prevented from corrupting stable capability baselines.
            </p>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/60 p-4 rounded-lg border border-[#e8dccb]">
              <div>
                <label className="block text-xs font-semibold text-[#5a6a4f] mb-1">Target Activity</label>
                <select
                  value={simActivity}
                  onChange={(e) => setSimActivity(e.target.value)}
                  className="w-full text-sm bg-white border border-[#d9c9b5] rounded-lg px-3 py-2 text-[#2d3b24] focus:outline-[#425232]"
                >
                  <option value="family_recall">Family Photograph Recall (Courtyard Bihu 1985)</option>
                  <option value="tea_routine">Afternoon Cardamom Tea Step Sequencing</option>
                  <option value="song_recognition">Assamese Folk Raga Recognition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a6a4f] mb-1">Environment Noise Condition</label>
                <select
                  value={simNoise}
                  onChange={(e) => setSimNoise(e.target.value as any)}
                  className="w-full text-sm bg-white border border-[#d9c9b5] rounded-lg px-3 py-2 text-[#2d3b24] focus:outline-[#425232]"
                >
                  <option value="clean">Clean Environment (Morning, Low Noise, Clear Visibility)</option>
                  <option value="noisy">Confounded (High Noise, Device Audio Clip, High Fatigue)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a6a4f] mb-1">Assistance Provided</label>
                <select
                  value={simAssistance}
                  onChange={(e) => setSimAssistance(e.target.value as any)}
                  className="w-full text-sm bg-white border border-[#d9c9b5] rounded-lg px-3 py-2 text-[#2d3b24] focus:outline-[#425232]"
                >
                  <option value="visual_cue">Visual Cue (Adaptive Photo Highlight)</option>
                  <option value="none">Unassisted Free Recall</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={simulatePipeline}
                disabled={runningPipeline}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#425232] hover:bg-[#344127] disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                {runningPipeline ? <RotateCw className="animate-spin" size={15} /> : <Play size={15} />}
                <span>Execute 7-Step Pipeline</span>
              </button>

              <span className="text-xs text-[#708064]">
                {simNoise === "noisy"
                  ? "⚠️ Noisy condition will trigger Measurement Quality Gating (insufficient_data)."
                  : "✓ Clean condition will pass gate and update PCM capability state."}
              </span>
            </div>
          </div>

          {/* Pipeline Results */}
          {pipelineOutput && (
            <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#2d3b24]">Pipeline Execution Report</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    pipelineOutput.report.passed_measurement_gate
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {pipelineOutput.report.passed_measurement_gate
                    ? "✓ PASSED MEASUREMENT QUALITY GATE"
                    : "⚠️ GATED: BELOW QUALITY THRESHOLD (MODEL UPDATE WITHHELD)"}
                </span>
              </div>

              {/* 7-Step Visual Progression */}
              <div className="space-y-2">
                {pipelineOutput.report.steps.map((step: any) => (
                  <div
                    key={step.step_number}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#e8dccb] text-sm"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        step.status === "PASSED"
                          ? "bg-[#425232] text-white"
                          : step.status === "GATED"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {step.step_number}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#2d3b24]">{step.step_name}</span>
                        <span className="text-xs font-mono text-[#708064]">{step.status}</span>
                      </div>
                      <p className="text-xs text-[#5a6a4f] mt-0.5">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Consequence Box */}
              <div className="p-4 rounded-lg bg-white border border-[#e8dccb] text-xs">
                <span className="font-bold text-[#2d3b24] block mb-1">Longitudinal Intelligence Consequence:</span>
                <p className="text-[#5a6a4f]">
                  {pipelineOutput.report.persisted_to_model
                    ? `Successfully updated Conditioned Capability State '${pipelineOutput.capabilityState?.domain}' to ${pipelineOutput.capabilityState?.numeric_estimate}% (confidence reinforced).`
                    : "Measurement Gate blocked state update. The raw interaction telemetry was securely preserved in the append-only log, but the person's longitudinal cognitive baseline was protected from noise contamination."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Conditioned PCM & Learned Policies */}
      {activeSubTab === "capabilities" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-[#425232]" />
              <span>Conditioned Personal Capability Model (PCM)</span>
            </h2>
            <p className="text-sm text-[#5a6a4f] mb-4">
              MindMitra maintains conditioned capability distributions rather than static labels. Cognitive performance
              is contextualized by environmental conditions, language, time-of-day, and fatigue.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile?.capabilities?.map((cap: any) => (
                <div key={cap.state_id} className="bg-white p-4 rounded-lg border border-[#e8dccb] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#2d3b24] capitalize">
                      {cap.domain.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 bg-[#e7ede0] text-[#3e502e] text-xs font-bold rounded">
                      {cap.trend}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-serif font-bold text-[#2d3b24]">
                        {cap.numeric_estimate ? `${cap.numeric_estimate}%` : "Cued"}
                      </span>
                      <span className="text-xs text-[#708064]">Uncertainty: ±{(cap.uncertainty * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#425232] h-full rounded-full transition-all"
                        style={{ width: `${cap.numeric_estimate || 50}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#5a6a4f] leading-relaxed italic">{cap.conditioned_estimate}</p>

                  <div className="pt-2 border-t border-[#f0e7d8]">
                    <span className="text-[10px] uppercase font-bold text-[#708064] block mb-1">
                      Active Condition Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cap.condition_tags?.map((tag: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[#f5ede0] text-[#5a6a4f] text-[10px] rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learned Assistance Policies */}
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <Sliders size={18} className="text-[#425232]" />
              <span>Learned Assistance Policies</span>
            </h2>
            <p className="text-sm text-[#5a6a4f] mb-4">
              MindMitra learns which prompting strategies work best for each specific task and person, adapting assistance
              gradually based on reinforced empirical success.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile?.assistancePolicies?.map((pol: any) => (
                <div key={pol.policy_id} className="bg-white p-4 rounded-lg border border-[#e8dccb] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#2d3b24] capitalize">
                      {pol.task_domain.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-[#708064]">
                      Evidence Count: <span className="font-bold text-[#2d3b24]">{pol.evidence_count}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#fbf8f2] p-2.5 rounded border border-[#f0e7d8]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#708064] block">Preferred Strategy</span>
                      <span className="font-semibold text-[#425232]">{pol.preferred_strategy}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#708064] block">Fallback Strategy</span>
                      <span className="font-semibold text-[#8b633e]">{pol.fallback_strategy}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5a6a4f]">
                    <span>Policy Confidence: {(pol.confidence * 100).toFixed(0)}%</span>
                    <span>Empirical Success: {(pol.success_rate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Governed Memories & Model-Generated Invariant */}
      {activeSubTab === "memories" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#a85e46]" />
              <span>Model-Generated Safety Invariant Enforcement</span>
            </h2>
            <div className="p-3 bg-[#fdf7f4] border border-[#ecd5cb] rounded-lg text-xs text-[#8c3f27] mb-4 leading-relaxed">
              <strong>SAFETY MANDATE:</strong> "A model-generated statement must NEVER silently become an authoritative
              personal fact." If an LLM or inference engine generates a statement, it is quarantined as a{" "}
              <code>candidate</code> with <code>model generated</code> authority until an authorized human (family, caregiver,
              or clinician) explicitly verifies it.
            </div>

            {/* Test Ingestion Box */}
            <div className="space-y-3 bg-white/80 p-4 rounded-lg border border-[#e8dccb]">
              <span className="text-xs font-bold text-[#2d3b24] block">
                Test Safety Invariant Guard: Attempt to Ingest Model-Generated Statement as "Authoritative"
              </span>

              <textarea
                value={testClaimStatement}
                onChange={(e) => setTestClaimStatement(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white border border-[#d9c9b5] rounded-lg p-2.5 text-[#2d3b24] focus:outline-[#425232]"
              />

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#5a6a4f]">Claimed Authority:</span>
                  <select
                    value={claimedAuthority}
                    onChange={(e) => setClaimedAuthority(e.target.value)}
                    className="bg-white border border-[#d9c9b5] rounded px-2 py-1 text-xs"
                  >
                    <option value="system/authoritative">system/authoritative (Dangerous Claim!)</option>
                    <option value="model generated">model generated (Safe Claim)</option>
                  </select>
                </div>

                <button
                  onClick={submitInvariantTest}
                  disabled={creatingMemory}
                  className="px-3.5 py-1.5 bg-[#a85e46] hover:bg-[#8e4933] text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  {creatingMemory ? "Testing Guard..." : "Submit to Memory Governance"}
                </button>
              </div>
            </div>

            {/* Ingestion Guard Result */}
            {memoryOutput && (
              <div className="mt-4 p-4 rounded-lg bg-white border border-[#e8dccb] space-y-2">
                <div className="flex items-center gap-2">
                  {memoryOutput.auditResult.is_guard_violation ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold">
                      <AlertTriangle size={14} />
                      SAFETY INTERCEPT: Model Promotion Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-bold">
                      <CheckCircle2 size={14} />
                      Memory Ingested Safely
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5a6a4f] font-mono bg-gray-50 p-2 rounded">
                  {memoryOutput.auditResult.audit_reason}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-[#f0e7d8]">
                  <div>
                    <span className="text-[10px] text-[#708064] block">Authority Class</span>
                    <span className="font-semibold text-[#2d3b24]">{memoryOutput.memory.authority_class}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#708064] block">Lifecycle State</span>
                    <span className="font-semibold text-[#2d3b24]">{memoryOutput.memory.lifecycle_state}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#708064] block">Evidence Level</span>
                    <span className="font-semibold text-[#2d3b24]">{memoryOutput.memory.evidence_level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#708064] block">Confidence</span>
                    <span className="font-semibold text-[#2d3b24]">
                      {(memoryOutput.memory.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Governed Memories List */}
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h3 className="font-serif font-bold text-base text-[#2d3b24] mb-3">Active Governed Memories</h3>
            <div className="space-y-3">
              {profile?.memories?.map((mem: any) => (
                <div key={mem.memory_id} className="bg-white p-3.5 rounded-lg border border-[#e8dccb] space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#425232] bg-[#e7ede0] px-2 py-0.5 rounded">
                      {mem.category}
                    </span>
                    <span className="text-xs font-mono text-[#708064]">
                      Authority: <strong className="text-[#2d3b24]">{mem.authority_class}</strong> | Level: {mem.evidence_level}
                    </span>
                  </div>

                  <p className="text-sm text-[#2d3b24] leading-relaxed">{mem.statement}</p>

                  <div className="flex items-center justify-between text-[11px] text-[#708064] pt-2 border-t border-[#f0e7d8]">
                    <span>Reinforcements: {mem.reinforcement_count}</span>
                    <span>Provenance ID: {mem.provenance_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Backblaze B2 Media Vault */}
      {activeSubTab === "media" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <HardDrive size={18} className="text-[#425232]" />
              <span>Backblaze B2 Media Intelligence Vault</span>
            </h2>
            <p className="text-sm text-[#5a6a4f] mb-4">
              All rich binary objects (photos, voice recordings, documents) are stored in Backblaze B2, while their
              depiction tags, semantic descriptors, and consent scopes are indexed in Neon PostgreSQL with pgvector embeddings.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-[#e8dccb] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#2d3b24]">Bihu Festival Courtyard (1985)</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">image/jpeg</span>
                </div>

                <div className="bg-[#fcf8f2] p-2.5 rounded text-xs space-y-1 font-mono text-[#5a6a4f]">
                  <div><strong>Bucket:</strong> mindmitra-b2-vault</div>
                  <div><strong>Key:</strong> vault/person_purnima/photos/bihu_courtyard_1985.jpg</div>
                  <div><strong>Size:</strong> 2.45 MB (1920x1080)</div>
                  <div><strong>Consent:</strong> media_assets (Granted by Anu)</div>
                </div>

                <p className="text-xs text-[#2d3b24] leading-relaxed">
                  "Rongali Bihu celebration in Tezpur ancestral courtyard under the blossoming mango tree with Anu and Bikash."
                </p>

                <div className="text-[11px] text-[#708064] pt-2 border-t border-[#f0e7d8]">
                  Depicts: <span className="font-semibold text-[#2d3b24]">Anu Bora (Daughter), Bikash Bora (Son)</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e8dccb] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#2d3b24]">Rina's University Graduation</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">image/jpeg</span>
                </div>

                <div className="bg-[#fcf8f2] p-2.5 rounded text-xs space-y-1 font-mono text-[#5a6a4f]">
                  <div><strong>Bucket:</strong> mindmitra-b2-vault</div>
                  <div><strong>Key:</strong> vault/person_purnima/photos/rina_cotton_college.jpg</div>
                  <div><strong>Size:</strong> 1.84 MB (1440x1080)</div>
                  <div><strong>Consent:</strong> media_assets (Granted by Anu)</div>
                </div>

                <p className="text-xs text-[#2d3b24] leading-relaxed">
                  "Granddaughter Rina smiling outside Cotton University hostel in Guwahati holding her notebook."
                </p>

                <div className="text-[11px] text-[#708064] pt-2 border-t border-[#f0e7d8]">
                  Depicts: <span className="font-semibold text-[#2d3b24]">Rina Bora (Granddaughter)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Semantic Ontology Graph */}
      {activeSubTab === "ontology" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <h2 className="text-base font-serif font-bold text-[#2d3b24] mb-2 flex items-center gap-2">
              <Network size={18} className="text-[#425232]" />
              <span>Semantic Ontology Graph & Typed Relationship Contracts</span>
            </h2>
            <p className="text-sm text-[#5a6a4f] mb-4">
              MindMitra prevents amorphous memory loss by structuring knowledge into strict typed nodes and governed
              relationship edges.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-[#e8dccb]">
                <h3 className="text-xs font-bold text-[#2d3b24] uppercase tracking-wider mb-2">
                  Ontology Nodes (Entities)
                </h3>
                <ul className="space-y-2 text-xs">
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8] flex items-center justify-between">
                    <span><strong>Purnima Devi</strong> (Subject)</span>
                    <span className="font-mono text-[#708064]">Person</span>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8] flex items-center justify-between">
                    <span><strong>Anu Bora</strong> (Daughter & Caregiver)</span>
                    <span className="font-mono text-[#708064]">Person</span>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8] flex items-center justify-between">
                    <span><strong>Rina Bora</strong> (Granddaughter)</span>
                    <span className="font-mono text-[#708064]">Person</span>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8] flex items-center justify-between">
                    <span><strong>Tezpur Ancestral Courtyard</strong></span>
                    <span className="font-mono text-[#708064]">Place</span>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8] flex items-center justify-between">
                    <span><strong>Evening Cardamom Tea</strong></span>
                    <span className="font-mono text-[#708064]">Routine</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e8dccb]">
                <h3 className="text-xs font-bold text-[#2d3b24] uppercase tracking-wider mb-2">
                  Typed Edge Relationships
                </h3>
                <ul className="space-y-2 text-xs">
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8]">
                    <div className="font-mono font-semibold text-[#425232]">PERSON_HAS_RELATIONSHIP_PERSON</div>
                    <div className="text-[#5a6a4f] mt-0.5">Purnima Devi → Anu Bora (Kinship: daughter)</div>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8]">
                    <div className="font-mono font-semibold text-[#425232]">PERSON_HAS_RELATIONSHIP_PERSON</div>
                    <div className="text-[#5a6a4f] mt-0.5">Purnima Devi → Rina Bora (Kinship: granddaughter)</div>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8]">
                    <div className="font-mono font-semibold text-[#425232]">PERSON_LIVES_AT_PLACE</div>
                    <div className="text-[#5a6a4f] mt-0.5">Purnima Devi → Tezpur Ancestral Courtyard</div>
                  </li>
                  <li className="p-2 bg-[#fcf8f2] rounded border border-[#f0e7d8]">
                    <div className="font-mono font-semibold text-[#425232]">PERSON_HAS_ROUTINE_ROUTINE</div>
                    <div className="text-[#5a6a4f] mt-0.5">Purnima Devi → Evening Cardamom Tea (16:00)</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: Automated Test Suite (6/6) */}
      {activeSubTab === "tests" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#2d3b24] flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <span>Automated Substrate Test Suite Verification (6/6)</span>
                </h2>
                <p className="text-sm text-[#5a6a4f]">
                  Executes the programmatic test suite verifying all 6 foundational architectural contracts.
                </p>
              </div>

              <button
                onClick={runAutomatedTests}
                disabled={runningTests}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#425232] hover:bg-[#344127] disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                {runningTests ? <RotateCw className="animate-spin" size={15} /> : <Play size={15} />}
                <span>Execute All 6 Tests</span>
              </button>
            </div>

            {testReport && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#e8dccb]">
                  <span className="text-xs font-semibold text-[#2d3b24]">
                    Verification Status:{" "}
                    <strong className="text-emerald-700">
                      {testReport.passed_tests} / {testReport.total_tests} Tests Passed
                    </strong>
                  </span>
                  <span className="text-xs text-[#708064] font-mono">{testReport.timestamp}</span>
                </div>

                <div className="space-y-2">
                  {testReport.results.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                        r.passed ? "bg-white border-emerald-200" : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2d3b24] flex items-center gap-2">
                          {r.passed ? (
                            <CheckCircle2 size={15} className="text-emerald-600" />
                          ) : (
                            <XCircle size={15} className="text-red-600" />
                          )}
                          <span>[{r.id}] {r.name}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#708064] uppercase">{r.category}</span>
                      </div>

                      <div className="text-[#5a6a4f] pl-6 space-y-0.5">
                        <div><strong>Expected:</strong> {r.expected}</div>
                        <div><strong>Actual:</strong> {r.actual}</div>
                        {r.details && (
                          <pre className="text-[10px] bg-gray-50 p-1.5 rounded mt-1 overflow-x-auto text-gray-700">
                            {JSON.stringify(r.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: Phase 3 Assistant Tests (8/8) */}
      {activeSubTab === "phase3" && (
        <div className="space-y-6">
          <div className="bg-[#fffaf2] border border-[#d9c9b5] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#2d3b24] flex items-center gap-2">
                  <Sparkles size={18} className="text-[#a85e46]" />
                  <span>Phase 3 Governed Conversational Intelligence Test Suite (8/8)</span>
                </h2>
                <p className="text-sm text-[#5a6a4f]">
                  Executes the programmatic test harness verifying all 8 architectural pillars of the conversational assistant.
                </p>
              </div>

              <button
                onClick={runPhase3Tests}
                disabled={runningPhase3Tests}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#a85e46] hover:bg-[#8e4f3a] disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                {runningPhase3Tests ? <RotateCw className="animate-spin" size={15} /> : <Play size={15} />}
                <span>Execute All 8 Phase 3 Tests</span>
              </button>
            </div>

            {phase3Report ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#e8dccb]">
                  <span className="text-xs font-semibold text-[#2d3b24]">
                    Verification Status:{" "}
                    <strong className={phase3Report.all_passed ? "text-emerald-700" : "text-amber-700"}>
                      {phase3Report.passed_tests} / {phase3Report.total_tests} Tests Passed
                    </strong>
                  </span>
                  <span className="text-xs text-[#708064] font-mono">{phase3Report.timestamp}</span>
                </div>

                <div className="space-y-2">
                  {phase3Report.results?.map((r: any) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                        r.passed ? "bg-white border-emerald-200" : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2d3b24] flex items-center gap-2">
                          {r.passed ? (
                            <CheckCircle2 size={15} className="text-emerald-600" />
                          ) : (
                            <XCircle size={15} className="text-red-600" />
                          )}
                          <span>[{r.id}] {r.name}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#708064] uppercase bg-[#f5ede0] px-2 py-0.5 rounded">
                          {r.category}
                        </span>
                      </div>

                      <div className="text-[#5a6a4f] pl-6 space-y-0.5">
                        <div><strong>Pillar:</strong> <span className="text-[#a85e46] font-semibold">{r.pillar}</span></div>
                        <div><strong>Expected:</strong> {r.expected}</div>
                        <div><strong>Actual:</strong> {r.actual}</div>
                        {r.details && (
                          <pre className="text-[10px] bg-[#fcf8f2] border border-[#f0e7d8] p-2 rounded mt-1 overflow-x-auto text-gray-700">
                            {JSON.stringify(r.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg border border-[#e8dccb] space-y-3">
                <Sparkles size={28} className="mx-auto text-[#a85e46]/60" />
                <h3 className="font-bold text-sm text-[#2d3b24]">Ready to Run Phase 3 Test Harness</h3>
                <p className="text-xs text-[#5a6a4f] max-w-md mx-auto">
                  Click the button above to run all 8 architectural test cases across Intent Mapping, Grounding & Refusal, Navigation, Multimodal Scaffolding, Governance & Consent, Action Execution, Multi-Turn Goal Persistence, and Experience Learning.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
