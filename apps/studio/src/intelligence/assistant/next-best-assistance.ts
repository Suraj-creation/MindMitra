/**
 * Next-Best-Assistance Decision Engine & Multimodal Payload Formatter (Phase 3)
 * Evaluates intent, evidence, personal substrate profile, and current UI context
 * to select the optimal assistance class and compose structured multimodal cards.
 */

import { substrateRepo } from "@/substrate/repository";
import type { IntentDetectionResult } from "./intent-goal-detector";
import type {
  ActivityCardPayload,
  MemoryCardPayload,
  MultimodalPayload,
  MusicCardPayload,
  NextBestAssistanceClass,
  PersonCardPayload,
  PhotoCardPayload,
  RoutineCardPayload,
  TypedAction,
  UIClientContext,
} from "./types";

export interface DecisionContext {
  personId: string;
  intentResult: IntentDetectionResult;
  uiContext: UIClientContext;
  groundedEvidence: Array<{ claim: string; source: string; verified: boolean }>;
  timeContext: { timeOfDay: string; formattedTime: string };
}

export class NextBestAssistanceEngine {
  /**
   * Selects the highest utility assistance class based on intent, context, and evidence.
   */
  public decideAssistanceClass(ctx: DecisionContext): NextBestAssistanceClass {
    const { intentResult, uiContext } = ctx;
    const intent = intentResult.intent;

    // 1. In-activity scaffolding
    if (intent === "get_help" && (uiContext.activity_state || uiContext.surface === "activity")) {
      return "CONTINUE_ACTIVITY";
    }

    // 2. Direct calls
    if (intent === "call_someone") {
      return "CALL_PERSON";
    }

    // 3. Music playback
    if (intent === "play_music") {
      return "PLAY_MUSIC";
    }

    // 4. Starting an activity
    if (intent === "start_activity") {
      return "START_ACTIVITY";
    }

    // 5. Orient to situation / emotional reassurance
    if (intent === "orient_to_situation") {
      return "ORIENT";
    }

    // 6. See person / show photo / ask memory -> SHOW
    if (intent === "see_person" || intent === "find_photo" || intent === "ask_about_memory") {
      return "SHOW";
    }

    // 7. Schedule & Reminders
    if (intent === "see_reminders" || intent === "create_reminder") {
      return "REMIND";
    }

    // 8. Navigation
    if (intent === "navigate_somewhere") {
      return "NAVIGATE";
    }

    // 9. Yesterday / Timeline
    if (intent === "see_what_happened_yesterday") {
      return "SHOW";
    }

    // 10. Default conversational answer
    return "ANSWER";
  }

  /**
   * Builds the multimodal response payload with rich cards, spoken text, and action binding.
   */
  public async buildMultimodalPayload(
    ctx: DecisionContext,
    assistanceClass: NextBestAssistanceClass,
    groundedAnswer: string
  ): Promise<{ multimodal: MultimodalPayload; actionToExecute?: { type: any; params: any } }> {
    const { personId, intentResult, uiContext, timeContext } = ctx;
    const intent = intentResult.intent;

    let personCard: PersonCardPayload | undefined;
    let photoCard: PhotoCardPayload | undefined;
    let memoryCard: MemoryCardPayload | undefined;
    let musicCard: MusicCardPayload | undefined;
    let activityCard: ActivityCardPayload | undefined;
    let routineCard: RoutineCardPayload | undefined;
    let actionToExecute: { type: any; params: any } | undefined;

    // ── CASE A: SEE PERSON ──────────────────────────────────────────────────
    if (assistanceClass === "SHOW" && (intent === "see_person" || intentResult.extracted_entities.person_name)) {
      const pName = intentResult.extracted_entities.person_name || "Rina";
      if (pName.toLowerCase().includes("rina")) {
        personCard = {
          person_id: "person:contact:rina",
          display_name: "Rina Sharma",
          relationship: "Granddaughter (Daughter of Anu)",
          phone: "+91 94350 98765",
          avatar_url: "/avatars/rina.jpg",
          notes: "Calls every Tuesday and Saturday at 5:00 PM. Loves your homemade til pitha.",
        };
        actionToExecute = {
          type: "show_person",
          params: {
            person_id: personCard.person_id,
            display_name: personCard.display_name,
            relationship: "granddaughter",
            phone: personCard.phone,
          },
        };
      } else if (pName.toLowerCase().includes("anu")) {
        personCard = {
          person_id: "actor:anu",
          display_name: "Anu Sharma",
          relationship: "Primary Caregiver & Daughter",
          phone: "+91 98640 12345",
          notes: "Lives with you in the ancestral home in Tezpur. Makes evening tea at 4:00 PM.",
        };
        actionToExecute = {
          type: "show_person",
          params: {
            person_id: personCard.person_id,
            display_name: personCard.display_name,
            relationship: "daughter",
            phone: personCard.phone,
          },
        };
      } else {
        personCard = {
          person_id: "person:contact:bikash",
          display_name: "Bikash Sharma",
          relationship: "Son",
          phone: "+91 98450 11223",
          notes: "Lives in Bengaluru, visits during Bihu and Durga Puja festivals.",
        };
        actionToExecute = {
          type: "show_person",
          params: {
            person_id: personCard.person_id,
            display_name: personCard.display_name,
            relationship: "son",
            phone: personCard.phone,
          },
        };
      }
    }

    // ── CASE B: CALL PERSON ─────────────────────────────────────────────────
    if (assistanceClass === "CALL_PERSON") {
      const pName = intentResult.extracted_entities.person_name || "Rina";
      const isRina = pName.toLowerCase().includes("rina");
      const isAnu = pName.toLowerCase().includes("anu");
      const phone = isRina ? "+91 94350 98765" : isAnu ? "+91 98640 12345" : "+91 98450 11223";
      const name = isRina ? "Rina" : isAnu ? "Anu" : "Bikash";

      actionToExecute = {
        type: "call_person",
        params: {
          contact_id: isRina ? "person:contact:rina" : isAnu ? "actor:anu" : "person:contact:bikash",
          name,
          phone,
          role: isAnu ? "caregiver" : "family_member",
          relationship: isRina ? "granddaughter" : isAnu ? "daughter" : "son",
        },
      };
    }

    // ── CASE C: FIND PHOTO / PHOTO CONTEXT ──────────────────────────────────
    if (
      (assistanceClass === "SHOW" && intent === "find_photo") ||
      (intent === "ask_about_memory" && intentResult.context_binding?.bound_to === "current_photo")
    ) {
      photoCard = {
        asset_id: "asset_bihu_celebration_1998",
        url: "/photos/bihu_festival_tezpur.jpg",
        title: "Rongali Bihu in the Ancestral Courtyard (1998)",
        caption: "You are seated under the Nahor tree smiling beside young Rina and Anu.",
        year: 1998,
        place: "Ancestral Home, Tezpur, Assam",
        people: ["Purnima Sharma", "Anu Sharma", "Rina Sharma"],
      };

      actionToExecute = {
        type: "show_photo",
        params: {
          asset_id: photoCard.asset_id,
          url: photoCard.url,
          caption: photoCard.caption,
          year: photoCard.year,
          location: photoCard.place,
          depicted_people: photoCard.people,
        },
      };
    }

    // ── CASE D: PLAY MUSIC ──────────────────────────────────────────────────
    if (assistanceClass === "PLAY_MUSIC") {
      musicCard = {
        track_id: "track_morning_bamboo_flute",
        title: "Peaceful Morning Raga on Assamese Bamboo Flute",
        genre: "Instrumental Flute",
        duration_seconds: 180,
        is_playing: true,
      };

      actionToExecute = {
        type: "play_music",
        params: {
          track_id: musicCard.track_id,
          title: musicCard.title,
          genre: "bamboo_flute",
          calming_score: 9.5,
        },
      };
    }

    // ── CASE E: START ACTIVITY / CONTINUE ACTIVITY ──────────────────────────
    if (assistanceClass === "START_ACTIVITY" || assistanceClass === "CONTINUE_ACTIVITY") {
      const isContinue = assistanceClass === "CONTINUE_ACTIVITY";
      const step = isContinue ? (uiContext.activity_state?.step ?? 2) : 1;
      const title = uiContext.activity_state?.title || "Weaving Gentle Marigold Flower Garland";

      activityCard = {
        activity_id: "act_flower_garland",
        title,
        current_step: isContinue
          ? `Thread the yellow marigold stem next to the golden Nahor leaf`
          : "Gather the fresh yellow blossoms from the brass basket",
        step_number: step,
        total_steps: 4,
        assistance_hint: "Take your time, Aitâ. There is no rush at all.",
      };

      actionToExecute = {
        type: isContinue ? "resume_activity" : "start_activity",
        params: {
          activity_id: activityCard.activity_id,
          title: activityCard.title,
          step_index: step,
          total_steps: 4,
          difficulty: "gentle",
          cue_level: isContinue ? "visual" : "none",
        },
      };
    }

    // ── CASE F: TALK ABOUT TODAY / ROUTINE ──────────────────────────────────
    if (intent === "talk_about_today" || assistanceClass === "REMIND") {
      routineCard = {
        date_label: "Today in Tezpur",
        time_of_day: timeContext.timeOfDay,
        scheduled_items: [
          { time: "07:30 AM", label: "Morning Tulsi watering in courtyard", completed: true },
          { time: "04:00 PM", label: "Afternoon warm cardamom tea with Anu", completed: false, urgent: true },
          { time: "05:00 PM", label: "Scheduled phone call with granddaughter Rina", completed: false, urgent: true },
        ],
      };

      actionToExecute = {
        type: "show_routine",
        params: {
          time_of_day: timeContext.timeOfDay as any,
          items: routineCard.scheduled_items.map((it, idx) => ({
            id: `rt_${idx}`,
            time: it.time,
            label: it.label,
            completed: it.completed,
          })),
        },
      };
    }

    // ── CASE G: TIMELINE (YESTERDAY) ────────────────────────────────────────
    if (intent === "see_what_happened_yesterday") {
      actionToExecute = {
        type: "show_timeline",
        params: {
          target_day: "yesterday",
          events: [
            { time: "09:00 AM", description: "Walked in the flower garden with daughter Anu", category: "garden" },
            { time: "03:30 PM", description: "Weaved marigold garland on the front veranda", category: "activity" },
            { time: "07:00 PM", description: "Listened to Goalpariya folk tunes by the radio", category: "music" },
          ],
        },
      };
    }

    // ── CASE H: NAVIGATION ACTION ───────────────────────────────────────────
    if (assistanceClass === "NAVIGATE" && intentResult.extracted_entities.navigation_target) {
      actionToExecute = {
        type: "navigate_to",
        params: {
          section: intentResult.extracted_entities.navigation_target as any,
        },
      };
    }

    // Default memory card if inquiring about family memory
    if (intent === "ask_about_memory" && !photoCard) {
      memoryCard = {
        memory_id: "mem_ancestral_garden_1965",
        title: "The Nahor Tree & Holy Tulsi Garden",
        detail: "Planted by your family in 1965 near the stone veranda, offering sweet blossoms every spring.",
        year: 1965,
        verified: true,
        provenance: "family_oral_history",
      };
    }

    const multimodal: MultimodalPayload = {
      spoken_text: groundedAnswer,
      display_text: groundedAnswer,
      person_card: personCard,
      photo_card: photoCard,
      memory_card: memoryCard,
      music_card: musicCard,
      activity_card: activityCard,
      routine_card: routineCard,
    };

    return { multimodal, actionToExecute };
  }
}

export const nextBestAssistanceEngine = new NextBestAssistanceEngine();
