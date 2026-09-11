-- ============================================================================
-- MindMitra: Dynamic Onboarding & Elder Identity Profile -- Schema Addendum v5
-- Additive only.
--
-- Persists all dynamic information captured during the Brahmaputra Onboarding flow:
-- Name, honorific, life background/vocation, preferred tongue, joy anchors,
-- explanation preferences, sensitivities/avoidances, and dynamic metadata.
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_person ON onboarding_profiles(person_id);
