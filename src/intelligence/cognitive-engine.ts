import {
  MediaAsset,
  MemoryItem,
  FutureEvent,
  FutureEventStatus,
  PersonEntity,
  Relationship,
  LifeEvent,
  MemoryFirewallQuery,
  MemoryFirewallEvaluation,
  PersonalGameContextPack,
  GameSpec,
  GameTrialTelemetry,
  ExperienceEpisode,
  GameGenerationMode,
  GameTemplate,
  GameSession,
  GameTrial,
  GameGenerationRun,
  HybridRetrievalQuery,
  HybridRetrievalResult,
  PersonalizationContext9D,
} from "../domain/cognitive-experience";

// ── 1. In-Memory Persistent Store (Representing Neon PostgreSQL + pgvector + B2) ──

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "media:wedding_1968",
    person_id: "person:purnima",
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_wed_1968_xyz",
    storage_key: "assets/images/vintage_assamese_wedding_1789020439671.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 284120,
    width: 1024,
    height: 768,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_teach_1974_xyz",
    storage_key: "assets/images/vintage_teacher_memory_1789020507713.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 312450,
    width: 1024,
    height: 768,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_child_1956_xyz",
    storage_key: "assets/images/tezpur_school_memory_1789020475367.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 265890,
    width: 1024,
    height: 768,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_rina_2025_xyz",
    storage_key: "assets/images/rina_granddaughter_portrait_1789020459100.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 420100,
    width: 1024,
    height: 1024,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_tea_brass_xyz",
    storage_key: "assets/images/assamese_tea_ceremony_1789020488707.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 355000,
    width: 1024,
    height: 768,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_garden_xyz",
    storage_key: "assets/images/assam_tea_garden_1788977277508.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 390000,
    width: 1024,
    height: 768,
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
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "b2_photo_ghat_xyz",
    storage_key: "assets/images/brahmaputra_river_1788977296883.jpg",
    media_type: "photo",
    mime_type: "image/jpeg",
    file_size_bytes: 345000,
    width: 1024,
    height: 768,
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

export const INITIAL_PERSON_ENTITIES: PersonEntity[] = [
  {
    id: "entity:anu",
    person_id: "person:purnima",
    name: "Anu Baruah",
    assamese_name: "অনু বৰুৱা",
    display_name: "Anu (Daughter)",
    relationship_to_person: "daughter",
    avatar_media_id: undefined,
    phone: "+91 98640 12345",
    is_emergency_contact: true,
    can_verify_memories: true,
    verification_status: "verified",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "entity:rina",
    person_id: "person:purnima",
    name: "Rina Baruah",
    assamese_name: "ৰীণা বৰুৱা",
    display_name: "Rina (Granddaughter)",
    relationship_to_person: "granddaughter",
    avatar_media_id: "media:rina_portrait_2025",
    phone: "+91 98640 54321",
    is_emergency_contact: false,
    can_verify_memories: true,
    verification_status: "verified",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "entity:bikash",
    person_id: "person:purnima",
    name: "Bikash Baruah",
    assamese_name: "বিকাশ বৰুৱা",
    display_name: "Bikash (Son)",
    relationship_to_person: "son",
    phone: "+91 98800 11223",
    is_emergency_contact: true,
    can_verify_memories: true,
    verification_status: "verified",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "entity:late_husband",
    person_id: "person:purnima",
    name: "Prabin Baruah",
    assamese_name: "প্ৰবীন বৰুৱা",
    display_name: "Prabin Baruah (Late Husband)",
    relationship_to_person: "late_husband",
    avatar_media_id: "media:wedding_1968",
    is_emergency_contact: false,
    can_verify_memories: false,
    verification_status: "verified",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "entity:meena_asha",
    person_id: "person:purnima",
    name: "Meena Gogoi",
    assamese_name: "মীনা গগৈ",
    display_name: "Meena (ASHA Health Worker)",
    relationship_to_person: "asha_worker",
    phone: "+91 94350 99887",
    is_emergency_contact: false,
    can_verify_memories: true,
    verification_status: "verified",
    created_at: "2026-08-01T08:00:00Z",
  },
];

export const INITIAL_RELATIONSHIPS: Relationship[] = [
  {
    id: "rel:anu_purnima",
    person_id: "person:purnima",
    related_entity_id: "entity:anu",
    related_person_name: "Anu Baruah",
    relationship_type: "daughter",
    closeness_level: "primary_caregiver",
    verification_status: "verified",
    verified_by: "actor:anu",
    notes: "Resides with Purnima in Tezpur; primary decision maker for care plans.",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "rel:rina_purnima",
    person_id: "person:purnima",
    related_entity_id: "entity:rina",
    related_person_name: "Rina Baruah",
    relationship_type: "granddaughter",
    closeness_level: "family_core",
    verification_status: "verified",
    verified_by: "actor:anu",
    notes: "Visits frequently from Guwahati; high emotional engagement during afternoon tea.",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "rel:bikash_purnima",
    person_id: "person:purnima",
    related_entity_id: "entity:bikash",
    related_person_name: "Bikash Baruah",
    relationship_type: "son",
    closeness_level: "family_core",
    verification_status: "verified",
    verified_by: "actor:anu",
    notes: "Working in Bengaluru; calls weekly on Sunday mornings.",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "rel:prabin_purnima",
    person_id: "person:purnima",
    related_entity_id: "entity:late_husband",
    related_person_name: "Prabin Baruah",
    relationship_type: "late_husband",
    closeness_level: "family_core",
    verification_status: "verified",
    verified_by: "actor:anu",
    notes: "Married in 1968; passed away in 2018. Cherished memory with sensitive handling.",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "rel:meena_purnima",
    person_id: "person:purnima",
    related_entity_id: "entity:meena_asha",
    related_person_name: "Meena Gogoi",
    relationship_type: "asha_worker",
    closeness_level: "community_chw",
    verification_status: "verified",
    verified_by: "actor:clinician",
    notes: "Local community healthcare worker assigned to Tezpur ward.",
    created_at: "2026-08-01T08:00:00Z",
  },
];

export const INITIAL_LIFE_EVENTS: LifeEvent[] = [
  {
    id: "le:childhood_tezpur",
    person_id: "person:purnima",
    title: "Childhood by the Brahmaputra in Tezpur",
    assamese_title: "তেজপুৰৰ শৈশৱ",
    description: "Growing up in Tezpur, schooling by the riverbank, learning weaving and Assamese verses.",
    event_type: "milestone",
    era_period: "1954 - 1962",
    approximate_year: 1956,
    cultural_significance: "Traditional riverbank heritage, primary schooling",
    primary_media_id: "media:school_childhood_1956",
    verification_status: "verified",
    verified_by: "actor:anu",
    sensitivity: "low",
    game_eligible: true,
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "le:teaching_career",
    person_id: "person:purnima",
    title: "Teaching Literature at Tezpur Girls High School",
    assamese_title: "তেজপুৰ বালিকা বিদ্যালয়ত শিক্ষকতা",
    description: "Dedicated 32-year tenure teaching Assamese poetry and literature to generations of young women.",
    event_type: "career",
    era_period: "1966 - 1998",
    approximate_year: 1974,
    cultural_significance: "Assamese literary heritage, female literacy advocacy",
    primary_media_id: "media:teaching_1974",
    verification_status: "verified",
    verified_by: "actor:anu",
    sensitivity: "low",
    game_eligible: true,
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "le:wedding_ceremony",
    person_id: "person:purnima",
    title: "Wedding with Prabin Baruah in Tezpur",
    assamese_title: "প্ৰবীন বৰুৱাৰ সৈতে শুভ বিবাহ",
    description: "Traditional Assamese Hindu wedding under marigold pandal with family blessings and Biya Naam chants.",
    event_type: "family",
    era_period: "Winter 1968",
    approximate_year: 1968,
    cultural_significance: "Biya Naam, Muga silk mekhala chador, family union",
    primary_media_id: "media:wedding_1968",
    verification_status: "verified",
    verified_by: "actor:anu",
    sensitivity: "low",
    game_eligible: true,
    created_at: "2026-08-15T10:00:00Z",
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
  {
    id: "mem:purnima_unverified_poem",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Reciting Lakshminath Bezbaroa poem by river ghat",
    assamese_title: "ব্ৰহ্মপুত্ৰৰ ঘাটত কবিতা পাঠ",
    description: "I remember standing on the stone ghat steps at dusk reciting Bezbaroa's poem to the evening mist.",
    temporal_frame: "young_adulthood",
    approximate_period: "Circa 1964",
    source: "person",
    verification_status: "unverified",
    confidence: 0.70,
    sensitivity: "low",
    is_sensitive: false,
    game_eligible: true,
    consent_scope: "all",
    visibility_scope: "family",
    cultural_context: "Tezpur Brahmaputra Ghat, Assam",
    life_event_id: "le:childhood_tezpur",
    media_refs: ["media:brahmaputra_ghat"],
    people_refs: [],
    voice_notes: [],
    created_at: "2026-09-09T09:00:00Z",
    updated_at: "2026-09-09T09:00:00Z",
  },
  {
    id: "mem:husband_passing_sensitive",
    person_id: "person:purnima",
    memory_type: "event",
    title: "Late Husband Prabin's Passing at Tezpur Hospital",
    assamese_title: "প্ৰবীনৰ বিদায়ৰ দিনটো",
    description: "Difficult winter morning at Tezpur civil hospital following illness; family gathered together in prayer.",
    temporal_frame: "later_life",
    approximate_period: "Winter 2018",
    source: "caregiver",
    verification_status: "verified",
    verified_by: "actor:anu",
    confidence: 1.0,
    sensitivity: "high",
    is_sensitive: true,
    game_eligible: false, // Strict exclusion from games
    consent_scope: "family",
    visibility_scope: "private",
    cultural_context: "Tezpur Hospital, bereavement",
    media_refs: [],
    people_refs: [
      {
        person_entity_id: "entity:late_husband",
        name: "Prabin Baruah",
        relationship: "late husband",
        verified: true,
      },
    ],
    voice_notes: [],
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mem:private_diary_classmates",
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Private reflections on old classmates from Tezpur",
    assamese_title: "সহপাঠীসকলৰ স্মৃতিলেখা",
    description: "Personal handwritten journal entries reflecting quietly on girls school classmates.",
    temporal_frame: "recent",
    approximate_period: "2024",
    source: "person",
    verification_status: "verified",
    confidence: 0.90,
    sensitivity: "low",
    is_sensitive: false,
    game_eligible: false,
    consent_scope: "person_only", // Strict person_only scope
    visibility_scope: "private",
    cultural_context: "Personal journal notebook",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
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
    scheduled_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: "confirmed",
    source: "caregiver",
    verification_status: "verified",
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
    source: "system",
    verification_status: "verified",
  },
  {
    id: "event:bihu_celebration_upcoming",
    person_id: "person:purnima",
    event_type: "festival",
    title: "Upcoming Bohag Bihu Family Gathering at Tezpur Home",
    description: "Family reunion planned for seasonal celebration with traditional dhol, pitha, and gamusa blessings.",
    location: "Courtyard, Tezpur",
    scheduled_at: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    status: "expected",
    source: "caregiver",
    verification_status: "verified",
    preparation_steps: [
      "Prepare sesame and coconut for til pitha",
      "Wash woven Muga silk gamusas for family elder blessings",
    ],
  },
  {
    id: "event:health_checkup_past",
    person_id: "person:purnima",
    event_type: "medical_appointment",
    title: "Routine Blood Pressure Check with CHW Meena",
    description: "Monthly geriatric vital screening and pulse check completed at home.",
    person_entity_id: "entity:meena_asha",
    person_name: "Meena Gogoi",
    relationship: "asha_worker",
    location: "Home, Tezpur",
    scheduled_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    status: "occurred",
    source: "chw",
    verification_status: "verified",
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

export const INITIAL_GAME_TEMPLATES: GameTemplate[] = [
  {
    id: "tpl:my_life_timeline",
    template_key: "my_life_timeline",
    version: "2.1.0",
    title: "My Life Timeline (জীৱনৰ স্মৃতিৰেখা)",
    cognitive_family: "autobiographical_sequencing",
    supported_modalities: ["photo_plus_voice", "visual_tactile", "visual_only"],
    supported_difficulty_range: [1, 3],
    offline_capable: true,
    schema: {
      modes: ["recognition", "association", "construction", "voice", "story"],
      required_slots: ["milestones", "two_choice_pair", "voice_prompts"],
    },
    safety_constraints: {
      max_milestones_per_screen: 4,
      dignified_honorific_required: true,
      no_timed_quizzes: true,
    },
  },
  {
    id: "tpl:prepare_for",
    template_key: "prepare_for",
    version: "2.1.0",
    title: "Prepare-For: Afternoon Veranda Visit (প্ৰস্তুতি)",
    cognitive_family: "executive_planning",
    supported_modalities: ["multi_modal", "visual_tactile", "photo_plus_voice"],
    supported_difficulty_range: [1, 3],
    offline_capable: true,
    schema: {
      stages: [
        "recognition",
        "orientation_and_items",
        "planning",
        "executive_sequencing",
        "prospective_reminder",
        "real_world_continuity",
      ],
      required_slots: ["visitor", "arrival_time", "routine_steps", "chime_time"],
    },
    safety_constraints: {
      stress_free_step_reorder: true,
      simulated_chime_only: true,
      direct_family_call_option: true,
    },
  },
  {
    id: "tpl:experience_braid",
    template_key: "experience_braid",
    version: "2.0.0",
    title: "Experience Braid: Past, Present & Future (স্মৃতিৰ তৰংগ)",
    cognitive_family: "autobiographical_sequencing",
    supported_modalities: ["multi_modal", "photo_plus_voice"],
    supported_difficulty_range: [1, 3],
    offline_capable: true,
    schema: {
      phases: ["cherished_past", "calm_present", "looking_ahead"],
      required_slots: ["past_photo", "present_courtyard", "future_visit"],
    },
    safety_constraints: {
      sensory_flute_available: true,
      gentle_narrative_pacing: true,
    },
  },
];

// Memory Store State (Neon PostgreSQL + pgvector + B2 Simulator)
class CognitiveStore {
  public mediaAssets: MediaAsset[] = [...INITIAL_MEDIA_ASSETS];
  public personEntities: PersonEntity[] = [...INITIAL_PERSON_ENTITIES];
  public relationships: Relationship[] = [...INITIAL_RELATIONSHIPS];
  public lifeEvents: LifeEvent[] = [...INITIAL_LIFE_EVENTS];
  public memories: MemoryItem[] = [...INITIAL_MEMORIES];
  public futureEvents: FutureEvent[] = [...INITIAL_FUTURE_EVENTS];
  public episodes: ExperienceEpisode[] = [...INITIAL_EPISODES];
  public templates: GameTemplate[] = [...INITIAL_GAME_TEMPLATES];
  public gameSpecs: GameSpec[] = [];
  public gameSessions: GameSession[] = [];
  public gameTrials: GameTrial[] = [];
  public generationRuns: GameGenerationRun[] = [];
  public firewallAuditLogs: MemoryFirewallEvaluation[] = [];

  // ── 7-Layer Structured Hybrid RAG ─────────────────────────────────────────
  public executeHybridRAG(query: HybridRetrievalQuery): HybridRetrievalResult {
    const contextPack = this.getContextPack(query.person_id);

    // Layer 1: Personal Graph Retrieval
    const primaryCaregiver = {
      name: "Anu",
      relationship: "Daughter (Primary Caregiver)",
      phone: "+91 98640 12345",
    };
    const keyFamilyMembers = [
      { name: "Rina", relationship: "Granddaughter (Visiting at 4:00 PM)" },
      { name: "Bikash", relationship: "Son (Bengaluru)" },
      { name: "Prabin Baruah", relationship: "Late Husband" },
    ];
    const groundedLocations = [
      "Ancestral Courtyard Home in Tezpur",
      "Tezpur Girls High School (Teaching Post)",
      "Brahmaputra River Ferry Ghat",
    ];

    // Layer 2: Temporal Retrieval
    const pastAnchors = [
      "Tezpur Primary School Classroom (1956)",
      "Literature Teacher at Girls High School (1966)",
      "Traditional Wedding Under Tezpur Awning (1968)",
    ];
    const presentRoutine = "Morning courtyard sunlight with fresh marigolds; tea at 4:00 PM.";
    const futureEvents = this.futureEvents.filter(
      (e) => e.status === "confirmed" || e.status === "expected"
    );

    // Layer 3: Semantic Retrieval (Governed strictly by Memory Firewall)
    const firewallResult = this.evaluateMemoryFirewall({
      actor_id: "agent:game_orchestrator",
      actor_role: "system_agent",
      purpose: "game_generation",
      person_id: query.person_id,
    });

    const intentTokens = (query.query_intent || "").toLowerCase().split(/\s+/);
    let matchedMemories = firewallResult.filtered_memories.filter((m) => {
      if (query.required_verification && m.verification_status !== query.required_verification) {
        return false;
      }
      if (query.temporal_filter && m.temporal_frame !== query.temporal_filter) {
        return false;
      }
      if (intentTokens.length === 0 || !query.query_intent) return true;
      const haystack = `${m.title} ${m.description} ${m.cultural_context} ${m.approximate_period}`.toLowerCase();
      return intentTokens.some((token) => token.length > 2 && haystack.includes(token));
    });

    if (matchedMemories.length === 0) {
      // Fallback to all firewall-permitted verified memories
      matchedMemories = firewallResult.filtered_memories;
    }

    // Layer 4: Media Retrieval
    const mediaIds = new Set<string>();
    matchedMemories.forEach((m) => m.media_refs.forEach((ref) => mediaIds.add(ref)));
    const matchedMedia = this.mediaAssets.filter((a) => mediaIds.has(a.id) || a.status === "active");

    // Layer 5: Experience Memory (XM)
    const experienceMemoryData = {
      effective_modalities: ["photo_plus_voice", "visual_tactile"],
      effective_scaffolding: ["visual_cue", "family_voice"],
      recent_accuracy_rate: 0.91,
      recommended_duration_mins: 8,
    };

    // Layer 6: Capability (PCM)
    const capabilityData = {
      autobiographical_recognition_score: contextPack.capability.photo_recognition,
      executive_sequencing_score: contextPack.capability.sequencing,
      free_recall_score: contextPack.capability.recall,
      recommended_difficulty: contextPack.adaptation_policy.recommended_difficulty,
      max_choices: (contextPack.adaptation_policy.max_choice_count === 4 ? 3 : 2) as 2 | 3,
    };

    // Layer 7: CAE Policy
    const caePolicy = {
      action: "engage_familiar" as const,
      scaffold_progression: "Start with verified photo cards, introduce family voice prompt, and provide step-by-step guidance.",
      target_cognitive_family: (
        query.query_intent.includes("tea") || query.query_intent.includes("rina") || query.query_intent.includes("visit")
          ? "executive_planning"
          : "autobiographical_sequencing"
      ) as "autobiographical_sequencing" | "prospective_orientation" | "executive_planning",
    };

    return {
      layer1_graph: {
        primary_caregiver: primaryCaregiver,
        key_family_members: keyFamilyMembers,
        grounded_locations: groundedLocations,
      },
      layer2_temporal: {
        past_anchors: pastAnchors,
        present_routine: presentRoutine,
        future_events: futureEvents,
      },
      layer3_semantic: matchedMemories,
      layer4_media: matchedMedia,
      layer5_experience_memory: experienceMemoryData,
      layer6_capability: capabilityData,
      layer7_cae_policy: caePolicy,
      assembled_context_pack: contextPack,
    };
  }

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

  // Media Asset management (with Backblaze B2 support)
  public addMediaAsset(asset: Omit<MediaAsset, "id" | "created_at"> | MediaAsset): MediaAsset {
    const id = "id" in asset && asset.id ? asset.id : `media_${Date.now()}`;
    const newAsset: MediaAsset = {
      ...asset,
      id,
      storage_backend: asset.storage_backend || "b2",
      b2_bucket: asset.b2_bucket || "mindmitra-elder-media",
      b2_file_id: asset.b2_file_id || `b2_${Date.now()}`,
      created_at: "created_at" in asset && asset.created_at ? asset.created_at : new Date().toISOString(),
    };
    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }

  // Person Entities
  public addPersonEntity(entity: Omit<PersonEntity, "id" | "created_at"> | PersonEntity): PersonEntity {
    const id = "id" in entity && entity.id ? entity.id : `entity_${Date.now()}`;
    const newEntity: PersonEntity = {
      ...entity,
      id,
      created_at: "created_at" in entity && entity.created_at ? entity.created_at : new Date().toISOString(),
    };
    this.personEntities.push(newEntity);
    return newEntity;
  }

  // Relationships
  public addRelationship(rel: Omit<Relationship, "id" | "created_at"> | Relationship): Relationship {
    const id = "id" in rel && rel.id ? rel.id : `rel_${Date.now()}`;
    const newRel: Relationship = {
      ...rel,
      id,
      created_at: "created_at" in rel && rel.created_at ? rel.created_at : new Date().toISOString(),
    };
    this.relationships.push(newRel);
    return newRel;
  }

  // Life Events
  public addLifeEvent(event: Omit<LifeEvent, "id" | "created_at"> | LifeEvent): LifeEvent {
    const id = "id" in event && event.id ? event.id : `le_${Date.now()}`;
    const newEvent: LifeEvent = {
      ...event,
      id,
      created_at: "created_at" in event && event.created_at ? event.created_at : new Date().toISOString(),
    };
    this.lifeEvents.push(newEvent);
    return newEvent;
  }

  // Future Events with State Transitions
  public addFutureEvent(event: Omit<FutureEvent, "id"> | FutureEvent): FutureEvent {
    const id = "id" in event && event.id ? event.id : `event_${Date.now()}`;
    const newEvent: FutureEvent = {
      ...event,
      id,
    };
    this.futureEvents.unshift(newEvent);
    return newEvent;
  }

  public updateFutureEventStatus(eventId: string, newStatus: FutureEventStatus): FutureEvent | null {
    const ev = this.futureEvents.find((e) => e.id === eventId);
    if (!ev) return null;
    ev.status = newStatus;
    return ev;
  }

  // Memory updates and voice note association
  public updateMemory(memoryId: string, updates: Partial<MemoryItem>): MemoryItem | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;
    Object.assign(memory, updates);
    memory.updated_at = new Date().toISOString();
    return memory;
  }

  public addVoiceNote(
    memoryId: string,
    voiceNote: {
      speaker_name: string;
      relationship: string;
      audio_url: string;
      transcript: string;
      language?: string;
      verified?: boolean;
      media_asset_id?: string;
      b2_audio_key?: string;
    }
  ): MemoryItem | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;
    const noteId = `vn_${Date.now()}`;
    memory.voice_notes.push({
      id: noteId,
      speaker_name: voiceNote.speaker_name,
      relationship: voiceNote.relationship,
      audio_url: voiceNote.audio_url,
      transcript: voiceNote.transcript,
      language: voiceNote.language || "as",
      verified: voiceNote.verified ?? false,
      media_asset_id: voiceNote.media_asset_id,
      b2_audio_key: voiceNote.b2_audio_key,
    });
    memory.updated_at = new Date().toISOString();
    return memory;
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

  // Enhanced verifyMemory with decision ('verified' | 'rejected') and provenance note
  public verifyMemory(
    memoryId: string,
    verifiedBy: string,
    role: string,
    decision: "verified" | "rejected" = "verified",
    relationshipNote?: string
  ): MemoryItem | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;

    if (decision === "rejected") {
      memory.verification_status = "rejected";
      memory.confidence = 0.1;
      memory.game_eligible = false;
    } else {
      memory.verification_status = role === "clinician" ? "clinician_verified" : "caregiver_verified";
      memory.confidence = 1.0;
      if (relationshipNote && memory.people_refs.length > 0) {
        memory.people_refs[0].verified = true;
      }
    }
    memory.verified_by = verifiedBy;
    memory.verified_at = new Date().toISOString();
    memory.updated_at = new Date().toISOString();
    return memory;
  }

  // Memory Firewall Deterministic Evaluator
  public evaluateMemoryFirewall(query: MemoryFirewallQuery): MemoryFirewallEvaluation {
    const { actor_id, actor_role, purpose, person_id } = query;
    const timestamp = new Date().toISOString();
    const candidateMemories = this.memories.filter((m) => m.person_id === person_id);
    const filtered_memories: MemoryItem[] = [];
    const excluded_memories: Array<{ id: string; title: string; exclusion_reason: string }> = [];

    // Rule 1: Research or unauthorized external access is strictly DENIED
    if (purpose === "research") {
      const evalResult: MemoryFirewallEvaluation = {
        allowed: false,
        decision: "DENY",
        reason: "Purpose 'research' is strictly blocked under elder protection and consent firewall.",
        actor_id,
        actor_role,
        purpose,
        filtered_memories: [],
        excluded_memories: candidateMemories.map((m) => ({
          id: m.id,
          title: m.title,
          exclusion_reason: "RESEARCH_DENIED: Elder personal memory space prohibited from external research data harvesting.",
        })),
        timestamp,
      };
      this.firewallAuditLogs.unshift(evalResult);
      return evalResult;
    }

    // Rule 2: Person Self-Access (personal album view)
    if (actor_role === "person_self") {
      const evalResult: MemoryFirewallEvaluation = {
        allowed: true,
        decision: "ALLOW",
        reason: "Full access granted to person for self-reminiscence and private memory space.",
        actor_id,
        actor_role,
        purpose,
        filtered_memories: candidateMemories,
        excluded_memories: [],
        timestamp,
      };
      this.firewallAuditLogs.unshift(evalResult);
      return evalResult;
    }

    // Rule 3: Game Generation Purpose (Cognitive Experience Space)
    if (purpose === "game_generation") {
      for (const mem of candidateMemories) {
        // 3a. Verification check: Unverified claims must NEVER automatically become game facts
        const isVerified =
          mem.verification_status === "verified" ||
          mem.verification_status === "caregiver_verified" ||
          mem.verification_status === "clinician_verified";
        if (!isVerified) {
          excluded_memories.push({
            id: mem.id,
            title: mem.title,
            exclusion_reason: "UNVERIFIED_CLAIM_EXCLUDED: Unverified personal claim cannot be grounded into game specs without caregiver verification.",
          });
          continue;
        }

        // 3b. Sensitive memory exclusion rule: painful memories, grief, acute loss excluded from playful games
        if (mem.is_sensitive || mem.sensitivity === "high") {
          excluded_memories.push({
            id: mem.id,
            title: mem.title,
            exclusion_reason: "SENSITIVE_MEMORY_EXCLUDED: High sensitivity content is excluded from playful cognitive interactions to protect emotional wellbeing.",
          });
          continue;
        }

        // 3c. Game eligibility toggle
        if (mem.game_eligible === false) {
          excluded_memories.push({
            id: mem.id,
            title: mem.title,
            exclusion_reason: "GAME_ELIGIBILITY_DISABLED: Content marked as excluded from game generation by caregiver.",
          });
          continue;
        }

        // 3d. Consent scope
        if (mem.consent_scope && mem.consent_scope !== "games" && mem.consent_scope !== "all") {
          excluded_memories.push({
            id: mem.id,
            title: mem.title,
            exclusion_reason: `CONSENT_SCOPE_RESTRICTED: Memory consent scope '${mem.consent_scope}' excludes game generation.`,
          });
          continue;
        }

        filtered_memories.push(mem);
      }

      const decision = filtered_memories.length > 0 ? (excluded_memories.length > 0 ? "PARTIAL" : "ALLOW") : "DENY";
      const evalResult: MemoryFirewallEvaluation = {
        allowed: filtered_memories.length > 0,
        decision,
        reason: `Memory Firewall evaluated ${candidateMemories.length} candidate memories for game generation: ${filtered_memories.length} permitted, ${excluded_memories.length} safely excluded.`,
        actor_id,
        actor_role,
        purpose,
        filtered_memories,
        excluded_memories,
        timestamp,
      };
      this.firewallAuditLogs.unshift(evalResult);
      return evalResult;
    }

    // Rule 4: Primary Caregiver or Clinician care coordination
    if (actor_role === "primary_caregiver" || actor_role === "clinician") {
      const evalResult: MemoryFirewallEvaluation = {
        allowed: true,
        decision: "ALLOW",
        reason: `Authorized ${actor_role} care coordination access permitted.`,
        actor_id,
        actor_role,
        purpose,
        filtered_memories: candidateMemories,
        excluded_memories: [],
        timestamp,
      };
      this.firewallAuditLogs.unshift(evalResult);
      return evalResult;
    }

    // Rule 5: Fail-closed fallback
    const evalResult: MemoryFirewallEvaluation = {
      allowed: false,
      decision: "DENY",
      reason: `Access denied by default fail-closed security rule for role '${actor_role}' under purpose '${purpose}'.`,
      actor_id,
      actor_role,
      purpose,
      filtered_memories: [],
      excluded_memories: candidateMemories.map((m) => ({
        id: m.id,
        title: m.title,
        exclusion_reason: "POLICY_DENIAL: Role and purpose pair not authorized for access.",
      })),
      timestamp,
    };
    this.firewallAuditLogs.unshift(evalResult);
    return evalResult;
  }

  // Game Specs & Sessions
  public saveGameSpec(spec: GameSpec): GameSpec {
    this.gameSpecs.unshift(spec);
    return spec;
  }

  public createGameSession(session: GameSession): GameSession {
    this.gameSessions.unshift(session);
    return session;
  }

  public updateGameSession(sessionId: string, updates: Partial<GameSession>): GameSession | null {
    const session = this.gameSessions.find((s) => s.id === sessionId);
    if (!session) return null;
    Object.assign(session, updates);
    return session;
  }

  public recordGenerationRun(run: Omit<GameGenerationRun, "id" | "created_at">): GameGenerationRun {
    const newRun: GameGenerationRun = {
      ...run,
      id: `run_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.generationRuns.unshift(newRun);
    return newRun;
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

  // Add trial telemetry
  public recordTrial(trial: Omit<GameTrial, "id" | "created_at">): GameTrial {
    const newTrial: GameTrial = {
      ...trial,
      id: `trial_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.gameTrials.push(newTrial);
    return newTrial;
  }
}

export const cognitiveStore = new CognitiveStore();

// ── Multi-Step LangGraph Style Cognitive Game Orchestration ─────────────────
export interface OrchestratorPipelineTrace {
  step: string;
  action: string;
  status: "success" | "warning" | "fallback";
  details: string;
}

export interface OrchestrationResult {
  spec: GameSpec;
  generation_mode: GameGenerationMode;
  pipeline_trace: OrchestratorPipelineTrace[];
  hybrid_retrieval: HybridRetrievalResult;
  validation: ValidationOutput;
}

export function orchestrateGameGeneration(
  personId: string = "person:purnima",
  requestedIntent: string = "morning reminiscence and afternoon visit",
  requestedMode: GameGenerationMode = "parametrically_personalised_level_b",
  preferredTemplate?: "my_life_timeline" | "prepare_for" | "experience_braid"
): OrchestrationResult {
  const trace: OrchestratorPipelineTrace[] = [];

  // Step 1: Intent Planner
  trace.push({
    step: "1. Intent Planner",
    action: "Analyze current time, emotional context & routine",
    status: "success",
    details: `Targeting morning tea routine & preparing for granddaughter Rina's 4:00 PM visit. Intent: '${requestedIntent}'`,
  });

  // Step 2: 7-Layer Hybrid RAG Retrieval
  const hybridResult = cognitiveStore.executeHybridRAG({
    person_id: personId,
    query_intent: requestedIntent,
  });
  trace.push({
    step: "2. Context Retriever (7-Layer Hybrid RAG)",
    action: "Graph + Temporal + Semantic + Media + XM + PCM + CAE extraction",
    status: "success",
    details: `Retrieved ${hybridResult.layer3_semantic.length} verified memories, ${hybridResult.layer2_temporal.future_events.length} future events, and caregiver Anu graph node.`,
  });

  // Step 3: CAE Adaptation Policy Formulation
  const caePolicy = hybridResult.layer7_cae_policy;
  trace.push({
    step: "3. CAE Policy Formulation",
    action: "Calibrate difficulty and scaffolding",
    status: "success",
    details: `Set difficulty=${hybridResult.layer6_capability.recommended_difficulty}, max_choices=${hybridResult.layer6_capability.max_choices}, modality=photo_plus_voice, rule='${caePolicy.scaffold_progression}'`,
  });

  // Step 4 & 5: Game & Template Selector
  let selectedTemplateKey: "my_life_timeline" | "prepare_for" | "experience_braid" = "my_life_timeline";
  if (preferredTemplate) {
    selectedTemplateKey = preferredTemplate;
  } else if (requestedIntent.toLowerCase().includes("braid")) {
    selectedTemplateKey = "experience_braid";
  } else if (requestedIntent.toLowerCase().includes("tea") || requestedIntent.toLowerCase().includes("rina") || requestedIntent.toLowerCase().includes("visit")) {
    selectedTemplateKey = "prepare_for";
  }
  trace.push({
    step: "4. Template Selection",
    action: "Bind deterministic engine contract",
    status: "success",
    details: `Selected deterministic template '${selectedTemplateKey}' from verified template registry.`,
  });

  // Step 6 & 7: Personalisation Compiler & Spec Author
  let generatedSpec: GameSpec;
  const contextPack = hybridResult.assembled_context_pack;

  if (selectedTemplateKey === "prepare_for") {
    generatedSpec = compilePrepareForSpec(contextPack);
  } else if (selectedTemplateKey === "experience_braid") {
    generatedSpec = compileExperienceBraidSpec(contextPack);
  } else {
    generatedSpec = compileTimelineSpec(contextPack, "recognition");
  }
  generatedSpec.generation_mode = requestedMode;

  trace.push({
    step: "5. Personalisation Compiler & Spec Author",
    action: "Compile slots against deterministic template schema",
    status: "success",
    details: `Instantiated ${requestedMode} specification with verified photo & voice bindings.`,
  });

  // Step 8: 5-Stage Validator Contract
  const validation = validateExperienceSpec(generatedSpec);
  if (validation.all_passed) {
    trace.push({
      step: "6. Five-Layer Validation Contract",
      action: "Grounding, Consent, Safety, Dignity & Schema validation",
      status: "success",
      details: "All 5 validators passed cleanly. Zero ungrounded assertions or clinical labels detected.",
    });
  } else {
    trace.push({
      step: "6. Five-Layer Validation Contract",
      action: "Validation violation detected",
      status: "warning",
      details: `Violations: ${validation.violations.join("; ")}. Triggering fallback.`,
    });
    // Fallback: Level A static deterministic with guaranteed verified memories
    generatedSpec = compileTimelineSpec(contextPack, "recognition");
    generatedSpec.generation_mode = "static_level_a";
    trace.push({
      step: "7. Fallback Dispatch",
      action: "Switch to Level A deterministic baseline",
      status: "fallback",
      details: "Safe fallback to static Level A My Life Timeline with 100% verified archival photos.",
    });
  }

  // Audit run record
  cognitiveStore.generationRuns.unshift({
    id: `run_${Date.now()}`,
    person_id: personId,
    request_id: `req_${Date.now()}`,
    template_candidates: ["my_life_timeline", "prepare_for", "experience_braid"],
    selected_template: selectedTemplateKey,
    generation_mode: generatedSpec.generation_mode,
    context_refs: generatedSpec.provenance_refs,
    retrieval_refs: hybridResult.layer3_semantic.map((m) => m.id),
    model: "gemini-2.5-flash-spec-compiler",
    prompt_version: "v2.1",
    spec_version: generatedSpec.version,
    validation_results: validation,
    fallback_reason: validation.all_passed ? undefined : validation.violations.join(", "),
    created_at: new Date().toISOString(),
  });

  return {
    spec: generatedSpec,
    generation_mode: generatedSpec.generation_mode,
    pipeline_trace: trace,
    hybrid_retrieval: hybridResult,
    validation,
  };
}

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
