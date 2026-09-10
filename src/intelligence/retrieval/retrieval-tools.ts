import {
  ConsentScope,
  FamiliarPlace,
  FamiliarRoute,
  FutureEvent,
  MediaAsset,
  MemoryExperienceHistory,
  MemoryItem,
  RouteSegment,
  TemporalFrame,
} from "../../domain/cognitive-experience";
import { cognitiveStore } from "../cognitive-engine";
import { MemoryFirewall } from "./memory-firewall";
import {
  cosineSimilarity,
  generateSemanticEmbedding,
  vectorSearch,
} from "./semantic-embeddings";
import {
  BoundedRetrievedObject,
  CurrentContext,
  FamiliarPlaceCandidate,
  FamiliarRouteCandidate,
  Game7RankingBreakdown,
  Game8RankingBreakdown,
  PersonalisationContext,
  ReminiscenceCandidate,
} from "./types";

export interface RetrievalOptions {
  temporalFrame?: TemporalFrame;
  includeHighSensitivity?: boolean;
  allowUnverifiedClaimsWithLabel?: boolean;
  targetConsentScopes?: ConsentScope[];
  limit?: number;
  minConfidence?: number;
  repetitionCooldownHours?: number;
}

// ── Synonyms mapping for bilingual lexical retrieval (Assamese / English) ───
const LEXICAL_SYNONYMS: Record<string, string[]> = {
  school: ["বিদ্যালয়", "class", "teaching", "teacher", "বালিকাবিদ্যালয়", "ছাত্ৰী"],
  wedding: ["বিয়া", "marriage", "matrimony", "দৰা", "কইনা", "biya", "mandap"],
  tea: ["চাহ", "chah", "assam ctc", "cardamom", "kettle", "ban-bhati"],
  river: ["ব্ৰহ্মপুত্ৰ", "নৈ", "ঘাট", "river", "brahmaputra", "ghat", "water"],
  courtyard: ["চোতাল", "veranda", "বাৰাণ্ডা", "courtyard", "home", "flower"],
  banyan: ["বটগছ", "tree", "shade", "banyan", "peepal", "বিৰিখ"],
  rina: ["নাতিনী", "granddaughter", "rina", "guwahati", "visitor"],
  anu: ["জীয়াৰী", "daughter", "caregiver", "anu"],
};

/**
 * Computes a lexical match score (0.0 - 1.0) with Assamese/English synonym expansion.
 */
export function computeLexicalScore(query: string, textToSearch: string): number {
  if (!query || !textToSearch) return 0;
  const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const targetLower = textToSearch.toLowerCase();

  let hits = 0;
  for (const token of qTokens) {
    if (targetLower.includes(token)) {
      hits += 1;
      continue;
    }
    // Check synonyms
    const syns = LEXICAL_SYNONYMS[token] || [];
    const hasSynMatch = syns.some((syn) => targetLower.includes(syn.toLowerCase()));
    if (hasSynMatch) {
      hits += 0.8;
    }
  }

  return Math.min(1.0, hits / Math.max(1, qTokens.length));
}

// ── 1. get_reminiscence_candidates() ────────────────────────────────────────

export function get_reminiscence_candidates(
  personId: string,
  query?: string,
  options?: RetrievalOptions
): ReminiscenceCandidate[] {
  // Enforce Memory Firewall on raw memories
  const rawMemories = cognitiveStore.memories;
  const rawHistory = cognitiveStore.experienceHistory;
  
  const { approved, audit } = MemoryFirewall.filterMemories(
    rawMemories,
    personId,
    rawHistory,
    {
      allowUnverifiedClaimsWithLabel: options?.allowUnverifiedClaimsWithLabel ?? false,
      includeHighSensitivity: options?.includeHighSensitivity ?? false,
      targetConsentScopes: options?.targetConsentScopes,
      repetitionCooldownHours: options?.repetitionCooldownHours ?? 24,
    }
  );

  const queryEmbedding = query ? generateSemanticEmbedding(query) : null;
  const candidates: ReminiscenceCandidate[] = [];

  for (const item of approved) {
    const mem = item.data;

    // Temporal filter if specified
    if (options?.temporalFrame && mem.temporal_frame !== options.temporalFrame) {
      continue;
    }

    // Dimension 1: Relational/Graph retrieval
    // Find associated media assets
    const associated_media = cognitiveStore.mediaAssets.filter(
      (m) => m.person_id === personId && (mem.media_refs || []).includes(m.id) && m.status === "active"
    );

    // Associated people from PWM
    const associated_people = (mem.people_refs || []).map((p) => ({
      id: p.person_entity_id,
      name: p.name,
      relationship: p.relationship,
      verified: p.verified,
    }));

    // Associated voice notes
    const associated_voice_notes = (mem.voice_notes || []).map((vn) => ({
      id: vn.id,
      speaker_name: vn.speaker_name,
      relationship: vn.relationship,
      audio_url: vn.audio_url,
      transcript: vn.transcript,
      language: vn.language,
      verified: vn.verified,
    }));

    // Dimension 3: Lexical retrieval
    const textCorpus = `${mem.title} ${mem.description} ${mem.assamese_title || ""} ${mem.cultural_context || ""}`;
    const lexicalScore = query ? computeLexicalScore(query, textCorpus) : 0.5;

    // Dimension 4: pgvector Semantic retrieval
    const memVector = generateSemanticEmbedding(textCorpus);
    const semanticSim = queryEmbedding ? cosineSimilarity(queryEmbedding, memVector) : 0.7;

    // Dimension 6: Experience Memory
    const pastPlays = rawHistory.filter(
      (h) => h.person_id === personId && h.target_entity_id === mem.id
    );
    const avgEngagement =
      pastPlays.length > 0
        ? pastPlays.reduce((acc, p) => acc + (p.engagement_score || 0.8), 0) / pastPlays.length
        : 0.85;

    // 10-Criterion Ranking for Game 7
    // 1. Familiarity
    const familiarity = mem.temporal_frame === "childhood" || mem.temporal_frame === "young_adulthood" ? 0.95 : 0.85;

    // 2. Verification
    const verificationScore =
      mem.verification_status === "caregiver_verified" || mem.verification_status === "clinician_verified"
        ? 1.0
        : mem.verification_status === "chw_verified"
        ? 0.85
        : 0.3;

    // 3. Personal Relevance
    const hasFamilyAnchor = associated_people.length > 0 ? 0.95 : 0.75;

    // 4. Modality Availability (photos + voice notes)
    const hasPhoto = associated_media.some((m) => m.media_type === "photo");
    const hasVoice = associated_voice_notes.length > 0;
    const modalityAvailability = hasPhoto && hasVoice ? 1.0 : hasPhoto ? 0.85 : 0.5;

    // 5. Prior Engagement
    const priorEngagement = avgEngagement;

    // 6. Repetition/Cooldown
    const repetitionCooldown = item.cooldown_score;

    // 7. Emotional Appropriateness
    const emotionalAppropriateness = mem.sensitivity === "low" ? 0.95 : 0.7;

    // 8. Current Context
    const currentContextScore = query ? (lexicalScore * 0.5 + semanticSim * 0.5) : 0.8;

    // 9. Caregiver Eligibility
    const caregiverEligibility = mem.consent_scope === "all" || mem.consent_scope === "reminiscence" ? 1.0 : 0.8;

    // 10. Language/Culture
    const languageCulture = mem.cultural_context?.includes("Tezpur") || mem.assamese_title ? 0.95 : 0.8;

    // Weighted composite rank
    const finalRankScore =
      familiarity * 0.15 +
      verificationScore * 0.20 +
      hasFamilyAnchor * 0.15 +
      modalityAvailability * 0.10 +
      priorEngagement * 0.10 +
      repetitionCooldown * 0.10 +
      emotionalAppropriateness * 0.05 +
      currentContextScore * 0.05 +
      caregiverEligibility * 0.05 +
      languageCulture * 0.05;

    const rankingBreakdown: Game7RankingBreakdown = {
      familiarity,
      verification: verificationScore,
      personal_relevance: hasFamilyAnchor,
      modality_availability: modalityAvailability,
      prior_engagement: priorEngagement,
      repetition_cooldown: repetitionCooldown,
      emotional_appropriateness: emotionalAppropriateness,
      current_context: currentContextScore,
      caregiver_eligibility: caregiverEligibility,
      language_culture: languageCulture,
      final_rank_score: Number(finalRankScore.toFixed(3)),
    };

    candidates.push({
      ...item,
      ranking: rankingBreakdown,
      associated_media,
      associated_people,
      associated_voice_notes,
      cultural_tags: [mem.cultural_context || "Assam"],
      cooldown_suppressed: item.cooldown_suppressed,
      search_metrics: {
        lexical_score: lexicalScore,
        semantic_similarity: semanticSim,
        composite_relevance: finalRankScore,
      },
    });
  }

  // Sort descending by final rank score
  candidates.sort((a, b) => b.ranking.final_rank_score - a.ranking.final_rank_score);
  return options?.limit ? candidates.slice(0, options.limit) : candidates;
}

// ── 2. get_familiar_place_candidates() ──────────────────────────────────────

export function get_familiar_place_candidates(
  personId: string,
  query?: string,
  options?: RetrievalOptions
): FamiliarPlaceCandidate[] {
  const rawPlaces = cognitiveStore.familiarPlaces;
  const { approved } = MemoryFirewall.filterPlaces(rawPlaces, personId, {
    allowUnverifiedClaimsWithLabel: options?.allowUnverifiedClaimsWithLabel ?? false,
    includeHighSensitivity: options?.includeHighSensitivity ?? false,
    targetConsentScopes: options?.targetConsentScopes,
  });

  const queryEmbedding = query ? generateSemanticEmbedding(query) : null;
  const candidates: FamiliarPlaceCandidate[] = [];

  for (const item of approved) {
    const place = item.data;
    const textCorpus = `${place.name} ${place.description} ${place.significance} ${place.assamese_name || ""}`;
    const lexicalScore = query ? computeLexicalScore(query, textCorpus) : 0.5;
    const placeVector = generateSemanticEmbedding(textCorpus);
    const semanticSim = queryEmbedding ? cosineSimilarity(queryEmbedding, placeVector) : 0.7;

    // Relational: connected routes
    const connectedRoutes = cognitiveStore.familiarRoutes.filter(
      (r) => r.person_id === personId && (r.start_place_id === place.id || r.destination_place_id === place.id)
    );

    const sensoryCount =
      (place.sensory_cues?.visual?.length || 0) +
      (place.sensory_cues?.auditory?.length || 0) +
      (place.sensory_cues?.olfactory?.length || 0);

    const isEligible = item.metadata.is_verified && item.metadata.confidence >= (options?.minConfidence ?? 0.75);

    candidates.push({
      ...item,
      associated_routes_count: connectedRoutes.length,
      sensory_cues_count: sensoryCount,
      is_eligible_for_game: isEligible,
      search_metrics: {
        lexical_score: lexicalScore,
        semantic_similarity: semanticSim,
        composite_relevance: lexicalScore * 0.4 + semanticSim * 0.6,
      },
    });
  }

  candidates.sort((a, b) => (b.search_metrics?.composite_relevance || 0) - (a.search_metrics?.composite_relevance || 0));
  return options?.limit ? candidates.slice(0, options.limit) : candidates;
}

// ── 3. get_familiar_route_candidates() ──────────────────────────────────────

export function get_familiar_route_candidates(
  personId: string,
  query?: string,
  options?: RetrievalOptions
): FamiliarRouteCandidate[] {
  const rawRoutes = cognitiveStore.familiarRoutes;
  const { verifiedRoutes, unverifiedRoutes } = MemoryFirewall.filterRoutes(
    rawRoutes,
    personId,
    {
      allowUnverifiedClaimsWithLabel: options?.allowUnverifiedClaimsWithLabel ?? false,
      includeHighSensitivity: options?.includeHighSensitivity ?? false,
      targetConsentScopes: options?.targetConsentScopes,
    }
  );

  const queryEmbedding = query ? generateSemanticEmbedding(query) : null;
  const candidates: FamiliarRouteCandidate[] = [];
  const pool = options?.allowUnverifiedClaimsWithLabel
    ? [...verifiedRoutes, ...unverifiedRoutes]
    : verifiedRoutes;

  for (const item of pool) {
    const route = item.data;
    const textCorpus = `${route.title} ${route.description} ${route.assamese_title || ""}`;
    const lexicalScore = query ? computeLexicalScore(query, textCorpus) : 0.5;
    const routeVector = generateSemanticEmbedding(textCorpus);
    const semanticSim = queryEmbedding ? cosineSimilarity(queryEmbedding, routeVector) : 0.7;

    // Relational: load ordered segments
    const segments = cognitiveStore.routeSegments
      .filter((s) => s.route_id === route.id)
      .sort((a, b) => a.segment_order - b.segment_order);

    const startPlace = cognitiveStore.familiarPlaces.find((p) => p.id === route.start_place_id);
    const destPlace = cognitiveStore.familiarPlaces.find((p) => p.id === route.destination_place_id);

    const keyDecisionPoints = segments.filter((s) => s.is_key_decision_point).length;
    const hasSensory = segments.some((s) => !!s.sensory_description);

    // 8-Criterion Ranking for Game 8
    // 1. Route verification
    const routeVerification = item.metadata.is_verified ? 1.0 : 0.2;
    // 2. Familiarity
    const familiarity = route.routine_frequency === "daily" ? 1.0 : route.routine_frequency === "past_routine" ? 0.85 : 0.7;
    // 3. Confidence
    const confidence = item.metadata.confidence;
    // 4. Recent relevance
    const recentRelevance = query ? lexicalScore * 0.5 + semanticSim * 0.5 : 0.8;
    // 5. Destination relevance
    const destinationRelevance = destPlace ? 0.95 : 0.5;
    // 6. Landmark availability
    const landmarkAvailability = segments.length >= 3 ? 1.0 : segments.length >= 2 ? 0.8 : 0.4;
    // 7. Route completeness
    const routeCompleteness = startPlace && destPlace && segments.length >= 2 ? 1.0 : 0.5;
    // 8. Safety eligibility (appropriate walk time e.g. <= 20 mins, verified landmarks)
    const walkTime = route.estimated_walk_time_mins || 15;
    const safetyEligibility = walkTime <= 20 ? 0.95 : 0.75;

    const finalRankScore =
      routeVerification * 0.20 +
      familiarity * 0.15 +
      confidence * 0.15 +
      recentRelevance * 0.10 +
      destinationRelevance * 0.10 +
      landmarkAvailability * 0.10 +
      routeCompleteness * 0.10 +
      safetyEligibility * 0.10;

    const rankingBreakdown: Game8RankingBreakdown = {
      route_verification: routeVerification,
      familiarity,
      confidence,
      recent_relevance: recentRelevance,
      destination_relevance: destinationRelevance,
      landmark_availability: landmarkAvailability,
      route_completeness: routeCompleteness,
      safety_eligibility: safetyEligibility,
      final_rank_score: Number(finalRankScore.toFixed(3)),
    };

    const isEligible =
      item.metadata.is_verified &&
      confidence >= (options?.minConfidence ?? 0.75) &&
      segments.length >= 2;

    candidates.push({
      ...item,
      ranking: rankingBreakdown,
      segments,
      start_place: startPlace,
      destination_place: destPlace,
      key_decision_points_count: keyDecisionPoints,
      sensory_cues_available: hasSensory,
      is_eligible_for_game: isEligible,
      search_metrics: {
        lexical_score: lexicalScore,
        semantic_similarity: semanticSim,
        composite_relevance: finalRankScore,
      },
    });
  }

  candidates.sort((a, b) => b.ranking.final_rank_score - a.ranking.final_rank_score);
  return options?.limit ? candidates.slice(0, options.limit) : candidates;
}

// ── 4. get_recent_game_experience() ─────────────────────────────────────────

export function get_recent_game_experience(
  personId: string,
  gameKey?: string,
  limit: number = 10
): {
  history: MemoryExperienceHistory[];
  average_latency_ms: number;
  recall_success_rate: number;
  average_engagement: number;
  recalled_entity_ids: string[];
} {
  // Cross-person isolation
  const records = cognitiveStore.experienceHistory
    .filter((h) => h.person_id === personId && (!gameKey || h.game_key === gameKey))
    .slice(0, limit);

  if (records.length === 0) {
    return {
      history: [],
      average_latency_ms: 2000,
      recall_success_rate: 1.0,
      average_engagement: 0.9,
      recalled_entity_ids: [],
    };
  }

  const totalLatency = records.reduce((sum, r) => sum + (r.latency_ms || 2000), 0);
  const successCount = records.filter((r) => r.recall_success).length;
  const totalEngagement = records.reduce((sum, r) => sum + (r.engagement_score || 0.8), 0);

  return {
    history: records,
    average_latency_ms: Math.round(totalLatency / records.length),
    recall_success_rate: Number((successCount / records.length).toFixed(2)),
    average_engagement: Number((totalEngagement / records.length).toFixed(2)),
    recalled_entity_ids: Array.from(new Set(records.map((r) => r.target_entity_id))),
  };
}

// ── 5. get_personalisation_context() ────────────────────────────────────────

export function get_personalisation_context(personId: string): PersonalisationContext {
  const isPurnima = personId === "person:purnima";
  const displayName = isPurnima ? "Purnima" : personId.replace("person:", "");

  // Personal Capability Model (PCM) & Continual Adaptation Engine (CAE)
  return {
    person: {
      id: personId,
      display_name: displayName,
      honorific: isPurnima ? "Aitâ" : "",
      preferred_language: isPurnima ? "as" : "en",
      culture: isPurnima ? "Assamese (Tezpur)" : "Standard",
      location: isPurnima ? "Tezpur, Sonitpur, Assam" : "Unknown",
    },
    capability: {
      recognition: 0.91,
      photo_recognition: 0.91,
      recall: 0.61,
      audio_recall: 0.72,
      sequencing: 0.78,
      attention_span_minutes: 12,
      guidance_tolerance: "high",
    },
    goals: [
      {
        id: "goal_autobio_preserve",
        title: "Preserve and celebrate teaching and wedding memories",
        cognitive_domain: "autobiographical_memory",
        status: "active",
      },
      {
        id: "goal_spatial_grounding",
        title: "Retain landmark orientation along riverbank and market",
        cognitive_domain: "spatial_orientation",
        status: "active",
      },
      {
        id: "goal_calm_connection",
        title: "Foster gentle intergenerational joy with granddaughter Rina",
        cognitive_domain: "social_emotional",
        status: "active",
      },
    ],
    adaptation_policy: {
      recommended_difficulty: 1,
      max_choice_count: 2,
      scaffolding_mode: "visual_cue",
      modality: "photo_plus_voice",
      renewal_rule: "Adapt when 3 consecutive trials exhibit latency > 3500ms or hint request",
    },
  };
}

// ── 6. get_current_context() ────────────────────────────────────────────────

export function get_current_context(personId: string): CurrentContext {
  const hour = new Date().getHours();
  let timeOfDay: CurrentContext["time_of_day"] = "morning";
  if (hour >= 5 && hour < 8) timeOfDay = "early_morning";
  else if (hour >= 8 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 20) timeOfDay = "evening";
  else timeOfDay = "night";

  // Filter future events through Memory Firewall (excluding cancelled or expired)
  const rawEvents = cognitiveStore.futureEvents;
  const { approved } = MemoryFirewall.filterFutureEvents(rawEvents, personId);

  // Active routine based on time
  const activeRoutine =
    timeOfDay === "morning"
      ? {
          id: "rt:morning_puja",
          name: "Morning Puja & Altar Garland",
          time: "07:30 AM",
          items: ["Marigolds", "Tulsi", "Bell metal plate"],
        }
      : timeOfDay === "afternoon"
      ? {
          id: "rt:afternoon_tea",
          name: "4:00 PM Veranda Cardamom Tea",
          time: "04:00 PM",
          items: ["Assam CTC leaves", "Ginger", "Cardamom", "Brass cups"],
        }
      : undefined;

  return {
    person_id: personId,
    timestamp: new Date().toISOString(),
    time_of_day: timeOfDay,
    active_routine: activeRoutine,
    upcoming_events: approved.map((a) => a.data),
    recent_fatigue_signals: [],
    ambient_environment: {
      noise_level: "quiet",
      lighting: timeOfDay === "morning" || timeOfDay === "afternoon" ? "daylight" : "indoor_warm",
    },
  };
}
