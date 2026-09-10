import test from "node:test";
import assert from "node:assert/strict";
import {
  ExperienceEpisodeBuilder,
  PersonalCapabilityModel,
  MemoryFreshnessTracker,
  ProgressivePersonalisationLadder,
  CrossGameLearningEngine,
  OfflineEventOutbox,
} from "../src/intelligence/adaptation/index.js";
import {
  cognitiveStore,
  validateExperienceSpec,
} from "../src/intelligence/cognitive-engine.js";
import { GameTrialTelemetry, ExperienceEpisode } from "../src/domain/cognitive-experience.js";

test("Adaptation Layer: ExperienceEpisodeBuilder synthesizes rich episode & calculates Measurement Quality (Q)", () => {
  const trials: GameTrialTelemetry[] = [
    {
      trial_index: 0,
      item_id: "mem:wedding_ceremony",
      item_type: "photo",
      presented_at: "2026-09-10T10:00:00Z",
      responded_at: "2026-09-10T10:00:03Z",
      latency_ms: 3000,
      modality: "photo_plus_voice",
      difficulty_level: 2,
      assistance_level: "none",
      hints_used_count: 0,
      is_success: true,
      user_action: "select_option",
      notes: "Recognized wedding ceremony smoothly.",
    },
    {
      trial_index: 1,
      item_id: "mem:first_teaching_job",
      item_type: "photo",
      presented_at: "2026-09-10T10:00:10Z",
      responded_at: "2026-09-10T10:00:15Z",
      latency_ms: 5000,
      modality: "photo_plus_voice",
      difficulty_level: 2,
      assistance_level: "family_voice",
      hints_used_count: 1,
      is_success: true,
      user_action: "select_option",
      notes: "Recognized Girls High School with audio cue.",
    },
  ];

  const episode = ExperienceEpisodeBuilder.buildEpisode({
    personId: "person:purnima",
    templateKey: "reminiscence_journey_my_world",
    objective: "Autobiographical memory recall with family photos",
    difficulty: 2,
    modality: "photo_plus_voice",
    trials,
    domain: "autobiographical_memory",
  });

  // Telemetry assertions
  assert.ok(episode.id, "Episode must have id");
  assert.equal(episode.person_id, "person:purnima");
  assert.equal(episode.template_key, "reminiscence_journey_my_world");
  assert.equal(episode.trials_telemetry?.length, 2);
  assert.ok(episode.measurement_quality >= 0.70, "Measurement Quality Q should be high for 1 gentle hint");
  assert.equal(episode.assistance_rate, 0.5); // 1 of 2 trials had assistance
  assert.equal(episode.skips_count, 0);
  assert.ok(episode.engagement_score > 0.85);
  assert.ok(episode.idempotency_key?.startsWith("idem_"));
  assert.ok(episode.provenance_audit?.data_layer_version);
});

test("Adaptation Layer: PersonalCapabilityModel enforces Evidence Gating (Q >= 0.65 threshold)", () => {
  const pcm = new PersonalCapabilityModel();

  // Low Quality Observation (high assistance, multiple hints, multiple skips -> Q < 0.65)
  const lowQualityEpisode: ExperienceEpisode = {
    id: "ep_low_q",
    session_id: "sess_low_q",
    person_id: "person:purnima",
    template_key: "reminiscence_journey_my_world",
    generation_mode: "parametrically_personalised_level_b",
    objective: "Memory recall",
    context: { time_of_day: "10:00 AM", modality: "photo_plus_voice", difficulty: 3 },
    engagement_score: 0.50,
    assistance_rate: 0.80,
    measurement_quality: 0.42, // Under 0.65 threshold!
    trials_telemetry: [],
    skips_count: 2,
    completion_status: "abandoned",
    observed_response: "High hesitation and repeated skips.",
    learned_implication: "Requires lower cognitive load.",
    pcm_update: { domain: "autobiographical_memory", delta: 0, new_estimate: 0.85 },
    idempotency_key: "idem_low_q",
    provenance_audit: { verified_records_count: 1, unverified_records_count: 0, data_layer_version: "2.1.0" },
    created_at: new Date().toISOString(),
  };

  const lowQResult = pcm.applyObservation(lowQualityEpisode);
  assert.equal(lowQResult.updated, false, "PCM update must be rejected when Measurement Quality Q < 0.65");
  assert.match(lowQResult.reason || "", /Measurement Quality/);

  // High Quality Observation (Q >= 0.65)
  const highQualityEpisode: ExperienceEpisode = {
    ...lowQualityEpisode,
    id: "ep_high_q",
    session_id: "sess_high_q",
    measurement_quality: 0.88, // Gated pass!
    assistance_rate: 0.05,
    completion_status: "completed",
    idempotency_key: "idem_high_q",
  };

  const highQResult = pcm.applyObservation(highQualityEpisode);
  assert.equal(highQResult.updated, true, "PCM update must be applied when Measurement Quality Q >= 0.65");
  assert.ok(highQResult.new_estimate !== undefined);
});

test("Adaptation Layer: MemoryFreshnessTracker enforces cooldowns and prevents overused content", () => {
  const tracker = new MemoryFreshnessTracker();
  const personId = "person:purnima";

  // Simulate usage of memory "mem:wedding_ceremony" and person "Anu"
  tracker.recordSessionExposures(personId, "sess_1", {
    memory_ids: ["mem:wedding_ceremony"],
    family_members: ["Anu"],
    place_ids: ["pl:tezpur_home"],
    route_id: "rt:home_to_river_ghat",
  });

  // Check freshness immediately
  const memFreshness = tracker.getMemoryFreshness(personId, "mem:wedding_ceremony");
  assert.equal(memFreshness.is_on_cooldown, true, "Used memory should be on cooldown immediately");
  assert.ok(memFreshness.cooldown_score < 0.5, "Cooldown score should be depressed right after use");

  const anuFreshness = tracker.getFamilyMemberFreshness(personId, "Anu");
  assert.equal(anuFreshness.exposure_count, 1);

  // An unexposed memory must have full freshness score of 1.0
  const unexposedFreshness = tracker.getMemoryFreshness(personId, "mem:unexposed_rare_photo");
  assert.equal(unexposedFreshness.is_on_cooldown, false);
  assert.equal(unexposedFreshness.cooldown_score, 1.0);
});

test("Adaptation Layer: ProgressivePersonalisationLadder targets 75-90% success and NEVER escalates on struggle", () => {
  // Scenario 1: Person struggled (high assistance > 25% and skips > 0)
  const struggleEpisode: ExperienceEpisode = {
    id: "ep_struggle",
    session_id: "sess_struggle",
    person_id: "person:purnima",
    template_key: "reminiscence_journey_my_world",
    generation_mode: "parametrically_personalised_level_b",
    objective: "Recognition",
    context: { time_of_day: "10:00 AM", modality: "photo_plus_voice", difficulty: 3 },
    engagement_score: 0.70,
    assistance_rate: 0.40, // Struggled with high assistance
    measurement_quality: 0.75,
    trials_telemetry: [],
    skips_count: 1,
    completion_status: "completed",
    observed_response: "Struggled with Level 3 photo without label.",
    learned_implication: "Scaffold down to Level 2.",
    pcm_update: { domain: "autobiographical_memory", delta: 0, new_estimate: 0.85 },
    idempotency_key: "idem_struggle",
    provenance_audit: { verified_records_count: 2, unverified_records_count: 0, data_layer_version: "2.1.0" },
    created_at: new Date().toISOString(),
  };

  const struggleRec = ProgressivePersonalisationLadder.getNextGame7SessionRecommendation([struggleEpisode]);
  assert.ok(struggleRec.target_level <= 2, "Must scaffold down or maintain level 2 when person struggles");
  assert.match(struggleRec.rationale, /(Gently reinforcing|Maintaining comfortable rhythm)/);

  // Scenario 2: Person mastered Level 1 with 0 assistance and 0 skips
  const masteredEpisode: ExperienceEpisode = {
    ...struggleEpisode,
    id: "ep_mastered",
    session_id: "sess_mastered",
    assistance_rate: 0.0,
    skips_count: 0,
    context: { time_of_day: "10:00 AM", modality: "photo_plus_voice", difficulty: 1 },
    idempotency_key: "idem_mastered",
  };

  const advanceRec = ProgressivePersonalisationLadder.getNextGame7SessionRecommendation([masteredEpisode]);
  assert.equal(advanceRec.target_level, 2, "Advance from Level 1 to Level 2 on mastery");
  assert.match(advanceRec.rationale, /Advancing/);
});

test("Adaptation Layer: CrossGameLearningEngine derives bi-directional connections", () => {
  const g7Episode: ExperienceEpisode = {
    id: "ep_g7",
    session_id: "sess_g7",
    person_id: "person:purnima",
    template_key: "reminiscence_journey_my_world",
    generation_mode: "parametrically_personalised_level_b",
    objective: "High recognition",
    context: { time_of_day: "10:00 AM", modality: "photo_plus_voice", difficulty: 2 },
    engagement_score: 0.95,
    assistance_rate: 0.0,
    measurement_quality: 0.92,
    trials_telemetry: [],
    skips_count: 0,
    completion_status: "completed",
    observed_response: "Loved Brahmaputra river photos.",
    learned_implication: "High recognition confidence.",
    target_content: { place_ids: ["pl:brahmaputra_ghat"] },
    pcm_update: { domain: "autobiographical_memory", delta: 0.02, new_estimate: 0.92 },
    idempotency_key: "idem_g7",
    provenance_audit: { verified_records_count: 1, unverified_records_count: 0, data_layer_version: "2.1.0" },
    created_at: new Date().toISOString(),
  };

  const places = cognitiveStore.familiarPlaces;
  const routes = cognitiveStore.familiarRoutes;

  const g8Candidates = CrossGameLearningEngine.deriveGame8CandidatesFromGame7([g7Episode], places, routes);
  assert.ok(g8Candidates.length > 0, "High G7 recognition should suggest candidate routes in G8");
  assert.equal(g8Candidates[0].place.id, "pl:brahmaputra_ghat");
});

test("Offline Event Outbox: Idempotency keys prevent duplicate submission", () => {
  OfflineEventOutbox.clear();

  const dummyEpisode: ExperienceEpisode = {
    id: "ep_offline_1",
    session_id: "sess_offline_1",
    person_id: "person:purnima",
    template_key: "route_builder_familiar_places",
    generation_mode: "parametrically_personalised_level_b",
    objective: "Wayfinding",
    context: { time_of_day: "10:00 AM", modality: "tactile_touch", difficulty: 1 },
    engagement_score: 0.90,
    assistance_rate: 0.1,
    measurement_quality: 0.85,
    trials_telemetry: [],
    skips_count: 0,
    completion_status: "completed",
    observed_response: "Recognized landmark cues.",
    learned_implication: "High wayfinding safety.",
    pcm_update: { domain: "spatial_orientation", delta: 0.01, new_estimate: 0.88 },
    idempotency_key: "idem_offline_test_key_1",
    provenance_audit: { verified_records_count: 1, unverified_records_count: 0, data_layer_version: "2.1.0" },
    created_at: new Date().toISOString(),
  };

  const event1 = OfflineEventOutbox.enqueueEvent("experience_episode", dummyEpisode, "idem_offline_test_key_1");
  const event2 = OfflineEventOutbox.enqueueEvent("experience_episode", dummyEpisode, "idem_offline_test_key_1");

  // Both calls return the same event due to idempotency
  assert.equal(event1.idempotency_key, event2.idempotency_key);
  assert.equal(OfflineEventOutbox.getPendingEvents().length, 1, "Should only have 1 queued event for same idempotency key");
});

test("Security & Privacy Review: Cross-person isolation, non-fact exclusion, and safe route verification", () => {
  // 1. Cross-person isolation: Requesting games for person:other_resident must NOT return Purnima's memories or routes
  const purnimaMemories = cognitiveStore.getGameEligibleMemories("person:purnima");
  const strangerMemories = cognitiveStore.getGameEligibleMemories("person:stranger_id");
  assert.ok(purnimaMemories.eligible.length >= 2, "Purnima should have eligible memories");
  assert.equal(strangerMemories.eligible.length, 0, "Stranger must have 0 memories from Purnima (cross-person isolation)");

  // 2. Non-fact exclusion: Unverified elder claims must NOT enter game generation
  const unverifiedClaim = cognitiveStore.addMemory({
    person_id: "person:purnima",
    title: "Unverified story about Prime Minister visit",
    description: "An unverified story remembered by elder",
    memory_type: "event",
    source: "person", // Authored by elder
    verification_status: "unverified",
    confidence: 0.4,
    created_by: "actor:purnima",
    temporal_frame: "past",
    approximate_period: "1980s",
    cultural_context: "Assam",
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
  });

  const eligibleAfterAdd = cognitiveStore.getGameEligibleMemories("person:purnima");
  const containsUnverified = eligibleAfterAdd.eligible.some((m) => m.id === unverifiedClaim.id);
  assert.equal(containsUnverified, false, "Unverified memory must be strictly excluded from game eligible pool");
  assert.ok(eligibleAfterAdd.excludedUnverified >= 1, "Unverified count must be tracked");

  // 3. Safe route verification: Unverified routes must be excluded from Game 8
  const unverifiedRoute = cognitiveStore.addRoute({
    person_id: "person:purnima",
    title: "Unverified shortcut through dense jungle",
    description: "An unverified pathway through jungle",
    start_place_id: "pl:tezpur_home",
    destination_place_id: "pl:brahmaputra_ghat",
    difficulty: 2,
    source: "person",
    verification_status: "unverified",
    confidence: 0.5,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:purnima",
  });

  const routesEligible = cognitiveStore.getGameEligiblePlacesAndRoutes("person:purnima");
  const containsUnverifiedRoute = routesEligible.routes.some((r) => r.id === unverifiedRoute.id);
  assert.equal(containsUnverifiedRoute, false, "Unverified route must be excluded from Game 8");

  // 4. Five-layer validator enforces dignity, safety, grounding, consent, schema
  const invalidSpec = {
    template_key: "reminiscence_journey_my_world",
    instructions: {
      primary_prompt: "Take this Alzheimer dementia cognitive test right now or you fail!",
    },
    provenance_refs: [],
  };

  const valResult = validateExperienceSpec(invalidSpec as any);
  assert.equal(valResult.all_passed, false, "Validator must reject stressful, stigmatizing, ungrounded prompts");
  assert.equal(valResult.safety_passed, false);
  assert.equal(valResult.grounding_passed, false);
});
