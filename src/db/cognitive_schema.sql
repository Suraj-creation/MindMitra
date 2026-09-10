-- ============================================================================
-- MindMitra: Personal Cognitive Experience Space — Database Schema
-- Database Target: Neon PostgreSQL with pgvector extension & Backblaze B2
-- Architecture: Relational, Graph, Temporal, Vector, Event & Experience Projections
-- SIH 2026 / PS26003 (MDoNER) - Elder Sanctuary & Cognitive Companion
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 1. MEDIA ASSETS (Photos, Images, Audio, Documents with Backblaze B2 storage)
-- Media references with explicit provenance, visibility scopes, and consent controls.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    storage_backend VARCHAR(32) NOT NULL DEFAULT 'b2' CHECK (storage_backend IN ('b2', 's3', 'local')),
    b2_bucket VARCHAR(128) DEFAULT 'mindmitra-elder-media',
    b2_file_id VARCHAR(256),
    storage_key VARCHAR(512) NOT NULL,
    media_type VARCHAR(32) NOT NULL CHECK (media_type IN ('photo', 'audio', 'video', 'document')),
    mime_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT,
    width INT,
    height INT,
    duration_seconds NUMERIC(6, 2),
    thumbnail_key VARCHAR(512),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visibility_scope VARCHAR(32) NOT NULL DEFAULT 'family' CHECK (visibility_scope IN ('private', 'family', 'clinical')),
    consent_scope VARCHAR(32) NOT NULL DEFAULT 'all' CHECK (consent_scope IN ('person_only', 'family', 'games', 'reminiscence', 'all')),
    provenance_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_media_assets_person ON media_assets(person_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);

-- ----------------------------------------------------------------------------
-- 2. PERSON ENTITIES (People in Person's World)
-- First-class entities representing family, caregivers, healthcare workers, friends.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS person_entities (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    assamese_name VARCHAR(128),
    display_name VARCHAR(128) NOT NULL,
    relationship_to_person VARCHAR(64) NOT NULL,
    avatar_media_id VARCHAR(64) REFERENCES media_assets(id),
    phone VARCHAR(32),
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    can_verify_memories BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_person_entities_person ON person_entities(person_id);

-- ----------------------------------------------------------------------------
-- 3. RELATIONSHIPS (Relationship Graph Edges)
-- Explicit typed relationships with closeness, provenance, and verification.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationships (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    related_entity_id VARCHAR(64) NOT NULL REFERENCES person_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(64) NOT NULL, -- e.g. daughter, granddaughter, late_husband, asha_worker
    closeness_level VARCHAR(32) NOT NULL DEFAULT 'family_core' CHECK (closeness_level IN ('primary_caregiver', 'family_core', 'extended', 'community_chw', 'clinical')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    verified_by VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships(person_id);

-- ----------------------------------------------------------------------------
-- 4. LIFE EVENTS (Autobiographical Milestones & Eras)
-- First-class life events (career, wedding, teaching, moving) anchoring reminiscence.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS life_events (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    assamese_title VARCHAR(255),
    description TEXT NOT NULL,
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('milestone', 'career', 'family', 'education', 'cultural', 'residence')),
    era_period VARCHAR(128) NOT NULL,
    approximate_year INT,
    cultural_significance TEXT,
    primary_media_id VARCHAR(64) REFERENCES media_assets(id),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    verified_by VARCHAR(128),
    sensitivity VARCHAR(32) NOT NULL DEFAULT 'low' CHECK (sensitivity IN ('low', 'medium', 'high')),
    game_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_events_person ON life_events(person_id);

-- ----------------------------------------------------------------------------
-- 5. MEMORY ITEMS (Personal, Caregiver, Clinician, System)
-- First-class memory entity. Stored permanently with strict provenance distinction
-- between person claims (unverified) and verified facts.
-- Supports pgvector embeddings for hybrid semantic retrieval.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_items (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    memory_type VARCHAR(32) NOT NULL CHECK (memory_type IN ('autobiographical', 'relationship', 'place', 'event', 'skill', 'routine', 'cultural')),
    title VARCHAR(255) NOT NULL,
    assamese_title VARCHAR(255),
    description TEXT NOT NULL,
    temporal_frame VARCHAR(32) NOT NULL CHECK (temporal_frame IN ('past', 'childhood', 'young_adulthood', 'later_life', 'recent', 'present', 'future')),
    approximate_period VARCHAR(128) NOT NULL,
    source VARCHAR(32) NOT NULL CHECK (source IN ('person', 'caregiver', 'chw', 'clinician', 'system')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    verified_by VARCHAR(128),
    verified_at TIMESTAMPTZ,
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.70 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    sensitivity VARCHAR(32) NOT NULL DEFAULT 'low' CHECK (sensitivity IN ('low', 'medium', 'high')),
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    game_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    visibility_scope VARCHAR(32) NOT NULL DEFAULT 'family' CHECK (visibility_scope IN ('private', 'family', 'clinical')),
    consent_scope VARCHAR(32) NOT NULL DEFAULT 'all' CHECK (consent_scope IN ('person_only', 'family', 'games', 'reminiscence', 'all')),
    cultural_context VARCHAR(255) NOT NULL,
    life_event_id VARCHAR(64) REFERENCES life_events(id),
    embedding vector(1536), -- Semantic embedding for hybrid RAG
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_items_person ON memory_items(person_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_verification ON memory_items(verification_status);
CREATE INDEX IF NOT EXISTS idx_memory_items_source ON memory_items(source);
CREATE INDEX IF NOT EXISTS idx_memory_items_game_eligible ON memory_items(game_eligible);
CREATE INDEX IF NOT EXISTS idx_memory_items_temporal ON memory_items(temporal_frame);

-- ----------------------------------------------------------------------------
-- 6. MEMORY MEDIA (M:N Join)
-- Relates memories to physical or digital media assets with specific roles and ordering.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_media (
    memory_id VARCHAR(64) NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
    media_asset_id VARCHAR(64) NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'primary_photo' CHECK (role IN ('primary_photo', 'supporting_photo', 'background_music', 'document')),
    sequence_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (memory_id, media_asset_id)
);

-- ----------------------------------------------------------------------------
-- 7. MEMORY PEOPLE (Graph Edge)
-- Connects personal memories to family, friends, or community members with verification status.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_people (
    memory_id VARCHAR(64) NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
    person_entity_id VARCHAR(64) NOT NULL REFERENCES person_entities(id) ON DELETE CASCADE,
    relationship VARCHAR(64) NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    PRIMARY KEY (memory_id, person_entity_id)
);

-- ----------------------------------------------------------------------------
-- 8. MEMORY VOICE NOTES
-- Preserves spoken stories and family voice notes associated with memories.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_voice_notes (
    id VARCHAR(64) PRIMARY KEY,
    memory_id VARCHAR(64) NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
    speaker_entity_id VARCHAR(64),
    speaker_name VARCHAR(128) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    media_asset_id VARCHAR(64) REFERENCES media_assets(id),
    b2_audio_key VARCHAR(512),
    audio_url VARCHAR(512),
    transcript TEXT NOT NULL,
    language VARCHAR(16) NOT NULL DEFAULT 'as',
    consent_scope VARCHAR(32) NOT NULL DEFAULT 'all' CHECK (consent_scope IN ('person_only', 'family', 'games', 'reminiscence', 'all')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. FUTURE EVENTS (Prospective Orientation & Daily Anchors)
-- Supports state transitions: expected -> confirmed -> occurred | cancelled.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS future_events (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('family_visit', 'routine_tea', 'festival', 'medical_appointment', 'community_walk')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    person_entity_id VARCHAR(64) REFERENCES person_entities(id),
    person_name VARCHAR(128),
    relationship VARCHAR(64),
    location_entity_id VARCHAR(64),
    location_name VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('expected', 'confirmed', 'occurred', 'cancelled')),
    source VARCHAR(32) NOT NULL DEFAULT 'caregiver' CHECK (source IN ('person', 'caregiver', 'chw', 'clinician', 'system')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    valid_until TIMESTAMPTZ,
    preparation_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_future_events_schedule ON future_events(person_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_future_events_status ON future_events(status);

-- ----------------------------------------------------------------------------
-- 10. GAME TEMPLATES
-- Deterministic game engines with strict schemas and safety constraints.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_templates (
    id VARCHAR(64) PRIMARY KEY,
    template_key VARCHAR(64) UNIQUE NOT NULL,
    version VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    cognitive_family VARCHAR(64) NOT NULL CHECK (cognitive_family IN ('autobiographical_sequencing', 'prospective_orientation', 'semantic_association', 'executive_planning')),
    supported_modalities JSONB NOT NULL DEFAULT '["photo_plus_voice"]'::jsonb,
    supported_difficulty_range JSONB NOT NULL DEFAULT '[1, 3]'::jsonb,
    offline_capable BOOLEAN NOT NULL DEFAULT TRUE,
    schema JSONB NOT NULL,
    safety_constraints JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. GAME SPECS
-- Generated experience specifications with 5-layer validation contract.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_specs (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    template_id VARCHAR(64) NOT NULL REFERENCES game_templates(id),
    version VARCHAR(32) NOT NULL,
    generation_mode VARCHAR(32) NOT NULL CHECK (generation_mode IN ('static_level_a', 'parametrically_personalised_level_b', 'dynamically_composed_level_c')),
    objective TEXT NOT NULL,
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
    modality VARCHAR(32) NOT NULL,
    culture VARCHAR(64) NOT NULL,
    temporal_frame VARCHAR(32) NOT NULL,
    content_bindings JSONB NOT NULL,
    scaffolding JSONB NOT NULL,
    instructions JSONB NOT NULL,
    provenance_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_status JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_specs_person ON game_specs(person_id);

-- ----------------------------------------------------------------------------
-- 12. GAME SESSIONS
-- Active or completed interaction sessions grounded in a game spec.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    game_spec_id VARCHAR(64) NOT NULL REFERENCES game_specs(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'fatigue_halted')),
    device_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    language VARCHAR(16) NOT NULL DEFAULT 'as',
    fatigue_context JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 13. GAME TRIALS (Step-Level Telemetry)
-- Records step-level interactions, latency, assistance level, and measurement quality.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_trials (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    step_index INT NOT NULL,
    stimulus TEXT NOT NULL,
    response TEXT NOT NULL,
    response_type VARCHAR(32) NOT NULL DEFAULT 'choice',
    latency_bucket VARCHAR(32) NOT NULL, -- '<2s', '2-5s', '>5s'
    latency_ms INT NOT NULL,
    assistance_level VARCHAR(32) NOT NULL CHECK (assistance_level IN ('none', 'visual_cue', 'family_voice', 'caregiver_prompt')),
    hint_used BOOLEAN NOT NULL DEFAULT FALSE,
    completion_state VARCHAR(32) NOT NULL CHECK (completion_state IN ('success', 'assisted', 'skipped')),
    measurement_quality NUMERIC(3, 2) NOT NULL CHECK (measurement_quality BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_trials_session ON game_trials(session_id);

-- ----------------------------------------------------------------------------
-- 14. EXPERIENCE EPISODES (Experience Memory & Personal Capability Model Updates)
-- Synthesizes trial patterns into long-term learned implications and capability updates.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experience_episodes (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    person_id VARCHAR(64) NOT NULL,
    objective TEXT NOT NULL,
    context JSONB NOT NULL,
    engagement_score NUMERIC(3, 2) NOT NULL CHECK (engagement_score BETWEEN 0.0 AND 1.0),
    assistance_used NUMERIC(3, 2) NOT NULL CHECK (assistance_used BETWEEN 0.0 AND 1.0),
    measurement_quality NUMERIC(3, 2) NOT NULL CHECK (measurement_quality BETWEEN 0.0 AND 1.0),
    observed_response TEXT NOT NULL,
    learned_implication TEXT NOT NULL,
    pcm_update JSONB NOT NULL,
    provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_episodes_person ON experience_episodes(person_id);

-- ----------------------------------------------------------------------------
-- 15. GAME GENERATION RUNS (Clinical & Architectural Audit Trail)
-- Comprehensive audit record for every game orchestration request.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_generation_runs (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    template_candidates JSONB NOT NULL,
    selected_template VARCHAR(64) NOT NULL,
    generation_mode VARCHAR(32) NOT NULL,
    context_refs JSONB NOT NULL,
    retrieval_refs JSONB NOT NULL,
    model VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    spec_version VARCHAR(32) NOT NULL,
    validation_results JSONB NOT NULL,
    fallback_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_runs_person ON game_generation_runs(person_id);

-- ----------------------------------------------------------------------------
-- 16. MEMORY FIREWALL AUDIT LOG
-- Logs every access attempt by agents or external callers with deterministic verdict.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_firewall_audit_log (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    person_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    requested_entity_type VARCHAR(32) NOT NULL,
    requested_item_id VARCHAR(64),
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('ALLOW', 'DENY', 'PARTIAL')),
    policy_reason TEXT NOT NULL,
    consent_active BOOLEAN NOT NULL DEFAULT TRUE,
    filtered_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_firewall_audit_person ON memory_firewall_audit_log(person_id);
CREATE INDEX IF NOT EXISTS idx_firewall_audit_time ON memory_firewall_audit_log(timestamp);

