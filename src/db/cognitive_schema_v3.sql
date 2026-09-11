-- ============================================================================
-- MindMitra: Conversational Experience Memory -- Schema Addendum v3 (Prompt 4)
-- Additive only. Companion turns were entirely ephemeral before this: the
-- "Experience Memory" spec (Prompt 2 §8, Prompt 4 §26) had a table for game
-- trials/episodes but nothing for ordinary conversation, so nothing about a
-- conversation could ever inform future retrieval or repetition-aware
-- behaviour.
-- ============================================================================

CREATE TABLE IF NOT EXISTS companion_turns (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    answer TEXT NOT NULL,
    intent VARCHAR(64) NOT NULL,
    classified_intent VARCHAR(32),
    path VARCHAR(16) NOT NULL CHECK (path IN ('deterministic', 'generated')),
    provider VARCHAR(32) NOT NULL,
    grounded BOOLEAN NOT NULL DEFAULT TRUE,
    action_type VARCHAR(32),
    page VARCHAR(32),
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_turns_person_time ON companion_turns(person_id, created_at DESC);
