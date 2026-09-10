-- ==============================================================================
-- MINDMITRA PERSONAL INTELLIGENCE DATA SUBSTRATE — NEON / POSTGRESQL SCHEMA
-- SIH 2026 PS26003 (MDoNER)
--
-- Authoritative longitudinal intelligence store with pgvector semantic retrieval.
-- Backblaze B2 is used for large binary objects (photos, voice assets, media).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. IDENTITY & ACCESS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS persons (
    person_id VARCHAR(128) PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL DEFAULT 'mindmitra_ner',
    display_name VARCHAR(255) NOT NULL,
    given_name VARCHAR(128),
    family_name VARCHAR(128),
    preferred_language VARCHAR(16) NOT NULL DEFAULT 'as',
    secondary_languages TEXT[] DEFAULT ARRAY['bn', 'en', 'hi'],
    language_tier VARCHAR(32) NOT NULL DEFAULT 'tier_1',
    cultural_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actor_accounts (
    actor_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    relationship_to_person VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_grants (
    consent_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    grantee_actor_id VARCHAR(128) NOT NULL,
    grantee_role VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_by VARCHAR(128) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    CONSTRAINT check_consent_purpose CHECK (purpose IN ('personalisation', 'care_coordination', 'clinical_review', 'emergency_safety', 'research'))
);

CREATE TABLE IF NOT EXISTS visibility_policies (
    policy_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    field_name VARCHAR(128),
    allowed_roles TEXT[] NOT NULL,
    requires_explicit_consent BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. PROVENANCE & GOVERNANCE ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provenance_records (
    provenance_id VARCHAR(128) PRIMARY KEY,
    source_class VARCHAR(64) NOT NULL,
    author_actor_id VARCHAR(128) NOT NULL,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'observed',
    verified_by VARCHAR(128),
    certifier_role VARCHAR(64),
    digital_signature VARCHAR(512),
    context_hash VARCHAR(128),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_source_class CHECK (
        source_class IN (
            'system/authoritative', 'person verified', 'family confirmed',
            'caregiver reported', 'CHW reported', 'clinician/system record',
            'user utterance', 'behavioral observation', 'inferred', 'model generated'
        )
    )
);

CREATE TABLE IF NOT EXISTS audit_events (
    audit_id VARCHAR(128) PRIMARY KEY,
    actor_id VARCHAR(128) NOT NULL,
    person_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_table VARCHAR(128) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    result VARCHAR(32) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. MEDIA METADATA (BACKBLAZE B2 OBJECT STORE INTEGRATION) ─────────────────

CREATE TABLE IF NOT EXISTS media_metadata (
    media_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    b2_object_key VARCHAR(512) NOT NULL,
    b2_bucket VARCHAR(128) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    byte_size BIGINT NOT NULL,
    dimensions JSONB,
    duration_seconds NUMERIC(8,2),
    semantic_description TEXT NOT NULL,
    depicted_person_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    associated_place_id VARCHAR(128),
    associated_event_id VARCHAR(128),
    historical_date_text VARCHAR(128),
    consent_scope VARCHAR(64) NOT NULL DEFAULT 'media_assets',
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. PERSONAL WORLD ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS person_contacts (
    contact_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    call_name VARCHAR(128) NOT NULL,
    kinship VARCHAR(64) NOT NULL,
    relationship_label VARCHAR(128) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    call_priority INT NOT NULL DEFAULT 1,
    photo_media_id VARCHAR(128) REFERENCES media_metadata(media_id),
    familiarity_score NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS place_entities (
    place_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(64) NOT NULL,
    significance TEXT NOT NULL,
    emotional_valence VARCHAR(32) NOT NULL DEFAULT 'calming',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS life_event_entities (
    event_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    year_or_era VARCHAR(64) NOT NULL,
    associated_place_id VARCHAR(128) REFERENCES place_entities(place_id),
    associated_people_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    emotional_valence VARCHAR(32) NOT NULL DEFAULT 'uplifting',
    narrative_snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_facts (
    fact_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    statement TEXT NOT NULL,
    temporal_frame VARCHAR(32) NOT NULL DEFAULT 'present',
    verification_level VARCHAR(64) NOT NULL DEFAULT 'verified',
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. TEMPORAL & ROUTINES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS temporal_events (
    temporal_event_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    temporal_frame VARCHAR(32) NOT NULL DEFAULT 'present',
    event_status VARCHAR(32) NOT NULL DEFAULT 'expected',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'family_calendar',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_routines (
    routine_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    time_of_day VARCHAR(32) NOT NULL,
    scheduled_time VARCHAR(16) NOT NULL,
    importance VARCHAR(32) NOT NULL DEFAULT 'essential',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_assistance_strategy VARCHAR(128) NOT NULL DEFAULT 'visual_initiation_cue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. CONVERSATION ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversation_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    surface VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    modality VARCHAR(32) NOT NULL DEFAULT 'multimodal',
    total_turns INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conversation_turns (
    turn_id VARCHAR(128) PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL REFERENCES conversation_sessions(session_id) ON DELETE CASCADE,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    text TEXT NOT NULL,
    audio_b2_key VARCHAR(512),
    latency_ms INT NOT NULL DEFAULT 0,
    intent VARCHAR(128) NOT NULL,
    entities_referenced TEXT[] DEFAULT ARRAY[]::TEXT[],
    safety_passed BOOLEAN NOT NULL DEFAULT TRUE,
    action_triggered JSONB,
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. INTERACTION & EVENT SUBSTRATE (APPEND-ONLY) ────────────────────────────

CREATE TABLE IF NOT EXISTS interaction_events (
    event_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    session_id VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    surface VARCHAR(64) NOT NULL,
    route VARCHAR(128) NOT NULL,
    component VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128),
    activity_id VARCHAR(128),
    conversation_id VARCHAR(128),
    input_modality VARCHAR(32) NOT NULL DEFAULT 'touch',
    language VARCHAR(16) NOT NULL DEFAULT 'as',
    duration_ms INT,
    latency_ms INT,
    result VARCHAR(32) NOT NULL DEFAULT 'success',
    assistance_level VARCHAR(64) NOT NULL DEFAULT 'none',
    measurement_quality_score NUMERIC(4,3),
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_interaction_events_person_ts
    ON interaction_events (person_id, timestamp DESC);

-- ── 8. COGNITIVE EXPERIENCE & EXPERIENCE MEMORY ───────────────────────────────

CREATE TABLE IF NOT EXISTS cognitive_activities (
    activity_id VARCHAR(128) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cognitive_domain VARCHAR(64) NOT NULL,
    target_objective TEXT NOT NULL,
    modality VARCHAR(64) NOT NULL DEFAULT 'photo+voice',
    supported_difficulties TEXT[] NOT NULL DEFAULT ARRAY['recognition', 'cued_recall'],
    cultural_adaptation JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experience_episodes (
    episode_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    activity_id VARCHAR(128) NOT NULL REFERENCES cognitive_activities(activity_id),
    activity_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context JSONB NOT NULL,
    cognitive_objective VARCHAR(255) NOT NULL,
    content_bound TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    difficulty VARCHAR(64) NOT NULL,
    modality VARCHAR(64) NOT NULL,
    content_familiarity VARCHAR(64) NOT NULL,
    assistance_used JSONB NOT NULL,
    response JSONB NOT NULL,
    engagement JSONB NOT NULL,
    measurement_quality JSONB NOT NULL,
    human_feedback JSONB,
    learned_implication JSONB NOT NULL,
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id)
);

CREATE INDEX IF NOT EXISTS idx_experience_episodes_person_ts
    ON experience_episodes (person_id, timestamp DESC);

-- ── 9. PERSONAL INTELLIGENCE: CAPABILITY, POLICIES & GOALS ────────────────────

CREATE TABLE IF NOT EXISTS capability_observations (
    observation_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    domain VARCHAR(64) NOT NULL,
    observed_value NUMERIC(6,2) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL,
    condition_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    source_episode_id VARCHAR(128) REFERENCES experience_episodes(episode_id),
    measurement_quality_gate VARCHAR(32) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id)
);

CREATE TABLE IF NOT EXISTS personal_capability_states (
    state_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    domain VARCHAR(64) NOT NULL,
    conditioned_estimate TEXT NOT NULL,
    numeric_estimate NUMERIC(6,2),
    uncertainty NUMERIC(4,3) NOT NULL DEFAULT 0.25,
    condition_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    trend VARCHAR(32) NOT NULL DEFAULT 'stable',
    evidence_count INT NOT NULL DEFAULT 1,
    last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_person_domain UNIQUE (person_id, domain)
);

CREATE TABLE IF NOT EXISTS assistance_policies (
    policy_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    task_domain VARCHAR(128) NOT NULL,
    preferred_strategy VARCHAR(128) NOT NULL,
    fallback_strategy VARCHAR(128) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.75,
    evidence_count INT NOT NULL DEFAULT 1,
    success_rate NUMERIC(4,3) NOT NULL DEFAULT 0.80,
    last_reinforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    condition_constraints TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_clinician_locked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_person_task UNIQUE (person_id, task_domain)
);

CREATE TABLE IF NOT EXISTS personal_goals (
    goal_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    language VARCHAR(16) NOT NULL DEFAULT 'as',
    scope VARCHAR(64) NOT NULL DEFAULT 'standing_goal',
    source VARCHAR(64) NOT NULL DEFAULT 'person_stated',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    required_capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    safety_class VARCHAR(64) NOT NULL DEFAULT 'everyday',
    target_routine_id VARCHAR(128) REFERENCES daily_routines(routine_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. GOVERNED MEMORY (LIFECYCLE, EVIDENCE & REINFORCEMENTS) ────────────────

CREATE TABLE IF NOT EXISTS memories (
    memory_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    temporal_frame VARCHAR(32) NOT NULL DEFAULT 'present',
    authority_class VARCHAR(64) NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'candidate',
    evidence_level VARCHAR(32) NOT NULL DEFAULT 'inferred',
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.75,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    superseded_by VARCHAR(128),
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id),
    reinforcement_count INT NOT NULL DEFAULT 1,
    last_reinforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_model_generated_not_silently_authoritative CHECK (
        NOT (
            authority_class = 'system/authoritative'
            AND evidence_level = 'verified'
            AND lifecycle_state = 'active'
            AND provenance_id IN (
                SELECT provenance_id FROM provenance_records WHERE source_class = 'model generated' AND verified_by IS NULL
            )
        )
    )
);

CREATE TABLE IF NOT EXISTS memory_evidence_links (
    link_id VARCHAR(128) PRIMARY KEY,
    memory_id VARCHAR(128) NOT NULL REFERENCES memories(memory_id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL,
    evidence_id VARCHAR(128) NOT NULL,
    source_authority VARCHAR(64) NOT NULL,
    confidence_contribution NUMERIC(4,3) NOT NULL DEFAULT 0.5,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. KNOWLEDGE & ONTOLOGY (NODES, EDGES & PGVECTOR EMBEDDINGS) ──────────────

CREATE TABLE IF NOT EXISTS ontology_nodes (
    node_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    node_type VARCHAR(64) NOT NULL,
    label VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding_vector vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ontology_edges (
    edge_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    relationship VARCHAR(128) NOT NULL,
    source_node_id VARCHAR(128) NOT NULL REFERENCES ontology_nodes(node_id) ON DELETE CASCADE,
    target_node_id VARCHAR(128) NOT NULL REFERENCES ontology_nodes(node_id) ON DELETE CASCADE,
    temporal_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_level VARCHAR(32) NOT NULL DEFAULT 'verified',
    confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
    provenance_id VARCHAR(128) NOT NULL REFERENCES provenance_records(provenance_id)
);

CREATE INDEX IF NOT EXISTS idx_ontology_edges_source_target
    ON ontology_edges (source_node_id, target_node_id);

CREATE TABLE IF NOT EXISTS semantic_chunks (
    chunk_id VARCHAR(128) PRIMARY KEY,
    person_id VARCHAR(128) NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    source_type VARCHAR(64) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
