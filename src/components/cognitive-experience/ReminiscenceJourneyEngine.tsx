import React, { useState, useEffect } from "react";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";
import {
  GameExperienceSpecification,
  StepSpecification,
  ReminiscenceScaffoldingLevel,
  ResponseOption,
} from "../../intelligence/specifications/types";
import { SpecificationValidatorPipeline } from "../../intelligence/specifications/validators";
import { OfflineSpecCache } from "../../intelligence/specifications/cache/offline-spec-cache";
import { DeterministicSpecGenerator } from "../../intelligence/specifications/generators/deterministic-spec-generator";
import { buildGame7ContextPack } from "../../intelligence/retrieval/context-pack-builder";
import { Game7ContextPack } from "../../intelligence/retrieval/types";
import {
  LargeTapSelection,
  ImagePresentation,
  AudioPlayback,
  VoiceResponse,
  HintModal,
  NavigationControls,
  GentleSuccessCelebration,
  GentleRetryMessage,
} from "./primitives";

export type EngineLifecycleState =
  | "loading"
  | "context_retrieval"
  | "generated_experience"
  | "playing"
  | "paused"
  | "insufficient_data"
  | "error"
  | "completed";

interface Props {
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
  initialSpec?: GameExperienceSpecification;
  personId?: string;
}

export const ReminiscenceJourneyEngine: React.FC<Props> = ({
  onComplete,
  onBack,
  initialSpec,
  personId = "person:purnima",
}) => {
  // Lifecycle State
  const [lifecycleState, setLifecycleState] = useState<EngineLifecycleState>("loading");
  const [specification, setSpecification] = useState<GameExperienceSpecification | null>(null);
  const [contextPack, setContextPack] = useState<Game7ContextPack | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);

  // Active step state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [affirmationMessage, setAffirmationMessage] = useState<string | null>(null);
  const [gentleRetryActive, setGentleRetryActive] = useState<boolean>(false);
  const [voiceReflectionRecorded, setVoiceReflectionRecorded] = useState<boolean>(false);
  const [voiceReflectionNote, setVoiceReflectionNote] = useState<string | null>(null);
  const [revealedAudioFirstPhoto, setRevealedAudioFirstPhoto] = useState<boolean>(false);

  // Scaffolding & Assistance
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ReminiscenceScaffoldingLevel>("recognition");
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [hintUsedCount, setHintUsedCount] = useState<number>(0);

  // Audio State
  const [activeSound, setActiveSound] = useState<"courtyard" | "flute" | "tanpura" | "muted">("flute");

  // Telemetry
  const [telemetryLogs, setTelemetryLogs] = useState<GameTrialTelemetry[]>([]);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Provenance / Caregiver Upload Demo Modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadRole, setUploadRole] = useState<"person" | "caregiver">("person");
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [demoUploadedItem, setDemoUploadedItem] = useState<{
    id: string;
    title: string;
    source: "person" | "caregiver";
    verification_status: "unverified" | "caregiver_verified";
    confidence: number;
  } | null>(null);

  // 1. Initialize & Retrieve Context
  useEffect(() => {
    try {
      setLifecycleState("loading");

      let pack: Game7ContextPack | null = null;
      let specToUse: GameExperienceSpecification;

      if (initialSpec) {
        SpecificationValidatorPipeline.assertValidForRuntime(initialSpec);
        specToUse = initialSpec;
      } else {
        // Build bounded context pack
        pack = buildGame7ContextPack(personId);
        setContextPack(pack);

        // Check insufficient data guard (must have at least 2 verified memories)
        if (!pack.memories || pack.memories.length < 2) {
          setLifecycleState("insufficient_data");
          return;
        }

        // Check offline cache first
        const cached = OfflineSpecCache.getLatestCachedSpecification(
          personId,
          "reminiscence_journey_my_world"
        );

        if (cached && cached.validation_result?.is_valid) {
          specToUse = cached;
          setIsOfflineCached(true);
        } else {
          specToUse = DeterministicSpecGenerator.generateGame7Specification(
            pack,
            scaffoldingLevel
          );
          OfflineSpecCache.saveValidatedSpecification(specToUse);
          setIsOfflineCached(true);
        }
      }

      setSpecification(specToUse);
      if (specToUse.scaffolding?.current_level) {
        setScaffoldingLevel(specToUse.scaffolding.current_level as ReminiscenceScaffoldingLevel);
      }
      setValidationError(null);
      setLifecycleState("playing");
    } catch (err: any) {
      console.error("[ReminiscenceJourneyEngine] Initialization rejected:", err);
      setValidationError(err.message || "Specification validation failed.");
      setLifecycleState("error");
    }
  }, [initialSpec, personId]);

  // 2. Step Change Stimulus & Audio Trigger
  useEffect(() => {
    if (lifecycleState !== "playing" || !specification) return;

    const currentStep = specification.sequence[currentStepIndex];
    if (currentStep) {
      setSelectedOptionId(null);
      setAffirmationMessage(null);
      setGentleRetryActive(false);
      setVoiceReflectionRecorded(false);
      setVoiceReflectionNote(null);
      setRevealedAudioFirstPhoto(false);
      setStepStartTime(Date.now());

      // Start ambient acoustic grounding
      if (activeSound !== "muted") {
        const sound = currentStep.stimulus.ambient_sound;
        if (sound === "courtyard") ambientAudio.playCourtyardSounds();
        else if (sound === "tanpura") ambientAudio.playTanpuraDrone();
        else ambientAudio.playFolkFlute();
      }

      // Read spoken prompt warmly with empathic speech synthesis
      if (currentStep.prompt.spoken_prompt) {
        speakWarmly(currentStep.prompt.spoken_prompt, { rate: 0.85 });
      }
    }

    return () => {
      cancelEmpathicSpeech();
    };
  }, [currentStepIndex, lifecycleState, specification, activeSound]);

  // Ambient sound toggle handler
  const handleToggleSound = (sound: "courtyard" | "flute" | "tanpura" | "muted") => {
    setActiveSound(sound);
    ambientAudio.stop();
    if (sound === "courtyard") ambientAudio.playCourtyardSounds();
    else if (sound === "tanpura") ambientAudio.playTanpuraDrone();
    else if (sound === "flute") ambientAudio.playFolkFlute();
  };

  // Switch scaffolding dynamically
  const handleSwitchScaffolding = (level: ReminiscenceScaffoldingLevel) => {
    setScaffoldingLevel(level);
    try {
      const pack = contextPack || buildGame7ContextPack(personId);
      const newSpec = DeterministicSpecGenerator.generateGame7Specification(pack, level);
      OfflineSpecCache.saveValidatedSpecification(newSpec);
      setSpecification(newSpec);
      setCurrentStepIndex(0);
      setSelectedOptionId(null);
      setAffirmationMessage(null);
      setGentleRetryActive(false);
    } catch (err: any) {
      console.warn("Could not switch scaffolding spec:", err);
    }
  };

  // Selection Handler (Dementia-safe: no red/wrong states)
  const handleSelectOption = (option: ResponseOption) => {
    setSelectedOptionId(option.id);
    const latency = Date.now() - stepStartTime;

    if (option.is_preferred_or_target) {
      setAffirmationMessage(option.gentle_affirmation);
      setGentleRetryActive(false);
      speakWarmly(option.gentle_affirmation, { rate: 0.9 });

      const log: GameTrialTelemetry = {
        trial_index: currentStepIndex + 1,
        step_name: specification?.sequence[currentStepIndex]?.title || "Step",
        stimulus: specification?.sequence[currentStepIndex]?.stimulus.image_caption || "",
        user_selection: option.text,
        is_correct: true,
        latency_ms: latency,
        assistance_level: hintUsedCount > 0 ? "visual_cue" : "none",
        hint_used: hintUsedCount > 0,
        completion_state: "success",
        measurement_quality_q: 0.95,
      };
      setTelemetryLogs((prev) => [...prev, log]);
    } else {
      // Gentle affirmation & guidance without error/penalty
      setGentleRetryActive(true);
      setAffirmationMessage(option.gentle_affirmation);
      speakWarmly(option.gentle_affirmation, { rate: 0.9 });

      const log: GameTrialTelemetry = {
        trial_index: currentStepIndex + 1,
        step_name: specification?.sequence[currentStepIndex]?.title || "Step",
        stimulus: specification?.sequence[currentStepIndex]?.stimulus.image_caption || "",
        user_selection: option.text,
        is_correct: false,
        latency_ms: latency,
        assistance_level: "caregiver_prompt",
        hint_used: hintUsedCount > 0,
        completion_state: "assisted",
        measurement_quality_q: 0.85,
      };
      setTelemetryLogs((prev) => [...prev, log]);
    }
  };

  // Advance to next stop
  const handleAdvanceStep = () => {
    if (!specification) return;

    if (currentStepIndex < specification.sequence.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setLifecycleState("completed");
      ambientAudio.stop();
      cancelEmpathicSpeech();
    }
  };

  // Non-punitive skip
  const handleSkipStep = () => {
    if (!specification) return;

    const latency = Date.now() - stepStartTime;
    const log: GameTrialTelemetry = {
      trial_index: currentStepIndex + 1,
      step_name: specification.sequence[currentStepIndex]?.title || "Step",
      stimulus: specification.sequence[currentStepIndex]?.stimulus.image_caption || "",
      user_selection: "Skipped / Preserved for later",
      is_correct: true,
      latency_ms: latency,
      assistance_level: "none",
      hint_used: false,
      completion_state: "skipped",
      measurement_quality_q: 0.8,
    };
    setTelemetryLogs((prev) => [...prev, log]);
    handleAdvanceStep();
  };

  // Graceful exit
  const handleGracefulExit = () => {
    ambientAudio.stop();
    cancelEmpathicSpeech();
    onComplete(
      telemetryLogs,
      `Reminiscence Journey Completed: ${telemetryLogs.length} verified stops gently explored across Tezpur memories.`
    );
  };

  // Provenance upload simulation helpers
  const handleSimulateUpload = () => {
    if (!uploadTitle.trim()) return;
    const isCaregiver = uploadRole === "caregiver";
    const newItem = {
      id: `mem_demo_${Date.now()}`,
      title: uploadTitle,
      source: uploadRole,
      verification_status: isCaregiver ? ("caregiver_verified" as const) : ("unverified" as const),
      confidence: isCaregiver ? 1.0 : 0.65,
    };
    setDemoUploadedItem(newItem);
    setUploadTitle("");
  };

  const handleVerifyUploadedItem = () => {
    if (demoUploadedItem) {
      setDemoUploadedItem({
        ...demoUploadedItem,
        verification_status: "caregiver_verified",
        confidence: 1.0,
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "loading") {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl border border-[#bdd4b0] animate-pulse">
          🌸
        </div>
        <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
          Opening Your Memory Sanctuary
        </h3>
        <p className="text-xs text-[#736a5e] max-w-md mx-auto leading-relaxed">
          Retrieving caregiver-verified childhood, school, and family memories from Tezpur with full privacy and dignity protection.
        </p>
        <p className="text-xs text-[#595043] font-serif italic">
          "আপোনাৰ চিনাকি স্মৃতিবোৰ প্ৰস্তুত কৰা হৈছে..."
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ERROR / VALIDATION REJECTED STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "error" || validationError) {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-8 max-w-2xl mx-auto my-8 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl">
          🛡️
        </div>
        <h3 className="font-serif text-xl font-medium text-[#2c2824]">
          Clinical Dignity & Safety Firewall Notice
        </h3>
        <p className="text-xs text-[#595043] leading-relaxed max-w-lg mx-auto">
          This game specification did not pass the non-negotiable dementia-friendly safety invariants or provenance verification. It was safely blocked to protect elder dignity.
        </p>
        <div className="p-3 bg-white border border-red-200 rounded-xl text-xs text-red-800 font-mono text-left break-all">
          {validationError}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a] transition"
        >
          Return to Space
        </button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. INSUFFICIENT DATA FALLBACK
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "insufficient_data") {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-8 max-w-xl mx-auto my-10 shadow-md text-center space-y-5 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#f4ece0] text-[#736a5e] flex items-center justify-center text-2xl border border-[#d6cbba]">
          📖
        </div>
        <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
          Caregiver Verification in Progress
        </h3>
        <p className="text-xs sm:text-sm text-[#595043] leading-relaxed">
          MindMitra strictly enforces that only authenticated memories signed by trusted caregivers reach the elder's screen.
        </p>
        <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 text-xs text-[#736a5e] text-left space-y-2">
          <div className="font-semibold text-[#41382c]">Why is this protected?</div>
          <p>
            To prevent disorientation, hallucinations, or confabulation, unverified items remain in quarantine until confirmed.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a] transition"
          >
            ← Return to Space
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PAUSED / REST WITH TEA STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "paused") {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-8 max-w-xl mx-auto my-10 shadow-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-4xl border-2 border-[#bdd4b0] animate-pulse">
          🍵
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
            Time for Warm Tea & a Peaceful Breath
          </h3>
          <p className="text-xs sm:text-sm text-[#595043] font-serif italic">
            "চাহৰ কাপ আৰু এক মুহূৰ্ত শান্তিৰ জিৰণি..."
          </p>
          <p className="text-xs text-[#736a5e] max-w-md mx-auto leading-relaxed pt-1">
            Rest comfortably. Your memory journey is paused and safely preserved. Take a deep, gentle breath with the sound of courtyard birds.
          </p>
        </div>

        {/* Peaceful Breathing Circle */}
        <div className="w-32 h-32 mx-auto rounded-full bg-[#faf6f0] border-4 border-dashed border-[#bdd4b0] flex flex-col items-center justify-center animate-spin-slow">
          <span className="text-xs font-serif text-[#485935] font-semibold">Breathe In</span>
          <span className="text-[10px] text-[#736a5e]">Gentle peace</span>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setLifecycleState("playing")}
            className="px-6 py-3 bg-[#485935] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#39472a] shadow-sm transition"
          >
            ▶ Resume Gentle Journey
          </button>
          <button
            type="button"
            onClick={handleGracefulExit}
            className="px-5 py-3 border border-[#d6cbba] bg-white text-[#595043] rounded-xl text-xs font-semibold hover:bg-[#faf6f0] transition"
          >
            Rest for Today
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CONTEXT RETRIEVAL INSPECTOR VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "context_retrieval" && contextPack) {
    return (
      <div className="bg-[#fbf7ee] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto my-6 shadow-md space-y-5 animate-fade-in">
        <div className="flex justify-between items-center border-b border-[#dfd4c0] pb-3">
          <div>
            <span className="bg-[#485935]/15 text-[#334224] text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Bounded Personal Game Context Pack
            </span>
            <h3 className="font-serif text-xl font-medium text-[#2c2824] mt-1">
              Verified Memory Candidates for Game 7
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setLifecycleState("playing")}
            className="text-xs bg-[#485935] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#39472a] transition"
          >
            Play Journey →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-[#dfd4c0] rounded-2xl space-y-1">
            <span className="font-semibold text-[#41382c]">Person World Model:</span>
            <div className="text-[#595043]">
              {contextPack.person.display_name} ({contextPack.person.honorific}), preferred language: {contextPack.person.preferred_language}
            </div>
            <div className="text-[11px] text-[#736a5e]">
              Firewall status: Active • Cross-person isolation verified
            </div>
          </div>
          <div className="p-3 bg-white border border-[#dfd4c0] rounded-2xl space-y-1">
            <span className="font-semibold text-[#41382c]">Verified Memory Pool:</span>
            <div className="text-[#595043]">
              {contextPack.memories.length} candidates loaded • Provenance: Caregiver Verified
            </div>
            <div className="text-[11px] text-[#736a5e]">
              Confidence threshold: ≥ 0.85 • Sensitivity: low
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#41382c]">Retrieved Memory Stops:</span>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {contextPack.memories.map((m, idx) => (
              <div
                key={m.metadata.id}
                className="p-3 bg-white border border-[#dfd4c0] rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#2c2824] flex items-center gap-2">
                    <span>Stop {idx + 1}: {m.data.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#edf4ea] text-[#2c401e]">
                      {m.data.approximate_period}
                    </span>
                  </div>
                  <div className="text-[#736a5e] text-[11px] font-serif">
                    {m.data.assamese_title}
                  </div>
                </div>
                <span className="text-[10px] bg-[#f0e8db] text-[#595043] px-2 py-1 rounded-lg">
                  {m.metadata.provenance} (conf: {m.metadata.confidence.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setLifecycleState("playing")}
            className="px-6 py-2.5 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a] transition"
          >
            Start Memory Journey →
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. BEAUTIFUL COMPLETION STATE (MEMORY TAPESTRY KEEPSAKE)
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "completed" && specification) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6 animate-fade-in pb-12">
        {/* Keepsake Header */}
        <div className="bg-white border-2 border-[#bdd4b0] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl border-2 border-[#bdd4b0]">
            🌸
          </div>
          <div className="space-y-1">
            <span className="bg-[#485935]/15 text-[#334224] text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Journey Completed With Warmth
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#2c401e] mt-2">
              {specification.completion.celebration_title}
            </h3>
            <p className="text-xs sm:text-sm text-[#41382c] leading-relaxed max-w-lg mx-auto">
              {specification.completion.celebration_message}
            </p>
            {specification.completion.assamese_celebration_message && (
              <p className="text-xs text-[#595043] font-serif italic max-w-lg mx-auto pt-1">
                "{specification.completion.assamese_celebration_message}"
              </p>
            )}
          </div>
        </div>

        {/* Memory Tapestry: Visual Stops Travelled */}
        <div className="bg-[#fbf7ee] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#dfd4c0] pb-3">
            <h4 className="font-serif text-lg font-medium text-[#2c2824] flex items-center gap-2">
              <span>🌺</span>
              <span>Your Lifetime Memory Tapestry</span>
            </h4>
            <span className="text-xs text-[#736a5e] font-medium">
              {specification.sequence.length} stops gently visited
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            {specification.sequence.map((step, idx) => (
              <div
                key={step.step_id}
                className="bg-white border border-[#dfd4c0] rounded-2xl overflow-hidden shadow-xs flex flex-col"
              >
                <div className="h-32 w-full bg-[#f0e8db] relative">
                  {step.stimulus.image_url ? (
                    <img
                      src={step.stimulus.image_url}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🌿
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Stop {idx + 1}
                  </span>
                  {step.stop_type && (
                    <span className="absolute bottom-2 right-2 bg-white/90 text-[#334224] text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize">
                      {step.stop_type.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-serif text-xs font-semibold text-[#2c2824] leading-snug">
                      {step.title}
                    </h5>
                    {step.assamese_title && (
                      <div className="text-[10px] text-[#736a5e] font-serif">
                        {step.assamese_title}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8c8273] pt-1 border-t border-[#f4ece0] flex items-center justify-between">
                    <span>{step.stimulus.sensory_anchors?.[0]?.label || "Nahor blossoms"}</span>
                    <span>✓ Explored</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daughter Anu's Warm Note */}
          <div className="bg-white border border-[#bdd4b0] rounded-2xl p-4 text-xs text-[#2c401e] flex items-start gap-3 mt-4">
            <span className="text-xl">💌</span>
            <div className="space-y-1">
              <span className="font-semibold block">Daughter Anu's Blessing:</span>
              <p className="text-[#41382c] leading-relaxed">
                "Ma, seeing you smile at our old Tezpur moments brings joy to all of us. You have given our family so much love and wisdom."
              </p>
            </div>
          </div>
        </div>

        {/* Completion Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGracefulExit}
            className="px-8 py-3.5 bg-[#485935] hover:bg-[#39472a] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm"
          >
            ✓ Gracefully Return to Space
          </button>
          <button
            type="button"
            onClick={() => handleToggleSound("flute")}
            className="px-5 py-3.5 bg-white border border-[#d6cbba] hover:bg-[#faf6f0] text-[#41382c] text-xs font-semibold rounded-xl transition"
          >
            🎵 Listen to Courtyard Flute
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ACTIVE PLAYING VIEW (GAME 7 ENGINE RUNTIME)
  // ──────────────────────────────────────────────────────────────────────────
  if (!specification) return null;

  const currentStep: StepSpecification = specification.sequence[currentStepIndex];

  // Progression level check
  const isLevel1Recognition = scaffoldingLevel === "recognition";
  const isLevel3ReducedCue = scaffoldingLevel === "reduced_cue";
  const isLevel4Multimodal = scaffoldingLevel === "multimodal_cue";
  const isLevel5OpenReminiscence =
    scaffoldingLevel === "recall_reminiscence" ||
    currentStep.step_type === "recall_reminiscence" ||
    currentStep.allowed_responses.input_mode === "voice_response";

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Top Header & Dignity Status Bar */}
      <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGracefulExit}
              className="text-xs font-semibold text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-[#faf6f0] px-3 py-1.5 rounded-xl transition"
            >
              ← Back to Space
            </button>
            <span className="w-2 h-2 rounded-full bg-[#485935]"></span>
            <span className="text-[11px] font-semibold text-[#485935] uppercase tracking-wider">
              Deterministic Runtime • Game 7
            </span>
            {isOfflineCached && (
              <span className="bg-[#edf4ea] text-[#2c401e] px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <span>⚡</span> Offline Ready
              </span>
            )}
            <button
              type="button"
              onClick={() => setLifecycleState("context_retrieval")}
              className="text-[10px] text-[#736a5e] hover:text-[#2c2824] underline ml-1"
            >
              Context Inspector
            </button>
          </div>
          <h2 className="text-xl font-serif font-medium text-[#2c2824] mt-1">
            {specification.prompt.session_title}
          </h2>
          <div className="text-xs text-[#736a5e] font-serif">
            {specification.prompt.assamese_title || "সোণালী স্মৃতিৰ যাত্ৰা"}
          </div>
        </div>

        {/* Top Controls: Scaffolding, Sound, Rest */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scaffolding Selector across 5 Levels */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#595043] font-medium hidden sm:inline">Level:</span>
            <select
              value={scaffoldingLevel}
              onChange={(e) => handleSwitchScaffolding(e.target.value as ReminiscenceScaffoldingLevel)}
              className="bg-[#faf6f0] border border-[#d6cbba] rounded-xl px-2.5 py-1.5 text-xs text-[#2c2824] font-medium"
              title="Select reminiscence scaffolding level"
            >
              <option value="recognition">Level 1: Photo + Name</option>
              <option value="cued_recognition">Level 2: Recognition Question</option>
              <option value="reduced_cue">Level 3: Photo Without Label</option>
              <option value="multimodal_cue">Level 4: Audio / Family Voice Cue</option>
              <option value="recall_reminiscence">Level 5: Open Reminiscence</option>
            </select>
          </div>

          {/* Sound Controls */}
          <div className="flex items-center gap-1 bg-[#faf6f0] border border-[#d6cbba] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => handleToggleSound("flute")}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                activeSound === "flute" ? "bg-[#485935] text-white" : "text-[#595043]"
              }`}
              title="Bamboo Flute Melody"
            >
              🎵 Flute
            </button>
            <button
              type="button"
              onClick={() => handleToggleSound("courtyard")}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                activeSound === "courtyard" ? "bg-[#485935] text-white" : "text-[#595043]"
              }`}
              title="Courtyard Birds"
            >
              🐦 Birds
            </button>
            <button
              type="button"
              onClick={() => handleToggleSound("muted")}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                activeSound === "muted" ? "bg-[#8c8273] text-white" : "text-[#595043]"
              }`}
              title="Mute Audio"
            >
              🔇
            </button>
          </div>

          {/* Pause / Rest Button */}
          <button
            type="button"
            onClick={() => setLifecycleState("paused")}
            className="text-xs font-medium text-[#485935] hover:text-[#334224] bg-[#edf4ea] border border-[#bdd4b0] px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            title="Take a gentle break with tea"
          >
            <span>🍵</span>
            <span className="hidden sm:inline">Rest</span>
          </button>
        </div>
      </div>

      {/* Progress Stepping Indicator (Non-competitive) */}
      <div className="flex items-center justify-between px-2 text-xs text-[#736a5e]">
        <div className="flex items-center gap-2">
          <span className="font-serif">
            Memory Stop {currentStepIndex + 1} of {specification.sequence.length}
          </span>
          {currentStep.stop_type && (
            <span className="bg-[#f0e8db] text-[#41382c] px-2 py-0.5 rounded-full text-[10px] capitalize font-medium">
              {currentStep.stop_type.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {specification.sequence.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition ${
                idx === currentStepIndex
                  ? "bg-[#485935] scale-125"
                  : idx < currentStepIndex
                  ? "bg-[#9bc490]"
                  : "bg-[#dfd4c0]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Dominant Memory Experience Card */}
      <div className="bg-[#fbf7ee] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        {/* Step Prompt & Guidance */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#485935]">
              {currentStep.title}
            </span>
            <button
              type="button"
              onClick={() => setShowHintModal(true)}
              className="text-xs text-[#485935] hover:text-[#334224] bg-white border border-[#bdd4b0] px-3 py-1 rounded-xl transition flex items-center gap-1 shadow-xs"
            >
              <span>🌸</span>
              <span>Gentle Clue</span>
            </button>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2c2824] leading-snug">
            {currentStep.prompt.primary_prompt}
          </h3>
          {currentStep.prompt.assamese_prompt && (
            <p className="text-sm text-[#736a5e] font-serif">
              {currentStep.prompt.assamese_prompt}
            </p>
          )}
        </div>

        {/* Step Stimulus: Primary Photo Dominance & Sensory Anchors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Primary Photo Canvas (Dominant Presentation) */}
          <div className="space-y-3">
            {/* Level 4 Multimodal: Audio/Voice Cue First */}
            {isLevel4Multimodal && !revealedAudioFirstPhoto && !selectedOptionId ? (
              <div className="h-64 sm:h-80 rounded-3xl bg-[#faf6f0] border-2 border-dashed border-[#bdd4b0] p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl animate-pulse">
                  🎵
                </div>
                <div className="space-y-1">
                  <span className="font-serif text-base text-[#2c2824] font-medium">
                    Listen to Daughter Anu's Voice Note
                  </span>
                  <p className="text-xs text-[#736a5e] max-w-xs">
                    "{currentStep.stimulus.family_voice_note?.transcript}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRevealedAudioFirstPhoto(true)}
                  className="px-4 py-2 bg-white border border-[#bdd4b0] text-[#485935] text-xs font-semibold rounded-xl hover:bg-[#faf6f0] transition shadow-xs"
                >
                  👁️ Reveal Cherished Photo
                </button>
              </div>
            ) : (
              <ImagePresentation
                imageUrl={
                  isLevel3ReducedCue && !selectedOptionId
                    ? currentStep.stimulus.image_url // show photo without label
                    : currentStep.stimulus.image_url
                }
                caption={
                  isLevel3ReducedCue && !selectedOptionId
                    ? undefined // Level 3: photo without label
                    : isLevel1Recognition
                    ? `${currentStep.title} (${currentStep.stimulus.image_caption})` // Level 1: photo + prominent name
                    : currentStep.stimulus.image_caption
                }
                altText={currentStep.title}
                provenanceBadge="Caregiver Verified • Tezpur"
                sensoryBadges={currentStep.stimulus.sensory_anchors}
              />
            )}

            {/* Ambient Acoustic / Spoken Guidance */}
            <AudioPlayback
              soundType={currentStep.stimulus.ambient_sound}
              label={
                currentStep.stimulus.ambient_sound === "tanpura"
                  ? "Assamese Tanpura Drone"
                  : currentStep.stimulus.ambient_sound === "courtyard"
                  ? "Morning Courtyard Birds"
                  : "Brahmaputra Gentle Flute"
              }
              voiceNote={currentStep.stimulus.family_voice_note}
            />
          </div>

          {/* Right: Interaction Area */}
          <div className="space-y-5">
            {/* Level 5: Open Reminiscence (Optional Voice Reflection) */}
            {isLevel5OpenReminiscence ? (
              <div className="space-y-4">
                <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-2">
                  <span className="font-serif text-sm font-semibold text-[#2c2824] block">
                    "Would you like to tell me about this?"
                  </span>
                  <p className="text-xs text-[#595043] leading-relaxed">
                    You can speak freely in Assamese or English, or simply enjoy quiet reflection. There is never any forced recall.
                  </p>
                </div>

                <VoiceResponse
                  promptText="Tap to speak your memory (Optional)"
                  onVoiceCaptured={(text) => {
                    setVoiceReflectionRecorded(true);
                    setVoiceReflectionNote(text);
                    setAffirmationMessage("What a precious memory to hold close. Thank you for sharing your heart warmly.");
                    speakWarmly("What a precious memory to hold close. Thank you for sharing your heart warmly.", { rate: 0.9 });
                  }}
                />

                {voiceReflectionRecorded && voiceReflectionNote && (
                  <div className="p-3 bg-[#edf4ea] border border-[#9bc490] rounded-xl text-xs text-[#2c401e] space-y-1">
                    <span className="font-semibold">Recorded Reflection:</span>
                    <p className="italic">"{voiceReflectionNote}"</p>
                  </div>
                )}
              </div>
            ) : (
              /* Levels 1-4: Options (Large Tap Selection, 2-3 choices, non-competitive) */
              currentStep.allowed_responses.options && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[#41382c] block">
                    {isLevel1Recognition
                      ? "Gentle Recognition:"
                      : "Choose the memory you recognize:"}
                  </span>
                  <LargeTapSelection
                    options={currentStep.allowed_responses.options}
                    selectedOptionId={selectedOptionId}
                    onSelect={handleSelectOption}
                    bilingual={true}
                  />
                </div>
              )
            )}

            {/* Conversational "Would you like to tell me about this?" Offer in Option mode */}
            {!isLevel5OpenReminiscence && selectedOptionId && !voiceReflectionRecorded && (
              <div className="p-3 bg-white border border-[#dfd4c0] rounded-2xl text-xs space-y-2 animate-fade-in">
                <span className="font-serif font-medium text-[#2c2824] block">
                  Would you like to tell me about this memory? (Optional)
                </span>
                <VoiceResponse
                  promptText="Tap microphone to record story"
                  onVoiceCaptured={() => {
                    setVoiceReflectionRecorded(true);
                    setAffirmationMessage("Thank you for sharing your memory so warmly.");
                  }}
                />
              </div>
            )}

            {/* Affirmation Message / Reassurance */}
            {affirmationMessage && !gentleRetryActive && (
              <div className="bg-[#edf4ea] border border-[#9bc490] rounded-2xl p-4 text-xs text-[#2c401e] space-y-1 animate-fade-in shadow-xs">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>🌸</span>
                  <span>Warm Memory Reassured</span>
                </div>
                <p className="leading-relaxed">{affirmationMessage}</p>
              </div>
            )}

            {/* Gentle Retry Message (Never "WRONG", Never "FAILED") */}
            {gentleRetryActive && (
              <GentleRetryMessage
                message={affirmationMessage || currentStep.feedback.gentle_retry_prompt}
                onRetry={() => {
                  setSelectedOptionId(null);
                  setGentleRetryActive(false);
                }}
                onOpenHint={() => setShowHintModal(true)}
              />
            )}
          </div>
        </div>

        {/* Navigation Controls: Continue / Skip / Exit */}
        <NavigationControls
          onContinue={handleAdvanceStep}
          onSkip={handleSkipStep}
          continueLabel={
            currentStepIndex === specification.sequence.length - 1
              ? "Complete Journey 🌸"
              : "Continue to Next Memory →"
          }
          skipLabel="Step forward gently"
          showSkip={true}
          disabledContinue={false}
        />
      </div>

      {/* 3-Tiered Dignity Hint Modal */}
      {showHintModal && (
        <HintModal
          hints={currentStep.hints}
          onClose={() => setShowHintModal(false)}
          onHintUsed={(level) => setHintUsedCount((prev) => Math.max(prev, level))}
        />
      )}

      {/* Dual-Source Provenance Modal Demo */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf7ee] border-2 border-[#d6cbba] w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#dfd4c0] pb-3">
              <h3 className="font-serif text-lg font-medium text-[#2c2824]">
                Memory Provenance & Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-[#736a5e] hover:text-[#2c2824] bg-white border border-[#d6cbba] px-2.5 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-semibold text-[#41382c]">1. Select Upload Role:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadRole("person")}
                  className={`p-3 rounded-xl border text-left transition ${
                    uploadRole === "person"
                      ? "bg-[#edf4ea] border-[#485935] font-semibold text-[#2c401e]"
                      : "bg-white border-[#d6cbba] text-[#595043]"
                  }`}
                >
                  <div>Elder Purnima</div>
                  <div className="text-[10px] text-[#736a5e]">Unverified by default</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadRole("caregiver")}
                  className={`p-3 rounded-xl border text-left transition ${
                    uploadRole === "caregiver"
                      ? "bg-[#edf4ea] border-[#485935] font-semibold text-[#2c401e]"
                      : "bg-white border-[#d6cbba] text-[#595043]"
                  }`}
                >
                  <div>Caregiver Anu (Daughter)</div>
                  <div className="text-[10px] text-[#736a5e]">Caregiver verified (1.0)</div>
                </button>
              </div>

              <div>
                <label className="font-semibold text-[#41382c] block mb-1">
                  Memory Title:
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Festival preparation with family"
                  className="w-full px-3 py-2 bg-white border border-[#d6cbba] rounded-xl text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateUpload}
                className="w-full py-2.5 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a] transition"
              >
                Submit Memory Record
              </button>

              {demoUploadedItem && (
                <div className="p-3 bg-white border border-[#dfd4c0] rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center font-semibold text-[#2c2824]">
                    <span>{demoUploadedItem.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        demoUploadedItem.verification_status === "caregiver_verified"
                          ? "bg-[#edf4ea] text-[#2c401e]"
                          : "bg-[#fff3cd] text-[#856404]"
                      }`}
                    >
                      {demoUploadedItem.verification_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#736a5e]">
                    Game eligibility:{" "}
                    <strong>
                      {demoUploadedItem.verification_status === "caregiver_verified"
                        ? "ELIGIBLE (Passes ProvenanceValidator)"
                        : "BLOCKED by Memory Firewall"}
                    </strong>
                  </p>
                  {demoUploadedItem.verification_status === "unverified" && (
                    <button
                      type="button"
                      onClick={handleVerifyUploadedItem}
                      className="w-full py-1.5 bg-[#2c401e] text-white rounded-lg text-xs font-medium"
                    >
                      ✓ Caregiver Sign & Verify Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
