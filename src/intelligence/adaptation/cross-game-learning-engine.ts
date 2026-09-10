import { ExperienceEpisode, FamiliarPlace, FamiliarRoute, MemoryItem } from "../../domain/cognitive-experience";

export interface SemanticCrossLink {
  id: string;
  memory_id: string;
  place_id: string;
  route_id?: string;
  routine_name: string;
  theme: string;
}

export interface Game8CandidateRecommendation {
  place: FamiliarPlace;
  route?: FamiliarRoute;
  originating_memory_id: string;
  recommendation_reason: string;
  confidence_score: number;
}

export interface Game7CandidateRecommendation {
  memory: MemoryItem;
  originating_landmark_name: string;
  recommendation_reason: string;
  suggested_scaffolding: "recognition" | "cued_recognition";
}

export class CrossGameLearningEngine {
  private static readonly CANONICAL_LINKS: SemanticCrossLink[] = [
    {
      id: "link_school",
      memory_id: "mem:first_teaching_job",
      place_id: "pl:tezpur_girls_school",
      route_id: "rt:home_to_school",
      routine_name: "Morning School Walk",
      theme: "dedication_and_service",
    },
    {
      id: "link_cole_park",
      memory_id: "mem:cole_park_evening",
      place_id: "pl:chitralekha_udyan",
      route_id: "rt:home_to_cole_park",
      routine_name: "Evening Stroll with Bikash",
      theme: "family_peace",
    },
    {
      id: "link_temple",
      memory_id: "mem:mahabhairab_puja",
      place_id: "pl:mahabhairab_temple",
      route_id: "rt:home_to_temple",
      routine_name: "Monday Morning Puja",
      theme: "spiritual_grounding",
    },
    {
      id: "link_wedding_courtyard",
      memory_id: "mem:wedding_ceremony",
      place_id: "pl:ancestral_home",
      route_id: "rt:courtyard_garden",
      routine_name: "Courtyard Cardamom Tea",
      theme: "cherished_family_roots",
    },
    {
      id: "link_market",
      memory_id: "mem:market_til_pitha",
      place_id: "pl:chowk_bazaar",
      route_id: "rt:home_to_market",
      routine_name: "Afternoon Sweet Shop Errand",
      theme: "festive_food_traditions",
    },
  ];

  /**
   * Bi-directional Cross-Game Learning (Game 7 → Game 8):
   * If the person strongly recognises a place/memory in Game 7, that place becomes
   * a priority candidate for Game 8 Route Builder if a verified route exists.
   */
  public static deriveGame8CandidatesFromGame7(
    game7Episodes: ExperienceEpisode[],
    allPlaces: FamiliarPlace[],
    allRoutes: FamiliarRoute[]
  ): Game8CandidateRecommendation[] {
    const recommendations: Game8CandidateRecommendation[] = [];

    // Filter successful, unassisted Game 7 episodes with high measurement quality
    const strongSessions = game7Episodes.filter(
      (ep) => (ep.assistance_rate || 0) < 0.15 && (ep.measurement_quality || 1) >= 0.70
    );

    const strongMemoryIds = new Set<string>();
    const strongPlaceIds = new Set<string>();

    strongSessions.forEach((ep) => {
      ep.target_content?.memory_ids?.forEach((mId) => strongMemoryIds.add(mId));
      ep.target_content?.place_ids?.forEach((pId) => strongPlaceIds.add(pId));
      ep.cross_game_implications?.recognized_place_ids?.forEach((pId) => strongPlaceIds.add(pId));
    });

    // Check canonical links
    for (const link of this.CANONICAL_LINKS) {
      if (strongMemoryIds.has(link.memory_id) || strongPlaceIds.has(link.place_id)) {
        const place = allPlaces.find((p) => p.id === link.place_id && p.verification_status === "caregiver_verified");
        if (place && !recommendations.some((r) => r.place.id === place.id)) {
          const route = link.route_id
            ? allRoutes.find((r) => r.id === link.route_id && r.verification_status === "caregiver_verified")
            : undefined;

          recommendations.push({
            place,
            route,
            originating_memory_id: link.memory_id,
            recommendation_reason: `Strong recognition of related memory (${link.theme}) in Game 7 validates this place as an emotionally safe, familiar target for Route Builder.`,
            confidence_score: 0.92,
          });
        }
      }
    }

    // Also check direct place matches
    for (const pId of strongPlaceIds) {
      const place = allPlaces.find((p) => p.id === pId && p.verification_status === "caregiver_verified");
      if (place && !recommendations.some((r) => r.place.id === place.id)) {
        const route = allRoutes.find(
          (r) => (r.destination_place_id === pId || r.start_place_id === pId) && r.verification_status === "caregiver_verified"
        );
        recommendations.push({
          place,
          route,
          originating_memory_id: `place_ref:${pId}`,
          recommendation_reason: `Strong recognition of ${place.name} in Game 7 confirms landmark familiarity.`,
          confidence_score: 0.95,
        });
      }
    }

    return recommendations;
  }

  /**
   * Bi-directional Cross-Game Learning (Game 8 → Game 7):
   * If the person struggles with a landmark in Game 8, Game 7 is prompted to use
   * that landmark in a gentle, highly cued recognition-oriented reminiscence experience.
   */
  public static deriveGame7CandidatesFromGame8(
    game8Episodes: ExperienceEpisode[],
    allMemories: MemoryItem[]
  ): Game7CandidateRecommendation[] {
    const recommendations: Game7CandidateRecommendation[] = [];

    // Identify Game 8 sessions with struggle, hints, or high latency
    const struggledSessions = game8Episodes.filter(
      (ep) => (ep.assistance_rate || 0) > 0.20 || (ep.hints?.requested_count || 0) > 0 || (ep.interaction_quality?.mean_latency_ms || 0) > 5000
    );

    for (const ep of struggledSessions) {
      const struggledWaypoints = ep.cross_game_implications?.struggled_landmark_ids || ep.target_content?.waypoints || [];

      for (const wp of struggledWaypoints) {
        const lowerWp = wp.toLowerCase();
        const matchedLink = this.CANONICAL_LINKS.find((link) => {
          return lowerWp.includes(link.place_id.replace("pl:", "").replace("_", " ")) ||
                 link.routine_name.toLowerCase().includes(lowerWp) ||
                 (link.route_id && lowerWp.includes(link.route_id.replace("rt:", "").replace("_", " ")));
        });

        if (matchedLink) {
          const memory = allMemories.find((m) => m.id === matchedLink.memory_id && m.verification_status.includes("verified"));
          if (memory && !recommendations.some((r) => r.memory.id === memory.id)) {
            recommendations.push({
              memory,
              originating_landmark_name: wp,
              recommendation_reason: `Hesitation noted while navigating near landmark '${wp}'. Grounding via gentle photo reminiscence will re-anchor familiarity and emotional ease.`,
              suggested_scaffolding: "recognition",
            });
          }
        }
      }
    }

    return recommendations;
  }

  public static getLinks(): SemanticCrossLink[] {
    return [...this.CANONICAL_LINKS];
  }
}
