import {
  ReminiscenceScaffoldingLevel,
  RouteScaffoldingLevel,
} from "../specifications/types";
import { ExperienceEpisode } from "../../domain/cognitive-experience";

export interface ScaffoldingRecommendation<T> {
  current_level: T;
  recommended_level: T;
  current_difficulty: number;
  recommended_difficulty: number;
  direction: "escalate" | "maintain" | "scaffold_down";
  rationale: string;
  comfortable_success_band_met: boolean;
}

export class ProgressivePersonalisationLadder {
  public static readonly GAME_7_LADDER: ReminiscenceScaffoldingLevel[] = [
    "recognition",
    "cued_recognition",
    "reduced_cue",
    "multimodal_cue",
    "recall_reminiscence",
  ];

  public static readonly GAME_8_LADDER: RouteScaffoldingLevel[] = [
    "destination_recognition",
    "obvious_route",
    "landmark_sequencing",
    "reduced_visual_cues",
    "independent_route_recall",
  ];

  /**
   * Determine next scaffolding level for Game 7 based on recent experience history.
   * STRICT DIRECTIVE: Do not automatically escalate if the person struggles.
   * Target a comfortable success band (75% - 90%).
   */
  public static adaptGame7(
    recentEpisodes: ExperienceEpisode[],
    currentLevel: ReminiscenceScaffoldingLevel = "recognition",
    currentDifficulty: number = 1
  ): ScaffoldingRecommendation<ReminiscenceScaffoldingLevel> {
    const currentIndex = this.GAME_7_LADDER.indexOf(currentLevel);
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

    if (recentEpisodes.length === 0) {
      return {
        current_level: currentLevel,
        recommended_level: currentLevel,
        current_difficulty: currentDifficulty,
        recommended_difficulty: currentDifficulty,
        direction: "maintain",
        rationale: "Initial session: starting at foundational photo recognition for gentle familiarity.",
        comfortable_success_band_met: true,
      };
    }

    const latest = recentEpisodes[0];
    const assistanceRate = latest.assistance_rate || 0;
    const hintsCount = latest.hints?.requested_count || 0;
    const skipsCount = latest.skip?.skipped_count || 0;
    const latency = latest.interaction_quality?.mean_latency_ms || 2500;
    const q = latest.measurement_quality || 1.0;

    const hasStruggled = assistanceRate > 0.25 || hintsCount > 1 || skipsCount > 0 || latency > 7000 || q < 0.65;
    const isEffortless = assistanceRate === 0 && hintsCount === 0 && skipsCount === 0 && latency < 4500 && q >= 0.75;

    if (hasStruggled) {
      // Step down or maintain — NEVER escalate if the person struggled
      if (assistanceRate > 0.50 || skipsCount > 1) {
        const nextIndex = Math.max(0, safeCurrentIndex - 1);
        const nextDiff = Math.max(1, currentDifficulty - 1);
        return {
          current_level: currentLevel,
          recommended_level: this.GAME_7_LADDER[nextIndex],
          current_difficulty: currentDifficulty,
          recommended_difficulty: nextDiff,
          direction: "scaffold_down",
          rationale: "Assistance or hesitation detected. Stepping down one scaffolding tier to ensure warmth and emotional comfort.",
          comfortable_success_band_met: false,
        };
      } else {
        return {
          current_level: currentLevel,
          recommended_level: this.GAME_7_LADDER[safeCurrentIndex],
          current_difficulty: currentDifficulty,
          recommended_difficulty: currentDifficulty,
          direction: "maintain",
          rationale: "Mild support needed. Maintaining current level within comfortable learning zone.",
          comfortable_success_band_met: true,
        };
      }
    }

    if (isEffortless && safeCurrentIndex < this.GAME_7_LADDER.length - 1) {
      // Gentle progression: advance exactly 1 tier (never leap multiple tiers)
      const nextIndex = safeCurrentIndex + 1;
      const nextDiff = Math.min(3, currentDifficulty + (nextIndex > 2 ? 1 : 0));
      return {
        current_level: currentLevel,
        recommended_level: this.GAME_7_LADDER[nextIndex],
        current_difficulty: currentDifficulty,
        recommended_difficulty: nextDiff,
        direction: "escalate",
        rationale: `Confident and unassisted recognition (Q=${q.toFixed(2)}). Gently advancing to ${this.GAME_7_LADDER[nextIndex]} tier.`,
        comfortable_success_band_met: true,
      };
    }

    return {
      current_level: currentLevel,
      recommended_level: this.GAME_7_LADDER[safeCurrentIndex],
      current_difficulty: currentDifficulty,
      recommended_difficulty: currentDifficulty,
      direction: "maintain",
      rationale: "Performance is stable within the optimal 75-90% comfort zone. Reinforcing current tier.",
      comfortable_success_band_met: true,
    };
  }

  /**
   * Determine next scaffolding level for Game 8 based on recent experience history.
   */
  public static adaptGame8(
    recentEpisodes: ExperienceEpisode[],
    currentLevel: RouteScaffoldingLevel = "destination_recognition",
    currentDifficulty: number = 1
  ): ScaffoldingRecommendation<RouteScaffoldingLevel> {
    const currentIndex = this.GAME_8_LADDER.indexOf(currentLevel);
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

    if (recentEpisodes.length === 0) {
      return {
        current_level: currentLevel,
        recommended_level: currentLevel,
        current_difficulty: currentDifficulty,
        recommended_difficulty: currentDifficulty,
        direction: "maintain",
        rationale: "Initial route session: starting at direct destination recognition.",
        comfortable_success_band_met: true,
      };
    }

    const latest = recentEpisodes[0];
    const assistanceRate = latest.assistance_rate || 0;
    const hintsCount = latest.hints?.requested_count || 0;
    const skipsCount = latest.skip?.skipped_count || 0;
    const latency = latest.interaction_quality?.mean_latency_ms || 2500;
    const q = latest.measurement_quality || 1.0;

    const hasStruggled = assistanceRate > 0.25 || hintsCount > 1 || skipsCount > 0 || latency > 7500 || q < 0.65;
    const isEffortless = assistanceRate === 0 && hintsCount === 0 && skipsCount === 0 && latency < 4500 && q >= 0.75;

    if (hasStruggled) {
      if (assistanceRate > 0.50 || skipsCount > 1) {
        const nextIndex = Math.max(0, safeCurrentIndex - 1);
        const nextDiff = Math.max(1, currentDifficulty - 1);
        return {
          current_level: currentLevel,
          recommended_level: this.GAME_8_LADDER[nextIndex],
          current_difficulty: currentDifficulty,
          recommended_difficulty: nextDiff,
          direction: "scaffold_down",
          rationale: "Wayfinding hesitation noticed. Providing stronger landmark guidance to maintain dignity and spatial confidence.",
          comfortable_success_band_met: false,
        };
      } else {
        return {
          current_level: currentLevel,
          recommended_level: this.GAME_8_LADDER[safeCurrentIndex],
          current_difficulty: currentDifficulty,
          recommended_difficulty: currentDifficulty,
          direction: "maintain",
          rationale: "Maintaining current route structure to solidify familiar landmark associations.",
          comfortable_success_band_met: true,
        };
      }
    }

    if (isEffortless && safeCurrentIndex < this.GAME_8_LADDER.length - 1) {
      const nextIndex = safeCurrentIndex + 1;
      const nextDiff = Math.min(3, currentDifficulty + (nextIndex > 2 ? 1 : 0));
      return {
        current_level: currentLevel,
        recommended_level: this.GAME_8_LADDER[nextIndex],
        current_difficulty: currentDifficulty,
        recommended_difficulty: nextDiff,
        direction: "escalate",
        rationale: `Effortless landmark wayfinding. Progressing smoothly to ${this.GAME_8_LADDER[nextIndex]} tier.`,
        comfortable_success_band_met: true,
      };
    }

    return {
      current_level: currentLevel,
      recommended_level: this.GAME_8_LADDER[safeCurrentIndex],
      current_difficulty: currentDifficulty,
      recommended_difficulty: currentDifficulty,
      direction: "maintain",
      rationale: "Wayfinding accuracy is in the sweet spot. Reinforcing existing mental map.",
      comfortable_success_band_met: true,
    };
  }

  public static getNextGame7SessionRecommendation(recentEpisodes: ExperienceEpisode[]) {
    const latest = recentEpisodes[0];
    const currDiff = latest?.context?.difficulty || 1;
    const currLevel = (latest?.scaffolding_level as ReminiscenceScaffoldingLevel) || (currDiff === 1 ? "recognition" : "cued_recognition");
    const rec = this.adaptGame7(recentEpisodes, currLevel, currDiff);
    const targetLevelNumber = this.GAME_7_LADDER.indexOf(rec.recommended_level) + 1;
    return {
      target_level: targetLevelNumber,
      target_scaffolding: rec.recommended_level,
      target_difficulty: rec.recommended_difficulty,
      rationale: rec.direction === "scaffold_down"
        ? `Gently reinforcing with ${rec.recommended_level} for emotional comfort and dignity.`
        : rec.direction === "escalate"
        ? `Advancing to Level ${targetLevelNumber} (${rec.recommended_level}) after steady confidence.`
        : `Maintaining comfortable rhythm at Level ${targetLevelNumber}.`,
    };
  }

  public static getNextGame8SessionRecommendation(recentEpisodes: ExperienceEpisode[]) {
    const latest = recentEpisodes[0];
    const currDiff = latest?.context?.difficulty || 1;
    const currLevel = (latest?.scaffolding_level as RouteScaffoldingLevel) || "destination_recognition";
    const rec = this.adaptGame8(recentEpisodes, currLevel, currDiff);
    const targetLevelNumber = this.GAME_8_LADDER.indexOf(rec.recommended_level) + 1;
    return {
      target_level: targetLevelNumber,
      target_scaffolding: rec.recommended_level,
      target_difficulty: rec.recommended_difficulty,
      rationale: rec.direction === "scaffold_down"
        ? `Gently providing landmark guidance for safety and ease.`
        : rec.direction === "escalate"
        ? `Advancing wayfinding to Level ${targetLevelNumber} (${rec.recommended_level}).`
        : `Preserving familiar path confidence at Level ${targetLevelNumber}.`,
    };
  }
}
