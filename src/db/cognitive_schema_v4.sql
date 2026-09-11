-- ============================================================================
-- MindMitra: Experience Engine -- Schema Addendum v4
-- Additive only.
--
-- Why this exists: game_specs/game_sessions/game_trials (schema v1) model the
-- two bespoke engines (Game 7 Reminiscence, Game 8 Route Builder) and key
-- every spec to a row in game_templates. The Experience Engine composes
-- experiences from a *generic* template family at request time and has to
-- record the whole §45 event vocabulary -- suggested/accepted/declined/cued/
-- abandoned -- not just per-trial rows inside a started session. Bending the
-- old tables to carry that would have meant nullable FKs and a widened CHECK
-- on every existing row, so this is a separate, narrower pair of tables.
-- The old tables are untouched and the old engines keep using them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 25. EXPERIENCE SPECS
-- One validated ExperienceSpec. Stored so that (a) a chatbot invitation can
-- hand out a deep link to an experience that was already planned and
-- validated, (b) the experience can be replayed/resumed, and (c) "why was this
-- created" stays answerable long after the request (§53).
-- The spec column holds the person-facing spec; trace holds the developer-only
-- retrieval reasoning and is never sent to the Person App (§54).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experience_specs (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    template_id VARCHAR(48) NOT NULL,
    reason VARCHAR(48) NOT NULL,
    reason_detail TEXT,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
    source_entity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    spec JSONB NOT NULL,
    trace JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation JSONB NOT NULL,
    -- Personal content goes stale: an experience about "today" must not be
    -- rendered tomorrow. The planner sets this per template.
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_specs_person_time ON experience_specs(person_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_specs_person_template ON experience_specs(person_id, template_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 26. EXPERIENCE EVENTS (§45 telemetry -> §20 Experience Memory)
-- Append-only. Every meaningful interaction, including the ones that never
-- became gameplay: suggested, declined, abandoned.
--
-- outcome is deliberately NOT win/loss (§21). measurement_quality and the
-- conditions that produced it are recorded alongside every response so a
-- low-quality observation can be excluded from capability inference later
-- without being thrown away now (§23).
--
-- idempotency_key makes offline replay safe: the outbox can re-send a queued
-- event after reconnect without double-counting it.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experience_events (
    id VARCHAR(64) PRIMARY KEY,
    person_id VARCHAR(64) NOT NULL,
    spec_id VARCHAR(64),
    template_id VARCHAR(48),
    reason VARCHAR(48),
    event_type VARCHAR(48) NOT NULL CHECK (event_type IN (
        'EXPERIENCE_SUGGESTED', 'EXPERIENCE_ACCEPTED', 'EXPERIENCE_DECLINED',
        'EXPERIENCE_STARTED', 'EXPERIENCE_STEP_STARTED', 'EXPERIENCE_RESPONSE',
        'EXPERIENCE_CORRECT', 'EXPERIENCE_INCORRECT', 'EXPERIENCE_CUE',
        'EXPERIENCE_ASSISTED', 'EXPERIENCE_COMPLETED',
        'EXPERIENCE_COMPLETED_WITH_SUPPORT', 'EXPERIENCE_ABANDONED',
        'EXPERIENCE_PAUSED', 'EXPERIENCE_RESUMED'
    )),
    step_id VARCHAR(64),
    step_index INT,
    response TEXT,
    expected_response TEXT,
    outcome VARCHAR(32) CHECK (outcome IN (
        'SUCCESS', 'PARTIAL_SUCCESS', 'UNSUCCESSFUL', 'DECLINED', 'ABANDONED',
        'COMPLETED_WITH_SUPPORT', 'COMPLETED_TOGETHER', 'UNABLE_TO_ASSESS'
    )),
    -- S0 independent .. S5 full support (§24).
    assistance_level INT NOT NULL DEFAULT 0 CHECK (assistance_level BETWEEN 0 AND 5),
    modality VARCHAR(32),
    language VARCHAR(16),
    latency_ms INT,
    -- §23. Low quality does not mean "discard the interaction"; it means
    -- "do not read a capability change out of it".
    measurement_quality NUMERIC(3,2) CHECK (measurement_quality BETWEEN 0.0 AND 1.0),
    measurement_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_entity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    /** Set when the event was recorded offline and synced later. */
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key VARCHAR(128) UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_experience_events_person_time ON experience_events(person_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_events_spec ON experience_events(spec_id);
CREATE INDEX IF NOT EXISTS idx_experience_events_person_type ON experience_events(person_id, event_type, occurred_at DESC);
