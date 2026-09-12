// The person's life as data, and what the companion can do with it.
//
// Three things are pinned here, each of which was broken in a running build:
//   1. A form of address is a word someone can be called, never a picker label.
//   2. "Who do I call?" and "I feel alone" are different from every other kind
//      of question and must not be answered as lookups.
//   3. A life rich enough to build activities from -- family, a whole day,
//      several days of events, preferences -- is a testable property, not a
//      hope. Every template that declines should decline for a stated reason.

import test from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import { classifyIntent } from "../src/intelligence/context/intent-classifier";
import {
  buildPersonExperienceProjection,
  buildEvidencePack,
  planRetrieval,
  safeHonorific,
} from "../src/intelligence/context/personal-context-engine";
import { buildDeterministicAnswer } from "../src/intelligence/context/companion-responder";
import { seedRichLife, getEmergencyContacts, RICH_LIFE_SEEDS } from "../src/db/seed-rich-life";
import { planExperience } from "../src/intelligence/experience/planner";
import { EXPERIENCE_TEMPLATES } from "../src/intelligence/experience/templates";

const PURNIMA = "person:purnima";
const NEKOMBO = "person:nekombo";
const TZ = "Asia/Kolkata";

/** The pipeline a companion turn runs: classify -> plan -> retrieve -> answer. */
async function ask(personId: string, message: string, ctx: any = {}) {
  const classified = classifyIntent(message, ctx);
  const projection = await buildPersonExperienceProjection(personId, {
    page: ctx.page || "day",
    plan: planRetrieval(classified),
    scope: classified.temporal_scope,
    timeZone: TZ,
    honorific: ctx.honorific ?? "Aitâ",
    displayName: "Test",
  });
  const pack = buildEvidencePack(projection);
  const answer = buildDeterministicAnswer(classified, projection, pack, {
    language: "en",
    messageText: message,
    visibleEntityName: ctx.visibleEntity?.name || null,
  });
  return { classified, projection, pack, answer };
}

test.before(async () => {
  await seedRichLife();
});

// ── 1. A form of address is a word, not a category ─────────────────────────

test("A gender picker label is never used as a form of address", async () => {
  // The reported bug: the onboarding card stored its own label as the
  // honorific, and the companion greeted the person "Namaskar Man (পুৰুষ / ককা)"
  // -- reading a gender category aloud as though it were their name.
  for (const label of [
    "Man (পুৰুষ / ককা)",
    "Woman (মহিলা / বাইদেউ / আইতা)",
    "Another identity",
    "Prefer not to say",
    "",
    null,
    undefined,
  ]) {
    assert.equal(
      safeHonorific(label as string, "Purnima"),
      "Purnima",
      `"${label}" must not be spoken as a form of address`
    );
  }
  // A real term of address survives untouched.
  for (const good of ["Aitâ", "Koka", "Baideu", "Purnima baideu"]) {
    assert.equal(safeHonorific(good, "Purnima"), good);
  }
});

test("No stored onboarding profile holds a picker label as its honorific", async () => {
  const rows = await queryDb<{ person_id: string; honorific: string | null }>(
    `SELECT person_id, honorific FROM onboarding_profiles`
  );
  for (const r of rows) {
    if (!r.honorific) continue;
    assert.ok(
      !/[()/]/.test(r.honorific),
      `${r.person_id} has a picker label stored as an honorific: "${r.honorific}"`
    );
  }
});

// ── 2. Emergency and emotional support ─────────────────────────────────────

test("Emergency contacts come back in escalation order from the relationship graph", async () => {
  const contacts = await getEmergencyContacts(PURNIMA);
  assert.ok(contacts.length >= 3, "there should be several people reachable");
  assert.equal(contacts[0].closeness, "primary_caregiver", "the caregiver is tried first");
  assert.ok(contacts.every((c) => !!c.phone), "an emergency contact with no number is useless");

  const order = contacts.map((c) => c.closeness);
  const rank: Record<string, number> = { primary_caregiver: 0, family_core: 1, community_chw: 2, clinical: 3 };
  for (let i = 1; i < order.length; i++) {
    assert.ok(rank[order[i]] >= rank[order[i - 1]], `escalation order broken at ${i}: ${order.join(" -> ")}`);
  }
});

test("Someone who has died is never offered as someone to call", async () => {
  const contacts = await getEmergencyContacts(PURNIMA);
  assert.ok(!contacts.some((c) => c.name === "Nirmal"), "the late husband must not be in the call list");
  // ...but he is still part of her life and must remain retrievable.
  const people = await queryDb<{ name: string }>(
    `SELECT display_name AS name FROM person_entities WHERE person_id = $1 AND display_name = 'Nirmal'`,
    [PURNIMA]
  );
  assert.equal(people.length, 1, "he should still exist as a person in her world");
});

test("'Who do I call?' is routed to the escalation order, not to a general person lookup", () => {
  for (const q of ["who do I call if I need help?", "I need help", "who can help me", "nobody is here", "is anyone there"]) {
    const c = classifyIntent(q);
    assert.equal(c.intent, "HUMAN_ASSISTANCE", `"${q}" -> ${c.intent}/${c.matched_rule}`);
    assert.equal(c.matched_rule, "emergency_contact_request", q);
  }
});

test("The answer to 'who do I call' names a real person and their real number", async () => {
  const { answer } = await ask(PURNIMA, "who do I call if I need help?");
  assert.equal(answer.intent, "emergency_contacts");
  const contacts = await getEmergencyContacts(PURNIMA);
  assert.ok(answer.answer.includes(contacts[0].name), `expected ${contacts[0].name}: ${answer.answer}`);
  assert.ok(answer.answer.includes(contacts[0].phone), "the number has to be said, not just the name");
  assert.equal(answer.action?.type, "call_contact");
  assert.equal(answer.action?.target, contacts[0].name);
});

test("Distress is met as a feeling, not answered as a database lookup", () => {
  for (const q of ["I feel so lonely today", "I am scared", "I miss my husband", "nobody visits me", "I feel like crying"]) {
    const c = classifyIntent(q);
    assert.equal(c.matched_rule, "emotional_support", `"${q}" -> ${c.intent}/${c.matched_rule}`);
  }
});

test("An emotional-support answer acknowledges the feeling and offers a real person, not the schedule", async () => {
  const { answer } = await ask(PURNIMA, "I feel so lonely today");
  assert.equal(answer.intent, "emotional_support");
  // The failure this guards: "I feel so lonely today" contains "today", and was
  // answered with the day's medication list.
  assert.ok(!/\b(medicine|medication|tablet|Donepezil|Calcium)\b/i.test(answer.answer), answer.answer);
  assert.ok(!/don'?t have (it|that|anything) recorded/i.test(answer.answer), answer.answer);
  const contacts = await getEmergencyContacts(PURNIMA);
  assert.ok(answer.answer.includes(contacts[0].name), `should offer a real person: ${answer.answer}`);
});

test("Distress is not treated as a crisis: the helpline script is reserved for crisis language", async () => {
  const gentle = await ask(PURNIMA, "I feel so lonely today");
  assert.ok(!/14416/.test(gentle.answer.answer), "loneliness is not a crisis escalation");

  const crisis = classifyIntent("I want to die");
  assert.equal(crisis.matched_rule, "crisis_language");
});

// ── 3. A life rich enough to build from ────────────────────────────────────

test("Each seeded person has a whole day, a family, and several days of events", async () => {
  for (const life of RICH_LIFE_SEEDS) {
    const p = life.personId;
    const [routines, people, memories, places, events, prefs] = await Promise.all([
      queryDb<any>(`SELECT 1 FROM routines WHERE person_id=$1 AND active`, [p]),
      queryDb<any>(`SELECT 1 FROM person_entities WHERE person_id=$1`, [p]),
      queryDb<any>(`SELECT 1 FROM memory_items WHERE person_id=$1 AND verification_status='verified'`, [p]),
      queryDb<any>(`SELECT 1 FROM familiar_places WHERE person_id=$1`, [p]),
      queryDb<any>(`SELECT 1 FROM future_events WHERE person_id=$1`, [p]),
      queryDb<any>(`SELECT 1 FROM preferences WHERE person_id=$1 AND superseded_by IS NULL`, [p]),
    ]);
    assert.ok(routines.length >= 8, `${p}: a day needs more than ${routines.length} anchors`);
    assert.ok(people.length >= 3, `${p}: only ${people.length} people`);
    assert.ok(memories.length >= 3, `${p}: only ${memories.length} verified memories`);
    assert.ok(places.length >= 2, `${p}: only ${places.length} places`);
    assert.ok(events.length >= 4, `${p}: only ${events.length} events`);
    assert.ok(prefs.length >= 5, `${p}: only ${prefs.length} active preferences`);
  }
});

test("The day covers meals and sleep, not just highlights", async () => {
  const rows = await queryDb<{ title: string }>(
    `SELECT title FROM routines WHERE person_id = $1 AND active ORDER BY time_of_day`,
    [PURNIMA]
  );
  const all = rows.map((r) => r.title.toLowerCase()).join(" | ");
  for (const needed of ["breakfast", "lunch", "dinner", "bed", "tea"]) {
    assert.ok(all.includes(needed), `the day has no ${needed}: ${all}`);
  }
});

test("Day-relative events are rebuilt on seed, so 'yesterday' is genuinely yesterday", async () => {
  await seedRichLife();
  const rows = await queryDb<{ n: number }>(
    `SELECT count(*)::int AS n FROM future_events
     WHERE person_id = $1
       AND (scheduled_at AT TIME ZONE $2)::date = ((NOW() AT TIME ZONE $2)::date - INTERVAL '1 day')::date`,
    [PURNIMA, TZ]
  );
  assert.ok(rows[0].n >= 1, "there must be something recorded for yesterday");
});

test("A cancelled event is seeded on purpose and is never treated as current", async () => {
  const cancelled = await queryDb<any>(
    `SELECT id FROM future_events WHERE person_id=$1 AND status='cancelled'`,
    [PURNIMA]
  );
  assert.ok(cancelled.length >= 1, "the fixture that proves exclusion works must exist");

  const { projection } = await ask(PURNIMA, "who is coming today?");
  const ids = (projection.day?.events ?? []).map((e) => e.id);
  for (const c of cancelled) {
    assert.ok(!ids.includes(c.id), `cancelled event ${c.id} surfaced as part of the day`);
  }
});

// ── 4. Preferences and emergency contacts are citable evidence ──────────────

test("Preferences reach the evidence pack, so they can actually change an answer", async () => {
  const { pack } = await ask(PURNIMA, "what do I enjoy?");
  const prefs = pack.facts.filter((f) => f.source_type === "preference");
  assert.ok(prefs.length > 0, "preferences were retrieved and then dropped -- they change nothing");
  const text = prefs.map((f) => f.text).join(" ").toLowerCase();
  assert.ok(text.includes("avoid"), "the avoidances the person stated must be visible to the answer layer");
});

test("Emergency contacts reach the evidence pack as a single ordered fact", async () => {
  const { pack } = await ask(PURNIMA, "who do I call if I need help?");
  const em = pack.facts.filter((f) => f.source_type === "emergency_contact");
  assert.equal(em.length, 1, "one ordered line, not one fact per person");
  const contacts = await getEmergencyContacts(PURNIMA);
  assert.ok(em[0].text.includes(contacts[0].name));
  assert.ok(em[0].text.indexOf(contacts[0].name) < em[0].text.indexOf(contacts[contacts.length - 1].name), "order preserved");
});

// ── 5. Routine questions answer the thing that was asked ───────────────────

test("A question about a part of the day is about THIS person's day, not the dictionary", () => {
  for (const q of ["what happens in the evening?", "what do I do in the morning?", "what happens at night?"]) {
    const c = classifyIntent(q);
    assert.equal(c.intent, "ROUTINE", `"${q}" -> ${c.intent}/${c.matched_rule}`);
    assert.equal(c.mode, "PERSONAL", q);
  }
});

test("A question naming one routine is answered with that routine, not the whole morning", async () => {
  const { answer } = await ask(PURNIMA, "when do I have lunch?");
  assert.match(answer.answer, /lunch/i, `expected the lunch row: ${answer.answer}`);
  assert.ok(!/waking|morning naam/i.test(answer.answer), `listed the day instead of answering: ${answer.answer}`);
});

test("A question about the evening is answered with evening routines", async () => {
  const { answer } = await ask(PURNIMA, "what happens in the evening?");
  assert.ok(
    /evening|dinner|prayer|walk/i.test(answer.answer),
    `expected something from the evening: ${answer.answer}`
  );
  assert.ok(!/breakfast|morning tea/i.test(answer.answer), `answered with the morning: ${answer.answer}`);
});

// ── 6. The activity engine can build from this life ────────────────────────

test("Every template either composes from real data or declines with a reason", async () => {
  for (const person of [PURNIMA, NEKOMBO]) {
    for (const template of EXPERIENCE_TEMPLATES) {
      const r = await planExperience({ personId: person, trigger: "lets_do_something", preferTemplate: template.id, language: "en" });
      assert.ok(["ready", "no_data"].includes(r.status), `${person}/${template.id} -> ${r.status}`);
      if (r.status === "ready") {
        assert.equal(r.spec.template_id, template.id);
        assert.ok(r.spec.steps[0].choices.length >= 2);
        assert.ok(r.trace.validation?.is_valid, `${template.id} composed an invalid spec`);
      } else {
        assert.ok(r.detail.length > 0, `${person}/${template.id} declined without saying why`);
      }
    }
  }
});

test("The richer life unlocks templates that could not compose before", async () => {
  // ROUTINE_SEQUENCE needs at least three ordered anchors in the day. With one
  // routine per person it could never compose; with a whole day it can.
  const r = await planExperience({ personId: PURNIMA, trigger: "lets_do_something", preferTemplate: "ROUTINE_SEQUENCE", language: "en" });
  assert.equal(r.status, "ready", `ROUTINE_SEQUENCE should compose from a full day: ${(r as any).detail ?? ""}`);
  if (r.status !== "ready") return;
  assert.match(r.spec.steps[0].prompt, /after/i);
});

test("'Who is this?' is only ever asked over a declared portrait", async () => {
  // Guards a real failure: the composer used to accept any photo attached to
  // any memory the person was linked to, so it asked "Who is this?" over a
  // photograph of silk cloth because the weaving memory named her daughter.
  const r = await planExperience({ personId: PURNIMA, trigger: "lets_do_something", preferTemplate: "PERSON_RECOGNITION", language: "en" });
  if (r.status !== "ready") return; // declining is always acceptable
  const step = r.spec.steps[0];
  assert.ok(step.media, "a person-recognition activity must show a photograph");

  const expected = step.choices.find((c) => c.is_expected)!;
  const avatar = await queryDb<{ avatar_media_id: string | null }>(
    `SELECT avatar_media_id FROM person_entities WHERE id = $1`,
    [expected.source_entity_id]
  );
  assert.equal(
    avatar[0]?.avatar_media_id,
    step.media!.media_id,
    "the photograph must be that person's declared portrait, not one inferred from a memory"
  );
});

test("A photograph is never the correct answer to two questions of the same kind", async () => {
  // The invariant is about ambiguity WITHIN one question, not reuse across
  // questions. One photo standing for two different memories makes "which
  // memory is this from?" have two right answers, and the same for places.
  //
  // Reuse ACROSS kinds is fine and deliberate: the photograph of the school is
  // legitimately both the answer to "which place is this?" and to "which
  // memory is this from?", because the memory is about that place. The two
  // activities draw their distractors from different pools, so neither
  // question becomes ambiguous.
  for (const person of [PURNIMA, NEKOMBO]) {
    const dupMemories = await queryDb<{ media_asset_id: string }>(
      `SELECT mm.media_asset_id FROM memory_media mm
       JOIN memory_items m ON m.id = mm.memory_id
       WHERE m.person_id = $1
       GROUP BY mm.media_asset_id HAVING count(*) > 1`,
      [person]
    );
    assert.equal(dupMemories.length, 0, `${person}: one photo is the answer to two memories: ${dupMemories.map((r) => r.media_asset_id).join(", ")}`);

    const dupPlaces = await queryDb<{ media_asset_id: string }>(
      `SELECT pm.media_asset_id FROM place_media pm
       JOIN familiar_places p ON p.id = pm.place_id
       WHERE p.person_id = $1
       GROUP BY pm.media_asset_id HAVING count(*) > 1`,
      [person]
    );
    assert.equal(dupPlaces.length, 0, `${person}: one photo is the answer to two places: ${dupPlaces.map((r) => r.media_asset_id).join(", ")}`);
  }
});

test("Two different lives still produce different activities", async () => {
  const a = await planExperience({ personId: PURNIMA, trigger: "lets_do_something", language: "en" });
  const b = await planExperience({ personId: NEKOMBO, trigger: "lets_do_something", language: "en" });
  assert.equal(a.status, "ready");
  assert.equal(b.status, "ready");
  if (a.status !== "ready" || b.status !== "ready") return;
  const la = a.spec.steps.flatMap((s) => s.choices.map((c) => c.label));
  const lb = b.spec.steps.flatMap((s) => s.choices.map((c) => c.label));
  for (const label of lb) assert.ok(!la.includes(label), `"${label}" appears in both lives`);
});
