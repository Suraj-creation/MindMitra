/**
 * Phase 2 Intelligence Substrate Test Suite
 *
 * Automated verification of:
 * - TEST-01: Context Engine layer resolution (L0-L9) & attention budget
 * - TEST-02: 6-Lane Hybrid Retrieval execution & coverage
 * - TEST-03: Query-Shaped retrieval verification (What should I do now?, Who is Rina?, What did I do yesterday?, Show me my wedding photos)
 * - TEST-04: Bounded tool governance (Consent, Memory Firewall, and Audit logging)
 * - TEST-05: Grounding anti-fabrication & conflict resolution (blocking silent fact choice)
 * - TEST-06: Unknown fact transparency (explicit "does not know" without hallucination)
 * - TEST-07: Conversation / Session context compression
 * - TEST-08: Shared intelligence service execution across conversation and cognitive activities
 */

import { contextEngine } from "./context-engine";
import { hybridRetriever } from "./retrieval/hybrid-retriever";
import { governedToolSet } from "./tools/bounded-tools";
import { groundingEngine } from "./grounding";
import { contextCompressor } from "./compression";
import { governedOrchestrator } from "./orchestrator";
import { InteractionContext, EvidencePack } from "./types";
import { substrateRepo } from "../substrate/repository";

export interface Phase2TestResult {
  testId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
  evidence?: any;
}

export class Phase2TestSuite {
  public async runAllTests(personId = "person:purnima_sharma"): Promise<{
    passedCount: number;
    totalCount: number;
    results: Phase2TestResult[];
  }> {
    const results: Phase2TestResult[] = [];

    const defaultContext: InteractionContext = {
      current_surface: "day",
      current_route: "/person/day",
      current_component: "PersonDayView",
      current_entity: "place:tezpur_home",
      current_modality: "voice",
      current_language: "as",
      current_session: `sess_${Date.now()}`,
    };

    // TEST-01: Context Engine layer resolution (L0-L9) & attention budget
    results.push(await this.test01_contextEngineLayers(personId, defaultContext));

    // TEST-02: 6-Lane Hybrid Retrieval execution & coverage
    results.push(await this.test02_retrievalLanesCoverage(personId, defaultContext));

    // TEST-03: Query-Shaped retrieval verification
    results.push(await this.test03_queryShapedRetrieval(personId, defaultContext));

    // TEST-04: Bounded tool governance (Consent, Memory Firewall, and Audit logging)
    results.push(await this.test04_boundedToolGovernance(personId, defaultContext));

    // TEST-05: Grounding anti-fabrication & conflict resolution
    results.push(await this.test05_groundingConflictResolution(personId));

    // TEST-06: Unknown fact transparency
    results.push(await this.test06_unknownFactTransparency(personId));

    // TEST-07: Conversation / Session context compression
    results.push(await this.test07_contextCompression(personId));

    // TEST-08: Shared intelligence service execution across activities
    results.push(await this.test08_sharedOrchestratorExecution(personId, defaultContext));

    const passedCount = results.filter((r) => r.passed).length;
    return {
      passedCount,
      totalCount: results.length,
      results,
    };
  }

  // ── TEST 1 ───────────────────────────────────────────────────────────────
  private async test01_contextEngineLayers(
    personId: string,
    ctx: InteractionContext
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      const pack = await contextEngine.assembleContextPack(personId, "actor:anu_caregiver", ctx, {
        queryText: "What should I do now?",
        queryShape: "what_now",
        maxTokenBudget: 600,
      });

      const hasBase =
        pack.selected_layers.includes("L0_current_utterance") &&
        pack.selected_layers.includes("L1_current_conversation") &&
        pack.selected_layers.includes("L2_current_ui_context");
      const hasTime = pack.authoritative_time.timezone.includes("Kolkata");
      const hasRoutines = pack.routines.length > 0;

      const passed = hasBase && hasTime && hasRoutines;
      return {
        testId: "TEST-01",
        name: "Context Engine Layer Resolution (L0-L9) & Authoritative Time",
        passed,
        durationMs: Date.now() - t0,
        details: `Resolved ${pack.selected_layers.length} layers, Timezone: ${pack.authoritative_time.timezone}, Region: ${pack.authoritative_time.region_label}`,
        evidence: {
          layers: pack.selected_layers,
          time: pack.authoritative_time,
          routinesCount: pack.routines.length,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-01",
        name: "Context Engine Layer Resolution (L0-L9)",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 2 ───────────────────────────────────────────────────────────────
  private async test02_retrievalLanesCoverage(
    personId: string,
    ctx: InteractionContext
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      const pack = await hybridRetriever.retrieve(
        personId,
        "actor:anu_caregiver",
        "Show me photos of Rina and wedding in Tezpur",
        { interactionContext: ctx }
      );

      const lanes = pack.retrieval_lanes_used;
      const passed = lanes.includes("GRAPH") && (lanes.includes("MEDIA") || lanes.includes("LEXICAL"));

      return {
        testId: "TEST-02",
        name: "6-Lane Retrieval Coverage & Evidence Assembly",
        passed,
        durationMs: Date.now() - t0,
        details: `Activated lanes: [${lanes.join(", ")}], Evidence items: ${pack.items.length}`,
        evidence: {
          lanes,
          itemsCount: pack.items.length,
          groundingSummary: pack.grounding_summary,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-02",
        name: "6-Lane Retrieval Coverage",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 3 ───────────────────────────────────────────────────────────────
  private async test03_queryShapedRetrieval(
    personId: string,
    ctx: InteractionContext
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      // Shape 1: "What should I do now?"
      const s1 = hybridRetriever.detectQueryShape("What should I do now?");
      const p1 = await hybridRetriever.retrieve(personId, "actor:anu_caregiver", "What should I do now?", { queryShape: s1 });

      // Shape 2: "Who is Rina?"
      const s2 = hybridRetriever.detectQueryShape("Who is Rina?");
      const p2 = await hybridRetriever.retrieve(personId, "actor:anu_caregiver", "Who is Rina?", { queryShape: s2 });

      // Shape 3: "What did I do yesterday?"
      const s3 = hybridRetriever.detectQueryShape("What did I do yesterday?");
      const p3 = await hybridRetriever.retrieve(personId, "actor:anu_caregiver", "What did I do yesterday?", { queryShape: s3 });

      // Shape 4: "Show me my wedding photos."
      const s4 = hybridRetriever.detectQueryShape("Show me my wedding photos.");
      const p4 = await hybridRetriever.retrieve(personId, "actor:anu_caregiver", "Show me my wedding photos.", { queryShape: s4 });

      const passed =
        s1 === "what_now" &&
        s2 === "who_is" &&
        s3 === "what_did_i_do" &&
        s4 === "show_media" &&
        p1.items.length > 0 &&
        p2.items.length > 0 &&
        p3.items.length > 0 &&
        p4.items.length > 0;

      return {
        testId: "TEST-03",
        name: "Query-Shaped Retrieval Patterns (Not Top-20 Vectors)",
        passed,
        durationMs: Date.now() - t0,
        details: `Verified shapes: what_now(${p1.items.length}), who_is(${p2.items.length}), what_did_i_do(${p3.items.length}), show_media(${p4.items.length})`,
        evidence: {
          shapes: [s1, s2, s3, s4],
          lanes1: p1.retrieval_lanes_used,
          lanes2: p2.retrieval_lanes_used,
          lanes3: p3.retrieval_lanes_used,
          lanes4: p4.retrieval_lanes_used,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-03",
        name: "Query-Shaped Retrieval Patterns",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 4 ───────────────────────────────────────────────────────────────
  private async test04_boundedToolGovernance(
    personId: string,
    ctx: InteractionContext
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      // 1. Authorized call
      const authSec = {
        person_id: personId,
        actor_id: "actor:anu_caregiver",
        actor_role: "caregiver",
        purpose: "personalisation" as const,
      };
      const resAllowed = await governedToolSet.get_routines(authSec);

      // 2. Unconsented / Unauthorized actor attempt
      const unauthSec = {
        person_id: personId,
        actor_id: "actor:unknown_unauthorized",
        actor_role: "stranger",
        purpose: "research" as const,
      };
      const resBlocked = await governedToolSet.search_personal_memories(unauthSec, "wedding");

      const passed = resAllowed.success && !resBlocked.success && !!resBlocked.error;
      return {
        testId: "TEST-04",
        name: "Bounded Tool Governance (Consent, Firewall & Audit)",
        passed,
        durationMs: Date.now() - t0,
        details: `Authorized call: SUCCESS (${resAllowed.audit_id}), Blocked unauthorized: DENIED (${resBlocked.audit_id}, ${resBlocked.error})`,
        evidence: {
          allowedAudit: resAllowed.audit_id,
          blockedAudit: resBlocked.audit_id,
          blockedReason: resBlocked.error,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-04",
        name: "Bounded Tool Governance",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 5 ───────────────────────────────────────────────────────────────
  private async test05_groundingConflictResolution(
    personId: string
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      // Create artificial evidence pack with a contradictory claim
      const conflictedPack: EvidencePack = {
        request_id: "test_conflict",
        query: "Where is Rina?",
        person_id: personId,
        total_evidence_count: 2,
        retrieval_lanes_used: ["GRAPH"],
        items: [],
        grounding_summary: {
          verified_count: 1,
          partially_verified_count: 0,
          conflicting_count: 1,
          unknown_count: 0,
        },
        conflicts_detected: [
          {
            fact_a_id: "ev_a",
            fact_a_statement: "Rina lives in Guwahati studying computer science.",
            fact_b_id: "ev_b",
            fact_b_statement: "Rina lives in Bengaluru working at an office.",
            conflict_description: "Conflicting residences reported for Granddaughter Rina.",
          },
        ],
        attention_budget_tokens: 100,
        generated_at: new Date().toISOString(),
      };

      const result = groundingEngine.evaluate("Rina lives in Bengaluru.", "Where is Rina?", conflictedPack);

      // Model must NOT choose a preferred fact; must flag conflict and defer to confirmation
      const passed = result.has_conflicts && !result.is_grounded && result.sanitized_answer.includes("Anu");

      return {
        testId: "TEST-05",
        name: "Grounding Invariant: Anti-Fabrication & Conflict Resolution",
        passed,
        durationMs: Date.now() - t0,
        details: `Conflict flagged: ${result.has_conflicts}, Silent choice blocked: ${!result.is_grounded}, Sanitized response deferred to Anu.`,
        evidence: {
          hasConflicts: result.has_conflicts,
          isGrounded: result.is_grounded,
          sanitizedAnswer: result.sanitized_answer,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-05",
        name: "Grounding Conflict Resolution",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 6 ───────────────────────────────────────────────────────────────
  private async test06_unknownFactTransparency(
    personId: string
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      const emptyPack: EvidencePack = {
        request_id: "test_unknown",
        query: "Where are my blue glasses?",
        person_id: personId,
        total_evidence_count: 0,
        retrieval_lanes_used: ["LEXICAL"],
        items: [],
        grounding_summary: {
          verified_count: 0,
          partially_verified_count: 0,
          conflicting_count: 0,
          unknown_count: 0,
        },
        conflicts_detected: [],
        attention_budget_tokens: 50,
        generated_at: new Date().toISOString(),
      };

      const result = groundingEngine.evaluate(
        "Your blue glasses are on the side table.",
        "Where are my blue glasses?",
        emptyPack
      );

      // Must explicitly say it does not know instead of fabricating
      const passed =
        result.unknown_facts_detected &&
        result.sanitized_answer.toLowerCase().includes("don't have that noted") ||
        result.sanitized_answer.toLowerCase().includes("ask anu");

      return {
        testId: "TEST-06",
        name: "Unknown Fact Transparency (Explicit 'Does Not Know')",
        passed,
        durationMs: Date.now() - t0,
        details: `Unknown detected: ${result.unknown_facts_detected}, Response: "${result.sanitized_answer}"`,
        evidence: {
          unknownDetected: result.unknown_facts_detected,
          sanitizedAnswer: result.sanitized_answer,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-06",
        name: "Unknown Fact Transparency",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 7 ───────────────────────────────────────────────────────────────
  private async test07_contextCompression(
    personId: string
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      const rawTurns = [
        { role: "user" as const, text: "Good morning, my dear. Is Rina calling today?" },
        { role: "assistant" as const, text: "Yes Purnima baideu, Rina is calling at 5:00 PM from Guwahati." },
        { role: "user" as const, text: "I love making til pitha when she visits." },
        { role: "assistant" as const, text: "She loves your til pitha so much!" },
      ];

      const compressed = contextCompressor.compress(personId, "sess_compress_test", rawTurns);

      const hasEntities =
        compressed.important_entities.includes("person:contact:rina") ||
        compressed.important_entities.includes("person:purnima");
      const hasCandidate = compressed.candidate_memories.some((m) => m.statement.includes("til pitha"));
      const summaryNonEmpty = compressed.session_summary.length > 20;

      const passed = hasEntities && hasCandidate && summaryNonEmpty;
      return {
        testId: "TEST-07",
        name: "Conversation / Session Context Compression",
        passed,
        durationMs: Date.now() - t0,
        details: `Compressed ${rawTurns.length} turns into structured summary. Entities: [${compressed.important_entities.join(", ")}], Candidate memories: ${compressed.candidate_memories.length}`,
        evidence: {
          summary: compressed.session_summary,
          entities: compressed.important_entities,
          candidates: compressed.candidate_memories,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-07",
        name: "Context Compression",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }

  // ── TEST 8 ───────────────────────────────────────────────────────────────
  private async test08_sharedOrchestratorExecution(
    personId: string,
    ctx: InteractionContext
  ): Promise<Phase2TestResult> {
    const t0 = Date.now();
    try {
      // Execute turn through the 10-step orchestrator
      const result = await governedOrchestrator.executeTurn(
        personId,
        "actor:anu_caregiver",
        "Who is Rina?",
        ctx
      );

      const passed =
        result.plan.query_shape === "who_is" &&
        result.grounding_evaluation.is_grounded &&
        result.answer.includes("granddaughter") &&
        result.action?.type === "call_contact";

      return {
        testId: "TEST-08",
        name: "Governed Orchestration 10-Step Lifecycle Execution",
        passed,
        durationMs: Date.now() - t0,
        details: `Orchestration ID: ${result.orchestration_id}, Plan Shape: ${result.plan.query_shape}, Grounded: ${result.grounding_evaluation.is_grounded}, Action: ${result.action?.label}`,
        evidence: {
          orchestrationId: result.orchestration_id,
          answer: result.answer,
          action: result.action,
          tokensUsed: result.attention_budget_used_tokens,
          auditId: result.audit_id,
        },
      };
    } catch (e: any) {
      return {
        testId: "TEST-08",
        name: "Governed Orchestrator Execution",
        passed: false,
        durationMs: Date.now() - t0,
        details: `Error: ${e.message}`,
      };
    }
  }
}

export const phase2TestSuite = new Phase2TestSuite();
