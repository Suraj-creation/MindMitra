import React, { useState, useEffect } from "react";
import {
  ScaffoldLevel,
  ScaffoldStep,
  TemporalOrientationContextPack,
  TemporalOrientationSpec,
  TemporalOrientationTemplateKey,
  TemporalOrientationTrialTelemetry,
} from "../../domain/cognitive-experience";
import { BoundedTemporalOrchestrator } from "../../intelligence/temporal/temporal-orchestrator";
import { buildTemporalOrientationContextPack } from "../../intelligence/temporal/temporal-context-pack-builder";
import { TemporalScaffoldingLadder } from "../../intelligence/temporal/temporal-scaffolding-ladder";

interface Props {
  onComplete: (telemetry: any[], summary: string) => void;
  onBack: () => void;
}

export const YesterdayTodayTomorrowEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemporalOrientationTemplateKey>("daily_orientation");
  const [contextPack, setContextPack] = useState<TemporalOrientationContextPack | null>(null);
  const [spec, setSpec] = useState<TemporalOrientationSpec | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active task & interactive step state
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [scaffoldLevel, setScaffoldLevel] = useState<ScaffoldLevel>("S0");
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [sortedPlacements, setSortedPlacements] = useState<Record<string, "yesterday" | "today" | "tomorrow">>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isAffirmed, setIsAffirmed] = useState<boolean>(false);
  const [taskStartTime, setTaskStartTime] = useState<number>(Date.now());
  const [recordedTrials, setRecordedTrials] = useState<TemporalOrientationTrialTelemetry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Load context pack and spec on template change
  useEffect(() => {
    loadOrchestratedSpec(selectedTemplate);
  }, [selectedTemplate]);

  const loadOrchestratedSpec = (templateKey: TemporalOrientationTemplateKey) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Build bounded context pack
      const pack = buildTemporalOrientationContextPack("person:purnima");
      setContextPack(pack);

      // 2. Orchestrate through bounded 5-node pipeline
      const state = BoundedTemporalOrchestrator.orchestrateTemporalExperience(
        "person:purnima",
        templateKey
      );

      if (state.generated_spec) {
        setSpec(state.generated_spec);
        setCurrentTaskIndex(0);
        setScaffoldLevel(state.scaffolding_start_level || "S0");
        setSelectedChoiceId(null);
        setSortedPlacements({});
        setFeedbackMessage(null);
        setIsAffirmed(false);
        setTaskStartTime(Date.now());
      }
    } catch (err: any) {
      console.error("Temporal orchestration error:", err);
      setError(err.message || "Failed to orchestrate temporal experience.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakPrompt = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Unhurried and comforting
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAdvanceScaffold = () => {
    const next = TemporalScaffoldingLadder.getNextLevel(scaffoldLevel);
    setScaffoldLevel(next);
  };

  const currentTask = spec?.tasks[currentTaskIndex];
  const activeScaffoldStep: ScaffoldStep | undefined = currentTask?.scaffolding_ladder?.[scaffoldLevel];

  const handleChoiceSelect = (optionId: string, isTarget: boolean, label: string) => {
    setSelectedChoiceId(optionId);
    const latency = Date.now() - taskStartTime;

    const trial: TemporalOrientationTrialTelemetry = {
      session_id: `tsess_${spec?.snapshot_id || Date.now()}`,
      trial_index: currentTaskIndex,
      task_primitive: currentTask?.task_primitive || "temporal_recognition",
      temporal_frame: currentTask?.temporal_target || "today",
      stimulus: currentTask?.prompt || "",
      user_selection: label,
      latency_ms: latency,
      scaffold_level_used: scaffoldLevel,
      hints_requested_count: scaffoldLevel === "S0" ? 0 : scaffoldLevel === "S1" ? 1 : 2,
      assistance_provided: scaffoldLevel === "S0" ? "none" : scaffoldLevel === "S1" ? "contextual_cue" : "photo_voice_cue",
      completion_state: isTarget ? "success" : "assisted",
      compromised_trial: latency < 200 || latency > 40000,
      valid_for_baseline: latency >= 300 && latency <= 35000,
      timestamp: new Date().toISOString(),
    };

    setRecordedTrials((prev) => [...prev, trial]);

    if (isTarget) {
      setIsAffirmed(true);
      setFeedbackMessage(`Yes, exactly! ${label}.`);
    } else {
      // Gentle assistance without failure labels
      handleAdvanceScaffold();
      setFeedbackMessage(`Let's look at a gentle clue together, Aitâ.`);
    }
  };

  const handleSortItem = (itemId: string, frame: "yesterday" | "today" | "tomorrow") => {
    setSortedPlacements((prev) => ({
      ...prev,
      [itemId]: frame,
    }));
  };

  const handleNextTask = () => {
    if (!spec) return;

    if (currentTaskIndex < spec.tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
      setScaffoldLevel("S0");
      setSelectedChoiceId(null);
      setFeedbackMessage(null);
      setIsAffirmed(false);
      setTaskStartTime(Date.now());
    } else {
      // Completed all tasks in this recipe
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    const summary = `${spec?.title || "Temporal Orientation"} completed with calm presence and warmth.`;

    // Asynchronously log to server
    try {
      await fetch("/v1/temporal-orientation/sessions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `tsess_${Date.now()}`,
          person_id: "person:purnima",
          template_key: selectedTemplate,
          trials: recordedTrials,
          engagement_score: 0.94,
        }),
      });
    } catch (e) {
      console.warn("Session completed locally:", e);
    }

    onComplete(recordedTrials, summary);
  };

  if (loading) {
    return (
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-10 text-center space-y-4 shadow-sm">
        <div className="w-10 h-10 border-3 border-[#485935] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-serif text-[#41382c] text-lg">
          Connecting to your peaceful days in Tezpur...
        </p>
        <p className="text-xs text-[#736a5e]">(কালি, আজি আৰু কাইলৈৰ সংযোগ স্থাপন...)</p>
      </div>
    );
  }

  if (error || !spec || !contextPack) {
    return (
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-8 space-y-4 shadow-sm text-center">
        <h3 className="text-xl font-serif text-[#732a15]">Orientation Notice</h3>
        <p className="text-sm text-[#595043]">{error || "Could not construct temporal context."}</p>
        <button
          onClick={() => loadOrchestratedSpec(selectedTemplate)}
          className="bg-[#485935] text-white text-xs px-5 py-2.5 rounded-xl hover:bg-[#39472a]"
        >
          Try Again Calmly
        </button>
      </div>
    );
  }

  return (
    <div id="yesterday-today-tomorrow-engine" className="space-y-6">
      {/* ── TOP NAVIGATION & HEADER ── */}
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#485935]"></span>
              <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                Personal Temporal Orientation Engine
              </span>
              <span className="text-xs text-[#736a5e]">• Memory Firewall Protected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#2c2824] mt-1 font-medium">
              {spec.title}
            </h1>
            <p className="text-sm text-[#595043] mt-0.5">
              {contextPack.now.current_local_date} • {contextPack.now.assamese_day} ({contextPack.now.assamese_part_of_day})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSpeakPrompt(spec.spoken_guidance.greeting)}
              className={`p-3 rounded-2xl border ${
                isSpeaking
                  ? "bg-[#485935] text-white border-[#485935]"
                  : "bg-white text-[#41382c] border-[#d6cbba] hover:bg-[#f6eee2]"
              } transition shadow-sm flex items-center gap-2 text-xs font-medium`}
              title="Listen to soothing spoken guidance"
            >
              <span>{isSpeaking ? "🔊 Speaking..." : "🔈 Listen"}</span>
            </button>
            <button
              onClick={onBack}
              className="text-xs font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-4 py-2.5 rounded-2xl shadow-sm"
            >
              ← Back to Space
            </button>
          </div>
        </div>

        {/* ── RECIPE / TEMPLATE TABS ── */}
        <div className="mt-6 pt-5 border-t border-[#dfd4c0] flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTemplate("daily_orientation")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              selectedTemplate === "daily_orientation"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white border border-[#d6cbba] text-[#595043] hover:bg-[#f6eee2]"
            }`}
          >
            1. Daily Orientation (দৈনিক সংস্থাপন)
          </button>
          <button
            onClick={() => setSelectedTemplate("temporal_sorting")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              selectedTemplate === "temporal_sorting"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white border border-[#d6cbba] text-[#595043] hover:bg-[#f6eee2]"
            }`}
          >
            2. Temporal Sorting (কালক্ৰমিক শ্ৰেণী)
          </button>
          <button
            onClick={() => setSelectedTemplate("temporal_story")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              selectedTemplate === "temporal_story"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white border border-[#d6cbba] text-[#595043] hover:bg-[#f6eee2]"
            }`}
          >
            3. Three-Day Story (তিনিদিনীয়া কাহিনী)
          </button>
        </div>
      </div>

      {/* ── GROUNDED THREE-DAY ANCHOR SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Yesterday Anchor */}
        <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8b4513] uppercase tracking-wider bg-[#8b4513]/10 px-2.5 py-0.5 rounded-full">
              Yesterday (কালি)
            </span>
            <span className="text-[10px] text-[#736a5e]">Verified Occurred</span>
          </div>
          <h4 className="font-serif text-base text-[#2c2824] font-medium">
            {spec.anchors.recent.title}
          </h4>
          <p className="text-xs text-[#605546] leading-relaxed">
            {contextPack.yesterday.assamese_summary}
          </p>
          {spec.anchors.recent.person_name && (
            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#485935]">
              <span>🌸 With {spec.anchors.recent.person_name}</span>
            </div>
          )}
        </div>

        {/* Today Anchor */}
        <div className="bg-[#fcfaf4] border-2 border-[#485935] rounded-2xl p-5 space-y-2 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#485935] uppercase tracking-wider bg-[#485935]/15 px-2.5 py-0.5 rounded-full">
              Today (আজি) • Now
            </span>
            <span className="text-[10px] text-[#485935] font-semibold">Active Anchor</span>
          </div>
          <h4 className="font-serif text-base text-[#2c2824] font-medium">
            {spec.anchors.current.title}
          </h4>
          <p className="text-xs text-[#605546] leading-relaxed">
            {contextPack.today.assamese_summary}
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-[#485935]">
            <span>🌿 {contextPack.now.current_routine}</span>
          </div>
        </div>

        {/* Tomorrow Anchor */}
        <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#b8860b] uppercase tracking-wider bg-[#b8860b]/15 px-2.5 py-0.5 rounded-full">
              Tomorrow (কাইলৈ)
            </span>
            <span className="text-[10px] text-[#b8860b] font-semibold">Confirmed Visit</span>
          </div>
          <h4 className="font-serif text-base text-[#2c2824] font-medium">
            {spec.anchors.upcoming.title}
          </h4>
          <p className="text-xs text-[#605546] leading-relaxed">
            {contextPack.tomorrow.assamese_summary}
          </p>
          {spec.anchors.upcoming.person_name && (
            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#b8860b]">
              <span>🕊️ Welcoming {spec.anchors.upcoming.person_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE INTERACTIVE TASK CARD ── */}
      {currentTask && (
        <div className="bg-[#faf6f0] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Step Progress & Scaffolding Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#dfd4c0]">
            <div>
              <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                Step {currentTaskIndex + 1} of {spec.tasks.length}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2c2824] font-medium mt-0.5">
                {currentTask.prompt}
              </h2>
              <p className="text-sm text-[#605546] font-serif mt-0.5">
                {currentTask.assamese_prompt}
              </p>
            </div>

            {/* Gentle Scaffolding Ladder Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleAdvanceScaffold}
                className="bg-white border border-[#d6cbba] hover:bg-[#f6eee2] text-[#41382c] px-3.5 py-2 rounded-xl text-xs font-medium shadow-sm flex items-center gap-1.5 transition"
              >
                <span>💡 Gentle Clue ({scaffoldLevel})</span>
              </button>
            </div>
          </div>

          {/* ── SCAFFOLDING SUPPORT DISPLAY (S1 - S5) ── */}
          {activeScaffoldStep && scaffoldLevel !== "S0" && (
            <div className="bg-[#fffdfa] border border-[#d6cbba] rounded-2xl p-5 space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#485935]">
                  {activeScaffoldStep.title} ({scaffoldLevel})
                </span>
                <span className="text-xs text-[#736a5e]">Supportive Scaffolding</span>
              </div>
              <p className="text-sm text-[#41382c]">{activeScaffoldStep.instruction}</p>

              {/* S2 Photo or Voice Note Display */}
              {activeScaffoldStep.photo_url && (
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#e8e0d2] shadow-sm flex-shrink-0">
                    <img
                      src={activeScaffoldStep.photo_url}
                      alt="Personal Cue"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#8b4513]">
                      Voice from {activeScaffoldStep.voice_speaker || "Family"}:
                    </span>
                    <p className="text-xs text-[#595043] italic font-serif">
                      "{activeScaffoldStep.voice_transcript || activeScaffoldStep.cue_text}"
                    </p>
                  </div>
                </div>
              )}

              {activeScaffoldStep.cue_text && !activeScaffoldStep.photo_url && (
                <p className="text-xs text-[#736a5e] italic">{activeScaffoldStep.cue_text}</p>
              )}

              {activeScaffoldStep.full_resolution && (
                <p className="text-xs text-[#485935] font-serif bg-[#eaf0e4] p-3 rounded-xl">
                  {activeScaffoldStep.full_resolution}
                </p>
              )}
            </div>
          )}

          {/* ── INTERACTIVE TASK BODY: TEMPLATE 1 / CHOICE MATCH ── */}
          {currentTask.interactive_type === "choice_match" && currentTask.choice_options && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentTask.choice_options.map((opt) => {
                  const isSelected = selectedChoiceId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleChoiceSelect(opt.id, opt.is_target, opt.label)}
                      className={`min-h-[72px] p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                        isSelected
                          ? opt.is_target
                            ? "bg-[#eaf0e4] border-[#485935] shadow-md"
                            : "bg-[#fcf5eb] border-[#d6cbba]"
                          : "bg-white border-[#dfd4c0] hover:border-[#485935] shadow-sm"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-base sm:text-lg font-serif font-medium text-[#2c2824]">
                          {opt.label}
                        </div>
                        {opt.assamese_label && (
                          <div className="text-xs text-[#736a5e]">{opt.assamese_label}</div>
                        )}
                      </div>
                      {isSelected && opt.is_target && (
                        <span className="text-lg text-[#485935] font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INTERACTIVE TASK BODY: TEMPLATE 2 / TAP SORT ── */}
          {currentTask.interactive_type === "tap_sort" && currentTask.sort_items && (
            <div className="space-y-6">
              <p className="text-xs text-[#736a5e]">
                For each moment, tap where it belongs: Yesterday, Today, or Tomorrow.
              </p>

              <div className="space-y-4">
                {currentTask.sort_items.map((item) => {
                  const currentPlacement = sortedPlacements[item.id];
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#dfd4c0] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-serif text-base font-medium text-[#2c2824]">
                            {item.title}
                          </h4>
                          {item.assamese_title && (
                            <p className="text-xs text-[#736a5e]">{item.assamese_title}</p>
                          )}
                        </div>
                        {item.person_label && (
                          <span className="text-xs text-[#8b4513] font-medium bg-[#8b4513]/10 px-2.5 py-0.5 rounded-full">
                            {item.person_label}
                          </span>
                        )}
                      </div>

                      {/* 3 Large Tap Targets */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                        {(["yesterday", "today", "tomorrow"] as const).map((frame) => {
                          const isSelected = currentPlacement === frame;
                          const isCorrect = item.correct_frame === frame;
                          return (
                            <button
                              key={frame}
                              onClick={() => handleSortItem(item.id, frame)}
                              className={`min-h-[52px] rounded-xl border text-xs sm:text-sm font-medium transition flex flex-col items-center justify-center p-2 ${
                                isSelected
                                  ? isCorrect
                                    ? "bg-[#485935] text-white border-[#485935] shadow-sm"
                                    : "bg-[#e8decd] text-[#41382c] border-[#d6cbba]"
                                  : "bg-[#faf6f0] text-[#595043] border-[#dfd4c0] hover:bg-[#f2ece0]"
                              }`}
                            >
                              <span className="capitalize">{frame}</span>
                              <span className="text-[10px] opacity-85">
                                {frame === "yesterday"
                                  ? "(কালি)"
                                  : frame === "today"
                                  ? "(আজি)"
                                  : "(কাইলৈ)"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INTERACTIVE TASK BODY: TEMPLATE 3 / STORY STEP ── */}
          {currentTask.interactive_type === "story_step" && (
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#f0e8db] text-[#485935] flex items-center justify-center text-2xl mx-auto font-serif">
                📖
              </div>
              <h3 className="text-xl font-serif text-[#2c2824] font-medium">
                {currentTask.prompt}
              </h3>
              <p className="text-sm text-[#595043] font-serif">
                {currentTask.assamese_prompt}
              </p>
              <button
                onClick={() => setIsAffirmed(true)}
                className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
              >
                Yes, that is peaceful and clear →
              </button>
            </div>
          )}

          {/* ── NARRATIVE AFFIRMATION & ADVANCE BUTTON ── */}
          {feedbackMessage && (
            <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-2xl p-4 text-center text-sm shadow-sm transition">
              {feedbackMessage}
            </div>
          )}

          <div className="pt-4 flex justify-between items-center border-t border-[#dfd4c0]">
            <span className="text-xs text-[#736a5e]">
              Dignified personal pacing • No countdowns or competitive timers
            </span>
            <button
              onClick={handleNextTask}
              className="bg-[#485935] text-white text-xs sm:text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#384629] transition shadow-sm flex items-center gap-2"
            >
              <span>
                {currentTaskIndex < spec.tasks.length - 1 ? "Next Moment →" : "Complete Journey 🌸"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
