// Seeds two substantially different personas into Neon (not name-swapped
// clones -- different culture, language, family structure, faith, festivals,
// and routines), so personalisation logic can be tested against real variation
// rather than a single hardcoded case. Idempotent: only runs if person_entities
// is empty, matching the pattern used by seedInitialMedicationsIfEmpty.

import { queryDb } from "./neon";

async function isEmpty(table: string): Promise<boolean> {
  const rows = await queryDb<{ n: number }>(`SELECT count(*)::int AS n FROM ${table}`);
  return (rows[0]?.n ?? 0) === 0;
}

export async function seedPersonasIfEmpty(): Promise<void> {
  if (!(await isEmpty("person_entities"))) {
    return;
  }

  console.log("Seeding two personas (Purnima, Tezpur + Nekcombo, Mokokchung) into Neon...");

  // ── Persona 1: Purnima Devi -- Assamese, Hindu, Tezpur (matches existing in-memory seed) ──
  const purnima = "person:purnima";

  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, assamese_name, display_name, relationship_to_person, phone, is_emergency_contact, can_verify_memories, verification_status)
     VALUES
      ('entity:anu', $1, 'Anu', 'অনু', 'Anu', 'daughter', '+91 98640 12345', true, true, 'verified'),
      ('entity:rina', $1, 'Rina', 'ৰীনা', 'Rina', 'granddaughter', '+91 94350 98765', false, false, 'verified'),
      ('entity:bikash', $1, 'Bikash', 'বিকাশ', 'Bikash', 'son', '+91 98860 54321', false, false, 'verified'),
      ('entity:meena', $1, 'Meena Saikia', 'মীনা শইকীয়া', 'Meena', 'asha_worker', '+91 94351 11223', false, false, 'verified')`,
    [purnima]
  );

  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES
      ('rel:anu', $1, 'entity:anu', 'daughter', 'primary_caregiver', 'system'),
      ('rel:rina', $1, 'entity:rina', 'granddaughter', 'family_core', 'entity:anu'),
      ('rel:bikash', $1, 'entity:bikash', 'son', 'family_core', 'entity:anu'),
      ('rel:meena', $1, 'entity:meena', 'asha_worker', 'community_chw', 'entity:anu')`,
    [purnima]
  );

  await queryDb(
    `INSERT INTO media_assets (id, person_id, storage_key, media_type, mime_type, created_by, provenance_id)
     VALUES
      ('media:wedding_1968', $1, 'assets/images/vintage_assamese_wedding_1789020439671.jpg', 'photo', 'image/jpeg', 'actor:anu', 'prov:album_scan_01'),
      ('media:teaching_1974', $1, 'assets/images/vintage_teacher_memory_1789020507713.jpg', 'photo', 'image/jpeg', 'actor:anu', 'prov:school_archives_02'),
      ('media:school_childhood_1956', $1, 'assets/images/tezpur_school_memory_1789020475367.jpg', 'photo', 'image/jpeg', 'actor:anu', 'prov:family_scrapbook_03'),
      ('media:rina_portrait_2025', $1, 'assets/images/rina_granddaughter_portrait_1789020459100.jpg', 'photo', 'image/jpeg', 'actor:rina', 'prov:rina_phone_upload'),
      ('media:tea_garden', $1, 'assets/images/assam_tea_garden_1788977277508.jpg', 'photo', 'image/jpeg', 'system', 'prov:system_stock'),
      ('media:brahmaputra', $1, 'assets/images/brahmaputra_river_1788977296883.jpg', 'photo', 'image/jpeg', 'system', 'prov:system_stock')`,
    [purnima]
  );

  const purnimaMemories: Array<[string, string, string, string, string, string, string, string]> = [
    ["mem:childhood_school", "Early school days in Tezpur", "তেজপুৰৰ প্ৰাথমিক বিদ্যালয়ৰ দিনবোৰ",
      "Walking to the heritage schoolhouse by the riverbank with her slate and brass tiffin box.", "childhood", "1954 - 1960", "caregiver", "media:school_childhood_1956"],
    ["mem:teaching_post", "First Teaching Post at Tezpur Girls School", "তেজপুৰ বালিকা বিদ্যালয়ত প্ৰথম শিক্ষকতা",
      "Purnima teaching literature and poetry to enthusiastic young students for over 30 cherished years.", "young_adulthood", "1966 - 1998", "caregiver", "media:teaching_1974"],
    ["mem:wedding", "Traditional Wedding Ceremony in Tezpur", "তেজপুৰত বিয়াৰ পবিত্ৰ দিনটো",
      "Wearing golden Muga silk mekhela chador and traditional Assamese jewelry surrounded by singing relatives.", "young_adulthood", "1968", "caregiver", "media:wedding_1968"],
    ["mem:rina_visits", "Granddaughter Rina's visits to Tezpur", "নাতিনী ৰীনাৰ তেজপুৰৰ ভ্ৰমণ",
      "Rina sitting on the veranda eating homemade til pitha and listening to bedtime stories.", "recent", "2020 - Present", "caregiver", "media:rina_portrait_2025"],
    ["mem:bihu_tea_garden", "Spring Bihu Melody & Sonitpur Tea Garden Mornings", "বসন্তৰ বিহু আৰু সোণিতপুৰৰ চাহ বাগিচাৰ পুৱা",
      "Listening to the morning flute and celebrating Rongali Bihu surrounded by family, fresh tea leaves, and spring blossoms.", "later_life", "1980s - 1990s", "caregiver", "media:tea_garden"],
  ];
  for (const [id, title, asTitle, desc, frame, period, source, mediaId] of purnimaMemories) {
    await queryDb(
      `INSERT INTO memory_items (id, person_id, memory_type, title, assamese_title, description, temporal_frame, approximate_period, source, verification_status, confidence, cultural_context)
       VALUES ($1,$2,'autobiographical',$3,$4,$5,$6,$7,$8,'verified',0.98,'Tezpur, Assam')`,
      [id, purnima, title, asTitle, desc, frame, period, source]
    );
    await queryDb(`INSERT INTO memory_media (memory_id, media_asset_id) VALUES ($1,$2)`, [id, mediaId]);
  }
  await queryDb(`INSERT INTO memory_people (memory_id, person_entity_id, relationship) VALUES ('mem:rina_visits','entity:rina','granddaughter')`);

  await queryDb(
    `INSERT INTO familiar_places (id, person_id, name, assamese_name, category, significance, description, source, verification_status, created_by)
     VALUES
      ('pl:tezpur_home', $1, 'Ancestral Home in Tezpur', 'তেজপুৰৰ পৈতৃক ঘৰ', 'home',
       'Safe primary sanctuary where Purnima has lived for 58 years with family and raised her children',
       'Spacious traditional courtyard home near the river with green veranda, mango trees, and brass bell.', 'caregiver', 'verified', 'actor:anu'),
      ('pl:girls_school', $1, 'Tezpur Girls High School', 'তেজপুৰ বালিকা উচ্চতৰ মাধ্যমিক বিদ্যালয়', 'school',
       'Where she taught literature for over 30 years', 'Historic red-brick educational institution with colonial arched verandas.', 'caregiver', 'verified', 'actor:anu'),
      ('pl:river_ghat', $1, 'Brahmaputra River Ghat at Tezpur', 'তেজপুৰৰ ব্ৰহ্মপুত্ৰ ঘাট', 'river',
       'Evening walks and quiet reflection', 'Ancient stone ghat with wide steps leading down to the sacred Brahmaputra.', 'caregiver', 'verified', 'actor:anu')`,
    [purnima]
  );
  await queryDb(`INSERT INTO place_media (place_id, media_asset_id) VALUES ('pl:river_ghat','media:brahmaputra')`);

  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, description, person_entity_id, person_name, relationship, location_name, scheduled_at, status, source, verification_status)
     VALUES
      ('event:rina_visit_today', $1, 'family_visit', 'Granddaughter Rina Visiting for Afternoon Tea',
       'Rina is arriving by car from Guwahati to spend the late afternoon and evening at Tezpur home.',
       'entity:rina', 'Rina', 'granddaughter', 'Courtyard Veranda, Tezpur', NOW() + INTERVAL '4 hours', 'confirmed', 'caregiver', 'verified'),
      ('event:evening_tea_daily', $1, 'routine_tea', 'Daily 4:00 PM Veranda Cardamom Tea with Anu',
       NULL, NULL, NULL, NULL, 'Veranda, Tezpur', NOW() + INTERVAL '3.5 hours', 'confirmed', 'system', 'verified')`,
    [purnima]
  );

  await queryDb(
    `INSERT INTO routines (id, person_id, title, assamese_title, time_of_day, anchor_description, source, verification_status)
     VALUES ('rt:afternoon_tea', $1, '4:00 PM Veranda Cardamom Tea', 'ৰাতিপুৱাৰ চাহ', '16:00', 'Ginger-cardamom tea with Anu on the back veranda.', 'caregiver', 'verified')`,
    [purnima]
  );

  await queryDb(
    `INSERT INTO preferences (id, person_id, dimension, value, evidence_source, confidence)
     VALUES
      ('pref:purnima_content', $1, 'content', '{"topics":["Rina visits","Tezpur school stories","Assam tea preparation","Garden flowers"]}', 'caregiver_reported', 0.85),
      ('pref:purnima_modality', $1, 'modality', '{"preferred":"photo_plus_voice"}', 'system_inferred', 0.7)`,
    [purnima]
  );

  await queryDb(
    `INSERT INTO consent_grants (id, person_id, purpose, category, granted_to_role, granted_by, status)
     VALUES ('consent:purnima_personalisation', $1, 'personalisation', 'life_story_memory', 'primary_caregiver', 'Anu (Daughter)', 'granted')`,
    [purnima]
  );

  // ── Persona 2: Nekombo Ao -- Ao Naga, Christian, Mokokchung, Nagaland ──
  // Deliberately different: language (Ao/English, not Assamese), faith (Christian
  // church routine, not Hindu puja), family structure (pastor son, army grandson,
  // village-elder neighbour instead of an ASHA worker), festival (Moatsu, not Bihu),
  // food/craft memories (smoked pork & bamboo shoot, loin-loom weaving).
  const nekombo = "person:nekombo";

  await queryDb(
    `INSERT INTO person_entities (id, person_id, name, display_name, relationship_to_person, phone, is_emergency_contact, can_verify_memories, verification_status)
     VALUES
      ('entity:temjen', $1, 'Temjen', 'Temjen', 'son', '+91 98630 22110', true, true, 'verified'),
      ('entity:aningla', $1, 'Aningla', 'Aningla', 'granddaughter', '+91 94360 44556', false, false, 'verified'),
      ('entity:imnala', $1, 'Imnala', 'Imnala', 'neighbour_village_elder', '+91 94362 77889', false, false, 'verified')`,
    [nekombo]
  );

  await queryDb(
    `INSERT INTO relationships (id, person_id, related_entity_id, relationship_type, closeness_level, verified_by)
     VALUES
      ('rel:temjen', $1, 'entity:temjen', 'son', 'primary_caregiver', 'system'),
      ('rel:aningla', $1, 'entity:aningla', 'granddaughter', 'family_core', 'entity:temjen'),
      ('rel:imnala', $1, 'entity:imnala', 'neighbour_village_elder', 'community_chw', 'entity:temjen')`,
    [nekombo]
  );

  const nekomboMemories: Array<[string, string, string, string, string]> = [
    ["mem:jhum_cultivation", "Jhum Cultivation Seasons in the Hills", "Working the terraced jhum fields above Mokokchung with her late husband, planting job's tears and millet before the monsoon.", "later_life", "1970s - 1990s"],
    ["mem:church_choir", "Sunday Choir at the Baptist Church", "Singing Ao hymns in four-part harmony every Sunday, a practice she kept for over 40 years.", "later_life", "1965 - Present"],
    ["mem:moatsu_festival", "Moatsu Festival Celebrations", "Community feasting on smoked pork and bamboo shoot, and dancing around the bonfire after the sowing season.", "childhood", "1950s - 1960s"],
  ];
  for (const [id, title, desc, frame, period] of nekomboMemories) {
    await queryDb(
      `INSERT INTO memory_items (id, person_id, memory_type, title, description, temporal_frame, approximate_period, source, verification_status, confidence, cultural_context)
       VALUES ($1,$2,'autobiographical',$3,$4,$5,$6,'caregiver','verified',0.95,'Mokokchung, Nagaland (Ao Naga)')`,
      [id, nekombo, title, desc, frame, period]
    );
  }
  await queryDb(`INSERT INTO memory_people (memory_id, person_entity_id, relationship) VALUES ('mem:church_choir','entity:imnala','neighbour_village_elder')`);

  await queryDb(
    `INSERT INTO familiar_places (id, person_id, name, category, significance, description, source, verification_status, created_by)
     VALUES
      ('pl:mokokchung_home', $1, 'Family Home in Mokokchung', 'home', 'Home for over 50 years, built by her late husband', 'Traditional Ao Naga house with a wide bamboo veranda overlooking the village.', 'caregiver', 'verified', 'actor:temjen'),
      ('pl:baptist_church', $1, 'Mokokchung Baptist Church', 'temple', 'Weekly worship and choir practice for four decades', 'White wooden church at the top of the village road, bell rung every Sunday morning.', 'caregiver', 'verified', 'actor:temjen')`,
    [nekombo]
  );

  await queryDb(
    `INSERT INTO future_events (id, person_id, event_type, title, description, person_entity_id, person_name, relationship, location_name, scheduled_at, status, source, verification_status)
     VALUES ('event:aningla_visit', $1, 'family_visit', 'Granddaughter Aningla Visiting After Church',
       'Aningla is coming after the army posting leave ends, bringing photos from her base.',
       'entity:aningla', 'Aningla', 'granddaughter', 'Family Home, Mokokchung', NOW() + INTERVAL '2 days', 'expected', 'caregiver', 'verified')`,
    [nekombo]
  );

  await queryDb(
    `INSERT INTO routines (id, person_id, title, time_of_day, anchor_description, source, verification_status)
     VALUES ('rt:sunday_church', $1, 'Sunday Church & Choir', '09:00', 'Walk to the Baptist church with Imnala for the morning service and choir practice.', 'caregiver', 'verified')`,
    [nekombo]
  );

  await queryDb(
    `INSERT INTO preferences (id, person_id, dimension, value, evidence_source, confidence)
     VALUES ('pref:nekombo_content', $1, 'content', '{"topics":["church choir hymns","jhum field seasons","Moatsu festival","grandson army stories"]}', 'caregiver_reported', 0.85)`,
    [nekombo]
  );

  await queryDb(
    `INSERT INTO consent_grants (id, person_id, purpose, category, granted_to_role, granted_by, status)
     VALUES ('consent:nekombo_personalisation', $1, 'personalisation', 'life_story_memory', 'primary_caregiver', 'Temjen (Son)', 'granted')`,
    [nekombo]
  );

  console.log("Persona seeding complete: person:purnima (Tezpur, Assamese) and person:nekombo (Mokokchung, Ao Naga).");
}
