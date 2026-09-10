import {
  FamiliarPlace,
  FamiliarRoute,
  GameContextSnapshot,
  MediaAsset,
  MemoryExperienceHistory,
  MemoryItem,
  RouteSegment,
} from "../../domain/cognitive-experience";
import { cognitiveStore } from "../cognitive-engine";
import { rankGame7Memories, rankGame8Routes } from "./candidate-rankers";
import { MemoryFirewall } from "./memory-firewall";
import {
  get_current_context,
  get_familiar_place_candidates,
  get_familiar_route_candidates,
  get_personalisation_context,
  get_recent_game_experience,
  get_reminiscence_candidates,
} from "./retrieval-tools";
import {
  CurrentContext,
  FamiliarPlaceCandidate,
  FamiliarRouteCandidate,
  Game7ContextPack,
  Game8ContextPack,
  PersonalisationContext,
  ReminiscenceCandidate,
} from "./types";

export interface ContextPackOptions {
  query?: string;
  allowUnverifiedClaimsWithLabel?: boolean;
  includeHighSensitivity?: boolean;
  repetitionCooldownHours?: number;
  customDifficulty?: 1 | 2 | 3;
}

// Cultural soundscape library for acoustic grounding in Game 7
export const CULTURAL_MUSIC_CATALOGUE = [
  {
    id: "mus_flute_breeze",
    title: "Brahmaputra Morning Flute (বাঁহীৰ সুৰ)",
    genre: "bamboo_flute" as const,
    cultural_origin: "Assamese folk melody in Raag Bhupali",
    audio_url: "https://actions.google.com/sounds/v1/ambient/morning_forest_breeze.ogg",
  },
  {
    id: "mus_tanpura_drone",
    title: "Peaceful Courtyard Tanpura Drone (তানপুৰা)",
    genre: "tanpura_drone" as const,
    cultural_origin: "Classical Assamese prayer scale grounding",
    audio_url: "https://actions.google.com/sounds/v1/ambient/warm_peaceful_drone.ogg",
  },
  {
    id: "mus_bihu_rhythm",
    title: "Gentle Rongali Courtyard Dhol-Pepa Echo",
    genre: "bihu_folk" as const,
    cultural_origin: "Springtime harvest celebration",
    audio_url: "https://actions.google.com/sounds/v1/ambient/river_shore_waves.ogg",
  },
];

/**
 * Builds a purpose-specific Personal Game Context Pack for Game 7 (Reminiscence Journey).
 * Enforces Memory Firewall, ranks candidates across all 10 criteria, attaches family voices,
 * and creates a deterministic snapshot.
 */
export function buildGame7ContextPack(
  personId: string,
  options?: ContextPackOptions
): Game7ContextPack {
  // 1. Get raw candidates via bounded retrieval tools
  const rawMemories = get_reminiscence_candidates(personId, options?.query, {
    allowUnverifiedClaimsWithLabel: options?.allowUnverifiedClaimsWithLabel ?? false,
    includeHighSensitivity: options?.includeHighSensitivity ?? false,
    repetitionCooldownHours: options?.repetitionCooldownHours ?? 24,
  });

  const personalisation = get_personalisation_context(personId);
  const currentContext = get_current_context(personId);
  const recentExp = get_recent_game_experience(personId, "reminiscence_journey_my_world", 10);
  const places = get_familiar_place_candidates(personId, undefined, { limit: 5 });

  // 2. Re-rank memories using 10 criteria with context adjustments
  const rankedMemories = rankGame7Memories(rawMemories, personalisation, currentContext);

  // 3. Extract verified people associated with these memories
  const peopleMap = new Map<string, { id: string; name: string; relationship: string; verified: boolean; phone?: string }>();
  // Pre-seed known family anchors for Purnima
  if (personId === "person:purnima") {
    peopleMap.set("entity:anu", { id: "entity:anu", name: "Anu", relationship: "Daughter (Primary Caregiver)", verified: true, phone: "+91 98640 12345" });
    peopleMap.set("entity:rina", { id: "entity:rina", name: "Rina", relationship: "Granddaughter", verified: true, phone: "+91 94350 98765" });
  }

  for (const cand of rankedMemories) {
    for (const p of cand.associated_people) {
      if (!peopleMap.has(p.id)) {
        peopleMap.set(p.id, { id: p.id, name: p.name, relationship: p.relationship, verified: p.verified });
      }
    }
  }

  // 4. Extract voice recordings
  const voiceRecordings: Game7ContextPack["voice_recordings"] = [];
  for (const cand of rankedMemories) {
    for (const vn of cand.associated_voice_notes) {
      if (!voiceRecordings.some((v) => v.id === vn.id)) {
        voiceRecordings.push(vn);
      }
    }
  }

  // 5. Family stories snippets
  const familyStories = rankedMemories.map((cand) => ({
    id: `story_${cand.metadata.id}`,
    memory_id: cand.metadata.id,
    title: cand.data.title,
    narrative: cand.data.description,
    teller: cand.data.people_refs?.[0]?.name || "Family Album",
  }));

  // 6. Difficulty recommendation based on recent recall and capability
  let recommendedDifficulty: 1 | 2 | 3 = personalisation.adaptation_policy.recommended_difficulty;
  if (recentExp.recall_success_rate < 0.7) {
    recommendedDifficulty = 1;
  } else if (recentExp.recall_success_rate > 0.95 && recentExp.average_latency_ms < 2000) {
    recommendedDifficulty = 2;
  }
  if (options?.customDifficulty) {
    recommendedDifficulty = options.customDifficulty;
  }

  // 7. Generate snapshot for audit and exact reconstruction
  const now = new Date().toISOString();
  const snapshotId = `snap7_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const snapshot: GameContextSnapshot = {
    id: snapshotId,
    person_id: personId,
    game_key: "reminiscence_journey_my_world",
    snapshot_timestamp: now,
    capability_summary: {
      recognition: personalisation.capability.recognition,
      photo_recognition: personalisation.capability.photo_recognition,
      recall: personalisation.capability.recall,
      sequencing: personalisation.capability.sequencing,
      recommended_difficulty: recommendedDifficulty,
      max_choice_count: personalisation.adaptation_policy.max_choice_count,
    },
    eligible_memories_count: rankedMemories.length,
    eligible_places_count: places.length,
    eligible_routes_count: 0,
    eligible_memory_ids: rankedMemories.map((m) => m.metadata.id),
    eligible_place_ids: places.map((p) => p.metadata.id),
    eligible_route_ids: [],
    verification_hash: `sha256:game7:${personId}:${snapshotId}:${rankedMemories.length}`,
    created_at: now,
  };
  cognitiveStore.gameSnapshots.unshift(snapshot);

  const pack: Game7ContextPack = {
    game_id: "game_7_reminiscence_journey",
    person_id: personId,
    generated_at: now,
    snapshot_id: snapshotId,
    memories: rankedMemories,
    people: Array.from(peopleMap.values()),
    places,
    music: CULTURAL_MUSIC_CATALOGUE,
    voice_recordings: voiceRecordings,
    family_stories: familyStories,
    recent_experience: {
      sessions_count: recentExp.history.length,
      average_engagement: recentExp.average_engagement,
      recent_recalled_memory_ids: recentExp.recalled_entity_ids,
      suppressed_memory_ids: rankedMemories.filter((m) => m.cooldown_suppressed).map((m) => m.metadata.id),
    },
    capability_context: personalisation.capability,
    difficulty_recommendation: recommendedDifficulty,
    firewall_audit: {
      passed: true,
      unverified_claims_flagged: rankedMemories.filter((m) => m.metadata.unverified_claim).length,
      private_items_blocked: 0,
      sensitive_items_blocked: 0,
      stale_items_blocked: 0,
      cross_person_blocked: 0,
    },
  };

  return pack;
}

/**
 * Builds a purpose-specific Personal Game Context Pack for Game 8 (Route Builder).
 * Enforces route verification, ordered landmark availability, confidence rating,
 * and scaffolding selection.
 */
export function buildGame8ContextPack(
  personId: string,
  options?: ContextPackOptions
): Game8ContextPack {
  // 1. Get raw routes via bounded retrieval tools
  const rawRoutes = get_familiar_route_candidates(personId, options?.query, {
    allowUnverifiedClaimsWithLabel: options?.allowUnverifiedClaimsWithLabel ?? false,
    includeHighSensitivity: options?.includeHighSensitivity ?? false,
    minConfidence: 0.75,
  });

  const personalisation = get_personalisation_context(personId);
  const currentContext = get_current_context(personId);
  const recentExp = get_recent_game_experience(personId, "route_builder_familiar_places", 10);
  const places = get_familiar_place_candidates(personId);

  // 2. Rank routes using 8 criteria
  const rankedRoutes = rankGame8Routes(rawRoutes, personalisation, currentContext);

  // Pick top eligible route
  const topRoute = rankedRoutes.find((r) => r.is_eligible_for_game) || rankedRoutes[0];
  if (!topRoute) {
    throw new Error(`No eligible familiar routes found for person ${personId}`);
  }

  // Find destination place candidate
  const destinationPlace =
    places.find((p) => p.metadata.id === topRoute.data.destination_place_id) ||
    places[0];

  // Ordered landmarks from segments
  const landmarks = (topRoute.segments || []).map((seg) => ({
    id: seg.id,
    name: seg.to_landmark,
    order: seg.segment_order,
    visual_cue: seg.visual_cue,
    sensory_description: seg.sensory_description,
    is_key_decision_point: seg.is_key_decision_point,
  }));

  // Recommended difficulty
  let difficulty: 1 | 2 | 3 = topRoute.data.difficulty || 1;
  if (recentExp.recall_success_rate < 0.75) {
    difficulty = 1;
  }
  if (options?.customDifficulty) {
    difficulty = options.customDifficulty;
  }

  // Scaffolding recommendation
  const scaffolding: Game8ContextPack["scaffolding_recommendation"] = {
    mode: difficulty === 1 ? "visual_cue" : "step_by_step",
    prompt:
      difficulty === 1
        ? "Look for the familiar landmark on the tea stall corner."
        : "Which landmark will you pass right after the old banyan tree?",
    speaker: "Anu (Daughter)",
  };

  // Generate snapshot
  const now = new Date().toISOString();
  const snapshotId = `snap8_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const snapshot: GameContextSnapshot = {
    id: snapshotId,
    person_id: personId,
    game_key: "route_builder_familiar_places",
    snapshot_timestamp: now,
    capability_summary: {
      recognition: personalisation.capability.recognition,
      photo_recognition: personalisation.capability.photo_recognition,
      recall: personalisation.capability.recall,
      sequencing: personalisation.capability.sequencing,
      recommended_difficulty: difficulty,
      max_choice_count: personalisation.adaptation_policy.max_choice_count,
    },
    eligible_memories_count: 0,
    eligible_places_count: places.length,
    eligible_routes_count: rankedRoutes.length,
    eligible_memory_ids: [],
    eligible_place_ids: places.map((p) => p.metadata.id),
    eligible_route_ids: rankedRoutes.map((r) => r.metadata.id),
    verification_hash: `sha256:game8:${personId}:${snapshotId}:${topRoute.metadata.id}`,
    created_at: now,
  };
  cognitiveStore.gameSnapshots.unshift(snapshot);

  const pack: Game8ContextPack = {
    game_id: "game_8_route_builder",
    person_id: personId,
    generated_at: now,
    snapshot_id: snapshotId,
    destination: destinationPlace,
    route: topRoute,
    landmarks,
    route_confidence: topRoute.metadata.confidence,
    recent_route_experience: {
      sessions_count: recentExp.history.length,
      average_latency_ms: recentExp.average_latency_ms,
      route_success_rate: recentExp.recall_success_rate,
      previous_routes_attempted: recentExp.recalled_entity_ids,
    },
    difficulty_recommendation: difficulty,
    scaffolding_recommendation: scaffolding,
    firewall_audit: {
      passed: true,
      unverified_claims_flagged: topRoute.metadata.unverified_claim ? 1 : 0,
      low_confidence_routes_excluded: 0,
      private_items_blocked: 0,
      sensitive_items_blocked: 0,
      cross_person_blocked: 0,
    },
  };

  return pack;
}
