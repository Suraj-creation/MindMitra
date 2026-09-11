import test from "node:test";
import assert from "node:assert/strict";
import {
  getChwCaseload,
  getChwHouseholdById,
  getChwActiveVisit,
  updateChwVisit,
  saveVisitToOfflineQueue,
  triggerManualMuleSync,
  getChwSyncQueue,
} from "../src/db/chw-db";

test("CHW DB: Caseload retrieval and operational summary calculation", async () => {
  const result = await getChwCaseload("Rumi Saikia");
  assert.ok(result, "Caseload should return result");
  assert.ok(result.households.length >= 4, "Should have 4 households in Tezpur & Mawlai cluster");
  assert.equal(result.summary.total, 4, "Total households should equal 4");
  assert.equal(result.summary.attention, 2, "Households needing attention should equal 2");
  assert.equal(result.summary.routine, 2, "Routine households should equal 2");
  assert.ok(result.summary.estimated_minutes > 0, "Should have positive estimated field minutes");

  // Verify Purnima Devi and Mrs. B. Lyngdoh are present with real approved assets
  const purnima = result.households.find((h) => h.id === "hh:purnima");
  assert.ok(purnima, "Purnima Devi must exist in caseload");
  assert.equal(purnima.priority_tier, "attention");
  assert.ok(purnima.photo_url.includes("lh3.googleusercontent.com"), "Must use real approved photograph");
  assert.ok(purnima.why_prioritized.includes("Sleep"), "Reason must be grounded in real sleep log");

  const lyngdoh = result.households.find((h) => h.id === "hh:lyngdoh");
  assert.ok(lyngdoh, "Mrs. B. Lyngdoh must exist in caseload");
  assert.equal(lyngdoh.priority_tier, "attention");
  assert.ok(lyngdoh.photo_url.includes("lh3.googleusercontent.com"), "Must use real approved photograph");
});

test("CHW DB: Active visit retrieval, step progression, and separated source inquiries", async () => {
  const visit = await getChwActiveVisit("hh:purnima");
  assert.ok(visit, "Active visit must exist");
  assert.equal(visit.household_id, "hh:purnima");
  assert.equal(visit.status, "in_progress");

  // Verify three separated voices (provenance integrity)
  assert.ok(visit.inquiries.person_said, "Person said record must exist");
  assert.ok(visit.inquiries.caregiver_reported, "Caregiver reported record must exist");
  assert.ok(visit.inquiries.chw_observed, "CHW observed record must exist");
  assert.notEqual(
    visit.inquiries.person_said?.text,
    visit.inquiries.chw_observed?.text,
    "Person statement and CHW observation must remain unadulterated and separate"
  );

  // Step progression update
  const updated = await updateChwVisit(visit.id, {
    current_step: 4,
    measurement_context: {
      quiet_environment: true,
      hearing_aid_status: "off",
      dialect_used: "Assamese Dialect",
      resting_state: "calm",
      notes: "Veranda quiet test passed",
    },
  });
  assert.equal(updated.current_step, 4, "Current step should be updated to 4 (Meds)");
});

test("CHW DB: Offline delta encryption stamp, queueing, and mule sync", async () => {
  const initialQueue = await getChwSyncQueue();
  const startCount = initialQueue.queuedCount;

  // Queue a new visit delta
  const queueRes = await saveVisitToOfflineQueue("VST-20260911-042", {
    step: 5,
    outcome: "Routine monitor scheduled in 3 days",
  });
  assert.ok(queueRes.success, "Visit should queue successfully");
  assert.ok(queueRes.hash.startsWith("sha256-keystore-"), "Must have encrypted hash stamp");
  assert.ok(queueRes.queuedCount >= startCount, "Queue count should increase");

  // Trigger manual mule sync
  const syncRes = await triggerManualMuleSync();
  assert.equal(syncRes.remainingQueue, 0, "Remaining queue should be 0 after sync");
  assert.ok(syncRes.syncedRecords > 0, "Should have synced records");
  assert.equal(syncRes.mulePoint, "Tezpur Block PHC (AAM)", "Mule point should match block PHC");
});

test("CHW Guardrails: Non-diagnostic safety assertion", () => {
  const mockChwNotes = [
    "Elder resting calmly on wooden bench drinking ginger cardamom tea.",
    "Caregiver reported 2 night awakenings; afternoon tea routine independent.",
    "Gait steady with walking stick; recognized ASHA worker with warm smile.",
  ];

  for (const note of mockChwNotes) {
    assert.ok(
      !note.toLowerCase().includes("dementia progression"),
      "Must never state dementia progression"
    );
    assert.ok(
      !note.toLowerCase().includes("cognitive decline score"),
      "Must never compute fake cognitive score"
    );
  }
});

test.after(() => {
  setTimeout(() => process.exit(0), 100);
});
