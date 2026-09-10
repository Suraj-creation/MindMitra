import React, { useState } from "react";
import {
  GameExperienceSpecification,
  GameOutcome,
  SpecValidationResult,
} from "../types";
import { validateGameExperienceSpec } from "../validation/spec-validator";
import { defaultTemplateRegistry } from "../templates/registry";
import { MyLifeTimelineEngine } from "../engines/MyLifeTimelineEngine";
import { PrepareForEngine } from "../engines/PrepareForEngine";
import {
  staticTimelineSpecLevelA,
  personalisedPrepareForSpecLevelB,
  dynamicComposedTimelineSpecLevelC,
} from "../specs/sample-specs";

// Sample deliberately malformed spec for validation testing
const malformedSpecSample: any = {
  id: "spec_malformed_test",
  person_id: "person:test",
  template_key: "non_existent_template",
  title: "Malformed Spec Test",
  difficulty: 99, // Out of bounds
  modality: "unsupported_modality",
  content_bindings: {},
  instructions: {
    primary_prompt: "You failed this test and got wrong answer!", // Violates dignity & prohibited terms
    // Missing success_celebration
  },
};

export const GameRuntimeHarness: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<
    "level_a" | "level_b" | "level_c" | "malformed" | "custom"
  >("level_a");

  const [activeSpec, setActiveSpec] = useState<GameExperienceSpecification>(staticTimelineSpecLevelA);
  const [customSpecJson, setCustomSpecJson] = useState<string>(
    JSON.stringify(staticTimelineSpecLevelA, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Validation state
  const [validationResult, setValidationResult] = useState<SpecValidationResult>(
    validateGameExperienceSpec(staticTimelineSpecLevelA)
  );

  // Engine execution state
  const [runningEngine, setRunningEngine] = useState<"timeline" | "prepare" | "none">("none");
  const [completedOutcome, setCompletedOutcome] = useState<GameOutcome | null>(null);

  const handleSelectPreset = (preset: "level_a" | "level_b" | "level_c" | "malformed") => {
    setSelectedPreset(preset);
    let targetSpec: any;
    if (preset === "level_a") targetSpec = staticTimelineSpecLevelA;
    else if (preset === "level_b") targetSpec = personalisedPrepareForSpecLevelB;
    else if (preset === "level_c") targetSpec = dynamicComposedTimelineSpecLevelC;
    else targetSpec = malformedSpecSample;

    setActiveSpec(targetSpec);
    setCustomSpecJson(JSON.stringify(targetSpec, null, 2));
    setJsonError(null);
    const res = validateGameExperienceSpec(targetSpec);
    setValidationResult(res);
    setRunningEngine("none");
    setCompletedOutcome(null);
  };

  const handleJsonChange = (text: string) => {
    setCustomSpecJson(text);
    try {
      const parsed = JSON.parse(text);
      setActiveSpec(parsed);
      setJsonError(null);
      const res = validateGameExperienceSpec(parsed);
      setValidationResult(res);
    } catch (e: any) {
      setJsonError(e.message);
      setValidationResult({
        valid: false,
        errors: [`JSON_PARSE_ERROR: ${e.message}`],
        warnings: [],
      });
    }
  };

  const handleLaunchEngine = () => {
    if (!validationResult.valid || !validationResult.validated_spec) return;
    const key = validationResult.validated_spec.template_key;
    if (key === "my_life_timeline") {
      setRunningEngine("timeline");
    } else if (key === "prepare_for") {
      setRunningEngine("prepare");
    } else {
      setRunningEngine("timeline");
    }
    setCompletedOutcome(null);
  };

  const handleComplete = (outcome: GameOutcome) => {
    setRunningEngine("none");
    setCompletedOutcome(outcome);
  };

  return (
    <div id="game-runtime-harness" className="w-full max-w-6xl mx-auto space-y-8 p-4 font-sans">
      {/* ── HARNESS HEADER ── */}
      <div className="bg-[#fcf9f2] border border-[#e8ded0] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#485935]"></span>
              <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                Personal Game Runtime Harness
              </span>
              <span className="text-xs text-[#736a5e]">• Deterministic Template Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#2c2824] mt-1">
              Specification Validator & Engine Runtime
            </h1>
            <p className="text-xs sm:text-sm text-[#595043] mt-1 max-w-2xl">
              LLMs generate structured Game Experience Specifications. The runtime deterministically validates and executes them via known engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#736a5e]">Registered Templates:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#d6cbba] text-xs font-mono font-semibold text-[#485935]">
              {defaultTemplateRegistry.list().length}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#ede4d4]">
          <button
            onClick={() => handleSelectPreset("level_a")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              selectedPreset === "level_a"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f6eee2] border border-[#d6cbba]"
            }`}
          >
            Level A: Static Deterministic (Timeline)
          </button>
          <button
            onClick={() => handleSelectPreset("level_b")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              selectedPreset === "level_b"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f6eee2] border border-[#d6cbba]"
            }`}
          >
            Level B: Parametrically Personalised (Prepare-For)
          </button>
          <button
            onClick={() => handleSelectPreset("level_c")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              selectedPreset === "level_c"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f6eee2] border border-[#d6cbba]"
            }`}
          >
            Level C: Dynamically Composed (Autobiographical Braid)
          </button>
          <button
            onClick={() => handleSelectPreset("malformed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              selectedPreset === "malformed"
                ? "bg-[#8b2b1d] text-white shadow-sm"
                : "bg-white text-[#8b2b1d] hover:bg-[#fdf0ed] border border-[#f5c2bb]"
            }`}
          >
            Test Rejection: Malformed Spec
          </button>
        </div>
      </div>

      {/* ── ACTIVE ENGINE RENDERING ── */}
      {runningEngine === "timeline" && validationResult.validated_spec && (
        <div className="p-6 bg-white border border-[#e8ded0] rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#f0e8db]">
            <span className="text-xs font-semibold text-[#485935] uppercase">
              Executing Engine: MyLifeTimelineEngine
            </span>
            <button
              onClick={() => setRunningEngine("none")}
              className="text-xs text-[#736a5e] hover:text-[#2c2824]"
            >
              ✕ Exit Runtime
            </button>
          </div>
          <MyLifeTimelineEngine
            spec={validationResult.validated_spec}
            onComplete={handleComplete}
            onExit={() => setRunningEngine("none")}
          />
        </div>
      )}

      {runningEngine === "prepare" && validationResult.validated_spec && (
        <div className="p-6 bg-white border border-[#e8ded0] rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#f0e8db]">
            <span className="text-xs font-semibold text-[#8b6508] uppercase">
              Executing Engine: PrepareForEngine
            </span>
            <button
              onClick={() => setRunningEngine("none")}
              className="text-xs text-[#736a5e] hover:text-[#2c2824]"
            >
              ✕ Exit Runtime
            </button>
          </div>
          <PrepareForEngine
            spec={validationResult.validated_spec}
            onComplete={handleComplete}
            onExit={() => setRunningEngine("none")}
          />
        </div>
      )}

      {/* ── VALIDATION STATUS & CONTROLS (WHEN ENGINE NOT RUNNING) ── */}
      {runningEngine === "none" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spec Editor Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-medium text-base text-[#2c2824]">
                  Game Experience Specification (JSON)
                </h3>
                <span className="text-xs text-[#736a5e]">Deterministic Input</span>
              </div>
              <textarea
                value={customSpecJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={18}
                className="w-full font-mono text-xs p-3.5 bg-[#faf8f5] border border-[#d6cbba] rounded-xl text-[#2c2824] focus:outline-none focus:ring-1 focus:ring-[#485935]"
              />
              {jsonError && (
                <div className="p-3 bg-[#fff4f2] border border-[#f5c2bb] rounded-xl text-xs text-red-700 font-mono">
                  {jsonError}
                </div>
              )}
            </div>
          </div>

          {/* Validation Report & Launch Column */}
          <div className="space-y-4">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-medium text-base text-[#2c2824]">
                  Validation Verdict
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    validationResult.valid
                      ? "bg-[#eaf3e3] text-[#334224] border border-[#c4e0b4]"
                      : "bg-[#fff1ef] text-[#8b2b1d] border border-[#f5c2bb]"
                  }`}
                >
                  {validationResult.valid ? "PASSED (VALID)" : "REJECTED"}
                </span>
              </div>

              {/* Status Checks */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f0e8db]">
                  <span className="text-[#736a5e]">Template Match:</span>
                  <span className="font-mono text-[#2c2824]">
                    {validationResult.template_matched || "None"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0e8db]">
                  <span className="text-[#736a5e]">Modality Allowed:</span>
                  <span className="font-mono text-[#2c2824]">{activeSpec.modality || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0e8db]">
                  <span className="text-[#736a5e]">Difficulty Level:</span>
                  <span className="font-mono text-[#2c2824]">{activeSpec.difficulty || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0e8db]">
                  <span className="text-[#736a5e]">Dignity Contract:</span>
                  <span className="text-[#485935] font-semibold">Enforced (Zero Failure States)</span>
                </div>
              </div>

              {/* Errors List */}
              {validationResult.errors.length > 0 && (
                <div className="p-3 bg-[#fff4f2] border border-[#f5c2bb] rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-[#8b2b1d] block">
                    Rejection Reasons ({validationResult.errors.length}):
                  </span>
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-700 font-mono">
                      • {err}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings List */}
              {validationResult.warnings.length > 0 && (
                <div className="p-3 bg-[#fffdf0] border border-[#eddba8] rounded-xl space-y-1">
                  <span className="text-xs font-bold text-[#8b6508] block">Warnings:</span>
                  {validationResult.warnings.map((warn, i) => (
                    <div key={i} className="text-xs text-[#8b6508] font-mono">
                      • {warn}
                    </div>
                  ))}
                </div>
              )}

              {/* Launch Button */}
              <button
                disabled={!validationResult.valid}
                onClick={handleLaunchEngine}
                className={`w-full py-3 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm ${
                  validationResult.valid
                    ? "bg-[#485935] text-white hover:bg-[#39472a]"
                    : "bg-[#e5dac6] text-[#8c8273] cursor-not-allowed"
                }`}
              >
                Launch Deterministic Engine →
              </button>
            </div>

            {/* Completed Outcome Card */}
            {completedOutcome && (
              <div className="bg-[#fcf9f2] border border-[#dfd4c0] rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-semibold text-[#485935] uppercase">
                  Session Completed
                </span>
                <h4 className="font-serif font-medium text-sm text-[#2c2824]">
                  {completedOutcome.celebration_message}
                </h4>
                <div className="space-y-1 text-xs text-[#595043]">
                  <div>Total Trials: <strong>{completedOutcome.total_trials}</strong></div>
                  <div>Avg Latency: <strong>{completedOutcome.average_latency_ms} ms</strong></div>
                  <div>Engagement: <strong>{(completedOutcome.engagement_score * 100).toFixed(0)}%</strong></div>
                  <div>Assistance Rate: <strong>{(completedOutcome.scaffolding_assistance_rate * 100).toFixed(0)}%</strong></div>
                </div>
                <div className="p-2.5 bg-white border border-[#dfd4c0] rounded-xl text-[11px] font-mono text-[#595043]">
                  Episode ID: {completedOutcome.experience_episode.id}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
