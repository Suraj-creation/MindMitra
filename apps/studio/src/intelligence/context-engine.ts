/**
 * MindMitra Context Engine — Personal Context Pack Assembly & L0-L9 Hierarchy
 *
 * Constructs a bounded, server-authoritative PersonalContextPack:
 * - Authoritative server time in Tezpur, Assam (Asia/Kolkata)
 * - Evaluates Context Hierarchy L0 - L9 based on query intent & UI context
 * - Enforces Memory Firewall and Consent Grants
 * - Caps token expenditure within the attention budget
 */

import {
  ContextLayerId,
  InteractionContext,
  PersonalContextPack,
  CONTEXT_LAYERS,
  QueryShape,
} from "./types";
import { substrateRepo } from "../substrate/repository";

export class ContextEngine {
  /**
   * Resolves a server-authoritative PersonalContextPack tailored strictly
   * to the current interaction and attention budget (Phase 3 Gateway compatibility).
   */
  public async resolveContextPack(
    personId: string,
    actorId: string,
    interactionContext: Partial<InteractionContext> | { surface?: string; current_entity?: string; current_task?: string },
    queryText?: string,
    queryShape?: QueryShape,
    maxTokenBudget?: number
  ): Promise<PersonalContextPack> {
    const fullContext: InteractionContext = {
      current_surface: (interactionContext as any).surface || (interactionContext as any).current_surface || "day",
      current_route: (interactionContext as any).current_route || "/person/day",
      current_component: (interactionContext as any).current_component || "MainView",
      current_entity: (interactionContext as any).current_entity,
      current_media: (interactionContext as any).current_media,
      current_activity: (interactionContext as any).current_activity || (interactionContext as any).current_task,
      current_activity_session: (interactionContext as any).current_activity_session,
      current_activity_step: (interactionContext as any).current_activity_step,
      current_question_attempt: (interactionContext as any).current_question_attempt,
      current_goal: (interactionContext as any).current_goal,
      current_modality: (interactionContext as any).current_modality || "multimodal",
      current_language: (interactionContext as any).current_language || "as",
      current_session: (interactionContext as any).current_session || `ses_${Date.now()}`,
    };

    return this.assembleContextPack(personId, actorId, fullContext, {
      queryText,
      queryShape,
      maxTokenBudget: maxTokenBudget || 800,
    });
  }

  /**
   * Assembles a server-authoritative PersonalContextPack tailored strictly
   * to the current interaction and attention budget.
   */
  public async assembleContextPack(
    personId: string,
    actorId: string,
    interactionContext: InteractionContext,
    options: {
      queryText?: string;
      queryShape?: QueryShape;
      maxTokenBudget?: number;
    } = {}
  ): Promise<PersonalContextPack> {
    const {
      queryText = "",
      queryShape = "general_companion",
      maxTokenBudget = 800,
    } = options;

    // 1. Authoritative Server Time in Assam (Asia/Kolkata)
    const now = new Date();
    const formatterDate = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formatterTime = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const hourInAssam = parseInt(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).format(now),
      10
    );

    let timeOfDay: "morning" | "midday" | "afternoon" | "evening" | "night" = "morning";
    if (hourInAssam >= 5 && hourInAssam < 11) timeOfDay = "morning";
    else if (hourInAssam >= 11 && hourInAssam < 14) timeOfDay = "midday";
    else if (hourInAssam >= 14 && hourInAssam < 17) timeOfDay = "afternoon";
    else if (hourInAssam >= 17 && hourInAssam < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    const authoritativeTime = {
      iso: now.toISOString(),
      formatted_date: formatterDate.format(now),
      formatted_time: formatterTime.format(now),
      time_of_day: timeOfDay,
      day_of_week: new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
      }).format(now),
      timezone: "Asia/Kolkata (IST)",
      region_label: "Tezpur, Sonitpur District, Assam",
    };

    // 2. Determine necessary context layers according to Query Shape and Attention Budget
    const selectedLayers = this.selectLayersForQueryShape(queryShape, maxTokenBudget);

    // 3. Independent Authorization & Consent Check (Backend Authority)
    const canAccessMemories = await substrateRepo.checkConsent(
      personId,
      actorId,
      "life_story_memory",
      "personalisation"
    );
    const canAccessMedia = await substrateRepo.checkConsent(
      personId,
      actorId,
      "media_assets",
      "personalisation"
    );
    const canAccessTelemetry = await substrateRepo.checkConsent(
      personId,
      actorId,
      "activity_telemetry",
      "personalisation"
    );

    // 4. Fetch Identity & Core Profile
    const person = await substrateRepo.getPerson(personId);
    const identity = {
      person_id: personId,
      display_name: person?.display_name || "Purnima",
      honorific: person?.cultural_profile?.address_honorific || "Purnima baideu",
      preferred_language: person?.preferred_language || "as",
      language_tier: person?.language_tier || "tier_1",
      cultural_profile: {
        region: person?.cultural_profile?.region || "Tezpur, Sonitpur, Assam",
        traditions: person?.cultural_profile?.traditions || ["Rongali Bihu", "Til Pitha making", "Brahmaputra walks"],
        music_preferences: person?.cultural_profile?.music_preferences || ["Assamese flute ragas", "Goalpariya folk songs"],
        dietary_rituals: person?.cultural_profile?.dietary_rituals || ["Cardamom ginger tea at 4:00 PM"],
      },
    };

    // 5. Populate Layers selectively based on selection
    // Recent interactions (L3)
    let recentInteractions: any[] = [];
    if (selectedLayers.includes("L3_recent_events") && canAccessTelemetry.allowed) {
      const events = await substrateRepo.getInteractionEvents(personId, 5);
      recentInteractions = events.map((e) => ({
        surface: e.surface,
        event_type: e.event_type,
        timestamp: e.timestamp,
        result: e.result,
      }));
    }

    // Personal world: contacts & places (L5)
    let relevantPeople: any[] = [];
    let relevantPlaces: any[] = [];
    if (selectedLayers.includes("L5_personal_world")) {
      const contacts = await substrateRepo.getContacts(personId);
      relevantPeople = contacts.map((c) => ({
        contact_id: c.contact_id,
        name: c.full_name,
        call_name: c.call_name,
        kinship: c.kinship,
        relationship_label: c.relationship_label,
        location: c.location,
        phone: c.phone,
        call_priority: c.call_priority,
        familiarity_score: c.familiarity_score,
      }));

      const places = await substrateRepo.getPlaces(personId);
      relevantPlaces = places.map((p) => ({
        place_id: p.place_id,
        name: p.name,
        significance: p.significance,
        emotional_valence: p.emotional_valence,
      }));
    }

    // Governed memories (L7)
    let relevantMemories: any[] = [];
    if (selectedLayers.includes("L7_long_term_memories") && canAccessMemories.allowed) {
      const memories = await substrateRepo.getMemories(personId);
      relevantMemories = memories.slice(0, 6).map((m) => ({
        memory_id: m.memory_id,
        statement: m.statement,
        category: m.category,
        authority_class: m.authority_class,
        verification: m.evidence_level,
        confidence: m.confidence,
      }));
    }

    // Temporal & Life events (L3 & L8)
    let relevantEvents: any[] = [];
    if (selectedLayers.includes("L3_recent_events") || selectedLayers.includes("L8_future_context")) {
      const events = await substrateRepo.getTemporalEvents(personId);
      relevantEvents = events.map((e) => ({
        event_id: e.temporal_event_id,
        title: e.title,
        description: e.description,
        temporal_frame: e.temporal_frame,
        time_label: e.scheduled_at,
        status: e.event_status,
      }));
    }

    // Media (L5 / Media retrieval)
    let relevantMedia: any[] = [];
    if (canAccessMedia.allowed && (queryShape === "show_media" || interactionContext.current_surface === "life")) {
      const mediaList = await substrateRepo.getMedia(personId);
      relevantMedia = mediaList.slice(0, 4).map((m) => ({
        media_id: m.media_id,
        b2_key: m.b2_object_key,
        description: m.semantic_description,
        historical_date: m.historical_date_text || "",
        depicted_people: m.depicted_person_ids,
      }));
    }

    // Routines & reminders (Structured / L3 / L8)
    const allRoutines = await substrateRepo.getRoutines(personId);
    const routines = allRoutines.map((r) => ({
      routine_id: r.routine_id,
      title: r.title,
      time_of_day: r.time_of_day,
      scheduled_time: r.scheduled_time,
      assistance_strategy: r.preferred_assistance_strategy,
    }));

    const reminders = [
      {
        reminder_id: "rem:cardamom_tea",
        title: "Afternoon Cardamom Tea with Anu",
        due_time: "4:00 PM",
        target: "Tea Routine",
        is_urgent: false,
      },
      {
        reminder_id: "rem:rina_call",
        title: "Granddaughter Rina call from Guwahati",
        due_time: "5:00 PM",
        target: "Rina",
        is_urgent: false,
      },
    ];

    // Capabilities (L6)
    let capabilities: any[] = [];
    if (selectedLayers.includes("L6_capability_preferences")) {
      const caps = await substrateRepo.listCapabilityStates(personId);
      capabilities = caps.map((c) => ({
        domain: c.domain,
        conditioned_estimate: c.conditioned_estimate,
        confidence: 1 - c.uncertainty,
        trend: c.trend,
      }));
    }

    // Assistance Policies (L6)
    let assistancePolicies: any[] = [];
    if (selectedLayers.includes("L6_capability_preferences")) {
      const policies = await substrateRepo.listAssistancePolicies(personId);
      assistancePolicies = policies.map((p) => ({
        task_domain: p.task_domain,
        preferred_strategy: p.preferred_strategy,
        fallback_strategy: p.fallback_strategy,
        confidence: p.confidence,
      }));
    }

    // Future context (L8)
    const futureContext = [
      {
        title: "Granddaughter Rina video call",
        scheduled_at: "Today at 5:00 PM",
        status: "confirmed",
        relationship_involved: "Granddaughter (Rina)",
      },
      {
        title: "Son Bikash festival visit from Bengaluru",
        scheduled_at: "Upcoming Bihu festival",
        status: "expected",
        relationship_involved: "Son (Bikash)",
      },
    ];

    return {
      context_version: "2.0-pcm-grounded",
      person_id: personId,
      actor_id: actorId,
      generated_at: now.toISOString(),
      authoritative_time: authoritativeTime,
      interaction_context: interactionContext,
      selected_layers: selectedLayers,
      identity,
      conversation_state: {
        session_id: interactionContext.current_session,
        active_turns_count: 3,
        compressed_summary: "Purnima baideu greeted warmly in her courtyard; feels peaceful and safe.",
        recent_dialogue: [],
      },
      recent_interactions: recentInteractions,
      relevant_people: relevantPeople,
      relevant_places: relevantPlaces,
      relevant_memories: relevantMemories,
      relevant_events: relevantEvents,
      relevant_media: relevantMedia,
      routines,
      reminders,
      capabilities,
      assistance_policies: assistancePolicies,
      future_context: futureContext,
      permissions_and_consent: {
        actor_role: actorId.includes("anu") ? "primary_caregiver" : "person",
        authorized_categories: [
          canAccessMemories.allowed ? "life_story_memory" : null,
          canAccessMedia.allowed ? "media_assets" : null,
          canAccessTelemetry.allowed ? "activity_telemetry" : null,
        ].filter(Boolean) as string[],
        firewall_status: canAccessMemories.allowed ? "passed" : "partially_masked",
      },
      uncertainty: [
        {
          domain: "memory_free_recall",
          level: 0.35,
          note: "Free recall unprompted may experience mild hesitation; visual recognition cues recommended.",
        },
      ],
      conflicts: [],
      safety_constraints: [
        "DO_NOT_MAKE_DIAGNOSTIC_CLAIMS",
        "DO_NOT_ADJUST_MEDICATIONS",
        "PRESERVE_EMOTIONAL_DIGNITY_AND_REPETITION_GRACE",
        "NO_MODEL_GENERATED_FACT_SILENT_AUTHORITY",
      ],
    };
  }

  /**
   * Selects required Context Hierarchy layers (L0-L9) according to query shape
   * while enforcing token budget constraints.
   */
  public selectLayersForQueryShape(shape: QueryShape, tokenBudget: number): ContextLayerId[] {
    // Base essential layers always included
    const baseLayers: ContextLayerId[] = [
      "L0_current_utterance",
      "L1_current_conversation",
      "L2_current_ui_context",
    ];

    let querySpecificLayers: ContextLayerId[] = [];

    switch (shape) {
      case "what_now":
        // time + routine + recent activity + capability + preference + future context + goal
        querySpecificLayers = [
          "L3_recent_events",
          "L6_capability_preferences",
          "L8_future_context",
        ];
        break;

      case "who_is":
        // graph + verified relationship + relevant context
        querySpecificLayers = [
          "L5_personal_world",
          "L7_long_term_memories",
        ];
        break;

      case "what_did_i_do":
        // temporal events + activity episodes + conversation events + routine events
        querySpecificLayers = [
          "L3_recent_events",
          "L4_experience_memory",
        ];
        break;

      case "show_media":
        // lexical/semantic intent + graph + event + media retrieval
        querySpecificLayers = [
          "L5_personal_world",
          "L7_long_term_memories",
        ];
        break;

      case "activity_help":
        // routines + steps + capabilities + assistance policies
        querySpecificLayers = [
          "L4_experience_memory",
          "L6_capability_preferences",
        ];
        break;

      case "general_companion":
      default:
        querySpecificLayers = [
          "L5_personal_world",
          "L8_future_context",
        ];
        break;
    }

    const combined = Array.from(new Set([...baseLayers, ...querySpecificLayers]));

    // Check budget
    let totalTokens = 0;
    const budgetedLayers: ContextLayerId[] = [];
    for (const layerId of combined) {
      const spec = CONTEXT_LAYERS[layerId];
      if (totalTokens + spec.estimated_tokens <= tokenBudget || spec.always_included) {
        budgetedLayers.push(layerId);
        totalTokens += spec.estimated_tokens;
      }
    }

    return budgetedLayers;
  }
}

export const contextEngine = new ContextEngine();
