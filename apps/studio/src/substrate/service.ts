/**
 * MindMitra Personal Intelligence Substrate — Domain Service
 *
 * High-level orchestration for:
 * - Interaction event ingestion & Experience Memory recording
 * - Measurement Quality certification pipeline
 * - Conditioned Capability State (PCM) updates
 * - Learned Assistance Policy reinforcement
 * - Governed Memory creation with Model-Generated authority guards
 * - Backblaze B2 Media intelligence queries
 */

import { SubstrateRepository, substrateRepo } from "./repository";
import {
  InteractionEvent,
  ExperienceEpisode,
  CapabilityObservation,
  PersonalCapabilityState,
  AssistancePolicy,
  MemoryItem,
  MediaMetadataRecord,
} from "./types";
import {
  RawInteractionPayload,
  processInteractionThroughPipeline,
  PipelineExecutionReport,
} from "./measurement-integrity";
import { validateMemoryAuthority, createProvenanceRecord } from "./provenance";

export class PersonalIntelligenceService {
  constructor(private repo: SubstrateRepository = substrateRepo) {}

  /**
   * Complete 7-step interaction adaptation pipeline:
   * raw event -> normalized event -> measurement quality -> experience episode -> observation -> validation -> PCM/Policy update
   */
  public async processInteraction(raw: RawInteractionPayload): Promise<{
    report: PipelineExecutionReport;
    event: InteractionEvent;
    episode?: ExperienceEpisode;
    observation?: CapabilityObservation;
    capabilityState?: PersonalCapabilityState;
    assistancePolicy?: AssistancePolicy;
  }> {
    // 1. Fetch current capability state & policy for context
    const currentCap = await this.repo.getCapabilityState(raw.person_id, "memory_recognition");
    const currentPol = await this.repo.getAssistancePolicy(raw.person_id, "familiar_person_recall");

    // 2. Execute pipeline
    const pipelineResult = processInteractionThroughPipeline(
      raw,
      currentCap || undefined,
      currentPol || undefined
    );

    // 3. Persist normalized interaction event (Append-Only)
    await this.repo.appendInteractionEvent(pipelineResult.normalizedEvent);

    // 4. If episode formed, persist experience memory
    if (pipelineResult.episode) {
      await this.repo.recordExperienceEpisode(pipelineResult.episode);
    }

    // 5. If observation formed, persist observation
    if (pipelineResult.observation) {
      await this.repo.recordObservation(pipelineResult.observation);
    }

    // 6. If passed measurement gate, persist conditioned capability & policy updates
    if (pipelineResult.updatedCapability) {
      await this.repo.upsertCapabilityState(pipelineResult.updatedCapability);
    }
    if (pipelineResult.updatedPolicy) {
      await this.repo.upsertAssistancePolicy(pipelineResult.updatedPolicy);
    }

    // 7. Audit log the execution
    await this.repo.logAuditEvent({
      audit_id: `aud_${Date.now()}`,
      actor_id: raw.person_id,
      person_id: raw.person_id,
      action: "WRITE",
      target_table: "interaction_events",
      target_id: pipelineResult.normalizedEvent.event_id,
      purpose: "longitudinal_cognitive_adaptation",
      result: pipelineResult.report.passed_measurement_gate ? "SUCCESS" : "GUARD_BLOCKED",
      reason: pipelineResult.report.passed_measurement_gate
        ? "Measurement quality certified and persisted to model."
        : "Measurement quality below threshold; model update prevented.",
      timestamp: new Date().toISOString(),
    });

    return {
      report: pipelineResult.report,
      event: pipelineResult.normalizedEvent,
      episode: pipelineResult.episode,
      observation: pipelineResult.observation,
      capabilityState: pipelineResult.updatedCapability,
      assistancePolicy: pipelineResult.updatedPolicy,
    };
  }

  /**
   * Evaluates actor consent against the substrate privacy firewall.
   */
  public async evaluateConsentFirewall(
    requestingActorId: string,
    personId: string,
    category: string,
    purpose: string
  ): Promise<{ decision: "PERMIT" | "DENY"; reason: string }> {
    const result = await this.repo.checkConsent(personId, requestingActorId, category, purpose);
    return {
      decision: result.allowed ? "PERMIT" : "DENY",
      reason: result.reason,
    };
  }

  /**
   * Governed Memory Creation with Strict Model-Generated Invariant Enforcement:
   * "A model-generated statement must NEVER silently become an authoritative personal fact."
   */
  public async createGovernedMemory(
    personId: string,
    statement: string,
    category: any,
    claimedAuthority: any,
    sourceClass: any,
    authorActorId: string,
    verifyingActorRole?: string
  ): Promise<{ memory: MemoryItem; auditResult: any }> {
    const authCheck = validateMemoryAuthority(claimedAuthority, sourceClass, verifyingActorRole);

    const provId = `prov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const provRecord = createProvenanceRecord(provId, sourceClass, authorActorId, {
      verification_status: authCheck.evidence_level,
      verified_by: verifyingActorRole ? `${authorActorId} (${verifyingActorRole})` : undefined,
      certifier_role: verifyingActorRole,
    });
    await this.repo.addProvenanceRecord(provRecord);

    const now = new Date().toISOString();
    const memoryItem: MemoryItem = {
      memory_id: `mem_${Date.now()}`,
      person_id: personId,
      statement,
      category,
      temporal_frame: "present",
      authority_class: authCheck.promoted_authority,
      lifecycle_state: authCheck.lifecycle_state,
      evidence_level: authCheck.evidence_level,
      confidence: authCheck.is_guard_violation ? 0.45 : 0.95,
      valid_from: now,
      provenance_id: provId,
      reinforcement_count: 1,
      last_reinforced_at: now,
      created_at: now,
      updated_at: now,
    };

    await this.repo.addMemory(memoryItem);

    await this.repo.logAuditEvent({
      audit_id: `aud_${Date.now()}`,
      actor_id: authorActorId,
      person_id: personId,
      action: authCheck.is_guard_violation ? "MODEL_GENERATED_GUARD" : "WRITE",
      target_table: "memories",
      target_id: memoryItem.memory_id,
      purpose: "memory_governance",
      result: authCheck.is_guard_violation ? "GUARD_BLOCKED" : "SUCCESS",
      reason: authCheck.audit_reason,
      timestamp: now,
    });

    return { memory: memoryItem, auditResult: authCheck };
  }

  /**
   * Reinforce an existing memory with fresh evidence.
   */
  public async reinforceMemory(memoryId: string, evidenceType: any, evidenceId: string): Promise<MemoryItem | null> {
    const memory = await this.repo.getMemory(memoryId);
    if (!memory) return null;

    memory.reinforcement_count += 1;
    memory.last_reinforced_at = new Date().toISOString();
    if (memory.lifecycle_state === "candidate" && memory.reinforcement_count >= 3) {
      memory.lifecycle_state = "reinforced";
    }

    await this.repo.linkMemoryEvidence({
      link_id: `link_${Date.now()}`,
      memory_id: memoryId,
      evidence_type: evidenceType,
      evidence_id: evidenceId,
      source_authority: memory.authority_class,
      confidence_contribution: 0.1,
      created_at: new Date().toISOString(),
    });

    return memory;
  }

  /**
   * Resolves comprehensive Personal Intelligence Profile for a person.
   */
  public async getPersonalIntelligenceProfile(personId: string) {
    const [
      person,
      capabilities,
      assistancePolicies,
      goals,
      routines,
      contacts,
      memories,
      metrics,
    ] = await Promise.all([
      this.repo.getPerson(personId),
      this.repo.listCapabilityStates(personId),
      this.repo.listAssistancePolicies(personId),
      this.repo.getGoals(personId),
      this.repo.getRoutines(personId),
      this.repo.getContacts(personId),
      this.repo.getMemories(personId),
      this.repo.getSubstrateMetrics(personId),
    ]);

    return {
      person,
      capabilities,
      assistancePolicies,
      goals,
      routines,
      contacts,
      memories,
      metrics,
    };
  }

  /**
   * Query media through intelligence layer with consent scope checking.
   */
  public async getMediaAssets(personId: string, requestingActorId: string, depictedPersonId?: string) {
    // Check consent for media assets
    const consent = await this.repo.checkConsent(personId, requestingActorId, "media_assets", "personalisation");
    if (!consent.allowed) {
      return {
        allowed: false,
        reason: consent.reason,
        assets: [],
      };
    }

    const assets = await this.repo.getMedia(personId, depictedPersonId);
    return {
      allowed: true,
      reason: consent.reason,
      assets,
    };
  }

  /**
   * Query the explicit MindMitra semantic ontology graph.
   */
  public async getOntologyGraph(personId: string) {
    const [nodes, edges] = await Promise.all([
      this.repo.listOntologyNodes(personId),
      this.repo.listOntologyEdges(personId),
    ]);
    return { person_id: personId, nodes, edges };
  }
}

// Global Singleton Service
export const personalIntelligenceService = new PersonalIntelligenceService();
