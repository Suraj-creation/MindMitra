/**
 * Intent & Goal Detection Engine (Phase 3)
 * Maps utterances, current UI context, and multi-turn goals to typed intents and active goals.
 */

import type {
  ConversationGoal,
  GoalStatus,
  UIClientContext,
  UtteranceIntentType,
} from "./types";

export interface IntentDetectionResult {
  intent: UtteranceIntentType;
  confidence: number;
  extracted_entities: {
    person_name?: string;
    person_id?: string;
    photo_topic?: string;
    memory_topic?: string;
    activity_name?: string;
    song_genre?: string;
    navigation_target?: string;
    temporal_anchor?: "today" | "yesterday" | "morning" | "evening";
  };
  goal_update?: {
    action: "create" | "activate" | "complete" | "abandon" | "none";
    goal: Partial<ConversationGoal>;
  };
  context_binding?: {
    bound_to: "current_photo" | "current_activity" | "current_person" | "none";
    entity_id?: string;
    details?: any;
  };
}

export class IntentGoalDetector {
  /**
   * Evaluates an utterance against patterns, grammar, and current UI context.
   */
  public detect(
    utterance: string,
    uiContext: UIClientContext = {},
    activeGoals: ConversationGoal[] = []
  ): IntentDetectionResult {
    const raw = (utterance || "").trim();
    const lower = raw.toLowerCase();

    // ── 1. CURRENT-CONTEXT SHORT-CIRCUITING ──────────────────────────────────
    // "Who is this?", "Tell me about this photo", "Who am I looking at?"
    if (
      uiContext.current_photo_id ||
      (uiContext.surface === "life" && uiContext.current_entity)
    ) {
      if (
        lower.match(/\b(who is this|who's this|who is that|who is in this|tell me about this photo|what photo is this|where was this)\b/i) ||
        (lower.startsWith("who") && lower.length < 25)
      ) {
        return {
          intent: "ask_about_memory",
          confidence: 0.96,
          extracted_entities: {
            photo_topic: uiContext.current_photo_id || uiContext.current_entity,
          },
          context_binding: {
            bound_to: "current_photo",
            entity_id: uiContext.current_photo_id || uiContext.current_entity,
            details: { surface: uiContext.surface },
          },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "ask_about_memory",
              title: "Identify person/place in currently viewed photograph",
              status: "active",
              target_entity: uiContext.current_photo_id || uiContext.current_entity,
            },
          },
        };
      }
    }

    // Inside an ongoing activity and saying: "Help me", "What do I do?", "I'm stuck"
    if (
      uiContext.activity_state ||
      uiContext.surface === "activity" ||
      uiContext.current_task
    ) {
      if (
        lower.match(/\b(help me|what do i do|i'm stuck|im stuck|can't do it|too hard|show me how|what next)\b/i)
      ) {
        return {
          intent: "get_help",
          confidence: 0.98,
          extracted_entities: {
            activity_name: uiContext.activity_state?.title || uiContext.current_task || "flower_garland",
          },
          context_binding: {
            bound_to: "current_activity",
            entity_id: uiContext.activity_state?.activity_id || "active_session",
            details: uiContext.activity_state,
          },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "continue_activity",
              title: `Assistance on step ${uiContext.activity_state?.step ?? 1} of ${uiContext.activity_state?.title || "activity"}`,
              status: "active",
              target_action: "scaffold_step",
            },
          },
        };
      }

      if (lower.match(/\b(stop|leave|i want to quit|done with this|close activity|finish)\b/i)) {
        return {
          intent: "stop_leave_activity",
          confidence: 0.95,
          extracted_entities: {
            activity_name: uiContext.activity_state?.title || uiContext.current_task,
          },
          goal_update: {
            action: "complete",
            goal: {
              intent_type: "stop_leave_activity",
              title: "Conclude active activity session",
              status: "completed",
            },
          },
        };
      }
    }

    // ── 2. "SHOW ME..." FIRST-CLASS NAVIGATION GRAMMAR ──────────────────────
    if (lower.startsWith("show me") || lower.startsWith("show ") || lower.startsWith("let me see")) {
      const targetQuery = lower.replace(/^(show me|show|let me see)\s+/i, "").trim();

      // "Show me Rina" / "Show me Bikash" / "Show me Anu"
      if (targetQuery.includes("rina")) {
        return {
          intent: "see_person",
          confidence: 0.98,
          extracted_entities: { person_name: "Rina", person_id: "person:contact:rina" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "see_person",
              title: "View granddaughter Rina's contact and connection card",
              status: "active",
              target_entity: "person:contact:rina",
            },
          },
        };
      }
      if (targetQuery.includes("anu")) {
        return {
          intent: "see_person",
          confidence: 0.98,
          extracted_entities: { person_name: "Anu", person_id: "actor:anu" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "see_person",
              title: "View daughter Anu's contact card",
              status: "active",
              target_entity: "actor:anu",
            },
          },
        };
      }
      if (targetQuery.includes("bikash") || targetQuery.includes("son")) {
        return {
          intent: "see_person",
          confidence: 0.95,
          extracted_entities: { person_name: "Bikash", person_id: "person:contact:bikash" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "see_person",
              title: "View son Bikash's contact details",
              status: "active",
              target_entity: "person:contact:bikash",
            },
          },
        };
      }

      // "Show me my wedding" / "Show me photos of Tezpur"
      if (targetQuery.includes("wedding") || targetQuery.includes("marriage")) {
        return {
          intent: "find_photo",
          confidence: 0.97,
          extracted_entities: { photo_topic: "wedding", memory_topic: "wedding_anniversary_1974" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "find_photo",
              title: "View wedding memory photograph and story",
              status: "active",
              target_action: "show_photo",
            },
          },
        };
      }
      if (targetQuery.includes("photo") || targetQuery.includes("pictures") || targetQuery.includes("bihu") || targetQuery.includes("album")) {
        return {
          intent: "find_photo",
          confidence: 0.94,
          extracted_entities: { photo_topic: targetQuery },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "find_photo",
              title: "Browse family photo album",
              status: "active",
              target_action: "show_photo",
            },
          },
        };
      }

      // "Show me what I did yesterday"
      if (targetQuery.includes("yesterday")) {
        return {
          intent: "see_what_happened_yesterday",
          confidence: 0.98,
          extracted_entities: { temporal_anchor: "yesterday" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "see_what_happened_yesterday",
              title: "Review yesterday's timeline and calming routines",
              status: "active",
              target_action: "show_timeline",
            },
          },
        };
      }

      // "Show me my song" / "Show me music"
      if (targetQuery.includes("song") || targetQuery.includes("music") || targetQuery.includes("flute") || targetQuery.includes("raga")) {
        return {
          intent: "play_music",
          confidence: 0.96,
          extracted_entities: { song_genre: "bamboo_flute" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "play_music",
              title: "Play soothing Assamese bamboo flute",
              status: "active",
              target_action: "play_music",
            },
          },
        };
      }

      // "Show me what I need to do" / "Show me reminders"
      if (targetQuery.includes("need to do") || targetQuery.includes("schedule") || targetQuery.includes("routine") || targetQuery.includes("reminders") || targetQuery.includes("plan")) {
        return {
          intent: "talk_about_today",
          confidence: 0.96,
          extracted_entities: { temporal_anchor: "today" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "talk_about_today",
              title: "Check daily schedule and upcoming milestones",
              status: "active",
              target_action: "show_routine",
            },
          },
        };
      }

      // "Show me something fun" / "Show me an activity"
      if (targetQuery.includes("something fun") || targetQuery.includes("activity") || targetQuery.includes("garland") || targetQuery.includes("game")) {
        return {
          intent: "start_activity",
          confidence: 0.94,
          extracted_entities: { activity_name: "marigold_garland" },
          goal_update: {
            action: "create",
            goal: {
              intent_type: "start_activity",
              title: "Begin gentle flower garland activity",
              status: "active",
              target_action: "start_activity",
            },
          },
        };
      }
    }

    // ── 3. INTENT PATTERN MATRIX ────────────────────────────────────────────

    // CALL SOMEONE
    if (lower.match(/\b(call|phone|ring|dial|speak with|talk to)\b/i)) {
      if (lower.includes("rina") || lower.includes("granddaughter")) {
        return {
          intent: "call_someone",
          confidence: 0.98,
          extracted_entities: { person_name: "Rina", person_id: "person:contact:rina" },
        };
      }
      if (lower.includes("anu") || lower.includes("daughter")) {
        return {
          intent: "call_someone",
          confidence: 0.98,
          extracted_entities: { person_name: "Anu", person_id: "actor:anu" },
        };
      }
      if (lower.includes("bikash") || lower.includes("son")) {
        return {
          intent: "call_someone",
          confidence: 0.95,
          extracted_entities: { person_name: "Bikash", person_id: "person:contact:bikash" },
        };
      }
      if (lower.includes("doctor") || lower.includes("dr") || lower.includes("barua")) {
        return {
          intent: "call_someone",
          confidence: 0.95,
          extracted_entities: { person_name: "Dr. Barua", person_id: "actor:dr_barua" },
        };
      }
      return {
        intent: "call_someone",
        confidence: 0.85,
        extracted_entities: {},
      };
    }

    // TALK ABOUT TODAY / DAILY ROUTINE
    if (
      lower.match(/\b(today|what day is it|what time is it|what's happening today|what is planned|schedule|daily plan)\b/i) ||
      (lower.includes("tea") && lower.includes("when")) ||
      (lower.includes("rina") && lower.includes("calling"))
    ) {
      return {
        intent: "talk_about_today",
        confidence: 0.95,
        extracted_entities: { temporal_anchor: "today" },
        goal_update: {
          action: "create",
          goal: {
            intent_type: "talk_about_today",
            title: "Understand today's daytime milestones",
            status: "active",
          },
        },
      };
    }

    // YESTERDAY
    if (lower.includes("yesterday") || lower.includes("last night")) {
      return {
        intent: "see_what_happened_yesterday",
        confidence: 0.96,
        extracted_entities: { temporal_anchor: "yesterday" },
      };
    }

    // PLAY MUSIC
    if (lower.match(/\b(play|sing|music|song|flute|raga|kirtan|tune)\b/i)) {
      return {
        intent: "play_music",
        confidence: 0.95,
        extracted_entities: {
          song_genre: lower.includes("kirtan") ? "naam_kirtan" : lower.includes("folk") ? "bihu_folk" : "bamboo_flute",
        },
      };
    }

    // START / PLAY ACTIVITY
    if (lower.match(/\b(activity|garland|weave|flowers|tea making|puzzle|start doing|let's do)\b/i)) {
      return {
        intent: "start_activity",
        confidence: 0.92,
        extracted_entities: {
          activity_name: lower.includes("tea") ? "afternoon_tea" : "marigold_garland",
        },
      };
    }

    // REMEMBER SOMETHING / ASK ABOUT A MEMORY
    if (
      lower.match(/\b(remember|memory|tell me about|how did|wedding|bihu|ancestral|garden|nahor|mango tree|brahmaputra)\b/i)
    ) {
      return {
        intent: "ask_about_memory",
        confidence: 0.92,
        extracted_entities: {
          memory_topic: lower.includes("wedding")
            ? "wedding"
            : lower.includes("nahor")
            ? "nahor_tree"
            : lower.includes("garden")
            ? "ancestral_garden"
            : "general_reminiscence",
        },
      };
    }

    // ORIENT TO SITUATION / GET HELP
    if (
      lower.match(/\b(where am i|who are you|am i safe|what is this place|i feel confused|scared|lost|anxious|help)\b/i)
    ) {
      return {
        intent: "orient_to_situation",
        confidence: 0.98,
        extracted_entities: {},
        goal_update: {
          action: "create",
          goal: {
            intent_type: "orient_to_situation",
            title: "Calm orientation to home environment and safety in Tezpur",
            status: "active",
          },
        },
      };
    }

    // REMINDERS
    if (lower.match(/\b(remind me|reminder|don't let me forget|set a reminder)\b/i)) {
      return {
        intent: "create_reminder",
        confidence: 0.93,
        extracted_entities: {},
      };
    }

    // NAVIGATE SOMEWHERE
    if (lower.match(/\b(go to|open|take me to|navigate to)\b/i)) {
      let target = "day";
      if (lower.includes("photo") || lower.includes("memory") || lower.includes("life")) target = "life";
      if (lower.includes("people") || lower.includes("contact") || lower.includes("family")) target = "people";
      if (lower.includes("activity") || lower.includes("game")) target = "activity";
      if (lower.includes("help") || lower.includes("support")) target = "help";

      return {
        intent: "navigate_somewhere",
        confidence: 0.92,
        extracted_entities: { navigation_target: target },
      };
    }

    // Default conversational query
    return {
      intent: "unknown_conversational",
      confidence: 0.7,
      extracted_entities: {},
    };
  }
}

export const intentGoalDetector = new IntentGoalDetector();
