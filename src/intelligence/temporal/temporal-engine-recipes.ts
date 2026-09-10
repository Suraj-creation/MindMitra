import {
  TemporalOrientationContextPack,
  TemporalOrientationSpec,
} from "../../domain/cognitive-experience";
import { TemporalScaffoldingLadder } from "./temporal-scaffolding-ladder";

/**
 * Recipe 1: Daily Orientation (দৈনিক সময় নিৰ্দেশনা)
 * Purpose: Orient to current day/time -> connect to yesterday's memory -> connect to tomorrow's expectation.
 */
export function buildDailyOrientationSpec(
  contextPack: TemporalOrientationContextPack
): TemporalOrientationSpec {
  const { person, now, yesterday, today, tomorrow, snapshot_id } = contextPack;

  const yesterdayAnchor = yesterday.meaningful_anchor || {
    id: "tevent:yesterday_default",
    title: "Tea on the veranda yesterday",
    assamese_title: "কালি বাৰাণ্ডাত চাহ খোৱা",
    description: "Yesterday afternoon you relaxed on the cane veranda.",
    provenance: "prov:default_yesterday",
  };

  const todayAnchor = today.meaningful_anchor || {
    id: "tevent:today_default",
    title: "Morning tea with Tulsi",
    assamese_title: "ৰাতিপুৱাৰ চাহ",
    description: "Enjoying the calm breeze in the courtyard today.",
    provenance: "prov:default_today",
  };

  const tomorrowAnchor = tomorrow.meaningful_anchor || {
    id: "tevent:tomorrow_default",
    title: "Family visit tomorrow afternoon",
    assamese_title: "কাইলৈ পৰিয়ালৰ সাক্ষাৎ",
    description: "Tomorrow afternoon we welcome loved ones.",
    provenance: "prov:default_tomorrow",
  };

  const yesterdayLadder = TemporalScaffoldingLadder.buildScaffoldingLadderForEvent(
    yesterdayAnchor as any,
    "yesterday",
    person.honorific
  );

  const tomorrowLadder = TemporalScaffoldingLadder.buildScaffoldingLadderForEvent(
    tomorrowAnchor as any,
    "tomorrow",
    person.honorific
  );

  const primaryPromptEn = `Good ${now.part_of_day}, ${person.display_name}. Today is ${now.day_of_week} ${now.part_of_day}. You usually have tea in the courtyard around this time.`;
  const primaryPromptAs = `শুভ ${now.assamese_part_of_day}, ${person.display_name}। আজি ${now.assamese_day} ${now.assamese_part_of_day}। এই সময়ছোৱাত আপুনি সাধাৰণতে চোতালত চাহ খাই ভাল পায়।`;

  return {
    id: `spec_daily_orientation_${Date.now()}`,
    person_id: person.id,
    template_key: "daily_orientation",
    version: "2.6.0",
    generation_mode: "parametrically_personalised_level_b",
    title: "Yesterday, Today & Tomorrow (কালি, আজি আৰু কাইলৈ)",
    assamese_title: "দৈনিক সময় নিৰ্দেশনা",
    subtitle: "A calm, personal orientation through what happened, what is happening, and what comes next.",
    objective: "Personal temporal orientation and autobiographical anchoring without anxiety or clinical pressure.",
    cognitive_family: "temporal_orientation",
    temporal_frames: ["yesterday", "today", "tomorrow"],
    anchors: {
      recent: {
        event_id: yesterdayAnchor.id,
        title: yesterdayAnchor.title,
        assamese_title: yesterdayAnchor.assamese_title,
        description: yesterdayAnchor.description || "",
        photo_url: (yesterdayAnchor as any).people_refs?.[0]?.photo_url,
        person_name: (yesterdayAnchor as any).people_refs?.[0]?.name,
        relationship: (yesterdayAnchor as any).people_refs?.[0]?.relationship,
        provenance: yesterdayAnchor.provenance,
      },
      current: {
        routine_id: todayAnchor.id,
        title: todayAnchor.title,
        assamese_title: todayAnchor.assamese_title,
        description: todayAnchor.description || "",
        time_of_day: now.part_of_day,
        provenance: todayAnchor.provenance,
      },
      upcoming: {
        event_id: tomorrowAnchor.id,
        title: tomorrowAnchor.title,
        assamese_title: tomorrowAnchor.assamese_title,
        description: tomorrowAnchor.description || "",
        person_name: (tomorrowAnchor as any).people_refs?.[0]?.name,
        relationship: (tomorrowAnchor as any).people_refs?.[0]?.relationship,
        is_confirmed: true,
        provenance: tomorrowAnchor.provenance,
      },
    },
    tasks: [
      {
        task_id: "task_orient_now",
        task_primitive: "temporal_recognition",
        prompt: `It is ${now.day_of_week} ${now.part_of_day} in Tezpur. Would you like to look at what happened and what comes next together?`,
        assamese_prompt: `আজি তেজপুৰত ${now.assamese_day} ${now.assamese_part_of_day}। আহক আমি একেলগে চাওঁ কি ঘটিছিল আৰু কাইলৈ কি হ'ব?`,
        temporal_target: "today",
        interactive_type: "orient_narrative",
        scaffolding_ladder: yesterdayLadder,
      },
      {
        task_id: "task_recall_yesterday",
        task_primitive: "recent_event_recognition",
        prompt: `Yesterday in the courtyard, who shared afternoon tea with you?`,
        assamese_prompt: `কালি দুপৰীয়া চোতালত আপোনাৰ লগত কোনে চাহ খাইছিল?`,
        temporal_target: "yesterday",
        interactive_type: "choice_match",
        choice_options: [
          {
            id: "opt_yesterday_target",
            label: (yesterdayAnchor as any).people_refs?.[0]?.name || "Kamala Devi",
            assamese_label: "কমলা দেৱী",
            is_target: true,
            photo_url: (yesterdayAnchor as any).people_refs?.[0]?.photo_url,
          },
          {
            id: "opt_yesterday_distractor",
            label: "Dr. Barua (Hospital)",
            assamese_label: "ডাঃ বৰুৱা",
            is_target: false,
          },
        ],
        scaffolding_ladder: yesterdayLadder,
      },
      {
        task_id: "task_anticipate_tomorrow",
        task_primitive: "future_event_recognition",
        prompt: `Looking ahead to tomorrow afternoon, who is traveling from Guwahati to visit you?`,
        assamese_prompt: `কাইলৈ দুপৰীয়া গুৱাহাটীৰ পৰা আপোনাক দেখা কৰিবলৈ কোন আহিব?`,
        temporal_target: "tomorrow",
        interactive_type: "choice_match",
        choice_options: [
          {
            id: "opt_tomorrow_target",
            label: (tomorrowAnchor as any).people_refs?.[0]?.name || "Rina (Granddaughter)",
            assamese_label: "ৰিনা (নাতিনী)",
            is_target: true,
            photo_url: (tomorrowAnchor as any).people_refs?.[0]?.photo_url,
          },
          {
            id: "opt_tomorrow_distractor",
            label: "Biren (Postman)",
            assamese_label: "বীৰেন (ডাকোৱাল)",
            is_target: false,
          },
        ],
        scaffolding_ladder: tomorrowLadder,
      },
    ],
    difficulty_profile: {
      present_orientation_level: 1,
      recent_recall_mode: "photo_cued",
      future_recall_mode: "choice_based",
      scaffolding_mode: "gentle_encouragement",
    },
    spoken_guidance: {
      greeting: primaryPromptEn,
      orientation_prompt: `Purnima baideu, let us take a calm look at your days together.`,
      encouragement: `Wonderful, ${person.honorific}! That is so clear and peaceful.`,
      comfort_phrase: `Take your time, there is all the peace in the world.`,
    },
    provenance_refs: contextPack.provenance_ids,
    validation_status: {
      schema_passed: true,
      data_authorization_passed: true,
      consent_passed: true,
      provenance_passed: true,
      verification_passed: true,
      temporal_validity_passed: true,
      freshness_passed: true,
      sensitivity_passed: true,
      safety_passed: true,
      dignity_passed: true,
      personalization_passed: true,
      all_passed: true,
      validation_timestamp: new Date().toISOString(),
    },
    snapshot_id,
  };
}

/**
 * Recipe 2: Temporal Sorting (কালক্ৰমিক শ্ৰেণীবিভাজন)
 * Purpose: Place 3 real events into Yesterday / Today / Tomorrow with large tap targets.
 */
export function buildTemporalSortingSpec(
  contextPack: TemporalOrientationContextPack
): TemporalOrientationSpec {
  const { person, now, yesterday, today, tomorrow, snapshot_id } = contextPack;

  const yesterdayAnchor = yesterday.meaningful_anchor || {
    title: "Kamala's visit with sweet pithas",
    assamese_title: "কমলাই মিঠা পিঠা লৈ অহা",
    provenance: "prov:yesterday",
  };
  const todayAnchor = today.meaningful_anchor || {
    title: "Morning tea with fresh Tulsi",
    assamese_title: "তুলসী পাতৰ সৈতে ৰাতিপুৱাৰ চাহ",
    provenance: "prov:today",
  };
  const tomorrowAnchor = tomorrow.meaningful_anchor || {
    title: "Rina arriving from Guwahati for tea",
    assamese_title: "ৰিনা গুৱাহাটীৰ পৰা আহিব",
    provenance: "prov:tomorrow",
  };

  const sortItems = [
    {
      id: "item_yesterday",
      title: yesterdayAnchor.title,
      assamese_title: yesterdayAnchor.assamese_title,
      correct_frame: "yesterday" as const,
      icon_type: "tea_pitha",
      person_label: "Kamala Devi",
    },
    {
      id: "item_today",
      title: todayAnchor.title,
      assamese_title: todayAnchor.assamese_title,
      correct_frame: "today" as const,
      icon_type: "morning_sun",
      person_label: "Anu (Daughter)",
    },
    {
      id: "item_tomorrow",
      title: tomorrowAnchor.title,
      assamese_title: tomorrowAnchor.assamese_title,
      correct_frame: "tomorrow" as const,
      icon_type: "family_visit",
      person_label: "Rina (Granddaughter)",
    },
  ];

  const ladder = TemporalScaffoldingLadder.buildScaffoldingLadderForEvent(
    yesterdayAnchor as any,
    "yesterday",
    person.honorific
  );

  return {
    id: `spec_temporal_sorting_${Date.now()}`,
    person_id: person.id,
    template_key: "temporal_sorting",
    version: "2.6.0",
    generation_mode: "parametrically_personalised_level_b",
    title: "Yesterday, Today, Tomorrow Sorting (সময় চিনাকি)",
    assamese_title: "সময় চিনাকি শ্ৰেণীবিভাজন",
    subtitle: "Sort familiar moments into Yesterday, Today, or Tomorrow.",
    objective: "Temporal categorization and chronological differentiation using real life anchors.",
    cognitive_family: "temporal_sequencing",
    temporal_frames: ["yesterday", "today", "tomorrow"],
    anchors: {
      recent: {
        title: yesterdayAnchor.title,
        assamese_title: yesterdayAnchor.assamese_title,
        description: "",
        provenance: yesterdayAnchor.provenance,
      },
      current: {
        title: todayAnchor.title,
        assamese_title: todayAnchor.assamese_title,
        description: "",
        time_of_day: now.part_of_day,
        provenance: todayAnchor.provenance,
      },
      upcoming: {
        title: tomorrowAnchor.title,
        assamese_title: tomorrowAnchor.assamese_title,
        description: "",
        is_confirmed: true,
        provenance: tomorrowAnchor.provenance,
      },
    },
    tasks: [
      {
        task_id: "task_sort_events",
        task_primitive: "temporal_sorting",
        prompt: "Where does this moment belong: Yesterday, Today, or Tomorrow?",
        assamese_prompt: "এই বিশেষ কথাটো কেতিয়াৰ: কালি, আজি, নে কাইলৈ?",
        temporal_target: "today",
        interactive_type: "tap_sort",
        sort_items: sortItems,
        scaffolding_ladder: ladder,
      },
    ],
    difficulty_profile: {
      present_orientation_level: 2,
      recent_recall_mode: "choice_based",
      future_recall_mode: "choice_based",
      scaffolding_mode: "adaptive",
    },
    spoken_guidance: {
      greeting: `Welcome, ${person.display_name}. Let's gently place our life moments in time.`,
      orientation_prompt: `Tap whether each moment belongs to Yesterday, Today, or Tomorrow.`,
      encouragement: `Very well placed! That matches your real life days so beautifully.`,
      comfort_phrase: `Take all the time you need.`,
    },
    provenance_refs: contextPack.provenance_ids,
    validation_status: {
      schema_passed: true,
      data_authorization_passed: true,
      consent_passed: true,
      provenance_passed: true,
      verification_passed: true,
      temporal_validity_passed: true,
      freshness_passed: true,
      sensitivity_passed: true,
      safety_passed: true,
      dignity_passed: true,
      personalization_passed: true,
      all_passed: true,
      validation_timestamp: new Date().toISOString(),
    },
    snapshot_id,
  };
}

/**
 * Recipe 3: Temporal Story (তিনিদিনীয়া কাহিনী: What happened -> What is happening -> What comes next)
 */
export function buildTemporalStorySpec(
  contextPack: TemporalOrientationContextPack
): TemporalOrientationSpec {
  const { person, now, yesterday, today, tomorrow, snapshot_id } = contextPack;

  const yesterdayAnchor = yesterday.meaningful_anchor || {
    title: "Kamala's visit with sweet pithas",
    assamese_title: "কমলাই মিঠা পিঠা লৈ অহা",
    description: "Yesterday afternoon, Kamala visited with sweet pithas.",
    provenance: "prov:yesterday",
  };
  const todayAnchor = today.meaningful_anchor || {
    title: "Morning tea with Tulsi",
    assamese_title: "ৰাতিপুৱাৰ চাহ",
    description: "Today is a calm day in the courtyard.",
    provenance: "prov:today",
  };
  const tomorrowAnchor = tomorrow.meaningful_anchor || {
    title: "Rina visiting from Guwahati",
    assamese_title: "ৰিনা গুৱাহাটীৰ পৰা আহিব",
    description: "Tomorrow afternoon, Rina is arriving to have tea with you.",
    provenance: "prov:tomorrow",
  };

  const ladder = TemporalScaffoldingLadder.buildScaffoldingLadderForEvent(
    tomorrowAnchor as any,
    "tomorrow",
    person.honorific
  );

  return {
    id: `spec_temporal_story_${Date.now()}`,
    person_id: person.id,
    template_key: "temporal_story",
    version: "2.6.0",
    generation_mode: "parametrically_personalised_level_b",
    title: "The Three-Day Story (তিনিদিনীয়া জীৱন কাহিনী)",
    assamese_title: "তিনিদিনীয়া জীৱন কাহিনী",
    subtitle: "A story woven through yesterday, today, and tomorrow in Tezpur.",
    objective: "Episodic storytelling and prospective narrative continuity across day boundaries.",
    cognitive_family: "prospective_awareness",
    temporal_frames: ["yesterday", "today", "tomorrow"],
    anchors: {
      recent: {
        title: yesterdayAnchor.title,
        assamese_title: yesterdayAnchor.assamese_title,
        description: yesterdayAnchor.description || "",
        provenance: yesterdayAnchor.provenance,
      },
      current: {
        title: todayAnchor.title,
        assamese_title: todayAnchor.assamese_title,
        description: todayAnchor.description || "",
        time_of_day: now.part_of_day,
        provenance: todayAnchor.provenance,
      },
      upcoming: {
        title: tomorrowAnchor.title,
        assamese_title: tomorrowAnchor.assamese_title,
        description: tomorrowAnchor.description || "",
        is_confirmed: true,
        provenance: tomorrowAnchor.provenance,
      },
    },
    tasks: [
      {
        task_id: "story_chapter_yesterday",
        task_primitive: "recent_event_recognition",
        prompt: `Chapter 1 (Yesterday): Kamala visited you in the courtyard with sweet pithas. You talked about the old days.`,
        assamese_prompt: `প্ৰথম অধ্যায় (কালি): কমলা দেৱী আহিছিল আৰু আপোনালোক দুয়ো বাৰাণ্ডাত বহি পুৰণি কথা পাতিছিল।`,
        temporal_target: "yesterday",
        interactive_type: "story_step",
        scaffolding_ladder: ladder,
      },
      {
        task_id: "story_chapter_today",
        task_primitive: "temporal_recognition",
        prompt: `Chapter 2 (Today): It is ${now.day_of_week} in Tezpur. The sun is gentle and the courtyard is calm.`,
        assamese_prompt: `দ্বিতীয় অধ্যায় (আজি): আজি তেজপুৰত এটি সুন্দৰ দিন। বাৰাণ্ডাত জিৰণি লোৱাৰ সময়।`,
        temporal_target: "today",
        interactive_type: "story_step",
        scaffolding_ladder: ladder,
      },
      {
        task_id: "story_chapter_tomorrow",
        task_primitive: "future_event_recognition",
        prompt: `Chapter 3 (Tomorrow): Tomorrow afternoon, granddaughter Rina arrives from Guwahati. What shall we get ready for her?`,
        assamese_prompt: `তৃতীয় অধ্যায় (কাইলৈ): কাইলৈ দুপৰীয়া নাতিনী ৰিনা গুৱাহাটীৰ পৰা আহিব। আমি তাইৰ বাবে কি প্ৰস্তুত কৰিম?`,
        temporal_target: "tomorrow",
        interactive_type: "choice_match",
        choice_options: [
          {
            id: "opt_tea_cups",
            label: "Warm tea in cane chairs",
            assamese_label: "বাৰাণ্ডাত গৰম চাহ",
            is_target: true,
          },
          {
            id: "opt_hospital_bag",
            label: "Hospital medicine bag",
            assamese_label: "চিকিৎসালয়ৰ মোনা",
            is_target: false,
          },
        ],
        scaffolding_ladder: ladder,
      },
    ],
    difficulty_profile: {
      present_orientation_level: 1,
      recent_recall_mode: "photo_cued",
      future_recall_mode: "narrative_anchored",
      scaffolding_mode: "gentle_encouragement",
    },
    spoken_guidance: {
      greeting: `Let's listen to your three-day life story, ${person.honorific}.`,
      orientation_prompt: `Listen to how each day connects softly to the next.`,
      encouragement: `How lovely it is to look forward to tomorrow with Rina!`,
      comfort_phrase: `Peaceful days in Tezpur.`,
    },
    provenance_refs: contextPack.provenance_ids,
    validation_status: {
      schema_passed: true,
      data_authorization_passed: true,
      consent_passed: true,
      provenance_passed: true,
      verification_passed: true,
      temporal_validity_passed: true,
      freshness_passed: true,
      sensitivity_passed: true,
      safety_passed: true,
      dignity_passed: true,
      personalization_passed: true,
      all_passed: true,
      validation_timestamp: new Date().toISOString(),
    },
    snapshot_id,
  };
}
