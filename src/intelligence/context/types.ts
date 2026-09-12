// Personal Context Engine -- typed contracts for the conversational Person App
// backend (Prompt 3). Distinct from src/intelligence/retrieval/types.ts, which
// is the games/orchestration contract layer bound to cognitive-engine.ts's
// in-memory store. This one is bound to the real Neon-backed
// person-data-repository.ts (see personal-context-engine.ts for why the two
// paths haven't been merged yet -- a documented gap, not an oversight).

export type IntentClass =
  | "INFORMATION"
  | "MEMORY"
  | "ORIENTATION"
  | "TEMPORAL"
  | "ROUTINE"
  | "ACTIVITY"
  | "GAME"
  | "GAME_ASSISTANCE"
  | "PEOPLE"
  | "MEDIA"
  | "REMINDER"
  | "NAVIGATION"
  | "HELP"
  | "HUMAN_ASSISTANCE"
  | "SOCIAL"
  | "CONVERSATIONAL"
  | "ACTION";

/**
 * Whether the question is about the world (answerable from model knowledge),
 * about this person's life (answerable only from retrieved evidence), or
 * resolvable only against whatever is currently on screen.
 */
export type QueryMode = "GENERAL" | "PERSONAL" | "CONTEXTUAL";

export type TemporalScope = "TODAY" | "TOMORROW" | "YESTERDAY" | "NOW" | "NONE";

export interface ClassifiedIntent {
  intent: IntentClass;
  confidence: number;
  matched_rule: string;
  mode: QueryMode;
  temporal_scope: TemporalScope;
  /** "What ELSE do I have to do" -- subtract what has already been covered. */
  continuation: boolean;
  /** False for general knowledge and pleasantries: do not pay for retrieval. */
  requires_retrieval: boolean;
}

/**
 * How well-supported an answer is. Kept internal -- only CONFIRMED/SUPPORTED
 * may be spoken as plain fact; everything else has to be hedged or declined
 * out loud rather than smoothed into confident prose (Prompt 4 §22).
 */
export type Confidence = "CONFIRMED" | "SUPPORTED" | "AMBIGUOUS" | "UNKNOWN" | "CONFLICTING" | "UNAVAILABLE";

export interface PersonExperienceProjection {
  person: {
    id: string;
    display_name: string;
    honorific: string;
    preferred_language: string;
    culture: string;
  };
  currentContext: {
    now_iso: string;
    time_of_day: "early_morning" | "morning" | "afternoon" | "evening" | "night";
    page: string;
    /** IANA zone the day boundaries were computed in. */
    time_zone?: string;
    /** Which day this projection was built for, resolved from the query. */
    scope?: TemporalScope;
    /** Human day label for the resolved scope, e.g. "today" / "tomorrow". */
    scope_label?: string;
  };
  today: {
    /**
     * Events still ahead. Retained under this name because it is the whole
     * existing contract surface for "what is coming up"; `day` below carries
     * the full picture including what has already happened.
     */
    upcoming: Array<{
      id: string;
      title: string;
      person_name: string | null;
      relationship: string | null;
      location_name: string;
      scheduled_at: string;
    }>;
  };
  /**
   * The resolved day, in the person's own timezone, split by what has already
   * happened and what has not. "What ELSE do I have to do today" is answerable
   * only from this split -- the old projection had no notion of it at all.
   */
  day?: {
    events: Array<{
      id: string;
      title: string;
      person_name: string | null;
      location_name: string;
      scheduled_at: string;
      status: string;
      past: boolean;
      preparation_steps: string[];
    }>;
    routines: Array<{ id: string; title: string; time_of_day: string | null; description: string | null; past: boolean }>;
    medications: Array<{ id: string; name: string; scheduled_time: string; taken: boolean }>;
    /** Whether day retrieval ran at all. False for general-knowledge turns. */
    attempted: boolean;
    /** True when the day genuinely holds no records -- not merely unretrieved. */
    nothing_recorded: boolean;
    /** True only when retrieval was attempted and FAILED -- "I can't check", not "there's nothing". */
    not_retrieved: boolean;
  };
  people: Array<{
    id: string;
    name: string;
    relationship: string;
    verified: boolean;
    phone: string | null;
    /** Reachable in an emergency. Ordered by closeness, caregiver first. */
    is_emergency?: boolean;
    closeness?: string | null;
  }>;
  memories: Array<{ id: string; title: string; description: string; approximate_period: string; verified: boolean }>;
  places: Array<{ id: string; name: string; significance: string | null; verified: boolean }>;
  preferences: Array<{ dimension: string; value: unknown; evidence_source: string }>;
  consent: {
    personalisation_active: boolean;
  };
  safety: {
    firewall_passed: boolean;
    cross_person_blocked: number;
    stale_or_cancelled_blocked: number;
    private_or_sensitive_blocked: number;
    unverified_flagged: number;
  };
}

export interface EvidenceClaim {
  fact_id: string;
  text: string;
  source_type: string;
  verified: boolean;
  confidence: number;
  timestamp: string;
}

export interface EvidencePack {
  facts: EvidenceClaim[];
  generated_at: string;
  consent_ok: boolean;
}
