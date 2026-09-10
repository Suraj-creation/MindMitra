/**
 * Structured Retrieval Lane — Routines, Reminders, Goals, Capabilities & Policies
 *
 * Retrieves structured state from the Personal Intelligence Substrate:
 * - Daily routines and sequential steps
 * - Active personal goals
 * - Conditioned Personal Capability Model (PCM) states
 * - Learned assistance policies
 */

import { EvidenceItem } from "../types";
import { substrateRepo } from "../../substrate/repository";

export class StructuredRetriever {
  public async retrieve(
    personId: string,
    query: string
  ): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];
    const lower = query.toLowerCase();

    // 1. Daily Routines & Steps
    const routines = await substrateRepo.getRoutines(personId);
    for (const r of routines) {
      if (
        lower.includes("tea") ||
        lower.includes("routine") ||
        lower.includes("what should i do") ||
        lower.includes("now") ||
        lower.includes("afternoon") ||
        lower.includes("step")
      ) {
        const stepSummary = r.steps.map((s) => `${s.step_number}. ${s.label}`).join("; ");
        evidence.push({
          evidence_id: `ev_struct_routine_${r.routine_id}`,
          entity_id: r.routine_id,
          source_type: "daily_routine",
          source_id: r.routine_id,
          claim_or_statement: `Routine [${r.title}]: Scheduled at ${r.scheduled_time} (${r.time_of_day}). Steps: [${stepSummary}]. Preferred Strategy: ${r.preferred_assistance_strategy}.`,
          relevance: 0.95,
          verification: "verified",
          confidence: 0.98,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "STRUCTURED",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "caregiver:anu",
            source_class: "caregiver reported",
            authority_class: "caregiver reported",
          },
        });
      }
    }

    // 2. Personal Goals
    const goals = await substrateRepo.getGoals(personId);
    for (const g of goals) {
      if (lower.includes("goal") || lower.includes("want") || lower.includes("what should i do") || lower.includes("routine")) {
        evidence.push({
          evidence_id: `ev_struct_goal_${g.goal_id}`,
          entity_id: g.goal_id,
          source_type: "personal_goal",
          source_id: g.goal_id,
          claim_or_statement: `Personal Standing Goal: "${g.statement}". Status: ${g.status}, Safety: ${g.safety_class}.`,
          relevance: 0.88,
          verification: "verified",
          confidence: 0.95,
          validity: "valid",
          timestamp: g.created_at,
          retrieval_lane: "STRUCTURED",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: g.source,
            source_class: "person verified",
            authority_class: "person verified",
          },
        });
      }
    }

    // 3. Conditioned Capability States (PCM)
    const capabilityStates = await substrateRepo.listCapabilityStates(personId);
    for (const c of capabilityStates) {
      if (lower.includes("capability") || lower.includes("can i") || lower.includes("assist") || lower.includes("help") || lower.includes("what should i do")) {
        evidence.push({
          evidence_id: `ev_struct_cap_${c.state_id}`,
          entity_id: c.domain,
          source_type: "capability_state",
          source_id: c.state_id,
          claim_or_statement: `PCM Capability [${c.domain}]: ${c.conditioned_estimate}. Trend: ${c.trend}, Evidence count: ${c.evidence_count}.`,
          relevance: 0.85,
          verification: "observed",
          confidence: 1 - c.uncertainty,
          validity: "valid",
          timestamp: c.last_observed_at,
          retrieval_lane: "STRUCTURED",
          authorization_scope: "consent:activity_telemetry",
          provenance: {
            author: "clinical_measurement_pipeline",
            source_class: "behavioral observation",
            authority_class: "behavioral observation",
          },
        });
      }
    }

    // 4. Learned Assistance Policies
    const policies = await substrateRepo.listAssistancePolicies(personId);
    for (const p of policies) {
      evidence.push({
        evidence_id: `ev_struct_policy_${p.policy_id}`,
        entity_id: p.task_domain,
        source_type: "assistance_policy",
        source_id: p.policy_id,
        claim_or_statement: `Assistance Policy [${p.task_domain}]: Preferred strategy is '${p.preferred_strategy}' (success rate ${Math.round(p.success_rate * 100)}%, confidence ${Math.round(p.confidence * 100)}%). Fallback: '${p.fallback_strategy}'.`,
        relevance: 0.86,
        verification: "observed",
        confidence: p.confidence,
        validity: "valid",
        timestamp: p.last_reinforced_at,
        retrieval_lane: "STRUCTURED",
        authorization_scope: "consent:assistance_policies",
        provenance: {
          author: "reinforcement_engine",
          source_class: "behavioral observation",
          authority_class: "behavioral observation",
        },
      });
    }

    return evidence;
  }
}

export const structuredRetriever = new StructuredRetriever();
