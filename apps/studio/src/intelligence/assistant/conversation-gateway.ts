/**
 * Conversation Gateway (Phase 3 Master Orchestrator)
 * Connects Intent/Goal Model, Context Engine, Hybrid Retrieval, Grounding Engine,
 * Next-Best-Assistance Decisioning, Typed Action Model, and Experience Learning.
 */

import { contextEngine } from "../context-engine";
import { groundingEngine } from "../grounding";
import { hybridRetriever } from "../retrieval/hybrid-retriever";
import { actionExecutor } from "./action-executor";
import { experienceLearningEngine } from "./experience-learning";
import { intentGoalDetector } from "./intent-goal-detector";
import { nextBestAssistanceEngine } from "./next-best-assistance";
import type {
  AssistantTurnResponse,
  UIClientContext,
} from "./types";

export interface ConversationTurnRequest {
  person_id: string;
  utterance: string;
  session_id?: string;
  actor_id?: string;
  actor_role?: string;
  ui_context?: UIClientContext;
  max_token_budget?: number;
}

export class ConversationGateway {
  /**
   * Primary processing pipeline for an incoming conversational utterance.
   */
  public async processTurn(
    req: ConversationTurnRequest
  ): Promise<AssistantTurnResponse> {
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sessionId = req.session_id || `sess_${Date.now()}`;
    const personId = req.person_id || "person:purnima";
    const actorId = req.actor_id || "actor:purnima";
    const actorRole = req.actor_role || "person";
    const utterance = (req.utterance || "").trim();
    const uiContext = req.ui_context || {};

    // ── STEP 1: SAFETY GATEWAY & CRISIS EVALUATION ─────────────────────────
    const lowerUtterance = utterance.toLowerCase();
    const isCrisis = /\b(suicid|self.harm|want\s+to\s+die|emergency|crisis|severe distress)\b/i.test(lowerUtterance);
    const crisisNumber = isCrisis ? "14416" : undefined;

    // ── STEP 2: INTENT & GOAL DETECTION ─────────────────────────────────────
    const activeGoals = experienceLearningEngine.getActiveGoals(sessionId);
    const intentResult = intentGoalDetector.detect(utterance, uiContext, activeGoals);

    // Update goals if detector flagged an update
    if (intentResult.goal_update) {
      experienceLearningEngine.updateGoal(
        sessionId,
        intentResult.goal_update.action as any,
        intentResult.goal_update.goal
      );
    }
    const currentGoals = experienceLearningEngine.getActiveGoals(sessionId);

    // ── STEP 3: CURRENT CONTEXT RESOLUTION (L0-L9) ──────────────────────────
    const contextPack = await contextEngine.resolveContextPack(
      personId,
      actorId,
      {
        surface: uiContext.surface || "day",
        current_entity: uiContext.current_entity || uiContext.current_photo_id,
        current_task: uiContext.current_task || uiContext.activity_state?.title,
      },
      utterance,
      this.mapIntentToQueryShape(intentResult.intent),
      req.max_token_budget || 800
    );

    // ── STEP 4: RETRIEVAL & EVIDENCE FUSION ──────────────────────────────────
    const evidencePack = await hybridRetriever.retrieveEvidence(
      personId,
      utterance,
      this.mapIntentToQueryShape(intentResult.intent),
      {
        surface: uiContext.surface,
        current_entity: uiContext.current_entity || uiContext.current_photo_id,
        current_task: uiContext.current_task,
      }
    );

    // ── STEP 5: GROUNDING & CONFLICT INVARIANT CHECK ─────────────────────────
    const initialAnswer = this.composeGroundedAnswer(
      utterance,
      intentResult.intent,
      contextPack,
      evidencePack
    );

    const groundingEval = groundingEngine.evaluate(
      initialAnswer,
      utterance,
      evidencePack
    );

    // ── STEP 6: NEXT-BEST-ASSISTANCE DECISION ────────────────────────────────
    const assistanceClass = nextBestAssistanceEngine.decideAssistanceClass({
      personId,
      intentResult,
      uiContext,
      groundedEvidence: evidencePack.items.map((e) => ({
        claim: e.claim_or_statement,
        source: e.retrieval_lane,
        verified: e.verification === "verified",
      })),
      timeContext: {
        timeOfDay: contextPack.authoritative_time.time_of_day,
        formattedTime: contextPack.authoritative_time.formatted_time,
      },
    });

    // ── STEP 7: MULTIMODAL PAYLOAD COMPOSITION ──────────────────────────────
    const { multimodal, actionToExecute } = await nextBestAssistanceEngine.buildMultimodalPayload(
      {
        personId,
        intentResult,
        uiContext,
        groundedEvidence: evidencePack.items.map((e) => ({
          claim: e.claim_or_statement,
          source: e.retrieval_lane,
          verified: e.verification === "verified",
        })),
        timeContext: {
          timeOfDay: contextPack.authoritative_time.time_of_day,
          formattedTime: contextPack.authoritative_time.formatted_time,
        },
      },
      assistanceClass,
      groundingEval.sanitized_answer
    );

    // ── STEP 8: TYPED ACTION EXECUTION & AUDITING ────────────────────────────
    let actionResultData: any = undefined;
    if (actionToExecute) {
      const execResult = await actionExecutor.executeAction(
        personId,
        actionToExecute.type,
        actionToExecute.params,
        actorId,
        actorRole
      );

      multimodal.action = execResult.action;
      actionResultData = {
        executed: execResult.success,
        action_type: actionToExecute.type,
        audit_id: execResult.audit_id,
        details: execResult.action.parameters,
      };
    }

    // ── STEP 9: EXPERIENCE LEARNING & CANDIDATE MEMORY RECORDING ────────────
    const experienceEvidence = await experienceLearningEngine.recordExperienceEvidence({
      personId,
      sessionId,
      turnNumber: 1,
      intent: intentResult.intent,
      action: multimodal.action,
      uiContext,
      groundedEvidence: evidencePack.items.map((i) => i.claim_or_statement),
      userResponseOutcome: "success",
    });

    const memoryProposal = experienceLearningEngine.evaluateCandidateMemory(
      utterance,
      personId,
      turnId
    );

    return {
      turn_id: turnId,
      session_id: sessionId,
      person_id: personId,
      utterance,
      inferred_intent: intentResult.intent,
      confidence: intentResult.confidence,
      resolved_context: {
        surface: uiContext.surface || "day",
        active_entity: uiContext.current_entity || uiContext.current_photo_id,
        in_activity: !!uiContext.activity_state || uiContext.surface === "activity",
        time_of_day: contextPack.authoritative_time.time_of_day,
      },
      active_goals: currentGoals,
      next_best_assistance: assistanceClass,
      multimodal,
      grounding: {
        is_grounded: groundingEval.is_grounded,
        evidence_count: evidencePack.items.length,
        conflicts_detected: groundingEval.has_conflicts,
        unknown_detected: !groundingEval.is_grounded && evidencePack.items.length === 0,
        hedged: groundingEval.hedged_claims.length > 0,
      },
      action_result: actionResultData,
      experience_evidence: experienceEvidence,
      memory_proposal: memoryProposal,
      safety: {
        passed: !isCrisis,
        crisis_routed: isCrisis,
        crisis_number: crisisNumber,
      },
    };
  }

  private mapIntentToQueryShape(intent: string): any {
    switch (intent) {
      case "talk_about_today":
      case "see_reminders":
        return "what_now";
      case "see_person":
      case "call_someone":
        return "who_is";
      case "see_what_happened_yesterday":
        return "what_did_i_do";
      case "find_photo":
      case "ask_about_memory":
      case "play_music":
        return "show_media";
      case "start_activity":
      case "continue_activity":
      case "get_help":
        return "how_do_i";
      default:
        return "who_is";
    }
  }

  private composeGroundedAnswer(
    utterance: string,
    intent: string,
    contextPack: any,
    evidencePack: any
  ): string {
    const lower = utterance.toLowerCase();

    // In-activity help
    if (intent === "get_help") {
      return "Take your time, Aitâ. Thread the golden marigold blossom carefully through the needle stem. I am sitting right beside you.";
    }

    // Stop activity
    if (intent === "stop_leave_activity") {
      return "Of course, Purnima baideu. We can rest now and enjoy the courtyard breeze together.";
    }

    // Direct person inquiry
    if (lower.includes("rina")) {
      return "Rina is your granddaughter studying in Guwahati. She calls you every Tuesday and Saturday at 5:00 PM, and she loves your homemade til pitha.";
    }
    if (lower.includes("anu")) {
      return "Anu is your loving daughter and primary caregiver. She is in the house with you in Tezpur and prepares your warm cardamom tea.";
    }
    if (lower.includes("bikash")) {
      return "Bikash is your son who lives in Bengaluru and visits during festival seasons.";
    }

    // Today / Routine
    if (intent === "talk_about_today") {
      return `Today is peaceful in Tezpur, Aitâ. Your warm afternoon cardamom tea with Anu is at 4:00 PM, and your call with granddaughter Rina is at 5:00 PM.`;
    }

    // Yesterday
    if (intent === "see_what_happened_yesterday") {
      return "Yesterday you strolled in the marigold garden with Anu and enjoyed weaving flower garlands on the sunny veranda.";
    }

    // Music
    if (intent === "play_music") {
      return "Let us listen to this gentle Assamese bamboo flute raga to bring peace and calm to your heart, Purnima baideu.";
    }

    // Orientation
    if (intent === "orient_to_situation") {
      return "You are safe at home in Tezpur, Assam, beside the Brahmaputra river. Daughter Anu is in the house with you, and I am right here.";
    }

    // Photo
    if (intent === "find_photo" || intent === "ask_about_memory") {
      return "Here is your cherished photograph from the Rongali Bihu celebration in the courtyard. You are seated under the Nahor tree with Rina and Anu.";
    }

    // Activity
    if (intent === "start_activity") {
      return "Let us weave sweet yellow marigold flowers together on the veranda table, Aitâ.";
    }

    return "I am right here with you, Purnima baideu. How may I assist you today?";
  }
}

export const conversationGateway = new ConversationGateway();
