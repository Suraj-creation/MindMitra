import test, { describe, after } from "node:test";
import assert from "node:assert/strict";
import { queryDb } from "../src/db/neon";
import * as repo from "../src/db/person-data-repository";

// These tests exercise the real Neon-backed repository (no mocks) using
// dedicated test-only person_ids so they never collide with the seeded
// personas (person:purnima, person:nekombo). Every row created here is
// cleaned up in `after`, so re-running the suite never accumulates state.

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED);

describe("Person Data Repository (Neon)", { skip: !hasDb ? "Neon Database is not configured (requires DATABASE_URL)" : false }, () => {
const PERSON_A = "person:test_isolation_a";
const PERSON_B = "person:test_isolation_b";

after(async () => {
  for (const personId of [PERSON_A, PERSON_B]) {
    await queryDb("DELETE FROM memory_media WHERE memory_id IN (SELECT id FROM memory_items WHERE person_id = $1)", [personId]);
    await queryDb("DELETE FROM memory_items WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM media_assets WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM future_events WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM preferences WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM consent_grants WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM memory_firewall_audit_log WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM relationships WHERE person_id = $1", [personId]);
    await queryDb("DELETE FROM person_entities WHERE person_id = $1", [personId]);
  }
});

test("Cross-person isolation: memories created for one person never appear in another person's list", async () => {
  const memA = await repo.createMemory({
    person_id: PERSON_A,
    memory_type: "autobiographical",
    title: "Isolation Test Memory A",
    description: "Should only ever be visible to person A.",
    temporal_frame: "recent",
    approximate_period: "2026",
    source: "person",
    verification_status: "unverified",
    confidence: 0.7,
    sensitivity: "low",
    consent_scope: "person_only",
    visibility_scope: "private",
    cultural_context: "test",
    created_by: "actor:test_a",
  });

  const memB = await repo.createMemory({
    person_id: PERSON_B,
    memory_type: "autobiographical",
    title: "Isolation Test Memory B",
    description: "Should only ever be visible to person B.",
    temporal_frame: "recent",
    approximate_period: "2026",
    source: "person",
    verification_status: "unverified",
    confidence: 0.7,
    sensitivity: "low",
    consent_scope: "person_only",
    visibility_scope: "private",
    cultural_context: "test",
    created_by: "actor:test_b",
  });

  const listA = await repo.listMemories(PERSON_A);
  const listB = await repo.listMemories(PERSON_B);

  assert.ok(listA.some((m) => m.id === memA.id), "person A must see their own memory");
  assert.ok(!listA.some((m) => m.id === memB.id), "person A must NOT see person B's memory");
  assert.ok(listB.some((m) => m.id === memB.id), "person B must see their own memory");
  assert.ok(!listB.some((m) => m.id === memA.id), "person B must NOT see person A's memory");

  // Also verify against the real seeded personas -- no cross-contamination either direction.
  const purnimaMemories = await repo.listMemories("person:purnima");
  const nekomboMemories = await repo.listMemories("person:nekombo");
  assert.ok(!purnimaMemories.some((m) => m.id === memA.id || m.id === memB.id));
  assert.ok(!nekomboMemories.some((m) => m.id === memA.id || m.id === memB.id));
  assert.ok(
    purnimaMemories.every((m) => !nekomboMemories.some((n) => n.id === m.id)),
    "the two seeded personas must never share a memory id"
  );
});

test("Cross-person isolation: familiar people are scoped to the requesting person", async () => {
  const purnimaPeople = await repo.listFamiliarPeople("person:purnima");
  const nekomboPeople = await repo.listFamiliarPeople("person:nekombo");

  assert.ok(purnimaPeople.some((p) => p.name === "Rina"), "Purnima's circle includes Rina");
  assert.ok(!nekomboPeople.some((p) => p.name === "Rina"), "Nekombo's circle must not include Purnima's granddaughter");
  assert.ok(nekomboPeople.some((p) => p.name === "Temjen"), "Nekombo's circle includes Temjen");
  assert.ok(!purnimaPeople.some((p) => p.name === "Temjen"), "Purnima's circle must not include Nekombo's son");
});

test("Consent: a purpose-scoped grant is active until explicitly revoked", async () => {
  await repo.grantConsent({
    person_id: PERSON_A,
    purpose: "media",
    category: "family_photos",
    granted_to_role: "primary_caregiver",
    granted_by: "test harness",
  });

  const activeAfterGrant = await repo.hasActiveConsent(PERSON_A, "media", "family_photos");
  assert.equal(activeAfterGrant, true);

  // A grant for a DIFFERENT purpose/category must not be considered active --
  // presence of *some* consent row is not itself authorization.
  const unrelatedPurpose = await repo.hasActiveConsent(PERSON_A, "clinical_sharing", "family_photos");
  assert.equal(unrelatedPurpose, false);

  await repo.revokeConsent(PERSON_A, "media", "family_photos");
  const activeAfterRevoke = await repo.hasActiveConsent(PERSON_A, "media", "family_photos");
  assert.equal(activeAfterRevoke, false);
});

test("Temporal validity: cancelled and expired future events are never returned as current", async () => {
  const confirmed = await repo.createFutureEvent({
    person_id: PERSON_A,
    event_type: "family_visit",
    title: "Confirmed upcoming visit",
    location_name: "Test Home",
    scheduled_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    source: "caregiver",
  });

  // Directly insert a cancelled event and an expired-validity event (repo.createFutureEvent
  // always creates 'confirmed' status, matching the real POST /v1/future-events contract --
  // cancellation/expiry happen via later updates, simulated here at the SQL layer).
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source)
     VALUES ('test_cancelled_event', $1, 'family_visit', 'Cancelled visit', 'Test Home', NOW() + INTERVAL '2 hours', 'cancelled', 'caregiver')`,
    [PERSON_A]
  );
  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, location_name, scheduled_at, status, source, valid_until)
     VALUES ('test_expired_event', $1, 'family_visit', 'Stale expired visit', 'Test Home', NOW() - INTERVAL '1 day', 'confirmed', 'caregiver', NOW() - INTERVAL '1 hour')`,
    [PERSON_A]
  );

  const upcoming = await repo.listUpcomingEvents(PERSON_A);
  assert.ok(upcoming.some((e) => e.id === confirmed.id), "the confirmed, non-expired event must appear");
  assert.ok(!upcoming.some((e) => e.id === "test_cancelled_event"), "a cancelled event must never be treated as current");
  assert.ok(!upcoming.some((e) => e.id === "test_expired_event"), "an expired event must never be treated as current");
});

test("Preferences are append-only: a new observation supersedes the old one instead of overwriting it", async () => {
  const first = await repo.recordPreference({
    person_id: PERSON_A,
    dimension: "modality",
    value: { preferred: "photo_plus_voice" },
    evidence_source: "system_inferred",
    confidence: 0.5,
  });

  let active = await repo.getActivePreferences(PERSON_A);
  assert.equal(active.length, 1);
  assert.deepEqual(active[0].value, { preferred: "photo_plus_voice" });

  const second = await repo.recordPreference({
    person_id: PERSON_A,
    dimension: "modality",
    value: { preferred: "audio_only" },
    evidence_source: "person_stated",
    confidence: 0.95,
  });

  active = await repo.getActivePreferences(PERSON_A);
  assert.equal(active.length, 1, "only one ACTIVE preference per dimension, but the old one is superseded, not deleted");
  assert.deepEqual(active[0].value, { preferred: "audio_only" });
  assert.equal(active[0].evidence_source, "person_stated");

  const priorRow = await queryDb<{ superseded_by: string | null }>("SELECT superseded_by FROM preferences WHERE id = $1", [first.id]);
  assert.equal(priorRow[0].superseded_by, second.id, "the superseded row must point at what replaced it, not be deleted");
});

test("Memory Firewall audit log: every access attempt is recorded with actor, purpose, and decision", async () => {
  await repo.logFirewallAccess({
    person_id: PERSON_A,
    actor_id: "actor:test_harness",
    actor_role: "person",
    purpose: "memory",
    requested_entity_type: "memory_items",
    decision: "ALLOW",
    policy_reason: "Test harness verifying audit logging.",
    filtered_count: 3,
  });

  const rows = await queryDb<{ decision: string; actor_role: string; purpose: string }>(
    "SELECT decision, actor_role, purpose FROM memory_firewall_audit_log WHERE person_id = $1 ORDER BY timestamp DESC LIMIT 1",
    [PERSON_A]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision, "ALLOW");
  assert.equal(rows[0].actor_role, "person");
  assert.equal(rows[0].purpose, "memory");
});
});
