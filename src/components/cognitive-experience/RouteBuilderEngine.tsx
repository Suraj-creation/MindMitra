import React, { useState, useEffect } from "react";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";
import {
  GameExperienceSpecification,
  StepSpecification,
  RouteScaffoldingLevel,
  ResponseOption,
} from "../../intelligence/specifications/types";
import { SpecificationValidatorPipeline } from "../../intelligence/specifications/validators";
import { OfflineSpecCache } from "../../intelligence/specifications/cache/offline-spec-cache";
import { DeterministicSpecGenerator } from "../../intelligence/specifications/generators/deterministic-spec-generator";
import { buildGame8ContextPack } from "../../intelligence/retrieval/context-pack-builder";
import { Game8ContextPack } from "../../intelligence/retrieval/types";
import {
  LargeTapSelection,
  ImagePresentation,
  AudioPlayback,
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

// Landmark representation for stepping-stone visualizer
interface RouteLandmark {
  id: string;
  name: string;
  assamese_name: string;
  category: "home" | "park" | "temple" | "market" | "school" | "river_ghat" | "community";
  icon: string;
  image_url: string;
  sensory_cue: string;
  is_visited: boolean;
  is_target: boolean;
}

export const RouteBuilderEngine: React.FC<Props> = ({
  onComplete,
  onBack,
  initialSpec,
  personId = "person:purnima",
}) => {
  // Lifecycle State
  const [lifecycleState, setLifecycleState] = useState<EngineLifecycleState>("loading");
  const [specification, setSpecification] = useState<GameExperienceSpecification | null>(null);
  const [contextPack, setContextPack] = useState<Game8ContextPack | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);

  // Active step state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [affirmationMessage, setAffirmationMessage] = useState<string | null>(null);
  const [gentleRetryActive, setGentleRetryActive] = useState<boolean>(false);

  // Scaffolding & Assistance across 5 Route Levels
  const [scaffoldingLevel, setScaffoldingLevel] = useState<RouteScaffoldingLevel>("destination_recognition");
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [hintUsedCount, setHintUsedCount] = useState<number>(0);

  // Level 5 Independent Route Recall sequence tracking
  const [independentSequence, setIndependentSequence] = useState<string[]>([]);
  const targetRecallSequence = ["lm:home_courtyard", "lm:cole_park", "lm:mahabhairab", "lm:chowk_bazaar"];

  // Audio State
  const [activeSound, setActiveSound] = useState<"courtyard" | "river" | "flute" | "muted">("courtyard");

  // Telemetry
  const [telemetryLogs, setTelemetryLogs] = useState<GameTrialTelemetry[]>([]);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Familiar Landmark Pool (Caregiver-verified, zero GPS)
  const familiarLandmarks: RouteLandmark[] = [
    {
      id: "lm:home_courtyard",
      name: "Ancestral Home Courtyard",
      assamese_name: "পূৰ্ণিমাৰ ঘৰৰ চোতাল",
      category: "home",
      icon: "🏡",
      image_url: "/assets/images/assamese_courtyard_1788980055319.jpg",
      sensory_cue: "Aroma of tulsi leaves & cardamom morning tea",
      is_visited: true,
      is_target: false,
    },
    {
      id: "lm:cole_park",
      name: "Cole Park (Chitralekha Udyan)",
      assamese_name: "চিত্ৰলেখা উদ্যান (কোল পাৰ্ক)",
      category: "park",
      icon: "🌳",
      image_url: "/assets/images/muga_silk_weave_1788980069393.jpg",
      sensory_cue: "Ancient banyan shade and Nahor blossom petals",
      is_visited: currentStepIndex >= 1,
      is_target: scaffoldingLevel === "obvious_route" || scaffoldingLevel === "landmark_sequencing",
    },
    {
      id: "lm:mahabhairab",
      name: "Mahabhairab Ancient Temple",
      assamese_name: "মহাভৈৰৱ মন্দিৰ",
      category: "temple",
      icon: "🛕",
      image_url: "/assets/images/assamese_tea_ceremony_1789020488707.jpg",
      sensory_cue: "Gentle morning bells and sweet incense smoke",
      is_visited: currentStepIndex >= 2,
      is_target: scaffoldingLevel === "landmark_sequencing",
    },
    {
      id: "lm:chowk_bazaar",
      name: "Tezpur Chowk Bazaar",
      assamese_name: "তেজপুৰ চক বজাৰ",
      category: "market",
      icon: "🏪",
      image_url: "/assets/images/ne_aerial_dawn_1788980040728.jpg",
      sensory_cue: "Fresh betel leaves, tea aroma, and familiar greetings",
      is_visited: currentStepIndex >= 3,
      is_target: true,
    },
  ];

  // 1. Initialize & Retrieve Context
  useEffect(() => {
    try {
      setLifecycleState("loading");

      let pack: Game8ContextPack | null = null;
      let specToUse: GameExperienceSpecification;

      if (initialSpec) {
        SpecificationValidatorPipeline.assertValidForRuntime(initialSpec);
        specToUse = initialSpec;
      } else {
        // Build bounded context pack
        pack = buildGame8ContextPack(personId);
        setContextPack(pack);

        // Insufficient data guard
        if (!pack.route || !pack.destination) {
          setLifecycleState("insufficient_data");
          return;
        }

        // Check offline cache
        const cached = OfflineSpecCache.getLatestCachedSpecification(
          personId,
          "route_builder_familiar_places"
        );

        if (cached && cached.validation_result?.is_valid) {
          specToUse = cached;
          setIsOfflineCached(true);
        } else {
          specToUse = DeterministicSpecGenerator.generateGame8Specification(
            pack,
            scaffoldingLevel
          );
          OfflineSpecCache.saveValidatedSpecification(specToUse);
          setIsOfflineCached(true);
        }
      }

      setSpecification(specToUse);
      if (specToUse.scaffolding?.current_level) {
        setScaffoldingLevel(specToUse.scaffolding.current_level as RouteScaffoldingLevel);
      }
      setValidationError(null);
      setLifecycleState("playing");
    } catch (err: any) {
      console.error("[RouteBuilderEngine] Initialization error:", err);
      setValidationError(err.message || "Route specification validation failed.");
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
      setStepStartTime(Date.now());

      // Play ambient audio
      if (activeSound !== "muted") {
        const sound = currentStep.stimulus.ambient_sound;
        if (sound === "river") ambientAudio.playCourtyardSounds(); // peaceful river ambient
        else if (sound === "flute") ambientAudio.playFolkFlute();
        else ambientAudio.playCourtyardSounds();
      }

      // Read spoken prompt
      if (currentStep.prompt.spoken_prompt) {
        speakWarmly(currentStep.prompt.spoken_prompt, { rate: 0.85 });
      }
    }

    return () => {
      cancelEmpathicSpeech();
    };
  }, [currentStepIndex, lifecycleState, specification, activeSound]);

  // Toggle ambient audio
  const handleToggleSound = (sound: "courtyard" | "river" | "flute" | "muted") => {
    setActiveSound(sound);
    ambientAudio.stop();
    if (sound === "courtyard") ambientAudio.playCourtyardSounds();
    else if (sound === "flute") ambientAudio.playFolkFlute();
    else if (sound === "river") ambientAudio.playCourtyardSounds();
  };

  // Switch scaffolding level
  const handleSwitchScaffolding = (level: RouteScaffoldingLevel) => {
    setScaffoldingLevel(level);
    setIndependentSequence([]);
    try {
      const pack = contextPack || buildGame8ContextPack(personId);
      const newSpec = DeterministicSpecGenerator.generateGame8Specification(pack, level);
      OfflineSpecCache.saveValidatedSpecification(newSpec);
      setSpecification(newSpec);
      setCurrentStepIndex(0);
      setSelectedOptionId(null);
      setAffirmationMessage(null);
      setGentleRetryActive(false);
    } catch (err: any) {
      console.warn("Could not switch route scaffolding:", err);
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
        step_name: specification?.sequence[currentStepIndex]?.title || "Waypoint",
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
      // Gentle reassurance
      setGentleRetryActive(true);
      setAffirmationMessage(option.gentle_affirmation);
      speakWarmly(option.gentle_affirmation, { rate: 0.9 });

      const log: GameTrialTelemetry = {
        trial_index: currentStepIndex + 1,
        step_name: specification?.sequence[currentStepIndex]?.title || "Waypoint",
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

  // Level 5 Independent Recall landmark tap
  const handleTapIndependentLandmark = (landmarkId: string) => {
    if (independentSequence.includes(landmarkId)) return;

    const nextIndex = independentSequence.length;
    const expectedTarget = targetRecallSequence[nextIndex];

    if (landmarkId === expectedTarget) {
      const updated = [...independentSequence, landmarkId];
      setIndependentSequence(updated);

      const lm = familiarLandmarks.find((l) => l.id === landmarkId);
      const note = `Wonderful! Next stop is ${lm?.name}.`;
      setAffirmationMessage(note);
      speakWarmly(note, { rate: 0.9 });

      if (updated.length === targetRecallSequence.length) {
        setAffirmationMessage("You have completed the entire familiar journey from Home to Market!");
        speakWarmly("You have completed the entire familiar journey from Home to Market!", { rate: 0.9 });
      }
    } else {
      setGentleRetryActive(true);
      setAffirmationMessage("Let us take our time. Consider which familiar landmark comes earlier along this path.");
      speakWarmly("Let us take our time. Consider which familiar landmark comes earlier along this path.", { rate: 0.85 });
    }
  };

  // Advance to next waypoint
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
      step_name: specification.sequence[currentStepIndex]?.title || "Waypoint",
      stimulus: specification.sequence[currentStepIndex]?.stimulus.image_caption || "",
      user_selection: "Stepped gently forward",
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
      `Route Builder Completed: ${telemetryLogs.length} familiar waypoints safely traversed from Home Courtyard to Chowk Bazaar.`
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "loading") {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl border border-[#bdd4b0] animate-pulse">
          🚶‍♂️
        </div>
        <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
          Tracing Your Familiar Lifetime Pathway
        </h3>
        <p className="text-xs text-[#736a5e] max-w-md mx-auto leading-relaxed">
          Retrieving caregiver-verified landmarks between your ancestral courtyard and Tezpur Chowk Bazaar. Zero GPS or unfamiliar routes.
        </p>
        <p className="text-xs text-[#595043] font-serif italic">
          "আপোনাৰ চিনাকি বাটৰ স্থানবোৰ প্ৰস্তুত কৰা হৈছে..."
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ERROR / SAFETY GATE REJECTION
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "error" || validationError) {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-8 max-w-2xl mx-auto my-8 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl">
          🛡️
        </div>
        <h3 className="font-serif text-xl font-medium text-[#2c2824]">
          Clinical Safety Invariant Gate
        </h3>
        <p className="text-xs text-[#595043] leading-relaxed max-w-lg mx-auto">
          The route specification did not meet the non-negotiable familiar-route constraints. We strictly forbid artificial, unfamiliar routes or competitive timers.
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
          🧭
        </div>
        <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
          Route Verification in Progress
        </h3>
        <p className="text-xs sm:text-sm text-[#595043] leading-relaxed">
          MindMitra requires routes to be deeply familiar and signed by family before use. We never present unfamiliar pathways or generic map navigation.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a] transition"
        >
          ← Return to Space
        </button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PAUSED / REST WITH TEA
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "paused") {
    return (
      <div className="bg-[#fbf7ee] border border-[#d6cbba] rounded-3xl p-8 max-w-xl mx-auto my-10 shadow-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-4xl border-2 border-[#bdd4b0] animate-pulse">
          🍵
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-medium text-[#2c2824]">
            Rest for a Moment Under the Nahor Shade
          </h3>
          <p className="text-xs sm:text-sm text-[#595043] font-serif italic">
            "চাহৰ কাপ আৰু এক মুহূৰ্ত জিৰণি..."
          </p>
          <p className="text-xs text-[#736a5e] max-w-md mx-auto leading-relaxed pt-1">
            Sit back comfortably. Your route walk is resting. The morning walk can resume whenever you are ready.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setLifecycleState("playing")}
            className="px-6 py-3 bg-[#485935] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#39472a] shadow-sm transition"
          >
            ▶ Continue Walking Gently
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
              Bounded Route Context Pack
            </span>
            <h3 className="font-serif text-xl font-medium text-[#2c2824] mt-1">
              Verified Waypoints for Game 8 (Route Builder)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setLifecycleState("playing")}
            className="text-xs bg-[#485935] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#39472a] transition"
          >
            Walk Route →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-[#dfd4c0] rounded-2xl space-y-1">
            <span className="font-semibold text-[#41382c]">Familiar Route:</span>
            <div className="text-[#595043]">
              {contextPack.route.data.title} ({contextPack.route.data.assamese_title})
            </div>
            <div className="text-[11px] text-[#736a5e]">
              Provenance: Caregiver Verified • Confidence: {contextPack.route.metadata.confidence.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#dfd4c0] rounded-2xl space-y-1">
            <span className="font-semibold text-[#41382c]">Destination Landmark:</span>
            <div className="text-[#595043]">
              {contextPack.destination.data.name} ({contextPack.destination.data.assamese_name})
            </div>
            <div className="text-[11px] text-[#736a5e]">
              Map type: Offline Personal Environmental • Zero GPS Tracking
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#41382c]">Waypoints Along the Route:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {familiarLandmarks.map((lm) => (
              <div
                key={lm.id}
                className="p-3 bg-white border border-[#dfd4c0] rounded-xl flex items-center gap-3 text-xs"
              >
                <span className="text-2xl">{lm.icon}</span>
                <div>
                  <div className="font-semibold text-[#2c2824]">{lm.name}</div>
                  <div className="text-[11px] text-[#736a5e] font-serif">{lm.assamese_name}</div>
                  <div className="text-[10px] text-[#8c8273] mt-0.5">{lm.sensory_cue}</div>
                </div>
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
            Start Route Walk →
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. BEAUTIFUL COMPLETION STATE (WALKED ROUTE KEEPSAKE)
  // ──────────────────────────────────────────────────────────────────────────
  if (lifecycleState === "completed" && specification) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6 animate-fade-in pb-12">
        <div className="bg-white border-2 border-[#bdd4b0] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl border-2 border-[#bdd4b0]">
            🏡
          </div>
          <div className="space-y-1">
            <span className="bg-[#485935]/15 text-[#334224] text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Route Journey Safely Completed
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

        {/* Walked Pathway Visualizer Keepsake */}
        <div className="bg-[#fbf7ee] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#dfd4c0] pb-3">
            <h4 className="font-serif text-lg font-medium text-[#2c2824] flex items-center gap-2">
              <span>🌿</span>
              <span>Your Walked Familiar Pathway</span>
            </h4>
            <span className="text-xs text-[#485935] font-semibold bg-[#edf4ea] px-3 py-1 rounded-full">
              ✓ Destination Reached
            </span>
          </div>

          {/* Stepping Stone Pathway */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative py-4">
            {familiarLandmarks.map((lm, idx) => (
              <React.Fragment key={lm.id}>
                <div className="flex flex-col items-center text-center space-y-1 z-10 w-full sm:w-1/4">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#485935] text-[#2c401e] flex items-center justify-center text-2xl shadow-sm">
                    {lm.icon}
                  </div>
                  <span className="font-serif text-xs font-semibold text-[#2c2824] leading-tight">
                    {lm.name}
                  </span>
                  <span className="text-[10px] text-[#736a5e] font-serif">
                    {lm.assamese_name}
                  </span>
                </div>
                {idx < familiarLandmarks.length - 1 && (
                  <div className="hidden sm:flex flex-1 h-0.5 bg-[#bdd4b0] items-center justify-center">
                    <span className="text-xs text-[#485935]">→</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white border border-[#bdd4b0] rounded-2xl p-4 text-xs text-[#2c401e] flex items-start gap-3">
            <span className="text-xl">🌸</span>
            <div>
              <span className="font-semibold block">Spatial Confidence Reassurance:</span>
              <p className="text-[#41382c] leading-relaxed">
                You know every bend, tree, and tea stall of this Tezpur route intimately. Your spatial memories remain a source of comfort and belonging.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGracefulExit}
            className="px-8 py-3.5 bg-[#485935] hover:bg-[#39472a] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm"
          >
            ✓ Gracefully Return to Space
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ACTIVE PLAYING VIEW (GAME 8 ENGINE RUNTIME)
  // ──────────────────────────────────────────────────────────────────────────
  if (!specification) return null;

  const currentStep: StepSpecification = specification.sequence[currentStepIndex];

  const isLevel1Direct = scaffoldingLevel === "destination_recognition";
  const isLevel2Obvious = scaffoldingLevel === "obvious_route";
  const isLevel3Sequencing = scaffoldingLevel === "landmark_sequencing";
  const isLevel4ReducedCues = scaffoldingLevel === "reduced_visual_cues";
  const isLevel5Independent = scaffoldingLevel === "independent_route_recall";

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Top Header & Status Bar */}
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
              Deterministic Runtime • Game 8
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
            {specification.prompt.assamese_title || "চিনাকি বাটৰ যাত্ৰা"}
          </div>
        </div>

        {/* Top Controls: Scaffolding, Sound, Rest */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#595043] font-medium hidden sm:inline">Difficulty:</span>
            <select
              value={scaffoldingLevel}
              onChange={(e) => handleSwitchScaffolding(e.target.value as RouteScaffoldingLevel)}
              className="bg-[#faf6f0] border border-[#d6cbba] rounded-xl px-2.5 py-1.5 text-xs text-[#2c2824] font-medium"
              title="Select Route Scaffolding Level"
            >
              <option value="destination_recognition">Level 1: Home → Market</option>
              <option value="obvious_route">Level 2: Home → Park → Market</option>
              <option value="landmark_sequencing">Level 3: Home → Park → Temple → Market</option>
              <option value="reduced_visual_cues">Level 4: Fewer Visual Cues</option>
              <option value="independent_route_recall">Level 5: Independent Route Recall</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#faf6f0] border border-[#d6cbba] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => handleToggleSound("courtyard")}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                activeSound === "courtyard" ? "bg-[#485935] text-white" : "text-[#595043]"
              }`}
              title="Courtyard Soundscape"
            >
              🏡 Home
            </button>
            <button
              type="button"
              onClick={() => handleToggleSound("river")}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                activeSound === "river" ? "bg-[#485935] text-white" : "text-[#595043]"
              }`}
              title="River Breeze"
            >
              🌊 River
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

          <button
            type="button"
            onClick={() => setLifecycleState("paused")}
            className="text-xs font-medium text-[#485935] hover:text-[#334224] bg-[#edf4ea] border border-[#bdd4b0] px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            title="Take a rest with tea"
          >
            <span>🍵</span>
            <span className="hidden sm:inline">Rest</span>
          </button>
        </div>
      </div>

      {/* Stepping-Stone Landmark Route Pathway (Visual Familiar Environment, No GPS) */}
      <div className="bg-[#fbf7ee] border border-[#dfd4c0] rounded-2xl p-4 shadow-xs">
        <div className="flex justify-between items-center text-xs text-[#736a5e] mb-2 px-1">
          <span className="font-serif font-medium text-[#41382c]">
            Walking Route: Ancestral Courtyard → Chowk Bazaar
          </span>
          <span>No live GPS • Lifetime Familiar Waypoints</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {familiarLandmarks.map((lm, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={lm.id}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1 ${
                  isCurrent
                    ? "bg-white border-2 border-[#485935] shadow-xs"
                    : isCompleted
                    ? "bg-[#edf4ea] border-[#bdd4b0] text-[#2c401e]"
                    : "bg-[#faf6f0] border-[#dfd4c0] text-[#736a5e]"
                }`}
              >
                <span className="text-xl">{lm.icon}</span>
                <span className="font-serif text-[11px] font-semibold text-[#2c2824] leading-tight">
                  {lm.name}
                </span>
                <span className="text-[9px] text-[#736a5e] font-serif">
                  {lm.assamese_name}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-medium mt-1">
                  {isCurrent ? "📍 Current Step" : isCompleted ? "✓ Passed" : `Step ${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Route Card */}
      <div className="bg-[#fbf7ee] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        {/* Step Prompt */}
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
              <span>Contextual Clue</span>
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

        {/* Step Stimulus & Interaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Landmark Presentation Canvas */}
          <div className="space-y-3">
            {isLevel4ReducedCues ? (
              <div className="h-64 sm:h-80 rounded-3xl bg-[#faf6f0] border-2 border-dashed border-[#dfd4c0] p-6 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-4xl">🍃</span>
                <span className="font-serif text-base font-medium text-[#2c2824]">
                  Sensory Route Anchor
                </span>
                <p className="text-xs text-[#595043] max-w-xs leading-relaxed">
                  "Scent of sweet Nahor blossom petals on the cool damp stone path, and distant echoes of the temple bell."
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="bg-white border border-[#dfd4c0] px-2.5 py-1 rounded-lg text-xs text-[#41382c]">
                    🌸 Nahor Flowers
                  </span>
                  <span className="bg-white border border-[#dfd4c0] px-2.5 py-1 rounded-lg text-xs text-[#41382c]">
                    🛕 Morning Bells
                  </span>
                </div>
              </div>
            ) : (
              <ImagePresentation
                imageUrl={currentStep.stimulus.image_url}
                caption={currentStep.stimulus.image_caption}
                altText={currentStep.title}
                provenanceBadge="Verified Landmark • Family Route"
                sensoryBadges={currentStep.stimulus.sensory_anchors}
              />
            )}

            <AudioPlayback
              soundType={currentStep.stimulus.ambient_sound}
              label={
                currentStep.stimulus.ambient_sound === "river"
                  ? "Brahmaputra River Gentle Water"
                  : "Ancestral Courtyard Morning Sounds"
              }
              voiceNote={currentStep.stimulus.family_voice_note}
            />
          </div>

          {/* Right: Interaction (Tapping, Not Dragging!) */}
          <div className="space-y-5">
            {/* Level 5: Independent Route Recall (Tap landmarks to build sequence) */}
            {isLevel5Independent ? (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#41382c] block">
                  Tap the landmarks in order along your morning walk:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {familiarLandmarks.map((lm) => {
                    const isSelected = independentSequence.includes(lm.id);
                    const selectedIdx = independentSequence.indexOf(lm.id);
                    return (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => handleTapIndependentLandmark(lm.id)}
                        disabled={isSelected}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? "bg-[#edf4ea] border-[#485935] text-[#2c401e] opacity-90 cursor-default"
                            : "bg-white border-[#dfd4c0] hover:border-[#485935] text-[#2c2824]"
                        }`}
                        style={{ minHeight: "48px" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lm.icon}</span>
                          <div>
                            <span className="font-serif font-semibold text-sm block">
                              {lm.name}
                            </span>
                            <span className="text-xs text-[#736a5e] font-serif">
                              {lm.assamese_name}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="bg-[#485935] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                            {selectedIdx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Levels 1-4: Standard Large Tap Selection (2-3 options, no dragging) */
              currentStep.allowed_responses.options && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[#41382c] block">
                    {isLevel1Direct
                      ? "Recognize your destination:"
                      : "Choose the familiar landmark along the path:"}
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

            {/* Affirmation Message */}
            {affirmationMessage && !gentleRetryActive && (
              <div className="bg-[#edf4ea] border border-[#9bc490] rounded-2xl p-4 text-xs text-[#2c401e] space-y-1 animate-fade-in shadow-xs">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>🚶‍♂️</span>
                  <span>Path Reassured</span>
                </div>
                <p className="leading-relaxed">{affirmationMessage}</p>
              </div>
            )}

            {/* Gentle Retry Message */}
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

        {/* Navigation Controls */}
        <NavigationControls
          onContinue={handleAdvanceStep}
          onSkip={handleSkipStep}
          continueLabel={
            currentStepIndex === specification.sequence.length - 1
              ? "Complete Route 🏡"
              : "Continue Along Route →"
          }
          skipLabel="Step forward gently"
          showSkip={true}
          disabledContinue={false}
        />
      </div>

      {/* Hint Modal */}
      {showHintModal && (
        <HintModal
          hints={currentStep.hints}
          onClose={() => setShowHintModal(false)}
          onHintUsed={(level) => setHintUsedCount((prev) => Math.max(prev, level))}
        />
      )}
    </div>
  );
};
