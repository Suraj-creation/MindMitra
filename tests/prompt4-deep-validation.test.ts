import test from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import { buildPersonExperienceProjection, buildEvidencePack, planRetrieval, checkGrounding } from "../src/intelligence/context/personal-context-engine";
import { classifyIntent } from "../src/intelligence/context/intent-classifier";
import { buildDeterministicAnswer } from "../src/intelligence/context/companion-responder";
import * as repo from "../src/db/person-data-repository";

// ── §28 golden utterances (extends the Prompt 3 set with Prompt 4's additions) ──

test("Golden utterances: the Prompt 4 §28 additions classify to sensible bounded intents", () => {
  const cases: Array<[string, ReturnType<typeof classifyIntent>["intent"][]]> = [
    ["What happens next?", ["ORIENTATION", "TEMPORAL"]],
    ["Who is Rina?", ["PEOPLE"]],
    ["Let's do something different", ["GAME"]],
    ["Do the game we played yesterday", ["GAME", "TEMPORAL", "MEMORY"]],
  ];
  for (const [utterance, acceptable] of cases) {
    const result = classifyIntent(utterance);
    assert.ok(acceptable.includes(result.intent), `"${utterance}" -> ${result.intent}, expected one of ${acceptable.join("/")}`);
  }
});

// ── §29 retrieval evaluation: query-shaped, not "load everything" ──

test("Retrieval planner: a PEOPLE query does not pull memories/places/preferences it doesn't need", () => {
  const plan = planRetrieval("PEOPLE");
  assert.equal(plan.people, true);
  assert.equal(plan.upcoming, true); // cheap, load-bearing for most turns
  assert.equal(plan.memories, false);
  assert.equal(plan.places, false);
  assert.equal(plan.preferences, false);
});

test("Retrieval planner: a MEMORY query pulls memories and places, not preferences", () => {
  const plan = planRetrieval("MEMORY");
  assert.equal(plan.memories, true);
  assert.equal(plan.places, true);
  assert.equal(plan.preferences, false);
});

test("Retrieval planner: crisis intent retrieves the bare minimum (speed over completeness)", () => {
  const plan = planRetrieval("HUMAN_ASSISTANCE");
  assert.equal(plan.people, true);
  assert.equal(plan.memories, false);
  assert.equal(plan.places, false);
  assert.equal(plan.upcoming, false);
  assert.equal(plan.preferences, false);
});

test("Retrieval evaluation end-to-end: a PEOPLE-intent projection's memories/places arrays are genuinely empty, not just unused", async () => {
  const plan = planRetrieval("PEOPLE");
  const projection = await buildPersonExperienceProjection("person:purnima", { page: "people", plan });
  assert.ok(projection.people.length > 0, "people must still be populated");
  assert.equal(projection.memories.length, 0, "memories must not have been fetched for a people-only query");
  assert.equal(projection.places.length, 0, "places must not have been fetched for a people-only query");
});

// ── §30 personalisation evaluation: two real personas, not name-swapped clones ──

test("Personalisation evaluation: Purnima and Nekombo produce substantively different evidence for the same question", async () => {
  const plan = planRetrieval("ORIENTATION");
  const purnimaProjection = await buildPersonExperienceProjection("person:purnima", { page: "day", plan });
  const nekomboProjection = await buildPersonExperienceProjection("person:nekombo", { page: "day", plan });

  const purnimaNames = new Set(purnimaProjection.people.map((p) => p.name));
  const nekomboNames = new Set(nekomboProjection.people.map((p) => p.name));
  assert.ok(![...purnimaNames].some((n) => nekomboNames.has(n)), "the two personas' family circles must not overlap");

  const purnimaPlan = planRetrieval("MEMORY");
  const [purnimaMem, nekomboMem] = await Promise.all([
    buildPersonExperienceProjection("person:purnima", { page: "life", plan: purnimaPlan }),
    buildPersonExperienceProjection("person:nekombo", { page: "life", plan: purnimaPlan }),
  ]);
  assert.ok(purnimaMem.memories.some((m) => /tezpur|bihu|wedding/i.test(m.title)));
  assert.ok(nekomboMem.memories.some((m) => /church|jhum|moatsu/i.test(m.title)));
  assert.ok(
    !purnimaMem.memories.some((m) => /church|jhum|moatsu/i.test(m.title)),
    "Purnima's memories must not contain Nekombo's cultural content"
  );
});

// ── §31 adaptation evaluation: same intent, different available evidence, honest answers ──

test("Adaptation evaluation: the deterministic responder never fabricates a shared fact across two different personas", async () => {
  const plan = planRetrieval("ORIENTATION");
  for (const personId of ["person:purnima", "person:nekombo"]) {
    const projection = await buildPersonExperienceProjection(personId, { page: "day", plan });
    const pack = buildEvidencePack(projection);
    const classified = classifyIntent("What is happening today?");
    const result = buildDeterministicAnswer(classified, projection, pack, { language: "en" });
    // Whatever it says, it must be traceable to that same person's own evidence pack.
    // Traceability is exactly what checkGrounding measures, so assert with it
    // rather than with a prefix-substring heuristic that broke the moment the
    // answer stopped quoting evidence text verbatim.
    if (!/don't have anything recorded|nothing else recorded|can't check/i.test(result.answer)) {
      const grounding = checkGrounding(result.answer, pack);
      assert.ok(
        grounding.grounded,
        `${personId}'s answer "${result.answer}" must trace back to their own evidence pack ` +
          `(names=${grounding.unsupportedNames} activities=${grounding.unsupportedActivities} times=${grounding.unsupportedTimes})`
      );
    }
  }
});

// ── §21 action safety tiers ──

test("Action safety: call_contact actions require confirmation; navigation/media do not", () => {
  const peopleIntent = classifyIntent("call Rina");
  const projection = {
    person: { id: "person:purnima", display_name: "Purnima", honorific: "Aitâ", preferred_language: "en", culture: "" },
    currentContext: { now_iso: new Date().toISOString(), time_of_day: "afternoon" as const, page: "people" },
    today: { upcoming: [] },
    people: [{ id: "entity:rina", name: "Rina", relationship: "granddaughter", verified: true, phone: "+91 000" }],
    memories: [],
    places: [],
    preferences: [],
    consent: { personalisation_active: true },
    safety: { firewall_passed: true, cross_person_blocked: 0, stale_or_cancelled_blocked: 0, private_or_sensitive_blocked: 0, unverified_flagged: 0 },
  };
  const pack = buildEvidencePack(projection);
  const result = buildDeterministicAnswer(peopleIntent, projection, pack, {});
  assert.equal(result.action?.type, "call_contact");
  assert.equal(result.action?.risk, "requires_confirmation");

  const orientationResult = buildDeterministicAnswer(classifyIntent("What is happening today?"), projection, pack, {});
  assert.equal(orientationResult.action?.risk, "low");
});

// ── §9 repetition-aware interaction ──

test("Repetition detection: the same question asked twice is recognized without being narrated in the answer templates", async () => {
  const turn1: repo.CompanionTurnRecord = {
    id: "t1", person_id: "person:test_repeat", message: "When is Rina coming?", answer: "soon",
    intent: "day_orientation", classified_intent: "TEMPORAL", path: "deterministic", provider: "deterministic",
    grounded: true, action_type: null, page: "day", latency_ms: 10, created_at: new Date().toISOString(),
  };
  assert.equal(repo.isLikelyRepeat("When is Rina coming?", [turn1]), true);
  assert.equal(repo.isLikelyRepeat("WHEN IS RINA COMING", [turn1]), true, "case/punctuation-insensitive");
  assert.equal(repo.isLikelyRepeat("What is happening today?", [turn1]), false);

  // None of the deterministic answer templates contain scolding language.
  const scolding = /already asked|you asked that|again\?/i;
  const projection = await buildPersonExperienceProjection("person:purnima", { page: "day" });
  const pack = buildEvidencePack(projection);
  for (const utterance of ["What is happening today?", "When is Rina coming?", "Show me Rina", "Help me"]) {
    const result = buildDeterministicAnswer(classifyIntent(utterance), projection, pack, {});
    assert.doesNotMatch(result.answer, scolding);
  }
});

// ── §26 Experience Memory persistence ──

test("Experience Memory: a companion turn persists and is retrievable as this person's own recent history", async () => {
  const personId = "person:test_experience_memory";
  await repo.recordCompanionTurn({
    person_id: personId,
    message: "test message for experience memory",
    answer: "test answer",
    intent: "general_companion",
    classified_intent: "CONVERSATIONAL",
    path: "deterministic",
    provider: "deterministic",
    grounded: true,
    page: "day",
    latency_ms: 5,
  });

  const recent = await repo.getRecentCompanionTurns(personId, 5);
  assert.ok(recent.some((t) => t.message === "test message for experience memory"));

  const otherPersonTurns = await repo.getRecentCompanionTurns("person:purnima", 50);
  assert.ok(
    !otherPersonTurns.some((t) => t.message === "test message for experience memory"),
    "a turn recorded for one person must never appear in another person's history"
  );

  await queryDb("DELETE FROM companion_turns WHERE person_id = $1", [personId]);
});

// ── §32 security evaluation: attempt cross-person and unauthorized access directly against the backend ──

test("Security evaluation: cannot retrieve another person's memories, people, or events through any context-engine entry point", async () => {
  const [purnima, nekombo] = await Promise.all([
    buildPersonExperienceProjection("person:purnima", { page: "day" }),
    buildPersonExperienceProjection("person:nekombo", { page: "day" }),
  ]);

  const purnimaMemoryIds = new Set(purnima.memories.map((m) => m.id));
  const nekomboMemoryIds = new Set(nekombo.memories.map((m) => m.id));
  assert.ok([...purnimaMemoryIds].every((id) => !nekomboMemoryIds.has(id)));

  const purnimaPeopleIds = new Set(purnima.people.map((p) => p.id));
  const nekomboPeopleIds = new Set(nekombo.people.map((p) => p.id));
  assert.ok([...purnimaPeopleIds].every((id) => !nekomboPeopleIds.has(id)));
});

test("Security evaluation: the person context engine never touches caregiver/CHW/clinical-only tables", async () => {
  const fs = await import("node:fs");
  const engineSource = fs.readFileSync(new URL("../src/intelligence/context/personal-context-engine.ts", import.meta.url), "utf8");
  const repoSource = fs.readFileSync(new URL("../src/db/person-data-repository.ts", import.meta.url), "utf8");
  const forbiddenTables = ["caregiver_observations", "caregiver_support_levels", "caregiver_tasks", "clinical_consultation_notes", "clinical_followup_status", "clinical_question_decisions", "chw_households", "chw_visits"];
  for (const table of forbiddenTables) {
    assert.doesNotMatch(engineSource, new RegExp(table), `personal-context-engine.ts must never reference ${table}`);
    assert.doesNotMatch(repoSource, new RegExp(`SELECT[\\s\\S]*${table}`, "i"), `person-data-repository.ts must never SELECT from ${table}`);
  }
});

test("Security evaluation: revoked consent narrows the projection instead of erroring the whole request", async () => {
  const personId = "person:test_consent_security";
  await repo.grantConsent({ person_id: personId, purpose: "personalisation", category: "life_story_memory", granted_to_role: "primary_caregiver", granted_by: "test" });
  let active = await repo.hasActiveConsent(personId, "personalisation", "life_story_memory");
  assert.equal(active, true);

  await repo.revokeConsent(personId, "personalisation", "life_story_memory");
  active = await repo.hasActiveConsent(personId, "personalisation", "life_story_memory");
  assert.equal(active, false);

  // The projection must still resolve (graceful degradation), just with consent.personalisation_active=false.
  const projection = await buildPersonExperienceProjection(personId, { page: "day" });
  assert.equal(projection.consent.personalisation_active, false);
});

// ── §4/§29 query-shaped retrieval precision: caught live in browser testing --
// "When will Rina call me?" used to answer with whichever event came first
// chronologically (the tea reminder), not the event actually about Rina.

test("Retrieval precision: a question naming a specific person returns THAT person's event, not just the next one overall", async () => {
  const personId = "person:test_event_precision";
  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, verification_status)
     VALUES ('entity:precision_person', $1, 'TestPerson', 'TestPerson', 'friend', 'verified')`,
    [personId]
  );
  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES ('rel:precision_person', $1, 'entity:precision_person', 'friend', 'family_core', 'system')`,
    [personId]
  );
  // Two events: an EARLIER generic one, and a LATER one naming TestPerson.
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source)
     VALUES ('test_precision_earlier', $1, 'routine_tea', 'Afternoon tea', 'Home', NOW() + INTERVAL '1 hour', 'confirmed', 'caregiver')`,
    [personId]
  );
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, person_name, location_name, scheduled_at, status, source)
     VALUES ('test_precision_later', $1, 'family_visit', 'Visit', 'TestPerson', 'Home', NOW() + INTERVAL '3 hours', 'confirmed', 'caregiver')`,
    [personId]
  );

  const projection = await buildPersonExperienceProjection(personId, { page: "day" });
  const pack = buildEvidencePack(projection);
  const classified = classifyIntent("When will TestPerson visit?");
  const result = buildDeterministicAnswer(classified, projection, pack, { messageText: "When will TestPerson visit?" });

  assert.match(result.answer, /Visit/, "must answer about the visit, not the earlier unrelated tea reminder");
  assert.doesNotMatch(result.answer, /Afternoon tea/);

  await queryDb("DELETE FROM future_events WHERE person_id = $1", [personId]);
  await queryDb("DELETE FROM relationships WHERE person_id = $1", [personId]);
  await queryDb("DELETE FROM person_entities WHERE person_id = $1", [personId]);
});
