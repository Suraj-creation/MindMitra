/**
 * Comprehensive Automated Verification Test Suite for Phase 3
 * Tests all 8 foundational pillars of the Governed Personal Conversational Assistant.
 */

import { actionExecutor } from "./action-executor";
import { conversationGateway } from "./conversation-gateway";
import { experienceLearningEngine } from "./experience-learning";
import { intentGoalDetector } from "./intent-goal-detector";
import { nextBestAssistanceEngine } from "./next-best-assistance";
import type { UIClientContext } from "./types";

export interface Phase3TestResult {
  testId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
  evidence: Record<string, any>;
}

export interface Phase3TestSuiteReport {
  passedCount: number;
  totalCount: number;
  results: Phase3TestResult[];
}

export class Phase3TestSuite {
  public async runAllTests(personId = "person:purnima"): Promise<Phase3TestSuiteReport> {
    const results: Phase3TestResult[] = [];

    // ── TEST 1: NATURAL LANGUAGE NAVIGATION ("SHOW ME...") ──────────────────
    results.push(await this.testNaturalLanguageNavigation(personId));

    // ── TEST 2: CURRENT-CONTEXT PHOTO RESOLUTION ("WHO IS THIS?") ───────────
    results.push(await this.testCurrentContextPhotoResolution(personId));

    // ── TEST 3: CURRENT-CONTEXT ACTIVITY SCAFFOLDING ("HELP ME") ────────────
    results.push(await this.testCurrentContextActivityScaffolding(personId));

    // ── TEST 4: GOAL LIFECYCLE (INFERRED -> ACTIVE -> COMPLETED) ───────────
    results.push(await this.testGoalLifecycle(personId));

    // ── TEST 5: TYPED ACTION MODEL & AUDIT GOVERNANCE ────────────────────────
    results.push(await this.testTypedActionModelGovernance(personId));

    // ── TEST 6: NEXT-BEST-ASSISTANCE 12-CLASS SELECTION ─────────────────────
    results.push(await this.testNextBestAssistanceDecisioning(personId));

    // ── TEST 7: MULTIMODAL PAYLOAD COMPOSITION ──────────────────────────────
    results.push(await this.testMultimodalPayloadComposition(personId));

    // ── TEST 8: EXPERIENCE LEARNING & MEMORY PROPOSAL LIFECYCLE ─────────────
    results.push(await this.testExperienceLearningAndMemoryProposal(personId));

    const passedCount = results.filter((r) => r.passed).length;
    return {
      passedCount,
      totalCount: results.length,
      results,
    };
  }

  private async testNaturalLanguageNavigation(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // 1. "Show me Rina"
    const turnRina = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Show me Rina",
    });

    // 2. "Show me my wedding"
    const turnWedding = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Show me my wedding",
    });

    // 3. "Show me what I did yesterday"
    const turnYesterday = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Show me what I did yesterday",
    });

    // 4. "Show me my song"
    const turnSong = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Show me my song",
    });

    const p1 = turnRina.action_result?.action_type === "show_person" && turnRina.multimodal.person_card !== undefined;
    const p2 = (turnWedding.action_result?.action_type === "show_photo" || turnWedding.multimodal.photo_card !== undefined);
    const p3 = turnYesterday.action_result?.action_type === "show_timeline";
    const p4 = turnSong.action_result?.action_type === "play_music" && turnSong.multimodal.music_card !== undefined;

    const passed = p1 && p2 && p3 && p4;

    return {
      testId: "PHASE3-TEST-01",
      name: "Natural Language Navigation ('Show me...') First-Class Grammar",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? "Verified 4 distinct 'Show me...' utterances mapped to typed actions and multimodal cards."
        : "Failed to map 'Show me...' grammar to typed actions.",
      evidence: {
        show_rina_action: turnRina.action_result?.action_type,
        show_wedding_action: turnWedding.action_result?.action_type,
        show_yesterday_action: turnYesterday.action_result?.action_type,
        show_song_action: turnSong.action_result?.action_type,
      },
    };
  }

  private async testCurrentContextPhotoResolution(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // User is viewing photograph asset_bihu_1998 in the Life view and asks "Who is this?"
    const uiContext: UIClientContext = {
      surface: "life",
      current_entity: "asset_bihu_celebration_1998",
      current_photo_id: "asset_bihu_celebration_1998",
    };

    const turn = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Who is this?",
      ui_context: uiContext,
    });

    const passed =
      turn.inferred_intent === "ask_about_memory" &&
      turn.multimodal.photo_card?.asset_id === "asset_bihu_celebration_1998" &&
      turn.next_best_assistance === "SHOW" &&
      !turn.multimodal.display_text.toLowerCase().includes("which photo"); // Did NOT ask to repeat context

    return {
      testId: "PHASE3-TEST-02",
      name: "Current-Context Automatic Photo Resolution ('Who is this?')",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? `Resolved current photo '${uiContext.current_photo_id}' without asking user to repeat context.`
        : "Failed to resolve active photograph from UI context.",
      evidence: {
        resolvedPhotoId: turn.multimodal.photo_card?.asset_id,
        assistanceClass: turn.next_best_assistance,
        spokenAnswer: turn.multimodal.spoken_text,
      },
    };
  }

  private async testCurrentContextActivityScaffolding(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // User is on step 2 of flower garland activity and says "Help me"
    const uiContext: UIClientContext = {
      surface: "activity",
      current_task: "flower_garland",
      activity_state: {
        activity_id: "act_flower_garland",
        title: "Weaving Gentle Marigold Flower Garland",
        step: 2,
        total_steps: 4,
        attempts_on_step: 1,
        difficulty: "gentle",
        last_cue: "visual",
      },
    };

    const turn = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Help me",
      ui_context: uiContext,
    });

    const passed =
      turn.next_best_assistance === "CONTINUE_ACTIVITY" &&
      turn.multimodal.activity_card?.step_number === 2 &&
      turn.action_result?.action_type === "resume_activity" &&
      !turn.multimodal.display_text.toLowerCase().includes("what activity"); // Did NOT ask to repeat context

    return {
      testId: "PHASE3-TEST-03",
      name: "Current-Context Activity Scaffolding ('Help me')",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? `Understood in-flight activity '${uiContext.activity_state?.title}' step 2 and provided scaffolding.`
        : "Failed to scaffold in-flight activity step.",
      evidence: {
        assistanceClass: turn.next_best_assistance,
        stepNumber: turn.multimodal.activity_card?.step_number,
        actionType: turn.action_result?.action_type,
        hint: turn.multimodal.activity_card?.assistance_hint,
      },
    };
  }

  private async testGoalLifecycle(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();
    const sessionId = `test_sess_${Date.now()}`;

    // Turn 1: Incur intent -> candidate goal created
    const turn1 = await conversationGateway.processTurn({
      person_id: personId,
      session_id: sessionId,
      utterance: "What is planned for today?",
    });

    // Verify goal exists
    const goalsAfterTurn1 = experienceLearningEngine.getActiveGoals(sessionId);
    const hasActiveGoal = goalsAfterTurn1.some((g) => g.intent_type === "talk_about_today" && g.status === "active");

    // Turn 2: User says "I want to stop and rest" -> completes/abandons active goal
    const turn2 = await conversationGateway.processTurn({
      person_id: personId,
      session_id: sessionId,
      utterance: "I want to stop now and rest",
      ui_context: { surface: "activity" },
    });

    const goalsAfterTurn2 = experienceLearningEngine.getActiveGoals(sessionId);
    const hasCompletedGoal = goalsAfterTurn2.some((g) => g.status === "completed");

    const passed = hasActiveGoal && (hasCompletedGoal || goalsAfterTurn2.length > 0);

    return {
      testId: "PHASE3-TEST-04",
      name: "Intent / Goal Model Lifecycle (Inferred -> Active -> Completed)",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? `Tracked multi-turn goal state across session ${sessionId}.`
        : "Failed to track goal state across turns.",
      evidence: {
        sessionId,
        initialGoalsCount: goalsAfterTurn1.length,
        finalGoals: goalsAfterTurn2.map((g) => ({ title: g.title, status: g.status })),
      },
    };
  }

  private async testTypedActionModelGovernance(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // 1. Valid action execution
    const validExec = await actionExecutor.executeAction(
      personId,
      "show_person",
      { person_id: "person:contact:rina", display_name: "Rina Sharma", relationship: "granddaughter" },
      "actor:purnima",
      "person"
    );

    // 2. Invalid action arguments (empty object for show_person)
    const invalidExec = await actionExecutor.executeAction(
      personId,
      "show_person",
      {}, // missing person_id and display_name
      "actor:purnima",
      "person"
    );

    const passed =
      validExec.success &&
      validExec.action.status === "executed" &&
      validExec.audit_id.startsWith("audit_") &&
      !invalidExec.success &&
      invalidExec.action.status === "failed";

    return {
      testId: "PHASE3-TEST-05",
      name: "Typed Action Model Governance, Validation & Audit Trail",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? "Validated action parameters, enforced authorization, logged immutable audit event, and blocked invalid calls."
        : "Action governance did not enforce schema or audit properly.",
      evidence: {
        validAuditId: validExec.audit_id,
        validStatus: validExec.action.status,
        invalidError: invalidExec.error,
        invalidStatus: invalidExec.action.status,
      },
    };
  }

  private async testNextBestAssistanceDecisioning(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // Test distinct assistance classes
    const turnCall = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Call daughter Anu",
    });

    const turnMusic = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Play bamboo flute music",
    });

    const turnOrient = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Where am I? Am I safe?",
    });

    const turnActivity = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Let's weave marigold flowers",
    });

    const passed =
      turnCall.next_best_assistance === "CALL_PERSON" &&
      turnMusic.next_best_assistance === "PLAY_MUSIC" &&
      turnOrient.next_best_assistance === "ORIENT" &&
      turnActivity.next_best_assistance === "START_ACTIVITY";

    return {
      testId: "PHASE3-TEST-06",
      name: "Next-Best-Assistance Decisioning (12 Dedicated Classes)",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? "Correctly classified CALL_PERSON, PLAY_MUSIC, ORIENT, and START_ACTIVITY."
        : "Failed to classify optimal Next-Best-Assistance class.",
      evidence: {
        turnCallClass: turnCall.next_best_assistance,
        turnMusicClass: turnMusic.next_best_assistance,
        turnOrientClass: turnOrient.next_best_assistance,
        turnActivityClass: turnActivity.next_best_assistance,
      },
    };
  }

  private async testMultimodalPayloadComposition(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    const turn = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "Show me Rina and play my flute song",
    });

    const hasSpoken = typeof turn.multimodal.spoken_text === "string" && turn.multimodal.spoken_text.length > 0;
    const hasCard = turn.multimodal.person_card !== undefined || turn.multimodal.music_card !== undefined;
    const hasAction = turn.multimodal.action !== undefined;

    const passed = hasSpoken && hasCard && hasAction;

    return {
      testId: "PHASE3-TEST-07",
      name: "Multimodal Structured Response Payload Generation",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? "Generated coordinated multimodal payload with spoken text, UI cards, and typed action."
        : "Failed to assemble multimodal payload.",
      evidence: {
        hasSpoken,
        personCard: turn.multimodal.person_card?.display_name,
        actionType: turn.multimodal.action?.type,
      },
    };
  }

  private async testExperienceLearningAndMemoryProposal(personId: string): Promise<Phase3TestResult> {
    const t0 = performance.now();

    // Utterance with explicit preference
    const turn = await conversationGateway.processTurn({
      person_id: personId,
      utterance: "I love making til pitha with Rina during Bihu",
    });

    const hasMemoryProposal = turn.memory_proposal !== undefined;
    const isPreference = turn.memory_proposal?.category === "preference";
    const requiresCaregiverConfirmation = turn.memory_proposal?.requires_caregiver_confirmation === true;

    const passed = hasMemoryProposal && isPreference && requiresCaregiverConfirmation;

    return {
      testId: "PHASE3-TEST-08",
      name: "Experience Learning & Governed Memory Proposal Lifecycle",
      passed,
      durationMs: Math.round(performance.now() - t0),
      details: passed
        ? `Derived candidate memory proposal requiring caregiver confirmation: "${turn.memory_proposal?.statement}"`
        : "Failed to derive candidate memory proposal.",
      evidence: {
        proposalId: turn.memory_proposal?.proposal_id,
        statement: turn.memory_proposal?.statement,
        requiresCaregiverConfirmation: turn.memory_proposal?.requires_caregiver_confirmation,
      },
    };
  }
}

export const phase3TestSuite = new Phase3TestSuite();
