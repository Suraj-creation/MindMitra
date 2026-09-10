import {
  GameTemplate,
  SCAFFOLDING_LADDER_ORDER,
} from "../types";

export class GameTemplateRegistry {
  private templates: Map<string, GameTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  public register(template: GameTemplate): void {
    if (!template.template_key) {
      throw new Error("GameTemplate must have a valid template_key");
    }
    this.templates.set(template.template_key, template);
  }

  public get(templateKey: string): GameTemplate | undefined {
    return this.templates.get(templateKey);
  }

  public has(templateKey: string): boolean {
    return this.templates.has(templateKey);
  }

  public list(): GameTemplate[] {
    return Array.from(this.templates.values());
  }

  private registerDefaultTemplates(): void {
    // ── Template 1: My Life Timeline (Autobiographical Reminiscence Engine) ────
    const myLifeTimelineTemplate: GameTemplate = {
      id: "tmpl_my_life_timeline_v1",
      template_key: "my_life_timeline",
      version: "1.2.0",
      title: "My Life Timeline",
      assamese_title: "জীৱনৰ স্মৃতিৰেখা",
      cognitive_objective:
        "Autobiographical chronological orientation and familiar episodic recall through authentic photos, stories, and family voices.",
      cognitive_family: "autobiographical_sequencing",
      supported_primitives: [
        "recognition",
        "selection",
        "ordering",
        "sequencing",
        "recall",
        "association",
        "audio_playback",
        "image_presentation",
        "hint",
        "graceful_skip",
        "completion",
      ],
      content_slots: [
        {
          slot_key: "milestones",
          label: "Life Milestones",
          description: "Verified life milestone items with dates, photos, and narratives.",
          required: true,
          entity_type: "life_event",
          cardinality: "multiple",
          min_count: 2,
          max_count: 5,
        },
        {
          slot_key: "comparison_pair",
          label: "2-Milestone Comparison Pair",
          description: "A pair of milestones for earlier-vs-later recognition.",
          required: false,
          entity_type: "memory",
          cardinality: "single",
        },
        {
          slot_key: "voice_anchor",
          label: "Family Voice Anchor",
          description: "A warm spoken reflection by a family member.",
          required: false,
          entity_type: "voice_note",
          cardinality: "single",
        },
      ],
      allowed_modalities: ["photo_plus_voice", "visual_tactile", "multi_modal"],
      difficulty_range: [1, 3],
      scaffolding_ladder: [...SCAFFOLDING_LADDER_ORDER],
      safety_constraints: {
        require_verified_memories: true,
        disallow_high_sensitivity: true,
        min_confidence_score: 0.75,
        prohibited_terms: ["dementia", "forgetting", "failed", "exam", "test", "mistake"],
        max_session_duration_minutes: 15,
      },
      dignity_constraints: {
        ban_failure_labels: true,
        ban_competitive_scoring: true,
        ban_visible_countdown: true,
        require_positive_completion: true,
        gentle_encouragement_text: "Every memory shared is treasured and meaningful.",
      },
      offline_capability: true,
      required_provenance_level: "verified",
      required_freshness: "any",
      required_consent_scope: "family",
    };

    // ── Template 2: Prepare-For (Prospective Orientation Engine) ───────────────
    const prepareForTemplate: GameTemplate = {
      id: "tmpl_prepare_for_v1",
      template_key: "prepare_for",
      version: "1.2.0",
      title: "Prepare-For Visit & Routine",
      assamese_title: "প্ৰস্তুতি",
      cognitive_objective:
        "Prospective orientation, executive step planning, and familiar routine preparation for upcoming confirmed family visits.",
      cognitive_family: "prospective_orientation",
      supported_primitives: [
        "recognition",
        "selection",
        "matching",
        "sequencing",
        "audio_playback",
        "image_presentation",
        "hint",
        "graceful_skip",
        "completion",
        "reminder_action",
      ],
      content_slots: [
        {
          slot_key: "event",
          label: "Confirmed Upcoming Event",
          description: "Target future event with time, location, and person details.",
          required: true,
          entity_type: "future_event",
          cardinality: "single",
        },
        {
          slot_key: "visitor_choices",
          label: "Visitor Options",
          description: "Familiar family faces to ground prospective recognition.",
          required: false,
          entity_type: "person",
          cardinality: "multiple",
          min_count: 2,
        },
        {
          slot_key: "preparation_steps",
          label: "Step-by-Step Preparations",
          description: "Ordered sequence of hospitality or routine actions.",
          required: true,
          entity_type: "sequence_step",
          cardinality: "multiple",
          min_count: 2,
          max_count: 4,
        },
        {
          slot_key: "preparation_items",
          label: "Preparation Items",
          description: "Familiar items for hospitality ritual (e.g. tea kettle, cardamom, cups).",
          required: true,
          entity_type: "item_choice",
          cardinality: "multiple",
          min_count: 2,
          max_count: 6,
        },
      ],
      allowed_modalities: ["photo_plus_voice", "visual_tactile", "multi_modal"],
      difficulty_range: [1, 3],
      scaffolding_ladder: [...SCAFFOLDING_LADDER_ORDER],
      safety_constraints: {
        require_verified_memories: true,
        disallow_high_sensitivity: true,
        min_confidence_score: 0.8,
        prohibited_terms: ["missed", "late", "alarm", "punishment", "hurry", "wrong"],
        max_session_duration_minutes: 15,
      },
      dignity_constraints: {
        ban_failure_labels: true,
        ban_competitive_scoring: true,
        ban_visible_countdown: true,
        require_positive_completion: true,
        gentle_encouragement_text: "You are beautifully prepared and warmly surrounded.",
      },
      offline_capability: true,
      required_provenance_level: "verified",
      required_freshness: "same_day",
      required_consent_scope: "family",
    };

    // ── Template 3: Experience Braid (Multi-Modal Composite Engine) ───────────
    const experienceBraidTemplate: GameTemplate = {
      id: "tmpl_experience_braid_v1",
      template_key: "experience_braid",
      version: "1.0.0",
      title: "Experience Braid",
      assamese_title: "স্মৃতি আৰু সংযোগ",
      cognitive_objective:
        "Seamless cognitive braid interleaving autobiographical memory recall with prospective anticipation and sensory comfort.",
      cognitive_family: "semantic_association",
      supported_primitives: [
        "recognition",
        "selection",
        "association",
        "audio_playback",
        "image_presentation",
        "hint",
        "graceful_skip",
        "completion",
      ],
      content_slots: [
        {
          slot_key: "memory_anchor",
          label: "Memory Anchor",
          description: "Autobiographical memory card.",
          required: true,
          entity_type: "memory",
          cardinality: "single",
        },
        {
          slot_key: "future_anchor",
          label: "Future Event Anchor",
          description: "Prospective orientation event.",
          required: true,
          entity_type: "future_event",
          cardinality: "single",
        },
      ],
      allowed_modalities: ["photo_plus_voice", "multi_modal"],
      difficulty_range: [1, 3],
      scaffolding_ladder: [...SCAFFOLDING_LADDER_ORDER],
      safety_constraints: {
        require_verified_memories: true,
        disallow_high_sensitivity: true,
        min_confidence_score: 0.8,
        prohibited_terms: ["score", "fail", "hurry"],
        max_session_duration_minutes: 15,
      },
      dignity_constraints: {
        ban_failure_labels: true,
        ban_competitive_scoring: true,
        ban_visible_countdown: true,
        require_positive_completion: true,
        gentle_encouragement_text: "A peaceful morning braid of past memories and today's joys.",
      },
      offline_capability: true,
      required_provenance_level: "verified",
      required_freshness: "any",
      required_consent_scope: "family",
    };

    this.register(myLifeTimelineTemplate);
    this.register(prepareForTemplate);
    this.register(experienceBraidTemplate);
  }
}

export const defaultTemplateRegistry = new GameTemplateRegistry();
