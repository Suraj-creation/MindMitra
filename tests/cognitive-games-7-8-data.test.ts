import test from "node:test";
import assert from "node:assert/strict";
import {
  cognitiveStore,
  INITIAL_FAMILIAR_PLACES,
  INITIAL_FAMILIAR_ROUTES,
  INITIAL_ROUTE_SEGMENTS,
  INITIAL_MEMORY_MEDIA,
  INITIAL_MEMORY_PEOPLE,
  INITIAL_MEMORY_VOICE_NOTES,
} from "../src/intelligence/cognitive-engine.js";

test("Data Foundation: Initial Familiar Places adhere to 9-field provenance and sensory grounding", () => {
  assert.ok(INITIAL_FAMILIAR_PLACES.length >= 3, "At least 3 initial familiar places must exist");

  for (const place of INITIAL_FAMILIAR_PLACES) {
    // 9 mandatory provenance fields
    assert.ok(place.id, "Place must have id");
    assert.ok(place.person_id, "Place must have person_id");
    assert.ok(place.name, "Place must have name");
    assert.ok(place.source, "Place must have source");
    assert.ok(place.verification_status, "Place must have verification_status");
    assert.equal(typeof place.confidence, "number", "Confidence must be a number");
    assert.ok(place.consent_scope, "Place must have consent_scope");
    assert.ok(place.visibility_scope, "Place must have visibility_scope");
    assert.ok(place.sensitivity, "Place must have sensitivity");
    assert.ok(place.created_by, "Place must have created_by");
    assert.ok(place.created_at, "Place must have created_at");
    assert.ok(place.updated_at, "Place must have updated_at");

    // Sensory & landmark cues
    assert.ok(Array.isArray(place.landmark_cues), "Landmark cues must be array");
    assert.ok(place.landmark_cues.length > 0, "Must have at least one landmark cue");
    assert.ok(place.sensory_cues, "Must have sensory cues object");
  }

  // Verify specific Tezpur locations
  const home = INITIAL_FAMILIAR_PLACES.find((p) => p.id === "pl:tezpur_home");
  assert.ok(home, "Ancestral home in Tezpur must exist");
  assert.equal(home.category, "home");
  assert.match(home.assamese_name || "", /তেজপুৰ/);

  // Verify non-GPS requirement: Mahabhairab Temple has null coordinates
  const temple = INITIAL_FAMILIAR_PLACES.find((p) => p.id === "pl:mahabhairab_temple");
  assert.ok(temple, "Mahabhairab Temple must exist");
  assert.equal(temple.coordinates, null, "Coordinates can be null for non-GPS landmark navigation");
});

test("Data Foundation: Familiar Routes and Route Segments are sequentially ordered", () => {
  assert.ok(INITIAL_FAMILIAR_ROUTES.length >= 2, "At least 2 familiar routes must exist");
  assert.ok(INITIAL_ROUTE_SEGMENTS.length >= 4, "Initial route segments must exist");

  const riverRoute = INITIAL_FAMILIAR_ROUTES.find((r) => r.id === "rt:home_to_river_ghat");
  assert.ok(riverRoute, "Route from home to river ghat must exist");
  assert.equal(riverRoute.start_place_id, "pl:tezpur_home");
  assert.equal(riverRoute.destination_place_id, "pl:brahmaputra_ghat");

  // Retrieve route with segments via CognitiveStore
  const routeWithSegs = cognitiveStore.getRouteWithSegments("rt:home_to_river_ghat");
  assert.ok(routeWithSegs, "Must retrieve route with segments");
  assert.ok(routeWithSegs.segments.length >= 4, "River route must have at least 4 segments");

  // Check strict sequential ordering
  for (let i = 0; i < routeWithSegs.segments.length; i++) {
    assert.equal(routeWithSegs.segments[i].segment_order, i + 1, `Segment order must be ${i + 1}`);
    assert.ok(routeWithSegs.segments[i].from_landmark, "Segment must have from_landmark");
    assert.ok(routeWithSegs.segments[i].to_landmark, "Segment must have to_landmark");
    assert.ok(routeWithSegs.segments[i].visual_cue, "Segment must have visual_cue");
  }

  // Key decision point exists
  const turnSegment = routeWithSegs.segments.find((s) => s.turn_instruction === "turn_right");
  assert.ok(turnSegment, "Must have turn segment");
  assert.equal(turnSegment.is_key_decision_point, true, "Turn must be a key decision point");
});

test("Provenance & Firewall: Person upload starts as unverified claim and is excluded from games", () => {
  // Person uploads a memory
  const unverifiedMem = cognitiveStore.addMemory({
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Vivid memory of old banyan tree swing",
    description: "I remember swinging on the roots when I was small",
    temporal_frame: "childhood",
    approximate_period: "1954",
    source: "person", // uploaded by person
    consent_scope: "person_only",
    visibility_scope: "private",
    sensitivity: "low",
    created_by: "person:purnima",
    cultural_context: "Courtyard in Tezpur",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
  });

  // Strict rule: Person upload must NOT be verified automatically
  assert.equal(unverifiedMem.verification_status, "unverified");
  assert.ok(unverifiedMem.confidence <= 0.70, "Unverified memory confidence must be <= 0.70");

  // Query game-eligible content for Purnima
  const eligibility = cognitiveStore.getGameEligibleMemories("person:purnima");

  // Must NOT include the unverified memory
  const foundInEligible = eligibility.eligible.some((m) => m.id === unverifiedMem.id);
  assert.equal(foundInEligible, false, "Unverified memory must NEVER be eligible for cognitive games");
  assert.ok(eligibility.excludedUnverified >= 1, "Must track count of excluded unverified memories");

  // Explicit caregiver verification action
  const verifiedMem = cognitiveStore.verifyMemory(
    unverifiedMem.id,
    "Anu (Primary Caregiver)",
    "caregiver",
    "Verified family story",
    "Anu confirms Purnima's childhood garden had this banyan swing."
  );

  assert.ok(verifiedMem, "Memory must be updated");
  assert.equal(verifiedMem.verification_status, "caregiver_verified");
  assert.equal(verifiedMem.confidence, 1.0, "Verified memory confidence is 1.0");
  assert.equal(verifiedMem.verified_by, "Anu (Primary Caregiver)");
  assert.ok(verifiedMem.verified_at, "Must record verification timestamp");

  // Update consent scope to 'all' so it can participate in games
  verifiedMem.consent_scope = "all";

  // Now query eligibility again
  const eligibilityAfter = cognitiveStore.getGameEligibleMemories("person:purnima");
  const foundAfter = eligibilityAfter.eligible.some((m) => m.id === unverifiedMem.id);
  assert.equal(foundAfter, true, "Memory becomes game-eligible after caregiver verification and consent");
});

test("Cross-Person Isolation: Personal data is strictly isolated per person_id", () => {
  // Query eligible content for an unrelated person ID
  const otherPersonContent = cognitiveStore.getGameEligibleMemories("person:unknown_user_99");
  assert.equal(otherPersonContent.eligible.length, 0, "Zero memories must leak to unknown person ID");

  const otherPlacesAndRoutes = cognitiveStore.getGameEligiblePlacesAndRoutes("person:unknown_user_99");
  assert.equal(otherPlacesAndRoutes.places.length, 0, "Zero places must leak to unknown person ID");
  assert.equal(otherPlacesAndRoutes.routes.length, 0, "Zero routes must leak to unknown person ID");

  // Context pack for other person does not leak Purnima's family
  const otherPack = cognitiveStore.getContextPack("person:other_resident");
  assert.equal(otherPack.person.id, "person:other_resident");
  assert.equal(otherPack.world.people.length, 0, "Other person context pack must not include Purnima's family");
});

test("Consent Scope & Sensitivity Gating: High sensitivity and restrictive consent items are blocked", () => {
  // Add a highly sensitive memory
  const sensitiveMem = cognitiveStore.addMemory({
    person_id: "person:purnima",
    memory_type: "relationship",
    title: "Confidential family inheritance discussion",
    description: "Private conversation with lawyer",
    temporal_frame: "later_life",
    approximate_period: "1995",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "high", // High sensitivity!
    created_by: "actor:anu",
    cultural_context: "Private",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
  });

  // Check without includeSensitive
  const standardCheck = cognitiveStore.getGameEligibleMemories("person:purnima", { includeSensitive: false });
  assert.equal(
    standardCheck.eligible.some((m) => m.id === sensitiveMem.id),
    false,
    "High sensitivity memory must be excluded by default from game play"
  );
  assert.ok(standardCheck.excludedSensitive >= 1, "Must record excluded sensitive count");

  // Check with explicit includeSensitive
  const authorizedCheck = cognitiveStore.getGameEligibleMemories("person:purnima", { includeSensitive: true });
  assert.equal(
    authorizedCheck.eligible.some((m) => m.id === sensitiveMem.id),
    true,
    "High sensitivity memory included only when explicitly authorized"
  );
});

test("Snapshot & Experience History: Deterministic snapshots and latency logging operate reliably", () => {
  // Create snapshot for Game 7
  const snapshot7 = cognitiveStore.createGameSnapshot("person:purnima", "reminiscence_journey_my_world");
  assert.ok(snapshot7.id, "Snapshot must have ID");
  assert.ok(snapshot7.verification_hash, "Snapshot must have verification hash");
  assert.ok(snapshot7.eligible_memories_count > 0, "Must count eligible memories");

  // Retrieve snapshot
  const retrieved = cognitiveStore.getLatestSnapshot("person:purnima", "reminiscence_journey_my_world");
  assert.ok(retrieved, "Must retrieve latest snapshot");
  assert.equal(retrieved.id, snapshot7.id);

  // Log experience history
  const history = cognitiveStore.recordExperienceHistory({
    person_id: "person:purnima",
    game_key: "reminiscence_journey_my_world",
    target_entity_type: "memory",
    target_entity_id: "mem:wedding_ceremony",
    interaction_type: "recognition",
    latency_ms: 1950,
    assistance_level: "none",
    recall_success: true,
    engagement_score: 0.95,
    notes: "Prompt verbal recognition with warm smile",
  });

  assert.ok(history.id, "History entry must have ID");
  assert.equal(history.latency_ms, 1950);
  assert.equal(history.recall_success, true);
  assert.ok(cognitiveStore.experienceHistory.some((h) => h.id === history.id));
});
