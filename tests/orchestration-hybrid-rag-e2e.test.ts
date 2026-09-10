import { describe, it } from "node:test";
import assert from "node:assert";
import { BoundedGameOrchestrator } from "../src/intelligence/orchestration/bounded-langgraph.js";
import { MemoryFirewall } from "../src/intelligence/retrieval/memory-firewall.js";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "../src/intelligence/retrieval/context-pack-builder.js";
import {
  cognitiveStore,
  compileTimelineSpec,
  compilePrepareForSpec,
} from "../src/intelligence/cognitive-engine.js";
import {
  ExperienceEpisodeBuilder,
  ProgressivePersonalisationLadder,
} from "../src/intelligence/adaptation/index.js";
import { GameTrialTelemetry } from "../src/domain/cognitive-experience.js";

describe("End-to-End Orchestration, Hybrid Agentic RAG & Game Generation Suite", () => {
  const personId = "person:purnima";

  describe("1. Bounded LangGraph Orchestration Pipeline", () => {
    it("should orchestrate Game 7 (Reminiscence Journey) through all 7 nodes end-to-end", () => {
      const result = BoundedGameOrchestrator.execute({ type: "play_game_7" }, personId);

      assert.strictEqual(result.firewall_passed, true);
      assert.strictEqual(result.firewall_violations.length, 0);
      assert.strictEqual(result.selected_template, "reminiscence_journey_my_world");
      assert.ok(result.generated_spec);
      assert.strictEqual(result.generated_spec?.person_id, personId);
      assert.ok(result.execution_steps.length >= 7);

      const nodeNames = result.execution_steps.map((s) => s.node);
      assert.ok(nodeNames.includes("intent"));
      assert.ok(nodeNames.includes("context_retrieval"));
      assert.ok(nodeNames.includes("candidate_ranking"));
      assert.ok(nodeNames.includes("personalisation"));
      assert.ok(nodeNames.includes("difficulty"));
      assert.ok(nodeNames.includes("game_template_selection"));
      assert.ok(nodeNames.includes("specification_generation"));
    });

    it("should orchestrate Game 8 (Route Builder) through all 7 nodes end-to-end", () => {
      const result = BoundedGameOrchestrator.execute({ type: "play_game_8" }, personId);

      assert.strictEqual(result.firewall_passed, true);
      assert.strictEqual(result.selected_template, "route_builder_familiar_places");
      assert.ok(result.generated_spec);
      assert.strictEqual(result.generated_spec?.cognitive_family, "executive_planning");
      assert.ok(result.ranked_route_candidates && result.ranked_route_candidates.length > 0);
    });

    it("should orchestrate My Life Timeline through LangGraph with chronological spec", () => {
      const result = BoundedGameOrchestrator.execute({ type: "play_timeline", mode: "chronological" }, personId);

      assert.strictEqual(result.firewall_passed, true);
      assert.strictEqual(result.selected_template, "my_life_timeline");
      assert.ok(result.generated_spec);
      assert.strictEqual(result.generated_spec?.template_key, "my_life_timeline");

      // Verify bindings include milestones and comparison
      const bindings = result.generated_spec?.content_bindings;
      assert.ok(bindings.items && bindings.items.length >= 3);
      assert.ok(bindings.two_choice_comparison);
      assert.strictEqual(bindings.two_choice_comparison.correct_id, "item_teaching");
    });

    it("should orchestrate Prepare-For Afternoon Visit through LangGraph with 5 stages", () => {
      const result = BoundedGameOrchestrator.execute({ type: "play_prepare_for" }, personId);

      assert.strictEqual(result.firewall_passed, true);
      assert.strictEqual(result.selected_template, "prepare_for");
      assert.ok(result.generated_spec);
      assert.strictEqual(result.generated_spec?.template_key, "prepare_for");

      const bindings = result.generated_spec?.content_bindings;
      assert.ok(bindings.visitor);
      assert.strictEqual(bindings.visitor.name, "Rina");
      assert.strictEqual(bindings.stages.length, 5);
    });
  });

  describe("2. Hybrid Agentic RAG & Memory Firewall Verification", () => {
    it("should enforce fail-closed isolation when an unauthorized person attempts access", () => {
      const unauthorizedId = "person:unauthorized_stranger";
      const result = BoundedGameOrchestrator.execute({ type: "play_game_7" }, unauthorizedId);

      // Raw retrieved memories must not contain Purnima's memories
      const retrieved = result.raw_retrieved?.memories || [];
      const leaked = retrieved.some((m) => m.data.person_id === "person:purnima");
      assert.strictEqual(leaked, false, "Must strictly isolate cross-person memories");
    });

    it("should mask unverified or sensitive items when allowUnverified is false", () => {
      const filtered = MemoryFirewall.filterMemories(
        cognitiveStore.memories,
        personId,
        cognitiveStore.experienceHistory,
        {
          allowUnverifiedClaimsWithLabel: false,
          includeHighSensitivity: false,
        }
      );

      assert.ok(filtered.approved.length > 0);
      assert.ok(filtered.approved.every((m) => m.data.verification_status !== "unverified"));
      assert.ok(filtered.approved.every((m) => m.data.sensitivity !== "high"));
    });

    it("should rank memories across multiple criteria including verification, valence, and sensory detail", () => {
      const pack = buildGame7ContextPack(personId);
      assert.ok(pack.memories.length > 0);
      assert.ok(pack.memories[0].ranking);
      assert.ok(typeof pack.memories[0].ranking.final_rank_score === "number");
      assert.ok(pack.memories[0].ranking.final_rank_score > 0);
      assert.ok(typeof pack.memories[0].ranking.verification === "number");
      assert.ok(typeof pack.memories[0].ranking.familiarity === "number");
    });
  });

  describe("3. Deterministic Snapshot Reconstruction", () => {
    it("should reconstruct Game 7 deterministically from a saved snapshot", () => {
      const pack = buildGame7ContextPack(personId);
      const reconstructed = BoundedGameOrchestrator.reconstructGameFromSnapshot(pack.snapshot_id);

      assert.ok(reconstructed, "Snapshot must be found in cognitiveStore");
      assert.strictEqual(reconstructed.game_key, "reminiscence_journey_my_world");
      assert.ok(reconstructed.spec);
      assert.strictEqual(reconstructed.spec.person_id, personId);
    });

    it("should reconstruct Game 8 deterministically from a saved route snapshot", () => {
      const pack = buildGame8ContextPack(personId);
      const reconstructed = BoundedGameOrchestrator.reconstructGameFromSnapshot(pack.snapshot_id);

      assert.ok(reconstructed, "Snapshot must be found in cognitiveStore");
      assert.strictEqual(reconstructed.game_key, "route_builder_familiar_places");
      assert.ok(reconstructed.spec);
      assert.strictEqual(reconstructed.spec.person_id, personId);
    });
  });

  describe("4. End-to-End Experience Episode Lifecycle & Adaptive Ladder", () => {
    it("should record completed telemetry, synthesize an episode, and update the personalisation ladder", () => {
      const telemetry: GameTrialTelemetry[] = [
        {
          trial_index: 0,
          step_name: "recall_milestone",
          stimulus: "item_teaching",
          user_selection: "Teaching Literature",
          is_correct: true,
          latency_ms: 3200,
          assistance_level: "none",
          completion_state: "success",
        },
        {
          trial_index: 1,
          step_name: "compare_milestones",
          stimulus: "item_wedding",
          user_selection: "item_teaching",
          is_correct: true,
          latency_ms: 4100,
          assistance_level: "none",
          completion_state: "success",
        },
      ];

      const episode = ExperienceEpisodeBuilder.buildEpisode({
        personId,
        templateKey: "my_life_timeline",
        objective: "Chronological milestone review",
        difficulty: 1,
        modality: "photo_plus_voice",
        trials: telemetry,
        domain: "autobiographical_memory",
      });

      assert.ok(episode.session_id);
      assert.strictEqual(episode.trials_telemetry?.length, 2);
      assert.ok(episode.measurement_quality > 0);
      assert.ok(episode.engagement_score > 0);

      // Record in store
      const recorded = cognitiveStore.recordEpisode(episode);
      assert.strictEqual(recorded.session_id, episode.session_id);

      // Verify recommendation ladder progression
      const recommendation = ProgressivePersonalisationLadder.adaptGame7([recorded]);
      assert.ok(recommendation);
      assert.ok(recommendation.recommended_level);
      assert.ok(recommendation.rationale);
    });
  });
});
