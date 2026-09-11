import test, { describe, after } from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import { buildPersonExperienceProjection, buildEvidencePack, checkGrounding } from "../src/intelligence/context/personal-context-engine";
import { classifyIntent } from "../src/intelligence/context/intent-classifier";
import { buildDeterministicAnswer } from "../src/intelligence/context/companion-responder";

const TEST_PERSON = "person:test_context_engine";
const hasDb = Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED);

// ── §27 smoke tests: the bounded intent classifier resolves the exact utterances ──

test("Intent classifier: resolves the Prompt 3 §27 utterance set to sensible bounded classes", () => {
  const cases: Array<[string, ReturnType<typeof classifyIntent>["intent"][]]> = [
    ["What is happening today?", ["ORIENTATION"]],
    ["When is Rina coming?", ["TEMPORAL", "ORIENTATION"]],
    ["Show me Rina", ["PEOPLE"]],
    ["What happened yesterday?", ["TEMPORAL"]],
    ["Play my song", ["MEDIA"]],
    ["Let's do something", ["GAME"]],
    ["Help me", ["HELP"]],
    ["Stop", ["ACTION"]],
    ["Give me a hint", ["GAME_ASSISTANCE", "HELP"]],
    ["Do this together", ["GAME_ASSISTANCE"]],
    ["Not now", ["ACTION"]],
  ];

  for (const [utterance, acceptable] of cases) {
    const result = classifyIntent(utterance);
    assert.ok(
      acceptable.includes(result.intent),
      `"${utterance}" classified as ${result.intent}, expected one of ${acceptable.join("/")}`
    );
  }
});

test("Intent classifier: the same words resolve differently depending on context (contextual intent, §10)", () => {
  const bareHelp = classifyIntent("help me");
  assert.equal(bareHelp.intent, "HELP");

  const helpDuringGame = classifyIntent("help me", { activeGame: { game_id: "game_7" } });
  assert.equal(helpDuringGame.intent, "GAME_ASSISTANCE");

  const whoIsSheGeneric = classifyIntent("who is she");
  const whoIsSheOnPhoto = classifyIntent("who is she", { visibleEntity: { type: "person", name: "Rina" } });
  assert.equal(whoIsSheOnPhoto.intent, "PEOPLE");
  assert.ok(["PEOPLE", "CONVERSATIONAL"].includes(whoIsSheGeneric.intent));
});

// ── Grounding: the safety net that replaced fabricated context ──

test("Grounding check: rejects an answer naming a person not present in the evidence pack", () => {
  const pack = {
    facts: [
      { fact_id: "f1", text: "Rina is your granddaughter, reachable at +91 000.", source_type: "person_entity", verified: true, confidence: 1, timestamp: new Date().toISOString() },
    ],
    generated_at: new Date().toISOString(),
    consent_ok: true,
  };

  const grounded = checkGrounding("Rina is your granddaughter.", pack);
  assert.equal(grounded.grounded, true);

  const fabricated = checkGrounding("Priya is your granddaughter.", pack);
  assert.equal(fabricated.grounded, false);
  assert.ok(fabricated.unsupportedNames.includes("Priya"));

  // The evidence says who Rina is, not that she is coming -- asserting a visit
  // is a fabricated activity even though every name in it is real.
  const inventedVisit = checkGrounding("Rina will visit you this afternoon.", pack);
  assert.equal(inventedVisit.grounded, false);
  assert.ok(inventedVisit.unsupportedActivities.includes("visit"));
});

test("Grounding check: does not false-positive on sentence-initial capitalized words", () => {
  const pack = { facts: [], generated_at: new Date().toISOString(), consent_ok: true };
  const result = checkGrounding("Until then, would you like some tea? Today feels calm.", pack);
  assert.deepEqual(result.unsupportedNames, [], `expected no false positives, got: ${result.unsupportedNames.join(", ")}`);
});

test("Grounding check: still catches a fabricated name even mid-sentence after a real one", () => {
  const pack = {
    facts: [{ fact_id: "f1", text: "Rina is your granddaughter.", source_type: "person_entity", verified: true, confidence: 1, timestamp: new Date().toISOString() }],
    generated_at: new Date().toISOString(),
    consent_ok: true,
  };
  const result = checkGrounding("Rina and Priya will both visit today.", pack);
  assert.equal(result.grounded, false);
  assert.ok(result.unsupportedNames.includes("Priya"));
});

// ── Personal Context Engine: real data in, real isolation, real temporal validity ──

describe("Personal Context Engine (Neon)", { skip: !hasDb ? "Neon Database is not configured (requires DATABASE_URL)" : false }, () => {
after(async () => {
  await queryDb("DELETE FROM future_events WHERE person_id = $1", [TEST_PERSON]);
  await queryDb("DELETE FROM person_entities WHERE person_id = $1", [TEST_PERSON]);
  await queryDb("DELETE FROM relationships WHERE person_id = $1", [TEST_PERSON]);
});

test("Personal Context Engine: projection reflects real seeded data, not hardcoded facts", async () => {
  const projection = await buildPersonExperienceProjection("person:purnima", { page: "day" });
  assert.ok(projection.people.some((p) => p.name === "Rina"), "Purnima's real people include Rina");
  assert.ok(projection.memories.length > 0, "real memories are present");
  // The old bug: hardcoded "Tuesday, 10:30 AM" regardless of actual time.
  const now = new Date();
  assert.equal(new Date(projection.currentContext.now_iso).getDate(), now.getDate());
});

test("Personal Context Engine: cross-person isolation -- a test person's projection never includes another person's people or memories", async () => {
  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, verification_status)
     VALUES ('entity:test_isolation_person', $1, 'Test Only Person', 'Test Only Person', 'friend', 'verified')`,
    [TEST_PERSON]
  );
  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES ('rel:test_isolation', $1, 'entity:test_isolation_person', 'friend', 'family_core', 'system')`,
    [TEST_PERSON]
  );

  const testProjection = await buildPersonExperienceProjection(TEST_PERSON, { page: "day" });
  const purnimaProjection = await buildPersonExperienceProjection("person:purnima", { page: "day" });

  assert.ok(testProjection.people.some((p) => p.name === "Test Only Person"));
  assert.ok(!purnimaProjection.people.some((p) => p.name === "Test Only Person"), "Purnima's projection must never see the test person's contact");
  assert.ok(!testProjection.people.some((p) => p.name === "Rina"), "the test person's projection must never see Purnima's family");
});

test("Personal Context Engine: cancelled/expired events never appear as upcoming (temporal validity, §12)", async () => {
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source)
     VALUES ('test_ctx_cancelled', $1, 'family_visit', 'A cancelled visit', 'Test Home', NOW() + INTERVAL '1 hour', 'cancelled', 'caregiver')`,
    [TEST_PERSON]
  );
  const projection = await buildPersonExperienceProjection(TEST_PERSON, { page: "day" });
  assert.ok(!projection.today.upcoming.some((e) => e.id === "test_ctx_cancelled"));

  const pack = buildEvidencePack(projection);
  assert.ok(!pack.facts.some((f) => f.text.includes("cancelled visit")), "a cancelled event must never become a stated fact");
});

// ── Uncertainty handling (§14): never invent a fact when there is none ──

test("Deterministic responder: says nothing is planned rather than inventing an event when there truly is none", async () => {
  const projection = await buildPersonExperienceProjection(TEST_PERSON, { page: "day" });
  const pack = buildEvidencePack(projection);
  const classified = classifyIntent("What is happening today?");
  const result = buildDeterministicAnswer(classified, projection, pack, { language: "en" });

  assert.match(result.answer.toLowerCase(), /don't have anything recorded|nothing else recorded/);
  assert.doesNotMatch(result.answer.toLowerCase(), /walk|market|perhaps|why not/, "must not suggest an invented activity");
});

test("Deterministic responder: uses the real next event when one exists, never a hardcoded time", async () => {
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source)
     VALUES ('test_ctx_real_event', $1, 'family_visit', 'Test Real Visit', 'Test Home', NOW() + INTERVAL '2 hours', 'confirmed', 'caregiver')`,
    [TEST_PERSON]
  );
  const projection = await buildPersonExperienceProjection(TEST_PERSON, { page: "day" });
  const pack = buildEvidencePack(projection);
  const classified = classifyIntent("What is happening today?");
  const result = buildDeterministicAnswer(classified, projection, pack, { language: "en" });

  assert.match(result.answer, /Test Real Visit/);
  assert.doesNotMatch(result.answer, /4:00 PM|5:00 PM|Rina/, "must not leak the old hardcoded demo facts");
});
});

