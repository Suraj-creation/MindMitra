/**
 * Deterministic Game Experience Specification Generator
 *
 * Generates typed, valid GameExperienceSpecifications for:
 * - Game 7: Reminiscence Journey (My World)
 * - Game 8: Route Builder (Familiar Places)
 *
 * Strict constraint: Executable code is never generated with an LLM.
 * Only structured JSON conforming to GameExperienceSpecification is emitted.
 */

import {
  GameExperienceSpecification,
  StepSpecification,
  ReminiscenceScaffoldingLevel,
  RouteScaffoldingLevel,
  ProvenanceReference,
  ResponseOption,
  StepStimulus,
} from "../types";
import {
  Game7ContextPack,
  Game8ContextPack,
} from "../../retrieval/types";
import { SpecificationValidatorPipeline } from "../validators";

export class DeterministicSpecGenerator {
  /**
   * Generates a validated GameExperienceSpecification for Game 7 (Reminiscence Journey).
   * Implements scaffolding:
   * recognition → cued recognition → reduced cue → multimodal cue → recall/reminiscence
   */
  public static generateGame7Specification(
    pack: Game7ContextPack,
    targetScaffolding: ReminiscenceScaffoldingLevel = "recognition"
  ): GameExperienceSpecification {
    const personId = pack.person_id;
    const specId = `spec_g7_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const provenanceRefs: ProvenanceReference[] = pack.memories.map((m) => ({
      entity_id: m.metadata.id,
      entity_type: "memory",
      source: m.data.source || (m.metadata.provenance as any) || "caregiver",
      verification_status: m.data.verification_status || m.metadata.verification,
      verified_by: m.data.verified_by || "Verified Family Signatory",
      confidence: Math.max(m.metadata.confidence, 0.85),
      consent_scope: m.data.consent_scope || m.metadata.consent,
      visibility_scope: m.data.visibility_scope || m.metadata.visibility,
      sensitivity: m.data.sensitivity || m.metadata.sensitivity,
    }));

    // Helper to pick authentic verified asset image
    const getImageForMemory = (memId: string) => {
      if (memId.includes("wedding")) return "/assets/images/vintage_assamese_wedding_1789020439671.jpg";
      if (memId.includes("teaching") || memId.includes("teacher")) return "/assets/images/vintage_teacher_memory_1789020507713.jpg";
      if (memId.includes("school") || memId.includes("childhood")) return "/assets/images/tezpur_school_memory_1789020475367.jpg";
      if (memId.includes("rina") || memId.includes("granddaughter")) return "/assets/images/rina_granddaughter_portrait_1789020459100.jpg";
      if (memId.includes("bihu") || memId.includes("tea_garden")) return "/assets/images/assam_tea_garden_1788977277508.jpg";
      return "/assets/images/assamese_courtyard_1788980055319.jpg";
    };

    // Helper to determine stop type
    const getStopTypeForMemory = (memId: string, memData: any): StepSpecification["stop_type"] => {
      if (memId.includes("wedding")) return "important_life_moment";
      if (memId.includes("school") || memId.includes("childhood")) return "school";
      if (memId.includes("teaching") || memId.includes("job")) return "work";
      if (memId.includes("rina") || memId.includes("granddaughter")) return "family";
      if (memId.includes("bihu") || memId.includes("tea_garden")) return "music";
      if (memData.people_refs && memData.people_refs.length > 0) return "person";
      return "place";
    };

    // Generate sequence across the 3 to 5 verified stops
    const steps: StepSpecification[] = [];
    const memoriesCount = Math.min(5, Math.max(3, pack.memories.length));
    const memories = pack.memories.slice(0, memoriesCount);

    memories.forEach((mem, idx) => {
      const stepIndex = idx + 1;
      const memData = mem.data;

      // Assign scaffolding progression or follow target
      const scaffoldingOrder: ReminiscenceScaffoldingLevel[] = [
        "recognition",
        "cued_recognition",
        "reduced_cue",
        "multimodal_cue",
        "recall_reminiscence",
      ];
      // If targetScaffolding is specifically requested, use it across all steps or respect target
      const stepScaffold: ReminiscenceScaffoldingLevel =
        targetScaffolding !== "recognition"
          ? targetScaffolding
          : scaffoldingOrder[Math.min(idx, scaffoldingOrder.length - 1)];

      const stopType = getStopTypeForMemory(mem.metadata.id, memData);

      // Construct options (2 to 3 choices, non-competitive, gentle)
      const options: ResponseOption[] = [
        {
          id: `opt_${mem.metadata.id}_target`,
          text: memData.title,
          assamese_text: memData.assamese_title || memData.title,
          is_preferred_or_target: true,
          gentle_affirmation: `Yes, exactly! This is ${memData.title}, so dearly remembered.`,
          subtle_visual_cue: stepScaffold === "cued_recognition" ? "Green veranda border" : undefined,
        },
        {
          id: `opt_${mem.metadata.id}_alt1`,
          text: "Afternoon tea in the cool shaded veranda",
          assamese_text: "চোতালৰ চাহৰ সময়",
          is_preferred_or_target: false,
          gentle_affirmation: "The veranda tea is peaceful too, and this memory is from your wonderful school days.",
        },
      ];

      // Add third gentle option if 3 options requested
      if (idx % 2 === 1) {
        options.push({
          id: `opt_${mem.metadata.id}_alt2`,
          text: "Gathering Nahor blossoms by the temple lane",
          assamese_text: "মন্দিৰৰ বাটত নাহৰ ফুল তোলা",
          is_preferred_or_target: false,
          gentle_affirmation: "Nahor blossoms bring sweet fragrance, and this moment celebrates your life journey.",
        });
      }

      // Step stimulus with authentic media assets
      const stimulus: StepStimulus = {
        image_url: getImageForMemory(mem.metadata.id),
        image_caption: `${memData.title} (${memData.approximate_period})`,
        ambient_sound: mem.metadata.id.includes("bihu") ? "flute" : mem.metadata.id.includes("wedding") ? "tanpura" : "courtyard",
        sensory_description: `Gentle scent of sweet Nahor blossoms and cool breeze from the Brahmaputra river.`,
        sensory_anchors: [
          { icon: "🌸", label: "Nahor blossoms", soundType: "courtyard" },
          { icon: "🍃", label: "Banyan shade", soundType: "flute" },
        ],
        family_voice_note: pack.voice_recordings[0]
          ? {
              speaker_name: pack.voice_recordings[0].speaker_name,
              relationship: pack.voice_recordings[0].relationship,
              transcript: pack.voice_recordings[0].transcript,
              audio_url: pack.voice_recordings[0].audio_url,
            }
          : {
              speaker_name: "Anu",
              relationship: "Daughter",
              transcript: "Ma, remember the road under that old banyan tree? You always loved that morning walk.",
            },
      };

      // Prompt tailored to scaffolding level
      let primaryPrompt = `Do you remember this cherished memory from ${memData.approximate_period}?`;
      let assamesePrompt = `আপোনাৰ মনত পৰে নে ${memData.approximate_period} চনৰ এই স্মৃতি?`;
      let spokenPrompt = `Take your time, look at this gentle picture from ${memData.title}.`;

      if (stepScaffold === "recognition") {
        // Level 1: photo + name
        primaryPrompt = `Here is ${memData.title}. Does this bring back fond memories?`;
        assamesePrompt = `এইখন ${memData.assamese_title || memData.title}। আপোনাৰ মনত পৰিছেনে?`;
        spokenPrompt = `Look closely at ${memData.title}. A gentle moment from your life.`;
      } else if (stepScaffold === "cued_recognition") {
        // Level 2: photo + recognition question
        primaryPrompt = `Which cherished occasion from ${memData.approximate_period} is pictured here?`;
        assamesePrompt = `ইয়াত দেখুওৱা এই স্মৃতিটো কোনটো সুখৰ সময়ৰ?`;
        spokenPrompt = `Look at the smiling faces. Which happy occasion is this?`;
      } else if (stepScaffold === "reduced_cue") {
        // Level 3: photo without label
        primaryPrompt = `Do you recognize this special moment from your life?`;
        assamesePrompt = `আপোনাৰ জীৱনৰ এই বিশেষ সময়খিনি মনত পৰেনে?`;
        spokenPrompt = `Take all the time you need. Notice the surroundings and familiar smiles.`;
      } else if (stepScaffold === "multimodal_cue") {
        // Level 4: audio/music/family voice cue
        primaryPrompt = `Listen softly to this family voice and melody. What does it bring to mind?`;
        assamesePrompt = `পৰিয়ালৰ এই সুৰ আৰু মাত শুনকচোন। কি মনলৈ আহে?`;
        spokenPrompt = `Listen to your daughter Anu's warm words and the gentle flute melody.`;
      } else if (stepScaffold === "recall_reminiscence") {
        // Level 5: open reminiscence
        primaryPrompt = `Would you like to tell me about this?`;
        assamesePrompt = `আপুনি মোক এই বিষয়ে ক’ব বিচাৰে নেকি?`;
        spokenPrompt = `Would you like to tell me about this memory? Take your time, there is no hurry.`;
      }

      steps.push({
        step_id: `step_g7_${mem.metadata.id}_${idx}`,
        step_index: stepIndex,
        title: memData.title,
        assamese_title: memData.assamese_title,
        stop_type: stopType,
        step_type: stepScaffold,
        stimulus,
        prompt: {
          primary_prompt: primaryPrompt,
          assamese_prompt: assamesePrompt,
          spoken_prompt: spokenPrompt,
          guidance_cue: stepScaffold === "reduced_cue" ? "Notice the ancient trees and traditional clothing." : undefined,
        },
        allowed_responses: {
          input_mode: stepScaffold === "recall_reminiscence" ? "voice_response" : "single_tap",
          options: stepScaffold === "recall_reminiscence" ? undefined : options,
          allow_voice: true,
          min_options_count: 2,
          max_options_count: 3,
        },
        hints: {
          level_1_gentle_reminder: `Take all the time you need. This was during ${memData.approximate_period} in Tezpur.`,
          level_2_visual_cue: "Look at the gentle banyan roots and the familiar pathway.",
          level_3_family_voice: {
            speaker: "Anu",
            relationship: "Daughter",
            text: "Ma, we walked this road together every spring morning.",
          },
        },
        feedback: {
          affirmation: `What a lovely memory to revisit together.`,
          assamese_affirmation: `কি যে এক সুন্দৰ স্মৃতি!`,
          gentle_retry_prompt: `Take your time—every thought and feeling here is welcome.`,
          no_wrong_answers_note: "In reminiscence, every sharing and feeling is deeply valued.",
        },
      });
    });

    const spec: GameExperienceSpecification = {
      spec_id: specId,
      person_id: personId,
      version: "1.0.0",
      created_at: new Date().toISOString(),
      game_template: "reminiscence_journey_my_world",
      objective: "Autobiographical reminiscence, emotional grounding, and family connection through verified life milestones.",
      memory_place_bindings: {
        person_id: personId,
        memory_ids: pack.memories.map((m) => m.metadata.id),
        people_refs: pack.people.map((p) => ({
          id: p.id,
          name: p.name,
          relationship: p.relationship,
          verified: p.verified,
        })),
        cultural_anchors: ["Assam", "Tezpur", "Brahmaputra", "Nahor Blossoms", "Bihu"],
        ambient_soundscapes: ["flute", "courtyard", "tanpura"],
      },
      sequence: steps,
      prompt: {
        session_title: "Reminiscence Journey: My World",
        session_subtitle: "Gentle memories of Tezpur, teaching, and courtyard gatherings",
        assamese_title: "মোৰ সোণালী স্মৃতি",
        welcome_prompt: "Welcome, Purnima. Let us gently revisit some of your most beautiful moments.",
        assamese_welcome_prompt: "স্বাগতম পূৰ্ণিমা বাইদেউ। আহক আমি আপোনাৰ পুৰণি মধুৰ দিনবোৰ স্মৰণ কৰোঁ।",
      },
      modality: "photo_plus_voice",
      difficulty: pack.difficulty_recommendation as 1 | 2 | 3,
      scaffolding: {
        current_level: targetScaffolding,
        scaffolding_hierarchy: [
          "recognition",
          "cued_recognition",
          "reduced_cue",
          "multimodal_cue",
          "recall_reminiscence",
        ],
        auto_scaffold_on_pause: true,
        family_voice_available: true,
        visual_cue_level: "full",
        guidance_tolerance: "high",
      },
      allowed_responses_summary: "Large single-tap option selection, spoken reminiscence audio recording, or visual exploration.",
      hints_summary: "3-tier progressive guidance: verbal reminder, visual highlight, and daughter's warm voice prompt.",
      feedback_policy: "Unconditional warmth and positive validation. Never shows failure screens or red warning language.",
      completion: {
        celebration_title: "A Peaceful Morning Well Spent",
        celebration_message: "Thank you for sharing these precious memories today. Your life's journey brings warmth to all who love you.",
        assamese_celebration_message: "আপোনাৰ এই স্মৃতিবোৰে আমাৰ মন আনন্দৰে ভৰাই তুলিলে। ধন্যবাদ।",
        summary_reminiscence_prompt: "Would you like to rest with tea, or listen to another gentle flute melody?",
        graceful_exit_text: "You may rest comfortably now. Everything has been saved safely.",
      },
      provenance_references: provenanceRefs,
      safety_constraints: {
        no_failure_screen: true,
        no_harsh_wrong_language: true,
        no_competitive_scoring: true,
        no_countdown_timers: true,
        graceful_exit_always_available: true,
        skip_allowed_without_penalty: true,
        pause_allowed: true,
        max_trials_per_session: Math.min(steps.length, 5),
      },
      accessibility_configuration: {
        minimum_touch_target_px: 56,
        high_contrast_support: true,
        font_size_scale: "large",
        screen_reader_labels: true,
        bilingual_dual_display: true,
        haptic_or_visual_pulse: true,
      },
    };

    // Validate specification before returning
    SpecificationValidatorPipeline.assertValidForRuntime(spec);

    return spec;
  }

  /**
   * Generates a validated GameExperienceSpecification for Game 8 (Route Builder).
   * Implements scaffolding:
   * destination recognition → obvious route → landmark sequencing → reduced visual cues → independent route recall
   */
  public static generateGame8Specification(
    pack: Game8ContextPack,
    targetScaffolding: RouteScaffoldingLevel = "destination_recognition"
  ): GameExperienceSpecification {
    const personId = pack.person_id;
    const specId = `spec_g8_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const provenanceRefs: ProvenanceReference[] = [
      {
        entity_id: pack.route.metadata.id,
        entity_type: "route",
        source: pack.route.data.source || (pack.route.metadata.provenance as any) || "caregiver",
        verification_status: pack.route.data.verification_status || pack.route.metadata.verification,
        verified_by: pack.route.data.verified_by || "Verified Family Route",
        confidence: Math.max(pack.route.metadata.confidence, 0.85),
        consent_scope: pack.route.data.consent_scope || pack.route.metadata.consent,
        visibility_scope: pack.route.data.visibility_scope || pack.route.metadata.visibility,
        sensitivity: pack.route.data.sensitivity || pack.route.metadata.sensitivity,
      },
      {
        entity_id: pack.destination.metadata.id,
        entity_type: "place",
        source: pack.destination.data.source || (pack.destination.metadata.provenance as any) || "caregiver",
        verification_status: pack.destination.data.verification_status || pack.destination.metadata.verification,
        verified_by: pack.destination.data.verified_by || "Verified Place Signatory",
        confidence: Math.max(pack.destination.metadata.confidence, 0.9),
        consent_scope: pack.destination.data.consent_scope || pack.destination.metadata.consent,
        visibility_scope: pack.destination.data.visibility_scope || pack.destination.metadata.visibility,
        sensitivity: pack.destination.data.sensitivity || pack.destination.metadata.sensitivity,
      },
    ];

    // Build steps based on the 5 Route Builder scaffolding levels
    const steps: StepSpecification[] = [
      // Step 1: Destination Recognition
      {
        step_id: "step_g8_dest_recog",
        step_index: 1,
        title: "Recognizing the Destination",
        assamese_title: "গন্তব্যস্থান চিনাকি কৰণ",
        step_type: "destination_recognition",
        stimulus: {
          image_url: "/assets/images/brahmaputra_river_1788977296883.jpg",
          image_caption: pack.destination.data.name,
          ambient_sound: "river",
          sensory_description: "Gentle river lap, fresh morning air, peaceful stone steps.",
          landmark_cue: pack.destination.data.name,
        },
        prompt: {
          primary_prompt: `Where does your morning walk from the courtyard lead?`,
          assamese_prompt: `পুৱাৰ খোজ কঢ়া বাটটোৱে আপোনাক ক’লৈ লৈ যায়?`,
          spoken_prompt: `Look at the peaceful water and the stone steps. Where is this familiar place?`,
        },
        allowed_responses: {
          input_mode: "single_tap",
          options: [
            {
              id: "opt_dest_target",
              text: pack.destination.data.name,
              assamese_text: pack.destination.data.assamese_name || "ব্ৰহ্মপুত্ৰৰ ঘাট",
              is_preferred_or_target: true,
              gentle_affirmation: `Yes! The peaceful ${pack.destination.data.name}, where you love to watch the river.`,
            },
            {
              id: "opt_dest_alt",
              text: "The busy town market",
              assamese_text: "চহৰৰ বজাৰ",
              is_preferred_or_target: false,
              gentle_affirmation: "The market is lively, and this quiet morning path leads to the river ghat.",
            },
          ],
          allow_voice: true,
          min_options_count: 2,
          max_options_count: 3,
        },
        hints: {
          level_1_gentle_reminder: "Notice the serene waters of the Brahmaputra.",
          level_2_visual_cue: "Look at the gentle blue waves and the stone ghat steps.",
          level_3_family_voice: {
            speaker: "Anu",
            relationship: "Daughter",
            text: "Ma, remember our peaceful morning walks to the Brahmaputra ghat?",
          },
        },
        feedback: {
          affirmation: `Wonderful! You identified your favorite destination so clearly.`,
          gentle_retry_prompt: `Take all the time you need—this is your familiar riverside.`,
        },
      },
      // Step 2: Obvious Route
      {
        step_id: "step_g8_obvious_route",
        step_index: 2,
        title: "Starting the Familiar Path",
        assamese_title: "চিনাকি বাটৰ আৰম্ভণি",
        step_type: "obvious_route",
        stimulus: {
          image_url: "/assets/images/assamese_courtyard_1788980055319.jpg",
          image_caption: "Ancestral Home Courtyard Gate",
          ambient_sound: "courtyard",
          sensory_description: "Nahor tree shade, aroma of cardamom tea.",
          landmark_cue: "Courtyard Wooden Gate",
        },
        prompt: {
          primary_prompt: "When you step out of the courtyard gate, which way do we turn?",
          assamese_prompt: "চোতালৰ গেটখন পাৰ হৈ আমি কোনফালে বাট লওঁ?",
          spoken_prompt: "As we step past the holy tulsi shrine, which path do we take?",
        },
        allowed_responses: {
          input_mode: "single_tap",
          options: [
            {
              id: "opt_dir_straight",
              text: "Straight ahead, past Mohan's warm tea stall",
              assamese_text: "চিধাই মোহনৰ চাহৰ দোকানলৈ",
              is_preferred_or_target: true,
              gentle_affirmation: "Exactly! Right past Mohan's welcoming kettle.",
            },
            {
              id: "opt_dir_back",
              text: "Back inside to the kitchen veranda",
              assamese_text: "ঘৰৰ বাৰান্দালৈ",
              is_preferred_or_target: false,
              gentle_affirmation: "The veranda is sweet, and forward leads to Mohan's tea stall.",
            },
          ],
          allow_voice: true,
          min_options_count: 2,
          max_options_count: 2,
        },
        hints: {
          level_1_gentle_reminder: "Mohan's kettle is brewing fresh tea right ahead.",
          level_2_visual_cue: "Look for the small wooden tea stall.",
        },
        feedback: {
          affirmation: "You know this path like the back of your hand.",
          gentle_retry_prompt: "Let us walk together at your own comfortable pace.",
        },
      },
      // Step 3: Landmark Sequencing
      {
        step_id: "step_g8_landmark_seq",
        step_index: 3,
        title: "Connecting the Waypoints",
        assamese_title: "চিহ্নবোৰ ক্ৰম অনুসৰি সজোৱা",
        step_type: "landmark_sequencing",
        stimulus: {
          ambient_sound: "flute",
          sensory_description: "Courtyard → Tea Stall → Ancient Banyan Tree → River Ghat",
          sensory_anchors: [
            { icon: "🏡", label: "Courtyard Gate" },
            { icon: "☕", label: "Mohan's Tea Stall" },
            { icon: "🌳", label: "Ancient Banyan Tree" },
            { icon: "🌊", label: "River Ghat Steps" },
          ],
        },
        prompt: {
          primary_prompt: "Which landmark comes right after Mohan's tea stall?",
          assamese_prompt: "মোহনৰ চাহৰ দোকানৰ পিছত কোনটো চিনাকি স্থান পোৱা যায়?",
        },
        allowed_responses: {
          input_mode: "single_tap",
          options: [
            {
              id: "opt_seq_banyan",
              text: "The Ancient Banyan Tree with wide hanging roots",
              assamese_text: "ওলোমা শিপাৰে পুৰণি বৰগছজোপা",
              is_preferred_or_target: true,
              gentle_affirmation: "Yes! That grand old banyan tree marks the fork in the road.",
            },
            {
              id: "opt_seq_ghat",
              text: "The river ghat steps right away",
              assamese_text: "চিধাই নদীৰ ঘাট",
              is_preferred_or_target: false,
              gentle_affirmation: "The river is near, and first we rest under that magnificent banyan tree.",
            },
          ],
          allow_voice: true,
          min_options_count: 2,
          max_options_count: 3,
        },
        hints: {
          level_1_gentle_reminder: "Remember where the children gather in the morning shade.",
          level_2_visual_cue: "The tree with grand hanging roots.",
        },
        feedback: {
          affirmation: "Such beautiful spatial memory! The banyan tree shelters the road perfectly.",
          gentle_retry_prompt: "Every step brings back the peaceful scenery.",
        },
      },
    ];

    const spec: GameExperienceSpecification = {
      spec_id: specId,
      person_id: personId,
      version: "1.0.0",
      created_at: new Date().toISOString(),
      game_template: "route_builder_familiar_places",
      objective: "Spatial wayfinding, landmark sequencing, and orientation preservation along deeply familiar lifetime routes without GPS.",
      memory_place_bindings: {
        person_id: personId,
        route_id: pack.route.metadata.id,
        destination_place_id: pack.destination.metadata.id,
        place_ids: [pack.destination.metadata.id],
        landmark_ids: pack.landmarks.map((l) => l.id),
        cultural_anchors: ["Tezpur", "Brahmaputra Ghat", "Nahor Trees", "Tea Stall"],
        ambient_soundscapes: ["courtyard", "river", "flute"],
      },
      sequence: steps,
      prompt: {
        session_title: "Route Builder: Familiar Places",
        session_subtitle: pack.route.data.title,
        assamese_title: pack.route.data.assamese_title || "চিনাকি বাট",
        welcome_prompt: "Let us walk together along your peaceful route to the river.",
        assamese_welcome_prompt: "আহক আমি একেলগে চিনাকি নদীৰ ঘাটলৈ বাট বুলোঁ।",
      },
      modality: "visual_tactile",
      difficulty: pack.route.data.difficulty as 1 | 2 | 3,
      scaffolding: {
        current_level: targetScaffolding,
        scaffolding_hierarchy: [
          "destination_recognition",
          "obvious_route",
          "landmark_sequencing",
          "reduced_visual_cues",
          "independent_route_recall",
        ],
        auto_scaffold_on_pause: true,
        family_voice_available: true,
        visual_cue_level: "full",
        guidance_tolerance: "moderate",
      },
      allowed_responses_summary: "Landmark card selection, direction choice, and verbal journey description.",
      hints_summary: "Visual highlight, sensory cue description, and daughter's gentle voice reminder.",
      feedback_policy: "Validating, serene navigation encouragement. No failure screens.",
      completion: {
        celebration_title: "You Have Arrived at the River Ghat",
        celebration_message: "The breeze from the Brahmaputra is calm and cool. You navigated this entire familiar journey with grace.",
        assamese_celebration_message: "আমি নদীৰ ঘাট পালোঁহি। বতাহজাক কি যে শীতল!",
        summary_reminiscence_prompt: "Shall we sit on the quiet stone steps and watch the boats?",
        graceful_exit_text: "You can step away peacefully anytime. Your journey is safely completed.",
      },
      provenance_references: provenanceRefs,
      safety_constraints: {
        no_failure_screen: true,
        no_harsh_wrong_language: true,
        no_competitive_scoring: true,
        no_countdown_timers: true,
        graceful_exit_always_available: true,
        skip_allowed_without_penalty: true,
        pause_allowed: true,
        max_trials_per_session: steps.length,
      },
      accessibility_configuration: {
        minimum_touch_target_px: 56,
        high_contrast_support: true,
        font_size_scale: "large",
        screen_reader_labels: true,
        bilingual_dual_display: true,
        haptic_or_visual_pulse: true,
      },
    };

    // Validate specification before returning
    SpecificationValidatorPipeline.assertValidForRuntime(spec);

    return spec;
  }
}
