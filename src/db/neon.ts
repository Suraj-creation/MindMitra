import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

export interface DbStatus {
  connected: boolean;
  branch: string;
  host: string;
  database: string;
  version?: string;
  tablesCount?: number;
  tables?: string[];
  latencyMs?: number;
  error?: string;
}

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Neon SSL connections
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle Neon PostgreSQL client:", err.message);
    });
  }

  return pool;
}

export async function checkDbHealth(): Promise<DbStatus> {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  const branch = process.env.NEON_BRANCH || "production";

  if (!connectionString) {
    return {
      connected: false,
      branch,
      host: "none",
      database: "none",
      error: "DATABASE_URL environment variable is not defined",
    };
  }

  let host = "unknown";
  let database = "neondb";
  try {
    const url = new URL(connectionString);
    host = url.host;
    database = url.pathname.replace(/^\//, "") || "neondb";
  } catch {
    // Ignore URL parse error
  }

  const p = getDbPool();
  if (!p) {
    return {
      connected: false,
      branch,
      host,
      database,
      error: "Unable to initialize PostgreSQL connection pool",
    };
  }

  const start = Date.now();
  try {
    const client = await p.connect();
    try {
      const verRes = await client.query("SELECT version() as version, current_database() as db;");
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      const latencyMs = Date.now() - start;

      const tables = tablesRes.rows.map((r: { table_name: string }) => r.table_name);

      return {
        connected: true,
        branch,
        host,
        database: verRes.rows[0]?.db || database,
        version: verRes.rows[0]?.version,
        tablesCount: tables.length,
        tables,
        latencyMs,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Neon PostgreSQL connection check failed:", errorMsg);
    return {
      connected: false,
      branch,
      host,
      database,
      latencyMs: Date.now() - start,
      error: errorMsg,
    };
  }
}

/**
 * Execute raw queries safely
 */
export async function queryDb<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const p = getDbPool();
  if (!p) {
    throw new Error("Neon Database is not configured. DATABASE_URL is required.");
  }
  const res = await p.query(text, params);
  return res.rows as T[];
}
