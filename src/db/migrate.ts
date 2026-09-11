import fs from "fs";
import path from "path";
import { getDbPool } from "./neon";

export async function runSchemaMigration() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("Neon pool not available");
  }

  const client = await pool.connect();
  try {
    const schemaPath = path.join(process.cwd(), "src/db/cognitive_schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");

    console.log("Applying cognitive_schema.sql to Neon PostgreSQL...");
    await client.query(sql);

    const schemaV2Path = path.join(process.cwd(), "src/db/cognitive_schema_v2.sql");
    const sqlV2 = fs.readFileSync(schemaV2Path, "utf-8");

    console.log("Applying cognitive_schema_v2.sql (places, routes, routines, consent, preferences, goals)...");
    await client.query(sqlV2);

    const schemaV3Path = path.join(process.cwd(), "src/db/cognitive_schema_v3.sql");
    const sqlV3 = fs.readFileSync(schemaV3Path, "utf-8");

    console.log("Applying cognitive_schema_v3.sql (companion_turns -- conversational Experience Memory)...");
    await client.query(sqlV3);

    const schemaV4Path = path.join(process.cwd(), "src/db/cognitive_schema_v4.sql");
    const sqlV4 = fs.readFileSync(schemaV4Path, "utf-8");

    console.log("Applying cognitive_schema_v4.sql (experience_specs + experience_events -- Experience Engine)...");
    await client.query(sqlV4);

    const schemaV5Path = path.join(process.cwd(), "src/db/cognitive_schema_v5.sql");
    if (fs.existsSync(schemaV5Path)) {
      const sqlV5 = fs.readFileSync(schemaV5Path, "utf-8");
      console.log("Applying cognitive_schema_v5.sql (onboarding_profiles -- dynamic onboarding persistence)...");
      await client.query(sqlV5);
    }

    // Also ensure medication_records table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS medication_records (
        id VARCHAR(64) PRIMARY KEY,
        person_id VARCHAR(64) NOT NULL,
        medication_name VARCHAR(128) NOT NULL,
        assamese_name VARCHAR(128),
        dosage VARCHAR(64) NOT NULL,
        scheduled_time VARCHAR(16) NOT NULL,
        associated_routine_key VARCHAR(64),
        instructions TEXT,
        pill_color VARCHAR(32),
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        taken_at TIMESTAMPTZ,
        verified_by VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_medication_records_person ON medication_records(person_id);
    `);

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    return res.rows.map((r: { table_name: string }) => r.table_name);
  } finally {
    client.release();
  }
}
