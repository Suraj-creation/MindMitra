/**
 * MindMitra Provenance & Authority Engine
 *
 * Implements strict memory authority, source classes, and the core invariant:
 * "A model-generated statement must NEVER silently become an authoritative personal fact."
 */

import {
  MemoryAuthorityClass,
  EvidenceVerificationLevel,
  ProvenanceRecord,
  MemoryLifecycleState,
} from "./types";

export const AUTHORITY_HIERARCHY_WEIGHTS: Record<MemoryAuthorityClass, number> = {
  "system/authoritative": 1.0,
  "clinician/system record": 0.98,
  "person verified": 0.95,
  "family confirmed": 0.92,
  "caregiver reported": 0.9,
  "CHW reported": 0.88,
  "behavioral observation": 0.8,
  "user utterance": 0.75,
  inferred: 0.5,
  "model generated": 0.35,
};

export interface AuthorityValidationResult {
  allowed: boolean;
  promoted_authority: MemoryAuthorityClass;
  lifecycle_state: MemoryLifecycleState;
  evidence_level: EvidenceVerificationLevel;
  audit_reason: string;
  is_guard_violation: boolean;
}

/**
 * Validates authority promotion rules.
 * CRITICAL SAFETY INVARIANT:
 * A model-generated statement must NEVER silently become an authoritative personal fact.
 */
export function validateMemoryAuthority(
  claimedAuthority: MemoryAuthorityClass,
  sourceClass: MemoryAuthorityClass,
  verifyingActorRole?: string
): AuthorityValidationResult {
  // Check Violation: Model generated attempting to become authoritative without human review
  if (sourceClass === "model generated" || claimedAuthority === "model generated") {
    if (
      claimedAuthority === "system/authoritative" ||
      claimedAuthority === "clinician/system record" ||
      claimedAuthority === "person verified" ||
      claimedAuthority === "family confirmed"
    ) {
      // Must be accompanied by a recognized human verifier
      const hasHumanVerification =
        verifyingActorRole === "clinician" ||
        verifyingActorRole === "primary_caregiver" ||
        verifyingActorRole === "person" ||
        verifyingActorRole === "asha_chw";

      if (!hasHumanVerification) {
        return {
          allowed: false,
          promoted_authority: "model generated",
          lifecycle_state: "candidate",
          evidence_level: "inferred",
          audit_reason:
            "CRITICAL_SAFETY_GUARD_BLOCKED: Model-generated claim cannot be promoted to authoritative without explicit human confirmation.",
          is_guard_violation: true,
        };
      }
    }
  }

  // Safe mapping based on genuine authority source
  let lifecycle: MemoryLifecycleState = "active";
  let evidenceLevel: EvidenceVerificationLevel = "verified";

  if (claimedAuthority === "model generated" || claimedAuthority === "inferred") {
    lifecycle = "candidate";
    evidenceLevel = "inferred";
  } else if (claimedAuthority === "behavioral observation") {
    lifecycle = "active";
    evidenceLevel = "observed";
  } else if (claimedAuthority === "caregiver reported" || claimedAuthority === "CHW reported") {
    lifecycle = "active";
    evidenceLevel = "reported";
  }

  return {
    allowed: true,
    promoted_authority: claimedAuthority,
    lifecycle_state: lifecycle,
    evidence_level: evidenceLevel,
    audit_reason: `Authority verified via source '${sourceClass}' with assigned authority '${claimedAuthority}'.`,
    is_guard_violation: false,
  };
}

/**
 * Creates an immutable provenance record.
 */
export function createProvenanceRecord(
  provenance_id: string,
  source_class: MemoryAuthorityClass,
  author_actor_id: string,
  options: {
    verification_status?: EvidenceVerificationLevel;
    verified_by?: string;
    certifier_role?: any;
    context_hash?: string;
  } = {}
): ProvenanceRecord {
  return {
    provenance_id,
    source_class,
    author_actor_id,
    verification_status: options.verification_status || "observed",
    verified_by: options.verified_by,
    timestamp: new Date().toISOString(),
    certifier_role: options.certifier_role,
    context_hash: options.context_hash,
  };
}
