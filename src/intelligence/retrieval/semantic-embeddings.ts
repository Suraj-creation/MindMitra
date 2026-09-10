/**
 * pgvector-compatible Semantic Vector Retrieval Engine
 * 
 * Provides deterministic 32-dimensional semantic embeddings for multimodal memory,
 * place, and route entities with cosine similarity calculations matching PostgreSQL pgvector.
 */

export const EMBEDDING_DIMENSIONS = 32;

// Key semantic semantic concepts mapped to dimensional axes
export const SEMANTIC_AXES: Record<string, number> = {
  // Cultural / Regional (Axes 0 - 5)
  assamese_culture: 0,
  tezpur_geography: 1,
  brahmaputra_river: 2,
  tea_garden: 3,
  traditional_craft_silk: 4,
  spiritual_namghar_puja: 5,

  // Life Milestones & Social (Axes 6 - 11)
  childhood_education: 6,
  teaching_profession: 7,
  wedding_matrimony: 8,
  parenting_children: 9,
  grandchildren_youth: 10,
  community_friendship: 11,

  // Spatial & Navigation (Axes 12 - 17)
  home_courtyard: 12,
  river_ghat_promenade: 13,
  school_campus: 14,
  market_bazaar: 15,
  landmark_banyan_tree: 16,
  walking_routine: 17,

  // Sensory Modalities (Axes 18 - 23)
  visual_photographic: 18,
  auditory_family_voice: 19,
  olfactory_cardamom_tea: 20,
  tactile_brass_cloth: 21,
  acoustic_music_drone: 22,
  calm_peaceful_affect: 23,

  // Temporal Anchors (Axes 24 - 27)
  past_early_life: 24,
  mid_life_career: 25,
  present_daily_routine: 26,
  future_anticipated_visit: 27,

  // Cognitive Domain (Axes 28 - 31)
  autobiographical_reminiscence: 28,
  spatial_wayfinding: 29,
  prospective_preparation: 30,
  emotional_grounding: 31,
};

/**
 * Computes Cosine Similarity between two vectors.
 * Returns a value between -1.0 and 1.0 (clamped to 0.0 - 1.0 for normalized semantic vectors).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, sim));
}

/**
 * Computes Cosine Distance (matching PostgreSQL pgvector's `<=>` operator).
 * Distance = 1 - CosineSimilarity. (0.0 = identical, 1.0 = orthogonal)
 */
export function cosineDistance(vecA: number[], vecB: number[]): number {
  return 1 - cosineSimilarity(vecA, vecB);
}

/**
 * Normalizes a vector to unit length (L2 norm).
 */
export function normalizeVector(vec: number[]): number[] {
  let sumSq = 0;
  for (const val of vec) {
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return new Array(vec.length).fill(0);
  return vec.map((v) => v / norm);
}

/**
 * Deterministically generates a 32-dimensional semantic embedding vector for a given text.
 * Combines dictionary semantic anchors with character n-gram hashing for vocabulary out-of-bounds.
 */
export function generateSemanticEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0.05); // Base background activation
  if (!text) return normalizeVector(vector);

  const lower = text.toLowerCase();

  // Pattern-to-Axis mapping
  const conceptRules: Array<{ regex: RegExp; axis: number; weight: number }> = [
    // Cultural
    { regex: /assamese|bihu|rongali|ati|namghar|muga|mekhela|gamosa|tamul/i, axis: SEMANTIC_AXES.assamese_culture, weight: 0.85 },
    { regex: /tezpur|sonitpur|agnigarh|chitralekha|mahaneer/i, axis: SEMANTIC_AXES.tezpur_geography, weight: 0.85 },
    { regex: /brahmaputra|river|water|lakhimpur|ghat|ferry/i, axis: SEMANTIC_AXES.brahmaputra_river, weight: 0.85 },
    { regex: /tea|ctc|camellia|bagan|garden|leaves/i, axis: SEMANTIC_AXES.tea_garden, weight: 0.75 },
    { regex: /muga|silk|weaving|loom|chador|kurta|brass/i, axis: SEMANTIC_AXES.traditional_craft_silk, weight: 0.75 },
    { regex: /puja|altar|prayer|namghar|marigold|tulsi|diya|bell/i, axis: SEMANTIC_AXES.spiritual_namghar_puja, weight: 0.80 },

    // Life & Social
    { regex: /childhood|girl|classroom|school days|friend|play|1956|1950/i, axis: SEMANTIC_AXES.childhood_education, weight: 0.85 },
    { regex: /teaching|teacher|girls school|literature|poem|recitation|class|1974|1966/i, axis: SEMANTIC_AXES.teaching_profession, weight: 0.90 },
    { regex: /wedding|marriage|ceremony|bride|groom|husband|1968|biya/i, axis: SEMANTIC_AXES.wedding_matrimony, weight: 0.90 },
    { regex: /daughter|anu|son|bikash|child|family/i, axis: SEMANTIC_AXES.parenting_children, weight: 0.80 },
    { regex: /granddaughter|rina|guwahati|visitor|youth/i, axis: SEMANTIC_AXES.grandchildren_youth, weight: 0.85 },
    { regex: /friend|colleague|neighbour|asha|meena|companion/i, axis: SEMANTIC_AXES.community_friendship, weight: 0.70 },

    // Spatial & Navigation
    { regex: /home|courtyard|veranda|residence|house/i, axis: SEMANTIC_AXES.home_courtyard, weight: 0.85 },
    { regex: /river ghat|stone steps|bank|ferry ghat/i, axis: SEMANTIC_AXES.river_ghat_promenade, weight: 0.85 },
    { regex: /school campus|girls high school|classroom/i, axis: SEMANTIC_AXES.school_campus, weight: 0.80 },
    { regex: /bazaar|market|shop|stall|fruit|vendor/i, axis: SEMANTIC_AXES.market_bazaar, weight: 0.75 },
    { regex: /banyan|tree|shade|peepal|grand banyan/i, axis: SEMANTIC_AXES.landmark_banyan_tree, weight: 0.85 },
    { regex: /walk|route|path|lane|turn|straight|stroll|promenade/i, axis: SEMANTIC_AXES.walking_routine, weight: 0.85 },

    // Sensory
    { regex: /photo|portrait|picture|image|album|look|see/i, axis: SEMANTIC_AXES.visual_photographic, weight: 0.75 },
    { regex: /voice|recording|audio|say|said|tell|speak|spoken|whisper/i, axis: SEMANTIC_AXES.auditory_family_voice, weight: 0.80 },
    { regex: /cardamom|ginger|tea aroma|scent|fragrant|nahor/i, axis: SEMANTIC_AXES.olfactory_cardamom_tea, weight: 0.85 },
    { regex: /brass|ban-bhati|touch|silk|smooth|fabric/i, axis: SEMANTIC_AXES.tactile_brass_cloth, weight: 0.75 },
    { regex: /flute|tanpura|drone|music|melody|song/i, axis: SEMANTIC_AXES.acoustic_music_drone, weight: 0.80 },
    { regex: /calm|peaceful|gentle|serene|breeze|quiet/i, axis: SEMANTIC_AXES.calm_peaceful_affect, weight: 0.80 },

    // Temporal
    { regex: /past|earlier|ago|young|former|old|history|195|196|197/i, axis: SEMANTIC_AXES.past_early_life, weight: 0.80 },
    { regex: /career|teaching years|30 years|working/i, axis: SEMANTIC_AXES.mid_life_career, weight: 0.75 },
    { regex: /today|morning|afternoon|now|routine|courtyard/i, axis: SEMANTIC_AXES.present_daily_routine, weight: 0.80 },
    { regex: /future|arriving|coming|visit|prepare|upcoming|4:00 pm|later/i, axis: SEMANTIC_AXES.future_anticipated_visit, weight: 0.85 },

    // Cognitive Domain
    { regex: /reminiscence|memory|remember|treasured|story|life/i, axis: SEMANTIC_AXES.autobiographical_reminiscence, weight: 0.85 },
    { regex: /route|way|direction|landmark|navigate|destination/i, axis: SEMANTIC_AXES.spatial_wayfinding, weight: 0.85 },
    { regex: /prepare|ready|tray|tea bowl|sequence|steps/i, axis: SEMANTIC_AXES.prospective_preparation, weight: 0.85 },
    { regex: /grounding|calm|belonging|reassurance|safe/i, axis: SEMANTIC_AXES.emotional_grounding, weight: 0.80 },
  ];

  for (const rule of conceptRules) {
    if (rule.regex.test(lower)) {
      vector[rule.axis] += rule.weight;
    }
  }

  // Hash character bi-grams into remaining subtle dimensional variations
  for (let i = 0; i < lower.length - 1; i++) {
    const code = (lower.charCodeAt(i) * 31 + lower.charCodeAt(i + 1)) % EMBEDDING_DIMENSIONS;
    vector[code] += 0.02;
  }

  return normalizeVector(vector);
}

/**
 * Searches a list of candidates by cosine similarity against a query vector or query text.
 */
export function vectorSearch<T>(
  query: string | number[],
  candidates: Array<{ vector?: number[]; textForEmbedding?: string; item: T }>,
  topK: number = 5
): Array<{ item: T; similarity: number; distance: number }> {
  const queryVector = typeof query === "string" ? generateSemanticEmbedding(query) : query;

  const scored = candidates.map((cand) => {
    const candVector = cand.vector || generateSemanticEmbedding(cand.textForEmbedding || "");
    const sim = cosineSimilarity(queryVector, candVector);
    const dist = cosineDistance(queryVector, candVector);
    return { item: cand.item, similarity: sim, distance: dist };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}
