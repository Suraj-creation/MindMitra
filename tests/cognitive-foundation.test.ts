import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cognitiveStore } from "../src/intelligence/cognitive-engine.js";
import {
  MemoryItem,
  MediaAsset,
  FutureEventStatus,
} from "../src/domain/cognitive-experience.js";

test("Database Schema: cognitive_schema.sql covers all 16 requested data entities", () => {
  const schemaPath = path.resolve(process.cwd(), "src/db/cognitive_schema.sql");
  assert.ok(fs.existsSync(schemaPath), "cognitive_schema.sql must exist");

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  // 1. Personal memories
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS memory_items/i);
  // 2. Photos/images & 3. Voice notes (Media assets with B2 storage)
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS media_assets/i);
  assert.match(schemaContent, /b2_bucket/i, "Schema must support Backblaze B2 bucket storage");
  assert.match(schemaContent, /b2_file_id/i, "Schema must support B2 file ID");
  // Voice note linkage table
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS memory_voice_notes/i);
  // Media linkage table
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS memory_media/i);
  // 6. Life events
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS life_events/i);
  // 7. Relationships & Person Entities
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS person_entities/i);
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS relationships/i);
  // 8. Upcoming confirmed events
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS future_events/i);
  // 9. Game templates
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS game_templates/i);
  // 10. Game specifications
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS game_specs/i);
  // 11. Game sessions
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS game_sessions/i);
  // 12. Game trials
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS game_trials/i);
  // 13. Experience Episodes
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS experience_episodes/i);
  // 14. Game-generation audit records
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS game_generation_runs/i);
  // 15. Provenance & verification types
  assert.match(schemaContent, /verification_status/i);
  assert.match(schemaContent, /source IN \('person'/i);
  // 16. Consent/visibility scope & Firewall audit log
  assert.match(schemaContent, /consent_scope/i);
  assert.match(schemaContent, /visibility_scope/i);
  assert.match(schemaContent, /CREATE TABLE IF NOT EXISTS memory_firewall_audit_log/i);
});

test("Memory Foundation: Person-uploaded memory begins as unverified claim", () => {
  const newMemory = cognitiveStore.addMemory({
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Remembering reciting poem by river ghat",
    description: "Recited Bezbaroa poem at Tezpur ghat during dusk.",
    temporal_frame: "young_adulthood",
    approximate_period: "1965",
    source: "person",
    verification_status: "unverified",
    confidence: 0.70,
    sensitivity: "low",
    is_sensitive: false,
    game_eligible: true,
    consent_scope: "all",
    visibility_scope: "family",
    cultural_context: "Tezpur Ghat, Assam",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
  });

  assert.ok(newMemory.id, "Generated memory must have a valid ID");
  assert.equal(newMemory.source, "person");
  assert.equal(newMemory.verification_status, "unverified");
  assert.equal(newMemory.confidence, 0.70);
});

test("Media Association: B2 photo and voice note can be linked to a memory", () => {
  // 1. Add media asset with Backblaze B2 metadata
  const asset = cognitiveStore.addMediaAsset({
    person_id: "person:purnima",
    media_type: "photo",
    title: "Old Tezpur High School Courtyard",
    url: "https://f005.backblazeb2.com/file/mindmitra-elder-media/purnima/school_1966.jpg",
    thumbnail_url: "https://f005.backblazeb2.com/file/mindmitra-elder-media/purnima/school_1966_thumb.jpg",
    mime_type: "image/jpeg",
    storage_backend: "b2",
    b2_bucket: "mindmitra-elder-media",
    b2_file_id: "4_z1234567890abcdef",
    storage_key: "purnima/school_1966.jpg",
    created_by: "caregiver",
    visibility_scope: "family",
    consent_scope: "all",
    provenance_id: "prov:school_1966",
    status: "active",
  });

  assert.ok(asset.id);
  assert.equal(asset.storage_backend, "b2");
  assert.equal(asset.b2_bucket, "mindmitra-elder-media");

  // 2. Create memory linked to the asset
  const memory = cognitiveStore.addMemory({
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Teaching young girls in Tezpur School",
    description: "Standing in courtyard after literature class.",
    temporal_frame: "young_adulthood",
    approximate_period: "1966",
    source: "caregiver",
    verification_status: "verified",
    confidence: 1.0,
    sensitivity: "low",
    cultural_context: "Tezpur Girls High School",
    media_refs: [asset.id],
    people_refs: [],
    voice_notes: [],
  });

  assert.ok(memory.media_refs.includes(asset.id));

  // 3. Associate daughter's voice note to memory
  const updated = cognitiveStore.addVoiceNote(memory.id, {
    speaker_name: "Anu",
    relationship: "daughter",
    audio_url: "https://f005.backblazeb2.com/file/mindmitra-elder-media/audio/anu_note.m4a",
    transcript: "Ma, you were always so respected as a teacher in Tezpur.",
    language: "as",
    verified: true,
    media_asset_id: asset.id,
    b2_audio_key: "audio/anu_note.m4a",
  });

  assert.ok(updated);
  assert.equal(updated.voice_notes.length, 1);
  assert.equal(updated.voice_notes[0].speaker_name, "Anu");
  assert.equal(updated.voice_notes[0].verified, true);
  assert.equal(updated.voice_notes[0].b2_audio_key, "audio/anu_note.m4a");
});

test("Provenance Preservation: Verification transitions update verification_status and verifier", () => {
  const memory = cognitiveStore.addMemory({
    person_id: "person:purnima",
    memory_type: "autobiographical",
    title: "Grandmother's Brass Tea Pot Memory",
    description: "Purnima recalled an antique tea pot from her ancestral home.",
    temporal_frame: "childhood",
    approximate_period: "1950s",
    source: "person",
    verification_status: "unverified",
    confidence: 0.65,
    sensitivity: "low",
    cultural_context: "Assam Tea Culture",
    media_refs: [],
    people_refs: [],
    voice_notes: [],
  });

  assert.equal(memory.verification_status, "unverified");

  // Caregiver verifies the claim
  const verified = cognitiveStore.verifyMemory(memory.id, "Anu (Daughter)", "primary_caregiver", "verified");
  assert.ok(verified);
  assert.equal(verified.verification_status, "caregiver_verified");
  assert.equal(verified.verified_by, "Anu (Daughter)");
  assert.equal(verified.confidence, 1.0);
  assert.ok(verified.verified_at);

  // If a claim is rejected
  const rejected = cognitiveStore.verifyMemory(memory.id, "Anu (Daughter)", "primary_caregiver", "rejected");
  assert.ok(rejected);
  assert.equal(rejected.verification_status, "rejected");
  assert.equal(rejected.game_eligible, false);
});

test("Memory Firewall: Denies unauthorized research purpose access", () => {
  const evalResult = cognitiveStore.evaluateMemoryFirewall({
    actor_id: "chw_ext_001",
    actor_role: "chw",
    purpose: "research",
    person_id: "person:purnima",
  });

  assert.equal(evalResult.allowed, false);
  assert.equal(evalResult.decision, "DENY");
  assert.match(evalResult.reason, /strictly blocked under elder protection/i);
  assert.equal(evalResult.filtered_memories.length, 0);
  assert.ok(evalResult.excluded_memories.length > 0);
});

test("Memory Firewall: Allows person self-access unconditionally", () => {
  const evalResult = cognitiveStore.evaluateMemoryFirewall({
    actor_id: "person:purnima:self",
    actor_role: "person_self",
    purpose: "personal_view",
    person_id: "person:purnima",
  });

  assert.equal(evalResult.allowed, true);
  assert.equal(evalResult.decision, "ALLOW");
  assert.ok(evalResult.filtered_memories.length > 0);
  assert.equal(evalResult.excluded_memories.length, 0);
});

test("Memory Firewall: Game Generation Safety Policy strictly filters candidate memories", () => {
  const evalResult = cognitiveStore.evaluateMemoryFirewall({
    actor_id: "agent:game_orchestrator",
    actor_role: "system_agent",
    purpose: "game_generation",
    person_id: "person:purnima",
  });

  assert.ok(evalResult.allowed);
  assert.ok(evalResult.filtered_memories.length > 0);

  // 1. Invariant: Unverified person claims must NEVER be in filtered_memories for game generation
  const hasUnverified = evalResult.filtered_memories.some(
    (m) => m.verification_status === "unverified" || m.verification_status === "rejected"
  );
  assert.equal(hasUnverified, false, "Unverified or rejected memories must be excluded from game generation");

  // 2. Invariant: Sensitive memories must NEVER be in filtered_memories for game generation
  const hasSensitive = evalResult.filtered_memories.some(
    (m) => m.is_sensitive || m.sensitivity === "high"
  );
  assert.equal(hasSensitive, false, "High sensitivity memories must be excluded from game generation");

  // 3. Invariant: Game-ineligible memories must NEVER be in filtered_memories
  const hasIneligible = evalResult.filtered_memories.some(
    (m) => m.game_eligible === false
  );
  assert.equal(hasIneligible, false, "Game-ineligible memories must be excluded from game generation");

  // 4. Invariant: Person-only consent scope memories must NEVER be in game generation
  const hasPersonOnly = evalResult.filtered_memories.some(
    (m) => m.consent_scope === "person_only"
  );
  assert.equal(hasPersonOnly, false, "Person-only consent scoped memories must be excluded from game generation");

  // 5. Excluded memories must explicitly list reasons
  assert.ok(evalResult.excluded_memories.length > 0, "There should be safely excluded memories");
  const reasons = evalResult.excluded_memories.map((e) => e.exclusion_reason);
  assert.ok(reasons.some((r) => r.includes("UNVERIFIED_CLAIM_EXCLUDED") || r.includes("SENSITIVE_MEMORY_EXCLUDED")));
});

test("Future Events: Status transitions follow state machine (expected -> confirmed -> occurred)", () => {
  const event = cognitiveStore.addFutureEvent({
    person_id: "person:purnima",
    event_type: "family_visit",
    title: "Granddaughter Rina Visit",
    location: "Veranda, Tezpur",
    scheduled_at: new Date(Date.now() + 86400 * 1000).toISOString(),
    status: "expected",
    source: "caregiver",
    verification_status: "verified",
  });

  assert.equal(event.status, "expected");

  // Transition to confirmed
  const confirmed = cognitiveStore.updateFutureEventStatus(event.id, "confirmed");
  assert.ok(confirmed);
  assert.equal(confirmed.status, "confirmed");

  // Transition to occurred after visit completes
  const occurred = cognitiveStore.updateFutureEventStatus(event.id, "occurred");
  assert.ok(occurred);
  assert.equal(occurred.status, "occurred");
});
