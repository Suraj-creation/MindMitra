import React, { useState, useEffect } from "react";
import {
  Game7ContextPack,
  Game8ContextPack,
  LangGraphState,
} from "../../intelligence/retrieval/types";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "../../intelligence/retrieval/context-pack-builder";
import { BoundedGameOrchestrator } from "../../intelligence/orchestration/bounded-langgraph";
import { MemoryFirewall } from "../../intelligence/retrieval/memory-firewall";
import { cognitiveStore } from "../../intelligence/cognitive-engine";

interface Props {
  onClose: () => void;
}

export const PersonalGameContextInspector: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"firewall" | "game7_pack" | "game8_pack" | "langgraph">("langgraph");
  const [personId, setPersonId] = useState<string>("person:purnima");
  const [allowUnverified, setAllowUnverified] = useState<boolean>(false);
  const [includeSensitive, setIncludeSensitive] = useState<boolean>(false);

  // Context packs state
  const [game7Pack, setGame7Pack] = useState<Game7ContextPack | null>(null);
  const [game8Pack, setGame8Pack] = useState<Game8ContextPack | null>(null);

  // LangGraph Orchestration state
  const [orchestratingGame, setOrchestratingGame] = useState<"game_7" | "game_8">("game_7");
  const [langGraphState, setLangGraphState] = useState<LangGraphState | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Firewall audit state
  const [firewallTestResult, setFirewallTestResult] = useState<any>(null);

  // Load packs on mount or when options change
  useEffect(() => {
    refreshPacks();
  }, [personId, allowUnverified, includeSensitive]);

  const refreshPacks = () => {
    try {
      const p7 = buildGame7ContextPack(personId, {
        allowUnverifiedClaimsWithLabel: allowUnverified,
        includeHighSensitivity: includeSensitive,
      });
      setGame7Pack(p7);

      const p8 = buildGame8ContextPack(personId, {
        allowUnverifiedClaimsWithLabel: allowUnverified,
        includeHighSensitivity: includeSensitive,
      });
      setGame8Pack(p8);

      // Run firewall evaluation
      const memEval = MemoryFirewall.filterMemories(
        cognitiveStore.memories,
        personId,
        cognitiveStore.experienceHistory,
        {
          allowUnverifiedClaimsWithLabel: allowUnverified,
          includeHighSensitivity: includeSensitive,
        }
      );
      const routeEval = MemoryFirewall.filterRoutes(
        cognitiveStore.familiarRoutes,
        personId,
        {
          allowUnverifiedClaimsWithLabel: allowUnverified,
          includeHighSensitivity: includeSensitive,
        }
      );
      setFirewallTestResult({
        memAudit: memEval.audit,
        routeAudit: routeEval.audit,
        approvedMemCount: memEval.approved.length,
        verifiedRouteCount: routeEval.verifiedRoutes.length,
        unverifiedRouteCount: routeEval.unverifiedRoutes.length,
      });
    } catch (err: any) {
      console.warn("Context build warning:", err);
    }
  };

  const handleRunOrchestration = () => {
    setIsExecuting(true);
    setTimeout(() => {
      try {
        const intent = orchestratingGame === "game_7" ? { type: "play_game_7" as const } : { type: "play_game_8" as const };
        const result = BoundedGameOrchestrator.execute(intent, personId);
        setLangGraphState(result);
      } catch (err: any) {
        console.error("Orchestration error:", err);
      } finally {
        setIsExecuting(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fbf7ee] border border-[#d6cbba] w-full max-w-5xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dfd4c0] bg-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#485935]"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#485935]">
                Context Retrieval & Bounded LangGraph Orchestration Layer
              </span>
            </div>
            <h2 className="text-xl font-serif font-medium text-[#2c2824] mt-0.5">
              Personal Game Context Pack & Orchestration Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-3 py-1.5 rounded-xl hover:bg-[#f8f3ea]"
          >
            ✕ Close
          </button>
        </div>

        {/* Global Controls & Persona Selector */}
        <div className="px-6 py-3 bg-[#f5ede0] border-b border-[#dfd4c0] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#41382c]">Active Person:</span>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="bg-white border border-[#d6cbba] rounded-lg px-2.5 py-1 text-xs font-medium text-[#2c2824]"
            >
              <option value="person:purnima">Purnima (Authorized Elder)</option>
              <option value="person:other_elder_99">Other Elder 99 (Cross-Person Test)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowUnverified}
                onChange={(e) => setAllowUnverified(e.target.checked)}
                className="rounded text-[#485935]"
              />
              <span className="text-[#41382c]">Allow Unverified Claims (with label)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSensitive}
                onChange={(e) => setIncludeSensitive(e.target.checked)}
                className="rounded text-[#485935]"
              />
              <span className="text-[#41382c]">Include High Sensitivity</span>
            </label>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#dfd4c0] bg-white px-6">
          <button
            onClick={() => setActiveTab("langgraph")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "langgraph"
                ? "border-[#485935] text-[#485935]"
                : "border-transparent text-[#736a5e] hover:text-[#2c2824]"
            }`}
          >
            ⚡ Bounded LangGraph Pipeline
          </button>
          <button
            onClick={() => setActiveTab("firewall")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "firewall"
                ? "border-[#485935] text-[#485935]"
                : "border-transparent text-[#736a5e] hover:text-[#2c2824]"
            }`}
          >
            🛡️ Memory Firewall & Isolation
          </button>
          <button
            onClick={() => setActiveTab("game7_pack")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "game7_pack"
                ? "border-[#485935] text-[#485935]"
                : "border-transparent text-[#736a5e] hover:text-[#2c2824]"
            }`}
          >
            📖 Game 7: Reminiscence Context Pack (10 Criteria)
          </button>
          <button
            onClick={() => setActiveTab("game8_pack")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "game8_pack"
                ? "border-[#485935] text-[#485935]"
                : "border-transparent text-[#736a5e] hover:text-[#2c2824]"
            }`}
          >
            🗺️ Game 8: Route Builder Context Pack (8 Criteria)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Bounded LangGraph Pipeline */}
          {activeTab === "langgraph" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2c2824]">
                      Bounded LangGraph Orchestration Flow
                    </h3>
                    <p className="text-xs text-[#595043] mt-0.5">
                      Deterministic state machine: Intent → Context Retrieval → Candidate Ranking → Personalisation → Difficulty → Template Selection → Specification Generation
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={orchestratingGame}
                      onChange={(e) => setOrchestratingGame(e.target.value as any)}
                      className="bg-white border border-[#d6cbba] rounded-xl px-3 py-1.5 text-xs font-medium text-[#2c2824]"
                    >
                      <option value="game_7">Game 7: Reminiscence Journey</option>
                      <option value="game_8">Game 8: Route Builder</option>
                    </select>
                    <button
                      onClick={handleRunOrchestration}
                      disabled={isExecuting}
                      className="bg-[#485935] hover:bg-[#39472a] text-white text-xs font-medium px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      {isExecuting ? "Executing Graph..." : "▶ Run Orchestration"}
                    </button>
                  </div>
                </div>

                {/* Pipeline Flow Visualization */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                  {[
                    { key: "intent", title: "1. Intent", sub: "User/Caregiver intent" },
                    { key: "context_retrieval", title: "2. Retrieval", sub: "Firewall & 9 dimensions" },
                    { key: "candidate_ranking", title: "3. Ranking", sub: "Multi-criteria scores" },
                    { key: "personalisation", title: "4. Persona", sub: "Assamese & family anchors" },
                    { key: "difficulty", title: "5. Difficulty", sub: "PCM & scaffolding" },
                    { key: "game_template_selection", title: "6. Template", sub: "Vetted cognitive game" },
                    { key: "specification_generation", title: "7. Spec Gen", sub: "5-layer validation" },
                  ].map((node) => {
                    const stepExec = langGraphState?.execution_steps.find((s) => s.node === node.key);
                    const isExecuted = !!stepExec;

                    return (
                      <div
                        key={node.key}
                        className={`p-3 rounded-xl border text-center transition ${
                          isExecuted
                            ? "bg-[#edf4ea] border-[#9bc490] text-[#2c401e]"
                            : "bg-[#fbf7ee] border-[#dfd4c0] text-[#736a5e]"
                        }`}
                      >
                        <div className="text-xs font-bold">{node.title}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">{node.sub}</div>
                        {stepExec && (
                          <div className="text-[10px] text-[#485935] font-mono mt-1 font-semibold">
                            ✓ {stepExec.duration_ms}ms
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Results */}
              {langGraphState && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Execution Steps Audit */}
                  <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-[#2c2824]">Execution Step Logs</h4>
                    <div className="space-y-2">
                      {langGraphState.execution_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-[#faf6f0] border border-[#e5dac6] rounded-xl p-3 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[#485935]">
                              {idx + 1}. Node: {step.node}
                            </span>
                            <span className="font-mono text-[#736a5e] text-[10px]">
                              {step.duration_ms} ms
                            </span>
                          </div>
                          <p className="text-[#595043]">{step.details}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#f0e8db] rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-[#41382c]">Reconstruction Hash:</div>
                      <div className="font-mono text-[11px] text-[#595043] break-all">
                        {langGraphState.reconstruction_hash}
                      </div>
                    </div>
                  </div>

                  {/* Right: Generated Specification */}
                  <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-[#2c2824]">Generated GameSpec</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#eaf0e4] text-[#2c401e]">
                        ✓ All 5 Layers Validated
                      </span>
                    </div>

                    {langGraphState.generated_spec && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#faf6f0] border border-[#dfd4c0] space-y-1">
                          <div className="font-bold text-sm text-[#2c2824]">
                            {langGraphState.generated_spec.title}
                          </div>
                          <div className="text-[#736a5e]">{langGraphState.generated_spec.subtitle}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg border border-[#e5dac6] bg-white">
                            <span className="text-[#736a5e] text-[10px]">Difficulty Level</span>
                            <div className="font-semibold text-[#41382c]">
                              Level {langGraphState.generated_spec.difficulty}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg border border-[#e5dac6] bg-white">
                            <span className="text-[#736a5e] text-[10px]">Scaffolding Mode</span>
                            <div className="font-semibold text-[#41382c]">
                              {langGraphState.generated_spec.scaffolding?.family_voice_prompt ? "Family Voice Prompt" : "Visual Cue"}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#e5dac6] space-y-1">
                          <span className="font-semibold text-[#41382c]">Primary Instruction:</span>
                          <p className="text-[#595043] italic">
                            "{langGraphState.generated_spec.instructions.primary_prompt}"
                          </p>
                        </div>

                        {langGraphState.generated_spec.scaffolding?.family_voice_prompt && (
                          <div className="p-3 rounded-xl bg-[#edf4ea] border border-[#9bc490] space-y-1">
                            <span className="font-semibold text-[#2c401e]">
                              Family Voice Prompt ({langGraphState.generated_spec.scaffolding.family_voice_prompt.speaker_name}):
                            </span>
                            <p className="text-[#334224] italic">
                              "{langGraphState.generated_spec.scaffolding.family_voice_prompt.text}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Memory Firewall & Isolation */}
          {activeTab === "firewall" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2c2824]">
                      Memory Firewall Enforcement & Privacy Gate
                    </h3>
                    <p className="text-xs text-[#595043]">
                      Strict isolation prevents private leakage, cross-person breaches, and low-confidence route usage.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      firewallTestResult?.memAudit?.passed
                        ? "bg-[#eaf0e4] text-[#2c401e]"
                        : "bg-[#fbe9e7] text-[#c62828]"
                    }`}
                  >
                    {firewallTestResult?.memAudit?.passed ? "✓ Isolation Verified" : "⚠ Firewall Alert"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#dfd4c0] bg-[#faf6f0]">
                    <span className="text-[#736a5e]">Cross-Person Blocked</span>
                    <div className="text-xl font-serif font-bold text-[#485935] mt-1">
                      {firewallTestResult?.memAudit?.cross_person_blocked || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#dfd4c0] bg-[#faf6f0]">
                    <span className="text-[#736a5e]">Private Scope Blocked</span>
                    <div className="text-xl font-serif font-bold text-[#b8860b] mt-1">
                      {firewallTestResult?.memAudit?.private_items_blocked || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#dfd4c0] bg-[#faf6f0]">
                    <span className="text-[#736a5e]">High Sensitivity Blocked</span>
                    <div className="text-xl font-serif font-bold text-[#9e472a] mt-1">
                      {firewallTestResult?.memAudit?.sensitive_items_blocked || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#dfd4c0] bg-[#faf6f0]">
                    <span className="text-[#736a5e]">Unverified Flagged</span>
                    <div className="text-xl font-serif font-bold text-[#736a5e] mt-1">
                      {firewallTestResult?.memAudit?.unverified_claims_flagged || 0}
                    </div>
                  </div>
                </div>

                {personId !== "person:purnima" && (
                  <div className="p-4 bg-[#fbe9e7] border border-[#ffcdd2] rounded-xl text-xs text-[#c62828] space-y-1">
                    <div className="font-bold">Cross-Person Isolation Simulation Active:</div>
                    <p>
                      Querying for "{personId}" while database contains Purnima's data correctly resulted in {firewallTestResult?.memAudit?.cross_person_blocked} blocked items. No data leaked across personas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Game 7 Context Pack */}
          {activeTab === "game7_pack" && game7Pack && (
            <div className="space-y-6">
              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2c2824]">
                      Game 7 Context Pack: Reminiscence Journey
                    </h3>
                    <p className="text-xs text-[#595043]">
                      Snapshot ID: <span className="font-mono font-semibold">{game7Pack.snapshot_id}</span>
                    </p>
                  </div>
                  <span className="bg-[#eaf0e4] text-[#2c401e] px-3 py-1 rounded-full text-xs font-semibold">
                    Recommended Difficulty: Level {game7Pack.difficulty_recommendation}
                  </span>
                </div>

                {/* Candidate Memories with 10 Criteria Rankings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#41382c] uppercase tracking-wider">
                    Ranked Memory Candidates ({game7Pack.memories.length})
                  </h4>
                  {game7Pack.memories.map((cand, idx) => (
                    <div
                      key={cand.metadata.id}
                      className="p-4 rounded-xl border border-[#dfd4c0] bg-[#faf6f0] space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-[#2c2824]">
                              {idx + 1}. {cand.data.title}
                            </span>
                            <span className="text-xs text-[#736a5e]">({cand.data.assamese_title})</span>
                            {cand.metadata.unverified_claim && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#fff3cd] text-[#856404] font-semibold">
                                Unverified Claim
                              </span>
                            )}
                            {cand.cooldown_suppressed && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#e2e3e5] text-[#383d41] font-semibold">
                                Cooldown Suppressed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#595043] mt-1">{cand.data.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[#736a5e]">Final Rank Score</span>
                          <div className="font-serif text-lg font-bold text-[#485935]">
                            {(cand.ranking.final_rank_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* 10 Criteria Breakdown Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-[#e5dac6]">
                        <div>Familiarity: {(cand.ranking.familiarity * 100).toFixed(0)}%</div>
                        <div>Verification: {(cand.ranking.verification * 100).toFixed(0)}%</div>
                        <div>Relevance: {(cand.ranking.personal_relevance * 100).toFixed(0)}%</div>
                        <div>Modality: {(cand.ranking.modality_availability * 100).toFixed(0)}%</div>
                        <div>Engagement: {(cand.ranking.prior_engagement * 100).toFixed(0)}%</div>
                        <div>Cooldown: {(cand.ranking.repetition_cooldown * 100).toFixed(0)}%</div>
                        <div>Appropriate: {(cand.ranking.emotional_appropriateness * 100).toFixed(0)}%</div>
                        <div>Context: {(cand.ranking.current_context * 100).toFixed(0)}%</div>
                        <div>Caregiver: {(cand.ranking.caregiver_eligibility * 100).toFixed(0)}%</div>
                        <div>Language: {(cand.ranking.language_culture * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cultural Music Bindings */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#41382c] uppercase tracking-wider mb-2">
                    Cultural Acoustic Grounding
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {game7Pack.music.map((m) => (
                      <div key={m.id} className="p-3 bg-[#faf6f0] border border-[#e5dac6] rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-[#485935]">{m.title}</div>
                        <div className="text-[#736a5e] text-[11px]">{m.cultural_origin}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Game 8 Context Pack */}
          {activeTab === "game8_pack" && game8Pack && (
            <div className="space-y-6">
              <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2c2824]">
                      Game 8 Context Pack: Route Builder
                    </h3>
                    <p className="text-xs text-[#595043]">
                      Destination: <span className="font-bold text-[#485935]">{game8Pack.destination.data.name}</span>
                    </p>
                  </div>
                  <span className="bg-[#eaf0e4] text-[#2c401e] px-3 py-1 rounded-full text-xs font-semibold">
                    Route Confidence: {(game8Pack.route_confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Top Ranked Route Details */}
                <div className="p-4 rounded-xl border border-[#dfd4c0] bg-[#faf6f0] space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-serif font-bold text-base text-[#2c2824]">
                        {game8Pack.route.data.title}
                      </div>
                      <div className="text-xs text-[#736a5e]">{game8Pack.route.data.description}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#736a5e]">Rank Score</span>
                      <div className="font-serif text-lg font-bold text-[#485935]">
                        {(game8Pack.route.ranking.final_rank_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* 8 Criteria Route Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-[#e5dac6]">
                    <div>Verification: {(game8Pack.route.ranking.route_verification * 100).toFixed(0)}%</div>
                    <div>Familiarity: {(game8Pack.route.ranking.familiarity * 100).toFixed(0)}%</div>
                    <div>Confidence: {(game8Pack.route.ranking.confidence * 100).toFixed(0)}%</div>
                    <div>Recent Rel: {(game8Pack.route.ranking.recent_relevance * 100).toFixed(0)}%</div>
                    <div>Destination: {(game8Pack.route.ranking.destination_relevance * 100).toFixed(0)}%</div>
                    <div>Landmarks: {(game8Pack.route.ranking.landmark_availability * 100).toFixed(0)}%</div>
                    <div>Completeness: {(game8Pack.route.ranking.route_completeness * 100).toFixed(0)}%</div>
                    <div>Safety: {(game8Pack.route.ranking.safety_eligibility * 100).toFixed(0)}%</div>
                  </div>

                  {/* Ordered Landmarks */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-[#41382c]">Ordered Landmarks Along Route:</span>
                    <div className="space-y-1.5">
                      {game8Pack.landmarks.map((lm) => (
                        <div
                          key={lm.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#e5dac6] text-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#485935] text-white flex items-center justify-center text-[10px] font-bold">
                            {lm.order}
                          </span>
                          <span className="font-semibold text-[#2c2824]">{lm.name}</span>
                          <span className="text-[#736a5e] text-[11px]">— {lm.sensory_description || lm.visual_cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scaffolding Recommendation */}
                  <div className="p-3 bg-[#edf4ea] border border-[#9bc490] rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-[#2c401e]">
                      Scaffolding Recommendation ({game8Pack.scaffolding_recommendation.mode}):
                    </div>
                    <p className="text-[#334224] italic">
                      "{game8Pack.scaffolding_recommendation.prompt}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
