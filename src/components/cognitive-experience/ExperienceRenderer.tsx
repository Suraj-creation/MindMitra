import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCompanion } from "../../context/CompanionContext";
import { recordExperienceEvent } from "../../lib/experience-telemetry";
import type {
  AssistanceLevel,
  ExperienceOutcome,
  ExperienceSpec,
  ExperienceStep,
  ResolvedMedia,
} from "../../intelligence/experience/types";

/**
 * The universal experience renderer.
 *
 * It executes a validated ExperienceSpec and knows nothing about where the
 * content came from -- which template composed it, which records it drew on,
 * or whether it was planned from a conversation or from opening this page.
 * That is the whole point: one renderer, and the intelligence lives upstream.
 *
 * What it owns:
 *   - presenting each step
 *   - the S0-S5 assistance ladder (Section 24)
 *   - emotionally safe correction (Sections 25/26) -- no score, no timer,
 *     no confetti, no streak, and no failure screen
 *   - emitting the Section 45 event stream, including measurement quality
 *     and the conditions it was observed under (Section 23)
 */

interface Props {
  spec: ExperienceSpec;
  onExit: (summary: { outcome: ExperienceOutcome; assistanceUsed: AssistanceLevel }) => void;
}

/** Record the conditions the observation was made under, not just the answer. */
function measurementConditions(spec: ExperienceSpec, assistance: AssistanceLevel, mediaShown: boolean) {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    language_match: spec.language,
    assistance_level: assistance,
    modality: spec.modality,
    media_rendered: mediaShown,
    online: nav?.onLine ?? true,
    viewport:
      typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown",
    reduced_motion:
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
  };
}

/**
 * How much this observation can be trusted as a signal (Section 23). Assistance
 * is the dominant factor: an answer given after a full reveal says almost
 * nothing about unaided recall, so it is recorded with low quality rather than
 * counted as a success.
 */
function qualityFor(assistance: AssistanceLevel, mediaExpectedButMissing: boolean): number {
  const byAssistance = [1.0, 0.9, 0.8, 0.65, 0.4, 0.2][assistance] ?? 0.5;
  return Number((mediaExpectedButMissing ? byAssistance * 0.5 : byAssistance).toFixed(2));
}

const MediaFrame: React.FC<{ media: ResolvedMedia }> = ({ media }) => {
  const [failed, setFailed] = useState(false);
  if (media.media_type !== "photo") return null;

  // A photograph that will not load is said out loud, never swapped for a
  // stand-in: a stranger's face under "who is this?" is the worst outcome here.
  if (failed) {
    return (
      <div
        role="img"
        aria-label="This photograph could not be loaded right now."
        className="w-full rounded-2xl bg-[#efe8dc] border border-[#dfd4c0] p-6 text-center text-sm text-[#5b5347]"
      >
        This photograph can't be shown right now. We can still carry on together.
      </div>
    );
  }

  return (
    <img
      src={media.url}
      alt={media.alt_text}
      onError={() => setFailed(true)}
      className="w-full max-h-[46vh] object-contain rounded-2xl bg-[#efe8dc] border border-[#dfd4c0]"
    />
  );
};

export const ExperienceRenderer: React.FC<Props> = ({ spec, onExit }) => {
  const companion = useCompanion();
  const [stepIndex, setStepIndex] = useState(0);
  const [assistance, setAssistance] = useState<AssistanceLevel>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "warm" | "gentle"; text: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const step: ExperienceStep | undefined = spec.steps[stepIndex];
  const stepStartedAt = useRef<number>(Date.now());
  // The highest rung reached anywhere in the experience -- the completion
  // outcome depends on it, so it must not reset between steps.
  const peakAssistance = useRef<AssistanceLevel>(0);
  const exitedRef = useRef(false);

  const emit = useCallback(
    (
      event_type: Parameters<typeof recordExperienceEvent>[0]["event_type"],
      extra: Partial<Parameters<typeof recordExperienceEvent>[0]> = {}
    ) => {
      recordExperienceEvent({
        person_id: spec.person_id,
        spec_id: spec.spec_id,
        template_id: spec.template_id,
        reason: spec.reason,
        event_type,
        step_id: step?.step_id ?? null,
        step_index: step?.step_index ?? null,
        assistance_level: assistance,
        modality: spec.modality,
        language: spec.language,
        measurement_conditions: measurementConditions(spec, assistance, !!step?.media),
        source_entity_ids: step?.source_entity_ids ?? [],
        ...extra,
      });
    },
    [assistance, spec, step]
  );

  // Started / step-started.
  useEffect(() => {
    emit("EXPERIENCE_STARTED");
    // Deliberately once per spec, not per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.spec_id]);

  useEffect(() => {
    if (!step || finished) return;
    stepStartedAt.current = Date.now();
    setSelected(null);
    setFeedback(null);
    setAttemptCount(0);
    setAssistance(0);
    emit("EXPERIENCE_STEP_STARTED");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, spec.spec_id]);

  // Section 28 -- the companion and the activity share context, so "who was
  // that again?" mid-activity resolves against the question on screen.
  useEffect(() => {
    if (!step) return;
    companion.updateContext({
      active_game: {
        game_id: spec.spec_id,
        title: spec.title,
        current_question: step.prompt,
        current_task_index: stepIndex + 1,
        total_tasks: spec.steps.length,
        scaffold_level: `S${assistance}`,
        allowed_actions: ["hint", "skip", "stop"],
      },
    });
  }, [companion, spec, step, stepIndex, assistance]);

  // Leaving the activity must clear it from companion context, or every later
  // question is interpreted as being about an activity that is gone.
  useEffect(() => {
    return () => {
      companion.updateContext({ active_game: null });
    };
  }, [companion.updateContext]);

  const activeScaffold = useMemo(
    () => (assistance > 0 ? step?.scaffolds.find((r) => r.level === assistance) ?? null : null),
    [assistance, step]
  );

  // A narrowing rung actually removes options; every other rung leaves them.
  const visibleChoices = useMemo(() => {
    if (!step) return [];
    const narrowing = step.scaffolds.find(
      (r) => r.kind === "narrowed_choices" && r.level <= assistance && r.keep_choice_ids
    );
    if (!narrowing?.keep_choice_ids) return step.choices;
    const keep = new Set(narrowing.keep_choice_ids);
    return step.choices.filter((c) => keep.has(c.id));
  }, [step, assistance]);

  const maxRung = step?.scaffolds.length ?? 0;

  const offerHelp = useCallback(() => {
    if (!step) return;
    const next = Math.min(maxRung, assistance + 1) as AssistanceLevel;
    if (next === assistance) return;
    setAssistance(next);
    if (next > peakAssistance.current) peakAssistance.current = next;
    const rung = step.scaffolds.find((r) => r.level === next);
    emit("EXPERIENCE_CUE", { assistance_level: next, response: rung?.kind ?? null });
    if (rung?.kind === "full_support") {
      emit("EXPERIENCE_ASSISTED", { assistance_level: next });
    }
  }, [assistance, emit, maxRung, step]);

  const finish = useCallback(
    (outcome: ExperienceOutcome) => {
      if (exitedRef.current) return;
      exitedRef.current = true;
      const eventType =
        outcome === "ABANDONED"
          ? "EXPERIENCE_ABANDONED"
          : outcome === "COMPLETED_WITH_SUPPORT"
          ? "EXPERIENCE_COMPLETED_WITH_SUPPORT"
          : "EXPERIENCE_COMPLETED";
      emit(eventType, { outcome, assistance_level: peakAssistance.current });
      onExit({ outcome, assistanceUsed: peakAssistance.current });
    },
    [emit, onExit]
  );

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!step || selected) return;
      const choice = step.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      const latency = Date.now() - stepStartedAt.current;
      const correct = choice.is_expected;
      const expectedLabel = step.choices.find((c) => c.is_expected)?.label ?? "";
      const attempts = attemptCount + 1;
      setAttemptCount(attempts);

      emit("EXPERIENCE_RESPONSE", {
        response: choice.label,
        expected_response: expectedLabel,
        latency_ms: latency,
        outcome: correct
          ? assistance === 0
            ? "SUCCESS"
            : "COMPLETED_WITH_SUPPORT"
          : "UNSUCCESSFUL",
        measurement_quality: qualityFor(assistance, !!step.media && false),
        source_entity_ids: [choice.source_entity_id, ...step.source_entity_ids],
      });
      emit(correct ? "EXPERIENCE_CORRECT" : "EXPERIENCE_INCORRECT", {
        response: choice.label,
        expected_response: expectedLabel,
        latency_ms: latency,
      });

      if (correct) {
        setSelected(choiceId);
        setFeedback({ tone: "warm", text: choice.affirmation || "Yes — that's right." });
        window.setTimeout(() => {
          if (stepIndex + 1 < spec.steps.length) {
            setStepIndex((i) => i + 1);
          } else {
            setFinished(true);
          }
        }, 1800);
        return;
      }

      // Section 26 -- no harsh failure. The wrong answer is not locked in; the
      // ladder simply moves up one rung and the person tries again.
      setFeedback({ tone: "gentle", text: step.gentle_retry });
      offerHelp();
    },
    [assistance, attemptCount, emit, offerHelp, selected, spec.steps.length, step, stepIndex]
  );

  const skipStep = useCallback(() => {
    emit("EXPERIENCE_RESPONSE", {
      response: null,
      expected_response: step?.choices.find((c) => c.is_expected)?.label ?? null,
      outcome: "UNABLE_TO_ASSESS",
      measurement_quality: 0,
    });
    if (stepIndex + 1 < spec.steps.length) setStepIndex((i) => i + 1);
    else setFinished(true);
  }, [emit, spec.steps.length, step, stepIndex]);

  if (!step && !finished) {
    return null;
  }

  if (finished) {
    const outcome: ExperienceOutcome =
      peakAssistance.current === 0 ? "SUCCESS" : peakAssistance.current >= 4 ? "COMPLETED_TOGETHER" : "COMPLETED_WITH_SUPPORT";
    return (
      <section
        aria-live="polite"
        className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-8 text-center space-y-5 shadow-sm"
      >
        <h2 className="text-2xl font-serif text-[#2c2824]">{spec.completion.message}</h2>
        <p className="text-base text-[#595043]">{spec.completion.graceful_exit}</p>
        <button
          onClick={() => finish(outcome)}
          className="min-h-[56px] px-8 py-4 rounded-2xl bg-[#485935] text-white text-base font-medium hover:bg-[#39472a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
        >
          Finish
        </button>
      </section>
    );
  }

  const s = step!;

  return (
    <section
      aria-label={spec.title}
      className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#2c2824]">{spec.title}</h2>
          <p className="text-sm text-[#6a6154] mt-0.5">{spec.subtitle}</p>
        </div>
        {/* Section 25: no score, no timer, no streak. Progress only where there
            is more than one step, and only as plain words. */}
        {spec.steps.length > 1 && (
          <span className="text-sm text-[#6a6154]">
            Step {stepIndex + 1} of {spec.steps.length}
          </span>
        )}
      </header>

      {s.media && <MediaFrame media={s.media} />}

      <p className="text-xl sm:text-2xl font-serif text-[#2c2824] leading-relaxed" aria-live="polite">
        {s.prompt}
      </p>
      {s.prompt_localised && <p className="text-lg text-[#5b5347] -mt-3">{s.prompt_localised}</p>}

      {activeScaffold && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#d9c9a8] bg-[#f6efe1] p-4 space-y-3"
        >
          <p className="text-base text-[#3f3728]">{activeScaffold.text}</p>
          {activeScaffold.media && <MediaFrame media={activeScaffold.media} />}
        </div>
      )}

      <div
        role="group"
        aria-label="Choose an answer"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      >
        {visibleChoices.map((choice) => {
          const isPicked = selected === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              disabled={!!selected}
              aria-pressed={isPicked}
              // Section 65: >=56px targets, visible focus, and meaning never
              // carried by colour alone -- the affirmation text says it too.
              className={[
                "min-h-[64px] w-full px-5 py-4 rounded-2xl text-lg text-left font-medium border-2 transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]",
                isPicked
                  ? "border-[#485935] bg-[#eaf0e4] text-[#2c401e]"
                  : "border-[#dfd4c0] bg-white text-[#2c2824] hover:border-[#485935]",
                selected && !isPicked ? "opacity-60" : "",
              ].join(" ")}
            >
              {choice.media && (
                <img
                  src={choice.media.url}
                  alt={choice.media.alt_text}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
              )}
              {choice.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <p
          role="status"
          aria-live="assertive"
          className={
            feedback.tone === "warm"
              ? "text-lg text-[#2c401e] bg-[#eaf0e4] border border-[#bdd4b0] rounded-2xl p-4"
              : "text-lg text-[#5b4a2c] bg-[#f6efe1] border border-[#d9c9a8] rounded-2xl p-4"
          }
        >
          {feedback.text}
        </p>
      )}

      <footer className="flex flex-wrap gap-3 pt-2 border-t border-[#e5dac6]">
        {assistance < maxRung && (
          <button
            onClick={offerHelp}
            className="min-h-[52px] px-5 py-3 rounded-2xl border-2 border-[#dfd4c0] bg-white text-base text-[#41382c] hover:border-[#485935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
          >
            A little help
          </button>
        )}
        <button
          onClick={skipStep}
          className="min-h-[52px] px-5 py-3 rounded-2xl border-2 border-[#dfd4c0] bg-white text-base text-[#41382c] hover:border-[#485935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824]"
        >
          Skip this one
        </button>
        <button
          onClick={() => finish("ABANDONED")}
          className="min-h-[52px] px-5 py-3 rounded-2xl border-2 border-[#dfd4c0] bg-white text-base text-[#41382c] hover:border-[#485935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2824] ml-auto"
        >
          That's enough for now
        </button>
      </footer>
    </section>
  );
};
