// A whole life, consistently recorded.
//
// The Experience Engine can only compose what the database actually knows, and
// the companion can only say what it can retrieve. Before this, each persona
// had one routine, two events and five memories -- so most templates declined
// for lack of real content, and the assistant had almost nothing to ground an
// answer in. That is not a bug in either of them; it is a data gap.
//
// This seeds a coherent life per person: family with real phone numbers and an
// escalation order, a full day from waking to bed, several days of events that
// actually happened, places, memories with photographs, preferences across
// every dimension, and standing goals. Everything cross-references everything
// else -- the granddaughter in the memory is the same row as the granddaughter
// in today's visit and in the emergency list -- because an activity built from
// inconsistent data produces a question with two defensible answers.
//
// Idempotent and re-runnable. Day-relative events are rebuilt on every run:
// "yesterday" has to still be yesterday tomorrow, so they cannot be seeded
// once at a fixed timestamp and left.

import { queryDb } from "./neon";

const TZ = "Asia/Kolkata";

/**
 * A timestamptz at local HH:MM on a day relative to today, computed by
 * Postgres in the person's own timezone rather than the server's.
 */
function localAt(dayOffset: number, hour: number, minute = 0): string {
  return `(((NOW() AT TIME ZONE '${TZ}')::date + INTERVAL '${dayOffset} days' + INTERVAL '${hour} hours' + INTERVAL '${minute} minutes') AT TIME ZONE '${TZ}')`;
}

interface MediaSeed {
  id: string;
  key: string;
  caption: string;
}

interface PersonSeed {
  id: string;
  name: string;
  assamese?: string;
  relationship: string;
  closeness: "primary_caregiver" | "family_core" | "extended" | "community_chw" | "clinical";
  phone: string | null;
  emergency: boolean;
  canVerify: boolean;
  avatarMediaId?: string;
}

interface PlaceSeed {
  id: string;
  name: string;
  assamese?: string;
  category: string;
  significance: string;
  description: string;
  landmarks: string[];
  sensory: Record<string, string[]>;
  mediaId?: string;
}

interface MemorySeed {
  id: string;
  type: string;
  title: string;
  assamese?: string;
  description: string;
  frame: string;
  period: string;
  culture: string;
  mediaId?: string;
  peopleIds?: Array<{ id: string; relationship: string }>;
}

interface RoutineSeed {
  id: string;
  title: string;
  assamese?: string;
  time: string;
  anchor: string;
}

interface DayEventSeed {
  id: string;
  type: "family_visit" | "routine_tea" | "festival" | "medical_appointment" | "community_walk";
  title: string;
  description: string;
  personName: string | null;
  relationship: string | null;
  location: string;
  dayOffset: number;
  hour: number;
  minute?: number;
  status: "expected" | "confirmed" | "occurred" | "cancelled";
  prep?: string[];
}

interface PreferenceSeed {
  dimension: string;
  value: unknown;
  source: "person_stated" | "caregiver_reported" | "chw_reported" | "clinician_reported" | "system_inferred";
  confidence: number;
}

interface GoalSeed {
  id: string;
  type: string;
  description: string;
}

interface LifeSeed {
  personId: string;
  displayName: string;
  culture: string;
  media: MediaSeed[];
  people: PersonSeed[];
  places: PlaceSeed[];
  memories: MemorySeed[];
  routines: RoutineSeed[];
  dayEvents: DayEventSeed[];
  preferences: PreferenceSeed[];
  goals: GoalSeed[];
}

// ══════════════════════════════════════════════════════════════════════════
// PURNIMA DEVI -- 78, retired schoolteacher, Tezpur, Sonitpur district, Assam.
// Widowed 2019. Lives in the ancestral house with her daughter Anu.
// ══════════════════════════════════════════════════════════════════════════

const PURNIMA: LifeSeed = {
  personId: "person:purnima",
  displayName: "Purnima",
  culture: "Assamese (Tezpur)",

  media: [
    { id: "media:wedding_1968", key: "assets/images/vintage_assamese_wedding_1789020439671.jpg", caption: "Purnima and Nirmal's wedding, 1968" },
    { id: "media:teaching_1974", key: "assets/images/vintage_teacher_memory_1789020507713.jpg", caption: "Purnima with her class at Tezpur Girls High School" },
    { id: "media:school_childhood_1956", key: "assets/images/tezpur_school_memory_1789020475367.jpg", caption: "The old schoolhouse by the riverbank" },
    { id: "media:rina_portrait_2025", key: "assets/images/rina_granddaughter_portrait_1789020459100.jpg", caption: "Rina, Purnima's granddaughter" },
    { id: "media:tea_garden", key: "assets/images/assam_tea_garden_1788977277508.jpg", caption: "The tea gardens outside Tezpur" },
    { id: "media:brahmaputra", key: "assets/images/brahmaputra_river_1788977296883.jpg", caption: "The Brahmaputra ghat at Tezpur" },
    { id: "media:courtyard", key: "assets/images/assamese_courtyard_1788980055319.jpg", caption: "The courtyard of the ancestral house" },
    { id: "media:tea_ceremony", key: "assets/images/assamese_tea_ceremony_1789020488707.jpg", caption: "Afternoon tea on the veranda" },
    { id: "media:muga_silk", key: "assets/images/muga_silk_weave_1788980069393.jpg", caption: "The muga silk mekhela Purnima wove" },
  ],

  // Escalation order is carried by closeness_level, not a separate column:
  // primary_caregiver -> family_core -> community_chw -> clinical.
  people: [
    { id: "entity:anu", name: "Anu", assamese: "অনু", relationship: "daughter", closeness: "primary_caregiver", phone: "+91 98640 12345", emergency: true, canVerify: true },
    { id: "entity:rina", name: "Rina", assamese: "ৰীনা", relationship: "granddaughter", closeness: "family_core", phone: "+91 94350 98765", emergency: true, canVerify: false, avatarMediaId: "media:rina_portrait_2025" },
    { id: "entity:bikash", name: "Bikash", assamese: "বিকাশ", relationship: "son", closeness: "family_core", phone: "+91 98860 54321", emergency: true, canVerify: true },
    { id: "entity:meena", name: "Meena", assamese: "মীনা", relationship: "asha_worker", closeness: "community_chw", phone: "+91 94351 11223", emergency: true, canVerify: true },
    { id: "entity:dr_hazarika", name: "Dr Hazarika", relationship: "doctor", closeness: "clinical", phone: "+91 36712 40561", emergency: true, canVerify: true },
    { id: "entity:lakhi", name: "Lakhi", assamese: "লখী", relationship: "neighbour", closeness: "extended", phone: "+91 97060 33445", emergency: false, canVerify: false },
    // Deceased: no phone, never surfaced as someone to call, but central to her memories.
    { id: "entity:nirmal", name: "Nirmal", assamese: "নিৰ্মল", relationship: "late_husband", closeness: "family_core", phone: null, emergency: false, canVerify: false },
  ],

  places: [
    {
      id: "pl:tezpur_home", name: "Ancestral Home in Tezpur", assamese: "তেজপুৰৰ পুৰণি ঘৰ", category: "home",
      significance: "The house Purnima came to as a bride in 1968, and has lived in ever since.",
      description: "A wooden Assam-type house with a red cement veranda and a courtyard of marigolds and tulsi.",
      landmarks: ["The red veranda", "The tulsi platform", "The nahor tree at the gate"],
      sensory: { visual: ["Marigolds along the path", "Sunlight on the red floor"], auditory: ["Doves in the nahor tree"], olfactory: ["Tulsi leaves", "Woodsmoke from the kitchen"] },
      mediaId: "media:courtyard",
    },
    {
      id: "pl:girls_school", name: "Tezpur Girls High School", assamese: "তেজপুৰ বালিকা উচ্চ বিদ্যালয়", category: "school",
      significance: "Where Purnima taught Assamese literature for thirty-two years.",
      description: "A long green-roofed building with a mango tree in the assembly yard.",
      landmarks: ["The mango tree", "The assembly bell", "The staff room window"],
      sensory: { visual: ["Girls in white and blue"], auditory: ["The morning assembly bell", "Recitation from the classrooms"] },
      mediaId: "media:teaching_1974",
    },
    {
      id: "pl:river_ghat", name: "Brahmaputra River Ghat at Tezpur", assamese: "তেজপুৰৰ ব্ৰহ্মপুত্ৰৰ ঘাট", category: "river",
      significance: "Where Nirmal used to take her on Sunday evenings.",
      description: "Wide stone steps down to the water, with ferry boats moored at the bank.",
      landmarks: ["The stone steps", "The ferry jetty", "The banyan at the top of the path"],
      sensory: { visual: ["The far bank in the haze"], auditory: ["Water against the steps", "Ferry horns"], olfactory: ["River silt"] },
      mediaId: "media:brahmaputra",
    },
    {
      id: "pl:daily_market", name: "Tezpur Daily Market", assamese: "তেজপুৰৰ দৈনিক বজাৰ", category: "market",
      significance: "Where Purnima and Anu buy vegetables and fish twice a week.",
      description: "Rows of covered stalls; the fish sellers at the far end, vegetables near the gate.",
      landmarks: ["The main gate", "The flower stall", "The fish section"],
      sensory: { visual: ["Piled green vegetables"], auditory: ["Vendors calling"], olfactory: ["Coriander and fish"] },
    },
    {
      id: "pl:namghar", name: "The Village Namghar", assamese: "নামঘৰ", category: "temple",
      significance: "Where Purnima has gone for Sunday naam-prayer for fifty years.",
      description: "An open prayer hall with a low wooden rail and clay lamps at the front.",
      landmarks: ["The wooden rail", "The clay lamps", "The drum stand"],
      sensory: { visual: ["Lamplight"], auditory: ["Naam singing", "Khol drums"], olfactory: ["Incense"] },
    },
  ],

  memories: [
    {
      id: "mem:wedding", type: "autobiographical", title: "Traditional Wedding Ceremony in Tezpur", assamese: "তেজপুৰত বিবাহ",
      description: "Purnima's wedding to Nirmal under the banana-stem mandap in the courtyard of this house. She wore a muga mekhela her mother had woven.",
      frame: "young_adulthood", period: "1968", culture: "Assamese wedding, Tezpur",
      mediaId: "media:wedding_1968", peopleIds: [{ id: "entity:nirmal", relationship: "late_husband" }],
    },
    {
      id: "mem:teaching_post", type: "autobiographical", title: "First Teaching Post at Tezpur Girls School", assamese: "তেজপুৰ বালিকা বিদ্যালয়ত শিক্ষকতা",
      description: "Purnima taught Assamese literature and poetry at Tezpur Girls High School for thirty-two years, from 1966 until she retired in 1998.",
      frame: "young_adulthood", period: "1966 - 1998", culture: "Assamese education, Tezpur",
      mediaId: "media:teaching_1974",
    },
    {
      id: "mem:childhood_school", type: "autobiographical", title: "Early school days in Tezpur", assamese: "প্ৰাথমিক বিদ্যালয়ৰ দিনবোৰ",
      description: "Walking to the old schoolhouse by the riverbank with a slate under her arm and a brass tiffin box.",
      frame: "childhood", period: "1954 - 1960", culture: "Assamese childhood, Tezpur",
      mediaId: "media:school_childhood_1956",
    },
    {
      id: "mem:rina_visits", type: "relationship", title: "Granddaughter Rina's visits to Tezpur", assamese: "ৰীনাৰ আগমন",
      description: "Rina comes up from Guwahati most months. They sit on the veranda and Rina shows her photographs on the phone.",
      frame: "recent", period: "2020 - Present", culture: "Family, Tezpur",
      mediaId: "media:rina_portrait_2025", peopleIds: [{ id: "entity:rina", relationship: "granddaughter" }],
    },
    {
      id: "mem:bihu_tea_garden", type: "cultural", title: "Spring Bihu Melody & Sonitpur Tea Garden Mornings", assamese: "বসন্তৰ বিহু আৰু চাহ বাগিচা",
      description: "Listening to the morning flute and celebrating Rongali Bihu at the edge of the Sonitpur tea gardens.",
      frame: "later_life", period: "1980s - 1990s", culture: "Rongali Bihu, Sonitpur",
      mediaId: "media:tea_garden",
    },
    {
      id: "mem:muga_weaving", type: "skill", title: "Weaving the muga mekhela", assamese: "মুগা মেখেলা বোৱা",
      description: "Purnima learned to weave muga silk from her mother. The mekhela she wove for Anu's wedding took most of a year.",
      frame: "young_adulthood", period: "1960s - 1990s", culture: "Muga silk weaving, Assam",
      mediaId: "media:muga_silk", peopleIds: [{ id: "entity:anu", relationship: "daughter" }],
    },
    {
      id: "mem:sunday_ghat", type: "place", title: "Sunday evenings at the river ghat", assamese: "দেওবাৰৰ ঘাট",
      description: "Nirmal would walk her down to the Brahmaputra ghat on Sunday evenings to watch the ferries come in.",
      frame: "later_life", period: "1970s - 2018", culture: "Brahmaputra, Tezpur",
      mediaId: "media:brahmaputra", peopleIds: [{ id: "entity:nirmal", relationship: "late_husband" }],
    },
    {
      id: "mem:anu_born", type: "relationship", title: "The year Anu was born", assamese: "অনুৰ জন্ম",
      description: "Anu was born in the monsoon of 1972, in this house, with Purnima's mother-in-law at the door.",
      frame: "young_adulthood", period: "1972", culture: "Family, Tezpur",
      peopleIds: [{ id: "entity:anu", relationship: "daughter" }],
    },
  ],

  // The whole day, waking to bed. This is what makes "what comes after
  // breakfast?" and "what do I usually do in the afternoon?" answerable.
  routines: [
    { id: "rt:wake_prayer", title: "Waking and morning naam", assamese: "ৰাতিপুৱাৰ নাম", time: "05:30", anchor: "Purnima wakes early and says the morning naam at the tulsi platform." },
    { id: "rt:morning_tea", title: "Morning tea on the veranda", assamese: "ৰাতিপুৱাৰ চাহ", time: "06:30", anchor: "Red tea with a little ginger, on the veranda, watching the courtyard." },
    { id: "rt:tulsi_garden", title: "Watering the tulsi and marigolds", assamese: "তুলসী পানী দিয়া", time: "07:30", anchor: "Watering the tulsi platform and the marigolds along the courtyard path." },
    { id: "rt:breakfast", title: "Breakfast", assamese: "ৰাতিপুৱাৰ আহাৰ", time: "08:30", anchor: "Rice flakes with curd and jaggery, or roti, with Anu in the kitchen." },
    { id: "rt:bath", title: "Bath and fresh clothes", assamese: "স্নান", time: "09:30", anchor: "Bath, then a fresh mekhela chador. Anu lays it out." },
    { id: "rt:radio_borgeet", title: "Radio and Borgeet", assamese: "ৰেডিঅ' আৰু বৰগীত", time: "11:00", anchor: "The Guwahati station, and Borgeet devotional songs on the old radio." },
    { id: "rt:lunch", title: "Lunch with Anu", assamese: "দুপৰীয়াৰ আহাৰ", time: "13:00", anchor: "Rice, dal, a fish curry or khar, eaten together in the kitchen." },
    { id: "rt:afternoon_rest", title: "Afternoon rest", assamese: "দুপৰীয়াৰ বিশ্ৰাম", time: "14:30", anchor: "An hour lying down in the back room with the shutters half closed." },
    { id: "rt:afternoon_tea", title: "Afternoon cardamom tea", assamese: "আবেলিৰ চাহ", time: "16:00", anchor: "Ginger-cardamom tea with Anu on the back veranda. Visitors usually come at this hour." },
    { id: "rt:evening_walk", title: "Evening walk to the gate", assamese: "সন্ধিয়াৰ খোজ", time: "17:30", anchor: "A slow walk to the nahor tree at the gate and back, sometimes with Lakhi." },
    { id: "rt:evening_prayer", title: "Evening prayer and lamp", assamese: "সন্ধিয়াৰ নাম", time: "19:00", anchor: "Lighting the lamp at the tulsi platform and saying the evening naam." },
    { id: "rt:dinner", title: "Dinner", assamese: "ৰাতিৰ আহাৰ", time: "20:00", anchor: "A light dinner, usually rice and dal, early." },
    { id: "rt:bed", title: "Going to bed", assamese: "শোৱা", time: "21:00", anchor: "Anu checks the doors and Purnima goes to bed around nine." },
  ],

  // Several real days, so recall activities have something true to ask about.
  dayEvents: [
    // ── The day before yesterday
    { id: "ev:pu_market_2", type: "community_walk", title: "Went to the daily market with Anu", description: "Bought vegetables and a rohu fish at the daily market.", personName: "Anu", relationship: "daughter", location: "Tezpur Daily Market", dayOffset: -2, hour: 9, status: "occurred" },
    { id: "ev:pu_lakhi_2", type: "family_visit", title: "Lakhi came over in the evening", description: "The neighbour Lakhi came with gourds from her garden and sat on the veranda.", personName: "Lakhi", relationship: "neighbour", location: "Ancestral Home in Tezpur", dayOffset: -2, hour: 17, status: "occurred" },

    // ── Yesterday
    { id: "ev:pu_meena_1", type: "medical_appointment", title: "Meena's home visit", description: "Meena the ASHA worker came to check blood pressure and the medicine box.", personName: "Meena", relationship: "asha_worker", location: "Ancestral Home in Tezpur", dayOffset: -1, hour: 10, status: "occurred" },
    { id: "ev:pu_rina_call_1", type: "family_visit", title: "Rina telephoned from Guwahati", description: "Rina rang in the afternoon and talked about coming up for tea.", personName: "Rina", relationship: "granddaughter", location: "Ancestral Home in Tezpur", dayOffset: -1, hour: 15, status: "occurred" },
    { id: "ev:pu_namghar_1", type: "festival", title: "Evening naam at the namghar", description: "Anu walked her down to the namghar for the evening naam-prayer.", personName: "Anu", relationship: "daughter", location: "The Village Namghar", dayOffset: -1, hour: 18, status: "occurred" },

    // ── Today
    { id: "ev:pu_bikash_today", type: "family_visit", title: "Bikash telephoned from Guwahati", description: "Bikash rang in the morning to ask after her.", personName: "Bikash", relationship: "son", location: "Ancestral Home in Tezpur", dayOffset: 0, hour: 8, status: "occurred" },
    { id: "ev:pu_rina_visit_today", type: "family_visit", title: "Rina visiting for afternoon tea", description: "Rina is coming up from Guwahati for afternoon tea on the veranda.", personName: "Rina", relationship: "granddaughter", location: "Ancestral Home in Tezpur", dayOffset: 0, hour: 16, status: "confirmed", prep: ["Lay out the brass cups", "Put the cardamom tea on", "Sit on the back veranda"] },

    // ── Tomorrow
    { id: "ev:pu_clinic_tmw", type: "medical_appointment", title: "Check-up with Dr Hazarika", description: "The three-monthly check-up at the Tezpur clinic. Anu is taking her.", personName: "Dr Hazarika", relationship: "doctor", location: "Tezpur Clinic", dayOffset: 1, hour: 11, status: "confirmed", prep: ["Take the medicine box", "Take the blue folder"] },

    // ── A cancelled one, on purpose: it must never surface as an obligation
    //    and must never become "who is coming?".
    { id: "ev:pu_cancelled", type: "family_visit", title: "Bikash was going to visit", description: "Bikash had planned to come up but could not get away.", personName: "Bikash", relationship: "son", location: "Ancestral Home in Tezpur", dayOffset: 0, hour: 12, status: "cancelled" },
  ],

  preferences: [
    { dimension: "content", value: { joys: ["Courtyard & Gardening", "Assam Tea & Snacks", "Borgeet & Folk Music", "Stories & Old Photos", "Nature & River Walks", "Family & Grandchildren"], topics: ["Rina's visits", "Tezpur school stories", "Assam tea preparation", "Garden flowers", "Bihu songs"] }, source: "person_stated", confidence: 0.9 },
    { dimension: "modality", value: { preferred: "photo_plus_voice", note: "Responds best to a photograph with a spoken prompt." }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "language", value: { primary: "Assamese", secondary: "English", note: "Understands English; prefers Assamese for anything emotional." }, source: "person_stated", confidence: 0.9 },
    { dimension: "timing", value: { best_hours: ["09:00-11:30", "16:00-17:30"], avoid: ["After 20:00", "During the afternoon rest"], note: "Most alert mid-morning and at tea time." }, source: "caregiver_reported", confidence: 0.8 },
    { dimension: "assistance", value: { explanation_style: ["Short and simple", "Tell me aloud with a gentle voice", "Show me with pictures & photos"], avoidances: ["Avoid sudden loud sounds or rapid chatter", "No memory tests or quizzes when forgetting a word", "Hurried pace or crowded fast screens"] }, source: "person_stated", confidence: 0.9 },
    { dimension: "familiarity", value: { prefers: "Familiar people, places and songs from before 2000", note: "New faces unsettle her; old photographs settle her." }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "difficulty", value: { recommended: 1, max_choices: 3 }, source: "system_inferred", confidence: 0.7 },
    { dimension: "social_context", value: { prefers: "One familiar person present", note: "Does better with Anu in the room than alone, and better alone than in a group." }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "context", value: { environment: "Quiet, daylight, on the veranda", avoid: "Television on in the background" }, source: "caregiver_reported", confidence: 0.8 },
    { dimension: "novelty", value: { tolerance: "low", note: "Prefers the same few activities returned to, not new ones." }, source: "caregiver_reported", confidence: 0.8 },
  ],

  goals: [
    { id: "goal:pu_rina", type: "connect_with_family", description: "Stay close to Rina and look forward to her visits." },
    { id: "goal:pu_routine", type: "remember_routine", description: "Keep the shape of the day -- tea, prayer, meals -- without needing to be told each time." },
    { id: "goal:pu_music", type: "listen_to_music", description: "Keep listening to Borgeet and Bihu songs every day." },
    { id: "goal:pu_garden", type: "engage_in_familiar_activity", description: "Keep tending the tulsi and the marigolds in the courtyard herself." },
  ],
};

// ══════════════════════════════════════════════════════════════════════════
// NEKOMBO AO -- 81, retired cultivator and church elder, Mokokchung, Nagaland.
// A deliberately different life: different faith, festivals, food, family
// shape and language, so "personalisation" can be tested as something other
// than a name substitution.
// ══════════════════════════════════════════════════════════════════════════

const NEKOMBO: LifeSeed = {
  personId: "person:nekombo",
  displayName: "Nekombo",
  culture: "Ao Naga (Mokokchung)",

  media: [
    { id: "media:nk_hills", key: "assets/images/ne_aerial_dawn_1788980040728.jpg", caption: "The hills above Mokokchung at dawn" },
  ],

  people: [
    { id: "entity:temjen", name: "Temjen", relationship: "son", closeness: "primary_caregiver", phone: "+91 98630 22110", emergency: true, canVerify: true },
    { id: "entity:aningla", name: "Aningla", relationship: "granddaughter", closeness: "family_core", phone: "+91 94360 44556", emergency: true, canVerify: false },
    { id: "entity:imnala", name: "Imnala", relationship: "neighbour_village_elder", closeness: "community_chw", phone: "+91 97740 66778", emergency: true, canVerify: true },
    { id: "entity:nk_pastor", name: "Pastor Along", relationship: "pastor", closeness: "extended", phone: "+91 98560 77889", emergency: false, canVerify: false },
    { id: "entity:nk_nurse", name: "Nurse Watila", relationship: "health_worker", closeness: "clinical", phone: "+91 94020 55331", emergency: true, canVerify: true },
  ],

  places: [
    {
      id: "pl:mokokchung_home", name: "Family Home in Mokokchung", category: "home",
      significance: "The house Nekombo built himself in 1971, on the slope above the town.",
      description: "A tin-roofed house on stilts with a wide front step looking down the valley.",
      landmarks: ["The front step", "The woodpile", "The gate post"],
      sensory: { visual: ["Mist in the valley at dawn"], auditory: ["Roosters", "Rain on the tin roof"], olfactory: ["Woodsmoke"] },
      mediaId: "media:nk_hills",
    },
    {
      id: "pl:baptist_church", name: "Mokokchung Baptist Church", category: "temple",
      significance: "Nekombo has sung in the choir here since 1965.",
      description: "A stone church at the top of the town road, with a bell tower.",
      landmarks: ["The bell tower", "The choir bench", "The stone steps"],
      sensory: { visual: ["Light through the high windows"], auditory: ["Four-part hymn singing", "The bell"] },
    },
    {
      id: "pl:nk_jhum_field", name: "The old jhum field", category: "workplace",
      significance: "The hillside field Nekombo worked for thirty years.",
      description: "A terraced slope an hour's walk above the village, planted with millet and yam.",
      landmarks: ["The big stone at the top", "The stream crossing"],
      sensory: { visual: ["Terraces stepping down the slope"], auditory: ["The stream"] },
    },
  ],

  memories: [
    { id: "mem:jhum_cultivation", type: "autobiographical", title: "Jhum Cultivation Seasons in the Hills", description: "Nekombo worked the terraced jhum fields above the village for thirty years, clearing and planting with the whole village each season.", frame: "later_life", period: "1970s - 1990s", culture: "Ao Naga cultivation" },
    { id: "mem:church_choir", type: "cultural", title: "Sunday Choir at the Baptist Church", description: "Nekombo has sung bass in the church choir since he was a young man. He still knows every part.", frame: "later_life", period: "1965 - Present", culture: "Ao Naga Baptist", peopleIds: [{ id: "entity:imnala", relationship: "neighbour_village_elder" }] },
    { id: "mem:moatsu_festival", type: "cultural", title: "Moatsu Festival Celebrations", description: "The Moatsu festival after the sowing, with the whole village dancing and the men singing through the night.", frame: "childhood", period: "1950s - 1960s", culture: "Ao Naga Moatsu" },
    { id: "mem:nk_house_built", type: "autobiographical", title: "Building the house in 1971", description: "Nekombo cut and carried the posts himself and built the house on the slope the year after he married.", frame: "young_adulthood", period: "1971", culture: "Ao Naga, Mokokchung", mediaId: "media:nk_hills" },
    { id: "mem:nk_temjen_school", type: "relationship", title: "Walking Temjen down to school", description: "Every morning for years Nekombo walked his son Temjen down the town road to school before going up to the field.", frame: "later_life", period: "1980s", culture: "Family, Mokokchung", peopleIds: [{ id: "entity:temjen", relationship: "son" }] },
  ],

  routines: [
    { id: "rt:nk_wake", title: "Waking and morning prayer", time: "05:00", anchor: "Nekombo wakes before light and reads a psalm on the front step." },
    { id: "rt:nk_tea", title: "Black tea on the step", time: "06:00", anchor: "Strong black tea, no sugar, on the front step watching the valley." },
    { id: "rt:nk_breakfast", title: "Breakfast", time: "07:30", anchor: "Rice and boiled vegetables with Temjen's wife." },
    { id: "rt:nk_woodpile", title: "Sorting the woodpile", time: "09:00", anchor: "Splitting and stacking kindling by the step -- he still likes to do this himself." },
    { id: "rt:nk_radio", title: "Listening to the hymn programme", time: "11:00", anchor: "The Nagaland radio hymn hour." },
    { id: "rt:nk_lunch", title: "Lunch", time: "12:30", anchor: "Rice, smoked pork and boiled greens." },
    { id: "rt:nk_rest", title: "Afternoon rest", time: "14:00", anchor: "An hour in the chair by the window." },
    { id: "rt:nk_visitors", title: "Afternoon visitors", time: "16:00", anchor: "Imnala or someone from the church usually comes by in the late afternoon." },
    { id: "rt:nk_evening_prayer", title: "Evening prayer", time: "18:30", anchor: "Reading and prayer before the meal." },
    { id: "rt:nk_dinner", title: "Dinner", time: "19:30", anchor: "A light evening meal with the family." },
    { id: "rt:nk_bed", title: "Going to bed", time: "20:30", anchor: "Nekombo goes to bed early, around half past eight." },
  ],

  dayEvents: [
    { id: "ev:nk_imnala_2", type: "family_visit", title: "Imnala came by with firewood", description: "The neighbour Imnala brought up a bundle of firewood and stayed to talk.", personName: "Imnala", relationship: "neighbour_village_elder", location: "Family Home in Mokokchung", dayOffset: -2, hour: 16, status: "occurred" },
    { id: "ev:nk_choir_1", type: "festival", title: "Choir practice at the church", description: "Temjen drove him up to the church for the Thursday choir practice.", personName: "Temjen", relationship: "son", location: "Mokokchung Baptist Church", dayOffset: -1, hour: 17, status: "occurred" },
    { id: "ev:nk_nurse_today", type: "medical_appointment", title: "Nurse Watila's visit", description: "The health worker came to check his blood pressure.", personName: "Nurse Watila", relationship: "health_worker", location: "Family Home in Mokokchung", dayOffset: 0, hour: 9, status: "occurred" },
    { id: "ev:nk_aningla_visit", type: "family_visit", title: "Aningla visiting after church", description: "Nekombo's granddaughter Aningla is coming up after the Sunday service.", personName: "Aningla", relationship: "granddaughter", location: "Family Home in Mokokchung", dayOffset: 0, hour: 15, status: "confirmed", prep: ["Put the kettle on", "Sit out on the front step"] },
    { id: "ev:nk_pastor_tmw", type: "festival", title: "Pastor Along calling round", description: "The pastor is coming for his monthly visit.", personName: "Pastor Along", relationship: "pastor", location: "Family Home in Mokokchung", dayOffset: 1, hour: 10, status: "confirmed" },
  ],

  preferences: [
    { dimension: "content", value: { joys: ["Hymns & Choir", "The Valley & Hills", "Family & Grandchildren", "Stories of the Fields"], topics: ["church choir hymns", "jhum field seasons", "Moatsu festival", "building the house"] }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "modality", value: { preferred: "audio_guided", note: "Hearing is good; eyesight is poor. Sound works better than pictures." }, source: "caregiver_reported", confidence: 0.9 },
    { dimension: "language", value: { primary: "Ao", secondary: "English", note: "Ao at home, English for anything written." }, source: "person_stated", confidence: 0.9 },
    { dimension: "timing", value: { best_hours: ["06:00-09:00", "16:00-18:00"], avoid: ["Early afternoon"], note: "Sharpest early in the morning." }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "assistance", value: { explanation_style: ["Say it once, plainly", "Give me time to answer"], avoidances: ["Do not rush him", "No bright screens"] }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "familiarity", value: { prefers: "Hymns and people from the church", note: "Recognises voices more readily than faces." }, source: "caregiver_reported", confidence: 0.85 },
    { dimension: "difficulty", value: { recommended: 1, max_choices: 3 }, source: "system_inferred", confidence: 0.7 },
    { dimension: "social_context", value: { prefers: "Company; he does not like being in the house alone" }, source: "caregiver_reported", confidence: 0.85 },
  ],

  goals: [
    { id: "goal:nk_choir", type: "engage_in_familiar_activity", description: "Keep going to choir practice for as long as he can." },
    { id: "goal:nk_family", type: "connect_with_family", description: "See Aningla and the great-grandchildren regularly." },
    { id: "goal:nk_step", type: "complete_daily_task", description: "Keep splitting his own kindling by the step." },
  ],
};

// ══════════════════════════════════════════════════════════════════════════
// Writer
// ══════════════════════════════════════════════════════════════════════════

async function seedOne(life: LifeSeed): Promise<void> {
  const p = life.personId;

  // Media links are reconciled before anything is (re)inserted this run, not
  // after: a delete placed later in this function ran AFTER the places loop
  // below had already inserted place_media, so every seeded place photo was
  // wiped out on every single run. Ordering this first means the delete can
  // never race an insert -- nothing below has run yet.
  await queryDb(`DELETE FROM memory_media WHERE memory_id IN (SELECT id FROM memory_items WHERE person_id = $1)`, [p]);
  await queryDb(`DELETE FROM place_media WHERE place_id IN (SELECT id FROM familiar_places WHERE person_id = $1)`, [p]);

  // ── Media ────────────────────────────────────────────────────────────────
  for (const m of life.media) {
    await queryDb(
      `INSERT INTO media_assets (id, person_id, storage_key, media_type, mime_type, created_by, provenance_id, consent_scope, visibility_scope, status)
       VALUES ($1,$2,$3,'photo','image/jpeg','actor:seed',$4,'all','family','active')
       ON CONFLICT (id) DO UPDATE SET storage_key = EXCLUDED.storage_key, status = 'active'`,
      [m.id, p, m.key, `prov:${m.id}`]
    );
  }

  // ── People and relationships ─────────────────────────────────────────────
  for (const person of life.people) {
    await queryDb(
      `INSERT INTO person_entities (id, person_id, name, assamese_name, display_name, relationship_to_person, phone, is_emergency_contact, can_verify_memories, verification_status, avatar_media_id)
       VALUES ($1,$2,$3,$4,$3,$5,$6,$7,$8,'verified',$9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, display_name = EXCLUDED.display_name,
         relationship_to_person = EXCLUDED.relationship_to_person, phone = EXCLUDED.phone,
         is_emergency_contact = EXCLUDED.is_emergency_contact, avatar_media_id = EXCLUDED.avatar_media_id,
         verification_status = 'verified'`,
      [person.id, p, person.name, person.assamese ?? null, person.relationship, person.phone, person.emergency, person.canVerify, person.avatarMediaId ?? null]
    );
    await queryDb(
      `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verification_status, verified_by)
       VALUES ($1,$2,$3,$4,$5,'verified','seed')
       ON CONFLICT (id) DO UPDATE SET relationship_type = EXCLUDED.relationship_type, closeness_level = EXCLUDED.closeness_level`,
      [`rel:${person.id.replace("entity:", "")}`, p, person.id, person.relationship, person.closeness]
    );
  }

  // ── Places ───────────────────────────────────────────────────────────────
  for (const place of life.places) {
    await queryDb(
      `INSERT INTO familiar_places (id, person_id, name, assamese_name, category, significance, description, landmark_cues, sensory_cues, source, verification_status, confidence, consent_scope, visibility_scope, sensitivity, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'caregiver','verified',0.95,'all','family','low','actor:seed')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, significance = EXCLUDED.significance, description = EXCLUDED.description,
         landmark_cues = EXCLUDED.landmark_cues, sensory_cues = EXCLUDED.sensory_cues,
         verification_status = 'verified', confidence = 0.95`,
      [place.id, p, place.name, place.assamese ?? null, place.category, place.significance, place.description, JSON.stringify(place.landmarks), JSON.stringify(place.sensory)]
    );
    if (place.mediaId) {
      await queryDb(
        `INSERT INTO place_media (place_id, media_asset_id, role, sequence_order) VALUES ($1,$2,'primary_photo',1)
         ON CONFLICT (place_id, media_asset_id) DO NOTHING`,
        [place.id, place.mediaId]
      );
    }
  }

  // ── Memories, with their photographs and the people in them ──────────────
  for (const mem of life.memories) {
    await queryDb(
      `INSERT INTO memory_items (id, person_id, memory_type, title, assamese_title, description, temporal_frame, approximate_period, source, verification_status, verified_by, verified_at, confidence, sensitivity, is_sensitive, game_eligible, visibility_scope, consent_scope, cultural_context)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'caregiver','verified','actor:seed',NOW(),0.97,'low',FALSE,TRUE,'family','all',$9)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description,
         temporal_frame = EXCLUDED.temporal_frame, approximate_period = EXCLUDED.approximate_period,
         verification_status = 'verified', confidence = 0.97, game_eligible = TRUE`,
      [mem.id, p, mem.type, mem.title, mem.assamese ?? null, mem.description, mem.frame, mem.period, mem.culture]
    );
    if (mem.mediaId) {
      await queryDb(
        `INSERT INTO memory_media (memory_id, media_asset_id, role, sequence_order) VALUES ($1,$2,'primary_photo',1)
         ON CONFLICT (memory_id, media_asset_id) DO NOTHING`,
        [mem.id, mem.mediaId]
      );
    }
    for (const link of mem.peopleIds ?? []) {
      await queryDb(
        `INSERT INTO memory_people (memory_id, person_entity_id, relationship, confidence, verification_status)
         VALUES ($1,$2,$3,1.00,'verified')
         ON CONFLICT (memory_id, person_entity_id) DO UPDATE SET verification_status = 'verified'`,
        [mem.id, link.id, link.relationship]
      );
    }
  }

  // ── The shape of the day ─────────────────────────────────────────────────
  for (const r of life.routines) {
    await queryDb(
      `INSERT INTO routines (id, person_id, title, assamese_title, time_of_day, anchor_description, source, verification_status, active)
       VALUES ($1,$2,$3,$4,$5,$6,'caregiver','verified',TRUE)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, time_of_day = EXCLUDED.time_of_day,
         anchor_description = EXCLUDED.anchor_description, active = TRUE, verification_status = 'verified'`,
      [r.id, p, r.title, r.assamese ?? null, r.time, r.anchor]
    );
  }

  // ── Day-relative events ──────────────────────────────────────────────────
  // Deleted and rebuilt every run: an event seeded as "yesterday" at a fixed
  // timestamp stops being yesterday tomorrow, and recall activities built on
  // it would quietly start asking about the wrong day.
  await queryDb(`DELETE FROM future_events WHERE person_id = $1`, [p]);
  for (const e of life.dayEvents) {
    await queryDb(
      `INSERT INTO future_events (id, person_id, event_type, title, description, person_name, relationship, location_name, scheduled_at, status, source, verification_status, preparation_steps)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,${localAt(e.dayOffset, e.hour, e.minute ?? 0)},$9,'caregiver','verified',$10)`,
      [e.id, p, e.type, e.title, e.description, e.personName, e.relationship, e.location, e.status, JSON.stringify(e.prep ?? [])]
    );
  }

  // ── Preferences ──────────────────────────────────────────────────────────
  // Append-only by design, so a re-run supersedes rather than overwrites.
  for (const pref of life.preferences) {
    const existing = await queryDb<{ id: string; value: unknown }>(
      `SELECT id, value FROM preferences WHERE person_id = $1 AND dimension = $2 AND superseded_by IS NULL ORDER BY created_at DESC LIMIT 1`,
      [p, pref.dimension]
    );
    if (existing[0] && JSON.stringify(existing[0].value) === JSON.stringify(pref.value)) continue;

    const id = `pref:${p.replace("person:", "")}:${pref.dimension}:${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await queryDb(
      `INSERT INTO preferences (id, person_id, dimension, value, evidence_source, confidence) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, p, pref.dimension, JSON.stringify(pref.value), pref.source, pref.confidence]
    );
    if (existing[0]) {
      await queryDb(`UPDATE preferences SET superseded_by = $2 WHERE id = $1`, [existing[0].id, id]);
    }
  }

  // ── Goals ────────────────────────────────────────────────────────────────
  for (const g of life.goals) {
    await queryDb(
      `INSERT INTO goals (id, person_id, goal_type, description, status, created_by)
       VALUES ($1,$2,$3,$4,'active','actor:seed')
       ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description, status = 'active'`,
      [g.id, p, g.type, g.description]
    );
  }
}

export const RICH_LIFE_SEEDS: LifeSeed[] = [PURNIMA, NEKOMBO];

/**
 * Seed (or refresh) both lives. Safe to run on every boot: entity rows are
 * upserted, preferences are superseded rather than duplicated, and only the
 * day-relative events are rebuilt.
 */
export async function seedRichLife(): Promise<{ person_id: string; counts: Record<string, number> }[]> {
  const out: { person_id: string; counts: Record<string, number> }[] = [];
  for (const life of RICH_LIFE_SEEDS) {
    await seedOne(life);
    out.push({
      person_id: life.personId,
      counts: {
        media: life.media.length,
        people: life.people.length,
        places: life.places.length,
        memories: life.memories.length,
        routines: life.routines.length,
        day_events: life.dayEvents.length,
        preferences: life.preferences.length,
        goals: life.goals.length,
      },
    });
  }
  return out;
}

/**
 * Emergency contacts in escalation order, straight from the relationship
 * graph -- primary caregiver first, then close family, then the community
 * health worker, then clinical. There is no separate "emergency list" to drift
 * out of sync with who the person's people actually are.
 */
export async function getEmergencyContacts(personId: string): Promise<
  Array<{ id: string; name: string; relationship: string; phone: string; closeness: string }>
> {
  return queryDb(
    `SELECT pe.id, pe.display_name AS name, r.relationship_type AS relationship, pe.phone, r.closeness_level AS closeness
     FROM person_entities pe
     JOIN relationships r ON r.related_entity_id = pe.id AND r.person_id = pe.person_id
     WHERE pe.person_id = $1
       AND pe.is_emergency_contact = TRUE
       AND pe.phone IS NOT NULL
       AND r.verification_status <> 'rejected'
     ORDER BY CASE r.closeness_level
       WHEN 'primary_caregiver' THEN 0
       WHEN 'family_core' THEN 1
       WHEN 'community_chw' THEN 2
       WHEN 'clinical' THEN 3
       ELSE 4 END, pe.created_at ASC`,
    [personId]
  );
}
