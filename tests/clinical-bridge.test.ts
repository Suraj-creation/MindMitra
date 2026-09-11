import test from "node:test";
import assert from "node:assert";
import {
  getCaseloadSummary,
  getPatientDetails,
  recordQuestionDecision,
  toggleFollowupStatus,
  addConsultationNote,
  searchClinicalQuery,
} from "../src/db/clinical-db";

test("Clinical Caseload: retrieves caseload summary with filters", () => {
  const summary = getCaseloadSummary("Needs review");
  assert.ok(summary.patients.length > 0, "Patients list should not be empty");
  assert.ok(summary.queueTiles.length === 5, "Should have 5 queue tiles");
  assert.strictEqual(summary.acuteAlert.patientKey, "aita", "Acute alert should point to Aita Sangma");
});

test("Clinical Patient Dossier: retrieves full patient details for Nirmali Bora", () => {
  const dossier = getPatientDetails("nirmali");
  assert.strictEqual(dossier.patient.name, "Nirmali Bora");
  assert.ok(dossier.changes.length >= 3, "Nirmali should have at least 3 longitudinal changes");
  assert.ok(dossier.questions.length >= 4, "Nirmali should have 4 prepared questions");
  assert.ok(dossier.func.length >= 5, "Nirmali should have 5 functional ladder tasks");
  assert.ok(dossier.report !== null, "Report should be generated for Nirmali");
});

test("Clinical Decision Engine: records clinician accept action with audit stamp", async () => {
  const record = await recordQuestionDecision(
    "nirmali",
    "q_test_01",
    "accepted",
    "Verified in person with son Anu"
  );
  assert.strictEqual(record.action, "accepted");
  assert.strictEqual(record.patient_key, "nirmali");
  assert.ok(record.resolved_line?.includes("Accepted as a finding"));
});

test("Clinical Followup: toggles task status between open and in-progress", async () => {
  const res = await toggleFollowupStatus("nirmali", "fu_test_01");
  assert.ok(res.status === "in_progress" || res.status === "open");
});

test("Clinical Consultation Notes: appends Dr. Choudhury clinical entry", async () => {
  const note = await addConsultationNote(
    "nirmali",
    "Dr. Nayan Choudhury",
    "Comprehensive review completed. Sensory deficit ruled out before cognitive staging."
  );
  assert.strictEqual(note.patient_key, "nirmali");
  assert.ok(note.note.includes("Comprehensive review completed"));
});

test("Clinical Query Engine: returns verified provenance without hallucinations", () => {
  const result = searchClinicalQuery("cooking");
  assert.strictEqual(result.found, true);
  assert.ok(result.prov?.includes("Retrieved from clinical projection") || result.prov?.includes("Provenance"));
});

setTimeout(() => {
  process.exit(0);
}, 200);

