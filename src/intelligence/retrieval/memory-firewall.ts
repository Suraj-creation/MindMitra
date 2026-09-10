import {
  ConsentScope,
  FamiliarPlace,
  FamiliarRoute,
  FutureEvent,
  MediaAsset,
  MemoryExperienceHistory,
  MemoryItem,
  MemoryVerificationStatus,
  SensitivityLevel,
  VisibilityScope,
} from "../../domain/cognitive-experience";
import { BoundedRetrievedObject, PreservedMetadata } from "./types";

export interface MemoryFirewallAudit {
  passed: boolean;
  target_person_id: string;
  violations: string[];
  private_items_blocked: number;
  sensitive_items_blocked: number;
  stale_items_blocked: number;
  cancelled_events_blocked: number;
  low_confidence_routes_excluded: number;
  unverified_claims_flagged: number;
  cross_person_blocked: number;
  cooldown_suppressed_count: number;
}

export interface FirewallOptions {
  allowUnverifiedClaimsWithLabel?: boolean;
  includeHighSensitivity?: boolean;
  targetConsentScopes?: ConsentScope[]; // defaults to ["games", "reminiscence", "all"]
  repetitionCooldownHours?: number;     // defaults to 24 hours
}

export class MemoryFirewall {
  /**
   * Calculates object freshness and age in days.
   */
  public static calculateFreshness(createdAt: string, updatedAt?: string): {
    created_at: string;
    updated_at: string;
    age_days: number;
    is_stale: boolean;
  } {
    const createdTime = new Date(createdAt || Date.now()).getTime();
    const updatedTime = new Date(updatedAt || createdAt || Date.now()).getTime();
    const now = Date.now();
    const ageDays = Math.max(0, Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24)));
    // Consider items older than 365 days without update as stale unless high confidence
    const isStale = ageDays > 365;
    return {
      created_at: new Date(createdTime).toISOString(),
      updated_at: new Date(updatedTime).toISOString(),
      age_days: ageDays,
      is_stale: isStale,
    };
  }

  /**
   * Creates preserved metadata wrapper for any raw entity.
   */
  public static wrapPreservedMetadata<T extends {
    id: string;
    person_id: string;
    source?: string;
    created_by?: string;
    provenance_id?: string;
    verification_status?: MemoryVerificationStatus;
    confidence?: number;
    consent_scope?: ConsentScope;
    visibility_scope?: VisibilityScope;
    sensitivity?: SensitivityLevel;
    created_at?: string;
    updated_at?: string;
  }>(
    entity: T,
    type: PreservedMetadata["type"]
  ): BoundedRetrievedObject<T> {
    const isVerified =
      entity.verification_status === "caregiver_verified" ||
      entity.verification_status === "chw_verified" ||
      entity.verification_status === "clinician_verified";

    const isUnverifiedClaim =
      entity.verification_status === "unverified" ||
      entity.source === "person" && !isVerified;

    const freshness = MemoryFirewall.calculateFreshness(
      entity.created_at || new Date().toISOString(),
      entity.updated_at
    );

    const metadata: PreservedMetadata = {
      id: entity.id,
      type,
      provenance: entity.provenance_id || entity.created_by || entity.source || "unknown_provenance",
      verification: entity.verification_status || "unverified",
      confidence: isUnverifiedClaim ? Math.min(entity.confidence ?? 0.5, 0.5) : (entity.confidence ?? 1.0),
      consent: entity.consent_scope || "person_only",
      freshness,
      sensitivity: entity.sensitivity || "low",
      visibility: entity.visibility_scope || "private",
      is_verified: isVerified,
      unverified_claim: isUnverifiedClaim,
    };

    return {
      metadata,
      data: entity,
    };
  }

  /**
   * Checks if an entity is in repetition cooldown based on recent experience history.
   * Returns cooldown score (1.0 = completely fresh, 0.0 = played within last few hours).
   */
  public static evaluateCooldown(
    entityId: string,
    history: MemoryExperienceHistory[],
    cooldownHours: number = 24
  ): { isSuppressed: boolean; cooldownScore: number; lastPlayedHoursAgo: number | null } {
    const recentPlays = history
      .filter((h) => h.target_entity_id === entityId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    if (recentPlays.length === 0) {
      return { isSuppressed: false, cooldownScore: 1.0, lastPlayedHoursAgo: null };
    }

    const lastPlayTime = new Date(recentPlays[0].recorded_at).getTime();
    const hoursAgo = (Date.now() - lastPlayTime) / (1000 * 60 * 60);

    if (hoursAgo < cooldownHours) {
      // Under cooldown: scale cooldown score linearly with elapsed time
      const score = Math.max(0.1, hoursAgo / cooldownHours);
      return { isSuppressed: true, cooldownScore: score, lastPlayedHoursAgo: hoursAgo };
    }

    return { isSuppressed: false, cooldownScore: 1.0, lastPlayedHoursAgo: hoursAgo };
  }

  /**
   * Enforces Memory Firewall on memories for a specific person.
   * - Strict cross-person isolation
   * - Strict consent gating (default: games, reminiscence, all)
   * - Strict sensitivity gating (blocks high sensitivity unless explicitly requested)
   * - Unverified claims labelling (or filtering)
   * - Overused memory suppression
   */
  public static filterMemories(
    memories: MemoryItem[],
    targetPersonId: string,
    history: MemoryExperienceHistory[] = [],
    options?: FirewallOptions
  ): {
    approved: Array<BoundedRetrievedObject<MemoryItem> & { cooldown_suppressed: boolean; cooldown_score: number }>;
    audit: MemoryFirewallAudit;
  } {
    const allowedConsent = options?.targetConsentScopes || ["games", "reminiscence", "all"];
    const includeSensitive = options?.includeHighSensitivity ?? false;
    const allowUnverifiedWithLabel = options?.allowUnverifiedClaimsWithLabel ?? false;
    const cooldownHours = options?.repetitionCooldownHours ?? 24;

    const audit: MemoryFirewallAudit = {
      passed: true,
      target_person_id: targetPersonId,
      violations: [],
      private_items_blocked: 0,
      sensitive_items_blocked: 0,
      stale_items_blocked: 0,
      cancelled_events_blocked: 0,
      low_confidence_routes_excluded: 0,
      unverified_claims_flagged: 0,
      cross_person_blocked: 0,
      cooldown_suppressed_count: 0,
    };

    const approved: Array<BoundedRetrievedObject<MemoryItem> & { cooldown_suppressed: boolean; cooldown_score: number }> = [];

    for (const mem of memories) {
      // 1. Cross-Person Isolation
      if (mem.person_id !== targetPersonId) {
        audit.cross_person_blocked++;
        audit.violations.push(`Cross-person breach attempt blocked: entity ${mem.id} belongs to ${mem.person_id}`);
        continue;
      }

      // 2. Consent Scope Gating
      if (!allowedConsent.includes(mem.consent_scope)) {
        audit.private_items_blocked++;
        continue;
      }

      // 3. Sensitivity Gating
      if (mem.sensitivity === "high" && !includeSensitive) {
        audit.sensitive_items_blocked++;
        continue;
      }

      // 4. Verification Check
      const isUnverified = mem.verification_status === "unverified" || (mem.confidence || 0) < 0.75;
      if (isUnverified) {
        audit.unverified_claims_flagged++;
        if (!allowUnverifiedWithLabel) {
          continue; // Exclude unverified claim if labels not explicitly permitted
        }
      }

      // 5. Wrap with preserved metadata
      const wrapped = MemoryFirewall.wrapPreservedMetadata(mem, "memory");

      // 6. Evaluate Cooldown
      const cooldown = MemoryFirewall.evaluateCooldown(mem.id, history, cooldownHours);
      if (cooldown.isSuppressed) {
        audit.cooldown_suppressed_count++;
      }

      approved.push({
        ...wrapped,
        cooldown_suppressed: cooldown.isSuppressed,
        cooldown_score: cooldown.cooldownScore,
      });
    }

    audit.passed = audit.violations.length === 0;
    return { approved, audit };
  }

  /**
   * Enforces Memory Firewall on routes for Game 8.
   * - Low-confidence routes (< 0.75 or unverified) are NOT treated as verified
   * - Strict cross-person isolation
   * - Consent and sensitivity gating
   */
  public static filterRoutes(
    routes: FamiliarRoute[],
    targetPersonId: string,
    options?: FirewallOptions
  ): {
    verifiedRoutes: BoundedRetrievedObject<FamiliarRoute>[];
    unverifiedRoutes: BoundedRetrievedObject<FamiliarRoute>[];
    audit: MemoryFirewallAudit;
  } {
    const allowedConsent = options?.targetConsentScopes || ["games", "reminiscence", "all"];
    const includeSensitive = options?.includeHighSensitivity ?? false;

    const audit: MemoryFirewallAudit = {
      passed: true,
      target_person_id: targetPersonId,
      violations: [],
      private_items_blocked: 0,
      sensitive_items_blocked: 0,
      stale_items_blocked: 0,
      cancelled_events_blocked: 0,
      low_confidence_routes_excluded: 0,
      unverified_claims_flagged: 0,
      cross_person_blocked: 0,
      cooldown_suppressed_count: 0,
    };

    const verifiedRoutes: BoundedRetrievedObject<FamiliarRoute>[] = [];
    const unverifiedRoutes: BoundedRetrievedObject<FamiliarRoute>[] = [];

    for (const route of routes) {
      // 1. Cross-person check
      if (route.person_id !== targetPersonId) {
        audit.cross_person_blocked++;
        audit.violations.push(`Cross-person route blocked: ${route.id} for ${route.person_id}`);
        continue;
      }

      // 2. Consent check
      if (!allowedConsent.includes(route.consent_scope)) {
        audit.private_items_blocked++;
        continue;
      }

      // 3. Sensitivity check
      if (route.sensitivity === "high" && !includeSensitive) {
        audit.sensitive_items_blocked++;
        continue;
      }

      const wrapped = MemoryFirewall.wrapPreservedMetadata(route, "route");

      // 4. Verification and Confidence threshold
      const isTrulyVerified =
        (route.verification_status === "caregiver_verified" ||
          route.verification_status === "chw_verified" ||
          route.verification_status === "clinician_verified") &&
        (route.confidence || 0) >= 0.75;

      if (isTrulyVerified) {
        verifiedRoutes.push(wrapped);
      } else {
        audit.low_confidence_routes_excluded++;
        audit.unverified_claims_flagged++;
        wrapped.metadata.unverified_claim = true;
        unverifiedRoutes.push(wrapped);
      }
    }

    audit.passed = audit.violations.length === 0;
    return { verifiedRoutes, unverifiedRoutes, audit };
  }

  /**
   * Enforces Memory Firewall on places.
   */
  public static filterPlaces(
    places: FamiliarPlace[],
    targetPersonId: string,
    options?: FirewallOptions
  ): {
    approved: BoundedRetrievedObject<FamiliarPlace>[];
    audit: MemoryFirewallAudit;
  } {
    const allowedConsent = options?.targetConsentScopes || ["games", "reminiscence", "all"];
    const includeSensitive = options?.includeHighSensitivity ?? false;

    const audit: MemoryFirewallAudit = {
      passed: true,
      target_person_id: targetPersonId,
      violations: [],
      private_items_blocked: 0,
      sensitive_items_blocked: 0,
      stale_items_blocked: 0,
      cancelled_events_blocked: 0,
      low_confidence_routes_excluded: 0,
      unverified_claims_flagged: 0,
      cross_person_blocked: 0,
      cooldown_suppressed_count: 0,
    };

    const approved: BoundedRetrievedObject<FamiliarPlace>[] = [];

    for (const place of places) {
      if (place.person_id !== targetPersonId) {
        audit.cross_person_blocked++;
        audit.violations.push(`Cross-person place blocked: ${place.id} for ${place.person_id}`);
        continue;
      }

      if (!allowedConsent.includes(place.consent_scope)) {
        audit.private_items_blocked++;
        continue;
      }

      if (place.sensitivity === "high" && !includeSensitive) {
        audit.sensitive_items_blocked++;
        continue;
      }

      const isUnverified = place.verification_status === "unverified" || (place.confidence || 0) < 0.75;
      if (isUnverified) {
        audit.unverified_claims_flagged++;
        if (!options?.allowUnverifiedClaimsWithLabel) {
          continue;
        }
      }

      approved.push(MemoryFirewall.wrapPreservedMetadata(place, "place"));
    }

    audit.passed = audit.violations.length === 0;
    return { approved, audit };
  }

  /**
   * Filters Future Events: Excludes cancelled or expired/stale events.
   */
  public static filterFutureEvents(
    events: FutureEvent[],
    targetPersonId: string
  ): {
    approved: BoundedRetrievedObject<FutureEvent>[];
    cancelledBlocked: number;
    staleBlocked: number;
  } {
    let cancelledBlocked = 0;
    let staleBlocked = 0;
    const now = Date.now();
    const approved: BoundedRetrievedObject<FutureEvent>[] = [];

    for (const evt of events) {
      if (evt.person_id !== targetPersonId) continue;

      // 1. Exclude cancelled events
      if (evt.status === "cancelled") {
        cancelledBlocked++;
        continue;
      }

      // 2. Exclude stale/expired events
      if (evt.valid_until && new Date(evt.valid_until).getTime() < now) {
        staleBlocked++;
        continue;
      }

      approved.push(MemoryFirewall.wrapPreservedMetadata(evt, "future_event"));
    }

    return { approved, cancelledBlocked, staleBlocked };
  }

  /**
   * Filters Media Assets: Excludes archived media assets.
   */
  public static filterMediaAssets(
    assets: MediaAsset[],
    targetPersonId: string
  ): BoundedRetrievedObject<MediaAsset>[] {
    return assets
      .filter((a) => a.person_id === targetPersonId && a.status === "active")
      .map((a) => MemoryFirewall.wrapPreservedMetadata(a, "media"));
  }
}
