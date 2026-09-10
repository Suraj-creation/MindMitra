import React, { useState, useEffect } from "react";
import {
  GameExperienceSpecification,
  GameOutcome,
  ScaffoldingLevel,
  PreparationStepBinding,
  PreparationItemBinding,
} from "../types";
import { GameSessionRuntime } from "../runtime/game-session-runtime";
import { validateGameExperienceSpec } from "../validation/spec-validator";
import { resolveScaffoldingStep } from "../runtime/scaffolding-ladder";

interface Props {
  spec: GameExperienceSpecification;
  onComplete: (outcome: GameOutcome) => void;
  onExit?: () => void;
}

export const PrepareForEngine: React.FC<Props> = ({ spec, onComplete, onExit }) => {
  // 1. Deterministic Validation Check
  const validation = validateGameExperienceSpec(spec);
  if (!validation.valid) {
    return (
      <div id="prepare-engine-validation-error" className="w-full max-w-2xl mx-auto p-6 bg-[#fff4f2] border border-[#f5c2bb] rounded-2xl text-[#6e251a] space-y-4 font-sans">
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
  const bindings = validatedSpec.content_bindings;
  const event = bindings.event || {
    id: "evt_default",
    title: "Upcoming Family Occasion",
    scheduled_at: new Date().toISOString(),
    formatted_time: "4:00 PM",
    location: "Home",
  };

  const visitorChoices: Array<{
    id: string;
    name: string;
    relationship: string;
    photo_url: string;
    is_expected: boolean;
  }> = bindings.visitor_choices || [
    {
      id: "visitor_primary",
      name: event.visitor_name || "Beloved Family Member",
      relationship: event.relationship || "Family",
      photo_url: event.photo_url || "/assets/images/vintage_teacher_memory_1789020507713.jpg",
      is_expected: true,
    },
  ];

  const preparationSteps: PreparationStepBinding[] = bindings.preparation_steps || [];
  const preparationItems: PreparationItemBinding[] = bindings.preparation_items || [];

  // 2. Initialize Runtime State Machine
  const [runtime] = useState<GameSessionRuntime>(
    () => new GameSessionRuntime(validatedSpec, 4)
  );
  const [sessionState, setSessionState] = useState(runtime.getState());
  const [currentStage, setCurrentStage] = useState<
    "recognition" | "items" | "sequencing" | "reminder" | "celebration"
  >("recognition");

  // Stage 1: Recognition State
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [visitorAffirmed, setVisitorAffirmed] = useState<boolean>(false);

  // Stage 2: Items State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemsAffirmed, setItemsAffirmed] = useState<boolean>(false);

  // Stage 3: Step Sequencing State
  const [stepsOrder, setStepsOrder] = useState<PreparationStepBinding[]>([]);
  const [sequencingAffirmed, setSequencingAffirmed] = useState<boolean>(false);

  // Stage 4: Reminder / Action State
  const [reminderConfirmed, setReminderConfirmed] = useState<boolean>(false);
  const [callActive, setCallActive] = useState<boolean>(false);

  // Scaffolding & Control State
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ScaffoldingLevel>(
    validatedSpec.difficulty_config?.initial_scaffolding || "independent"
  );
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  useEffect(() => {
    runtime.start();
    setSessionState(runtime.getState());
    setStepStartTime(Date.now());

    // Shuffle preparation steps initially
    if (preparationSteps.length >= 2) {
      const shuffled = [...preparationSteps].sort(() => 0.5 - Math.random());
      setStepsOrder(shuffled);
    }
  }, []);

  // Scaffolding Cue Resolution
  const expectedVisitor = visitorChoices.find((v) => v.is_expected) || visitorChoices[0];
  const currentCue = resolveScaffoldingStep(scaffoldingLevel, {
    step_name: currentStage,
    primary_stimulus: validatedSpec.instructions.primary_prompt,
    contextual_text: validatedSpec.scaffolding.contextual_text_cue,
    family_voice_url: validatedSpec.scaffolding.family_voice_prompt?.audio_url,
    family_voice_speaker: validatedSpec.scaffolding.family_voice_prompt?.speaker_name,
    candidate_choices: visitorChoices.map((v) => v.id),
    target_id: expectedVisitor?.id,
  });

  // Stage 1: Recognition Selection
  const handleSelectVisitor = (visitorId: string) => {
    if (visitorAffirmed) return;
    const latency = Date.now() - stepStartTime;
    const isExpected = visitorId === expectedVisitor?.id;

    setSelectedVisitorId(visitorId);
    setVisitorAffirmed(true);

    runtime.recordTrial({
      step_name: "prepare_for_visitor_recognition",
      stimulus: `Recognizing upcoming visitor for ${event.title}`,
      user_selection: visitorId,
      is_affirmative_match: isExpected,
      latency_ms: latency,
      hint_used: scaffoldingLevel !== "independent",
      completion_state: isExpected ? "success" : "assisted",
    });
    setSessionState(runtime.getState());
  };

  // Stage 2: Item Selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleConfirmItems = () => {
    const latency = Date.now() - stepStartTime;
    setItemsAffirmed(true);

    runtime.recordTrial({
      step_name: "prepare_for_items_association",
      stimulus: "Selecting preparation items",
      user_selection: selectedItemIds.join(", "),
      is_affirmative_match: true,
      latency_ms: latency,
      hint_used: scaffoldingLevel !== "independent",
      completion_state: "success",
    });
    setSessionState(runtime.getState());
  };

  // Stage 3: Step Sequencing
  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stepsOrder.length) return;
    const updated = [...stepsOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setStepsOrder(updated);

    // Check if sorted in ascending order
    const isSorted = updated.every(
      (s, i) => i === 0 || s.step_number >= updated[i - 1].step_number
    );

    if (isSorted) {
      setSequencingAffirmed(true);
      const latency = Date.now() - stepStartTime;
      runtime.recordTrial({
        step_name: "prepare_for_steps_sequencing",
        stimulus: "Arranging hospitality preparation steps",
        user_selection: updated.map((s) => s.id).join(" -> "),
        is_affirmative_match: true,
        latency_ms: latency,
        hint_used: scaffoldingLevel !== "independent",
        completion_state: "success",
      });
      setSessionState(runtime.getState());
    }
  };

  // Stage 4: Reminder Action
  const handleToggleReminder = () => {
    setReminderConfirmed(true);
    const latency = Date.now() - stepStartTime;
    runtime.recordTrial({
      step_name: "prepare_for_reminder_action",
      stimulus: `Setting reminder for ${event.formatted_time || "event"}`,
      user_selection: "reminder_enabled",
      is_affirmative_match: true,
      latency_ms: latency,
      hint_used: false,
      completion_state: "success",
    });
    setSessionState(runtime.getState());
  };

  const handleInitiateCall = () => {
    setCallActive(true);
    setTimeout(() => {
      setCallActive(false);
    }, 4000);
  };

  // Scaffolding Request
  const handleRequestHint = () => {
    const next = runtime.requestScaffolding();
    setScaffoldingLevel(next);
    setSessionState(runtime.getState());

    if (next === "modality_shift" && validatedSpec.scaffolding.family_voice_prompt?.audio_url) {
      setAudioPlaying(true);
      setTimeout(() => setAudioPlaying(false), 3500);
    }
  };

  // Graceful Skip
  const handleGracefulSkip = () => {
    runtime.gracefulSkip(
      `prepare_for_${currentStage}`,
      "Gracefully advancing to next step of preparation"
    );
    setSessionState(runtime.getState());

    if (currentStage === "recognition") {
      setCurrentStage("items");
    } else if (currentStage === "items") {
      setCurrentStage("sequencing");
    } else if (currentStage === "sequencing") {
      setCurrentStage("reminder");
    } else {
      setCurrentStage("celebration");
    }
    setStepStartTime(Date.now());
  };

  const handleFinish = () => {
    const outcome = runtime.complete();
    onComplete(outcome);
  };

  return (
    <div
      id="prepare-for-runtime-engine"
      className="w-full max-w-5xl mx-auto font-sans space-y-6 pb-12 transition-all"
    >
      {/* ── HEADER & DIGNITY BAR ── */}
      <div className="bg-[#fcf9f2] border border-[#e8ded0] rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b8860b]"></span>
              <span className="text-xs font-semibold text-[#8b6508] uppercase tracking-wider">
                {validatedSpec.title}
              </span>
              <span className="text-xs text-[#736a5e]">• {event.formatted_time || "Today"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#2c2824] mt-1.5 font-medium">
              {event.title}
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

        {/* Scaffolding Guidance Banner */}
        {scaffoldingLevel !== "independent" && (
          <div className="mt-4 p-3.5 bg-[#fbf5e6] border border-[#e6d3a8] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#523d0c]">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🌼</span>
              <span>
                <strong>Gentle Guidance:</strong> {currentCue.display_text_cue}
              </span>
            </div>
            {currentCue.speaker_name && (
              <button
                onClick={() => setAudioPlaying(true)}
                className="px-3 py-1 bg-white border border-[#dfca98] rounded-lg text-xs font-medium text-[#8b6508] hover:bg-[#f6edd2] flex items-center gap-1.5"
              >
                <span>{audioPlaying ? "🔊 Playing..." : "▶ Hear Prompt"}</span>
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
            className="px-6 py-2.5 bg-[#8b6508] text-white rounded-xl text-sm font-medium hover:bg-[#705206] transition shadow-sm"
          >
            Resume Activity
          </button>
        </div>
      )}

      {/* ── STAGE 1: PROSPECTIVE VISITOR RECOGNITION ── */}
      {!isPaused && currentStage === "recognition" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#fcf9f2] border border-[#e8ded0] rounded-2xl text-xs text-[#595043]">
            Who is coming to visit you at {event.formatted_time || "home"} today? Tap their photo.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {visitorChoices.map((visitor) => (
              <div
                key={visitor.id}
                onClick={() => handleSelectVisitor(visitor.id)}
                className={`cursor-pointer rounded-3xl p-5 border-2 transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between ${
                  selectedVisitorId === visitor.id
                    ? "border-[#b8860b] bg-[#fdfaf3] shadow-md ring-2 ring-[#b8860b]/20"
                    : "border-[#e5dac6] bg-white hover:border-[#b8860b]/60 shadow-sm"
                }`}
              >
                <div className="space-y-4">
                  <div className="h-56 rounded-2xl overflow-hidden bg-[#eae3d5]">
                    <img
                      src={visitor.photo_url}
                      alt={visitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-medium text-[#2c2824]">
                      {visitor.name}
                    </h3>
                    <p className="text-xs text-[#736a5e] font-serif">{visitor.relationship}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0e8db] flex items-center justify-between">
                  <span className="text-xs text-[#736a5e]">Expected Visit</span>
                  <span className="text-xs font-semibold text-[#8b6508]">Tap to select</span>
                </div>
              </div>
            ))}
          </div>

          {visitorAffirmed && (
            <div className="p-6 bg-[#fdfaf3] border border-[#dfcaa0] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-[#b8860b]">✨</span>
                <div>
                  <h4 className="font-serif font-medium text-[#2c2824] text-base">
                    Warm Anticipation
                  </h4>
                  <p className="text-xs text-[#705206]">
                    You have warmly recognized your guest. Now let's gather the comforting items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  runtime.advanceStep();
                  setCurrentStage("items");
                  setStepStartTime(Date.now());
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#8b6508] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#705206] shadow-sm transition"
              >
                Gather Preparation Items →
              </button>
            </div>
          )}

          {!visitorAffirmed && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRequestHint}
                className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-white hover:bg-[#f6eee2] text-xs font-medium text-[#595043] transition flex items-center gap-2"
              >
                <span>💡</span>
                <span>Need a gentle hint?</span>
              </button>
              <button
                onClick={handleGracefulSkip}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#736a5e] hover:text-[#2c2824] hover:bg-[#f6eee2] transition"
              >
                Skip gracefully
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 2: ITEMS SELECTION PRIMITIVE ── */}
      {!isPaused && currentStage === "items" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#fcf9f2] border border-[#e8ded0] rounded-2xl text-xs text-[#595043]">
            Select the familiar hospitality items to have ready for the visit:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {preparationItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition duration-200 flex flex-col items-center text-center gap-3 ${
                    isSelected
                      ? "border-[#b8860b] bg-[#fdfaf3] shadow-sm ring-1 ring-[#b8860b]/30"
                      : "border-[#e5dac6] bg-white hover:border-[#b8860b]/60"
                  }`}
                >
                  <span className="text-3xl">{item.icon || "🍵"}</span>
                  <div>
                    <h4 className="font-serif font-medium text-sm text-[#2c2824]">{item.label}</h4>
                    {item.assamese_label && (
                      <p className="text-xs text-[#736a5e] font-serif">{item.assamese_label}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#8b6508]">
                    {isSelected ? "✓ Included" : "Tap to add"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ede4d4]">
            <button
              onClick={handleRequestHint}
              className="px-4 py-2.5 rounded-xl border border-[#d6cbba] bg-white hover:bg-[#f6eee2] text-xs font-medium text-[#595043] transition flex items-center gap-2"
            >
              <span>💡</span>
              <span>Need guidance?</span>
            </button>

            <button
              onClick={() => {
                handleConfirmItems();
                runtime.advanceStep();
                setCurrentStage("sequencing");
                setStepStartTime(Date.now());
              }}
              className="px-6 py-3 bg-[#8b6508] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#705206] shadow-sm transition"
            >
              Continue to Preparation Steps →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: STEP SEQUENCING PRIMITIVE ── */}
      {!isPaused && currentStage === "sequencing" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#fcf9f2] border border-[#e8ded0] rounded-2xl text-xs text-[#595043]">
            Arrange these preparation steps in order from first to last using the arrow buttons:
          </div>

          <div className="space-y-3">
            {stepsOrder.map((step, idx) => (
              <div
                key={step.id}
                className="p-4 bg-white border border-[#dfd4c0] rounded-2xl shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fdf5e2] text-[#8b6508] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-sm text-[#2c2824]">{step.label}</h4>
                    {step.detail && <p className="text-xs text-[#736a5e]">{step.detail}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, "up")}
                    className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      idx === 0
                        ? "border-[#ede4d4] text-[#b5a997] cursor-not-allowed bg-[#faf7f2]"
                        : "border-[#d6cbba] text-[#8b6508] bg-white hover:bg-[#f6eee2]"
                    }`}
                  >
                    ▲ Up
                  </button>
                  <button
                    disabled={idx === stepsOrder.length - 1}
                    onClick={() => moveStep(idx, "down")}
                    className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      idx === stepsOrder.length - 1
                        ? "border-[#ede4d4] text-[#b5a997] cursor-not-allowed bg-[#faf7f2]"
                        : "border-[#d6cbba] text-[#8b6508] bg-white hover:bg-[#f6eee2]"
                    }`}
                  >
                    ▼ Down
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
              <span>Need help sequencing?</span>
            </button>

            <button
              onClick={() => {
                runtime.advanceStep();
                setCurrentStage("reminder");
                setStepStartTime(Date.now());
              }}
              className="px-6 py-3 bg-[#8b6508] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#705206] shadow-sm transition"
            >
              Continue to Reminder & Contact →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 4: REMINDER ACTION PRIMITIVE ── */}
      {!isPaused && currentStage === "reminder" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-[#dfd4c0] rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xl font-serif text-[#2c2824] font-medium">
              Peaceful Reminder for Today
            </h3>
            <p className="text-xs text-[#595043]">
              We can sound a gentle bell 15 minutes before {event.formatted_time || "4:00 PM"} so you can comfortably start boiling the kettle.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={handleToggleReminder}
                className={`px-5 py-3 rounded-2xl text-xs font-semibold border transition ${
                  reminderConfirmed
                    ? "bg-[#eef5e6] text-[#334224] border-[#bcd3a6]"
                    : "bg-[#fdfaf3] text-[#8b6508] border-[#dfcaa0] hover:bg-[#f8f1de]"
                }`}
              >
                {reminderConfirmed ? "✓ Gentle Bell Reminder Set" : "🔔 Set 3:45 PM Gentle Bell Reminder"}
              </button>

              {event.phone_number && (
                <button
                  onClick={handleInitiateCall}
                  className="px-5 py-3 rounded-2xl text-xs font-semibold bg-white border border-[#d6cbba] text-[#595043] hover:bg-[#f6eee2] transition flex items-center gap-2"
                >
                  <span>📞</span>
                  <span>{callActive ? "Connecting Call..." : `Call ${expectedVisitor?.name || "Visitor"}`}</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                runtime.advanceStep();
                setCurrentStage("celebration");
              }}
              className="px-6 py-3 bg-[#8b6508] text-white rounded-2xl text-xs font-semibold tracking-wide hover:bg-[#705206] shadow-sm transition"
            >
              View Preparation Summary →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 5: CELEBRATION PRIMITIVE ── */}
      {!isPaused && currentStage === "celebration" && (
        <div className="p-8 bg-[#fcf9f2] border border-[#e8ded0] rounded-3xl space-y-6 text-center animate-fade-in shadow-sm">
          <span className="text-4xl">🍵</span>
          <h3 className="text-3xl font-serif text-[#2c2824] font-medium">
            {validatedSpec.instructions.success_celebration}
          </h3>
          <p className="text-sm text-[#595043] max-w-xl mx-auto leading-relaxed">
            Everything is in harmony. Your visitor will feel cherished, and your home is filled with warmth and hospitality.
          </p>

          <div className="pt-6">
            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-[#8b6508] text-white rounded-2xl text-sm font-semibold tracking-wide hover:bg-[#705206] shadow-md transition"
            >
              Complete Preparation & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
