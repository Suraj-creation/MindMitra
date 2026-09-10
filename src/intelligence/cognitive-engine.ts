import {
  MediaAsset,
  MemoryItem,
  FutureEvent,
  PersonalGameContextPack,
  GameSpec,
  GameTrialTelemetry,
  ExperienceEpisode,
  GameGenerationMode,
  FamiliarPlace,
  FamiliarRoute,
  RouteSegment,
  MemoryMedia,
  MemoryPerson,
  MemoryVoiceNote,
  MemoryExperienceHistory,
  GameContextSnapshot,
  MemorySource,
  MemoryVerificationStatus,
  ConsentScope,
  VisibilityScope,
  SensitivityLevel,
} from "../domain/cognitive-experience";
import {
  capabilityModel,
  memoryFreshnessTracker,
  CrossGameLearningEngine,
  ProgressivePersonalisationLadder,
} from "./adaptation/index.js";

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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:10:00Z",
    updated_at: "2026-08-15T10:10:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:rina",
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    updated_at: "2026-09-01T12:00:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    updated_at: "2026-09-01T12:00:00Z",
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
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "system",
    created_at: "2026-09-01T12:00:00Z",
    updated_at: "2026-09-01T12:00:00Z",
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
    consent_scope: "all",
    visibility_scope: "family",
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
    created_by: "actor:anu",
    created_at: "2026-08-15T10:10:00Z",
    updated_at: "2026-08-15T10:10:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:10:00Z",
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
    consent_scope: "all",
    visibility_scope: "family",
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
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:05:00Z",
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
    consent_scope: "all",
    visibility_scope: "family",
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
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
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
    consent_scope: "all",
    visibility_scope: "family",
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
    created_by: "actor:anu",
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-09-01T14:30:00Z",
  },
  {
    id: "mem:tea_garden_bihu",
    person_id: "person:purnima",
    memory_type: "cultural",
    title: "Spring Bihu Melody & Sonitpur Tea Garden Mornings",
    assamese_title: "বসন্তৰ বিহু আৰু সোণিতপুৰৰ চাহ বাগিচাৰ পুৱা",
    description: "Listening to the morning flute and celebrating Rongali Bihu surrounded by family, fresh tea leaves, and spring blossoms.",
    temporal_frame: "later_life",
    approximate_period: "1980s - 1990s",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    cultural_context: "Rongali Bihu, Assamese Pepa & Flute, Sonitpur Tea Gardens",
    media_refs: ["media:tea_garden_morning"],
    people_refs: [],
    voice_notes: [
      {
        id: "vn:anu_bihu_story",
        speaker_name: "Anu",
        relationship: "daughter",
        audio_url: "",
        transcript: "Ma, every Rongali Bihu morning you would dress us in new muga silk and play the bamboo flute songs on the courtyard veranda.",
        language: "as",
        verified: true,
      },
    ],
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
];

export const INITIAL_MEMORY_MEDIA: MemoryMedia[] = [
  {
    id: "mm:05",
    memory_id: "mem:tea_garden_bihu",
    media_asset_id: "media:tea_garden_morning",
    role: "primary_photo",
    caption: "Morning Mist over Sonitpur Tea Gardens",
    display_order: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mm:01",
    memory_id: "mem:childhood_school",
    media_asset_id: "media:school_childhood_1956",
    role: "primary_photo",
    caption: "Early school days in Tezpur",
    display_order: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:10:00Z",
    updated_at: "2026-08-15T10:10:00Z",
  },
  {
    id: "mm:02",
    memory_id: "mem:first_teaching_job",
    media_asset_id: "media:teaching_1974",
    role: "primary_photo",
    caption: "Teaching at Tezpur Girls School",
    display_order: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "mm:03",
    memory_id: "mem:wedding_ceremony",
    media_asset_id: "media:wedding_1968",
    role: "primary_photo",
    caption: "Purnima's Wedding Ceremony in Tezpur",
    display_order: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mm:04",
    memory_id: "mem:rina_granddaughter",
    media_asset_id: "media:rina_portrait_2025",
    role: "primary_photo",
    caption: "Granddaughter Rina smiling in Tezpur courtyard",
    display_order: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
  },
];

export const INITIAL_MEMORY_PEOPLE: MemoryPerson[] = [
  {
    id: "mp:01",
    memory_id: "mem:wedding_ceremony",
    person_entity_id: "entity:late_husband",
    name: "Prabin Baruah",
    relationship: "late husband",
    role_in_memory: "groom",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mp:02",
    memory_id: "mem:rina_granddaughter",
    person_entity_id: "entity:rina",
    name: "Rina Baruah",
    relationship: "granddaughter",
    role_in_memory: "beloved granddaughter",
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
  },
];

export const INITIAL_MEMORY_VOICE_NOTES: MemoryVoiceNote[] = [
  {
    id: "mvn:01",
    memory_id: "mem:childhood_school",
    media_asset_id: "media:school_childhood_1956",
    speaker_name: "Anu",
    relationship: "daughter",
    audio_url: "/assets/audio/anu_school_memory.mp3",
    transcript: "Ma, you always told us how you loved writing Assamese poetry on your little slate board in class 4.",
    language: "as",
    duration_seconds: 14,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:10:00Z",
    updated_at: "2026-08-15T10:10:00Z",
  },
  {
    id: "mvn:02",
    memory_id: "mem:first_teaching_job",
    media_asset_id: "media:teaching_1974",
    speaker_name: "Rina",
    relationship: "granddaughter",
    audio_url: "/assets/audio/rina_teaching_tribute.mp3",
    transcript: "Aitâ, so many people in Tezpur still remember your wonderful literature classes!",
    language: "as",
    duration_seconds: 12,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:rina",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "mvn:03",
    memory_id: "mem:wedding_ceremony",
    media_asset_id: "media:wedding_1968",
    speaker_name: "Anu",
    relationship: "daughter",
    audio_url: "/assets/audio/anu_wedding_memory.mp3",
    transcript: "Ma, Baba's smile in this wedding photo under the courtyard awning is always so radiant.",
    language: "as",
    duration_seconds: 15,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "mvn:04",
    memory_id: "mem:rina_granddaughter",
    media_asset_id: "media:rina_portrait_2025",
    speaker_name: "Rina",
    relationship: "granddaughter",
    audio_url: "/assets/audio/rina_greeting_voice.mp3",
    transcript: "Aitâ, I'm coming to see you today at 4 PM! Keep my favourite cardamom tea ready!",
    language: "as",
    duration_seconds: 10,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:rina",
    created_at: "2026-09-01T14:30:00Z",
    updated_at: "2026-09-01T14:30:00Z",
  },
];

export const INITIAL_FAMILIAR_PLACES: FamiliarPlace[] = [
  {
    id: "pl:tezpur_home",
    person_id: "person:purnima",
    name: "Ancestral Home in Tezpur",
    assamese_name: "তেজপুৰৰ পৈতৃক ঘৰ",
    category: "home",
    significance: "Safe primary sanctuary where Purnima has lived for 58 years with family and raised her children",
    description: "Spacious traditional courtyard home near the river with green veranda, mango trees, and brass bell.",
    landmark_cues: [
      "Old veranda with green bamboo railing",
      "Courtyard mango tree with wooden bench",
      "Red gate with yellow flowering allamanda",
      "Brass water pump near the kitchen garden",
    ],
    sensory_cues: {
      visual: ["Morning sunlight filtering through mango leaves", "Clay roof tiles and whitewashed pillars", "Altar brass lamps"],
      auditory: ["Morning myna birds in the courtyard", "Distant Brahmaputra temple bell", "Sound of fresh water pumping"],
      olfactory: ["Fresh ginger tea brewing", "Night-blooming jasmine (Xewali phool)", "Incense from prayer corner"],
    },
    approximate_period: "1968 - Present",
    coordinates: { latitude: 26.6338, longitude: 92.7926 },
    media_refs: ["media:tea_ceremony_brass"],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "pl:girls_school",
    person_id: "person:purnima",
    name: "Tezpur Girls High School",
    assamese_name: "তেজপুৰ বালিকা উচ্চতৰ মাধ্যমিক বিদ্যালয়",
    category: "school",
    significance: "Cherished school where Purnima served as literature teacher and mentor for over 30 years",
    description: "Historic red-brick educational institution with colonial arched verandas and library overlooking eucalyptus trees.",
    landmark_cues: [
      "Colonial arched wooden porch",
      "Heritage red-brick library",
      "Brahmaputra view from second-floor staff room",
      "Old cast iron school bell",
    ],
    sensory_cues: {
      visual: ["Eucalyptus trees framing the front arch", "Wooden desks and blackboard"],
      auditory: ["Echo of students reciting Assamese poetry", "School bell chime at noon"],
      olfactory: ["Old book paper and chalk dust"],
    },
    approximate_period: "1966 - 1998",
    coordinates: { latitude: 26.6295, longitude: 92.7992 },
    media_refs: ["media:teaching_1974"],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "pl:brahmaputra_ghat",
    person_id: "person:purnima",
    name: "Brahmaputra River Ghat at Tezpur",
    assamese_name: "তেজপুৰৰ ব্ৰহ্মপুত্ৰ ঘাট",
    category: "river_ghat",
    significance: "Serene riverbank promenade where Purnima and late husband Prabin walked every Sunday evening",
    description: "Ancient stone ghat with wide steps leading down to the sacred Brahmaputra, shaded by towering banyan trees.",
    landmark_cues: [
      "Ancient stone steps descending into river",
      "Large banyan tree shade with stone platform",
      "Traditional wooden ferry boats tied to bamboo poles",
      "River breeze promenade walkway",
    ],
    sensory_cues: {
      visual: ["Expansive shimmering water at sunset", "Silhouette of river boats"],
      auditory: ["Gentle lapping of waves against stones", "Evening boatman's song (Bhatiyali)"],
      olfactory: ["Cool river breeze and wet silt", "Roasted gram from sidewalk vendor"],
    },
    approximate_period: "1968 - Present",
    coordinates: { latitude: 26.6212, longitude: 92.7951 },
    media_refs: ["media:brahmaputra_ghat"],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "pl:mahabhairab_temple",
    person_id: "person:purnima",
    name: "Mahabhairab Temple & Community Naamghar",
    assamese_name: "মহাভৈৰৱ মন্দিৰ আৰু নামঘৰ",
    category: "temple_naamghar",
    significance: "Spiritual sanctuary for Bihu blessings and family prayers",
    description: "Ancient temple hillock with white marble courtyard and resonance of traditional Doba drum.",
    landmark_cues: [
      "Golden spire visible above hilltop trees",
      "Carved stone lion guardians",
      "Sacred Doba drum platform",
      "Corridor of earthen oil lamps",
    ],
    sensory_cues: {
      visual: ["Golden flame glow from brass lamps", "White flower garlands"],
      auditory: ["Deep sacred drum echo", "Naam kirtan chanting"],
      olfactory: ["Camphor, sandalwood paste, and marigold flowers"],
    },
    approximate_period: "Lifetime",
    coordinates: null, // GPS coordinates not required
    media_refs: [],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "pl:chowk_bazaar",
    person_id: "person:purnima",
    name: "Tezpur Chowk Bazaar",
    assamese_name: "তেজপুৰ চক বজাৰ",
    category: "market",
    significance: "Local central bazaar for fresh tea leaves, seasonal vegetables, and festival shopping",
    description: "Vibrant community market with clock tower corner and friendly shopkeepers who know Purnima's family.",
    landmark_cues: [
      "Heritage Clock Tower corner",
      "Old stationery and book depot",
      "Flower market under colourful canvas shades",
      "Cardamom tea stall with tin canopy",
    ],
    sensory_cues: {
      visual: ["Baskets of golden marigolds and green betel leaves", "Clock tower dials"],
      auditory: ["Friendly vendor calls", "Radio playing vintage Assamese songs"],
      olfactory: ["Fresh mustard oil, ripe bananas, roasted spices"],
    },
    approximate_period: "Lifetime",
    coordinates: null,
    media_refs: [],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "pl:cole_park",
    person_id: "person:purnima",
    name: "Chitralekha Udyan (Cole Park)",
    assamese_name: "চিত্ৰলেখা উদ্যান (কোল পাৰ্ক)",
    category: "other",
    significance: "Tranquil botanical park in Tezpur where Purnima took family evening walks under shaded trees",
    description: "Historic park with ancient carved stone relics, flowering garden paths, and peaceful benches overlooking the lotus pond.",
    landmark_cues: [
      "Ancient carved stone pillars and ornamental lotus pond",
      "Bougainvillea archway welcoming visitors",
      "Wooden shaded benches along the cobblestone lane",
      "Fragrant garden beds of marigolds and champa",
    ],
    sensory_cues: {
      visual: ["Sunlight sparkling over the pond water", "Pink bougainvillea flowers", "Ancient stone carvings"],
      auditory: ["Gentle morning bird song", "Water fountain splashing softly"],
      olfactory: ["Freshly cut grass and sweet garden champa flowers"],
    },
    approximate_period: "Lifetime",
    coordinates: { latitude: 26.6265, longitude: 92.7958 },
    media_refs: ["media:tea_garden_morning"],
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
];

export const INITIAL_ROUTE_SEGMENTS: RouteSegment[] = [
  // Segments for rt:home_to_river_ghat
  {
    id: "seg:ghat_1",
    route_id: "rt:home_to_river_ghat",
    segment_order: 1,
    from_landmark: "Courtyard Veranda & Red Gate",
    to_landmark: "Night-blooming Jasmine (Xewali) Corner",
    visual_cue: "Step past the red wrought-iron gate wrapped in flowering yellow allamanda onto the shaded path",
    sensory_description: "Gentle scent of jasmine and warm morning courtyard paving",
    turn_instruction: "straight",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "seg:ghat_2",
    route_id: "rt:home_to_river_ghat",
    segment_order: 2,
    from_landmark: "Jasmine Corner",
    to_landmark: "Riverbank Tea Vendor with Tin Canopy",
    visual_cue: "Follow the paved river road alongside the bamboo grove until you see the tea vendor with blue wooden stool",
    sensory_description: "Cardamom tea boiling and old transistor radio playing Bhupen Hazarika melodies",
    turn_instruction: "straight",
    is_key_decision_point: true,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "seg:ghat_3",
    route_id: "rt:home_to_river_ghat",
    segment_order: 3,
    from_landmark: "Tea Vendor with Tin Canopy",
    to_landmark: "Grand Banyan Tree Stone Arch",
    visual_cue: "Turn gently right at the tea stall toward the grand heritage banyan tree with wide hanging aerial roots",
    sensory_description: "Rustling leaves and cooler river air flowing in",
    turn_instruction: "turn_right",
    is_key_decision_point: true,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "seg:ghat_4",
    route_id: "rt:home_to_river_ghat",
    segment_order: 4,
    from_landmark: "Grand Banyan Tree Stone Arch",
    to_landmark: "Brahmaputra River Ghat Steps",
    visual_cue: "Walk down the wide stone steps to arrive at the open water view of the majestic river",
    sensory_description: "Sound of river waves lapping gently against stone and fresh evening river breeze",
    turn_instruction: "arrive",
    photo_asset_id: "media:brahmaputra_ghat",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  // Segments for rt:home_to_girls_school
  {
    id: "seg:school_1",
    route_id: "rt:home_to_girls_school",
    segment_order: 1,
    from_landmark: "Red Courtyard Gate",
    to_landmark: "District Library Benches",
    visual_cue: "Exit gate and walk straight down Church Road past the whitewashed garden walls",
    sensory_description: "Morning bird songs in the gulmohar trees",
    turn_instruction: "straight",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "seg:school_2",
    route_id: "rt:home_to_girls_school",
    segment_order: 2,
    from_landmark: "District Library Benches",
    to_landmark: "Colonial Red Brick School Arch",
    visual_cue: "Turn left at the red postbox opposite the library benches toward the school gate",
    sensory_description: "Sound of school chimes and laughing children",
    turn_instruction: "turn_left",
    is_key_decision_point: true,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "seg:school_3",
    route_id: "rt:home_to_girls_school",
    segment_order: 3,
    from_landmark: "Colonial Red Brick School Arch",
    to_landmark: "Tezpur Girls High School Veranda",
    visual_cue: "Enter the school courtyard and walk up the veranda stairs to the literature department",
    sensory_description: "Eucalyptus fragrance and the welcoming smiles of fellow teachers",
    turn_instruction: "arrive",
    photo_asset_id: "media:teaching_1974",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
  },
  // Segments for rt:home_to_market (Home -> Park -> Temple -> Market)
  {
    id: "seg:market_1",
    route_id: "rt:home_to_market",
    segment_order: 1,
    from_landmark: "Ancestral Home Courtyard & Red Gate",
    to_landmark: "Chitralekha Udyan (Cole Park)",
    visual_cue: "Walk past the red gate and blooming allamanda down the quiet tree-lined lane toward Cole Park entrance",
    sensory_description: "Cool morning river breeze and sweet scent of garden marigolds",
    turn_instruction: "straight",
    photo_asset_id: "media:tea_garden_morning",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "seg:market_2",
    route_id: "rt:home_to_market",
    segment_order: 2,
    from_landmark: "Chitralekha Udyan (Cole Park)",
    to_landmark: "Mahabhairab Temple Hillock",
    visual_cue: "Pass the carved stone pillars of the park and take the gentle stone path toward the temple hill",
    sensory_description: "Gentle chiming of temple bells and fragrance of sacred camphor and incense",
    turn_instruction: "turn_left",
    is_key_decision_point: true,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "seg:market_3",
    route_id: "rt:home_to_market",
    segment_order: 3,
    from_landmark: "Mahabhairab Temple Hillock",
    to_landmark: "Tezpur Chowk Bazaar & Clock Tower",
    visual_cue: "Follow the descending stone lane right toward the heritage clock tower and lively market stalls",
    sensory_description: "Aroma of fresh roasted spices, sweet cardamom tea, and cheerful vendor greetings",
    turn_instruction: "arrive",
    is_key_decision_point: false,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
];

export const INITIAL_FAMILIAR_ROUTES: FamiliarRoute[] = [
  {
    id: "rt:home_to_river_ghat",
    person_id: "person:purnima",
    title: "Evening Promenade: Home to Brahmaputra River Ghat",
    assamese_title: "ঘৰৰ পৰা ব্ৰহ্মপুত্ৰ ঘাটলৈ সন্ধিয়াৰ খোজ",
    description: "A gentle 12-minute peaceful walk from the courtyard veranda through shaded riverbank lane down to the stone ghat.",
    start_place_id: "pl:tezpur_home",
    destination_place_id: "pl:brahmaputra_ghat",
    routine_frequency: "past_routine",
    estimated_walk_time_mins: 12,
    difficulty: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "rt:home_to_girls_school",
    person_id: "person:purnima",
    title: "School Morning Route: Home to Girls High School",
    assamese_title: "ঘৰৰ পৰা বালিকা বিদ্যালয়লৈ যোৱা চিনাকি বাট",
    description: "The daily morning walk Purnima took for 30 years as a teacher, passing the district library and old banyan.",
    start_place_id: "pl:tezpur_home",
    destination_place_id: "pl:girls_school",
    routine_frequency: "past_routine",
    estimated_walk_time_mins: 15,
    difficulty: 2,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:05:00Z",
    updated_at: "2026-08-15T10:05:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "rt:home_to_market",
    person_id: "person:purnima",
    title: "Morning Market Stroll: Home to Chowk Bazaar",
    assamese_title: "ঘৰৰ পৰা চক বজাৰলৈ পুৱাৰ খোজ",
    description: "A cherished morning walk from the courtyard through Cole Park and Mahabhairab Temple into the bustling market.",
    start_place_id: "pl:tezpur_home",
    destination_place_id: "pl:chowk_bazaar",
    routine_frequency: "weekly",
    estimated_walk_time_mins: 14,
    difficulty: 1,
    source: "caregiver",
    verification_status: "caregiver_verified",
    confidence: 1.0,
    consent_scope: "all",
    visibility_scope: "family",
    sensitivity: "low",
    created_by: "actor:anu",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
    verified_by: "actor:anu",
    verified_at: "2026-08-15T10:00:00Z",
  },
];

export const INITIAL_EXPERIENCE_HISTORY: MemoryExperienceHistory[] = [
  {
    id: "eh:01",
    person_id: "person:purnima",
    game_key: "reminiscence_journey_my_world",
    target_entity_type: "memory",
    target_entity_id: "mem:wedding_ceremony",
    interaction_type: "recognition",
    latency_ms: 1850,
    assistance_level: "none",
    recall_success: true,
    engagement_score: 0.96,
    notes: "Immediate emotional smile upon recognizing 1968 wedding photograph",
    recorded_at: "2026-09-08T10:35:00Z",
  },
  {
    id: "eh:02",
    person_id: "person:purnima",
    game_key: "route_builder_familiar_places",
    target_entity_type: "route",
    target_entity_id: "rt:home_to_river_ghat",
    interaction_type: "landmark_identification",
    latency_ms: 2400,
    assistance_level: "visual_cue",
    recall_success: true,
    engagement_score: 0.92,
    notes: "Identified tea stall and grand banyan tree landmarks with high accuracy",
    recorded_at: "2026-09-09T11:20:00Z",
  },
];

export const INITIAL_GAME_SNAPSHOTS: GameContextSnapshot[] = [
  {
    id: "gs:reminiscence_01",
    person_id: "person:purnima",
    game_key: "reminiscence_journey_my_world",
    snapshot_timestamp: "2026-09-09T12:00:00Z",
    capability_summary: {
      recognition: 0.91,
      photo_recognition: 0.91,
      recall: 0.61,
      sequencing: 0.78,
      recommended_difficulty: 1,
      max_choice_count: 2,
    },
    eligible_memories_count: 4,
    eligible_places_count: 5,
    eligible_routes_count: 2,
    eligible_memory_ids: [
      "mem:childhood_school",
      "mem:first_teaching_job",
      "mem:wedding_ceremony",
      "mem:rina_granddaughter",
    ],
    eligible_place_ids: [
      "pl:tezpur_home",
      "pl:girls_school",
      "pl:brahmaputra_ghat",
      "pl:mahabhairab_temple",
      "pl:chowk_bazaar",
    ],
    eligible_route_ids: ["rt:home_to_river_ghat", "rt:home_to_girls_school"],
    verification_hash: "vhash:verified_purnima_reminiscence_01",
    created_at: "2026-09-09T12:00:00Z",
  },
  {
    id: "gs:route_builder_01",
    person_id: "person:purnima",
    game_key: "route_builder_familiar_places",
    snapshot_timestamp: "2026-09-09T12:00:00Z",
    capability_summary: {
      recognition: 0.91,
      photo_recognition: 0.91,
      recall: 0.61,
      sequencing: 0.78,
      recommended_difficulty: 1,
      max_choice_count: 2,
    },
    eligible_memories_count: 4,
    eligible_places_count: 5,
    eligible_routes_count: 2,
    eligible_memory_ids: [
      "mem:childhood_school",
      "mem:first_teaching_job",
      "mem:wedding_ceremony",
      "mem:rina_granddaughter",
    ],
    eligible_place_ids: [
      "pl:tezpur_home",
      "pl:girls_school",
      "pl:brahmaputra_ghat",
      "pl:mahabhairab_temple",
      "pl:chowk_bazaar",
    ],
    eligible_route_ids: ["rt:home_to_river_ghat", "rt:home_to_girls_school"],
    verification_hash: "vhash:verified_purnima_route_builder_01",
    created_at: "2026-09-09T12:00:00Z",
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
  public memoryMedia: MemoryMedia[] = [...INITIAL_MEMORY_MEDIA];
  public memoryPeople: MemoryPerson[] = [...INITIAL_MEMORY_PEOPLE];
  public memoryVoiceNotes: MemoryVoiceNote[] = [...INITIAL_MEMORY_VOICE_NOTES];
  public familiarPlaces: FamiliarPlace[] = [...INITIAL_FAMILIAR_PLACES];
  public familiarRoutes: FamiliarRoute[] = [...INITIAL_FAMILIAR_ROUTES];
  public routeSegments: RouteSegment[] = [...INITIAL_ROUTE_SEGMENTS];
  public experienceHistory: MemoryExperienceHistory[] = [...INITIAL_EXPERIENCE_HISTORY];
  public gameSnapshots: GameContextSnapshot[] = [...INITIAL_GAME_SNAPSHOTS];
  public futureEvents: FutureEvent[] = [...INITIAL_FUTURE_EVENTS];
  public episodes: ExperienceEpisode[] = [...INITIAL_EPISODES];
  public generationRuns: any[] = [];

  // Generate canonical context pack with cross-person isolation
  public getContextPack(personId: string): PersonalGameContextPack {
    const isPurnima = personId === "person:purnima";
    const displayName = isPurnima ? "Purnima" : personId.replace("person:", "");
    const personPlaces = this.familiarPlaces.filter((p) => p.person_id === personId);
    const personRoutes = this.familiarRoutes.filter((r) => r.person_id === personId);
    const personMemories = this.memories.filter((m) => m.person_id === personId);
    const personEvents = this.futureEvents.filter((e) => e.person_id === personId);

    return {
      person: {
        id: personId,
        display_name: displayName,
        honorific: isPurnima ? "Aitâ" : "",
        preferred_language: isPurnima ? "as" : "en",
        culture: isPurnima ? "Assamese (Tezpur)" : "Standard",
        location: isPurnima ? "Tezpur, Sonitpur, Assam" : "Unknown",
      },
      world: {
        people: isPurnima
          ? [
              { id: "entity:anu", name: "Anu", relationship: "Daughter (Primary Caregiver)", verified: true, phone: "+91 98640 12345" },
              { id: "entity:rina", name: "Rina", relationship: "Granddaughter", verified: true, phone: "+91 94350 98765" },
              { id: "entity:bikash", name: "Bikash", relationship: "Son (Bengaluru)", verified: true, phone: "+91 98860 54321" },
              { id: "entity:meena", name: "Meena", relationship: "ASHA Health Worker", verified: true, phone: "+91 94351 11223" },
            ]
          : [],
        places: personPlaces.length > 0 ? personPlaces : [
          { id: `pl:home_${personId}`, name: `${displayName}'s Home`, significance: "Primary residence" }
        ],
        routes: personRoutes,
        routines: isPurnima
          ? [
              { id: "rt:morning_puja", name: "Morning Puja & Altar Garland", time: "07:30 AM", items: ["Marigolds", "Tulsi", "Bell metal plate"] },
              { id: "rt:afternoon_tea", name: "4:00 PM Veranda Cardamom Tea", time: "04:00 PM", items: ["Assam CTC leaves", "Ginger", "Cardamom", "Brass cups"] },
            ]
          : [],
        memories: personMemories,
        future_events: personEvents,
      },
      temporal: {
        past: isPurnima ? ["Tezpur school days", "1968 Wedding ceremony", "Literature teacher at Girls High School", "Rongali Bihu celebrations"] : [],
        present: isPurnima ? ["Lives safely in Tezpur home", "Daughter Anu nearby", "Morning courtyard sun", "4:00 PM tea routine"] : [],
        future: isPurnima ? ["Granddaughter Rina arriving at 4:00 PM today", "Thursday health visit with ASHA worker Meena", "Upcoming Kati Bihu lighting"] : [],
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
        preferred_topics: isPurnima ? ["Rina visits", "Tezpur school stories", "Assam tea preparation", "Garden flowers"] : [],
      },
      goals: [
        { id: "g1", title: "Preserve autobiographical identity through family photos", cognitive_domain: "autobiographical_memory", status: "active" },
        { id: "g2", title: "Support daily orientation and prospective memory for loved ones' visits", cognitive_domain: "prospective_memory", status: "active" },
        { id: "g3", title: "Foster calm emotional regulation via soothing courtyard audio", cognitive_domain: "wellbeing", status: "active" },
      ],
      adaptation_policy: {
        recommended_difficulty: 2,
        max_choice_count: 2,
        scaffolding_mode: "family_voice",
        modality: "photo_plus_voice",
        renewal_rule: "Start with familiar visual recognition, introduce voice, then gradually remove the cue.",
      },
    };
  }

  // Create or upload media asset with complete 9-field provenance
  public addMediaAsset(item: Partial<MediaAsset> & { person_id: string; title: string; url: string; created_by: string }): MediaAsset {
    const isPerson = item.source === "person";
    const newAsset: MediaAsset = {
      id: item.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      person_id: item.person_id,
      storage_key: item.storage_key || item.url,
      media_type: item.media_type || "photo",
      mime_type: item.mime_type || "image/jpeg",
      thumbnail_url: item.thumbnail_url,
      url: item.url,
      title: item.title,
      source: item.source || (isPerson ? "person" : "caregiver"),
      verification_status: item.verification_status || (isPerson ? "unverified" : "caregiver_verified"),
      confidence: item.confidence !== undefined ? item.confidence : (isPerson ? 0.60 : 1.0),
      consent_scope: item.consent_scope || (isPerson ? "person_only" : "all"),
      visibility_scope: item.visibility_scope || (isPerson ? "private" : "family"),
      sensitivity: item.sensitivity || "low",
      created_by: item.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provenance_id: item.provenance_id || `prov_${Date.now()}`,
      status: "active",
    };
    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }

  // Attach media to memory with explicit role and ordering
  public attachMediaToMemory(
    memoryId: string,
    mediaAssetId: string,
    options?: {
      role?: "primary_photo" | "supporting_photo" | "voice_note" | "document";
      caption?: string;
      displayOrder?: number;
      createdBy?: string;
    }
  ): MemoryMedia | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;
    const media = this.mediaAssets.find((a) => a.id === mediaAssetId);
    if (!media) return null;

    if (!memory.media_refs.includes(mediaAssetId)) {
      memory.media_refs.push(mediaAssetId);
      memory.updated_at = new Date().toISOString();
    }

    const memoryMediaItem: MemoryMedia = {
      id: `mm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      memory_id: memoryId,
      media_asset_id: mediaAssetId,
      role: options?.role || "primary_photo",
      caption: options?.caption || media.title,
      display_order: options?.displayOrder || memory.media_refs.length,
      source: media.source,
      verification_status: memory.verification_status,
      confidence: memory.confidence,
      consent_scope: memory.consent_scope,
      visibility_scope: memory.visibility_scope,
      sensitivity: memory.sensitivity,
      created_by: options?.createdBy || memory.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.memoryMedia.push(memoryMediaItem);
    return memoryMediaItem;
  }

  // Attach media to place
  public attachMediaToPlace(placeId: string, mediaAssetId: string): FamiliarPlace | null {
    const place = this.familiarPlaces.find((p) => p.id === placeId);
    if (!place) return null;
    const media = this.mediaAssets.find((a) => a.id === mediaAssetId);
    if (!media) return null;

    if (!place.media_refs.includes(mediaAssetId)) {
      place.media_refs.push(mediaAssetId);
      place.updated_at = new Date().toISOString();
    }
    return place;
  }

  // Add memory with upload source differentiation (PERSON vs CAREGIVER)
  public addMemory(
    item: Omit<MemoryItem, "id" | "created_at" | "updated_at" | "verification_status" | "confidence"> & {
      verification_status?: MemoryVerificationStatus;
      confidence?: number;
    }
  ): MemoryItem {
    const isPerson = item.source === "person";
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // STRICT RULE: Never silently convert an unverified person claim into a verified fact!
    const verification_status: MemoryVerificationStatus = isPerson
      ? "unverified"
      : item.verification_status || "caregiver_verified";
    const confidence = isPerson ? (item.confidence !== undefined && item.confidence <= 0.7 ? item.confidence : 0.60) : (item.confidence || 0.98);

    const newMemory: MemoryItem = {
      ...item,
      id,
      source: item.source || (isPerson ? "person" : "caregiver"),
      verification_status,
      confidence,
      consent_scope: item.consent_scope || (isPerson ? "person_only" : "all"),
      visibility_scope: item.visibility_scope || (isPerson ? "private" : "family"),
      sensitivity: item.sensitivity || "low",
      created_by: item.created_by,
      created_at: now,
      updated_at: now,
      media_refs: item.media_refs || [],
      people_refs: item.people_refs || [],
      voice_notes: item.voice_notes || [],
    };

    this.memories.unshift(newMemory);

    // Populate relational memory_media if media_refs provided
    if (newMemory.media_refs.length > 0) {
      newMemory.media_refs.forEach((mediaId, idx) => {
        this.memoryMedia.push({
          id: `mm_${Date.now()}_${idx}`,
          memory_id: id,
          media_asset_id: mediaId,
          role: idx === 0 ? "primary_photo" : "supporting_photo",
          display_order: idx + 1,
          source: newMemory.source,
          verification_status: newMemory.verification_status,
          confidence: newMemory.confidence,
          consent_scope: newMemory.consent_scope,
          visibility_scope: newMemory.visibility_scope,
          sensitivity: newMemory.sensitivity,
          created_by: newMemory.created_by,
          created_at: now,
          updated_at: now,
        });
      });
    }

    // Populate relational memory_people
    if (newMemory.people_refs.length > 0) {
      newMemory.people_refs.forEach((p, idx) => {
        this.memoryPeople.push({
          id: `mp_${Date.now()}_${idx}`,
          memory_id: id,
          person_entity_id: p.person_entity_id,
          name: p.name,
          relationship: p.relationship,
          source: newMemory.source,
          verification_status: newMemory.verification_status,
          confidence: newMemory.confidence,
          consent_scope: newMemory.consent_scope,
          visibility_scope: newMemory.visibility_scope,
          sensitivity: newMemory.sensitivity,
          created_by: newMemory.created_by,
          created_at: now,
          updated_at: now,
        });
      });
    }

    // Populate relational memory_voice_notes
    if (newMemory.voice_notes.length > 0) {
      newMemory.voice_notes.forEach((vn, idx) => {
        this.memoryVoiceNotes.push({
          id: vn.id || `mvn_${Date.now()}_${idx}`,
          memory_id: id,
          speaker_name: vn.speaker_name,
          relationship: vn.relationship,
          audio_url: vn.audio_url,
          transcript: vn.transcript,
          language: vn.language || "as",
          source: newMemory.source,
          verification_status: newMemory.verification_status,
          confidence: newMemory.confidence,
          consent_scope: newMemory.consent_scope,
          visibility_scope: newMemory.visibility_scope,
          sensitivity: newMemory.sensitivity,
          created_by: newMemory.created_by,
          created_at: now,
          updated_at: now,
        });
      });
    }

    return newMemory;
  }

  // Explicit verification workflow: records verifier, role, and updates confidence
  public verifyMemory(
    memoryId: string,
    verifiedBy: string,
    role: "caregiver" | "chw" | "clinician",
    relationshipNote?: string,
    notes?: string
  ): MemoryItem | null {
    const memory = this.memories.find((m) => m.id === memoryId);
    if (!memory) return null;

    const now = new Date().toISOString();
    const status: MemoryVerificationStatus =
      role === "clinician" ? "clinician_verified" : role === "chw" ? "chw_verified" : "caregiver_verified";

    memory.verification_status = status;
    memory.confidence = 1.0;
    memory.verified_by = verifiedBy;
    memory.verified_at = now;
    if (notes) memory.verification_notes = notes;
    memory.updated_at = now;

    // Propagate verification to people refs
    if (memory.people_refs && memory.people_refs.length > 0) {
      memory.people_refs.forEach((p) => {
        p.verified = true;
      });
    }
    // Propagate verification to voice notes
    if (memory.voice_notes && memory.voice_notes.length > 0) {
      memory.voice_notes.forEach((v) => {
        v.verified = true;
      });
    }

    // Update relational memory_media, memory_people, memory_voice_notes
    this.memoryMedia
      .filter((mm) => mm.memory_id === memoryId)
      .forEach((mm) => {
        mm.verification_status = status;
        mm.confidence = 1.0;
        mm.updated_at = now;
      });
    this.memoryPeople
      .filter((mp) => mp.memory_id === memoryId)
      .forEach((mp) => {
        mp.verification_status = status;
        mp.confidence = 1.0;
        mp.updated_at = now;
      });
    this.memoryVoiceNotes
      .filter((mvn) => mvn.memory_id === memoryId)
      .forEach((mvn) => {
        mvn.verification_status = status;
        mvn.confidence = 1.0;
        mvn.updated_at = now;
      });

    return memory;
  }

  // Add familiar place (GPS coordinates completely optional!)
  public addPlace(item: Omit<FamiliarPlace, "id" | "created_at" | "updated_at">): FamiliarPlace {
    const isPerson = item.source === "person";
    const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newPlace: FamiliarPlace = {
      ...item,
      id,
      coordinates: item.coordinates || null,
      landmark_cues: item.landmark_cues || [],
      media_refs: item.media_refs || [],
      source: item.source || (isPerson ? "person" : "caregiver"),
      verification_status: isPerson ? "unverified" : item.verification_status || "caregiver_verified",
      confidence: isPerson ? 0.60 : item.confidence || 1.0,
      consent_scope: item.consent_scope || (isPerson ? "person_only" : "all"),
      visibility_scope: item.visibility_scope || (isPerson ? "private" : "family"),
      sensitivity: item.sensitivity || "low",
      created_by: item.created_by,
      created_at: now,
      updated_at: now,
    };

    this.familiarPlaces.unshift(newPlace);
    return newPlace;
  }

  // Verify familiar place
  public verifyPlace(placeId: string, verifiedBy: string, role: string, notes?: string): FamiliarPlace | null {
    const place = this.familiarPlaces.find((p) => p.id === placeId);
    if (!place) return null;

    const now = new Date().toISOString();
    place.verification_status =
      role === "clinician" ? "clinician_verified" : role === "chw" ? "chw_verified" : "caregiver_verified";
    place.confidence = 1.0;
    place.verified_by = verifiedBy;
    place.verified_at = now;
    if (notes) place.verification_notes = notes;
    place.updated_at = now;
    return place;
  }

  // Add familiar route
  public addRoute(item: Omit<FamiliarRoute, "id" | "created_at" | "updated_at">): FamiliarRoute {
    const isPerson = item.source === "person";
    const id = `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRoute: FamiliarRoute = {
      ...item,
      id,
      source: item.source || (isPerson ? "person" : "caregiver"),
      verification_status: isPerson ? "unverified" : item.verification_status || "caregiver_verified",
      confidence: isPerson ? 0.60 : item.confidence || 1.0,
      consent_scope: item.consent_scope || (isPerson ? "person_only" : "all"),
      visibility_scope: item.visibility_scope || (isPerson ? "private" : "family"),
      sensitivity: item.sensitivity || "low",
      created_by: item.created_by,
      created_at: now,
      updated_at: now,
    };

    this.familiarRoutes.unshift(newRoute);
    return newRoute;
  }

  // Verify familiar route
  public verifyRoute(routeId: string, verifiedBy: string, role: string, notes?: string): FamiliarRoute | null {
    const route = this.familiarRoutes.find((r) => r.id === routeId);
    if (!route) return null;

    const now = new Date().toISOString();
    route.verification_status =
      role === "clinician" ? "clinician_verified" : role === "chw" ? "chw_verified" : "caregiver_verified";
    route.confidence = 1.0;
    route.verified_by = verifiedBy;
    route.verified_at = now;
    if (notes) route.verification_notes = notes;
    route.updated_at = now;
    return route;
  }

  // Add segment to route
  public addRouteSegment(
    routeId: string,
    item: Omit<RouteSegment, "id" | "route_id" | "created_at" | "updated_at">
  ): RouteSegment | null {
    const route = this.familiarRoutes.find((r) => r.id === routeId);
    if (!route) return null;

    const now = new Date().toISOString();
    const segment: RouteSegment = {
      ...item,
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      route_id: routeId,
      source: item.source || route.source,
      verification_status: item.verification_status || route.verification_status,
      confidence: item.confidence !== undefined ? item.confidence : route.confidence,
      consent_scope: item.consent_scope || route.consent_scope,
      visibility_scope: item.visibility_scope || route.visibility_scope,
      sensitivity: item.sensitivity || route.sensitivity,
      created_by: item.created_by || route.created_by,
      created_at: now,
      updated_at: now,
    };

    this.routeSegments.push(segment);
    return segment;
  }

  // Retrieve route with its ordered segments
  public getRouteWithSegments(routeId: string): (FamiliarRoute & { segments: RouteSegment[] }) | null {
    const route = this.familiarRoutes.find((r) => r.id === routeId);
    if (!route) return null;
    const segments = this.routeSegments
      .filter((s) => s.route_id === routeId)
      .sort((a, b) => a.segment_order - b.segment_order);
    return { ...route, segments };
  }

  // Record history of memory or route experience in game
  public recordExperienceHistory(
    item: Omit<MemoryExperienceHistory, "id" | "recorded_at">
  ): MemoryExperienceHistory {
    const record: MemoryExperienceHistory = {
      ...item,
      id: `eh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recorded_at: new Date().toISOString(),
    };
    this.experienceHistory.unshift(record);
    return record;
  }

  // Get eligible memories for Game 7 (Reminiscence Journey)
  // Cross-person isolation, exclusion of unverified, exclusion of high sensitivity, consent checking
  public getGameEligibleMemories(
    personId: string,
    options?: { includeSensitive?: boolean; minConfidence?: number }
  ): {
    eligible: MemoryItem[];
    excludedUnverified: number;
    excludedSensitive: number;
    excludedConsent: number;
  } {
    const personMemories = this.memories.filter((m) => m.person_id === personId);
    let excludedUnverified = 0;
    let excludedSensitive = 0;
    let excludedConsent = 0;

    const allowedConsentScopes = ["games", "reminiscence", "all"];
    const minConfidence = options?.minConfidence ?? 0.75;

    const eligible = personMemories.filter((m) => {
      // Must be verified
      if (m.verification_status === "unverified" || m.confidence < minConfidence) {
        excludedUnverified++;
        return false;
      }
      // Must not be high sensitivity unless explicitly authorized
      if (m.sensitivity === "high" && !options?.includeSensitive) {
        excludedSensitive++;
        return false;
      }
      // Must have consent for games or reminiscence
      if (!allowedConsentScopes.includes(m.consent_scope)) {
        excludedConsent++;
        return false;
      }
      return true;
    });

    return { eligible, excludedUnverified, excludedSensitive, excludedConsent };
  }

  // Get eligible places and routes for Game 8 (Route Builder)
  // Cross-person isolation, exclusion of unverified, exclusion of high sensitivity, consent checking
  public getGameEligiblePlacesAndRoutes(
    personId: string,
    options?: { includeSensitive?: boolean }
  ): {
    places: FamiliarPlace[];
    routes: Array<FamiliarRoute & { segments: RouteSegment[] }>;
    excludedUnverified: number;
    excludedSensitive: number;
    excludedConsent: number;
  } {
    const allowedConsentScopes = ["games", "reminiscence", "all"];
    let excludedUnverified = 0;
    let excludedSensitive = 0;
    let excludedConsent = 0;

    const personPlaces = this.familiarPlaces.filter((p) => p.person_id === personId);
    const eligiblePlaces = personPlaces.filter((p) => {
      if (p.verification_status === "unverified" || p.confidence < 0.75) {
        excludedUnverified++;
        return false;
      }
      if (p.sensitivity === "high" && !options?.includeSensitive) {
        excludedSensitive++;
        return false;
      }
      if (!allowedConsentScopes.includes(p.consent_scope)) {
        excludedConsent++;
        return false;
      }
      return true;
    });

    const personRoutes = this.familiarRoutes.filter((r) => r.person_id === personId);
    const eligibleRoutes: Array<FamiliarRoute & { segments: RouteSegment[] }> = [];

    for (const r of personRoutes) {
      if (r.verification_status === "unverified" || r.confidence < 0.75) {
        excludedUnverified++;
        continue;
      }
      if (r.sensitivity === "high" && !options?.includeSensitive) {
        excludedSensitive++;
        continue;
      }
      if (!allowedConsentScopes.includes(r.consent_scope)) {
        excludedConsent++;
        continue;
      }
      const segments = this.routeSegments
        .filter((s) => s.route_id === r.id)
        .sort((a, b) => a.segment_order - b.segment_order);
      eligibleRoutes.push({ ...r, segments });
    }

    return {
      places: eligiblePlaces,
      routes: eligibleRoutes,
      excludedUnverified,
      excludedSensitive,
      excludedConsent,
    };
  }

  // Snapshot generation for offline play and auditability
  public createGameSnapshot(personId: string, gameKey: string): GameContextSnapshot {
    const memoryCheck = this.getGameEligibleMemories(personId);
    const placeCheck = this.getGameEligiblePlacesAndRoutes(personId);
    const now = new Date().toISOString();

    const snapshot: GameContextSnapshot = {
      id: `gs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      person_id: personId,
      game_key: gameKey,
      snapshot_timestamp: now,
      capability_summary: {
        recognition: 0.91,
        photo_recognition: 0.91,
        recall: 0.61,
        sequencing: 0.78,
        recommended_difficulty: 1,
        max_choice_count: 2,
      },
      eligible_memories_count: memoryCheck.eligible.length,
      eligible_places_count: placeCheck.places.length,
      eligible_routes_count: placeCheck.routes.length,
      eligible_memory_ids: memoryCheck.eligible.map((m) => m.id),
      eligible_place_ids: placeCheck.places.map((p) => p.id),
      eligible_route_ids: placeCheck.routes.map((r) => r.id),
      verification_hash: `vhash:${personId}:${gameKey}:${Date.now()}`,
      created_at: now,
    };

    this.gameSnapshots.unshift(snapshot);
    return snapshot;
  }

  public getLatestSnapshot(personId: string, gameKey: string): GameContextSnapshot | null {
    return this.gameSnapshots.find((s) => s.person_id === personId && s.game_key === gameKey) || null;
  }

  // Add experience episode, apply evidence-gated PCM update, and track memory freshness
  public recordEpisode(episode: Omit<ExperienceEpisode, "id" | "created_at"> & { id?: string }): ExperienceEpisode {
    // Idempotency guard: prevent duplicate recording if session or idempotency_key matches existing
    if (episode.idempotency_key) {
      const existing = this.episodes.find((e) => e.idempotency_key === episode.idempotency_key);
      if (existing) {
        return existing;
      }
    }

    const newEp: ExperienceEpisode = {
      ...episode,
      id: episode.id || `ep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // 1. Evidence Gating: apply observation to Personal Capability Model (PCM) ONLY if Measurement Quality Q >= 0.65
    const pcmResult = capabilityModel.applyObservation(newEp);
    newEp.pcm_update = {
      domain: pcmResult.domain || newEp.pcm_update?.domain || "autobiographical_memory",
      delta: pcmResult.delta || 0,
      new_estimate: pcmResult.new_estimate || newEp.pcm_update?.new_estimate || 0.91,
      applied: pcmResult.updated,
      reason_if_skipped: pcmResult.reason,
    };

    // 2. Track Memory Freshness & prevent overused family/routes
    memoryFreshnessTracker.recordSessionExposures(newEp.person_id, newEp.session_id, {
      memory_ids: newEp.target_content?.memory_ids,
      family_members: newEp.target_content?.people_refs,
      place_ids: newEp.target_content?.place_ids,
      route_id: newEp.target_content?.route_id,
    });

    this.episodes.unshift(newEp);
    return newEp;
  }

  // Capability model query
  public getCapabilities(personId: string) {
    return capabilityModel.getCapabilities(personId);
  }

  // Cross-game recommendations
  public getCrossGameRecommendations(personId: string) {
    const personEpisodes = this.episodes.filter((e) => e.person_id === personId);
    const g7Episodes = personEpisodes.filter((e) => e.template_key === "reminiscence_journey_my_world" || e.template_key === "my_life_timeline");
    const g8Episodes = personEpisodes.filter((e) => e.template_key === "route_builder_familiar_places");

    const places = this.familiarPlaces.filter((p) => p.person_id === personId);
    const routes = this.familiarRoutes.filter((r) => r.person_id === personId);
    const memories = this.memories.filter((m) => m.person_id === personId);

    const game8Candidates = CrossGameLearningEngine.deriveGame8CandidatesFromGame7(g7Episodes, places, routes);
    const game7Candidates = CrossGameLearningEngine.deriveGame7CandidatesFromGame8(g8Episodes, memories);

    return {
      game8_from_game7: game8Candidates,
      game7_from_game8: game7Candidates,
    };
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
