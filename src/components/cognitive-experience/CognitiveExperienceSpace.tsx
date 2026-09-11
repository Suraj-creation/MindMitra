import React, { useState, useEffect } from "react";
import { useCompanion } from "../../context/CompanionContext";
import { MyLifeTimelineEngine } from "./MyLifeTimelineEngine";
import { PrepareForEngine } from "./PrepareForEngine";
import { ExperienceBraidEngine } from "./ExperienceBraidEngine";
import { ReminiscenceJourneyEngine } from "./ReminiscenceJourneyEngine";
import { RouteBuilderEngine } from "./RouteBuilderEngine";
import { YesterdayTodayTomorrowEngine } from "./YesterdayTodayTomorrowEngine";
import { SaveMemoryStudio } from "./SaveMemoryStudio";
import { CognitiveTelemetryInspector } from "./CognitiveTelemetryInspector";
import { PersonalGameContextInspector } from "./PersonalGameContextInspector";
import { TemporalEngineInspector } from "./TemporalEngineInspector";
import { ExperienceRenderer } from "./ExperienceRenderer";
import { GameTrialTelemetry, MemoryItem, ExperienceEpisode } from "../../domain/cognitive-experience";
import {
  ExperienceEpisodeBuilder,
  OfflineEventOutbox,
  ProgressivePersonalisationLadder,
} from "../../intelligence/adaptation/index.js";
import { cognitiveStore } from "../../intelligence/cognitive-engine.js";
import { api } from "../../lib/api";
import { flushExperienceEvents, recordExperienceEvent } from "../../lib/experience-telemetry";
import type { ExperienceSpec } from "../../intelligence/experience/types";

const PERSON_ID = "person:purnima";

interface Props {
  onBackToDay?: () => void;
  /** Deep link from the companion: open this already-planned experience. */
  initialExperienceId?: string | null;
  /** Called once the deep link has been consumed, so it isn't reopened on every render. */
  onExperienceConsumed?: () => void;
}

type DynamicState =
  | { kind: "loading" }
  | { kind: "ready"; spec: ExperienceSpec }
  | { kind: "playing"; spec: ExperienceSpec }
  | { kind: "unavailable"; message: string };

export const CognitiveExperienceSpace: React.FC<Props> = ({
  onBackToDay,
  initialExperienceId,
  onExperienceConsumed,
}) => {
  const [activeEngine, setActiveEngine] = useState<
    "none" | "timeline" | "prepare" | "braid" | "garland" | "reminiscence" | "route_builder" | "temporal"
  >("none");

  // ── The dynamic experience region ────────────────────────────────────────
  // This is the primary surface. Everything below it is the always-available
  // fallback layer.
  const [dynamic, setDynamic] = useState<DynamicState>({ kind: "loading" });
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [showMemoryStudio, setShowMemoryStudio] = useState<boolean>(false);
  const [showTelemetryInspector, setShowTelemetryInspector] = useState<boolean>(false);
  const [showRetrievalInspector, setShowRetrievalInspector] = useState<boolean>(false);
  const [showTemporalInspector, setShowTemporalInspector] = useState<boolean>(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);
  const [lastEpisode, setLastEpisode] = useState<ExperienceEpisode | null>(null);

  // Garland state (preserved gentle sensory activity)
  const [garlandFlowers, setGarlandFlowers] = useState<string[]>([]);
  const [flutePlaying, setFlutePlaying] = useState<boolean>(false);
  const companion = useCompanion();

  useEffect(() => {
    if (activeEngine === "none") {
      companion.updateContext({ active_game: null });
    } else {
      const titles: Record<string, string> = {
        temporal: "Yesterday, Today & Tomorrow",
        timeline: "My Life Timeline",
        prepare: "Prepare For Morning Tea & Market",
        braid: "Experience Braid",
        garland: "Sensory Marigold Garland",
        reminiscence: "Reminiscence Journey",
        route_builder: "Route Builder to Daily Market",
      };
      companion.updateContext({
        active_game: {
          game_id: activeEngine,
          title: titles[activeEngine] || activeEngine,
          current_question: "Gentle exploration step",
          scaffolding_level: 0,
        },
      });
    }
  }, [activeEngine, companion.updateContext]);

  // Clear the activity context when this surface goes away.
  //
  // PersonApp unmounts this component on navigation ({activeSection ===
  // "activity" && <CognitiveExperienceSpace/>}), and the effect above only
  // clears active_game when the engine is closed *while still mounted*. Leaving
  // an activity open and tapping "My Day" therefore pinned active_game -- e.g.
  // "Route Builder to Daily Market" -- into the companion context permanently,
  // so every later question was interpreted as being about that activity.
  useEffect(() => {
    return () => {
      companion.updateContext({ active_game: null });
    };
  }, [companion.updateContext]);

  const handleEngineComplete = async (telemetry: GameTrialTelemetry[], summary: string) => {
    const prevEngine = activeEngine;
    setActiveEngine("none");

    const templateKey =
      prevEngine === "temporal"
        ? "yesterday_today_tomorrow"
        : prevEngine === "timeline"
        ? "my_life_timeline"
        : prevEngine === "prepare"
        ? "prepare_for"
        : prevEngine === "braid"
        ? "experience_braid"
        : prevEngine === "reminiscence"
        ? "reminiscence_journey_my_world"
        : prevEngine === "route_builder"
        ? "route_builder_familiar_places"
        : "sensory_garland";

    const domain =
      prevEngine === "temporal"
        ? "temporal_orientation"
        : prevEngine === "route_builder"
        ? "spatial_orientation"
        : prevEngine === "prepare"
        ? "executive_planning"
        : "autobiographical_memory";

    // 1. Build rich Experience Episode using Adaptation layer
    const episode = ExperienceEpisodeBuilder.buildEpisode({
      personId: "person:purnima",
      templateKey,
      objective: summary,
      difficulty: prevEngine === "reminiscence" ? 2 : prevEngine === "route_builder" ? 1 : 1,
      modality: prevEngine === "reminiscence" ? "photo_plus_voice" : "tactile_touch",
      trials: telemetry,
      domain,
    });

    // 2. Record in CognitiveStore with evidence-gated PCM and freshness tracking
    const recorded = cognitiveStore.recordEpisode(episode);
    setLastEpisode(recorded);

    // 3. Enqueue into OfflineEventOutbox for idempotent sync
    OfflineEventOutbox.enqueueEvent("experience_episode", recorded, `idem_${recorded.session_id}`);
    OfflineEventOutbox.syncPendingEvents().catch(() => {});

    // 4. Compute next gentle scaffolding step from ladder
    const ladderProgress =
      prevEngine === "reminiscence"
        ? ProgressivePersonalisationLadder.getNextGame7SessionRecommendation([recorded])
        : prevEngine === "route_builder"
        ? ProgressivePersonalisationLadder.getNextGame8SessionRecommendation([recorded])
        : null;

    const nextAdvice = ladderProgress?.rationale || "Cherished moments preserved with care and dignity.";
    setCompletionBanner(`Completed: ${summary} — ${nextAdvice}`);

    // 5. Asynchronously persist to server
    try {
      await fetch("/v1/cognitive-studio/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recorded),
      });
    } catch (err) {
      console.warn("Episode stored locally in offline outbox:", err);
    }

    setTimeout(() => {
      setCompletionBanner(null);
    }, 8000);
  };

  // ── Dynamic experience lifecycle ─────────────────────────────────────────

  const loadDynamic = React.useCallback(
    async (opts: { specId?: string | null } = {}) => {
      setDynamic({ kind: "loading" });
      try {
        const result = opts.specId
          ? await api.getExperience(PERSON_ID, opts.specId)
          : await api.planExperience({ personId: PERSON_ID, trigger: "lets_do_something", language: "en" });

        if (result.status === "ready" && result.spec) {
          setDynamic({ kind: "ready", spec: result.spec });
          recordExperienceEvent({
            person_id: PERSON_ID,
            spec_id: result.spec.spec_id,
            template_id: result.spec.template_id,
            reason: result.spec.reason,
            event_type: "EXPERIENCE_SUGGESTED",
            context: { via: opts.specId ? "deep_link" : "lets_do_something" },
          });
        } else {
          setDynamic({
            kind: "unavailable",
            message: result.message || "I don't have enough saved information for that one just now.",
          });
        }
      } catch {
        // Section 39/41: no stack traces, no technical loading language, and no
        // pretending a cloud-planned experience is available when it isn't.
        setDynamic({
          kind: "unavailable",
          message:
            typeof navigator !== "undefined" && !navigator.onLine
              ? "We're offline just now, so I can't prepare something new. The activities below are always here."
              : "Let's try something else.",
        });
      }
    },
    []
  );

  useEffect(() => {
    if (initialExperienceId) {
      void loadDynamic({ specId: initialExperienceId }).then(() => onExperienceConsumed?.());
    } else {
      void loadDynamic();
    }
    // Deliberately keyed on the deep link only: opening the page plans once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExperienceId]);

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      void flushExperienceEvents();
    };
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void flushExperienceEvents();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const acceptDynamic = () => {
    if (dynamic.kind !== "ready") return;
    recordExperienceEvent({
      person_id: PERSON_ID,
      spec_id: dynamic.spec.spec_id,
      template_id: dynamic.spec.template_id,
      reason: dynamic.spec.reason,
      event_type: "EXPERIENCE_ACCEPTED",
    });
    setDynamic({ kind: "playing", spec: dynamic.spec });
  };

  const declineDynamic = () => {
    if (dynamic.kind !== "ready") return;
    recordExperienceEvent({
      person_id: PERSON_ID,
      spec_id: dynamic.spec.spec_id,
      template_id: dynamic.spec.template_id,
      reason: dynamic.spec.reason,
      event_type: "EXPERIENCE_DECLINED",
      outcome: "DECLINED",
    });
    // "Not now" means not now -- it does not immediately produce another offer.
    setDynamic({
      kind: "unavailable",
      message: "That's fine. The activities below are here whenever you'd like them.",
    });
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

      {showRetrievalInspector && (
        <PersonalGameContextInspector onClose={() => setShowRetrievalInspector(false)} />
      )}

      {showTemporalInspector && (
        <TemporalEngineInspector onClose={() => setShowTemporalInspector(false)} />
      )}

      {/* Completion Banner */}
      {completionBanner && (
        <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-2xl p-4 text-center text-xs sm:text-sm shadow-sm transition">
          {completionBanner}
        </div>
      )}

      {/* ── ACTIVE DETERMINISTIC ENGINE VIEWS ── */}
      {activeEngine === "temporal" && (
        <YesterdayTodayTomorrowEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
        />
      )}

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
        />
      )}

      {/* ── GAME 7: REMINISCENCE JOURNEY — MY WORLD ── */}
      {activeEngine === "reminiscence" && (
        <ReminiscenceJourneyEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
        />
      )}

      {/* ── GAME 8: ROUTE BUILDER — FAMILIAR PLACES ── */}
      {activeEngine === "route_builder" && (
        <RouteBuilderEngine
          onComplete={handleEngineComplete}
          onBack={() => setActiveEngine("none")}
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

      {/* ── DYNAMIC PERSONALISED EXPERIENCE (primary surface) ── */}
      {activeEngine === "none" && dynamic.kind === "playing" && (
        <ExperienceRenderer
          spec={dynamic.spec}
          onExit={() => {
            void flushExperienceEvents();
            setCompletionBanner(dynamic.spec.completion.message);
            setDynamic({
              kind: "unavailable",
              message: "Whenever you'd like to do something again, just say so.",
            });
            window.setTimeout(() => setCompletionBanner(null), 6000);
          }}
        />
      )}

      {/* ── HOME VIEW: PERSONAL COGNITIVE EXPERIENCE SPACE ── */}
      {activeEngine === "none" && dynamic.kind !== "playing" && (
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

              {/* Utility Actions -- engineering inspector panels (telemetry/retrieval/temporal
                  debug views) are intentionally not exposed here: this is the person-facing
                  surface and must stay free of internal system framing. */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setShowMemoryStudio(true)}
                  className="bg-[#485935] text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#39472a] transition shadow-sm flex items-center gap-2"
                >
                  <span>📷 Preserve a Memory</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── DYNAMIC EXPERIENCE REGION (Sections 1A/2/5) ──────────────────
              The primary surface. One stable frame; what renders inside it is
              whatever the Experience Engine composed from this person's own
              life today. It is not bound to any one activity, and it never
              shows system framing -- no "AI generated", no template name, no
              retrieval confidence (Section 38). */}
          <section
            aria-label="Something for today"
            aria-live="polite"
            className="bg-[#faf6f0] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-10 shadow-sm min-h-[260px] flex items-center justify-center"
          >
            {dynamic.kind === "loading" && (
              <p className="text-lg text-[#6a6154] font-serif">Getting something ready for you…</p>
            )}

            {dynamic.kind === "unavailable" && (
              <div className="text-center space-y-5 max-w-xl">
                <p className="text-lg sm:text-xl text-[#453d33] font-serif leading-relaxed">
                  {dynamic.message}
                </p>
                <button
                  onClick={() => void loadDynamic()}
                  disabled={isOffline}
                  className="min-h-[56px] px-7 py-4 rounded-2xl border-2 border-[#dfd4c0] bg-white text-base font-medium text-[#41382c] hover:border-[#485935] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
                >
                  {isOffline ? "Not available offline" : "See if there's something else"}
                </button>
              </div>
            )}

            {dynamic.kind === "ready" && (
              <div className="w-full flex flex-col lg:flex-row gap-7 items-center">
                {dynamic.spec.steps[0]?.media && (
                  <img
                    src={dynamic.spec.steps[0].media!.url}
                    alt={dynamic.spec.steps[0].media!.alt_text}
                    className="w-full lg:w-1/3 h-56 object-cover rounded-2xl bg-[#e8e0d2]"
                  />
                )}
                <div className="w-full space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#2c2824]">
                    {dynamic.spec.title}
                  </h2>
                  <p className="text-base sm:text-lg text-[#595043] leading-relaxed">
                    {dynamic.spec.invitation_text}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={acceptDynamic}
                      className="min-h-[56px] px-7 py-4 rounded-2xl bg-[#485935] text-white text-base font-medium hover:bg-[#39472a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
                    >
                      Let's try it
                    </button>
                    <button
                      onClick={declineDynamic}
                      className="min-h-[56px] px-7 py-4 rounded-2xl border-2 border-[#dfd4c0] bg-white text-base font-medium text-[#41382c] hover:border-[#485935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {isOffline && (
            <p role="status" className="text-sm text-[#6a6154] text-center">
              You're offline. Anything you do is saved here and will sync when the connection returns.
            </p>
          )}


          {/* ── ALWAYS AVAILABLE: static / offline experiences (Section 4) ──
              Visually secondary to the dynamic region above, and deliberately
              unchanged in name and behaviour -- these work with no network and
              no cloud retrieval. */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-medium text-[#2c2824]">
                Always Available <span className="text-sm font-normal text-[#736a5e]">(সদায় উপলব্ধ)</span>
              </h3>
              <span className="text-xs text-[#736a5e]">These work even without a connection</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Daily Orientation: Yesterday, Today & Tomorrow */}
              <div
                onClick={() => setActiveEngine("temporal")}
                className="cursor-pointer bg-[#faf6f0] border-2 border-[#485935] hover:border-[#384629] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2] relative">
                    <img
                      src="/assets/images/assamese_courtyard_1788980055319.jpg"
                      alt="Yesterday, Today & Tomorrow"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#485935] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Daily Orientation
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/65 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                      Tomorrow: Rina Visiting 🕊️
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#485935]">Temporal Orientation & Grounding</span>
                    <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                      Yesterday, Today & Tomorrow <span className="text-xs font-normal text-[#736a5e]">(কালি, আজি আৰু কাইলৈ)</span>
                    </h4>
                    <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                      Connect yesterday's courtyard moments with today's calm routine and anticipate tomorrow's confirmed visit from Rina.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#dfd4c0] flex justify-between items-center text-xs">
                  <span className="text-[#736a5e]">S0-S5 Adaptive Ladder</span>
                  <span className="font-semibold text-[#485935]">Enter Orientation →</span>
                </div>
              </div>

              {/* Game 7: Reminiscence Journey — My World */}
              <div
                onClick={() => setActiveEngine("reminiscence")}
                className="cursor-pointer bg-white border-2 border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2] relative">
                    <img
                      src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                      alt="Reminiscence Journey"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#485935] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Game 7
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#8b4513]">Autobiographical Reminiscence</span>
                    <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                      Reminiscence Journey — My World <span className="text-xs font-normal text-[#736a5e]">(মোৰ পৃথিৱীৰ স্মৃতি)</span>
                    </h4>
                    <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                      Life chapters, school days, wedding ceremonies, and family voice notes. Fully grounded in verified Tezpur memories.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs">
                  <span className="text-[#736a5e]">Verified Archival Engine</span>
                  <span className="font-semibold text-[#485935]">Begin Reminiscence →</span>
                </div>
              </div>

              {/* Game 8: Route Builder — Familiar Places */}
              <div
                onClick={() => setActiveEngine("route_builder")}
                className="cursor-pointer bg-white border-2 border-[#dfd4c0] hover:border-[#485935] rounded-3xl p-5 space-y-4 shadow-sm transition duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden bg-[#e8e0d2] relative">
                    <img
                      src="/assets/images/brahmaputra_river_1788977296883.jpg"
                      alt="Route Builder"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#b8860b] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Game 8
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#b8860b]">Spatial Orientation (Non-GPS)</span>
                    <h4 className="text-lg font-serif font-medium text-[#2c2824] mt-0.5">
                      Route Builder — Familiar Places <span className="text-xs font-normal text-[#736a5e]">(চিনাকি বাট নিৰ্মাণ)</span>
                    </h4>
                    <p className="text-xs text-[#595043] mt-1 leading-relaxed">
                      Reconstruct daily walks to the Brahmaputra ghat or school using visual landmarks, tea stall crossroads, and sensory cues.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs">
                  <span className="text-[#736a5e]">Wayfinding Engine</span>
                  <span className="font-semibold text-[#b8860b]">Build Familiar Path →</span>
                </div>
              </div>

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
          </div>
        </>
      )}
    </div>
  );
};
