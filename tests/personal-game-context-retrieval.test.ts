import { test } from "node:test";
import assert from "node:assert";
import { cognitiveStore } from "../src/intelligence/cognitive-engine.js";
import { MemoryFirewall } from "../src/intelligence/retrieval/memory-firewall.js";
import {
  cosineSimilarity,
  cosineDistance,
  generateSemanticEmbedding,
  vectorSearch,
} from "../src/intelligence/retrieval/semantic-embeddings.js";
import {
  get_reminiscence_candidates,
  get_familiar_place_candidates,
  get_familiar_route_candidates,
  get_recent_game_experience,
  get_personalisation_context,
  get_current_context,
} from "../src/intelligence/retrieval/retrieval-tools.js";
import {
  rankGame7Memories,
  rankGame8Routes,
} from "../src/intelligence/retrieval/candidate-rankers.js";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "../src/intelligence/retrieval/context-pack-builder.js";
import { BoundedGameOrchestrator } from "../src/intelligence/orchestration/bounded-langgraph.js";

// ── 1. Cross-Person Isolation Tests ─────────────────────────────────────────

test("Security & Firewall: Cross-person retrieval is strictly impossible", () => {
  // Pre-condition: Add an entity belonging to another person
  cognitiveStore.memories.push({
    id: "mem:other_person_secret",
    person_id: "person:other_elder_99",
    memory_type: "autobiographical",
    title: "Secret Family Story of Another Elder",
    description: "Private memory that belongs only to person:other_elder_99",
    temporal_frame: "past",
    approximate_period: "1970",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    cultural_context: "Assam",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
    created_by: "actor:other_caregiver",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Querying for Purnima MUST NEVER return other person's memory
  const purnimaMemories = get_reminiscence_candidates("person:purnima");
  const leaked = purnimaMemories.find((m) => m.metadata.id === "mem:other_person_secret");
  assert.strictEqual(leaked, undefined, "Other person's memory MUST NOT leak into Purnima's context");

  // Every single memory in Purnima's candidate list must have person_id === 'person:purnima'
  for (const cand of purnimaMemories) {
    assert.strictEqual(cand.data.person_id, "person:purnima", "Strict person_id isolation must hold for all memories");
  }

  // Direct firewall test
  const { approved, audit } = MemoryFirewall.filterMemories(
    cognitiveStore.memories,
    "person:purnima"
  );
  assert.ok(audit.cross_person_blocked > 0, "Audit must record blocked cross-person attempt");
  assert.ok(audit.violations.length > 0, "Firewall must report violation for cross-person item");
  assert.ok(!approved.some((m) => m.data.person_id !== "person:purnima"));
});

// ── 2. Private Data Leakage Prevention Tests ────────────────────────────────

test("Security & Firewall: Private data cannot leak into game context", () => {
  // Insert private-only memory with restrictive consent
  cognitiveStore.memories.push({
    id: "mem:strictly_private_diary",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Private Personal Diary Notes",
    description: "Confidential thoughts not consented for games",
    temporal_frame: "later_life",
    approximate_period: "2015",
    source: "person",
    verification_status: "caregiver_verified",
    confidence: 0.95,
    consent_scope: "person_only", // NOT in ["games", "reminiscence", "all"]
    visibility_scope: "private",
    sensitivity: "low",
    cultural_context: "Tezpur",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
    created_by: "actor:anu",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Insert high sensitivity memory
  cognitiveStore.memories.push({
    id: "mem:high_sensitivity_bereavement",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Passing of Late Husband",
    description: "Sad bereavement memory with high grief risk",
    temporal_frame: "later_life",
    approximate_period: "2018",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "high", // High sensitivity blocked by default
    cultural_context: "Tezpur",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
    created_by: "actor:anu",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const candidates = get_reminiscence_candidates("person:purnima");

  // Verify private consent memory is blocked
  const privateDiary = candidates.find((m) => m.metadata.id === "mem:strictly_private_diary");
  assert.strictEqual(privateDiary, undefined, "Memory with person_only consent scope must be blocked from games");

  // Verify high sensitivity memory is blocked
  const highSens = candidates.find((m) => m.metadata.id === "mem:high_sensitivity_bereavement");
  assert.strictEqual(highSens, undefined, "High sensitivity memory must be blocked by default without explicit caregiver override");
});

// ── 3. Unverified Claims Labeling Tests ─────────────────────────────────────

test("Provenance & Integrity: Unverified claims are labelled and bounded", () => {
  // Add an unverified claim uploaded by person
  cognitiveStore.memories.push({
    id: "mem:unverified_childhood_claim",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Unverified Boat Trip to Majuli",
    description: "Remembering taking a ferry across Brahmaputra when 7 years old",
    temporal_frame: "childhood",
    approximate_period: "1954",
    source: "person",
    verification_status: "unverified",
    confidence: 0.4,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    cultural_context: "Majuli / Assam",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
    created_by: "actor:person",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // By default, unverified claims are excluded
  const defaultCandidates = get_reminiscence_candidates("person:purnima");
  assert.strictEqual(
    defaultCandidates.find((m) => m.metadata.id === "mem:unverified_childhood_claim"),
    undefined,
    "Unverified claim should be excluded by default from standard game candidate pool"
  );

  // When allowUnverifiedClaimsWithLabel is enabled, claim is included with label and bounded confidence
  const labelledCandidates = get_reminiscence_candidates("person:purnima", undefined, {
    allowUnverifiedClaimsWithLabel: true,
  });
  const unverifiedCandidate = labelledCandidates.find((m) => m.metadata.id === "mem:unverified_childhood_claim");
  assert.ok(unverifiedCandidate, "Unverified claim must be retrievable when explicitly permitted with label");
  assert.strictEqual(unverifiedCandidate.metadata.unverified_claim, true, "Must have unverified_claim flag set to true");
  assert.strictEqual(unverifiedCandidate.metadata.is_verified, false, "Must have is_verified set to false");
  assert.strictEqual(unverifiedCandidate.metadata.verification, "unverified");
  assert.ok(unverifiedCandidate.metadata.confidence <= 0.5, "Confidence of unverified claim must be capped at 0.5");
});

// ── 4. Cancelled & Stale Information Exclusion Tests ────────────────────────

test("Temporal Integrity: Cancelled and stale future events are excluded", () => {
  cognitiveStore.futureEvents.push({
    id: "evt:cancelled_medical_visit",
    person_id: "person:purnima",
    event_type: "medical_appointment",
    title: "Postponed Clinic Checkup",
    location: "Civil Hospital Tezpur",
    scheduled_at: "2026-09-10T11:00:00Z",
    status: "cancelled", // CANCELLED
    source: "caregiver",
    verification_status: "caregiver_verified",
  });

  cognitiveStore.futureEvents.push({
    id: "evt:expired_market_visit",
    person_id: "person:purnima",
    event_type: "community_walk",
    title: "Morning Market Stroll",
    location: "Chowk Bazaar",
    scheduled_at: "2026-09-01T08:00:00Z",
    status: "expected",
    valid_until: "2026-09-01T12:00:00Z", // EXPIRED in past
    source: "caregiver",
    verification_status: "caregiver_verified",
  });

  const currentContext = get_current_context("person:purnima");

  const cancelledEvt = currentContext.upcoming_events.find((e) => e.id === "evt:cancelled_medical_visit");
  assert.strictEqual(cancelledEvt, undefined, "Cancelled future event must NOT be in upcoming events");

  const expiredEvt = currentContext.upcoming_events.find((e) => e.id === "evt:expired_market_visit");
  assert.strictEqual(expiredEvt, undefined, "Expired/stale future event must NOT be in upcoming events");

  // Valid event like Rina's visit should remain
  assert.ok(
    currentContext.upcoming_events.some((e) => e.person_name === "Rina" || e.event_type === "family_visit"),
    "Valid confirmed family visit should be present"
  );
});

// ── 5. Low-Confidence Routes Exclusion Tests ────────────────────────────────

test("Route Safety: Low-confidence or unverified routes are not treated as verified", () => {
  cognitiveStore.familiarRoutes.push({
    id: "rt:unverified_highway_path",
    person_id: "person:purnima",
    title: "Unverified Long Walk to Highway",
    description: "An unverified route with hazardous traffic and low confidence",
    start_place_id: "pl:tezpur_home",
    destination_place_id: "pl:unknown_junction",
    routine_frequency: "occasional",
    estimated_walk_time_mins: 45,
    difficulty: 3,
    source: "model_inference",
    verification_status: "unverified", // UNVERIFIED
    confidence: 0.35,                 // LOW CONFIDENCE (< 0.75)
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:model",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const routes = get_familiar_route_candidates("person:purnima");

  const lowConfRoute = routes.find((r) => r.metadata.id === "rt:unverified_highway_path");
  assert.strictEqual(lowConfRoute, undefined, "Low-confidence/unverified route must be excluded from verified candidates pool");

  // When retrieved with allowUnverifiedClaimsWithLabel, it must NOT be marked is_eligible_for_game
  const withUnverified = get_familiar_route_candidates("person:purnima", undefined, {
    allowUnverifiedClaimsWithLabel: true,
  });
  const unverifiedRoute = withUnverified.find((r) => r.metadata.id === "rt:unverified_highway_path");
  assert.ok(unverifiedRoute, "Should be found under explicit audit mode");
  assert.strictEqual(unverifiedRoute.is_eligible_for_game, false, "Low-confidence route must NEVER be marked is_eligible_for_game");
  assert.strictEqual(unverifiedRoute.metadata.is_verified, false);
});

// ── 6. Repetition Cooldown & Overuse Suppression Tests ──────────────────────

test("Experience Memory: Recently overused memories can be suppressed", () => {
  const weddingMemId = "mem:wedding_ceremony";

  // Simulate recent play 10 minutes ago
  cognitiveStore.experienceHistory.unshift({
    id: `eh_recent_${Date.now()}`,
    person_id: "person:purnima",
    game_key: "reminiscence_journey_my_world",
    target_entity_type: "memory",
    target_entity_id: weddingMemId,
    interaction_type: "recognition",
    latency_ms: 1200,
    assistance_level: "none",
    recall_success: true,
    engagement_score: 0.95,
    recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
  });

  const candidates = get_reminiscence_candidates("person:purnima");
  const weddingCandidate = candidates.find((m) => m.metadata.id === weddingMemId);
  assert.ok(weddingCandidate, "Wedding memory should still be present in candidate pool");
  assert.strictEqual(weddingCandidate.cooldown_suppressed, true, "Memory played 10 minutes ago MUST be marked cooldown_suppressed");
  assert.ok(weddingCandidate.ranking.repetition_cooldown < 0.5, "Repetition cooldown score should be penalized for recent play");

  // Build Game 7 context pack and verify suppressed list
  const pack7 = buildGame7ContextPack("person:purnima");
  assert.ok(
    pack7.recent_experience.suppressed_memory_ids.includes(weddingMemId),
    "Pack recent_experience must record wedding memory as suppressed under cooldown"
  );
});

// ── 7. Preserved Metadata Requirements Tests ────────────────────────────────

test("Data Contract: Every retrieved object preserves id, type, provenance, verification, confidence, consent, freshness", () => {
  const memories = get_reminiscence_candidates("person:purnima");
  const places = get_familiar_place_candidates("person:purnima");
  const routes = get_familiar_route_candidates("person:purnima");

  assert.ok(memories.length > 0, "Should have memories");
  assert.ok(places.length > 0, "Should have places");
  assert.ok(routes.length > 0, "Should have routes");

  for (const obj of [...memories, ...places, ...routes]) {
    const meta = obj.metadata;
    assert.ok(meta.id && meta.id.length > 0, "Preserved metadata must have id");
    assert.ok(["memory", "place", "route"].includes(meta.type), "Preserved metadata must have valid type");
    assert.ok(meta.provenance && meta.provenance.length > 0, "Preserved metadata must have provenance");
    assert.ok(
      ["caregiver_verified", "chw_verified", "clinician_verified", "unverified"].includes(meta.verification),
      "Preserved metadata must have verification status"
    );
    assert.ok(typeof meta.confidence === "number" && meta.confidence >= 0 && meta.confidence <= 1.0, "Confidence must be 0-1");
    assert.ok(
      ["person_only", "family", "games", "reminiscence", "all"].includes(meta.consent),
      "Preserved metadata must have consent scope"
    );
    assert.ok(meta.freshness, "Preserved metadata must have freshness");
    assert.ok(typeof meta.freshness.age_days === "number", "Freshness must have age_days");
    assert.ok(typeof meta.freshness.created_at === "string", "Freshness must have created_at");
  }
});

// ── 8. 9 Combined Retrieval Dimensions Tests ────────────────────────────────

test("Retrieval Architecture: Combines all 9 retrieval dimensions", () => {
  // Dimension 1: Relational/Graph (memories link to media & people)
  const memories = get_reminiscence_candidates("person:purnima");
  const teachingMem = memories.find((m) => m.data.id === "mem:first_teaching_job");
  assert.ok(teachingMem, "Teaching memory should exist");
  assert.ok(teachingMem.associated_media.length > 0, "Graph retrieval: must resolve associated media assets");

  const weddingMem = memories.find((m) => m.data.id === "mem:wedding_ceremony");
  assert.ok(weddingMem, "Wedding memory should exist");
  assert.ok(weddingMem.associated_people.length > 0, "Graph retrieval: must resolve associated people");

  // Dimension 2: Temporal (filter by temporal_frame)
  const childhoodMems = get_reminiscence_candidates("person:purnima", undefined, {
    temporalFrame: "childhood",
  });
  assert.ok(childhoodMems.length > 0);
  for (const m of childhoodMems) {
    assert.strictEqual(m.data.temporal_frame, "childhood");
  }

  // Dimension 3: Lexical retrieval with Assamese & English synonyms
  const lexicalMatchAssamese = get_reminiscence_candidates("person:purnima", "বিয়া");
  assert.ok(lexicalMatchAssamese.length > 0);
  const matchedWedding = lexicalMatchAssamese.find((m) => m.data.id === "mem:wedding_ceremony");
  assert.ok(matchedWedding, "Wedding memory must be in retrieved candidate pool");
  assert.ok(
    (matchedWedding.search_metrics?.lexical_score || 0) >= 0.8,
    "Assamese lexical search for biya must have high lexical match score for wedding memory"
  );

  // Dimension 4: pgvector Semantic retrieval
  const weddingVec = generateSemanticEmbedding("1968 Tezpur traditional wedding bride groom");
  const schoolVec = generateSemanticEmbedding("Literature teacher classroom Tezpur girls school");
  const sim = cosineSimilarity(weddingVec, weddingVec);
  assert.strictEqual(Math.round(sim * 100), 100, "Identical vectors must have similarity ~ 1.0");
  const dist = cosineDistance(weddingVec, schoolVec);
  assert.ok(dist > 0.05, "Distinct semantic vectors must have positive cosine distance");

  // Dimension 5: Media retrieval
  const places = get_familiar_place_candidates("person:purnima");
  const courtyardPlace = places.find((p) => p.data.id === "pl:tezpur_home");
  assert.ok(courtyardPlace, "Courtyard home place should be retrieved");
  assert.ok(courtyardPlace.sensory_cues_count > 0, "Sensory cues must be extracted");

  // Dimension 6: Experience Memory
  const exp = get_recent_game_experience("person:purnima", "reminiscence_journey_my_world");
  assert.ok(exp.history.length > 0, "Experience memory must retrieve session history");
  assert.ok(typeof exp.recall_success_rate === "number");

  // Dimension 7: Personal Capability Model (PCM)
  const personalisation = get_personalisation_context("person:purnima");
  assert.strictEqual(personalisation.capability.recognition, 0.91);
  assert.strictEqual(personalisation.capability.sequencing, 0.78);

  // Dimension 8: Goal & Intention Model (GIM)
  assert.ok(personalisation.goals.length >= 3);
  assert.ok(personalisation.goals.some((g) => g.cognitive_domain === "autobiographical_memory"));

  // Dimension 9: Continual Adaptation Engine (CAE)
  assert.ok(personalisation.adaptation_policy.recommended_difficulty >= 1);
  assert.ok(personalisation.adaptation_policy.scaffolding_mode === "visual_cue");
});

// ── 9. Game 7 Ranking Criteria Tests (10 Criteria) ──────────────────────────

test("Ranking: Game 7 Memory candidates are ranked across all 10 criteria", () => {
  const candidates = get_reminiscence_candidates("person:purnima");
  assert.ok(candidates.length >= 2, "Must have at least 2 candidates to verify ranking");

  for (const cand of candidates) {
    const r = cand.ranking;
    assert.ok(r.familiarity >= 0 && r.familiarity <= 1.0, "1. familiarity score");
    assert.ok(r.verification >= 0 && r.verification <= 1.0, "2. verification score");
    assert.ok(r.personal_relevance >= 0 && r.personal_relevance <= 1.0, "3. personal relevance");
    assert.ok(r.modality_availability >= 0 && r.modality_availability <= 1.0, "4. modality availability");
    assert.ok(r.prior_engagement >= 0 && r.prior_engagement <= 1.0, "5. prior engagement");
    assert.ok(r.repetition_cooldown >= 0 && r.repetition_cooldown <= 1.0, "6. repetition cooldown");
    assert.ok(r.emotional_appropriateness >= 0 && r.emotional_appropriateness <= 1.0, "7. emotional appropriateness");
    assert.ok(r.current_context >= 0 && r.current_context <= 1.0, "8. current context");
    assert.ok(r.caregiver_eligibility >= 0 && r.caregiver_eligibility <= 1.0, "9. caregiver eligibility");
    assert.ok(r.language_culture >= 0 && r.language_culture <= 1.0, "10. language culture");
    assert.ok(r.final_rank_score >= 0 && r.final_rank_score <= 1.0, "final rank score");
  }

  // Ensure sorted descending
  for (let i = 0; i < candidates.length - 1; i++) {
    assert.ok(
      candidates[i].ranking.final_rank_score >= candidates[i + 1].ranking.final_rank_score,
      "Candidates must be sorted descending by final_rank_score"
    );
  }
});

// ── 10. Game 8 Ranking Criteria Tests (8 Criteria) ──────────────────────────

test("Ranking: Game 8 Routes are ranked across all 8 criteria", () => {
  const routes = get_familiar_route_candidates("person:purnima");
  assert.ok(routes.length >= 2, "Must have familiar routes");

  for (const route of routes) {
    const r = route.ranking;
    assert.ok(r.route_verification >= 0 && r.route_verification <= 1.0, "1. route verification");
    assert.ok(r.familiarity >= 0 && r.familiarity <= 1.0, "2. familiarity");
    assert.ok(r.confidence >= 0 && r.confidence <= 1.0, "3. confidence");
    assert.ok(r.recent_relevance >= 0 && r.recent_relevance <= 1.0, "4. recent relevance");
    assert.ok(r.destination_relevance >= 0 && r.destination_relevance <= 1.0, "5. destination relevance");
    assert.ok(r.landmark_availability >= 0 && r.landmark_availability <= 1.0, "6. landmark availability");
    assert.ok(r.route_completeness >= 0 && r.route_completeness <= 1.0, "7. route completeness");
    assert.ok(r.safety_eligibility >= 0 && r.safety_eligibility <= 1.0, "8. safety eligibility");
    assert.ok(r.final_rank_score >= 0 && r.final_rank_score <= 1.0, "final rank score");
  }

  const topRoute = routes[0];
  assert.strictEqual(topRoute.is_eligible_for_game, true, "Top ranked route must be eligible for game");
  assert.ok(topRoute.segments.length >= 2, "Top route must have sequential segments");
});

// ── 11. Purpose-Specific Game Context Packs Tests ───────────────────────────

test("Context Pack: Game 7 Context Pack builds with all required facets", () => {
  const pack = buildGame7ContextPack("person:purnima");

  assert.strictEqual(pack.game_id, "game_7_reminiscence_journey");
  assert.strictEqual(pack.person_id, "person:purnima");
  assert.ok(pack.snapshot_id && pack.snapshot_id.startsWith("snap7_"), "Must contain snapshot_id");
  assert.ok(pack.memories.length > 0, "Must contain ranked memories");
  assert.ok(pack.people.length > 0, "Must contain verified people");
  assert.ok(pack.places.length > 0, "Must contain familiar places");
  assert.ok(pack.music.length >= 2, "Must contain cultural music soundscapes");
  assert.ok(pack.family_stories.length > 0, "Must contain family stories");
  assert.ok(pack.recent_experience, "Must contain recent experience summary");
  assert.ok(pack.capability_context, "Must contain capability context");
  assert.ok([1, 2, 3].includes(pack.difficulty_recommendation), "Must contain difficulty recommendation");
  assert.strictEqual(pack.firewall_audit.passed, true, "Firewall audit must pass");
});

test("Context Pack: Game 8 Context Pack builds with all required facets", () => {
  const pack = buildGame8ContextPack("person:purnima");

  assert.strictEqual(pack.game_id, "game_8_route_builder");
  assert.strictEqual(pack.person_id, "person:purnima");
  assert.ok(pack.snapshot_id && pack.snapshot_id.startsWith("snap8_"), "Must contain snapshot_id");
  assert.ok(pack.destination, "Must have destination");
  assert.ok(pack.route, "Must have route");
  assert.ok(pack.landmarks.length >= 2, "Must have ordered landmarks");
  assert.ok(pack.route_confidence >= 0.75, "Route confidence must be >= 0.75");
  assert.ok(pack.recent_route_experience, "Must have recent route experience");
  assert.ok([1, 2, 3].includes(pack.difficulty_recommendation), "Must have difficulty recommendation");
  assert.ok(pack.scaffolding_recommendation.mode, "Must have scaffolding recommendation");
  assert.strictEqual(pack.firewall_audit.passed, true, "Firewall audit must pass");
});

// ── 12. Bounded LangGraph Orchestration Flow Tests ──────────────────────────

test("LangGraph Orchestration: Executes bounded pipeline end-to-end", () => {
  const result = BoundedGameOrchestrator.execute(
    { type: "play_game_7" },
    "person:purnima"
  );

  assert.strictEqual(result.person_id, "person:purnima");
  assert.strictEqual(result.firewall_passed, true);

  // Check that all 7 discrete nodes executed in sequence
  const nodeNames = result.execution_steps.map((s) => s.node);
  assert.deepStrictEqual(nodeNames, [
    "intent",
    "context_retrieval",
    "candidate_ranking",
    "personalisation",
    "difficulty",
    "game_template_selection",
    "specification_generation",
  ], "LangGraph nodes must execute strictly in specified order");

  for (const step of result.execution_steps) {
    assert.strictEqual(step.status, "ok", `Step ${step.node} must have status ok`);
    assert.ok(step.duration_ms >= 0);
  }

  // Check generated spec
  const spec = result.generated_spec;
  assert.ok(spec, "Must produce a generated GameSpec");
  assert.strictEqual(spec.person_id, "person:purnima");
  assert.ok(spec.title.includes("Reminiscence Journey"));
  assert.strictEqual(spec.validation_status.all_passed, true, "Generated spec must pass 5-layer validator");

  // Check Game 8 orchestration
  const routeResult = BoundedGameOrchestrator.execute(
    { type: "play_game_8" },
    "person:purnima"
  );
  assert.ok(routeResult.generated_spec);
  assert.ok(routeResult.generated_spec.title.includes("Route Builder"));
  assert.strictEqual(routeResult.generated_spec.validation_status.all_passed, true);
});

// ── 13. Game Reconstruction from Snapshot Tests ─────────────────────────────

test("Snapshot & Reconstruction: Game can be reconstructed deterministically from snapshot", () => {
  // 1. Build a Game 7 pack which creates a snapshot
  const pack = buildGame7ContextPack("person:purnima");
  const snapshotId = pack.snapshot_id;
  assert.ok(snapshotId);

  // 2. Reconstruct from snapshot
  const reconstructed = BoundedGameOrchestrator.reconstructGameFromSnapshot(snapshotId);
  assert.ok(reconstructed, "Reconstructed game must not be null");
  assert.strictEqual(reconstructed.snapshot.id, snapshotId);
  assert.strictEqual(reconstructed.game_key, "reminiscence_journey_my_world");
  assert.ok(reconstructed.spec);
  assert.strictEqual(reconstructed.spec.person_id, "person:purnima");
  assert.strictEqual(reconstructed.spec.validation_status.all_passed, true);
});
