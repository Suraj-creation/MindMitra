import { test } from "node:test";
import assert from "node:assert";
import { cognitiveStore } from "../src/intelligence/cognitive-engine.js";

test("Game 7: Reminiscence Journey can pull eligible verified life chapters and media assets", () => {
  const result = cognitiveStore.getGameEligibleMemories("person:purnima");
  const eligibleMemories = result.eligible;
  assert.ok(eligibleMemories.length > 0, "Should have eligible memories");

  // Verify each memory has verified status and valid consent
  for (const memory of eligibleMemories) {
    assert.ok(memory.verification_status !== "unverified");
    assert.strictEqual(memory.person_id, "person:purnima");
    assert.notStrictEqual(memory.sensitivity, "high");
  }

  // Check that media assets exist
  const media = cognitiveStore.mediaAssets.filter((m) => m.person_id === "person:purnima");
  assert.ok(media.length >= 3, "Should have media assets for wedding, school, courtyard");
  assert.ok(media.some((m) => m.title.includes("School") || m.title.includes("Wedding")));
});

test("Game 8: Route Builder loads landmark-grounded familiar routes and segments without GPS requirement", () => {
  const { routes, places } = cognitiveStore.getGameEligiblePlacesAndRoutes("person:purnima");
  assert.ok(routes.length >= 2, "Should have at least 2 eligible familiar routes");
  assert.ok(places.length >= 3, "Should have familiar places");

  const riverRoute = routes.find((r) => r.id === "rt:home_to_river_ghat");
  assert.ok(riverRoute, "Should have Courtyard to River Ghat route");

  const routeWithSegments = cognitiveStore.getRouteWithSegments(riverRoute.id);
  assert.ok(routeWithSegments, "Route with segments must exist");
  const segments = routeWithSegments.segments;
  assert.strictEqual(segments.length, 4, "Should have 4 route segments for river route");
  
  // Verify order is sequential 1, 2, 3, 4
  const orders = segments.map((s) => s.segment_order);
  assert.deepStrictEqual(orders, [1, 2, 3, 4], "Route segments must be strictly ordered");

  // Verify non-GPS sensory landmark grounding
  assert.ok(
    segments[1].sensory_description.includes("tea") ||
    segments[1].visual_cue.includes("tea") ||
    segments[1].to_landmark.includes("Tea")
  );
  assert.ok(segments[2].is_key_decision_point, "Segment 3 must be a key decision point");
});

test("Game Telemetry & History: Telemetry and snapshot logging record valid audit trails", () => {
  // Simulate recording an experience history entry for Game 7
  const hist7 = cognitiveStore.recordExperienceHistory({
    person_id: "person:purnima",
    game_key: "reminiscence_journey_my_world",
    target_entity_type: "memory",
    target_entity_id: "mem:wedding_1965",
    interaction_type: "voice_reminiscence",
    latency_ms: 1250,
    assistance_level: "none",
    recall_success: true,
    engagement_score: 0.98,
    notes: "Listened to Rina's wedding note with joy",
  });

  assert.ok(hist7.id.startsWith("eh_") || hist7.id.startsWith("exp:"));
  assert.strictEqual(hist7.game_key, "reminiscence_journey_my_world");
  assert.strictEqual(hist7.engagement_score, 0.98);

  // Simulate recording an experience history entry for Game 8
  const hist8 = cognitiveStore.recordExperienceHistory({
    person_id: "person:purnima",
    game_key: "route_builder_familiar_places",
    target_entity_type: "route",
    target_entity_id: "rt:home_to_river_ghat",
    interaction_type: "landmark_identification",
    latency_ms: 2100,
    assistance_level: "none",
    recall_success: true,
    engagement_score: 0.92,
    notes: "Selected turn right at Mohan tea stall fork",
  });

  assert.ok(hist8.id.startsWith("eh_") || hist8.id.startsWith("exp:"));
  assert.strictEqual(hist8.game_key, "route_builder_familiar_places");
  assert.strictEqual(hist8.recall_success, true);
});
