import test from "node:test";
import assert from "node:assert/strict";
import {
  getCareSupportLevel,
  updateCareSupportLevel,
  getCareTasks,
  toggleCareTaskStatus,
  postponeCareTask,
  addCareObservation,
  getCareObservations,
} from "../src/db/caregiver-db";

test("Caregiver DB: Support level default retrieval and update", async () => {
  const current = await getCareSupportLevel("person:purnima");
  assert.ok(current, "Support level should exist");
  assert.equal(typeof current.support_level, "number");

  const updated = await updateCareSupportLevel(
    2,
    "Benefits from structured morning routine and afternoon tea companionship",
    "Anu (Daughter)",
    "person:purnima"
  );
  assert.equal(updated.support_level, 2);
  assert.ok(updated.reason.includes("morning routine"));
});

test("Caregiver DB: Task status toggling and postponement", async () => {
  const tasks = await getCareTasks("person:purnima");
  assert.ok(tasks.length >= 3, "Should have default care tasks");

  const firstTaskId = tasks[0].id;
  const initialStatus = tasks[0].status;

  const toggled = await toggleCareTaskStatus(firstTaskId);
  assert.ok(toggled, "Toggled task should be returned");
  const firstToggledStatus = toggled.status;
  assert.notEqual(firstToggledStatus, initialStatus, "Status should flip");

  // Re-toggle back to verify it toggles
  const restored = await toggleCareTaskStatus(firstTaskId);
  assert.notEqual(restored?.status, firstToggledStatus, "Should toggle back");

  // Postpone test
  const postponed = await postponeCareTask(firstTaskId, 30);
  assert.ok(postponed?.due_date_label.includes("+30m"));
  assert.equal(postponed?.status, "postponed");
});

test("Caregiver DB: Adding and retrieving caregiver observations", async () => {
  const note = "Aitâ smiled listening to the Borxongit flute while having cardamom tea.";
  const added = await addCareObservation(
    "routine",
    note,
    "Anu (Daughter)",
    ["tea", "music"],
    "person:purnima"
  );

  assert.ok(added.id);
  assert.equal(added.note, note);
  assert.deepEqual(added.tags, ["tea", "music"]);

  const allObs = await getCareObservations("person:purnima");
  const found = allObs.find((o) => o.id === added.id);
  assert.ok(found, "Newly added observation must be retrievable");
});

test("Caregiver Decision Triad: Non-diagnostic safety guardrail check", () => {
  const nonDiagnosticObservation = {
    observation: "Tablet interaction latency rose by 0.3s; 2 brief sleep wakings logged.",
    practical_reason: "Heavy continuous monsoon rain confined courtyard strolls.",
    what_this_does_not_mean: "This is not sudden neurological decline or medical illness.",
  };

  assert.ok(
    !nonDiagnosticObservation.practical_reason.includes("dementia progression"),
    "Must not cite dementia progression as direct causation"
  );
  assert.ok(
    nonDiagnosticObservation.what_this_does_not_mean.includes("not sudden neurological decline"),
    "Must explicitly clarify that fluctuation does not imply neurological deterioration"
  );
});

test.after(() => {
  setTimeout(() => process.exit(0), 100);
});

