import { MemoryItem, FamiliarRoute } from "../../domain/cognitive-experience";

export interface EntityExposureRecord {
  entity_id: string;
  entity_type: "memory" | "family_member" | "place" | "route";
  person_id: string;
  session_id: string;
  timestamp: string;
}

export interface FreshnessPolicy {
  memory_cooldown_sessions: number; // minimum sessions before memory can repeat as primary focus (default: 2)
  family_member_max_consecutive: number; // max consecutive sessions featuring same family member (default: 2)
  route_cooldown_sessions: number; // minimum sessions before same route can repeat (default: 2)
}

export class MemoryFreshnessTracker {
  private exposures: EntityExposureRecord[] = [];
  private readonly policy: FreshnessPolicy;

  constructor(policy?: Partial<FreshnessPolicy>) {
    this.policy = {
      memory_cooldown_sessions: 2,
      family_member_max_consecutive: 2,
      route_cooldown_sessions: 2,
      ...policy,
    };
  }

  /**
   * Record that entities were featured in a game session
   */
  public recordSessionExposures(
    personId: string,
    sessionId: string,
    entities: {
      memory_ids?: string[];
      family_members?: string[];
      place_ids?: string[];
      route_id?: string;
    }
  ): void {
    const now = new Date().toISOString();

    entities.memory_ids?.forEach((id) => {
      this.exposures.unshift({ entity_id: id, entity_type: "memory", person_id: personId, session_id: sessionId, timestamp: now });
    });

    entities.family_members?.forEach((name) => {
      this.exposures.unshift({ entity_id: name.toLowerCase(), entity_type: "family_member", person_id: personId, session_id: sessionId, timestamp: now });
    });

    entities.place_ids?.forEach((id) => {
      this.exposures.unshift({ entity_id: id, entity_type: "place", person_id: personId, session_id: sessionId, timestamp: now });
    });

    if (entities.route_id) {
      this.exposures.unshift({ entity_id: entities.route_id, entity_type: "route", person_id: personId, session_id: sessionId, timestamp: now });
    }
  }

  /**
   * Check if a memory is on cooldown
   */
  public isMemoryOnCooldown(personId: string, memoryId: string): boolean {
    const memoryExposures = this.exposures.filter(
      (e) => e.person_id === personId && e.entity_type === "memory" && e.entity_id === memoryId
    );
    if (memoryExposures.length === 0) return false;

    // Check distinct recent sessions
    const recentSessionIds = this.getRecentSessionIds(personId, this.policy.memory_cooldown_sessions);
    return memoryExposures.some((e) => recentSessionIds.includes(e.session_id));
  }

  /**
   * Check if a family member has been overused consecutively
   */
  public isFamilyMemberFatigued(personId: string, memberName: string): boolean {
    const normalized = memberName.toLowerCase();
    const recentSessions = this.getRecentSessionIds(personId, this.policy.family_member_max_consecutive);
    if (recentSessions.length < this.policy.family_member_max_consecutive) return false;

    // Check if the member was present in ALL recent sessions
    const countInRecent = recentSessions.filter((sessId) =>
      this.exposures.some(
        (e) => e.person_id === personId && e.session_id === sessId && e.entity_type === "family_member" && e.entity_id === normalized
      )
    ).length;

    return countInRecent >= this.policy.family_member_max_consecutive;
  }

  /**
   * Check if a route is on cooldown
   */
  public isRouteOnCooldown(personId: string, routeId: string): boolean {
    const routeExposures = this.exposures.filter(
      (e) => e.person_id === personId && e.entity_type === "route" && e.entity_id === routeId
    );
    if (routeExposures.length === 0) return false;

    const recentSessionIds = this.getRecentSessionIds(personId, this.policy.route_cooldown_sessions);
    return routeExposures.some((e) => recentSessionIds.includes(e.session_id));
  }

  /**
   * Filter and re-rank candidate memories for fresh diversity
   */
  public filterAndRankMemories(personId: string, candidates: MemoryItem[]): MemoryItem[] {
    return [...candidates].sort((a, b) => {
      const aCooldown = this.isMemoryOnCooldown(personId, a.id) ? 1 : 0;
      const bCooldown = this.isMemoryOnCooldown(personId, b.id) ? 1 : 0;
      if (aCooldown !== bCooldown) return aCooldown - bCooldown; // non-cooldown first

      // Check family member fatigue
      const aFatigued = (a.people_refs || []).some((p) => this.isFamilyMemberFatigued(personId, p.name || p.person_entity_id)) ? 1 : 0;
      const bFatigued = (b.people_refs || []).some((p) => this.isFamilyMemberFatigued(personId, p.name || p.person_entity_id)) ? 1 : 0;
      if (aFatigued !== bFatigued) return aFatigued - bFatigued;

      // Prefer memories with fewer historical exposures
      const aCount = this.exposures.filter((e) => e.person_id === personId && e.entity_id === a.id).length;
      const bCount = this.exposures.filter((e) => e.person_id === personId && e.entity_id === b.id).length;
      return aCount - bCount;
    });
  }

  /**
   * Filter and re-rank candidate routes for fresh rotation
   */
  public filterAndRankRoutes(personId: string, routes: FamiliarRoute[]): FamiliarRoute[] {
    return [...routes].sort((a, b) => {
      const aCooldown = this.isRouteOnCooldown(personId, a.id) ? 1 : 0;
      const bCooldown = this.isRouteOnCooldown(personId, b.id) ? 1 : 0;
      if (aCooldown !== bCooldown) return aCooldown - bCooldown;

      const aCount = this.exposures.filter((e) => e.person_id === personId && e.entity_id === a.id).length;
      const bCount = this.exposures.filter((e) => e.person_id === personId && e.entity_id === b.id).length;
      return aCount - bCount;
    });
  }

  private getRecentSessionIds(personId: string, limit: number): string[] {
    const sessions: string[] = [];
    for (const exp of this.exposures) {
      if (exp.person_id === personId && !sessions.includes(exp.session_id)) {
        sessions.push(exp.session_id);
        if (sessions.length >= limit) break;
      }
    }
    return sessions;
  }

  public getMemoryFreshness(personId: string, memoryId: string) {
    const isCooldown = this.isMemoryOnCooldown(personId, memoryId);
    const count = this.exposures.filter((e) => e.person_id === personId && e.entity_id === memoryId).length;
    return {
      memory_id: memoryId,
      is_on_cooldown: isCooldown,
      exposure_count: count,
      cooldown_score: isCooldown ? 0.2 : Math.max(0.5, 1.0 - count * 0.1),
    };
  }

  public getFamilyMemberFreshness(personId: string, memberName: string) {
    const norm = memberName.toLowerCase();
    const isFatigued = this.isFamilyMemberFatigued(personId, memberName);
    const count = this.exposures.filter((e) => e.person_id === personId && e.entity_id === norm).length;
    return {
      member_name: memberName,
      is_fatigued: isFatigued,
      exposure_count: count,
    };
  }

  public clear(): void {
    this.exposures = [];
  }
}

export const memoryFreshnessTracker = new MemoryFreshnessTracker();
