import React, { useState, useEffect, useRef } from "react";
import {
  GameExperienceSpecification,
  GameOutcome,
  ScaffoldingLevel,
  TimelineMilestoneBinding,
} from "../types";
import { GameSessionRuntime } from "../runtime/game-session-runtime";
import { validateGameExperienceSpec } from "../validation/spec-validator";
import { resolveScaffoldingStep } from "../runtime/scaffolding-ladder";

interface Props {
  spec: GameExperienceSpecification;
  onComplete: (outcome: GameOutcome) => void;
  onExit?: () => void;
}

export const MyLifeTimelineEngine: React.FC<Props> = ({ spec, onComplete, onExit }) => {
  // 1. Deterministic Validation Check
  const validation = validateGameExperienceSpec(spec);
  if (!validation.valid) {
    return (
      <div id="timeline-engine-validation-error" className="w-full max-w-2xl mx-auto p-6 bg-[#fff4f2] border border-[#f5c2bb] rounded-2xl text-[#6e251a] space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-serif font-bold">Game Specification Rejected</h3>
            <p className="text-xs text-[#8c3529]">
              The runtime rejected this specification deterministically before execution.
            </p>
          </div>
        </div>
        <div className="bg-white/80 p-3 rounded-xl border border-[#f5c2bb] text-xs font-mono space-y-1">
          {validation.errors.map((err, i) => (
            <div key={i} className="text-red-700 font-semibold">• {err}</div>
          ))}
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="px-4 py-2 bg-[#6e251a] text-white text-xs rounded-xl font-medium hover:bg-[#521c13] transition"
          >
            Return to Space
          </button>
        )}
      </div>
    );
  }

  const validatedSpec = validation.validated_spec!;
  const milestones: TimelineMilestoneBinding[] =
    validatedSpec.content_bindings.milestones || [];

  // 2. Initialize Runtime State Machine
  const [runtime] = useState<GameSessionRuntime>(
    () => new GameSessionRuntime(validatedSpec, 2)
  );
  const [sessionState, setSessionState] = useState(runtime.getState());
  const [activeStage, setActiveStage] = useState<"comparison" | "ordering" | "celebration">("comparison");

  // Comparison State
  const [comparisonChoice, setComparisonChoice] = useState<string | null>(null);
  const [comparisonAffirmed, setComparisonAffirmed] = useState<boolean>(false);

  // Ordering State
  const [currentOrder, setCurrentOrder] = useState<TimelineMilestoneBinding[]>([]);
  const [orderingAffirmed, setOrderingAffirmed] = useState<boolean>(false);

  // Scaffolding & Assistance State
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ScaffoldingLevel>(
    validatedSpec.difficulty_config?.initial_scaffolding || "independent"
  );
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize order on mount
  useEffect(() => {
    runtime.start();
    setSessionState(runtime.getState());
    setStepStartTime(Date.now());

    // Shuffle or prepare initial milestones for ordering
    if (milestones.length >= 2) {
      const shuffled = [...milestones].sort(() => 0.5 - Math.random());
      setCurrentOrder(shuffled);
    }
  }, []);

  // Comparison pair resolution (data-driven)
  const comparisonPair = validatedSpec.content_bindings.comparison_pair || (
    milestones.length >= 2
      ? {
          first_milestone_id: milestones[0].id,
          second_milestone_id: milestones[1].id,
          earlier_milestone_id:
            milestones[0].chronological_order < milestones[1].chronological_order
              ? milestones[0].id
              : milestones[1].id,
          stimulus_prompt: `Which of these two cherished times happened earlier in your journey?`,
        }
      : null
  );

  const cardA = milestones.find((m) => m.id === comparisonPair?.first_milestone_id);
  const cardB = milestones.find((m) => m.id === comparisonPair?.second_milestone_id);

  // Resolve current scaffolding cue
  const currentCue = resolveScaffoldingStep(scaffoldingLevel, {
    step_name: activeStage,
    primary_stimulus: validatedSpec.instructions.primary_prompt,
    contextual_text: validatedSpec.scaffolding.contextual_text_cue,
    family_voice_url: validatedSpec.scaffolding.family_voice_prompt?.audio_url,
    family_voice_speaker: validatedSpec.scaffolding.family_voice_prompt?.speaker_name,
    family_voice_transcript: validatedSpec.scaffolding.family_voice_prompt?.text,
    target_id: comparisonPair?.earlier_milestone_id,
  });

  // Handle User Choice in Comparison
  const handleComparisonSelect = (selectedId: string) => {
    if (comparisonAffirmed) return;
    const latency = Date.now() - stepStartTime;
    const isEarlier = selectedId === comparisonPair?.earlier_milestone_id;

    setComparisonChoice(selectedId);
    setComparisonAffirmed(true);

    // Record trial into deterministic runtime
    runtime.recordTrial({
      step_name: "timeline_chronological_comparison",
      stimulus: comparisonPair?.stimulus_prompt || "Milestone Comparison",
      user_selection: selectedId,
      is_affirmative_match: isEarlier,
      latency_ms: latency,
      hint_used: scaffoldingLevel !== "independent",
      completion_state: isEarlier ? "success" : "assisted",
    });
    setSessionState(runtime.getState());
  };

  // Move ordering cards
  const moveCard = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;
    const updated = [...currentOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCurrentOrder(updated);

    // Check if sorted in ascending chronological order
    const isSorted = updated.every(
      (m, i) => i === 0 || m.chronological_order >= updated[i - 1].chronological_order
    );

    if (isSorted) {
      setOrderingAffirmed(true);
      const latency = Date.now() - stepStartTime;
      runtime.recordTrial({
        step_name: "timeline_milestones_sequencing",
        stimulus: "Ordering life milestones",
        user_selection: updated.map((m) => m.id).join(" -> "),
        is_affirmative_match: true,
        latency_ms: latency,
        hint_used: scaffoldingLevel !== "independent",
        completion_state: "success",
      });
      setSessionState(runtime.getState());
    }
  };

  // Request Scaffolding (Advance along ladder)
  const handleRequestHint = () => {
    const next = runtime.requestScaffolding();
    setScaffoldingLevel(next);
    setSessionState(runtime.getState());

    // If modality shift, trigger audio playback
    if (next === "modality_shift" && validatedSpec.scaffolding.family_voice_prompt?.audio_url) {
      handlePlayVoice();
    }
  };

  // Graceful Skip
  const handleGracefulSkip = () => {
    runtime.gracefulSkip(
      activeStage === "comparison" ? "timeline_comparison" : "timeline_ordering",
      "Gracefully advancing to next memory reflection"
    );
    setSessionState(runtime.getState());

    if (activeStage === "comparison") {
      setActiveStage("ordering");
      setStepStartTime(Date.now());
    } else {
      handleProceedToCelebration();
    }
  };

  // Audio note playback
  const handlePlayVoice = () => {
    setAudioPlaying(true);
    setTimeout(() => {
      setAudioPlaying(false);
    }, 3500);
  };

  // Proceed to next stage
  const handleProceedToOrdering = () => {
    runtime.advanceStep();
    setActiveStage("ordering");
    setStepStartTime(Date.now());
    setComparisonChoice(null);
    setComparisonAffirmed(false);
    setScaffoldingLevel("independent");
  };

  const handleProceedToCelebration = () => {
    runtime.advanceStep();
    setActiveStage("celebration");
    // Sort items chronologically for the final warm celebration view
    const sorted = [...milestones].sort(
      (a, b) => a.chronological_order - b.chronological_order
    );
    setCurrentOrder(sorted);
  };

  const handleFinish = () => {
    const outcome = runtime.complete();
    onComplete(outcome);
  };

  return (
    <div
      id="my-life-timeline-runtime-engine"
      className="w-full max-w-5xl mx-auto font-sans space-y-6 pb-12 transition-all"
    >
      {/* ── TOP CONTROL & DIGNITY HEADER BAR ── */}
      <div className="bg-[#fcf9f2] border border-[#e8ded0] rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#485935]"></span>
              <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                {validatedSpec.title}
              </span>
              {validatedSpec.subtitle && (
                <span className="text-xs text-[#736a5e]">• {validatedSpec.subtitle}</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#2c2824] mt-1.5 font-medium">
              {validatedSpec.instructions.primary_prompt}
            </h2>
            <p className="text-xs sm:text-sm text-[#595043] mt-1 max-w-2xl">
              {validatedSpec.objective}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1.5 rounded-xl border border-[#d6cbba] bg-white text-[#595043] text-xs font-medium hover:bg-[#f6eee2] transition"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="px-3 py-1.5 rounded-xl border border-[#d6cbba] bg-white text-[#736a5e] hover:text-[#2c2824] text-xs font-medium hover:bg-[#f6eee2] transition"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Scaffolding Banner & Gentle Cue */}
        {scaffoldingLevel !== "independent" && (
          <div className="mt-4 p-3.5 bg-[#f5efe3] border border-[#dfd2be] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#4a3f33]">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🌿</span>
              <span>
                <strong>Gentle Guidance:</strong> {currentCue.display_text_cue}
              </span>
            </div>
            {currentCue.speaker_name && (
              <button
                onClick={handlePlayVoice}
                className="px-3 py-1 bg-white border border-[#d6cbba] rounded-lg text-xs font-medium text-[#485935] hover:bg-[#eae0cf] flex items-center gap-1.5"
              >
                <span>{audioPlaying ? "🔊 Playing..." : "▶ Hear Voice"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── PAUSE OVERLAY ── */}
      {isPaused && (
        <div className="bg-[#fbf7ee] border border-[#dcd1be] rounded-3xl p-8 text-center space-y-4 shadow-md">
          <h3 className="text-xl font-serif text-[#2c2824]">Activity Paused</h3>
          <p className="text-sm text-[#615647]">
            Take your time. Whenever you are ready, tap below to continue smoothly.
          </p>
          <button
            onClick={() => setIsPaused(false)}
            className="px-6 py-2.5 bg-[#485935] text-white rounded-xl text-sm font-medium hover:bg-[#39472a] transition shadow-sm"
          >
            Resume Activity
          </button>
        </div>
      )}

      {/* ── STAGE 1: 2-CHOICE COMPARISON PRIMITIVE ── */}
      {!isPaused && activeStage === "comparison" && cardA && cardB && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A */}
            <div
              onClick={() => handleComparisonSelect(cardA.id)}
              className={`cursor-pointer rounded-3xl p-5 border-2 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between ${
                comparisonChoice === cardA.id
                  ? "border-[#485935] bg-[#f7f9f4] shadow-md ring-2 ring-[#485935]/20"
                  : "border-[#e5dac6] bg-white hover:border-[#485935]/60 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#eae3d5]">
                  <img
                    src={cardA.photo_url}
                    alt={cardA.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-medium text-[#2c2824]">
                    {cardA.title}
                  </h3>
                  {cardA.assamese_title && (
                    <p className="text-sm text-[#736a5e] font-serif">{cardA.assamese_title}</p>
                  )}
                  {scaffoldingLevel !== "independent" && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#f0e8db] text-[#595043] rounded-full text-xs font-semibold">
                      Around {cardA.approximate_year} ({cardA.era_label})
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0e8db] flex items-center justify-between">
                <span className="text-xs text-[#736a5e]">{cardA.era_label}</span>
                <span className="text-xs font-semibold text-[#485935]">Tap to select</span>
              </div>
            </div>

            {/* Card B */}
            <div
              onClick={() => handleComparisonSelect(cardB.id)}
              className={`cursor-pointer rounded-3xl p-5 border-2 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between ${
                comparisonChoice === cardB.id
                  ? "border-[#485935] bg-[#f7f9f4] shadow-md ring-2 ring-[#485935]/20"
                  : "border-[#e5dac6] bg-white hover:border-[#485935]/60 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#eae3d5]">
                  <img
                    src={cardB.photo_url}
                    alt={cardB.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-medium text-[#2c2824]">
                    {cardB.title}
                  </h3>
                  {cardB.assamese_title && (
                    <p className="text-sm text-[#736a5e] font-serif">{cardB.assamese_title}</p>
                  )}
                  {scaffoldingLevel !== "independent" && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#f0e8db] text-[#595043] rounded-full text-xs font-semibold">
                      Around {cardB.approximate_year} ({cardB.era_label})
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0e8db] flex items-center justify-between">
                <span className="text-xs text-[#736a5e]">{cardB.era_label}</span>
                <span className="text-xs font-semibold text-[#485935]">Tap to select</span>
              </div>
            </div>
          </div>

          {/* Affirmation & Proceed Bar */}
          {comparisonAffirmed && (
            <div className="p-6 bg-[#f4f7f0] border border-[#c8d9bc] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-[#485935]">✨</span>
                <div>
                  <h4 className="font-serif font-medium text-[#2c2824] text-base">
                    Wonderful Reflection
                  </h4>
                  <p className="text-xs text-[#4c5c3b]">
                    You have warmly connected these two moments of your life story.
                  </p>
                </div>
              </div>
              <button
                onClick={handleProceedToOrdering}
                className="w-full sm:w-auto px-6 py-3 bg-[#485935] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#39472a] shadow-sm transition"
              >
                Continue to Timeline →
              </button>
            </div>
          )}

          {/* Assistance & Skip Controls */}
          {!comparisonAffirmed && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRequestHint}
                className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-white hover:bg-[#f6eee2] text-xs font-medium text-[#595043] transition flex items-center gap-2 shadow-sm"
              >
                <span>💡</span>
                <span>
                  {scaffoldingLevel === "independent"
                    ? "Need a gentle clue?"
                    : "Show more assistance"}
                </span>
              </button>

              <button
                onClick={handleGracefulSkip}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#736a5e] hover:text-[#2c2824] hover:bg-[#f6eee2] transition"
              >
                Skip gently without penalty
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 2: SEQUENCING & ORDERING PRIMITIVE ── */}
      {!isPaused && activeStage === "ordering" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#fcf9f2] border border-[#e8ded0] rounded-2xl text-xs text-[#595043]">
            Arrange these milestones in order from earliest to later years. Use the arrows to move items.
          </div>

          <div className="space-y-4">
            {currentOrder.map((milestone, idx) => (
              <div
                key={milestone.id}
                className="p-4 bg-white border border-[#dfd4c0] rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-[#f0e8db] text-[#485935] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#e8e0d2] shrink-0">
                    <img
                      src={milestone.photo_url}
                      alt={milestone.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-base text-[#2c2824]">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-[#736a5e]">
                      {milestone.era_label} • Approx. {milestone.approximate_year}
                    </p>
                  </div>
                </div>

                {/* Reorder Tap Controls (Minimum 48px target) */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveCard(idx, "up")}
                    className={`min-w-[48px] min-h-[48px] px-3 py-2 rounded-xl text-xs font-semibold border ${
                      idx === 0
                        ? "border-[#ede4d4] text-[#b5a997] cursor-not-allowed bg-[#faf7f2]"
                        : "border-[#d6cbba] text-[#485935] bg-white hover:bg-[#f6eee2]"
                    }`}
                  >
                    ▲ Earlier
                  </button>
                  <button
                    disabled={idx === currentOrder.length - 1}
                    onClick={() => moveCard(idx, "down")}
                    className={`min-w-[48px] min-h-[48px] px-3 py-2 rounded-xl text-xs font-semibold border ${
                      idx === currentOrder.length - 1
                        ? "border-[#ede4d4] text-[#b5a997] cursor-not-allowed bg-[#faf7f2]"
                        : "border-[#d6cbba] text-[#485935] bg-white hover:bg-[#f6eee2]"
                    }`}
                  >
                    ▼ Later
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ede4d4]">
            <button
              onClick={handleRequestHint}
              className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-white hover:bg-[#f6eee2] text-xs font-medium text-[#595043] transition flex items-center gap-2"
            >
              <span>💡</span>
              <span>Need help ordering?</span>
            </button>

            <button
              onClick={handleProceedToCelebration}
              className="px-6 py-3 bg-[#485935] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#39472a] shadow-sm transition"
            >
              Confirm Timeline & Reflect →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: CELEBRATION & COMPLETION PRIMITIVE ── */}
      {!isPaused && activeStage === "celebration" && (
        <div className="p-8 bg-[#fcf9f2] border border-[#e8ded0] rounded-3xl space-y-6 text-center animate-fade-in shadow-sm">
          <span className="text-4xl">🌸</span>
          <h3 className="text-3xl font-serif text-[#2c2824] font-medium">
            {validatedSpec.instructions.success_celebration}
          </h3>
          <p className="text-sm text-[#595043] max-w-xl mx-auto leading-relaxed">
            Your life journey is rich with memory, learning, and family love. Each milestone stands honored in its rightful place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            {currentOrder.map((m, idx) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-[#dfd4c0] shadow-sm space-y-2">
                <div className="h-32 rounded-xl overflow-hidden bg-[#e8e0d2]">
                  <img src={m.photo_url} alt={m.title} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-semibold text-[#485935]">Step {idx + 1}</span>
                <h4 className="text-sm font-serif font-medium text-[#2c2824]">{m.title}</h4>
                <p className="text-xs text-[#736a5e]">{m.approximate_year}</p>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-[#485935] text-white rounded-2xl text-sm font-semibold tracking-wide hover:bg-[#39472a] shadow-md transition"
            >
              Complete Experience & Save Memory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
