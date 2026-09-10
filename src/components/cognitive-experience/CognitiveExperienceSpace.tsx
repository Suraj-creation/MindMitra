import React, { useState, useEffect } from "react";
import { MyLifeTimelineEngine } from "./MyLifeTimelineEngine";
import { PrepareForEngine } from "./PrepareForEngine";
import { ExperienceBraidEngine } from "./ExperienceBraidEngine";
import { SaveMemoryStudio } from "./SaveMemoryStudio";
import { CognitiveTelemetryInspector } from "./CognitiveTelemetryInspector";
import { GameRuntimeHarness } from "../../game-runtime/harness/GameRuntimeHarness";
import { GameTrialTelemetry, MemoryItem, GameSpec } from "../../domain/cognitive-experience";

interface Props {
  onBackToDay?: () => void;
}

export const CognitiveExperienceSpace: React.FC<Props> = ({ onBackToDay }) => {
  const [activeEngine, setActiveEngine] = useState<"none" | "timeline" | "prepare" | "braid" | "garland">("none");
  const [showMemoryStudio, setShowMemoryStudio] = useState<boolean>(false);
  const [showTelemetryInspector, setShowTelemetryInspector] = useState<boolean>(false);
  const [showGameHarness, setShowGameHarness] = useState<boolean>(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  // Orchestration state
  const [orchestratedSpec, setOrchestratedSpec] = useState<GameSpec | null>(null);
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);

  // Garland state (preserved gentle sensory activity)
  const [garlandFlowers, setGarlandFlowers] = useState<string[]>([]);
  const [flutePlaying, setFlutePlaying] = useState<boolean>(false);

  const fetchDynamicOrchestration = async () => {
    setIsOrchestrating(true);
    try {
      const res = await fetch("/v1/cognitive-studio/orchestrate-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          intent: "meaningful morning companion session with autobiographical and prospective grounding",
          generation_mode: "dynamically_composed_level_c",
          preferred_template: "experience_braid",
        }),
      });
      const data = await res.json();
      if (data.compiled_spec) {
        setOrchestratedSpec(data.compiled_spec);
      }
    } catch (err) {
      console.error("Failed to dynamically orchestrate experience:", err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  useEffect(() => {
    fetchDynamicOrchestration();
  }, []);

  const handleEngineComplete = async (telemetry: GameTrialTelemetry[], summary: string) => {
    setActiveEngine("none");
    setCompletionBanner(`Completed: ${summary}`);

    // Synthesize experience episode to backend
    try {
      await fetch("/v1/cognitive-studio/sessions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          template_key: activeEngine === "timeline" ? "my_life_timeline" : activeEngine === "prepare" ? "prepare_for" : "experience_braid",
          objective: summary,
          engagement_score: 0.95,
          assistance_rate: 0.1,
          domain: activeEngine === "timeline" ? "autobiographical_memory" : "executive_planning",
        }),
      });
    } catch (err) {
      console.error("Failed to record completed session:", err);
    }

    setTimeout(() => {
      setCompletionBanner(null);
    }, 6000);
  };

  const handleAddFlower = (type: string) => {
    if (garlandFlowers.length < 9) {
      setGarlandFlowers((prev) => [...prev, type]);
    }
  };

  return (
    <div id="cognitive-experience-space" className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      {/* Modals & Inspectors */}
      {showMemoryStudio && (
        <SaveMemoryStudio
          onClose={() => setShowMemoryStudio(false)}
          onMemoryAdded={(mem: MemoryItem) => {
            setCompletionBanner(`Memory "${mem.title}" saved to your sanctuary.`);
          }}
        />
      )}

      {showTelemetryInspector && (
        <CognitiveTelemetryInspector onClose={() => setShowTelemetryInspector(false)} />
      )}

      {showGameHarness && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf8f5] w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#e8ded0] p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#ede4d4]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎮</span>
                <span className="font-serif font-bold text-lg text-[#2c2824]">
                  Personal Game Runtime Inspector & Test Harness
                </span>
              </div>
              <button
                onClick={() => setShowGameHarness(false)}
                className="px-3 py-1.5 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold text-[#736a5e] hover:text-[#2c2824] transition"
              >
                ✕ Close Harness
              </button>
            </div>
            <GameRuntimeHarness />
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {completionBanner && (
        <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-2xl p-4 text-center text-xs sm:text-sm shadow-sm transition">
          {completionBanner}
        </div>
      )}

      {/* ── ACTIVE DETERMINISTIC ENGINE VIEWS ── */}
      {activeEngine === "timeline" && (
        <MyLifeTimelineEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
        />
      )}

      {activeEngine === "prepare" && (
        <PrepareForEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
        />
      )}

      {activeEngine === "braid" && (
        <ExperienceBraidEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
          spec={orchestratedSpec || undefined}
        />
      )}

      {/* ── GENTLE FLOWER GARLAND SENSORY VIEW ── */}
      {activeEngine === "garland" && (
        <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="bg-[#485935]/15 text-[#334224] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Sensory Calm & Fine Motor Comfort
              </span>
              <h2 className="text-2xl font-serif text-[#2c2824] mt-2 font-medium">
                Altar Flower Garland <span className="text-lg font-normal text-[#605546]">(পূজাৰ ফুলৰ মালা)</span>
              </h2>
              <p className="text-[#595043] text-sm mt-1">
                Weave fresh golden marigolds and jasmine blossoms for the morning altar.
              </p>
            </div>
            <button
              onClick={() => setActiveEngine("none")}
              className="text-xs font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-4 py-2 rounded-xl"
            >
              ← Back to Space
            </button>
          </div>

          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 text-center space-y-6 shadow-sm">
            <div className="h-44 w-full rounded-2xl bg-[#eae3d5] overflow-hidden relative">
              <img
                src="/assets/images/assamese_courtyard_1788980055319.jpg"
                alt="Courtyard Garden"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs font-serif">Morning courtyard sun over Tezpur</span>
              </div>
            </div>

            {/* Garland String Visualization */}
            <div className="min-h-[90px] p-4 bg-[#f8f3ea] border-2 border-dashed border-[#d6cbba] rounded-2xl flex items-center justify-center gap-3 flex-wrap">
              {garlandFlowers.length === 0 ? (
                <span className="text-xs text-[#736a5e] italic">
                  Tap the blossoms below to weave your morning garland
                </span>
              ) : (
                garlandFlowers.map((flower, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-full bg-white border border-[#d6cbba] shadow-sm flex items-center justify-center text-xs font-serif font-bold text-[#485935]"
                  >
                    {flower === "marigold" ? "🌼" : flower === "jasmine" ? "🌸" : "🌿"}
                  </div>
                ))
              )}
            </div>

            {/* Flower Picker */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleAddFlower("marigold")}
                className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-[#fffdfa] hover:bg-[#f6eee2] text-xs font-medium text-[#41382c] shadow-sm transition flex items-center gap-2"
              >
                <span>🌼 Golden Marigold (গেন্দা)</span>
              </button>
              <button
                onClick={() => handleAddFlower("jasmine")}
                className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-[#fffdfa] hover:bg-[#f6eee2] text-xs font-medium text-[#41382c] shadow-sm transition flex items-center gap-2"
              >
                <span>🌸 Sweet Jasmine (বকুল)</span>
              </button>
              <button
                onClick={() => handleAddFlower("tulsi")}
                className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-[#fffdfa] hover:bg-[#f6eee2] text-xs font-medium text-[#41382c] shadow-sm transition flex items-center gap-2"
              >
                <span>🌿 Sacred Tulsi Leaf (তুলসী)</span>
              </button>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setFlutePlaying(!flutePlaying)}
                className="px-4 py-2 rounded-xl bg-[#f0e8db] text-[#41382c] text-xs font-medium border border-[#d6cbba] hover:bg-[#e8decd] transition"
              >
                {flutePlaying ? "⏸ Pause Flute" : "▶ Play Courtyard Flute"}
              </button>
              <button
                onClick={() => setGarlandFlowers([])}
                className="px-4 py-2 rounded-xl border border-[#d6cbba] text-[#736a5e] text-xs font-medium hover:bg-white transition"
              >
                Reset Garland
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOME VIEW: PERSONAL COGNITIVE EXPERIENCE SPACE ── */}
      {activeEngine === "none" && (
        <>
          {/* Empathetic Greeting & Rationale Bar */}
          <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#485935]"></span>
                  <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                    Personal Cognitive Space
                  </span>
                  <span className="text-xs text-[#736a5e]">• Tezpur, Assam</span>
                </div>
                <h1 className="text-3xl font-serif text-[#2c2824] mt-2 font-medium">
                  Let's Do Something <span className="text-xl font-normal text-[#605546]">(আহক একেলগে কিবা এটা কৰোঁ)</span>
                </h1>
                <p className="text-base text-[#453d33] font-serif mt-1">
                  “Here is something meaningful we can do together, Aitâ.”
                </p>
                <div className="mt-3 inline-block bg-[#f0e8db] text-[#595043] text-xs px-3.5 py-1.5 rounded-xl border border-[#dfd4c0]">
                  <strong>Current Focus:</strong> Morning Reminiscence & Preparing for Granddaughter Rina's 4:00 PM Visit.
                </div>
              </div>

              {/* Utility Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setShowMemoryStudio(true)}
                  className="bg-[#485935] text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#39472a] transition shadow-sm flex items-center gap-2"
                >
                  <span>📷 Preserve a Memory</span>
                </button>
                <button
                  onClick={() => setShowTelemetryInspector(true)}
                  className="bg-white border border-[#d6cbba] text-[#41382c] text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#f8f3ea] transition shadow-sm"
                >
                  <span>🔬 Clinical & Intelligence Inspector</span>
                </button>
                <button
                  onClick={() => setShowGameHarness(true)}
                  className="bg-white border border-[#d6cbba] text-[#485935] text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#f8f3ea] transition shadow-sm flex items-center gap-1.5"
                >
                  <span>🎮 Game Runtime Harness</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── FEATURED RECOMMENDED BRAID: PAST, PRESENT & 4 PM VISIT ── */}
          <div className="bg-[#faf6f0] border-2 border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-6 sm:p-8 shadow-sm transition duration-200">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div
                onClick={() => setActiveEngine("braid")}
                className="w-full lg:w-1/3 h-56 rounded-2xl overflow-hidden bg-[#e8e0d2] relative shadow-inner cursor-pointer"
              >
                <img
                  src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                  alt="Experience Braid"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-[#2c2824]/85 text-[#f5ebd7] text-xs px-3 py-1 rounded-full font-serif backdrop-blur-sm">
                  {isOrchestrating ? "Orchestrating..." : "Agentic Multi-Step RAG"}
                </div>
              </div>

              <div className="w-full lg:w-2/3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#9e472a]/15 text-[#732a15] text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                      Experience Braid
                    </span>
                    <span className="text-xs text-[#736a5e]">
                      {orchestratedSpec ? "Level C: Dynamically Composed" : "Multi-Phase Journey"}
                    </span>
                  </div>
                  <button
                    onClick={fetchDynamicOrchestration}
                    disabled={isOrchestrating}
                    className="text-[11px] text-[#485935] hover:text-[#2c2824] bg-white border border-[#d6cbba] px-3 py-1 rounded-lg transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <span>{isOrchestrating ? "Re-tuning..." : "✨ Re-tune Experience"}</span>
                  </button>
                </div>
                <h3
                  onClick={() => setActiveEngine("braid")}
                  className="text-2xl font-serif font-medium text-[#2c2824] cursor-pointer hover:text-[#485935] transition"
                >
                  {orchestratedSpec?.title || "Past, Present & Granddaughter Rina's 4:00 PM Visit"}
                </h3>
                <p className="text-sm text-[#595043] leading-relaxed">
                  {orchestratedSpec?.description || "A seamless journey starting with your 1968 wedding memories, bringing calm orientation to your sunny courtyard today, and getting ready for Rina's afternoon tea."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#485935]">
                    Estimated time: 4 - 6 minutes • 2-Choice Cognitive Comfort
                  </span>
                  <button
                    onClick={() => setActiveEngine("braid")}
                    className="bg-[#485935] text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-[#384629] transition shadow-sm"
                  >
                    Begin Journey together →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── DETERMINISTIC EXPERIENCE ENGINE SELECTION GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Experience 1: My Life Timeline */}
            <div
              onClick={() => setActiveEngine("timeline")}
              className="cursor-pointer bg-white border border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2]">
                  <img
                    src="/assets/images/vintage_teacher_memory_1789020507713.jpg"
                    alt="Teaching Days"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#485935]">Autobiographical Sequencing</span>
                  <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                    My Life Timeline <span className="text-xs font-normal text-[#736a5e]">(জীৱনৰ স্মৃতিৰেখা)</span>
                  </h4>
                  <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                    Compare photographs from your teaching career and wedding day. Supported by family voice notes from Anu and Rina.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs">
                <span className="text-[#736a5e]">Deterministic Engine A</span>
                <span className="font-semibold text-[#485935]">Open Timeline →</span>
              </div>
            </div>

            {/* Experience 2: Prepare-For Visit */}
            <div
              onClick={() => setActiveEngine("prepare")}
              className="cursor-pointer bg-white border border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2]">
                  <img
                    src="/assets/images/assamese_tea_ceremony_1789020488707.jpg"
                    alt="Tea Ceremony"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#b8860b]">Prospective Orientation</span>
                  <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                    Prepare-For: 4 PM Visit <span className="text-xs font-normal text-[#736a5e]">(প্ৰস্তুতি)</span>
                  </h4>
                  <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                    Step-by-step tea tray preparation, setting a 3:45 PM reminder, and sending a warm greeting to Rina before her arrival.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs">
                <span className="text-[#736a5e]">Deterministic Engine B</span>
                <span className="font-semibold text-[#b8860b]">Start Preparation →</span>
              </div>
            </div>

            {/* Experience 3: Courtyard Sensory Calm */}
            <div
              onClick={() => setActiveEngine("garland")}
              className="cursor-pointer bg-white border border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2]">
                  <img
                    src="/assets/images/assamese_courtyard_1788980055319.jpg"
                    alt="Courtyard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#485935]">Sensory Comfort</span>
                  <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                    Altar Flower Garland <span className="text-xs font-normal text-[#736a5e]">(পূজাৰ ফুল)</span>
                  </h4>
                  <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                    Weave fresh golden marigolds and sweet jasmine blossoms while listening to peaceful Brahmaputra morning flute raga.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs">
                <span className="text-[#736a5e]">Sensory Engine</span>
                <span className="font-semibold text-[#485935]">Weave Garland →</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
