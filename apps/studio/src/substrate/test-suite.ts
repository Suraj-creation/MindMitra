/**
 * MindMitra Personal Intelligence Substrate — Automated Verification Test Suite
 *
 * Verifies all 6 core substrate architectural contracts:
 * 1. Complete Lifecycle Pipeline (interaction -> experience -> observation -> capability -> policy)
 * 2. Model-Generated Safety Invariant (blocked from silent authoritative promotion)
 * 3. Measurement Quality Gating (noisy signals rejected from model update)
 * 4. Learned Assistance Policy Reinforcement (adaptive strategy reinforced on success)
 * 5. Media Intelligence Layer (Backblaze B2 metadata & consent scoping)
 * 6. Memory Firewall & Consent Enforcement (deterministic access matrix)
 */

import { SubstrateRepository } from "./repository";
import { PersonalIntelligenceService } from "./service";
import { seedSubstrateData } from "./seed";

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
}

export interface SubstrateTestSuiteReport {
  timestamp: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  all_passed: boolean;
  results: TestResultItem[];
}

export async function runSubstrateTestSuite(): Promise<SubstrateTestSuiteReport> {
  const testRepo = new SubstrateRepository();
  await seedSubstrateData(testRepo);
  const testService = new PersonalIntelligenceService(testRepo);
  const personId = "person:purnima";

  const results: TestResultItem[] = [];

  // ── TEST 1: Complete Lifecycle Pipeline Execution ─────────────────────────
  try {
    const pipelineResponse = await testService.processInteraction({
      person_id: personId,
      session_id: "sess_test_01",
      surface: "activity",
      route: "/activities/family_recall",
      component: "PhotoCardRecall",
      event_type: "completion",
      input_modality: "touch",
      language: "as",
      duration_ms: 1800,
      latency_ms: 650,
      result: "success",
      assistance_level: "visual_cue",
      signals: {
        audibility: 0.95,
        visibility: 0.95,
        fatigue_factor: 0.9,
        was_assisted: false,
        device_ok: true,
        subject_confirmed: true,
        language_match: true,
      },
      metadata: {
        activity_id: "activity:family_recall",
        activity_name: "Family Memory Match",
        cognitive_objective: "family_person_recognition",
        time_of_day: "morning",
        environment: "familiar_courtyard",
      },
    });

    const passed =
      pipelineResponse.report.passed_measurement_gate === true &&
      pipelineResponse.report.persisted_to_model === true &&
      pipelineResponse.report.steps.length === 7 &&
      pipelineResponse.capabilityState !== undefined;

    results.push({
      id: "TEST-01",
      name: "Complete Lifecycle Pipeline Execution",
      category: "Lifecycle & Adaptation",
      passed,
      expected: "7 steps passed, measurement gate certified, PCM and assistance policy updated",
      actual: `Passed gate: ${pipelineResponse.report.passed_measurement_gate}, Steps: ${pipelineResponse.report.steps.length}, Persisted: ${pipelineResponse.report.persisted_to_model}`,
      details: { steps: pipelineResponse.report.steps.map((s) => s.step_name) },
    });
  } catch (err: any) {
    results.push({
      id: "TEST-01",
      name: "Complete Lifecycle Pipeline Execution",
      category: "Lifecycle & Adaptation",
      passed: false,
      expected: "Pipeline succeeds without error",
      actual: `Threw error: ${err.message}`,
    });
  }

  // ── TEST 2: Model-Generated Safety Invariant Enforcement ──────────────────
  try {
    // Attempt to silently create an authoritative fact from a model without human verification
    const { memory, auditResult } = await testService.createGovernedMemory(
      personId,
      "Purnima took an extra spoonful of sugar in her tea.",
      "preference",
      "system/authoritative", // Claiming authoritative!
      "model generated", // Originating from model!
      "model:gemini_flash",
      undefined // No human verifier!
    );

    // Guard MUST intercept: memory must NOT become system/authoritative; must be candidate/inferred
    const invariantHeld =
      auditResult.is_guard_violation === true &&
      memory.authority_class === "model generated" &&
      memory.lifecycle_state === "candidate" &&
      memory.evidence_level === "inferred";

    results.push({
      id: "TEST-02",
      name: "Model-Generated Safety Invariant (Forbidden Silent Authoritative Promotion)",
      category: "Safety & Provenance",
      passed: invariantHeld,
      expected: "Model-generated statement blocked from authoritative status; demoted to candidate/inferred",
      actual: `Authority: '${memory.authority_class}', State: '${memory.lifecycle_state}', Guard Violation: ${auditResult.is_guard_violation}`,
      details: { audit_reason: auditResult.audit_reason },
    });
  } catch (err: any) {
    results.push({
      id: "TEST-02",
      name: "Model-Generated Safety Invariant",
      category: "Safety & Provenance",
      passed: false,
      expected: "Handled gracefully",
      actual: `Threw error: ${err.message}`,
    });
  }

  // ── TEST 3: Measurement Quality Gating (Noisy Signal Rejection) ───────────
  try {
    // Simulate noisy environment with device mismatch and low audibility
    const noisyPipeline = await testService.processInteraction({
      person_id: personId,
      session_id: "sess_noisy_01",
      surface: "activity",
      route: "/activities/speech_repeat",
      component: "AudioRecorder",
      event_type: "abandonment",
      input_modality: "voice",
      language: "en", // Language mismatch for Assamese native speaker!
      result: "failed",
      signals: {
        audibility: 0.15, // Heavy background noise
        visibility: 0.3,
        fatigue_factor: 0.2, // High fatigue
        was_assisted: true,
        device_ok: false, // Mic clipping
        subject_confirmed: false,
        language_match: false,
      },
    });

    // Measurement gate MUST trigger and prevent mutation of stable capability state
    const gateHeld =
      noisyPipeline.report.passed_measurement_gate === false &&
      noisyPipeline.report.persisted_to_model === false &&
      noisyPipeline.report.steps.find((s) => s.step_number === 6)?.status === "GATED";

    results.push({
      id: "TEST-03",
      name: "Measurement Quality Certification Gating (Noise Immunity)",
      category: "Measurement Integrity",
      passed: gateHeld,
      expected: "Gate status 'insufficient_data'; update to persistent capability state withheld",
      actual: `Passed gate: ${noisyPipeline.report.passed_measurement_gate}, Step 6 status: ${noisyPipeline.report.steps[5]?.status}, Persisted: ${noisyPipeline.report.persisted_to_model}`,
      details: { dominant_issue: noisyPipeline.report.steps[2]?.data?.dominant_issue },
    });
  } catch (err: any) {
    results.push({
      id: "TEST-03",
      name: "Measurement Quality Gating",
      category: "Measurement Integrity",
      passed: false,
      expected: "Gating succeeds",
      actual: `Threw error: ${err.message}`,
    });
  }

  // ── TEST 4: Learned Assistance Strategy Reinforcement ──────────────────────
  try {
    const policyBefore = await testRepo.getAssistancePolicy(personId, "familiar_person_recall");
    const evidenceBefore = policyBefore?.evidence_count || 0;

    // Successful high-quality episode using visual cue
    await testService.processInteraction({
      person_id: personId,
      session_id: "sess_reinforce_01",
      surface: "activity",
      route: "/activities/family_recall",
      component: "PhotoCueCard",
      event_type: "completion",
      input_modality: "touch",
      language: "as",
      result: "success",
      assistance_level: "visual_cue",
      signals: {
        audibility: 0.9,
        visibility: 0.95,
        fatigue_factor: 0.85,
        device_ok: true,
        subject_confirmed: true,
        language_match: true,
      },
      metadata: {
        activity_id: "activity:family_recall",
        successful_cue: "visual_photo_cue",
      },
    });

    const policyAfter = await testRepo.getAssistancePolicy(personId, "familiar_person_recall");
    const evidenceAfter = policyAfter?.evidence_count || 0;

    const reinforced =
      evidenceAfter === evidenceBefore + 1 &&
      policyAfter?.preferred_strategy === "visual_recognition_first" &&
      (policyAfter?.confidence || 0) >= (policyBefore?.confidence || 0);

    results.push({
      id: "TEST-04",
      name: "Learned Assistance Strategy Reinforcement",
      category: "Personal Intelligence",
      passed: reinforced,
      expected: `Evidence count increases from ${evidenceBefore} to ${evidenceBefore + 1}, policy confidence reinforced`,
      actual: `Evidence before: ${evidenceBefore}, after: ${evidenceAfter}, Preferred: '${policyAfter?.preferred_strategy}', Confidence: ${policyAfter?.confidence}`,
    });
  } catch (err: any) {
    results.push({
      id: "TEST-04",
      name: "Learned Assistance Strategy Reinforcement",
      category: "Personal Intelligence",
      passed: false,
      expected: "Reinforcement succeeds",
      actual: `Threw error: ${err.message}`,
    });
  }

  // ── TEST 5: Backblaze B2 Media Intelligence Retrieval ─────────────────────
  try {
    // Query media assets depicting Anu with authorized primary caregiver
    const mediaResult = await testService.getMediaAssets(personId, "actor:anu", "contact_anu");
    const passed =
      mediaResult.allowed === true &&
      mediaResult.assets.length > 0 &&
      mediaResult.assets[0].b2_bucket === "mindmitra-b2-vault" &&
      mediaResult.assets[0].b2_object_key.includes("vault/person_purnima");

    results.push({
      id: "TEST-05",
      name: "Backblaze B2 Media Intelligence Resolution",
      category: "Media & Object Substrate",
      passed,
      expected: "Media resolved with B2 bucket, object key, semantic description, and depicted contact",
      actual: `Allowed: ${mediaResult.allowed}, Assets count: ${mediaResult.assets.length}, Sample B2 Key: '${mediaResult.assets[0]?.b2_object_key}'`,
    });
  } catch (err: any) {
    results.push({
      id: "TEST-05",
      name: "Backblaze B2 Media Intelligence",
      category: "Media & Object Substrate",
      passed: false,
      expected: "Media retrieval succeeds",
      actual: `Threw error: ${err.message}`,
    });
  }

  // ── TEST 6: Memory Firewall & Purpose-Based Consent Enforcement ───────────
  try {
    // 1. Anu with personalisation consent -> ALLOW
    const anuCheck = await testRepo.checkConsent(personId, "actor:anu", "life_story_memory", "personalisation");
    // 2. Stranger -> DENY
    const strangerCheck = await testRepo.checkConsent(personId, "actor:unauthorized_stranger", "life_story_memory", "personalisation");
    // 3. Research purpose -> STRICT DENY
    const researchCheck = await testRepo.checkConsent(personId, "actor:anu", "life_story_memory", "research");

    const passed =
      anuCheck.allowed === true &&
      strangerCheck.allowed === false &&
      researchCheck.allowed === false;

    results.push({
      id: "TEST-06",
      name: "Memory Firewall & Consent Purpose Matrix",
      category: "Governance & Access Control",
      passed,
      expected: "Anu (personalisation) ALLOW, Stranger DENY, Research STRICT DENY",
      actual: `Anu: ${anuCheck.allowed}, Stranger: ${strangerCheck.allowed}, Research: ${researchCheck.allowed}`,
    });
  } catch (err: any) {
    results.push({
      id: "TEST-06",
      name: "Memory Firewall & Consent",
      category: "Governance & Access Control",
      passed: false,
      expected: "Firewall checks succeed",
      actual: `Threw error: ${err.message}`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    total_tests: results.length,
    passed_tests: passedCount,
    failed_tests: failedCount,
    all_passed: failedCount === 0,
    results,
  };
}
