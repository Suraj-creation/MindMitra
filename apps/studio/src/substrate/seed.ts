/**
 * MindMitra Personal Intelligence Substrate — Master Seed Script
 *
 * Seeds authentic longitudinal data for Purnima Devi in Tezpur, Assam.
 * Enforces verified provenance, explicit consent grants, B2 media metadata,
 * conditioned capability models (PCM), and learned assistance policies.
 */

import { SubstrateRepository } from "./repository";
import { createOntologyNode, createOntologyEdge } from "./ontology";
import { createProvenanceRecord } from "./provenance";

export async function seedSubstrateData(repo: SubstrateRepository): Promise<void> {
  const personId = "person:purnima";
  const now = new Date().toISOString();

  // 1. Provenance Anchors
  const provAuthoritative = createProvenanceRecord("prov_auth_system", "system/authoritative", "system:mindmitra_ner", {
    verification_status: "verified",
    certifier_role: "system",
  });
  const provAnu = createProvenanceRecord("prov_anu_verified", "family confirmed", "actor:anu", {
    verification_status: "verified",
    verified_by: "Anu (Daughter)",
    certifier_role: "primary_caregiver",
  });
  const provPurnima = createProvenanceRecord("prov_purnima_self", "person verified", "person:purnima", {
    verification_status: "verified",
    verified_by: "Purnima (Self)",
  });
  const provASHA = createProvenanceRecord("prov_meena_asha", "CHW reported", "actor:meena", {
    verification_status: "reported",
    verified_by: "Meena (ASHA Worker)",
    certifier_role: "asha_chw",
  });

  await repo.addProvenanceRecord(provAuthoritative);
  await repo.addProvenanceRecord(provAnu);
  await repo.addProvenanceRecord(provPurnima);
  await repo.addProvenanceRecord(provASHA);

  // 2. Identity & Profile
  await repo.upsertPerson({
    person_id: personId,
    tenant_id: "mindmitra_ner",
    display_name: "Purnima Devi",
    given_name: "Purnima",
    family_name: "Devi",
    preferred_language: "as", // Assamese
    secondary_languages: ["bn", "hi", "en"],
    language_tier: "tier_1",
    cultural_profile: {
      region: "Tezpur, Sonitpur District, Assam",
      traditions: ["Rongali Bihu", "Bhogali Bihu", "Morning Courtyard Prayer", "Til Pitha Weaving"],
      dietary_rituals: ["Afternoon cardamom tea with ginger", "Fresh garden mint infusion"],
      music_preferences: ["Assamese bamboo flute ragas", "Goalpariya folk songs", "Bhupen Hazarika classics"],
      address_honorific: "Purnima baideu",
    },
    timezone: "Asia/Kolkata",
    created_at: now,
    updated_at: now,
  });

  // 3. Consent Grants
  const caregiverIds = ["actor:anu", "actor:anu_caregiver"];
  const categories: Array<import("./types").ConsentCategory> = [
    "personal_identity",
    "life_story_memory",
    "activity_telemetry",
    "media_assets",
    "assistance_policies",
    "location_context",
    "clinical_observations",
  ];

  for (const cId of caregiverIds) {
    for (const cat of categories) {
      await repo.grantConsent({
        consent_id: `c_${cId.replace(/[^a-zA-Z0-9]/g, "_")}_${cat}`,
        person_id: personId,
        grantee_actor_id: cId,
        grantee_role: "primary_caregiver",
        category: cat,
        purpose: "personalisation",
        is_granted: true,
        granted_by: personId,
        granted_at: now,
      });
      await repo.grantConsent({
        consent_id: `c_${cId.replace(/[^a-zA-Z0-9]/g, "_")}_${cat}_coord`,
        person_id: personId,
        grantee_actor_id: cId,
        grantee_role: "primary_caregiver",
        category: cat,
        purpose: "care_coordination",
        is_granted: true,
        granted_by: personId,
        granted_at: now,
      });
    }
  }

  await repo.grantConsent({
    consent_id: "c_meena_chw",
    person_id: personId,
    grantee_actor_id: "actor:meena",
    grantee_role: "asha_chw",
    category: "clinical_observations",
    purpose: "clinical_review",
    is_granted: true,
    granted_by: personId,
    granted_at: now,
  });

  // 4. Personal World: Contacts
  await repo.addContact({
    contact_id: "contact_anu",
    person_id: personId,
    full_name: "Anu Bora",
    call_name: "Anu",
    kinship: "daughter",
    relationship_label: "Daughter & Primary Caregiver",
    location: "Home (Tezpur)",
    phone: "+91 98640 12345",
    is_emergency_contact: true,
    call_priority: 1,
    familiarity_score: 1.0,
    notes: "Lives with Purnima in Tezpur; prepares evening cardamom tea.",
  });

  await repo.addContact({
    contact_id: "contact_rina",
    person_id: personId,
    full_name: "Rina Bora",
    call_name: "Rina",
    kinship: "granddaughter",
    relationship_label: "Granddaughter in Guwahati",
    location: "Guwahati (Cotton University)",
    phone: "+91 94350 98765",
    is_emergency_contact: false,
    call_priority: 2,
    familiarity_score: 0.98,
    notes: "Calls every Tuesday & Saturday at 5:00 PM; adores grandmother's til pitha.",
  });

  await repo.addContact({
    contact_id: "contact_bikash",
    person_id: personId,
    full_name: "Bikash Bora",
    call_name: "Bikash",
    kinship: "son",
    relationship_label: "Son (Bengaluru)",
    location: "Bengaluru, Karnataka",
    phone: "+91 98450 11223",
    is_emergency_contact: false,
    call_priority: 3,
    familiarity_score: 0.95,
    notes: "Visits during Rongali Bihu festival.",
  });

  await repo.addContact({
    contact_id: "contact_meena",
    person_id: personId,
    full_name: "Meena Saikia",
    call_name: "Meena",
    kinship: "asha_worker",
    relationship_label: "ASHA Community Health Worker",
    location: "Tezpur Sub-district Health Post",
    phone: "+91 94351 55667",
    is_emergency_contact: true,
    call_priority: 4,
    familiarity_score: 0.88,
    notes: "Conducts weekly Thursday wellness visits and vitals check.",
  });

  // 5. Personal World: Places
  await repo.addPlace({
    place_id: "place_courtyard",
    person_id: personId,
    name: "Ancestral Courtyard (Chotal)",
    location_type: "home",
    significance: "Sunny brick courtyard with flowering Nahor tree, tulsi altar, and bamboo chairs.",
    emotional_valence: "calming",
  });

  await repo.addPlace({
    place_id: "place_ghat",
    person_id: personId,
    name: "Brahmaputra Riverbank Walk",
    location_type: "ancestral",
    significance: "Peaceful evening walks watching the sunset over the Brahmaputra waters.",
    emotional_valence: "very_positive",
  });

  // 6. Media Metadata (Backblaze B2 Vault Integration)
  await repo.registerMedia({
    media_id: "media_bihu_1985",
    person_id: personId,
    b2_object_key: "vault/person_purnima/photos/bihu_courtyard_1985.jpg",
    b2_bucket: "mindmitra-b2-vault",
    mime_type: "image/jpeg",
    byte_size: 2451000,
    dimensions: { width: 1920, height: 1080 },
    semantic_description: "Rongali Bihu celebration in Tezpur ancestral courtyard under the blossoming mango tree with Anu and Bikash.",
    depicted_person_ids: ["contact_anu", "contact_bikash"],
    associated_place_id: "place_courtyard",
    historical_date_text: "April 1985, Rongali Bihu",
    consent_scope: "media_assets",
    provenance_id: provAnu.provenance_id,
    created_at: now,
  });

  await repo.registerMedia({
    media_id: "media_rina_call",
    person_id: personId,
    b2_object_key: "vault/person_purnima/photos/rina_cotton_college.jpg",
    b2_bucket: "mindmitra-b2-vault",
    mime_type: "image/jpeg",
    byte_size: 1845000,
    dimensions: { width: 1440, height: 1080 },
    semantic_description: "Granddaughter Rina smiling outside Cotton University hostel in Guwahati holding her notebook.",
    depicted_person_ids: ["contact_rina"],
    historical_date_text: "Autumn 2024",
    consent_scope: "media_assets",
    provenance_id: provAnu.provenance_id,
    created_at: now,
  });

  // 7. Temporal & Routines
  await repo.addRoutine({
    routine_id: "routine_afternoon_tea",
    person_id: personId,
    title: "Afternoon Cardamom Tea with Anu",
    time_of_day: "afternoon",
    scheduled_time: "16:00",
    importance: "nourishment",
    preferred_assistance_strategy: "step_by_step_visual",
    steps: [
      { step_id: "s1", step_number: 1, label: "Boil water in small kettle", cue_text: "The kettle is on the stove", assistance_trigger_seconds: 30 },
      { step_id: "s2", step_number: 2, label: "Add fresh crushed ginger and green cardamom", cue_text: "Anu prepared the spices", assistance_trigger_seconds: 25 },
      { step_id: "s3", step_number: 3, label: "Pour tea into clay cups and sit on veranda", cue_text: "Two warm cups on the table", assistance_trigger_seconds: 20 },
    ],
  });

  await repo.addTemporalEvent({
    temporal_event_id: "event_rina_call_today",
    person_id: personId,
    title: "Granddaughter Rina Phone Call",
    description: "Weekly Tuesday call from Guwahati to catch up and talk about til pitha.",
    temporal_frame: "present",
    event_status: "expected",
    scheduled_at: `${new Date().toISOString().split("T")[0]}T17:00:00.000Z`,
    duration_minutes: 20,
    valid_from: now,
    valid_to: now,
    source: "family_routine",
    associated_person_id: "contact_rina",
  });

  // 8. Personal Intelligence: Conditioned Capability States (PCM)
  await repo.upsertCapabilityState({
    state_id: "pcm_recog_01",
    person_id: personId,
    domain: "memory_recognition",
    conditioned_estimate: "Reliable familiar face and kinship recognition when presented with high-contrast photographs; recognition confidence reaches 92% in morning sessions.",
    numeric_estimate: 88.5,
    uncertainty: 0.14,
    condition_tags: ["familiar_environment", "morning", "low_noise", "daughter_present"],
    trend: "stable",
    evidence_count: 18,
    last_observed_at: now,
    updated_at: now,
  });

  await repo.upsertCapabilityState({
    state_id: "pcm_recall_01",
    person_id: personId,
    domain: "memory_free_recall",
    conditioned_estimate: "Unassisted temporal and episodic free recall shows expected latency; responds immediately to gentle relational visual cues.",
    numeric_estimate: 44.0,
    uncertainty: 0.22,
    condition_tags: ["unprompted", "afternoon_fatigue"],
    trend: "stable",
    evidence_count: 15,
    last_observed_at: now,
    updated_at: now,
  });

  await repo.upsertCapabilityState({
    state_id: "pcm_orient_01",
    person_id: personId,
    domain: "orientation_time_place",
    conditioned_estimate: "High spatial orientation to home courtyard and Tezpur town landmarks; weekday awareness grounded reliably by daily tea and call rhythms.",
    numeric_estimate: 91.0,
    uncertainty: 0.12,
    condition_tags: ["ancestral_home", "sunny_weather"],
    trend: "stable",
    evidence_count: 22,
    last_observed_at: now,
    updated_at: now,
  });

  // 9. Personal Intelligence: Learned Assistance Policies
  await repo.upsertAssistancePolicy({
    policy_id: "pol_fam_recall",
    person_id: personId,
    task_domain: "familiar_person_recall",
    preferred_strategy: "visual_recognition_first",
    fallback_strategy: "relational_voice_cue",
    confidence: 0.91,
    evidence_count: 16,
    success_rate: 0.93,
    last_reinforced_at: now,
    condition_constraints: ["morning", "low_noise"],
    is_clinician_locked: false,
  });

  await repo.upsertAssistancePolicy({
    policy_id: "pol_tea_routine",
    person_id: personId,
    task_domain: "tea_routine_ordering",
    preferred_strategy: "step_by_step_visual",
    fallback_strategy: "caregiver_co_participation",
    confidence: 0.86,
    evidence_count: 12,
    success_rate: 0.89,
    last_reinforced_at: now,
    condition_constraints: ["afternoon_4pm"],
    is_clinician_locked: false,
  });

  // 10. Governed Memories (with verifiable provenance and evidence)
  await repo.addMemory({
    memory_id: "mem_rina_guwahati",
    person_id: personId,
    statement: "Granddaughter Rina is studying at Cotton University in Guwahati, calls every Tuesday and Saturday at 5:00 PM, and loves her grandmother's til pitha.",
    category: "family",
    temporal_frame: "present",
    authority_class: "family confirmed",
    lifecycle_state: "active",
    evidence_level: "verified",
    confidence: 0.96,
    valid_from: now,
    provenance_id: provAnu.provenance_id,
    reinforcement_count: 12,
    last_reinforced_at: now,
    created_at: now,
    updated_at: now,
  });

  await repo.addMemory({
    memory_id: "mem_cardamom_tea",
    person_id: personId,
    statement: "Afternoon cardamom ginger tea is enjoyed together with daughter Anu at 4:00 PM on the veranda.",
    category: "routine",
    temporal_frame: "present",
    authority_class: "caregiver reported",
    lifecycle_state: "active",
    evidence_level: "verified",
    confidence: 0.98,
    valid_from: now,
    provenance_id: provAnu.provenance_id,
    reinforcement_count: 18,
    last_reinforced_at: now,
    created_at: now,
    updated_at: now,
  });

  await repo.addMemory({
    memory_id: "mem_nahor_flowers",
    person_id: personId,
    statement: "Fragrant white Nahor blossoms and golden marigolds flourish along the courtyard fence in Tezpur.",
    category: "sensory_comfort",
    temporal_frame: "present",
    authority_class: "person verified",
    lifecycle_state: "active",
    evidence_level: "verified",
    confidence: 0.99,
    valid_from: now,
    provenance_id: provPurnima.provenance_id,
    reinforcement_count: 24,
    last_reinforced_at: now,
    created_at: now,
    updated_at: now,
  });

  // 11. Knowledge & Ontology Nodes & Typed Edges
  const nodePerson = createOntologyNode("node_purnima", personId, "Person", "Purnima Devi", "purnima_devi");
  const nodeAnu = createOntologyNode("node_anu", personId, "Person", "Daughter Anu", "anu_bora");
  const nodeRina = createOntologyNode("node_rina", personId, "Person", "Granddaughter Rina", "rina_bora");
  const nodePlaceHome = createOntologyNode("node_home", personId, "Place", "Tezpur Ancestral Courtyard", "tezpur_courtyard");
  const nodeRoutineTea = createOntologyNode("node_routine_tea", personId, "Routine", "Evening Cardamom Tea", "tea_routine");
  const nodePhotoBihu = createOntologyNode("node_photo_bihu", personId, "Photo", "Bihu Family Photograph 1985", "bihu_photo_1985");

  await repo.upsertOntologyNode(nodePerson);
  await repo.upsertOntologyNode(nodeAnu);
  await repo.upsertOntologyNode(nodeRina);
  await repo.upsertOntologyNode(nodePlaceHome);
  await repo.upsertOntologyNode(nodeRoutineTea);
  await repo.upsertOntologyNode(nodePhotoBihu);

  // Typed Edges:
  // PERSON HAS_RELATIONSHIP PERSON
  await repo.upsertOntologyEdge(
    createOntologyEdge("edge_purnima_anu", personId, "PERSON_HAS_RELATIONSHIP_PERSON", nodePerson.node_id, nodeAnu.node_id, provAnu.provenance_id)
  );
  await repo.upsertOntologyEdge(
    createOntologyEdge("edge_purnima_rina", personId, "PERSON_HAS_RELATIONSHIP_PERSON", nodePerson.node_id, nodeRina.node_id, provAnu.provenance_id)
  );
  // PERSON LIVES_AT PLACE
  await repo.upsertOntologyEdge(
    createOntologyEdge("edge_purnima_home", personId, "PERSON_LIVES_AT_PLACE", nodePerson.node_id, nodePlaceHome.node_id, provPurnima.provenance_id)
  );
  // PERSON HAS_ROUTINE ROUTINE
  await repo.upsertOntologyEdge(
    createOntologyEdge("edge_purnima_tea", personId, "PERSON_HAS_ROUTINE_ROUTINE", nodePerson.node_id, nodeRoutineTea.node_id, provAnu.provenance_id)
  );
  // PHOTO DEPICTS PERSON
  await repo.upsertOntologyEdge(
    createOntologyEdge("edge_photo_anu", personId, "PHOTO_DEPICTS_PERSON", nodePhotoBihu.node_id, nodeAnu.node_id, provAnu.provenance_id)
  );

  console.info("[MindMitra Substrate] Successfully seeded longitudinal intelligence substrate for Purnima Devi.");
}
