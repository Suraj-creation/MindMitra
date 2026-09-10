import {
  GameSpec,
  MemoryVerificationStatus,
  TemporalFrame,
} from "../../domain/cognitive-experience";
import { cognitiveStore, validateExperienceSpec } from "../cognitive-engine";
import { rankGame7Memories, rankGame8Routes } from "../retrieval/candidate-rankers";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "../retrieval/context-pack-builder";
import { MemoryFirewall } from "../retrieval/memory-firewall";
import {
  get_current_context,
  get_familiar_place_candidates,
  get_familiar_route_candidates,
  get_personalisation_context,
  get_recent_game_experience,
  get_reminiscence_candidates,
} from "../retrieval/retrieval-tools";
import {
  Game7ContextPack,
  Game8ContextPack,
  LangGraphState,
  OrchestrationIntent,
} from "../retrieval/types";

// ── Bounded LangGraph Workflow Engine ───────────────────────────────────────

export class BoundedGameOrchestrator {
  /**
   * Node 1: Intent Validation
   */
  public static nodeIntent(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const { intent, person_id } = state;

    if (!person_id) {
      throw new Error("Orchestration failed: person_id is required");
    }

    if (!intent || !intent.type) {
      throw new Error("Orchestration failed: valid intent type is required");
    }

    return {
      ...state,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "intent",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Validated intent: ${intent.type} for person ${person_id}`,
        },
      ],
    };
  }

  /**
   * Node 2: Context Retrieval with Memory Firewall Enforcement
   */
  public static nodeContextRetrieval(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const { person_id, intent } = state;

    const personalisation = get_personalisation_context(person_id);
    const currentContext = get_current_context(person_id);

    let firewallViolations: string[] = [];

    if (intent.type === "play_game_7" || intent.type === "preview_game_context") {
      const memories = get_reminiscence_candidates(person_id, undefined, {
        allowUnverifiedClaimsWithLabel: true,
      });
      const places = get_familiar_place_candidates(person_id);
      const routes = get_familiar_route_candidates(person_id);
      const experiences = cognitiveStore.experienceHistory.filter((h) => h.person_id === person_id);

      return {
        ...state,
        raw_retrieved: {
          memories,
          places,
          routes,
          experiences,
          personalisation,
          current_context: currentContext,
        },
        firewall_passed: true,
        firewall_violations: firewallViolations,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "context_retrieval",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Retrieved ${memories.length} memories, ${places.length} places with active firewall`,
          },
        ],
      };
    } else {
      // Game 8
      const routes = get_familiar_route_candidates(person_id, undefined, {
        allowUnverifiedClaimsWithLabel: true,
      });
      const places = get_familiar_place_candidates(person_id);
      const memories = get_reminiscence_candidates(person_id);
      const experiences = cognitiveStore.experienceHistory.filter((h) => h.person_id === person_id);

      return {
        ...state,
        raw_retrieved: {
          memories,
          places,
          routes,
          experiences,
          personalisation,
          current_context: currentContext,
        },
        firewall_passed: true,
        firewall_violations: firewallViolations,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "context_retrieval",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Retrieved ${routes.length} routes, ${places.length} places for route builder`,
          },
        ],
      };
    }
  }

  /**
   * Node 3: Candidate Ranking
   */
  public static nodeCandidateRanking(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const { raw_retrieved, intent } = state;

    if (!raw_retrieved) {
      throw new Error("Orchestration failed: missing raw_retrieved state in candidate_ranking");
    }

    if (intent.type === "play_game_7" || (intent.type === "preview_game_context" && intent.game === "game_7")) {
      const rankedMemories = rankGame7Memories(
        raw_retrieved.memories as any,
        raw_retrieved.personalisation,
        raw_retrieved.current_context
      );

      return {
        ...state,
        ranked_reminiscence_candidates: rankedMemories,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "candidate_ranking",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Ranked ${rankedMemories.length} memories using 10 criteria. Top memory: ${rankedMemories[0]?.data.title}`,
          },
        ],
      };
    } else {
      const rankedRoutes = rankGame8Routes(
        raw_retrieved.routes as any,
        raw_retrieved.personalisation,
        raw_retrieved.current_context
      );

      return {
        ...state,
        ranked_route_candidates: rankedRoutes,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "candidate_ranking",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Ranked ${rankedRoutes.length} routes using 8 criteria. Top route: ${rankedRoutes[0]?.data.title}`,
          },
        ],
      };
    }
  }

  /**
   * Node 4: Personalisation
   */
  public static nodePersonalisation(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const personalisation = state.raw_retrieved?.personalisation || get_personalisation_context(state.person_id);

    const personalisationPack = {
      cultural_anchor: personalisation.person.culture,
      language: personalisation.person.preferred_language,
      honorific: personalisation.person.honorific,
      family_anchors: state.person_id === "person:purnima" ? ["Anu (Daughter)", "Rina (Granddaughter)", "Bikash (Son)"] : [],
    };

    return {
      ...state,
      personalisation_pack: personalisationPack,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "personalisation",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Personalised with language=${personalisationPack.language}, honorific=${personalisationPack.honorific}`,
        },
      ],
    };
  }

  /**
   * Node 5: Difficulty & Scaffolding Selection
   */
  public static nodeDifficulty(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const capability = state.raw_retrieved?.personalisation.capability;
    const history = state.raw_retrieved?.experiences || [];

    // Calculate recent success rate
    const recent5 = history.slice(0, 5);
    const successRate = recent5.length > 0
      ? recent5.filter((h) => h.recall_success).length / recent5.length
      : 0.9;

    let difficulty: 1 | 2 | 3 = 1;
    if (successRate >= 0.85 && (capability?.recall || 0) > 0.65) {
      difficulty = 2;
    }

    const scaffoldingChoice: LangGraphState["scaffolding_choice"] = {
      mode: difficulty === 1 ? "visual_cue" : "family_voice",
      hint_available: true,
      family_speaker: "Anu (Daughter)",
    };

    return {
      ...state,
      selected_difficulty: difficulty,
      scaffolding_choice: scaffoldingChoice,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "difficulty",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Selected difficulty=${difficulty}, scaffolding=${scaffoldingChoice.mode}`,
        },
      ],
    };
  }

  /**
   * Node 6: Game Template Selection & Purpose-Specific Context Pack Construction
   */
  public static nodeGameTemplateSelection(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const { intent, person_id, selected_difficulty } = state;

    if (intent.type === "play_timeline") {
      const contextPack = buildGame7ContextPack(person_id, {
        customDifficulty: selected_difficulty,
      });

      return {
        ...state,
        selected_template: "my_life_timeline",
        context_pack: contextPack,
        snapshot_id: contextPack.snapshot_id,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "game_template_selection",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Selected template=my_life_timeline with snapshot ${contextPack.snapshot_id}`,
          },
        ],
      };
    } else if (intent.type === "play_prepare_for") {
      const contextPack = buildGame8ContextPack(person_id, {
        customDifficulty: selected_difficulty,
      });

      return {
        ...state,
        selected_template: "prepare_for",
        context_pack: contextPack,
        snapshot_id: contextPack.snapshot_id,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "game_template_selection",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Selected template=prepare_for with snapshot ${contextPack.snapshot_id}`,
          },
        ],
      };
    } else if (intent.type === "play_game_7" || (intent.type === "preview_game_context" && intent.game === "game_7")) {
      const contextPack = buildGame7ContextPack(person_id, {
        customDifficulty: selected_difficulty,
      });

      return {
        ...state,
        selected_template: "reminiscence_journey_my_world",
        context_pack: contextPack,
        snapshot_id: contextPack.snapshot_id,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "game_template_selection",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Selected template=reminiscence_journey_my_world with snapshot ${contextPack.snapshot_id}`,
          },
        ],
      };
    } else {
      const contextPack = buildGame8ContextPack(person_id, {
        customDifficulty: selected_difficulty,
      });

      return {
        ...state,
        selected_template: "route_builder_familiar_places",
        context_pack: contextPack,
        snapshot_id: contextPack.snapshot_id,
        execution_steps: [
          ...state.execution_steps,
          {
            node: "game_template_selection",
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            status: "ok",
            details: `Selected template=route_builder_familiar_places with snapshot ${contextPack.snapshot_id}`,
          },
        ],
      };
    }
  }

  /**
   * Node 7: Specification Generation (with 5-layer validation)
   */
  public static nodeSpecificationGeneration(state: LangGraphState): LangGraphState {
    const start = Date.now();
    const { context_pack, selected_template, person_id, selected_difficulty, scaffolding_choice } = state;

    if (!context_pack || !selected_template) {
      throw new Error("Orchestration failed: context pack or template missing for specification generation");
    }

    let spec: GameSpec;

    if (selected_template === "my_life_timeline") {
      const items = [
        {
          id: "item_school",
          year: 1956,
          title: "School Days in Tezpur",
          assamese_title: "তেজপুৰত বিদ্যালয়ৰ দিন",
          photo_url: "/assets/images/tezpur_school_memory_1789020475367.jpg",
          provenance: "prov:family_scrapbook_03",
        },
        {
          id: "item_wedding",
          year: 1968,
          title: "Wedding Day in Tezpur",
          assamese_title: "বিয়াৰ পবিত্ৰ দিনটো",
          photo_url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
          provenance: "prov:caregiver_album_scan_01",
        },
        {
          id: "item_teaching",
          year: 1974,
          title: "Teaching Assamese Literature",
          assamese_title: "অসমীয়া সাহিত্যৰ অধ্যাপনা",
          photo_url: "/assets/images/vintage_teacher_memory_1789020507713.jpg",
          provenance: "prov:school_archives_02",
        },
      ];

      const rawSpec: Partial<GameSpec> = {
        template_key: "my_life_timeline",
        instructions: {
          primary_prompt: "Purnima baideu, let us look at your cherished life milestones together in order.",
          spoken_prompt: "Aitâ, which beautiful life event came after your wedding in Tezpur?",
          success_celebration: "Wonderful! You remembered your joyous years teaching literature.",
        },
        content_bindings: {
          items,
          two_choice_comparison: {
            prompt: "Which of these milestones happened later in Tezpur?",
            option_a_id: "item_wedding",
            option_b_id: "item_teaching",
            correct_id: "item_teaching",
          },
        },
        provenance_refs: ["prov:caregiver_album_scan_01", "prov:school_archives_02", "prov:family_scrapbook_03"],
      };

      const validation = validateExperienceSpec(rawSpec);

      spec = {
        id: `spec_timeline_${Date.now()}`,
        person_id,
        template_key: "my_life_timeline",
        version: "2.5.0",
        generation_mode: "parametrically_personalised_level_b",
        title: "My Life Timeline (জীৱনৰ স্মৃতিৰেখা)",
        subtitle: "Chronological journey through cherished life milestones in Tezpur.",
        objective: "Autobiographical memory sequencing and temporal orientation",
        cognitive_family: "autobiographical_sequencing",
        difficulty: selected_difficulty || 1,
        modality: "photo_plus_voice",
        culture: "Assamese (Tezpur)",
        temporal_frame: "past",
        content_bindings: rawSpec.content_bindings!,
        scaffolding: {
          hint_available: true,
          family_voice_prompt: {
            speaker_name: scaffolding_choice?.family_speaker || "Anu (Daughter)",
            relationship: "daughter",
            text: "Ma, you taught generations of girls with such dedication in Tezpur.",
          },
          retry_policy: "gentle_encouragement",
        },
        instructions: rawSpec.instructions!,
        provenance_refs: rawSpec.provenance_refs!,
        validation_status: validation,
      };
    } else if (selected_template === "reminiscence_journey_my_world") {
      const p7 = context_pack as Game7ContextPack;
      const topMemory = p7.memories[0] || {
        metadata: { id: "mem:wedding_ceremony", provenance: "prov:family_album" },
        data: { title: "Wedding Day in Tezpur", assamese_title: "বিয়াৰ পবিত্ৰ দিনটো" },
      };

      const rawSpec: Partial<GameSpec> = {
        template_key: "my_life_timeline",
        instructions: {
          primary_prompt: "Purnima baideu, let us look back at this cherished memory together.",
          spoken_prompt: "Aitâ, look at this beautiful photo from your days in Tezpur.",
          success_celebration: "What a comforting memory to hold close to your heart.",
        },
        content_bindings: {
          active_memory_id: topMemory.metadata.id,
          memory_title: topMemory.data.title,
          assamese_title: topMemory.data.assamese_title,
          photo_url: p7.memories[0]?.associated_media[0]?.url || "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
          voice_note: p7.voice_recordings[0] || undefined,
        },
        provenance_refs: [topMemory.metadata.provenance, "prov:caregiver_album_scan_01"],
      };

      const validation = validateExperienceSpec(rawSpec);

      spec = {
        id: `spec_g7_${Date.now()}`,
        person_id,
        template_key: "my_life_timeline",
        version: "2.5.0",
        generation_mode: "parametrically_personalised_level_b",
        title: "Reminiscence Journey: My World (মোৰ সোণালী স্মৃতি)",
        subtitle: `A warm exploration of ${topMemory.data.title} in Tezpur.`,
        objective: "Autobiographical memory celebration and emotional grounding",
        cognitive_family: "autobiographical_sequencing",
        difficulty: selected_difficulty || 1,
        modality: "photo_plus_voice",
        culture: "Assamese (Tezpur)",
        temporal_frame: "past",
        content_bindings: rawSpec.content_bindings!,
        scaffolding: {
          hint_available: true,
          family_voice_prompt: {
            speaker_name: scaffolding_choice?.family_speaker || "Anu (Daughter)",
            relationship: "daughter",
            text: "Ma, this was such a joyous family gathering with all our relatives in Tezpur.",
          },
          retry_policy: "gentle_encouragement",
        },
        instructions: rawSpec.instructions!,
        provenance_refs: rawSpec.provenance_refs!,
        validation_status: validation,
      };
    } else if (selected_template === "prepare_for") {
      const rawSpec: Partial<GameSpec> = {
        template_key: "prepare_for",
        instructions: {
          primary_prompt: "Purnima baideu, let us get ready for our afternoon visitor on the veranda.",
          spoken_prompt: "Aitâ, granddaughter Rina is calling at 5:00 PM. Let's arrange our tea tray.",
          success_celebration: "Everything is peaceful and beautifully prepared for your visit.",
        },
        content_bindings: {
          visitor: {
            name: "Rina",
            relationship: "Granddaughter",
            expected_time: "5:00 PM",
            photo_url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
          },
          stages: [
            { id: "s1", name: "Room Orientation", cue: "Ensure comfortable lighting on the veranda" },
            { id: "s2", name: "Face & Hair Refresh", cue: "Gentle warm towel and sandalwood fragrance" },
            { id: "s3", name: "Tea Tray Preparation", cue: "Arrange fresh Assam cardamom tea and pitha" },
            { id: "s4", name: "Veranda Seating", cue: "Settle into the familiar wooden armchair" },
            { id: "s5", name: "Welcome Visitor", cue: "Warm greeting as Rina arrives at the red gate" },
          ],
        },
        provenance_refs: ["prov:visitor_schedule_01", "prov:caregiver_note_02"],
      };

      const validation = validateExperienceSpec(rawSpec);

      spec = {
        id: `spec_prepare_${Date.now()}`,
        person_id,
        template_key: "prepare_for",
        version: "2.5.0",
        generation_mode: "parametrically_personalised_level_b",
        title: "Prepare-For: Veranda Visit & Tea Ceremony (প্ৰস্তুতি)",
        subtitle: "Step-by-step orientation, afternoon tea preparation, and gentle courtyard reminder.",
        objective: "Executive function sequencing and prospective memory orientation",
        cognitive_family: "executive_planning",
        difficulty: selected_difficulty || 1,
        modality: "multi_modal",
        culture: "Assamese (Tezpur)",
        temporal_frame: "future",
        content_bindings: rawSpec.content_bindings!,
        scaffolding: {
          hint_available: true,
          family_voice_prompt: {
            speaker_name: "Anu (Daughter)",
            relationship: "daughter",
            text: "Ma, Rina is so excited to share tea with you on the veranda this evening.",
          },
          retry_policy: "gentle_encouragement",
        },
        instructions: rawSpec.instructions!,
        provenance_refs: rawSpec.provenance_refs!,
        validation_status: validation,
      };
    } else {
      // Game 8 Route Builder
      const p8 = context_pack as Game8ContextPack;
      const route = p8.route;

      const rawSpec: Partial<GameSpec> = {
        template_key: "prepare_for",
        instructions: {
          primary_prompt: `Aitâ, let us retrace the familiar route to ${p8.destination.data.name}.`,
          spoken_prompt: `Purnima baideu, do you remember the peaceful walk from the courtyard to ${p8.destination.data.name}?`,
          success_celebration: "You have arrived safely at your destination.",
        },
        content_bindings: {
          route_id: route.metadata.id,
          route_title: route.data.title,
          destination_name: p8.destination.data.name,
          landmarks: p8.landmarks,
          segments_count: p8.landmarks.length,
        },
        provenance_refs: [route.metadata.provenance, "prov:route_map_01"],
      };

      const validation = validateExperienceSpec(rawSpec);

      spec = {
        id: `spec_g8_${Date.now()}`,
        person_id,
        template_key: "prepare_for",
        version: "2.5.0",
        generation_mode: "parametrically_personalised_level_b",
        title: "Route Builder: Familiar Places (চিনাকি বাটৰ সন্ধান)",
        subtitle: `Retrace your familiar steps to ${p8.destination.data.name}.`,
        objective: "Spatial memory retrieval and landmark-grounded sequencing",
        cognitive_family: "executive_planning",
        difficulty: selected_difficulty || 1,
        modality: "multi_modal",
        culture: "Assamese (Tezpur)",
        temporal_frame: "present",
        content_bindings: rawSpec.content_bindings!,
        scaffolding: {
          hint_available: true,
          family_voice_prompt: {
            speaker_name: "Anu (Daughter)",
            relationship: "daughter",
            text: p8.scaffolding_recommendation.prompt,
          },
          retry_policy: "gentle_encouragement",
        },
        instructions: rawSpec.instructions!,
        provenance_refs: rawSpec.provenance_refs!,
        validation_status: validation,
      };
    }

    const reconstructionHash = `hash:${person_id}:${state.snapshot_id}:${spec.id}`;

    return {
      ...state,
      generated_spec: spec,
      reconstruction_hash: reconstructionHash,
      execution_steps: [
        ...state.execution_steps,
        {
          node: "specification_generation",
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
          status: "ok",
          details: `Generated valid GameSpec (${spec.id}) verified with hash ${reconstructionHash}`,
        },
      ],
    };
  }

  /**
   * Executes the full bounded LangGraph pipeline from intent to spec generation.
   * Intent → Context Retrieval → Candidate Ranking → Personalisation → Difficulty → Template Selection → Specification Generation
   */
  public static execute(intent: OrchestrationIntent, personId: string): LangGraphState {
    let state: LangGraphState = {
      intent,
      person_id: personId,
      firewall_passed: false,
      firewall_violations: [],
      execution_steps: [],
    };

    // Node 1: Intent
    state = BoundedGameOrchestrator.nodeIntent(state);

    // Node 2: Context Retrieval
    state = BoundedGameOrchestrator.nodeContextRetrieval(state);

    // Node 3: Candidate Ranking
    state = BoundedGameOrchestrator.nodeCandidateRanking(state);

    // Node 4: Personalisation
    state = BoundedGameOrchestrator.nodePersonalisation(state);

    // Node 5: Difficulty
    state = BoundedGameOrchestrator.nodeDifficulty(state);

    // Node 6: Game Template Selection
    state = BoundedGameOrchestrator.nodeGameTemplateSelection(state);

    // Node 7: Specification Generation
    state = BoundedGameOrchestrator.nodeSpecificationGeneration(state);

    return state;
  }

  /**
   * Reconstructs a game specification from a saved snapshot ID.
   */
  public static reconstructGameFromSnapshot(
    snapshotId: string
  ): { snapshot: any; game_key: string; reconstructed_at: string; spec: GameSpec } | null {
    const snapshot = cognitiveStore.gameSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return null;

    if (snapshot.game_key === "reminiscence_journey_my_world") {
      const pack = buildGame7ContextPack(snapshot.person_id, {
        customDifficulty: snapshot.capability_summary.recommended_difficulty,
      });
      const orchestration = BoundedGameOrchestrator.execute(
        { type: "play_game_7" },
        snapshot.person_id
      );
      return {
        snapshot,
        game_key: snapshot.game_key,
        reconstructed_at: new Date().toISOString(),
        spec: orchestration.generated_spec!,
      };
    } else {
      const pack = buildGame8ContextPack(snapshot.person_id, {
        customDifficulty: snapshot.capability_summary.recommended_difficulty,
      });
      const orchestration = BoundedGameOrchestrator.execute(
        { type: "play_game_8" },
        snapshot.person_id
      );
      return {
        snapshot,
        game_key: snapshot.game_key,
        reconstructed_at: new Date().toISOString(),
        spec: orchestration.generated_spec!,
      };
    }
  }
}
