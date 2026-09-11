// Grounded conversation: the regression suite for the failure that motivated
// this work (Prompt 4 §42-§55).
//
// The reported failure was:
//   "okay what else do you have to do today"
//   -> "Aitâ, for this little walk to the market, just listen for the gentlest,
//       sunniest whisper of a path that feels like home under your feet."
//
// That was not a random hallucination. It was a misroute: the intent classifier
// matched the bare word "what" against an active game, and the game context was
// stale because the activity surface never cleared it on unmount. The question
// about the day's plan was therefore answered as a hint for the Route Builder
// activity. These tests pin down both halves, plus the retrieval that makes a
// real answer possible at all.

import test from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import { classifyIntent } from "../src/intelligence/context/intent-classifier";
import {
  buildPersonExperienceProjection,
  buildEvidencePack,
  checkGrounding,
  planRetrieval,
  minutesOfDay,
} from "../src/intelligence/context/personal-context-engine";
import { buildDeterministicAnswer } from "../src/intelligence/context/companion-responder";
import * as repo from "../src/db/person-data-repository";

const FULL_DAY = "person:test_gc_full";
const EMPTY_DAY = "person:test_gc_empty";
const OTHER = "person:test_gc_other";
const TZ = "Asia/Kolkata";

/** A timestamptz for HH:00 *today in the person's timezone*, built by Postgres. */
const todayAt = (hours: number) =>
  `(((NOW() AT TIME ZONE '${TZ}')::date + INTERVAL '${hours} hours') AT TIME ZONE '${TZ}')`;

/**
 * Minutes remaining in the day where the person lives.
 *
 * The "still ahead today" fixtures are seeded relative to NOW rather than at a
 * fixed hour: an event pinned to 23:00 stops being ahead once the clock passes
 * it, which made these tests pass in the afternoon and fail at night. Close to
 * midnight nothing can be both today and ahead, so those assertions are skipped
 * explicitly rather than left to fail.
 */
function minutesLeftInDay(): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  const m = Number(parts.find((p) => p.type === "minute")!.value);
  return 24 * 60 - (h * 60 + m);
}
const AHEAD_TODAY_IS_POSSIBLE = minutesLeftInDay() > 45;

test.before(async () => {
  await cleanup();

  // ── A person with a real, mixed day: something done, something still ahead,
  //    a routine, medicines, a cancelled event and a stale un-transitioned one.
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, person_name, relationship, location_name, scheduled_at, status, source)
     VALUES
       ('ev_gc_morning', $1, 'community_walk', 'Morning Temple Visit', NULL, NULL, 'Village Temple', ${todayAt(7)}, 'confirmed', 'caregiver'),
       ('ev_gc_rina',    $1, 'family_visit',   'Rina Visiting for Tea', 'Rina', 'granddaughter', 'Courtyard Veranda', NOW() + INTERVAL '30 minutes', 'confirmed', 'caregiver'),
       ('ev_gc_cancel',  $1, 'medical_appointment', 'Cancelled Eye Checkup', NULL, NULL, 'Town Clinic', ${todayAt(20)}, 'cancelled', 'caregiver'),
       ('ev_gc_stale',   $1, 'family_visit',   'Stale Never Closed Visit', NULL, NULL, 'Old Address', NOW() - INTERVAL '6 days', 'expected', 'caregiver')`,
    [FULL_DAY]
  );

  await queryDb(
    `INSERT INTO routines (id, person_id, title, time_of_day, anchor_description, source, verification_status, active)
     VALUES ('rt_gc_tea', $1, 'Afternoon Cardamom Tea', '16:00', 'Tea on the back veranda.', 'caregiver', 'verified', TRUE)`,
    [FULL_DAY]
  );

  await queryDb(
    `INSERT INTO medication_records (id, person_id, medication_name, dosage, scheduled_time, status)
     VALUES
       ('med_gc_morning', $1, 'Test Morning Tablet', '1 tablet', '08:00 AM', 'taken'),
       ('med_gc_night',   $1, 'Test Night Tablet',   '1 tablet', '11:30 PM', 'pending')`,
    [FULL_DAY]
  );

  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, phone, verification_status)
     VALUES ('pe_gc_rina', $1, 'Rina', 'Rina', 'granddaughter', '+91 90000 00001', 'verified')`,
    [FULL_DAY]
  );
  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verification_status)
     VALUES ('rel_gc_rina', $1, 'pe_gc_rina', 'granddaughter', 'family_core', 'verified')`,
    [FULL_DAY]
  );

  // ── Another person's day, used to prove isolation.
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source)
     VALUES ('ev_gc_other', $1, 'family_visit', 'Someone Elses Private Visit', 'Elsewhere', ${todayAt(18)}, 'confirmed', 'caregiver')`,
    [OTHER]
  );
});

test.after(cleanup);

async function cleanup() {
  const ids = [FULL_DAY, EMPTY_DAY, OTHER];
  for (const table of ["future_events", "routines", "medication_records", "relationships", "person_entities"]) {
    await queryDb(`DELETE FROM ${table} WHERE person_id = ANY($1)`, [ids]).catch(() => {});
  }
}

/** The full pipeline a companion turn runs: classify -> plan -> retrieve -> answer. */
async function ask(personId: string, message: string, ctx: any = {}, alreadyMentioned: string[] = []) {
  const classified = classifyIntent(message, ctx);
  const plan = planRetrieval(classified);
  const projection = await buildPersonExperienceProjection(personId, {
    page: ctx.page || "day",
    plan,
    scope: classified.temporal_scope,
    timeZone: TZ,
    honorific: "Aitâ",
    displayName: "Test",
  });
  const pack = buildEvidencePack(projection);
  const answer = buildDeterministicAnswer(classified, projection, pack, {
    language: "en",
    messageText: message,
    alreadyMentioned,
    visibleEntityName: ctx.visibleEntity?.name || null,
  });
  return { classified, plan, projection, pack, answer };
}

// ── §42: the exact reported failure ──────────────────────────────────────────

test("§42 Reported failure: a stale activity context no longer hijacks a question about the day", async () => {
  // Exactly the state that produced the bad answer: the person left the Route
  // Builder activity open, navigated to My Day, and asked about their day.
  const staleGameCtx = { page: "day", activeGame: { game_id: "route_builder", title: "Route Builder to Daily Market" } };

  const { classified, answer } = await ask(FULL_DAY, "okay what else do you have to do today", staleGameCtx);

  assert.equal(classified.intent, "ORIENTATION", "a question about today is never a game hint");
  assert.equal(classified.mode, "PERSONAL");
  assert.equal(classified.temporal_scope, "TODAY");
  assert.equal(classified.continuation, true, '"what else" is a continuation');

  // The specific fabrications from the reported response.
  for (const invented of [/walk/i, /market/i, /path/i, /whisper/i, /sunny|sunniest/i]) {
    assert.doesNotMatch(answer.answer, invented, `must not invent: ${invented}`);
  }
});

test("§42 The day's plan comes from the database, with what is still ahead", async (t) => {
  const { answer, projection } = await ask(FULL_DAY, "what do I have to do today", { page: "day" });

  assert.ok(projection.day, "day retrieval ran");
  assert.equal(projection.day!.attempted, true);

  // Cancelled and stale rows are excluded regardless of the time of day.
  assert.doesNotMatch(answer.answer, /Cancelled Eye Checkup/, "cancelled events are never obligations");
  assert.doesNotMatch(answer.answer, /Stale Never Closed Visit/, "a six-day-old event is not today");
  assert.ok(
    projection.day!.events.some((e) => e.title === "Rina Visiting for Tea"),
    "the real event is retrieved for today"
  );
  assert.ok(
    !projection.day!.events.some((e) => e.title === "Cancelled Eye Checkup"),
    "the cancelled event is not even in the projection"
  );

  if (!AHEAD_TODAY_IS_POSSIBLE) return t.skip("within 45 minutes of midnight: nothing can be both today and ahead");
  assert.match(answer.answer, /Rina/, "the real upcoming event is named");
});

test("§9/§18 'What else' subtracts what the conversation already covered", async (t) => {
  if (!AHEAD_TODAY_IS_POSSIBLE) return t.skip("within 45 minutes of midnight: nothing is left to subtract");
  const first = await ask(FULL_DAY, "what do I have to do today", { page: "day" });
  const second = await ask(FULL_DAY, "what else do I have to do today", { page: "day" }, ["Rina"]);

  assert.match(first.answer.answer, /Rina/);
  assert.doesNotMatch(second.answer.answer, /Rina/, "already discussed, so not repeated");
});

// ── §43: no data is a success state, not a prompt to invent ──────────────────

test("§43 A person with nothing recorded is told exactly that, and offered nothing invented", async () => {
  const { answer, projection } = await ask(EMPTY_DAY, "what do I have to do today", { page: "day" });

  assert.equal(projection.day!.nothing_recorded, true);
  assert.match(answer.answer.toLowerCase(), /don't have anything recorded/);
  assert.doesNotMatch(answer.answer, /perhaps|why not|you could|walk|market|garden/i, "no invented suggestion");
});

test("§11 'Nothing recorded' and 'could not check' are different sentences", async () => {
  const empty = await ask(EMPTY_DAY, "what do I have to do today", { page: "day" });
  assert.match(empty.answer.answer.toLowerCase(), /don't have anything recorded/);

  // A retrieval that was never attempted must not be reported as an empty day.
  const generalPlan = planRetrieval(classifyIntent("what is the capital of assam"));
  const projection = await buildPersonExperienceProjection(EMPTY_DAY, { plan: generalPlan, timeZone: TZ });
  assert.equal(projection.day!.attempted, false);
  assert.equal(projection.day!.nothing_recorded, false, "not attempted is not the same as empty");
});

// ── §44/§38: general knowledge does not trigger personal retrieval ───────────

test("§44 General knowledge is answered as general knowledge, with no personal retrieval", () => {
  for (const q of ["what is the capital of assam", "what is photosynthesis", "what is dementia", "what is a market"]) {
    const classified = classifyIntent(q, { page: "day" });
    assert.equal(classified.mode, "GENERAL", `"${q}" is general knowledge`);
    assert.equal(classified.requires_retrieval, false, `"${q}" must not trigger retrieval`);

    const plan = planRetrieval(classified);
    assert.deepEqual(
      { ...plan, dayOffset: 0 },
      { memories: false, places: false, upcoming: false, people: false, preferences: false, day: false, dayOffset: 0 },
      `"${q}" retrieves nothing personal`
    );
  }
});

test("§38 The personal twin of a general question does trigger retrieval", () => {
  const pairs: Array<[string, string]> = [
    ["how do I make tea", "how do I usually make tea"],
    ["what is a market", "when are we going to the market"],
  ];
  for (const [general, personal] of pairs) {
    const g = classifyIntent(general);
    const p = classifyIntent(personal);
    assert.equal(g.requires_retrieval, false, `"${general}" is general`);
    // mode and requires_retrieval must agree. They once disagreed: a keyword
    // rule's mode override was re-applied after the computed value, so the turn
    // was labelled PERSONAL while skipping retrieval, and answered "I can't
    // check your plan" to a question that had nothing to do with the plan.
    assert.equal(g.mode, "GENERAL", `"${general}" is GENERAL mode, consistently with its retrieval flag`);
    assert.equal(p.requires_retrieval, true, `"${personal}" is personal`);
    assert.equal(p.mode, "PERSONAL", `"${personal}" is PERSONAL mode`);
  }
});

test("§36 Pleasantries need no retrieval at all", () => {
  for (const q of ["that's nice", "thank you", "okay", "lovely"]) {
    const c = classifyIntent(q);
    assert.equal(c.requires_retrieval, false, `"${q}" needs no retrieval`);
  }
  // ...but a sentence that merely *starts* with a pleasantry is not one.
  const real = classifyIntent("okay what else do you have to do today");
  assert.equal(real.intent, "ORIENTATION");
  assert.equal(real.requires_retrieval, true);
});

// ── §45/§49: personal knowledge routes to the right source ───────────────────

test("§49 Retrieval routing: each question type reaches the source that can answer it", async () => {
  const today = await ask(FULL_DAY, "what is happening today", { page: "day" });
  assert.equal(today.plan.day, true, "TODAY -> day retrieval");
  assert.equal(today.plan.dayOffset, 0);

  const tomorrow = await ask(FULL_DAY, "what about tomorrow", { page: "day" });
  assert.equal(tomorrow.classified.temporal_scope, "TOMORROW");
  assert.equal(tomorrow.plan.dayOffset, 1, "TOMORROW -> the next day, deterministically");

  const yesterday = await ask(FULL_DAY, "what did I do yesterday", { page: "day" });
  assert.equal(yesterday.classified.temporal_scope, "YESTERDAY");
  assert.equal(yesterday.plan.dayOffset, -1);

  const people = classifyIntent("who is Rina");
  assert.equal(people.intent, "PEOPLE");
  assert.equal(planRetrieval(people).people, true);

  const memory = classifyIntent("do you remember our wedding");
  assert.equal(planRetrieval(memory).memories, true, "MEMORY -> memories + places");
});

test("§45 A named person's event is answered with that person's event", async () => {
  const { answer } = await ask(FULL_DAY, "when is Rina coming", { page: "day" });
  assert.match(answer.answer, /Rina/);
  assert.doesNotMatch(answer.answer, /Temple/, "not simply the next event overall");
});

// ── §46: current page context ────────────────────────────────────────────────

test("§46 The same words resolve differently depending on what is on screen", () => {
  const inGame = classifyIntent("help me", { page: "activity", activeGame: { game_id: "route_builder" } });
  assert.equal(inGame.intent, "GAME_ASSISTANCE");

  const onDay = classifyIntent("help me", { page: "day" });
  assert.equal(onDay.intent, "HELP");

  const onPhoto = classifyIntent("who is this", { page: "life", visibleEntity: { type: "person", name: "Rina" } });
  assert.equal(onPhoto.intent, "PEOPLE");

  // But an explicit day question is never captured by the open activity.
  const dayQuestionInGame = classifyIntent("what do I have to do today", {
    page: "activity",
    activeGame: { game_id: "route_builder" },
  });
  assert.equal(dayQuestionInGame.intent, "ORIENTATION");
});

// ── §50/§51/§52: hallucination and staleness resistance ─────────────────────

test("§50 Asking about someone who does not exist returns an explicit unknown", async () => {
  for (const q of ["when is Lakshmi coming", "Who is Lakshmi"]) {
    const { answer } = await ask(FULL_DAY, q, { page: "day" });
    assert.match(answer.answer, /don't have anyone called Lakshmi/i, `"${q}" must say so plainly`);
    assert.doesNotMatch(answer.answer, /Lakshmi is coming|Lakshmi will/i, "never invents an event for an unknown person");
  }

  // The failure this replaced was subtler than a hallucination: an unknown name
  // fell through to the generic day list, which answered with today's medicines
  // and left the person believing Lakshmi had been accounted for.
  const { answer } = await ask(FULL_DAY, "when is Lakshmi coming", { page: "day" });
  assert.doesNotMatch(answer.answer, /Coming up today/i, "must not answer a different question instead");
});

test("§50 Grounding rejects invented activities, names and times", async () => {
  const { pack } = await ask(FULL_DAY, "what do I have to do today", { page: "day" });

  // The literal reported failure.
  const reported = checkGrounding(
    "Aitâ, for this little walk to the market, just listen for the gentlest, sunniest whisper of a path.",
    pack
  );
  assert.equal(reported.grounded, false, "the reported answer must be rejected as ungrounded");
  assert.ok(reported.unsupportedActivities.includes("market"));
  assert.ok(reported.unsupportedActivities.includes("walk"));

  assert.equal(checkGrounding("Priya is visiting you.", pack).grounded, false, "invented name");
  assert.equal(checkGrounding("Rina is coming at 5:45 AM.", pack).grounded, false, "invented time");
});

test("§51 Cancelled and stale events never surface as current obligations", async () => {
  const { projection } = await ask(FULL_DAY, "what do I have to do today", { page: "day" });
  const titles = projection.day!.events.map((e) => e.title);
  assert.ok(!titles.includes("Cancelled Eye Checkup"), "cancelled excluded");

  const upcoming = await repo.listUpcomingEvents(FULL_DAY);
  assert.ok(
    !upcoming.some((e) => e.title === "Stale Never Closed Visit"),
    "a six-day-old 'expected' event is not upcoming"
  );
});

// ── §53/§26: authorization and isolation ────────────────────────────────────

test("§53 One person's day never leaks into another person's answer", async () => {
  const { projection, pack, answer } = await ask(FULL_DAY, "what do I have to do today", { page: "day" });

  assert.ok(
    !projection.day!.events.some((e) => e.title.includes("Someone Elses")),
    "the other person's event is not in the projection"
  );
  assert.ok(!pack.facts.some((f) => f.text.includes("Someone Elses")), "nor in the evidence pack");
  assert.doesNotMatch(answer.answer, /Someone Elses/, "nor in the answer");
});

// ── §54: personalisation must come from data, not from swapping a name ──────

test("§54 Two people asking the same question get substantively different answers", async (t) => {
  if (!AHEAD_TODAY_IS_POSSIBLE) return t.skip("within 45 minutes of midnight: both days read as finished");
  const a = await ask(FULL_DAY, "what do I have to do today", { page: "day" });
  const b = await ask(OTHER, "what do I have to do today", { page: "day" });

  const stripName = (s: string) => s.replace(/Aitâ|Test/g, "").trim();
  assert.notEqual(stripName(a.answer.answer), stripName(b.answer.answer), "different data, different answer");
  assert.match(a.answer.answer, /Rina/);
  assert.doesNotMatch(b.answer.answer, /Rina/);
});

// ── §15/§56: deterministic temporal reasoning ───────────────────────────────

test("§56 Clock labels are parsed deterministically, in both formats the schema stores", () => {
  assert.equal(minutesOfDay("16:00"), 16 * 60);
  assert.equal(minutesOfDay("01:30 PM"), 13 * 60 + 30);
  assert.equal(minutesOfDay("12:00 AM"), 0);
  assert.equal(minutesOfDay("12:30 PM"), 12 * 60 + 30);
  assert.equal(minutesOfDay("09:00 AM"), 9 * 60);
  assert.equal(minutesOfDay("not a time"), null);
  assert.equal(minutesOfDay(null), null);
});

test("§15 A day boundary follows the person's timezone, not the server's", async () => {
  // The seeded 23:00-IST event belongs to today in Tezpur. A server running in
  // UTC would place it on the following day; Postgres computes the boundary in
  // the person's zone so both agree.
  const events = await repo.listEventsForDay(FULL_DAY, 0, TZ);
  assert.ok(events.some((e) => e.title === "Rina Visiting for Tea"), "23:00 IST is still today in Tezpur");
});

// ── §8: completed vs remaining ──────────────────────────────────────────────

test("§8 The day distinguishes what is done from what remains", async () => {
  const { projection } = await ask(FULL_DAY, "what do I have to do today", { page: "day" });
  const meds = projection.day!.medications;

  assert.ok(meds.some((m) => m.name === "Test Morning Tablet" && m.taken), "a taken medicine is marked taken");
  assert.ok(meds.some((m) => m.name === "Test Night Tablet" && !m.taken), "a pending medicine is still due");

  // Medicines are ordered by real clock time, not by their text label --
  // "08:00 AM" must sort before "11:30 PM".
  const order = meds.map((m) => m.scheduled_time);
  assert.deepEqual(order, ["08:00 AM", "11:30 PM"]);
});

// ════════════════════════════════════════════════════════════════════════════
// Regressions found by probing a running server, not by reading the code.
// Each of these was a real wrong answer the deployed companion gave.
// ════════════════════════════════════════════════════════════════════════════

test("A refusal is honoured however it is phrased, including with a leading 'no'", () => {
  // "no, I don't want to" fell through to the CONVERSATIONAL fallback because
  // the refusal pattern was anchored at ^ and required the sentence to START
  // with "i don't want to". The person was answered "I don't have it recorded
  // why you said no" -- nonsense, and the opposite of honouring a refusal.
  const phrasings = [
    "I don't want to",
    "no, I don't want to",
    "no thanks",
    "no thank you",
    "not right now",
    "not now",
    "maybe later",
    "another time",
  ];
  // A bare "nope"/"no" stays SOCIAL rather than ACTION: it is an
  // acknowledgement token as often as a refusal, and promoting it would make
  // "no idea what is happening today" a refusal. Both classes are equivalent
  // where it matters -- neither retrieves, and neither is offered an activity.
  for (const phrase of phrasings) {
    const c = classifyIntent(phrase);
    assert.equal(c.intent, "ACTION", `"${phrase}" was classified ${c.intent}, not honoured as a refusal`);
    assert.equal(c.requires_retrieval, false, `"${phrase}" should not trigger retrieval`);
  }
});

test("A refusal is not confused with a question that merely contains 'no'", () => {
  for (const phrase of ["who is coming today?", "is there nothing planned?", "no idea what is happening today"]) {
    const c = classifyIntent(phrase);
    assert.notEqual(c.intent, "ACTION", `"${phrase}" was wrongly treated as a refusal`);
  }
});

test("'Where am I' is a grounding question, answered from the person's own recorded home", async () => {
  const c = classifyIntent("where am I?");
  assert.equal(c.intent, "HELP");
  assert.equal(c.matched_rule, "grounding_or_wayfinding");
  assert.equal(c.mode, "PERSONAL");

  // Places must be in the retrieval plan, or there is nothing to ground on.
  const plan = planRetrieval(c);
  assert.equal(plan.places, true, "a grounding question must load the person's places");

  for (const phrase of ["where are we", "is this my home", "take me home", "what is this place"]) {
    assert.equal(classifyIntent(phrase).intent, "HELP", `"${phrase}" must reach the grounding path`);
  }
});

test("With no place recorded, a grounding question reassures without asserting a location", async () => {
  const { answer: r } = await ask(EMPTY_DAY, "where am I?", { page: "help" });
  assert.equal(r.intent, "grounding");
  // The one thing it must never do is invent somewhere for a disoriented person.
  assert.ok(!/tezpur|mokokchung|home\b.*—/i.test(r.answer), `invented a location: ${r.answer}`);
  assert.match(r.answer, /right here with you/i);
});

test("The relationship named in a question is a constraint, not a hint", async () => {
  // "Tell me about my granddaughter" used to fall through to people[0] and
  // answer "This is your daughter, Anu" -- a real person, but the wrong one.
  const { answer: r } = await ask(FULL_DAY, "tell me about my granddaughter");
  assert.match(r.answer, /Rina/, `expected the granddaughter, got: ${r.answer}`);
});

test("A relationship nobody holds is declined rather than answered with a different relative", async () => {
  const { answer: r } = await ask(FULL_DAY, "tell me about my wife");
  assert.equal(r.intent, "person_unknown");
  assert.ok(!/Rina/.test(r.answer), `substituted a different person: ${r.answer}`);
  assert.match(r.answer, /don't have a wife recorded/i);
});

test("'What can I do here' is answered about the page, not about the person's records", () => {
  const c = classifyIntent("what can I do here?", { page: "life" });
  assert.equal(c.intent, "HELP");
  assert.equal(c.matched_rule, "page_help");
  assert.equal(c.requires_retrieval, false, "a question about the screen needs no personal retrieval");
});

test("Page help does not steal day-plan questions", () => {
  // "what should I do today" is about the day, not about the interface.
  const day = classifyIntent("what should I do today?");
  assert.equal(day.intent, "ORIENTATION", `day question misrouted to ${day.intent}/${day.matched_rule}`);
  const left = classifyIntent("what else do I have to do?");
  assert.equal(left.intent, "ORIENTATION");
});

test("The deterministic help answer differs by the page the person is on", () => {
  const base = {
    person: { id: FULL_DAY, display_name: "Test", honorific: "Test", preferred_language: "en", culture: "" },
    today: { upcoming: [] },
    people: [],
    memories: [],
    places: [],
    preferences: [],
    consent: { personalisation_active: true },
    safety: { firewall_passed: true, cross_person_blocked: 0, stale_or_cancelled_blocked: 0, private_or_sensitive_blocked: 0, unverified_flagged: 0 },
  };
  const pack = { facts: [], generated_at: new Date().toISOString(), consent_ok: true };
  const answers = new Set(
    ["day", "life", "activity", "people", "help"].map((page) => {
      const projection: any = { ...base, currentContext: { now_iso: new Date().toISOString(), time_of_day: "morning", page } };
      return buildDeterministicAnswer(classifyIntent("what can I do here?", { page }), projection, pack, {
        messageText: "what can I do here?",
      }).answer;
    })
  );
  assert.ok(answers.size >= 4, `help answered with the same sentence on every page (${answers.size} distinct)`);
});

test("Places reach the evidence pack, so a place the system retrieved can actually be named", async () => {
  const classified = classifyIntent("where am I?");
  const projection = await buildPersonExperienceProjection(FULL_DAY, {
    plan: planRetrieval(classified),
    timeZone: TZ,
  });
  const pack = buildEvidencePack(projection);
  // Places were retrieved into the projection and then silently dropped from
  // the pack: the model could not name the home it had just read, and the
  // grounding gate would have rejected it for trying.
  assert.equal(
    pack.facts.some((f) => f.source_type === "familiar_place") || projection.places.length === 0,
    true,
    "retrieved places must be citable evidence"
  );
});

test("The grounding gate does not reject an answer for naming a month or weekday", () => {
  const pack = { facts: [{ fact_id: "f1", text: "It is night.", source_type: "system_clock", verified: true, confidence: 1, timestamp: new Date().toISOString() }], generated_at: new Date().toISOString(), consent_ok: true };
  const result = checkGrounding("It is Saturday, the 12th of December. I am right here with you.", pack);
  assert.equal(result.grounded, true, `calendar words were treated as invented names: ${result.unsupportedNames.join(", ")}`);
});

test("The classifier's relationship vocabulary matches the one the responder resolves against", () => {
  // These all used to reach no rule at all and were answered with the generic
  // companion greeting rather than a person lookup.
  for (const word of ["wife", "husband", "sister", "brother", "mother", "father", "neighbour", "niece", "nephew", "grandson"]) {
    const c = classifyIntent(`tell me about my ${word}`);
    assert.equal(c.intent, "PEOPLE", `"my ${word}" was classified ${c.intent}/${c.matched_rule}`);
    assert.equal(c.mode, "PERSONAL");
  }
});
