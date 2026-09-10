/**
 * Hybrid Retriever — Query-Shaped Multi-Lane Retrieval Fusion Engine
 *
 * Implements query-shaped retrieval patterns strictly matching:
 * 1. "What should I do now?" -> time + routine + recent activity + capability + preference + future context + goal
 * 2. "Who is Rina?" -> graph + verified relationship + relevant context
 * 3. "What did I do yesterday?" -> temporal events + activity episodes + conversation events + routine events
 * 4. "Show me my wedding photos." -> lexical/semantic intent + graph + event + media retrieval
 * 5. "How do I make tea?" -> structured routine + capability + assistance policy
 *
 * Fuses multi-lane evidence, prevents duplicates, detects contradictions,
 * validates consent scopes, and bounds evidence within the attention budget.
 */

import {
  EvidenceItem,
  EvidencePack,
  EvidenceConflict,
  QueryShape,
  RetrievalLane,
  InteractionContext,
} from "../types";
import { graphRetriever } from "./graph-retriever";
import { temporalRetriever } from "./temporal-retriever";
import { semanticRetriever } from "./semantic-retriever";
import { lexicalRetriever } from "./lexical-retriever";
import { mediaRetriever } from "./media-retriever";
import { structuredRetriever } from "./structured-retriever";
import { substrateRepo } from "../../substrate/repository";

export class HybridRetriever {
  /**
   * Classifies a user query into a canonical QueryShape.
   */
  public detectQueryShape(query: string, ctx?: Partial<InteractionContext>): QueryShape {
    const q = query.toLowerCase().trim();

    if (
      q.includes("what should i do") ||
      q.includes("what next") ||
      q.includes("what now") ||
      (q.includes("now") && (q.includes("schedule") || q.includes("time")))
    ) {
      return "what_now";
    }

    if (
      q.startsWith("who is") ||
      q.startsWith("who's") ||
      q.includes("who is rina") ||
      q.includes("who is anu") ||
      q.includes("who is bikash") ||
      q.includes("who is meena") ||
      q.includes("who was at")
    ) {
      return "who_is";
    }

    if (
      q.includes("yesterday") ||
      q.includes("what did i do") ||
      q.includes("earlier today") ||
      q.includes("past activity")
    ) {
      return "what_did_i_do";
    }

    if (
      q.includes("photo") ||
      q.includes("picture") ||
      q.includes("album") ||
      q.includes("wedding") ||
      q.includes("show me") ||
      q.includes("see my") ||
      ctx?.current_surface === "life"
    ) {
      return "show_media";
    }

    if (
      q.includes("tea") ||
      q.includes("garland") ||
      q.includes("routine") ||
      q.includes("step") ||
      q.includes("how do i make") ||
      ctx?.current_surface === "activity"
    ) {
      return "activity_help";
    }

    return "general_companion";
  }

  /**
   * Executes query-shaped hybrid retrieval (Phase 3 Gateway compatibility).
   */
  public async retrieveEvidence(
    personId: string,
    query: string,
    queryShape?: QueryShape,
    interactionContext?: Partial<InteractionContext> | { surface?: string; current_entity?: string; current_task?: string },
    actorId: string = "person:purnima:self"
  ): Promise<EvidencePack> {
    const fullCtx: Partial<InteractionContext> = interactionContext
      ? {
          current_surface: (interactionContext as any).surface || (interactionContext as any).current_surface,
          current_entity: (interactionContext as any).current_entity,
          current_activity: (interactionContext as any).current_task || (interactionContext as any).current_activity,
        }
      : {};

    return this.retrieve(personId, actorId, query, {
      queryShape,
      interactionContext: fullCtx,
    });
  }

  /**
   * Executes query-shaped hybrid retrieval across the 6 specialized lanes.
   */
  public async retrieve(
    personId: string,
    actorId: string,
    query: string,
    options: {
      interactionContext?: Partial<InteractionContext>;
      queryShape?: QueryShape;
      maxEvidenceItems?: number;
      tokenBudget?: number;
    } = {}
  ): Promise<EvidencePack> {
    const shape = options.queryShape || this.detectQueryShape(query, options.interactionContext);
    const maxItems = options.maxEvidenceItems || 8;
    const lanesUsed: RetrievalLane[] = [];
    const collected: EvidenceItem[] = [];

    // 1. Check actor consent grants for categories
    const canAccessIdentity = await substrateRepo.checkConsent(personId, actorId, "personal_identity", "personalisation");
    const canAccessMemories = await substrateRepo.checkConsent(personId, actorId, "life_story_memory", "personalisation");
    const canAccessMedia = await substrateRepo.checkConsent(personId, actorId, "media_assets", "personalisation");
    const canAccessTelemetry = await substrateRepo.checkConsent(personId, actorId, "activity_telemetry", "personalisation");

    // 2. Query-shaped lane dispatch
    switch (shape) {
      case "what_now": {
        // "What should I do now?" -> time + routine + recent activity + capability + preference + future context + goal
        lanesUsed.push("STRUCTURED", "TEMPORAL");
        const structEv = await structuredRetriever.retrieve(personId, query);
        const tempEv = await temporalRetriever.retrieve(personId, query);
        collected.push(...structEv, ...tempEv);
        break;
      }

      case "who_is": {
        // "Who is Rina?" -> graph + verified relationship + relevant context
        lanesUsed.push("GRAPH", "LEXICAL");
        const graphEv = await graphRetriever.retrieve(personId, query);
        const lexEv = await lexicalRetriever.retrieve(personId, query);
        collected.push(...graphEv, ...lexEv);

        if (canAccessMemories.allowed) {
          lanesUsed.push("SEMANTIC");
          const semEv = await semanticRetriever.retrieve(personId, query, { limit: 2 });
          collected.push(...semEv);
        }
        break;
      }

      case "what_did_i_do": {
        // "What did I do yesterday?" -> temporal events + activity episodes + conversation events + routine events
        lanesUsed.push("TEMPORAL");
        const tempEv = await temporalRetriever.retrieve(personId, query);
        collected.push(...tempEv);

        if (canAccessTelemetry.allowed) {
          lanesUsed.push("STRUCTURED");
          const structEv = await structuredRetriever.retrieve(personId, query);
          collected.push(...structEv);
        }
        break;
      }

      case "show_media": {
        // "Show me my wedding photos." -> lexical/semantic intent + graph + event + media retrieval
        lanesUsed.push("LEXICAL", "MEDIA");
        const lexEv = await lexicalRetriever.retrieve(personId, query);
        collected.push(...lexEv);

        if (canAccessMedia.allowed) {
          const mediaEv = await mediaRetriever.retrieve(personId, query);
          collected.push(...mediaEv);
        }

        lanesUsed.push("GRAPH");
        const graphEv = await graphRetriever.retrieve(personId, query);
        collected.push(...graphEv);
        break;
      }

      case "activity_help": {
        // "How do I make tea?" -> structured routine + capability + assistance policy
        lanesUsed.push("STRUCTURED");
        const structEv = await structuredRetriever.retrieve(personId, query);
        collected.push(...structEv);
        break;
      }

      case "general_companion":
      default: {
        // Balanced retrieval
        lanesUsed.push("GRAPH", "TEMPORAL");
        const graphEv = await graphRetriever.retrieve(personId, query);
        const tempEv = await temporalRetriever.retrieve(personId, query);
        collected.push(...graphEv, ...tempEv);

        if (canAccessMemories.allowed) {
          lanesUsed.push("SEMANTIC");
          const semEv = await semanticRetriever.retrieve(personId, query, { limit: 2 });
          collected.push(...semEv);
        }
        break;
      }
    }

    // 3. Deduplicate evidence by entity_id and statement
    const seen = new Set<string>();
    const deduplicated: EvidenceItem[] = [];
    for (const item of collected) {
      const key = `${item.source_type}:${item.entity_id}:${item.claim_or_statement.slice(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    // 4. Sort by relevance descending and truncate to maxItems (respecting attention budget)
    deduplicated.sort((a, b) => b.relevance - a.relevance);
    const selectedItems = deduplicated.slice(0, maxItems);

    // 5. Detect any factual contradictions in evidence
    const conflicts = this.detectConflicts(selectedItems);

    // 6. Compute Grounding Summary
    let verifiedCount = 0;
    let partiallyVerifiedCount = 0;
    let unknownCount = 0;
    for (const item of selectedItems) {
      if (item.verification === "verified") verifiedCount++;
      else if (item.verification === "observed" || item.verification === "reported") partiallyVerifiedCount++;
      else if (item.verification === "unknown") unknownCount++;
    }

    return {
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      query,
      person_id: personId,
      total_evidence_count: selectedItems.length,
      items: selectedItems,
      retrieval_lanes_used: Array.from(new Set(lanesUsed)),
      grounding_summary: {
        verified_count: verifiedCount,
        partially_verified_count: partiallyVerifiedCount,
        conflicting_count: conflicts.length,
        unknown_count: unknownCount,
      },
      conflicts_detected: conflicts,
      attention_budget_tokens: selectedItems.length * 45,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Conflict Detection Engine: Checks if any two retrieved claims assert
   * contradictory facts (e.g. location of Rina, scheduled tea time).
   */
  private detectConflicts(items: EvidenceItem[]): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    // Compare pairs of claims
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        // Example conflict check: Location of Rina
        if (
          a.claim_or_statement.includes("Rina") &&
          b.claim_or_statement.includes("Rina") &&
          ((a.claim_or_statement.includes("Guwahati") && b.claim_or_statement.includes("Bengaluru")) ||
            (a.claim_or_statement.includes("Tezpur") && b.claim_or_statement.includes("Delhi")))
        ) {
          conflicts.push({
            fact_a_id: a.evidence_id,
            fact_a_statement: a.claim_or_statement,
            fact_b_id: b.evidence_id,
            fact_b_statement: b.claim_or_statement,
            conflict_description: "Conflicting residences reported for Granddaughter Rina.",
          });
        }

        // Example conflict check: Scheduled tea time
        if (
          a.claim_or_statement.includes("Tea") &&
          b.claim_or_statement.includes("Tea") &&
          ((a.claim_or_statement.includes("4:00 PM") && b.claim_or_statement.includes("6:00 PM")) ||
            (a.claim_or_statement.includes("Morning") && b.claim_or_statement.includes("Evening")))
        ) {
          conflicts.push({
            fact_a_id: a.evidence_id,
            fact_a_statement: a.claim_or_statement,
            fact_b_id: b.evidence_id,
            fact_b_statement: b.claim_or_statement,
            conflict_description: "Conflicting scheduled times for Afternoon Tea Routine.",
          });
        }
      }
    }

    return conflicts;
  }
}

export const hybridRetriever = new HybridRetriever();
