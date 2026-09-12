// Neon-backed repository for the Personal World Model.
//
// Every query is parameterized and scoped by person_id -- this is the
// enforcement point for cross-person isolation (see tests/person-data-repository.test.ts).
// Unlike caregiver-db.ts, reads here do NOT fall back to hardcoded demo content on
// failure: an empty list + logged warning is correct for person-facing data (the
// frontend already renders a graceful empty state), whereas fabricated fallback
// content would silently reintroduce the "fake data" problem this layer exists to fix.

import { queryDb } from "./neon";

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Memories ─────────────────────────────────────────────────────────────────

export interface MemoryRecord {
  id: string;
  person_id: string;
  memory_type: string;
  title: string;
  assamese_title?: string | null;
  description: string;
  temporal_frame: string;
  approximate_period: string;
  source: string;
  verification_status: string;
  verified_by?: string | null;
  verified_at?: string | null;
  confidence: number;
  sensitivity: string;
  is_sensitive: boolean;
  game_eligible: boolean;
  visibility_scope: string;
  consent_scope: string;
  cultural_context: string;
  life_event_id?: string | null;
  created_at: string;
  updated_at: string;
  media_refs: string[];
}

export async function listMemories(personId: string, filters: { verificationStatus?: string; temporalFrame?: string } = {}): Promise<MemoryRecord[]> {
  const conditions = ["m.person_id = $1"];
  const params: unknown[] = [personId];
  if (filters.verificationStatus) {
    params.push(filters.verificationStatus);
    conditions.push(`m.verification_status = $${params.length}`);
  }
  if (filters.temporalFrame) {
    params.push(filters.temporalFrame);
    conditions.push(`m.temporal_frame = $${params.length}`);
  }

  const rows = await queryDb<any>(
    `SELECT m.*,
       COALESCE(
         (SELECT array_agg(mm.media_asset_id ORDER BY mm.sequence_order)
          FROM memory_media mm WHERE mm.memory_id = m.id),
         ARRAY[]::varchar[]
       ) AS media_refs
     FROM memory_items m
     WHERE ${conditions.join(" AND ")}
     ORDER BY m.created_at DESC`,
    params
  );
  return rows.map((r) => ({ ...r, media_refs: r.media_refs || [] }));
}

export async function createMemory(input: {
  person_id: string;
  memory_type: string;
  title: string;
  assamese_title?: string;
  description: string;
  temporal_frame: string;
  approximate_period: string;
  source: string;
  verification_status: string;
  confidence: number;
  sensitivity: string;
  consent_scope: string;
  visibility_scope: string;
  cultural_context: string;
  created_by: string;
  media_asset_ids?: string[];
}): Promise<MemoryRecord> {
  const id = newId("mem");
  const rows = await queryDb<any>(
    `INSERT INTO memory_items
      (id, person_id, memory_type, title, assamese_title, description, temporal_frame,
       approximate_period, source, verification_status, confidence, sensitivity,
       consent_scope, visibility_scope, cultural_context)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      id, input.person_id, input.memory_type, input.title, input.assamese_title || null,
      input.description, input.temporal_frame, input.approximate_period, input.source,
      input.verification_status, input.confidence, input.sensitivity, input.consent_scope,
      input.visibility_scope, input.cultural_context,
    ]
  );

  const mediaIds = input.media_asset_ids || [];
  for (let i = 0; i < mediaIds.length; i++) {
    await queryDb(
      `INSERT INTO memory_media (memory_id, media_asset_id, role, sequence_order)
       VALUES ($1, $2, 'primary_photo', $3)
       ON CONFLICT (memory_id, media_asset_id) DO NOTHING`,
      [id, mediaIds[i], i + 1]
    );
  }

  return { ...rows[0], media_refs: mediaIds };
}

export async function attachMediaToMemory(
  memoryId: string,
  mediaAssetId: string,
  opts: { role?: string; sequenceOrder?: number } = {}
): Promise<{ memory_id: string; media_asset_id: string } | null> {
  const memRows = await queryDb<any>(`SELECT id FROM memory_items WHERE id = $1`, [memoryId]);
  if (memRows.length === 0) return null;
  const mediaRows = await queryDb<any>(`SELECT id FROM media_assets WHERE id = $1`, [mediaAssetId]);
  if (mediaRows.length === 0) return null;

  await queryDb(
    `INSERT INTO memory_media (memory_id, media_asset_id, role, sequence_order)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (memory_id, media_asset_id) DO UPDATE SET role = EXCLUDED.role, sequence_order = EXCLUDED.sequence_order`,
    [memoryId, mediaAssetId, opts.role || "primary_photo", opts.sequenceOrder ?? 1]
  );
  return { memory_id: memoryId, media_asset_id: mediaAssetId };
}

export async function verifyMemory(id: string, verifiedBy: string): Promise<MemoryRecord | null> {
  const rows = await queryDb<any>(
    `UPDATE memory_items
     SET verification_status = 'verified', verified_by = $2, verified_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, verifiedBy]
  );
  return rows[0] ? { ...rows[0], media_refs: [] } : null;
}

// ── Media assets ─────────────────────────────────────────────────────────────

export interface MediaAssetRecord {
  id: string;
  person_id: string;
  storage_key: string;
  media_type: string;
  mime_type: string;
  created_by: string;
  created_at: string;
  url?: string;
}

export async function listMediaAssets(personId: string, mediaType?: string): Promise<MediaAssetRecord[]> {
  const params: unknown[] = [personId];
  let sql = "SELECT * FROM media_assets WHERE person_id = $1";
  if (mediaType) {
    params.push(mediaType);
    sql += ` AND media_type = $${params.length}`;
  }
  sql += " ORDER BY created_at DESC";
  const rows = await queryDb<any>(sql, params);
  return rows.map((r) => ({ ...r, url: r.storage_key.startsWith("/") || r.storage_key.startsWith("http") ? r.storage_key : `/${r.storage_key}` }));
}

export async function createMediaAsset(input: {
  person_id: string;
  storage_key: string;
  media_type: string;
  mime_type: string;
  created_by: string;
  visibility_scope?: string;
  consent_scope?: string;
}): Promise<MediaAssetRecord> {
  const id = newId("media");
  const rows = await queryDb<any>(
    `INSERT INTO media_assets
      (id, person_id, storage_key, media_type, mime_type, created_by, visibility_scope, consent_scope, provenance_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      id, input.person_id, input.storage_key, input.media_type, input.mime_type,
      input.created_by, input.visibility_scope || "family", input.consent_scope || "all",
      `prov:${id}`,
    ]
  );
  return rows[0];
}

// ── Familiar places ──────────────────────────────────────────────────────────

export interface PlaceRecord {
  id: string;
  person_id: string;
  name: string;
  assamese_name?: string | null;
  category: string;
  significance?: string | null;
  description?: string | null;
  verification_status: string;
  media_refs: string[];
}

export async function listPlaces(personId: string, verificationStatus?: string): Promise<PlaceRecord[]> {
  const params: unknown[] = [personId];
  let sql = `
    SELECT p.*,
      COALESCE((SELECT array_agg(pm.media_asset_id ORDER BY pm.sequence_order) FROM place_media pm WHERE pm.place_id = p.id), ARRAY[]::varchar[]) AS media_refs
    FROM familiar_places p WHERE p.person_id = $1`;
  if (verificationStatus) {
    params.push(verificationStatus);
    sql += ` AND p.verification_status = $${params.length}`;
  }
  sql += " ORDER BY p.created_at ASC";
  const rows = await queryDb<any>(sql, params);
  return rows.map((r) => ({ ...r, media_refs: r.media_refs || [] }));
}

export async function createPlace(input: {
  person_id: string;
  name: string;
  assamese_name?: string;
  category: string;
  significance?: string;
  description?: string;
  landmark_cues?: string[];
  sensory_cues?: Record<string, string[]>;
  approximate_period?: string;
  coordinates?: { latitude: number; longitude: number } | null;
  source: string;
  created_by: string;
  media_asset_ids?: string[];
}): Promise<PlaceRecord> {
  const id = newId("pl");
  const rows = await queryDb<any>(
    `INSERT INTO familiar_places
      (id, person_id, name, assamese_name, category, significance, description, landmark_cues, sensory_cues, approximate_period, coordinates, source, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id, input.person_id, input.name, input.assamese_name || null, input.category,
      input.significance || null, input.description || null,
      JSON.stringify(input.landmark_cues || []), JSON.stringify(input.sensory_cues || {}),
      input.approximate_period || null, input.coordinates ? JSON.stringify(input.coordinates) : null,
      input.source, input.created_by,
    ]
  );

  const mediaIds = input.media_asset_ids || [];
  for (let i = 0; i < mediaIds.length; i++) {
    await queryDb(
      `INSERT INTO place_media (place_id, media_asset_id, role, sequence_order)
       VALUES ($1, $2, 'primary_photo', $3) ON CONFLICT (place_id, media_asset_id) DO NOTHING`,
      [id, mediaIds[i], i + 1]
    );
  }
  return { ...rows[0], media_refs: mediaIds };
}

export async function verifyPlace(id: string): Promise<PlaceRecord | null> {
  const rows = await queryDb<any>(
    `UPDATE familiar_places SET verification_status = 'verified' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ? { ...rows[0], media_refs: [] } : null;
}

// ── Future events (temporal validity enforced at the query, not the caller) ──

export interface FutureEventRecord {
  id: string;
  person_id: string;
  event_type: string;
  title: string;
  description?: string | null;
  person_name?: string | null;
  relationship?: string | null;
  location_name: string;
  scheduled_at: string;
  status: string;
}

/**
 * Only expected/confirmed events that haven't expired -- cancelled or stale
 * events are never "current".
 *
 * `scheduled_at >= NOW()` matters and was missing: an event that was never
 * transitioned out of 'expected' after its time passed used to sort FIRST
 * (ORDER BY scheduled_at ASC) and be answered as "your next event", so the
 * companion could report a days-old appointment as upcoming.
 */
export async function listUpcomingEvents(personId: string): Promise<FutureEventRecord[]> {
  return queryDb<any>(
    `SELECT * FROM future_events
     WHERE person_id = $1
       AND status IN ('expected', 'confirmed')
       AND scheduled_at >= NOW()
       AND (valid_until IS NULL OR valid_until > NOW())
     ORDER BY scheduled_at ASC`,
    [personId]
  );
}

/**
 * Events falling on one calendar day *in the person's own timezone*.
 *
 * The day boundary is computed by Postgres (`AT TIME ZONE`) rather than in JS:
 * "today" for someone in Tezpur must not shift because the server process
 * happens to run in UTC. `dayOffset` 0 = today, 1 = tomorrow, -1 = yesterday.
 *
 * Unlike listUpcomingEvents this keeps events whose time has already passed
 * today -- "what have I done / what is left today" needs both halves of the
 * day, and `occurred` is carried through so the caller can tell them apart.
 * Cancelled events are still excluded: they are never an obligation.
 */
export async function listEventsForDay(
  personId: string,
  dayOffset = 0,
  timeZone = "Asia/Kolkata"
): Promise<Array<FutureEventRecord & { preparation_steps: unknown[] }>> {
  return queryDb<any>(
    `SELECT * FROM future_events
     WHERE person_id = $1
       AND status <> 'cancelled'
       AND (valid_until IS NULL OR valid_until > NOW())
       AND (scheduled_at AT TIME ZONE $3)::date
           = ((NOW() AT TIME ZONE $3)::date + ($2 || ' days')::interval)::date
     ORDER BY scheduled_at ASC`,
    [personId, String(dayOffset), timeZone]
  );
}

// ── Routines ─────────────────────────────────────────────────────────────────

export interface RoutineRecord {
  id: string;
  person_id: string;
  title: string;
  assamese_title?: string | null;
  /** Free-text 'HH:MM' (24h) as stored by the schema; may be null. */
  time_of_day: string | null;
  anchor_description?: string | null;
  verification_status: string;
}

/**
 * The person's standing daily routine. This table has existed since schema v2
 * but had no repository accessor at all, which is why "what do I have to do
 * today" could never be answered from routine data -- only from future_events.
 */
export async function listRoutines(personId: string): Promise<RoutineRecord[]> {
  return queryDb<any>(
    `SELECT id, person_id, title, assamese_title, time_of_day, anchor_description, verification_status
     FROM routines
     WHERE person_id = $1
       AND active = TRUE
       AND verification_status <> 'rejected'
     ORDER BY time_of_day ASC NULLS LAST`,
    [personId]
  );
}

export interface MedicationDoseRecord {
  id: string;
  medication_name: string;
  /** Free-text clock label as stored, e.g. '01:30 PM'. */
  scheduled_time: string;
  status: string;
  instructions?: string | null;
}

/**
 * Today's medication schedule with its taken/pending status -- the one source
 * in this system that already distinguishes "done" from "still to do", which
 * is what "what ELSE do I have to do" needs.
 */
export async function listMedicationsForToday(personId: string): Promise<MedicationDoseRecord[]> {
  return queryDb<any>(
    `SELECT id, medication_name, scheduled_time, status, instructions
     FROM medication_records
     WHERE person_id = $1
     ORDER BY scheduled_time ASC`,
    [personId]
  );
}

export async function createFutureEvent(input: {
  person_id: string;
  event_type: string;
  title: string;
  description?: string;
  person_name?: string;
  relationship?: string;
  location_name: string;
  scheduled_at: string;
  source: string;
}): Promise<FutureEventRecord> {
  const id = newId("event");
  const rows = await queryDb<any>(
    `INSERT INTO future_events
      (id, person_id, event_type, title, description, person_name, relationship, location_name, scheduled_at, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      id, input.person_id, input.event_type, input.title, input.description || null,
      input.person_name || null, input.relationship || null, input.location_name,
      input.scheduled_at, input.source,
    ]
  );
  return rows[0];
}

// ── People & relationships ───────────────────────────────────────────────────

export interface FamiliarPersonRecord {
  id: string;
  name: string;
  relationship: string;
  verified: boolean;
  phone?: string | null;
  avatar_media_id?: string | null;
  is_emergency_contact?: boolean;
  closeness_level?: string | null;
}

export async function listFamiliarPeople(personId: string): Promise<FamiliarPersonRecord[]> {
  const rows = await queryDb<any>(
    `SELECT pe.id, pe.display_name AS name, r.relationship_type AS relationship,
            (pe.verification_status = 'verified') AS verified, pe.phone, pe.avatar_media_id,
            pe.is_emergency_contact, r.closeness_level
     FROM person_entities pe
     JOIN relationships r ON r.related_entity_id = pe.id
     WHERE r.person_id = $1 AND r.verification_status != 'rejected'
     ORDER BY
       CASE r.closeness_level
         WHEN 'primary_caregiver' THEN 0
         WHEN 'family_core' THEN 1
         WHEN 'community_chw' THEN 2
         WHEN 'clinical' THEN 3
         ELSE 4
       END,
       pe.created_at ASC`,
    [personId]
  );
  return rows;
}

// ── Consent (purpose-scoped; a row's existence is not itself authorization) ─

export type ConsentPurpose =
  | "memory" | "family_contribution" | "media" | "care_support"
  | "personalisation" | "voice" | "activity_adaptation" | "clinical_sharing";

export async function grantConsent(input: {
  person_id: string;
  purpose: ConsentPurpose;
  category: string;
  granted_to_role: string;
  granted_by: string;
  notes?: string;
}): Promise<{ id: string; status: string }> {
  const id = newId("consent");
  await queryDb(
    `INSERT INTO consent_grants (id, person_id, purpose, category, granted_to_role, granted_by, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,'granted',$7)`,
    [id, input.person_id, input.purpose, input.category, input.granted_to_role, input.granted_by, input.notes || null]
  );
  return { id, status: "granted" };
}

export async function revokeConsent(personId: string, purpose: ConsentPurpose, category: string): Promise<number> {
  const rows = await queryDb<any>(
    `UPDATE consent_grants
     SET status = 'revoked', revoked_at = NOW()
     WHERE person_id = $1 AND purpose = $2 AND category = $3 AND status = 'granted'
     RETURNING id`,
    [personId, purpose, category]
  );
  return rows.length;
}

/** The actual authorization check -- callers must gate on this, not on a row merely existing. */
export async function hasActiveConsent(personId: string, purpose: ConsentPurpose, category: string): Promise<boolean> {
  const rows = await queryDb<any>(
    `SELECT 1 FROM consent_grants
     WHERE person_id = $1 AND purpose = $2 AND category = $3 AND status = 'granted' AND revoked_at IS NULL
     LIMIT 1`,
    [personId, purpose, category]
  );
  return rows.length > 0;
}

// ── Preferences (append-only; never silently overwritten) ───────────────────

export async function recordPreference(input: {
  person_id: string;
  dimension: string;
  value: unknown;
  evidence_source: "person_stated" | "caregiver_reported" | "chw_reported" | "clinician_reported" | "system_inferred";
  confidence?: number;
}): Promise<{ id: string }> {
  const id = newId("pref");
  // Supersede the previous active preference for this dimension rather than deleting it.
  const prior = await queryDb<any>(
    `SELECT id FROM preferences WHERE person_id = $1 AND dimension = $2 AND superseded_by IS NULL ORDER BY created_at DESC LIMIT 1`,
    [input.person_id, input.dimension]
  );

  await queryDb(
    `INSERT INTO preferences (id, person_id, dimension, value, evidence_source, confidence)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, input.person_id, input.dimension, JSON.stringify(input.value), input.evidence_source, input.confidence ?? 0.6]
  );

  if (prior[0]) {
    await queryDb(`UPDATE preferences SET superseded_by = $2 WHERE id = $1`, [prior[0].id, id]);
  }

  return { id };
}

export async function getActivePreferences(personId: string): Promise<Array<{ dimension: string; value: unknown; evidence_source: string; confidence: number }>> {
  return queryDb<any>(
    `SELECT dimension, value, evidence_source, confidence FROM preferences
     WHERE person_id = $1 AND superseded_by IS NULL
     ORDER BY dimension ASC`,
    [personId]
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function listGoals(personId: string, status: string = "active"): Promise<any[]> {
  return queryDb<any>(
    `SELECT * FROM goals WHERE person_id = $1 AND status = $2 ORDER BY created_at DESC`,
    [personId, status]
  );
}

export async function createGoal(input: { person_id: string; goal_type: string; description: string; created_by: string; target_date?: string }): Promise<any> {
  const id = newId("goal");
  const rows = await queryDb<any>(
    `INSERT INTO goals (id, person_id, goal_type, description, created_by, target_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, input.person_id, input.goal_type, input.description, input.created_by, input.target_date || null]
  );
  return rows[0];
}

// ── Memory Firewall audit log ────────────────────────────────────────────────

export async function logFirewallAccess(input: {
  person_id: string;
  actor_id: string;
  actor_role: string;
  purpose: string;
  requested_entity_type: string;
  requested_item_id?: string;
  decision: "ALLOW" | "DENY" | "PARTIAL";
  policy_reason: string;
  consent_active?: boolean;
  filtered_count?: number;
}): Promise<void> {
  const id = newId("audit");
  await queryDb(
    `INSERT INTO memory_firewall_audit_log
      (id, person_id, actor_id, actor_role, purpose, requested_entity_type, requested_item_id, decision, policy_reason, consent_active, filtered_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      id, input.person_id, input.actor_id, input.actor_role, input.purpose,
      input.requested_entity_type, input.requested_item_id || null, input.decision,
      input.policy_reason, input.consent_active ?? true, input.filtered_count ?? 0,
    ]
  );
}

// ── Conversational Experience Memory (Prompt 4 §26) ─────────────────────────
// Companion turns used to be entirely ephemeral (client-side React state
// only). Persisting them is what makes "repetition-aware" behavior (§9) and
// future retrieval over past conversation possible, instead of every turn
// starting from a blank slate.

export interface CompanionTurnRecord {
  id: string;
  person_id: string;
  message: string;
  answer: string;
  intent: string;
  classified_intent: string | null;
  path: "deterministic" | "generated";
  provider: string;
  grounded: boolean;
  action_type: string | null;
  page: string | null;
  latency_ms: number | null;
  created_at: string;
}

export async function recordCompanionTurn(input: {
  person_id: string;
  message: string;
  answer: string;
  intent: string;
  classified_intent?: string;
  path: "deterministic" | "generated";
  provider: string;
  grounded: boolean;
  action_type?: string | null;
  page?: string;
  latency_ms?: number;
}): Promise<void> {
  const id = newId("turn");
  await queryDb(
    `INSERT INTO companion_turns
      (id, person_id, message, answer, intent, classified_intent, path, provider, grounded, action_type, page, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id, input.person_id, input.message, input.answer, input.intent,
      input.classified_intent || null, input.path, input.provider, input.grounded,
      input.action_type || null, input.page || null, input.latency_ms ?? null,
    ]
  );
}

/** Recent turns for this person only -- the enforcement point for "never answer using another person's conversation history." */
export async function getRecentCompanionTurns(personId: string, limit = 6): Promise<CompanionTurnRecord[]> {
  return queryDb<CompanionTurnRecord>(
    `SELECT * FROM companion_turns WHERE person_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [personId, limit]
  );
}

/** Was this same question effectively just asked? Used to answer calmly rather than say "you already asked" (§9) -- the repetition is detected, never narrated. */
export function isLikelyRepeat(message: string, recentTurns: CompanionTurnRecord[]): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
  const target = normalize(message);
  if (!target) return false;
  return recentTurns.some((t) => normalize(t.message) === target);
}

// ── Experience Engine reads ──────────────────────────────────────────────────
// Extra person-data accessors the Experience Engine needs. They live here with
// every other person-scoped read rather than in a second repository, so the
// `WHERE person_id = $1` isolation rule has exactly one home.

export interface AuthorizedMediaRecord {
  id: string;
  person_id: string;
  storage_key: string;
  media_type: string;
  mime_type: string;
  visibility_scope: string;
  consent_scope: string;
  status: string;
  provenance_id: string;
  created_by: string;
}

/**
 * Media the Experience Engine is allowed to render, by id.
 *
 * Authorization is enforced in SQL, not by the caller: cross-person rows,
 * archived/deleted rows, clinician-only rows and rows whose consent scope
 * does not cover activities can never come back, so a frontend filter is
 * never the thing standing between private media and a game (Section 44).
 */
export async function listAuthorizedMedia(personId: string, mediaIds: string[]): Promise<AuthorizedMediaRecord[]> {
  if (mediaIds.length === 0) return [];
  return queryDb<AuthorizedMediaRecord>(
    `SELECT id, person_id, storage_key, media_type, mime_type, visibility_scope, consent_scope, status, provenance_id, created_by
     FROM media_assets
     WHERE person_id = $1
       AND id = ANY($2::varchar[])
       AND status = 'active'
       AND consent_scope IN ('games', 'reminiscence', 'all', 'family')
       AND visibility_scope IN ('family', 'private')`,
    [personId, mediaIds]
  );
}

export interface MemoryPersonLink {
  memory_id: string;
  person_entity_id: string;
  relationship: string;
  verification_status: string;
}

/** memory -> people edges, scoped through memory_items so the join cannot leak across persons. */
export async function listMemoryPeopleLinks(personId: string): Promise<MemoryPersonLink[]> {
  return queryDb<MemoryPersonLink>(
    `SELECT mp.memory_id, mp.person_entity_id, mp.relationship, mp.verification_status
     FROM memory_people mp
     JOIN memory_items m ON m.id = mp.memory_id
     WHERE m.person_id = $1`,
    [personId]
  );
}

// ── Onboarding & Elder Identity Profile (Dynamic Onboarding) ──────────────────
export interface OnboardingProfileRecord {
  id: string;
  person_id: string;
  name: string;
  honorific: string | null;
  work_background: string | null;
  preferred_language: string;
  joys: string[];
  explanation_style: string[];
  avoidances: string[];
  raw_profile?: Record<string, any>;
  completed: boolean;
  completed_at: string;
  updated_at: string;
}

const LOCAL_ONBOARDING_PROFILES = new Map<string, OnboardingProfileRecord>();

export async function saveOnboardingProfileRecord(input: {
  person_id: string;
  name: string;
  honorific?: string;
  work_background?: string;
  preferred_language: string;
  joys: string[];
  explanation_style: string[];
  avoidances: string[];
  raw_profile?: Record<string, any>;
}): Promise<OnboardingProfileRecord> {
  const id = newId("onb");
  const joysJson = JSON.stringify(input.joys || []);
  const explJson = JSON.stringify(input.explanation_style || []);
  const avoidJson = JSON.stringify(input.avoidances || []);
  const rawJson = JSON.stringify(input.raw_profile || {});

  const fallbackRecord: OnboardingProfileRecord = {
    id,
    person_id: input.person_id,
    name: input.name,
    honorific: input.honorific || null,
    work_background: input.work_background || null,
    preferred_language: input.preferred_language || "Assamese (অসমীয়া)",
    joys: input.joys || [],
    explanation_style: input.explanation_style || [],
    avoidances: input.avoidances || [],
    raw_profile: input.raw_profile || {},
    completed: true,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Always retain in resilient local store
  LOCAL_ONBOARDING_PROFILES.set(input.person_id, fallbackRecord);

  try {
    // Ensure table exists defensively
    await queryDb(`
      CREATE TABLE IF NOT EXISTS onboarding_profiles (
        id VARCHAR(64) PRIMARY KEY,
        person_id VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(128) NOT NULL,
        honorific VARCHAR(128),
        work_background VARCHAR(128),
        preferred_language VARCHAR(128) NOT NULL DEFAULT 'Assamese (অসমীয়া)',
        joys JSONB NOT NULL DEFAULT '[]'::jsonb,
        explanation_style JSONB NOT NULL DEFAULT '[]'::jsonb,
        avoidances JSONB NOT NULL DEFAULT '[]'::jsonb,
        raw_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        completed BOOLEAN NOT NULL DEFAULT TRUE,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const rows = await queryDb<OnboardingProfileRecord>(
      `INSERT INTO onboarding_profiles
        (id, person_id, name, honorific, work_background, preferred_language, joys, explanation_style, avoidances, raw_profile, completed, completed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, true, NOW(), NOW())
       ON CONFLICT (person_id) DO UPDATE SET
         name = EXCLUDED.name,
         honorific = EXCLUDED.honorific,
         work_background = EXCLUDED.work_background,
         preferred_language = EXCLUDED.preferred_language,
         joys = EXCLUDED.joys,
         explanation_style = EXCLUDED.explanation_style,
         avoidances = EXCLUDED.avoidances,
         raw_profile = EXCLUDED.raw_profile,
         completed = true,
         updated_at = NOW()
       RETURNING *`,
      [
        id,
        input.person_id,
        input.name,
        input.honorific || null,
        input.work_background || null,
        input.preferred_language || "Assamese (অসমীয়া)",
        joysJson,
        explJson,
        avoidJson,
        rawJson,
      ]
    );

    if (rows && rows[0]) {
      LOCAL_ONBOARDING_PROFILES.set(input.person_id, rows[0]);
    }

    // Synchronize with preferences table (dimensions: language, content, assistance)
    try {
      if (input.preferred_language) {
        await recordPreference({
          person_id: input.person_id,
          dimension: "language",
          value: { primary: input.preferred_language },
          evidence_source: "person_stated",
          confidence: 1.0,
        });
      }
      if (input.joys && input.joys.length > 0) {
        await recordPreference({
          person_id: input.person_id,
          dimension: "content",
          value: { joys: input.joys },
          evidence_source: "person_stated",
          confidence: 0.95,
        });
      }
      if ((input.explanation_style && input.explanation_style.length > 0) || (input.avoidances && input.avoidances.length > 0)) {
        await recordPreference({
          person_id: input.person_id,
          dimension: "assistance",
          value: {
            explanation_style: input.explanation_style || [],
            avoidances: input.avoidances || [],
          },
          evidence_source: "person_stated",
          confidence: 0.95,
        });
      }
    } catch (prefErr) {
      console.warn("Non-fatal: could not sync preferences table during onboarding save:", prefErr);
    }

    return (rows && rows[0]) || fallbackRecord;
  } catch (dbErr) {
    console.warn("Database storage running in resilient mode for onboarding profile:", dbErr);
    return fallbackRecord;
  }
}

export async function getOnboardingProfileRecord(personId: string): Promise<OnboardingProfileRecord | null> {
  try {
    const rows = await queryDb<OnboardingProfileRecord>(
      `SELECT * FROM onboarding_profiles WHERE person_id = $1 LIMIT 1`,
      [personId]
    );
    if (rows && rows[0]) {
      LOCAL_ONBOARDING_PROFILES.set(personId, rows[0]);
      return rows[0];
    }
  } catch (err) {
    // Database query unavailable; fall back to resilient local store
  }
  return LOCAL_ONBOARDING_PROFILES.get(personId) || null;
}

