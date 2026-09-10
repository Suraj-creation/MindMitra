-- ==============================================================================
-- MIGRATION 0006: Personal Intelligence Data Substrate
-- SIH 2026 PS26003 (MDoNER) — MindMitra
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Provenance & Governance
CREATE TABLE IF NOT EXISTS provenance_records (
    provenance_id VARCHAR(128) PRIMARY KEY,
    source_class VARCHAR(64) NOT NULL,
    author_actor_id VARCHAR(128) NOT NULL,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'observed',
    verified_by VARCHAR(128),
    certifier_role VARCHAR(64),
    digital_signature VARCHAR(512),
    context_hash VARCHAR(128),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Metadata (Backblaze B2 Integration)
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

-- Personal World
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

-- Temporal & Routines
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

-- Conversation Substrate
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

-- Append-Only Interaction Event Substrate
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

-- Experience Memory
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

-- Conditioned Personal Capability Model (PCM)
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

-- Learned Assistance Policies
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

-- Governed Memory Substrate
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Semantic Ontology Graph (Nodes & Typed Edges)
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
