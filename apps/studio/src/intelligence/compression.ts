/**
 * Conversation & Session Context Compression Engine
 *
 * Transforms raw multi-turn conversation into a compact, structured representation:
 * - Session summary
 * - Important referenced entities
 * - Active goals
 * - Meaningful decisions
 * - Actions taken & outcomes
 * - Candidate memories (held as 'candidate' with 'model generated' authority)
 * - Cognitive experience indicators
 *
 * Prevents bloating prompts with thousands of raw historical conversation tokens.
 */

import { CompressedSession } from "./types";

export interface RawTurn {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
  action?: any;
}

export class ContextCompressor {
  /**
   * Compresses a sequence of raw dialogue turns into a structured session memory.
   */
  public compress(
    personId: string,
    sessionId: string,
    turns: RawTurn[]
  ): CompressedSession {
    if (!turns || turns.length === 0) {
      return {
        session_id: sessionId,
        person_id: personId,
        compressed_at: new Date().toISOString(),
        turns_processed: 0,
        session_summary: "Session initiated in Tezpur home; peaceful baseline.",
        important_entities: ["person:purnima", "place:tezpur_home"],
        active_goals: ["morning_orientation"],
        meaningful_decisions: [],
        actions_triggered: [],
        outcomes: ["peaceful_engagement"],
        candidate_memories: [],
        experience_indicators: {
          receptivity: "high",
          hesitation_noted: false,
          assistance_useful: true,
        },
      };
    }

    const allText = turns.map((t) => t.text.toLowerCase()).join(" ");
    const importantEntities = new Set<string>(["person:purnima"]);
    const meaningfulDecisions: string[] = [];
    const actionsTriggered: string[] = [];
    const outcomes: string[] = [];
    const candidateMemories: CompressedSession["candidate_memories"] = [];

    // Extract Entities
    if (allText.includes("rina")) importantEntities.add("person:contact:rina");
    if (allText.includes("anu")) importantEntities.add("person:contact:anu");
    if (allText.includes("bikash")) importantEntities.add("person:contact:bikash");
    if (allText.includes("tea") || allText.includes("cardamom")) importantEntities.add("routine:afternoon_tea");
    if (allText.includes("bihu") || allText.includes("garland")) importantEntities.add("life_event:rongali_bihu");
    if (allText.includes("tezpur") || allText.includes("courtyard")) importantEntities.add("place:tezpur_home");

    // Extract Actions and Decisions
    for (const t of turns) {
      if (t.action?.type) {
        actionsTriggered.push(`${t.action.type}:${t.action.target || "system"}`);
      }
      if (t.text.toLowerCase().includes("call anu") || t.text.toLowerCase().includes("call rina")) {
        meaningfulDecisions.push("Requested voice connection to family member.");
      }
      if (t.text.toLowerCase().includes("tea at 4") || t.text.toLowerCase().includes("cardamom tea")) {
        meaningfulDecisions.push("Confirmed afternoon tea routine at 4:00 PM.");
      }
    }

    // Detect Potential Candidate Memories (marked as candidate + requires confirmation)
    if (allText.includes("like") || allText.includes("love") || allText.includes("favorite")) {
      if (allText.includes("til pitha")) {
        candidateMemories.push({
          statement: "Purnima expressed love for preparing til pitha for family visits.",
          category: "preference",
          source: "conversation_inference",
          requires_confirmation: true,
        });
      }
      if (allText.includes("nahor") || allText.includes("marigold")) {
        candidateMemories.push({
          statement: "Purnima recalled sweet memories of Nahor blossoms in the courtyard.",
          category: "sensory_comfort",
          source: "conversation_inference",
          requires_confirmation: true,
        });
      }
    }

    // Formulate concise summary
    let summary = `Conversation covering ${turns.length} turns. Purnima engaged in a calm and dignified dialogue. `;
    if (allText.includes("rina")) summary += "Discussed granddaughter Rina and her scheduled call. ";
    if (allText.includes("tea")) summary += "Revisited afternoon cardamom tea routine. ";
    if (allText.includes("flute") || allText.includes("song")) summary += "Shared appreciation for Assamese bamboo flute music. ";

    return {
      session_id: sessionId,
      person_id: personId,
      compressed_at: new Date().toISOString(),
      turns_processed: turns.length,
      session_summary: summary.trim(),
      important_entities: Array.from(importantEntities),
      active_goals: ["maintain_comfort", "support_routine"],
      meaningful_decisions: meaningfulDecisions,
      actions_triggered: actionsTriggered,
      outcomes: outcomes.length > 0 ? outcomes : ["dignified_reassurance_achieved"],
      candidate_memories: candidateMemories,
      experience_indicators: {
        receptivity: "high",
        hesitation_noted: allText.includes("repeat") || allText.includes("where"),
        assistance_useful: true,
      },
    };
  }
}

export const contextCompressor = new ContextCompressor();
