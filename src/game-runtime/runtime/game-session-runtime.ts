import {
  GameExperienceSpecification,
  GameSessionRuntimeState,
  GameTrialRecord,
  GameOutcome,
  ScaffoldingLevel,
} from "../types";
import { ExperienceEpisode } from "../../domain/cognitive-experience";
import { getNextScaffoldingLevel, getScaffoldingWeight } from "./scaffolding-ladder";

export class GameSessionRuntime {
  private state: GameSessionRuntimeState;
  private spec: GameExperienceSpecification;

  constructor(spec: GameExperienceSpecification, totalSteps: number = 3) {
    this.spec = spec;
    const now = Date.now();
    this.state = {
      session_id: `gsess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spec_id: spec.id,
      template_key: spec.template_key,
      person_id: spec.person_id,
      status: "idle",
      current_step_index: 0,
      total_steps: Math.max(1, totalSteps),
      current_scaffolding_level: spec.difficulty_config?.initial_scaffolding || "independent",
      trials: [],
      started_at: now,
      elapsed_active_ms: 0,
      last_activity_at: now,
      fatigue_detected: false,
    };
  }

  public getState(): Readonly<GameSessionRuntimeState> {
    return { ...this.state };
  }

  public start(): void {
    const now = Date.now();
    this.state.status = "in_progress";
    this.state.started_at = now;
    this.state.last_activity_at = now;
  }

  public pause(): void {
    if (this.state.status === "in_progress") {
      this.state.status = "paused";
      this.state.paused_at = Date.now();
      this.state.elapsed_active_ms += Date.now() - this.state.last_activity_at;
    }
  }

  public resume(): void {
    if (this.state.status === "paused") {
      this.state.status = "in_progress";
      this.state.last_activity_at = Date.now();
      delete this.state.paused_at;
    }
  }

  public requestScaffolding(): ScaffoldingLevel {
    const nextLevel = getNextScaffoldingLevel(this.state.current_scaffolding_level);
    this.state.current_scaffolding_level = nextLevel;
    this.updateActivity();
    return nextLevel;
  }

  public recordTrial(data: {
    step_name: string;
    stimulus: string;
    user_selection: string;
    is_affirmative_match: boolean;
    latency_ms: number;
    hint_used?: boolean;
    completion_state?: "success" | "assisted" | "skipped";
    measurement_quality?: number;
  }): GameTrialRecord {
    const now = Date.now();
    const trialIndex = this.state.trials.length + 1;

    const record: GameTrialRecord = {
      id: `trial_${trialIndex}_${now}`,
      trial_index: trialIndex,
      step_name: data.step_name,
      stimulus: data.stimulus,
      user_selection: data.user_selection,
      is_affirmative_match: data.is_affirmative_match,
      latency_ms: Math.max(50, data.latency_ms),
      scaffolding_level: this.state.current_scaffolding_level,
      hint_used:
        data.hint_used !== undefined
          ? data.hint_used
          : this.state.current_scaffolding_level !== "independent",
      completion_state:
        data.completion_state ||
        (this.state.current_scaffolding_level === "independent" ? "success" : "assisted"),
      measurement_quality:
        data.measurement_quality !== undefined
          ? data.measurement_quality
          : this.calculateMeasurementQuality(data.latency_ms),
      recorded_at: new Date(now).toISOString(),
    };

    this.state.trials.push(record);
    this.updateActivity();

    // Check for cognitive fatigue (e.g. slowed taps > 8s repeatedly)
    this.evaluateFatigue();

    return record;
  }

  public gracefulSkip(stepName: string, stimulus: string = "Skipped step"): GameTrialRecord {
    return this.recordTrial({
      step_name: stepName,
      stimulus,
      user_selection: "graceful_skip",
      is_affirmative_match: true, // Graceful skip is treated with complete dignity, never as failure
      latency_ms: 1000,
      hint_used: false,
      completion_state: "skipped",
      measurement_quality: 0.85,
    });
  }

  public advanceStep(): void {
    if (this.state.current_step_index < this.state.total_steps - 1) {
      this.state.current_step_index += 1;
      // Reset scaffolding to baseline for new step unless fatigue is active
      if (!this.state.fatigue_detected) {
        this.state.current_scaffolding_level =
          this.spec.difficulty_config?.initial_scaffolding || "independent";
      }
    }
    this.updateActivity();
  }

  public haltForFatigue(): void {
    this.state.status = "fatigue_halted";
    this.state.fatigue_detected = true;
    this.state.elapsed_active_ms += Date.now() - this.state.last_activity_at;
  }

  public exitSession(): void {
    this.state.status = "exited";
    this.state.elapsed_active_ms += Date.now() - this.state.last_activity_at;
  }

  public complete(): GameOutcome {
    this.state.status = "completed";
    this.state.elapsed_active_ms += Date.now() - this.state.last_activity_at;

    const trials = this.state.trials;
    const totalTrials = trials.length;
    const completedSteps = trials.filter((t) => t.completion_state !== "skipped").length;
    const skippedSteps = trials.filter((t) => t.completion_state === "skipped").length;

    const totalLatency = trials.reduce((acc, t) => acc + t.latency_ms, 0);
    const averageLatency = totalTrials > 0 ? Math.round(totalLatency / totalTrials) : 0;

    // Calculate assistance rate
    const totalWeight = trials.reduce(
      (acc, t) => acc + getScaffoldingWeight(t.scaffolding_level),
      0
    );
    const scaffoldingAssistanceRate =
      totalTrials > 0 ? Number((totalWeight / totalTrials).toFixed(2)) : 0.0;

    // Find highest scaffolding used
    const highestScaffolding = trials.reduce<ScaffoldingLevel>((highest, t) => {
      return getScaffoldingWeight(t.scaffolding_level) > getScaffoldingWeight(highest)
        ? t.scaffolding_level
        : highest;
    }, "independent");

    // Compute dignified engagement score (0.0 to 1.0)
    // Always rewards participation and calm interaction
    const engagementScore =
      totalTrials > 0
        ? Math.min(1.0, Math.max(0.7, 1.0 - scaffoldingAssistanceRate * 0.2))
        : 0.9;

    const avgQuality =
      totalTrials > 0
        ? Number(
            (
              trials.reduce((acc, t) => acc + t.measurement_quality, 0) /
              totalTrials
            ).toFixed(2)
          )
        : 0.9;

    const celebrationMessage =
      this.spec.instructions.success_celebration ||
      "Every step shared today is complete and deeply valued.";

    const experienceEpisode = this.synthesizeExperienceEpisode(
      engagementScore,
      scaffoldingAssistanceRate,
      avgQuality
    );

    return {
      session_id: this.state.session_id,
      person_id: this.state.person_id,
      template_key: this.state.template_key,
      generation_mode: this.spec.generation_mode,
      total_trials: totalTrials,
      completed_steps: completedSteps,
      skipped_steps: skippedSteps,
      average_latency_ms: averageLatency,
      scaffolding_assistance_rate: scaffoldingAssistanceRate,
      highest_scaffolding_used: highestScaffolding,
      engagement_score: engagementScore,
      measurement_quality: avgQuality,
      celebration_message: celebrationMessage,
      experience_episode: experienceEpisode,
    };
  }

  private synthesizeExperienceEpisode(
    engagementScore: number,
    assistanceRate: number,
    measurementQuality: number
  ): ExperienceEpisode {
    const domain =
      this.spec.cognitive_family === "autobiographical_sequencing"
        ? "autobiographical_memory"
        : this.spec.cognitive_family === "prospective_orientation"
        ? "prospective_memory"
        : "executive_planning";

    return {
      id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: this.state.session_id,
      person_id: this.state.person_id,
      template_key: this.state.template_key,
      generation_mode: this.spec.generation_mode,
      objective: this.spec.objective,
      context: {
        time_of_day: "morning",
        modality: this.spec.modality,
        difficulty: this.spec.difficulty,
      },
      engagement_score: engagementScore,
      assistance_rate: assistanceRate,
      measurement_quality: measurementQuality,
      observed_response: `Completed ${this.state.trials.length} calm interactions with ${this.state.current_scaffolding_level} scaffolding.`,
      learned_implication:
        assistanceRate < 0.3
          ? `High independent affinity for ${this.spec.title} grounding.`
          : `Responded warmly to ${this.spec.scaffolding.family_voice_prompt ? "family voice notes" : "gentle contextual cues"}.`,
      pcm_update: {
        domain,
        delta: assistanceRate < 0.25 ? 0.02 : 0.01,
        new_estimate: Number((0.85 + (1 - assistanceRate) * 0.1).toFixed(2)),
      },
      created_at: new Date().toISOString(),
    };
  }

  private updateActivity(): void {
    const now = Date.now();
    if (this.state.status === "in_progress") {
      this.state.elapsed_active_ms += now - this.state.last_activity_at;
    }
    this.state.last_activity_at = now;
  }

  private calculateMeasurementQuality(latencyMs: number): number {
    // Quality model: fast steady responses have high confidence; excessive latency or erratic taps have slightly lower Q
    if (latencyMs < 2000) return 0.96;
    if (latencyMs <= 6000) return 0.92;
    if (latencyMs <= 12000) return 0.85;
    return 0.78;
  }

  private evaluateFatigue(): void {
    // If last 3 trials all had latency > 10000ms or 3 consecutive assistance requests
    const recent = this.state.trials.slice(-3);
    if (recent.length >= 3) {
      const allSlow = recent.every((t) => t.latency_ms > 10000);
      const allAssisted = recent.every((t) => t.scaffolding_level === "full_support");
      if (allSlow || allAssisted) {
        this.state.fatigue_detected = true;
      }
    }
  }
}
