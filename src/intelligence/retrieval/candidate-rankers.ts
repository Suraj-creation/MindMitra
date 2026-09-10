import {
  CurrentContext,
  FamiliarRouteCandidate,
  Game7RankingBreakdown,
  Game8RankingBreakdown,
  PersonalisationContext,
  ReminiscenceCandidate,
} from "./types";

export interface Game7RankingWeights {
  familiarity: number;           // Default 0.15
  verification: number;          // Default 0.20
  personal_relevance: number;    // Default 0.15
  modality_availability: number; // Default 0.10
  prior_engagement: number;      // Default 0.10
  repetition_cooldown: number;   // Default 0.10
  emotional_appropriateness: number; // Default 0.05
  current_context: number;       // Default 0.05
  caregiver_eligibility: number; // Default 0.05
  language_culture: number;      // Default 0.05
}

export const DEFAULT_GAME_7_WEIGHTS: Game7RankingWeights = {
  familiarity: 0.15,
  verification: 0.20,
  personal_relevance: 0.15,
  modality_availability: 0.10,
  prior_engagement: 0.10,
  repetition_cooldown: 0.10,
  emotional_appropriateness: 0.05,
  current_context: 0.05,
  caregiver_eligibility: 0.05,
  language_culture: 0.05,
};

export interface Game8RankingWeights {
  route_verification: number;    // Default 0.20
  familiarity: number;           // Default 0.15
  confidence: number;            // Default 0.15
  recent_relevance: number;      // Default 0.10
  destination_relevance: number; // Default 0.10
  landmark_availability: number; // Default 0.10
  route_completeness: number;    // Default 0.10
  safety_eligibility: number;    // Default 0.10
}

export const DEFAULT_GAME_8_WEIGHTS: Game8RankingWeights = {
  route_verification: 0.20,
  familiarity: 0.15,
  confidence: 0.15,
  recent_relevance: 0.10,
  destination_relevance: 0.10,
  landmark_availability: 0.10,
  route_completeness: 0.10,
  safety_eligibility: 0.10,
};

/**
 * Re-ranks Game 7 memory candidates with specific contextual overrides (e.g. time of day, active routine, or custom weights).
 */
export function rankGame7Memories(
  candidates: ReminiscenceCandidate[],
  personalisation: PersonalisationContext,
  currentContext: CurrentContext,
  weights: Game7RankingWeights = DEFAULT_GAME_7_WEIGHTS
): ReminiscenceCandidate[] {
  const ranked = candidates.map((cand) => {
    const mem = cand.data;
    const b = cand.ranking;

    // Adjust current context match: does it match current active routine or upcoming visit?
    let contextBonus = b.current_context;
    if (currentContext.time_of_day === "afternoon" && mem.title.toLowerCase().includes("tea")) {
      contextBonus = Math.min(1.0, contextBonus + 0.2);
    }
    if (
      currentContext.upcoming_events.some((e) =>
        e.person_name && mem.people_refs?.some((p) => p.name.includes(e.person_name!))
      )
    ) {
      contextBonus = Math.min(1.0, contextBonus + 0.25);
    }

    // Adjust language/culture score based on elder's preferred language
    const langCultureScore =
      personalisation.person.preferred_language === "as" && mem.assamese_title
        ? 1.0
        : b.language_culture;

    const weightedScore =
      b.familiarity * weights.familiarity +
      b.verification * weights.verification +
      b.personal_relevance * weights.personal_relevance +
      b.modality_availability * weights.modality_availability +
      b.prior_engagement * weights.prior_engagement +
      b.repetition_cooldown * weights.repetition_cooldown +
      b.emotional_appropriateness * weights.emotional_appropriateness +
      contextBonus * weights.current_context +
      b.caregiver_eligibility * weights.caregiver_eligibility +
      langCultureScore * weights.language_culture;

    const updatedBreakdown: Game7RankingBreakdown = {
      ...b,
      current_context: Number(contextBonus.toFixed(2)),
      language_culture: Number(langCultureScore.toFixed(2)),
      final_rank_score: Number(weightedScore.toFixed(3)),
    };

    return {
      ...cand,
      ranking: updatedBreakdown,
    };
  });

  ranked.sort((a, b) => b.ranking.final_rank_score - a.ranking.final_rank_score);
  return ranked;
}

/**
 * Re-ranks Game 8 route candidates with specific contextual overrides (e.g. daytime vs evening, destination preferences).
 */
export function rankGame8Routes(
  candidates: FamiliarRouteCandidate[],
  personalisation: PersonalisationContext,
  currentContext: CurrentContext,
  weights: Game8RankingWeights = DEFAULT_GAME_8_WEIGHTS
): FamiliarRouteCandidate[] {
  const ranked = candidates.map((cand) => {
    const route = cand.data;
    const b = cand.ranking;

    // Time-of-day destination relevance
    let destRelevance = b.destination_relevance;
    if (currentContext.time_of_day === "evening" && route.destination_place_id === "pl:brahmaputra_ghat") {
      destRelevance = 1.0; // Evening promenade to the river ghat
    }
    if (currentContext.time_of_day === "morning" && route.destination_place_id === "pl:girls_school") {
      destRelevance = 0.95; // Morning school walk
    }

    // Route completeness check
    const completeness = cand.segments.length >= 3 && cand.start_place && cand.destination_place ? 1.0 : b.route_completeness;

    // Safety check against capability: if walk time > attention span, penalize safety
    const walkTime = route.estimated_walk_time_mins || 15;
    const safety = walkTime <= personalisation.capability.attention_span_minutes * 1.25 ? 1.0 : 0.6;

    const weightedScore =
      b.route_verification * weights.route_verification +
      b.familiarity * weights.familiarity +
      b.confidence * weights.confidence +
      b.recent_relevance * weights.recent_relevance +
      destRelevance * weights.destination_relevance +
      b.landmark_availability * weights.landmark_availability +
      completeness * weights.route_completeness +
      safety * weights.safety_eligibility;

    const updatedBreakdown: Game8RankingBreakdown = {
      ...b,
      destination_relevance: Number(destRelevance.toFixed(2)),
      route_completeness: Number(completeness.toFixed(2)),
      safety_eligibility: Number(safety.toFixed(2)),
      final_rank_score: Number(weightedScore.toFixed(3)),
    };

    return {
      ...cand,
      ranking: updatedBreakdown,
    };
  });

  ranked.sort((a, b) => b.ranking.final_rank_score - a.ranking.final_rank_score);
  return ranked;
}
