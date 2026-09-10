import {
  ConsentScope,
  MemorySource,
  MemoryVerificationStatus,
  SensitivityLevel,
  TemporalEvent,
  TemporalEventStatus,
  TemporalEventType,
} from "../../domain/cognitive-experience";

// ── Realistic Initial Temporal Events for Purnima (Tezpur, Assam) ───────────

export function getReferenceNow(): Date {
  // Anchored to runtime time or current UTC/IST
  return new Date();
}

/**
 * Computes human relative day ("yesterday" | "today" | "tomorrow" | "past" | "future")
 * based on date arithmetic in local timezone.
 */
export function getRelativeTemporalFrame(
  targetDateIso: string,
  referenceDate: Date = getReferenceNow()
): "yesterday" | "today" | "tomorrow" | "past" | "future" {
  const target = new Date(targetDateIso);
  const ref = new Date(referenceDate);

  // Normalize to local calendar day (midnight)
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();

  const diffDays = Math.round((targetMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return "yesterday";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < -1) return "past";
  return "future";
}

/**
 * Creates sample dates offset from reference date.
 */
function offsetDate(hours: number, referenceDate: Date = getReferenceNow()): string {
  return new Date(referenceDate.getTime() + hours * 3600 * 1000).toISOString();
}

function offsetDays(days: number, hourOfDay: number = 10, referenceDate: Date = getReferenceNow()): string {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + days);
  d.setHours(hourOfDay, 0, 0, 0);
  return d.toISOString();
}

export function createInitialTemporalEvents(refDate: Date = getReferenceNow()): TemporalEvent[] {
  return [
    // ── YESTERDAY EVENTS (RECENT / OCCURRED) ──────────────────────────────
    {
      id: "tevent:kamala_visit_yesterday",
      person_id: "person:purnima",
      event_type: "family_visit",
      title: "Kamala Visited the Courtyard with Sweet Pithas",
      assamese_title: "কমলাই চোতালত মিঠা পিঠা লৈ আহিছিল",
      description: "Lifelong neighbor and friend Kamala visited yesterday afternoon. You sat together on cane chairs enjoying freshly steamed tel pitha and fragrant black tea.",
      start_at: offsetDays(-1, 15, refDate), // Yesterday at 3:00 PM
      end_at: offsetDays(-1, 16, refDate),
      temporal_frame: "recent",
      status: "occurred",
      confidence: 1.0,
      verification_status: "caregiver_verified",
      provenance: "prov:caregiver_anu_daily_log_sep09",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(-2, 0, refDate),
      valid_until: offsetDays(30, 0, refDate),
      people_refs: [
        {
          person_entity_id: "entity:kamala",
          name: "Kamala Devi",
          relationship: "friend_neighbor",
          verified: true,
          photo_url: "/assets/images/courtyard_friends_memory.jpg",
        },
      ],
      media_refs: ["media:courtyard_tea_yesterday"],
      location: "Courtyard Cane Veranda, Tezpur",
      routine_anchor_id: "routine:afternoon_tea",
      created_at: offsetDays(-1, 17, refDate),
      updated_at: offsetDays(-1, 17, refDate),
    },
    {
      id: "tevent:morning_garden_yesterday",
      person_id: "person:purnima",
      event_type: "courtyard_routine",
      title: "Plucked Golden Marigolds for the Altar",
      assamese_title: "পূজাৰ বাবে গেন্দা ফুল চিঙা",
      description: "Walked gently along the garden path yesterday morning, gathering fresh yellow and orange marigold blossoms with daughter Anu.",
      start_at: offsetDays(-1, 8, refDate),
      end_at: offsetDays(-1, 9, refDate),
      temporal_frame: "recent",
      status: "occurred",
      confidence: 0.98,
      verification_status: "caregiver_verified",
      provenance: "prov:chw_morning_observation_sep09",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(-2, 0, refDate),
      people_refs: [
        {
          person_entity_id: "entity:anu",
          name: "Anu (Daughter)",
          relationship: "daughter",
          verified: true,
        },
      ],
      media_refs: ["media:tea_garden_morning"],
      location: "Courtyard Flower Beds, Tezpur",
      routine_anchor_id: "routine:morning_puja",
      created_at: offsetDays(-1, 10, refDate),
      updated_at: offsetDays(-1, 10, refDate),
    },

    // ── TODAY EVENTS (PRESENT / ROUTINE / CONFIRMED) ───────────────────────
    {
      id: "tevent:morning_tea_today",
      person_id: "person:purnima",
      event_type: "routine_tea",
      title: "Morning Assam CTC Tea with Fresh Tulsi",
      assamese_title: "তুলসী পাতৰ সৈতে ৰাতিপুৱাৰ চাহ",
      description: "Your peaceful morning routine on the front veranda, drinking hot golden Assam tea while listening to the courtyard birds.",
      start_at: offsetDays(0, 8, refDate),
      end_at: offsetDays(0, 9, refDate),
      temporal_frame: "present",
      status: "confirmed",
      confidence: 1.0,
      verification_status: "caregiver_verified",
      provenance: "prov:daily_routine_schedule",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(-30, 0, refDate),
      people_refs: [
        {
          person_entity_id: "entity:anu",
          name: "Anu (Daughter)",
          relationship: "daughter",
          verified: true,
        },
      ],
      media_refs: ["media:tea_ceremony_brass"],
      location: "Front Veranda, Tezpur",
      routine_anchor_id: "routine:morning_tea",
      created_at: offsetDays(0, 7, refDate),
      updated_at: offsetDays(0, 7, refDate),
    },
    {
      id: "tevent:afternoon_quiet_rest_today",
      person_id: "person:purnima",
      event_type: "courtyard_routine",
      title: "Afternoon Rest in the Shaded Courtyard",
      assamese_title: "দুপৰীয়া জিৰণি",
      description: "Resting comfortably on the bamboo lounger under the mango shade before afternoon tea.",
      start_at: offsetDays(0, 14, refDate),
      end_at: offsetDays(0, 15, refDate),
      temporal_frame: "present",
      status: "confirmed",
      confidence: 0.95,
      verification_status: "caregiver_verified",
      provenance: "prov:daily_routine_schedule",
      source: "system_obs",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(-30, 0, refDate),
      people_refs: [],
      media_refs: [],
      location: "Courtyard Shaded Mango Tree",
      routine_anchor_id: "routine:afternoon_rest",
      created_at: offsetDays(0, 7, refDate),
      updated_at: offsetDays(0, 7, refDate),
    },

    // ── TOMORROW EVENTS (FUTURE / CONFIRMED) ──────────────────────────────
    {
      id: "tevent:rina_visit_tomorrow",
      person_id: "person:purnima",
      event_type: "family_visit",
      title: "Granddaughter Rina Visiting from Guwahati for Tea",
      assamese_title: "নাতিনী ৰিনা গুৱাহাটীৰ পৰা আহিব",
      description: "Rina is taking the afternoon car from Guwahati to visit you in Tezpur. She is bringing fresh sandesh and will sit with you on the veranda.",
      start_at: offsetDays(1, 16, refDate), // Tomorrow at 4:00 PM
      end_at: offsetDays(1, 18, refDate),
      temporal_frame: "future",
      status: "confirmed",
      confidence: 1.0,
      verification_status: "caregiver_verified",
      provenance: "prov:rina_guwahati_trip_confirmation_phone",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(0, 0, refDate),
      valid_until: offsetDays(2, 0, refDate),
      people_refs: [
        {
          person_entity_id: "entity:rina",
          name: "Rina (Granddaughter)",
          relationship: "granddaughter",
          verified: true,
          photo_url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
        },
      ],
      media_refs: ["media:rina_portrait_2025"],
      location: "Courtyard Veranda, Tezpur",
      created_at: offsetDays(-1, 12, refDate),
      updated_at: offsetDays(0, 8, refDate),
    },
    {
      id: "tevent:bazaar_walk_tomorrow",
      person_id: "person:purnima",
      event_type: "market_trip",
      title: "Morning Market Trip with Son Bikash",
      assamese_title: "বিকাশৰ সৈতে পুৱাৰ বজাৰলৈ যোৱা",
      description: "Walking gently to the local Chowk Bazaar to pick fresh mint leaves and ginger.",
      start_at: offsetDays(1, 9, refDate),
      end_at: offsetDays(1, 10, refDate),
      temporal_frame: "future",
      status: "confirmed",
      confidence: 0.90,
      verification_status: "caregiver_verified",
      provenance: "prov:bikash_weekly_routine",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(0, 0, refDate),
      valid_until: offsetDays(2, 0, refDate),
      people_refs: [
        {
          person_entity_id: "entity:bikash",
          name: "Bikash (Son)",
          relationship: "son",
          verified: true,
        },
      ],
      media_refs: [],
      location: "Chowk Bazaar, Tezpur",
      created_at: offsetDays(-1, 12, refDate),
      updated_at: offsetDays(0, 8, refDate),
    },

    // ── CANCELLED & SENSITIVE CONTROLS (Must NEVER leak into active games) ─
    {
      id: "tevent:cancelled_clinic_visit",
      person_id: "person:purnima",
      event_type: "medical_appointment",
      title: "Postponed Blood Pressure Check at Tezpur Civil Hospital",
      assamese_title: "বাতিল হোৱা স্বাস্থ্য পৰীক্ষা",
      description: "Routine checkup postponed to next month by Dr. Barua.",
      start_at: offsetDays(1, 11, refDate),
      end_at: offsetDays(1, 12, refDate),
      temporal_frame: "future",
      status: "cancelled", // Strictly cancelled
      confidence: 1.0,
      verification_status: "clinician_verified",
      provenance: "prov:hospital_reschedule_sms",
      source: "clinician",
      consent_scope: "person_only",
      sensitivity: "medium",
      valid_from: offsetDays(-5, 0, refDate),
      valid_until: offsetDays(0, 0, refDate),
      people_refs: [],
      media_refs: [],
      location: "Tezpur Civil Hospital",
      created_at: offsetDays(-2, 0, refDate),
      updated_at: offsetDays(0, 0, refDate),
    },
    {
      id: "tevent:stale_past_market",
      person_id: "person:purnima",
      event_type: "market_trip",
      title: "Weekly Sonitpur Farmer's Haat from Last Week",
      assamese_title: "যোৱা সপ্তাহৰ সোনিতপুৰ হাট",
      description: "Farmer's market trip from last week.",
      start_at: offsetDays(-8, 9, refDate), // 8 days ago
      end_at: offsetDays(-8, 11, refDate),
      temporal_frame: "past",
      status: "occurred",
      confidence: 0.85,
      verification_status: "caregiver_verified",
      provenance: "prov:market_calendar_old",
      source: "caregiver",
      consent_scope: "all",
      sensitivity: "low",
      valid_from: offsetDays(-10, 0, refDate),
      valid_until: offsetDays(-7, 0, refDate), // Stale
      people_refs: [],
      media_refs: [],
      location: "Sonitpur Haat",
      created_at: offsetDays(-9, 0, refDate),
      updated_at: offsetDays(-7, 0, refDate),
    },
  ];
}

// ── In-Memory Temporal Event Store ──────────────────────────────────────────

export class TemporalEventStore {
  private static instance: TemporalEventStore;
  private events: Map<string, TemporalEvent> = new Map();
  private referenceTimeOffsetMs: number = 0;

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): TemporalEventStore {
    if (!TemporalEventStore.instance) {
      TemporalEventStore.instance = new TemporalEventStore();
    }
    return TemporalEventStore.instance;
  }

  public resetToDefaults(refDate: Date = getReferenceNow()): void {
    this.events.clear();
    const defaults = createInitialTemporalEvents(refDate);
    for (const evt of defaults) {
      this.events.set(evt.id, { ...evt });
    }
  }

  private seedDefaults(): void {
    this.resetToDefaults();
  }

  public getAllEvents(): TemporalEvent[] {
    return Array.from(this.events.values());
  }

  public getEventById(id: string): TemporalEvent | undefined {
    return this.events.get(id);
  }

  /**
   * Retrieves events for a specific person with strict temporal and status validation.
   */
  public getEventsForPerson(
    personId: string,
    options: {
      includeCancelled?: boolean;
      includeStale?: boolean;
      maxSensitivity?: SensitivityLevel;
      referenceDate?: Date;
    } = {}
  ): TemporalEvent[] {
    const {
      includeCancelled = false,
      includeStale = false,
      maxSensitivity = "low",
      referenceDate = getReferenceNow(),
    } = options;

    const refTime = referenceDate.getTime();
    const list: TemporalEvent[] = [];

    for (const evt of this.events.values()) {
      if (evt.person_id !== personId) continue;

      // 1. Cancelled event isolation
      if (!includeCancelled && evt.status === "cancelled") {
        continue;
      }

      // 2. Stale event isolation
      if (!includeStale && evt.valid_until) {
        const validUntil = new Date(evt.valid_until).getTime();
        if (validUntil < refTime && evt.status !== "occurred") {
          continue;
        }
      }

      // 3. Sensitivity gate
      if (maxSensitivity === "low" && evt.sensitivity !== "low") {
        continue;
      }
      if (maxSensitivity === "medium" && evt.sensitivity === "high") {
        continue;
      }

      // Dynamically compute and adjust relative temporal frame based on refDate
      const dynamicFrame = getRelativeTemporalFrame(evt.start_at, referenceDate);
      const cloned = { ...evt };

      // Reclassify frame dynamically if calendar day shifted
      if (dynamicFrame === "yesterday" && cloned.status === "occurred") {
        cloned.temporal_frame = "recent";
      } else if (dynamicFrame === "today") {
        cloned.temporal_frame = "present";
      } else if (dynamicFrame === "tomorrow") {
        cloned.temporal_frame = "future";
      }

      list.push(cloned);
    }

    // Sort by start_at ascending
    list.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    return list;
  }

  public addEvent(eventData: Partial<TemporalEvent> & { title: string; person_id: string }): TemporalEvent {
    const nowIso = new Date().toISOString();
    const id = eventData.id || `tevent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startAt = eventData.start_at || nowIso;
    const relativeFrame = getRelativeTemporalFrame(startAt);

    const newEvent: TemporalEvent = {
      id,
      person_id: eventData.person_id,
      event_type: eventData.event_type || "family_visit",
      title: eventData.title,
      assamese_title: eventData.assamese_title,
      description: eventData.description || "",
      start_at: startAt,
      end_at: eventData.end_at,
      temporal_frame:
        relativeFrame === "yesterday" ? "recent" : relativeFrame === "today" ? "present" : "future",
      status: eventData.status || "confirmed",
      confidence: eventData.confidence ?? 1.0,
      verification_status: eventData.verification_status || "caregiver_verified",
      provenance: eventData.provenance || "prov:caregiver_direct_entry",
      source: eventData.source || "caregiver",
      consent_scope: eventData.consent_scope || "all",
      sensitivity: eventData.sensitivity || "low",
      valid_from: eventData.valid_from || nowIso,
      valid_until: eventData.valid_until,
      people_refs: eventData.people_refs || [],
      media_refs: eventData.media_refs || [],
      location: eventData.location || "Tezpur Home",
      routine_anchor_id: eventData.routine_anchor_id,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.events.set(id, newEvent);
    return newEvent;
  }

  public updateEventStatus(id: string, status: TemporalEventStatus): TemporalEvent | null {
    const existing = this.events.get(id);
    if (!existing) return null;
    const updated: TemporalEvent = {
      ...existing,
      status,
      updated_at: new Date().toISOString(),
    };
    this.events.set(id, updated);
    return updated;
  }

  public updateEvent(id: string, updates: Partial<TemporalEvent>): TemporalEvent | null {
    const existing = this.events.get(id);
    if (!existing) return null;
    const updated: TemporalEvent = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.events.set(id, updated);
    return updated;
  }

  public deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }
}

export const temporalEventStore = TemporalEventStore.getInstance();
