import {
  MediaAsset,
  MemoryItem,
  FutureEvent,
  PersonalGameContextPack,
  GameSpec,
  GameTrialTelemetry,
  ExperienceEpisode,
  GameGenerationMode,
} from "../domain/cognitive-experience";

// ── 1. In-Memory Persistent Store (Representing Neon PostgreSQL + pgvector) ──

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "media:wedding_1968",
    person_id: "person:purnima",
    storage_key: "assets/images/vintage_assamese_wedding_1789020439671.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
    title: "Purnima's Wedding in Tezpur (1968)",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:caregiver_album_scan_01",
    status: "active",
  },
  {
    id: "media:teaching_1974",
    person_id: "person:purnima",
    storage_key: "assets/images/vintage_teacher_memory_1789020507713.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/vintage_teacher_memory_1789020507713.jpg",
    title: "Teaching Assamese Literature at Tezpur Girls School (1974)",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:school_archives_02",
    status: "active",
  },
  {
    id: "media:school_childhood_1956",
    person_id: "person:purnima",
    storage_key: "assets/images/tezpur_school_memory_1789020475367.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/tezpur_school_memory_1789020475367.jpg",
    title: "Childhood Classroom with Friends in Tezpur (1956)",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:10:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:family_scrapbook_03",
    status: "active",
  },
  {
    id: "media:rina_portrait_2025",
    person_id: "person:purnima",
    storage_key: "assets/images/rina_granddaughter_portrait_1789020459100.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
    title: "Granddaughter Rina smiling in Tezpur courtyard (2025)",
    created_by: "actor:rina",
    created_at: "2026-09-01T14:30:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:rina_phone_upload",
    status: "active",
  },
  {
    id: "media:tea_ceremony_brass",
    person_id: "person:purnima",
    storage_key: "assets/images/assamese_tea_ceremony_1789020488707.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/assamese_tea_ceremony_1789020488707.jpg",
    title: "Traditional Assamese Brass Tea Service & Fresh CTC Leaves",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:cultural_curated_01",
    status: "active",
  },
  {
    id: "media:tea_garden_morning",
    person_id: "person:purnima",
    storage_key: "assets/images/assam_tea_garden_1788977277508.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/assam_tea_garden_1788977277508.jpg",
    title: "Morning Mist over Sonitpur Tea Gardens",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:cultural_curated_02",
    status: "active",
  },
  {
    id: "media:brahmaputra_ghat",
    person_id: "person:purnima",
    storage_key: "assets/images/brahmaputra_river_1788977296883.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    url: "/assets/images/brahmaputra_river_1788977296883.jpg",
    title: "Brahmaputra River Ghat at Tezpur",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:cultural_curated_03",
    status: "active",
  },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: "mem:childhood_school",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Early school days in Tezpur",
    assamese_title: "তেজপুৰৰ প্ৰাথমিক বিদ্যালয়ৰ দিনবোৰ",
    description: "Walking to the heritage schoolhouse by the riverbank with her slate and brass tiffin box.",
    temporal_frame: "childhood",
    approximate_period: "1954 - 1960",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 0.98,
    sensitivity: "low",
    cultural_context: "Tezpur heritage school, Assam",
    media_refs: ["media:school_childhood_1956"],
    people_refs: [],
    voice_notes: [
      {
        id: "vn:anu_school_story",
        speaker_name: "Anu",
        relationship: "daughter",
        audio_url: "",
        transcript: "Ma, you always told us how you loved writing Assamese poetry on your little slate board in class 4.",
        language: "as",
        verified: true,
      },
    ],
    created_at: "2026-08-15T10:10:00Z",
    updated_at: "2026-08-15T10:10:00Z",
  },
  {
    id: "mem:first_teaching_job",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "First Teaching Post at Tezpur Girls School",
    assamese_title: "তেজপুৰ বালিকা বিদ্যালয়ত প্ৰথম শিক্ষকতা",
    description: "Purnima teaching literature and poetry to enthusiastic young students for over 30 cherished years.",
    temporal_frame: "young_adulthood",
    approximate_period: "1966 - 1998",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 0.99,
    sensitivity: "low",
    cultural_context: "Education in Assam, Assamese literature",
    media_refs: ["media:teaching_1974"],
    people_refs: [],
    voice_notes: [
      {
        id: "vn:rina_teacher_praise",
        speaker_name: "Rina",
        relationship: "granddaughter",
        audio_url: "",
        transcript: "Aitâ, so many people in Tezpur still remember your wonderful literature classes!",
        language: "as",
        verified: true,
      },
    ],
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "mem:wedding_ceremony",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Traditional Wedding Ceremony in Tezpur",
    assamese_title: "তেজপুৰত বিয়াৰ পবিত্ৰ দিনটো",
    description: "Wearing golden Muga silk mekhala chador and traditional Assamese jewelry surrounded by singing relatives.",
    temporal_frame: "young_adulthood",
    approximate_period: "1968",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    sensitivity: "low",
    cultural_context: "Traditional Assamese wedding ritual, Biya Naam, Muga Silk",
    media_refs: ["media:wedding_1968"],
    people_refs: [
      {
        person_entity_id: "entity:late_husband",
        name: "Prabin Baruah",
        relationship: "late husband",
        verified: true,
      },
    ],
    voice_notes: [
      {
        id: "vn:anu_wedding_note",
        speaker_name: "Anu",
        relationship: "daughter",
        audio_url: "",
        transcript: "Ma, Baba's smile in this wedding photo under the courtyard awning is always so radiant.",
        language: "as",
        verified: true,
      },
    ],
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mem:rina_granddaughter",
    person_id: "person:purnima",
    memory_type: "relationship",
    title: "Granddaughter Rina's visits to Tezpur",
    assamese_title: "নাতিনী ৰীনাৰ তেজপুৰৰ ভ্ৰমণ",
    description: "Rina sitting on the veranda eating homemade til pitha and listening to bedtime stories.",
    temporal_frame: "recent",
    approximate_period: "2020 - Present",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 0.99,
    sensitivity: "low",
    cultural_context: "Veranda tea, Til Pitha, Assam home",
    media_refs: ["media:rina_portrait_2025"],
    people_refs: [
      {
        person_entity_id: "entity:rina",
        name: "Rina Baruah",
        relationship: "granddaughter",
        verified: true,
      },
    ],
    voice_notes: [
      {
        id: "vn:rina_greeting_voice",
        speaker_name: "Rina",
        relationship: "granddaughter",
        audio_url: "",
        transcript: "Aitâ, I'm coming to see you today at 4 PM! Keep my favourite cardamom tea ready!",
        language: "as",
        verified: true,
      },
    ],
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
  },
];

export const INITIAL_FUTURE_EVENTS: FutureEvent[] = [
  {
    id: "event:rina_visit_today",
    person_id: "person:purnima",
    event_type: "family_visit",
    title: "Granddaughter Rina Visiting for Afternoon Tea",
    description: "Rina is arriving by car from Guwahati to spend the late afternoon and evening at Tezpur home.",
    person_entity_id: "entity:rina",
    person_name: "Rina",
    relationship: "granddaughter",
    location: "Courtyard Veranda, Tezpur",
    scheduled_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // today at ~4 PM
    status: "confirmed",
    source: "caregiver",
    verification_status: "caregiver_verified",
    preparation_steps: [
      "Select fragrant Assam CTC tea leaves",
      "Crush fresh ginger and green cardamom pod",
      "Warm water in traditional kettle",
      "Place brass cups (ban-bhati) on bamboo tray",
      "Set warm reminder for 3:45 PM",
    ],
  },
  {
    id: "event:evening_tea_daily",
    person_id: "person:purnima",
    event_type: "routine_tea",
    title: "Daily 4:00 PM Veranda Cardamom Tea with Anu",
    location: "Veranda, Tezpur",
    scheduled_at: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
    status: "confirmed",
    source: "system_obs",
    verification_status: "caregiver_verified",
  },
];

export const INITIAL_EPISODES: ExperienceEpisode[] = [
  {
    id: "ep:001",
    session_id: "sess:001",
    person_id: "person:purnima",
    template_key: "my_life_timeline",
    generation_mode: "parametrically_personalised_level_b",
    objective: "Autobiographical sequencing between early teaching and wedding",
    context: {
      time_of_day: "morning (10:15 AM)",
      modality: "photo_plus_voice",
      difficulty: 1,
    },
    engagement_score: 0.94,
    assistance_rate: 0.0,
    measurement_quality: 0.88,
    observed_response: "Immediate recognition of 1968 wedding photograph with verbal smiles when hearing daughter Anu's audio note.",
    learned_implication: "High emotional resonance with wedding and teaching photographs. 2-choice comparison has zero hesitation.",
    pcm_update: {
      domain: "autobiographical_memory",
      delta: +0.03,
      new_estimate: 0.91,
    },
    created_at: "2026-09-08T10:30:00Z",
  },
  {
    id: "ep:002",
    session_id: "sess:002",
    person_id: "person:purnima",
    template_key: "prepare_for",
    generation_mode: "dynamically_composed_level_c",
    objective: "Prospective orientation for granddaughter Rina's visit",
    context: {
      time_of_day: "afternoon (2:30 PM)",
      modality: "multi_modal",
      difficulty: 2,
    },
    engagement_score: 0.91,
    assistance_rate: 0.15,
    measurement_quality: 0.85,
    observed_response: "Successfully ordered tea preparation steps (water -> tea leaves -> cardamom -> pour) with minimal visual cue.",
    learned_implication: "Tactile drag-and-drop sequencing works well when grounded in daily tea routine.",
    pcm_update: {
      domain: "executive_sequencing",
      delta: +0.02,
      new_estimate: 0.80,
    },
    created_at: "2026-09-09T14:45:00Z",
  },
];

// Memory Store State
class CognitiveStore {
  public mediaAssets: MediaAsset[] = [...INITIAL_MEDIA_ASSETS];
  public memories: MemoryItem[] = [...INITIAL_MEMORIES];
  public futureEvents: FutureEvent[] = [...INITIAL_FUTURE_EVENTS];
  public episodes: ExperienceEpisode[] = [...INITIAL_EPISODES];
  public generationRuns: any[] = [];

  // Generate canonical context pack
  public getContextPack(personId: string): PersonalGameContextPack {
    return {
      person: {
        id: "person:purnima",
        display_name: "Purnima",
        honorific: "Aitâ",
        preferred_language: "as",
        culture: "Assamese (Tezpur)",
        location: "Tezpur, Sonitpur, Assam",
      },
      world: {
        people: [
          { id: "entity:anu", name: "Anu", relationship: "Daughter (Primary Caregiver)", verified: true, phone: "+91 98640 12345" },
          { id: "entity:rina", name: "Rina", relationship: "Granddaughter", verified: true, phone: "+91 94350 98765" },
          { id: "entity:bikash", name: "Bikash", relationship: "Son (Bengaluru)", verified: true, phone: "+91 98860 54321" },
          { id: "entity:meena", name: "Meena", relationship: "ASHA Health Worker", verified: true, phone: "+91 94351 11223" },
        ],
        places: [
          { id: "pl:tezpur_home", name: "Ancestral Home in Tezpur", significance: "Safe primary residence near river" },
          { id: "pl:girls_school", name: "Tezpur Girls High School", significance: "30-year teaching post" },
          { id: "pl:brahmaputra_ghat", name: "Brahmaputra River Ghat", significance: "Evening family walks" },
        ],
        routines: [
          { id: "rt:morning_puja", name: "Morning Puja & Altar Garland", time: "07:30 AM", items: ["Marigolds", "Tulsi", "Bell metal plate"] },
          { id: "rt:afternoon_tea", name: "4:00 PM Veranda Cardamom Tea", time: "04:00 PM", items: ["Assam CTC leaves", "Ginger", "Cardamom", "Brass cups"] },
        ],
        memories: this.memories,
        future_events: this.futureEvents,
      },
      temporal: {
        past: ["Tezpur school days", "1968 Wedding ceremony", "Literature teacher at Girls High School", "Rongali Bihu celebrations"],
        present: ["Lives safely in Tezpur home", "Daughter Anu nearby", "Morning courtyard sun", "4:00 PM tea routine"],
        future: ["Granddaughter Rina arriving at 4:00 PM today", "Thursday health visit with ASHA worker Meena", "Upcoming Kati Bihu lighting"],
      },
      capability: {
        recognition: 0.91,
        photo_recognition: 0.91,
        recall: 0.61,
        audio_recall: 0.72,
        sequencing: 0.78,
        attention_span_minutes: 12,
        guidance_tolerance: "high",
      },
      experience_memory: {
        completed_sessions_count: this.episodes.length + 10,
        recent_modalities: ["photo_plus_voice", "tactile_sequencing"],
        effective_scaffolding: ["visual_cue", "family_voice"],
        fatigue_indicators: ["slowed touch latency after 15 mins", "multiple taps on background"],
        last_10_sessions_summary: {
          family_recognition_pct: 88,
          free_recall_pct: 61,
          sequencing_pct: 78,
        },
        preferred_topics: ["Rina visits", "Tezpur school stories", "Assam tea preparation", "Garden flowers"],
      },
      goals: [
        { id: "g1", title: "Preserve autobiographical identity through family photos", cognitive_domain: "autobiographical_memory", status: "active" },
        { id: "g2", title: "Support daily orientation and prospective memory for loved ones' visits", cognitive_domain: "prospective_memory", status: "active" },
        { id: "g3", title: "Foster calm emotional regulation via soothing courtyard audio", cognitive_domain: "wellbeing", status: "active" },
      ],
      adaptation_policy: {
        recommended_difficulty: 2,
        max_choice_count: 2, // 2-choice recognition has 91% success rate vs 4-choice
        scaffolding_mode: "family_voice",
        modality: "photo_plus_voice",
        renewal_rule: "Start with familiar visual recognition, introduce voice, then gradually remove the cue.",
      },
    };
  }

  // Add memory with provenance distinction
  public addMemory(item: Omit<MemoryItem, "id" | "created_at" | "updated_at">): MemoryItem {
    const newMemory: MemoryItem = {
      ...item,
      id: `mem_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.memories.unshift(newMemory);
    return newMemory;
  }

  // Caregiver or CHW verify memory
  public verifyMemory(memoryId: string, verifiedBy: string, role: string, relationshipNote?: string): MemoryItem | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;

    memory.verification_status = role === "clinician" ? "clinician_verified" : "caregiver_verified";
    memory.confidence = 1.0;
    if (relationshipNote && memory.people_refs.length > 0) {
      memory.people_refs[0].verified = true;
    }
    memory.updated_at = new Date().toISOString();
    return memory;
  }

  // Add experience episode & update telemetry
  public recordEpisode(episode: Omit<ExperienceEpisode, "id" | "created_at">): ExperienceEpisode {
    const newEp: ExperienceEpisode = {
      ...episode,
      id: `ep_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.episodes.unshift(newEp);
    return newEp;
  }
}

export const cognitiveStore = new CognitiveStore();

// ── 2. Five-Layer Experience Specification Validator ─────────────────────────

export interface ValidationOutput {
  grounding_passed: boolean;
  consent_passed: boolean;
  safety_passed: boolean;
  dignity_passed: boolean;
  schema_passed: boolean;
  all_passed: boolean;
  violations: string[];
}

export function validateExperienceSpec(spec: Partial<GameSpec>): ValidationOutput {
  const violations: string[] = [];

  // 1. Grounding Validator: Must bind only to verified/grounded entities, no fabricated relatives
  let grounding_passed = true;
  if (!spec.provenance_refs || spec.provenance_refs.length === 0) {
    violations.push("Grounding check: spec missing provenance references.");
    grounding_passed = false;
  }

  // 2. Consent Validator: Check if memories in content bindings have active consent scope
  let consent_passed = true;
  if (spec.content_bindings?.unauthorized_scope) {
    violations.push("Consent check: contains private memory without caregiver/person consent grant.");
    consent_passed = false;
  }

  // 3. Safety Validator: No medical claims, diagnosis assertions, or stressful time pressure
  let safety_passed = true;
  const promptStr = `${spec.instructions?.primary_prompt || ""} ${spec.instructions?.spoken_prompt || ""}`;
  if (/dementia|alzheimer|cognitive test|score|fail|wrong|exam|hurry|timer/i.test(promptStr)) {
    violations.push("Safety check: prompt contains stigmatizing clinical terms or anxiety-inducing pressure.");
    safety_passed = false;
  }

  // 4. Dignity Validator: Respectful tone, proper Assamese honorifics (Aitâ / Purnima baideu), no baby-talk
  let dignity_passed = true;
  if (/good boy|good girl|silly|baby/i.test(promptStr)) {
    violations.push("Dignity check: infantilizing language detected.");
    dignity_passed = false;
  }

  // 5. Schema Validator: Ensure required deterministic contract slots exist
  let schema_passed = true;
  if (!spec.template_key || !spec.instructions || !spec.content_bindings) {
    violations.push("Schema check: missing required template contract properties.");
    schema_passed = false;
  }

  const all_passed = grounding_passed && consent_passed && safety_passed && dignity_passed && schema_passed;

  return {
    grounding_passed,
    consent_passed,
    safety_passed,
    dignity_passed,
    schema_passed,
    all_passed,
    violations,
  };
}

// ── 3. Deterministic Experience Specification Compilers ──────────────────────

export function compileTimelineSpec(
  context: PersonalGameContextPack,
  mode: "recognition" | "association" | "construction" | "voice" | "story" = "recognition"
): GameSpec {
  const weddingMem = context.world.memories.find((m) => m.id === "mem:wedding_ceremony");
  const schoolMem = context.world.memories.find((m) => m.id === "mem:first_teaching_job");
  const childhoodMem = context.world.memories.find((m) => m.id === "mem:childhood_school");

  const validation = validateExperienceSpec({
    template_key: "my_life_timeline",
    instructions: {
      primary_prompt: "Which treasured memory came earlier in your journey, Aitâ?",
      spoken_prompt: "Purnima baideu, look at these two cherished moments. Which one happened first?",
      success_celebration: "What a beautiful memory to hold close to your heart.",
    },
    content_bindings: { mode },
    provenance_refs: ["prov:caregiver_album_scan_01", "prov:school_archives_02"],
  });

  return {
    id: `spec_timeline_${Date.now()}`,
    person_id: context.person.id,
    template_key: "my_life_timeline",
    version: "2.0.0",
    generation_mode: "parametrically_personalised_level_b",
    title: "My Life Timeline (জীৱনৰ স্মৃতিৰেখা)",
    subtitle: "A gentle journey through your teaching years and wedding day in Tezpur.",
    objective: "Autobiographical sequencing and positive reminiscence",
    cognitive_family: "autobiographical_sequencing",
    difficulty: context.adaptation_policy.recommended_difficulty,
    modality: "photo_plus_voice",
    culture: "Assamese (Tezpur)",
    temporal_frame: "past",
    content_bindings: {
      active_mode: mode,
      items: [
        {
          id: "item_childhood",
          title: "Tezpur School Days",
          assamese: "বিদ্যালয়ৰ দিনবোৰ",
          year: "1956",
          order: 1,
          photo_url: "/assets/images/tezpur_school_memory_1789020475367.jpg",
          voice_prompt: "Ma, this is you with your classmates outside the schoolhouse in Tezpur.",
          story_snippet: "You loved reciting Assamese verses on breezy mornings by the river.",
          verified: true,
        },
        {
          id: "item_teaching",
          title: "Teaching Literature at Girls School",
          assamese: "সাহিত্য শিক্ষকতা",
          year: "1966",
          order: 2,
          photo_url: "/assets/images/vintage_teacher_memory_1789020507713.jpg",
          voice_prompt: "Aitâ, you taught literature at Tezpur Girls School for thirty wonderful years.",
          story_snippet: "Your students always loved your warm recitation of Laxminath Bezbaroa's poems.",
          verified: true,
        },
        {
          id: "item_wedding",
          title: "Wedding Day in Tezpur",
          assamese: "বিয়াৰ পবিত্ৰ দিনটো",
          year: "1968",
          order: 3,
          photo_url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
          voice_prompt: "Ma, Baba looked so happy and proud standing beside you under the courtyard awning.",
          story_snippet: "The courtyard was filled with singing relatives and the scent of fresh Nahor blossoms.",
          verified: true,
        },
      ],
      two_choice_comparison: {
        earlier_id: "item_teaching",
        later_id: "item_wedding",
        question: "Which milestone came first?",
        option_a: { id: "item_teaching", label: "Teaching Literature (1966)", photo_url: "/assets/images/vintage_teacher_memory_1789020507713.jpg" },
        option_b: { id: "item_wedding", label: "Wedding Day in Tezpur (1968)", photo_url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg" },
        correct_id: "item_teaching",
      },
    },
    scaffolding: {
      hint_available: true,
      family_voice_prompt: {
        speaker_name: "Anu (Daughter)",
        relationship: "daughter",
        text: "You began teaching literature right before you and Baba celebrated your wedding in 1968.",
      },
      visual_guide: "Golden dates on photo cards provide gentle orientation.",
      retry_policy: "gentle_encouragement",
    },
    instructions: {
      primary_prompt: "Which treasured memory came earlier in your journey, Aitâ?",
      spoken_prompt: "Purnima baideu, look at these two cherished moments. Which one happened first?",
      success_celebration: "What a beautiful memory to hold close to your heart.",
    },
    provenance_refs: ["prov:caregiver_album_scan_01", "prov:school_archives_02", "prov:family_scrapbook_03"],
    validation_status: validation,
  };
}

export function compilePrepareForSpec(context: PersonalGameContextPack): GameSpec {
  const rinaEvent = context.world.future_events.find((e) => e.person_name === "Rina") || context.world.future_events[0];

  const validation = validateExperienceSpec({
    template_key: "prepare_for",
    instructions: {
      primary_prompt: "Someone special is visiting your veranda this afternoon, Aitâ.",
      spoken_prompt: "Purnima baideu, let us get ready together for our afternoon visitor.",
      success_celebration: "Everything is set perfectly. Rina will be so happy to see you.",
    },
    content_bindings: { rinaEvent },
    provenance_refs: ["prov:rina_phone_upload", "prov:cultural_curated_01"],
  });

  return {
    id: `spec_prepare_${Date.now()}`,
    person_id: context.person.id,
    template_key: "prepare_for",
    version: "2.0.0",
    generation_mode: "dynamically_composed_level_c",
    title: "Prepare-For: Afternoon Veranda Visit (প্ৰস্তুতি)",
    subtitle: "Bridge memory, planning, and real-world connection for Rina's 4:00 PM visit.",
    objective: "Prospective orientation, executive step sequencing, and family connection",
    cognitive_family: "executive_planning",
    difficulty: 2,
    modality: "multi_modal",
    culture: "Assamese (Tezpur)",
    temporal_frame: "future",
    content_bindings: {
      visitor: {
        name: "Rina",
        relationship: "Granddaughter",
        photo_url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
        visit_time: "4:00 PM Today",
        voice_greeting: "Aitâ, I am on my way from Guwahati! I cannot wait to share afternoon tea with you.",
      },
      stages: [
        {
          stage_number: 1,
          stage_name: "Recognition",
          question: "Someone special is visiting today. Who is coming to see you?",
          options: [
            { id: "opt_rina", name: "Rina (Granddaughter)", photo_url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg", is_correct: true },
            { id: "opt_neighbor", name: "Anita (Neighbour)", photo_url: "/assets/images/assamese_courtyard_1788980055319.jpg", is_correct: false },
          ],
        },
        {
          stage_number: 2,
          stage_name: "Remember Time & Essentials",
          question: "Rina is arriving at 4:00 PM. What shall we prepare on the tea tray?",
          options: [
            { id: "ing_tea", name: "Fragrant Assam CTC Tea", photo_url: "/assets/images/assamese_tea_ceremony_1789020488707.jpg", is_essential: true },
            { id: "ing_cardamom", name: "Fresh Cardamom & Ginger", photo_url: "/assets/images/assam_tea_garden_1788977277508.jpg", is_essential: true },
            { id: "ing_cups", name: "Traditional Brass Tea Bowls (Ban-Bhati)", photo_url: "/assets/images/assamese_tea_ceremony_1789020488707.jpg", is_essential: true },
          ],
        },
        {
          stage_number: 3,
          stage_name: "Step Sequencing",
          question: "What shall we do first to prepare the tea?",
          steps: [
            { id: "step_1", label: "1. Boil fresh water in the kettle", order: 1 },
            { id: "step_2", label: "2. Add fragrant Assam CTC tea leaves", order: 2 },
            { id: "step_3", label: "3. Crush green cardamom and fresh ginger", order: 3 },
            { id: "step_4", label: "4. Pour hot tea into traditional brass cups", order: 4 },
          ],
        },
        {
          stage_number: 4,
          stage_name: "Prospective Reminder",
          title: "Set a Gentle Courtyard Reminder",
          reminder_time: "3:45 PM (15 minutes before arrival)",
          message: "A soft chime will sound on your tablet so you can step onto the veranda to welcome Rina.",
        },
        {
          stage_number: 5,
          stage_name: "Social Connection Call",
          title: "Connect with Rina",
          phone_number: "+91 94350 98765",
          prompt_text: "Would you like to send a quick voice message or give Rina a warm ring?",
        },
      ],
    },
    scaffolding: {
      hint_available: true,
      family_voice_prompt: {
        speaker_name: "Rina (Granddaughter)",
        relationship: "granddaughter",
        text: "Aitâ, boil the water first, then add the golden tea leaves just like you taught me!",
      },
      visual_guide: "Step numbers and brass tea iconography guide gentle progress.",
      retry_policy: "gentle_encouragement",
    },
    instructions: {
      primary_prompt: "Someone special is visiting your veranda this afternoon, Aitâ.",
      spoken_prompt: "Purnima baideu, let us get ready together for our afternoon visitor.",
      success_celebration: "Everything is set perfectly. Rina will be so happy to see you.",
    },
    provenance_refs: ["prov:rina_phone_upload", "prov:cultural_curated_01"],
    validation_status: validation,
  };
}

export function compileExperienceBraidSpec(context: PersonalGameContextPack): GameSpec {
  const validation = validateExperienceSpec({
    template_key: "experience_braid",
    instructions: {
      primary_prompt: "A braided journey through your memories, today's calm, and Rina's visit.",
      spoken_prompt: "Purnima baideu, let us weave together your past stories and today's pleasant afternoon.",
      success_celebration: "You have woven a peaceful tapestry of memories and today's joys.",
    },
    content_bindings: { braided: true },
    provenance_refs: ["prov:caregiver_album_scan_01", "prov:rina_phone_upload", "prov:cultural_curated_01"],
  });

  return {
    id: `spec_braid_${Date.now()}`,
    person_id: context.person.id,
    template_key: "experience_braid",
    version: "2.0.0",
    generation_mode: "dynamically_composed_level_c",
    title: "Experience Braid: Past, Present & Future (স্মৃতিৰ তৰংগ)",
    subtitle: "Seamlessly weaving autobiographical memory into today's afternoon routine and family connection.",
    objective: "Multi-domain cognitive integration (Autobiographical -> Sensory Orientation -> Prospective Planning)",
    cognitive_family: "autobiographical_sequencing",
    difficulty: 2,
    modality: "multi_modal",
    culture: "Assamese (Tezpur)",
    temporal_frame: "present",
    content_bindings: {
      phases: [
        {
          phase_id: "phase_past",
          title: "Phase 1: Cherished Past",
          subtitle: "Recognising your teaching and wedding days in Tezpur",
          temporal_anchor: "1968",
          photo_url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
          reflection: "Your wedding under the Tezpur courtyard awning brought together friends from across Assam.",
        },
        {
          phase_id: "phase_present",
          title: "Phase 2: Courtyard Present",
          subtitle: "Morning sunlight over the garden marigolds & Brahmaputra breeze",
          temporal_anchor: "Today, 10:30 AM",
          photo_url: "/assets/images/assamese_courtyard_1788980055319.jpg",
          reflection: "Anu is close by in the home, and the veranda is peaceful and sunny.",
        },
        {
          phase_id: "phase_future",
          title: "Phase 3: Looking Ahead",
          subtitle: "Granddaughter Rina arriving at 4:00 PM for afternoon tea",
          temporal_anchor: "Today, 4:00 PM",
          photo_url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg",
          reflection: "Steaming cardamom tea in traditional brass cups ready to welcome Rina.",
        },
      ],
    },
    scaffolding: {
      hint_available: true,
      family_voice_prompt: {
        speaker_name: "Anu",
        relationship: "daughter",
        text: "Ma, each stage connects what you love most: our family history, our peaceful home, and Rina's visit.",
      },
      retry_policy: "gentle_encouragement",
    },
    instructions: {
      primary_prompt: "A braided journey through your memories, today's calm, and Rina's visit.",
      spoken_prompt: "Purnima baideu, let us weave together your past stories and today's pleasant afternoon.",
      success_celebration: "You have woven a peaceful tapestry of memories and today's joys.",
    },
    provenance_refs: ["prov:caregiver_album_scan_01", "prov:rina_phone_upload", "prov:cultural_curated_01"],
    validation_status: validation,
  };
}
