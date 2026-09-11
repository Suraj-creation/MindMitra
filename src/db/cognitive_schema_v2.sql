-- ============================================================================
-- MindMitra: Personal World Model -- Schema Addendum v2
-- Additive only. Fills gaps identified against cognitive_schema.sql:
-- places, routes, routines, purpose-scoped consent, preference provenance, goals.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 19. FAMILIAR PLACES
-- First-class places in the person's world (home, market, school, temple...).
-- Mirrors memory_items' provenance/consent/verification conventions.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS familiar_places (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    assamese_name VARCHAR(255),
    category VARCHAR(32) NOT NULL DEFAULT 'other' CHECK (category IN ('home', 'market', 'school', 'temple', 'hospital', 'workplace', 'river', 'park', 'other')),
    significance TEXT,
    description TEXT,
    landmark_cues JSONB NOT NULL DEFAULT '[]'::jsonb,
    sensory_cues JSONB NOT NULL DEFAULT '{}'::jsonb,
    approximate_period VARCHAR(128),
    coordinates JSONB,
    source VARCHAR(32) NOT NULL DEFAULT 'caregiver' CHECK (source IN ('person', 'caregiver', 'chw', 'clinician', 'system')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.70 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    consent_scope VARCHAR(32) NOT NULL DEFAULT 'all' CHECK (consent_scope IN ('person_only', 'family', 'games', 'reminiscence', 'all')),
    visibility_scope VARCHAR(32) NOT NULL DEFAULT 'family' CHECK (visibility_scope IN ('private', 'family', 'clinical')),
    sensitivity VARCHAR(32) NOT NULL DEFAULT 'low' CHECK (sensitivity IN ('low', 'medium', 'high')),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_familiar_places_person ON familiar_places(person_id);
CREATE INDEX IF NOT EXISTS idx_familiar_places_verification ON familiar_places(verification_status);

CREATE TABLE IF NOT EXISTS place_media (
    place_id VARCHAR(64) NOT NULL REFERENCES familiar_places(id) ON DELETE CASCADE,
    media_asset_id VARCHAR(64) NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'primary_photo',
    sequence_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (place_id, media_asset_id)
);

-- ----------------------------------------------------------------------------
-- 20. FAMILIAR ROUTES (Game 8: Route Builder / Spatial Orientation, non-GPS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS familiar_routes (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    assamese_name VARCHAR(255),
    origin_place_id VARCHAR(64) REFERENCES familiar_places(id),
    destination_place_id VARCHAR(64) REFERENCES familiar_places(id),
    frequency VARCHAR(32) CHECK (frequency IN ('daily', 'weekly', 'occasional', 'historical')),
    source VARCHAR(32) NOT NULL DEFAULT 'caregiver' CHECK (source IN ('person', 'caregiver', 'chw', 'clinician', 'system')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.70 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_familiar_routes_person ON familiar_routes(person_id);

CREATE TABLE IF NOT EXISTS route_segments (
    id VARCHAR(64) PRIMARY KEY,
    route_id VARCHAR(64) NOT NULL REFERENCES familiar_routes(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    landmark_cue TEXT NOT NULL,
    sensory_cue TEXT,
    media_asset_id VARCHAR(64) REFERENCES media_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_route_segments_route ON route_segments(route_id, sequence_order);

-- ----------------------------------------------------------------------------
-- 21. ROUTINES
-- First-class recurring routines (temporal_events.routine_anchor_id points here).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routines (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    assamese_title VARCHAR(255),
    time_of_day VARCHAR(16), -- e.g. '07:30', free text HH:MM
    anchor_description TEXT,
    people_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    media_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    source VARCHAR(32) NOT NULL DEFAULT 'caregiver' CHECK (source IN ('person', 'caregiver', 'chw', 'clinician', 'system')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_person ON routines(person_id);

-- Retroactively constrain temporal_events.routine_anchor_id now that routines exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_temporal_events_routine_anchor'
    ) THEN
        ALTER TABLE temporal_events
            ADD CONSTRAINT fk_temporal_events_routine_anchor
            FOREIGN KEY (routine_anchor_id) REFERENCES routines(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 22. CONSENT GRANTS (Purpose-Scoped Consent)
-- Replaces the single global consent boolean. A row's presence is not itself
-- authorization -- callers must check (purpose, category, status='granted',
-- revoked_at IS NULL) before surfacing anything gated by it.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_grants (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    purpose VARCHAR(64) NOT NULL CHECK (purpose IN (
        'memory', 'family_contribution', 'media', 'care_support',
        'personalisation', 'voice', 'activity_adaptation', 'clinical_sharing'
    )),
    category VARCHAR(64) NOT NULL, -- e.g. 'life_story_memory', 'media_assets', 'routines'
    granted_to_role VARCHAR(32) NOT NULL CHECK (granted_to_role IN ('primary_caregiver', 'family', 'chw', 'clinician', 'system')),
    granted_by VARCHAR(128) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_grants_person_purpose ON consent_grants(person_id, purpose, status);

-- ----------------------------------------------------------------------------
-- 23. PREFERENCES (Explicit vs Inferred, Append-Only)
-- A row is never overwritten in place -- a new observation supersedes the old
-- one via superseded_by, so the evidence trail for "why do we believe this
-- preference" is never lost. Never promote 'system_inferred' to
-- 'person_stated' automatically.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    dimension VARCHAR(32) NOT NULL CHECK (dimension IN (
        'content', 'difficulty', 'modality', 'language', 'timing',
        'familiarity', 'novelty', 'context', 'assistance', 'social_context'
    )),
    value JSONB NOT NULL,
    evidence_source VARCHAR(32) NOT NULL CHECK (evidence_source IN ('person_stated', 'caregiver_reported', 'chw_reported', 'clinician_reported', 'system_inferred')),
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.60 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    superseded_by VARCHAR(64) REFERENCES preferences(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preferences_person_dimension ON preferences(person_id, dimension);
CREATE INDEX IF NOT EXISTS idx_preferences_active ON preferences(person_id, dimension) WHERE superseded_by IS NULL;

-- ----------------------------------------------------------------------------
-- 24. GOALS / INTENTIONS
-- Meaningful daily-life goals, never reduced to cognitive-training targets.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    goal_type VARCHAR(64) NOT NULL CHECK (goal_type IN (
        'prepare_for_visitor', 'connect_with_family', 'remember_routine',
        'prepare_for_outing', 'listen_to_music', 'complete_daily_task',
        'engage_in_familiar_activity', 'other'
    )),
    description TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_by VARCHAR(64) NOT NULL,
    target_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_person_status ON goals(person_id, status);
