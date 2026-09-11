import { getDbPool, queryDb } from "./neon";

export interface CareSupportLevelRecord {
  person_id: string;
  support_level: number; // 1, 2, 3, 4
  level_title: string;
  set_by: string;
  reason: string;
  last_reviewed: string;
  verification_status: "caregiver_set" | "clinician_verified";
  updated_at: string;
}

export interface CareTaskRecord {
  id: string;
  person_id: string;
  title: string;
  subtext: string;
  scheduled_time: string;
  assigned_to: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed" | "postponed" | "delegated";
  category: "routine" | "family" | "medical" | "comfort";
  due_date_label: string;
  updated_at: string;
}

export interface CareObservationRecord {
  id: string;
  person_id: string;
  category: string;
  note: string;
  author: string;
  tags: string[];
  created_at: string;
}

// ── In-Memory Resilient Cache ────────────────────────────────────────────────
let cachedSupportLevel: CareSupportLevelRecord = {
  person_id: "person:purnima",
  support_level: 2,
  level_title: "Guided Routine Support",
  set_by: "Anu (Daughter)",
  reason: "Benefits from structured auditory cues for morning medication and warm companionship during the late afternoon veranda transition.",
  last_reviewed: "8 Sep 2026",
  verification_status: "caregiver_set",
  updated_at: new Date().toISOString(),
};

let cachedTasks: CareTaskRecord[] = [
  {
    id: "task-1",
    person_id: "person:purnima",
    title: "Connect Rina's regular Guwahati video call on the family tablet",
    subtext: "Keep conversation focused on Rina's college garden and memories of winter pithas.",
    scheduled_time: "5:00 PM",
    assigned_to: "Anu & Rina",
    priority: "high",
    status: "pending",
    category: "family",
    due_date_label: "Today · 5:00 PM",
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    person_id: "person:purnima",
    title: "Evening foot massage with lukewarm mustard oil",
    subtext: "Proven to calm nighttime restlessness and improve deep sleep latency.",
    scheduled_time: "7:15 PM",
    assigned_to: "Anu",
    priority: "medium",
    status: "pending",
    category: "comfort",
    due_date_label: "Today · 7:15 PM",
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    person_id: "person:purnima",
    title: "Weekly health worker checkup & vitals verification (Tezpur PHC)",
    subtext: "Awaiting Rumi's SMS confirmation tomorrow morning.",
    scheduled_time: "10:00 AM",
    assigned_to: "CHW Rumi Saikia",
    priority: "medium",
    status: "pending",
    category: "medical",
    due_date_label: "Upcoming · Thursday 10:00 AM",
    updated_at: new Date().toISOString(),
  },
];

let cachedObservations: CareObservationRecord[] = [
  {
    id: "obs-1",
    person_id: "person:purnima",
    category: "weather",
    note: "Heavy seasonal drizzle prevented morning walk in betel nut courtyard. Handled peacefully indoors.",
    author: "Anu (Daughter)",
    tags: ["weather_related", "routine_adapted"],
    created_at: new Date().toISOString(),
  },
];

// ── Database Initialization ──────────────────────────────────────────────────
export async function initCaregiverDbTables(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS caregiver_support_levels (
          person_id VARCHAR(64) PRIMARY KEY,
          support_level INT NOT NULL,
          level_title VARCHAR(128) NOT NULL,
          set_by VARCHAR(128) NOT NULL,
          reason TEXT NOT NULL,
          last_reviewed VARCHAR(64) NOT NULL,
          verification_status VARCHAR(64) NOT NULL DEFAULT 'caregiver_set',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS caregiver_tasks (
          id VARCHAR(64) PRIMARY KEY,
          person_id VARCHAR(64) NOT NULL,
          title TEXT NOT NULL,
          subtext TEXT,
          scheduled_time VARCHAR(64) NOT NULL,
          assigned_to VARCHAR(128) NOT NULL,
          priority VARCHAR(32) NOT NULL DEFAULT 'medium',
          status VARCHAR(32) NOT NULL DEFAULT 'pending',
          category VARCHAR(64) NOT NULL DEFAULT 'routine',
          due_date_label VARCHAR(128) NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS caregiver_observations (
          id VARCHAR(64) PRIMARY KEY,
          person_id VARCHAR(64) NOT NULL,
          category VARCHAR(64) NOT NULL,
          note TEXT NOT NULL,
          author VARCHAR(128) NOT NULL,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Seed initial support level if empty
      const slRes = await client.query(
        "SELECT * FROM caregiver_support_levels WHERE person_id = $1",
        ["person:purnima"]
      );
      if (slRes.rows.length === 0) {
        await client.query(
          `INSERT INTO caregiver_support_levels 
            (person_id, support_level, level_title, set_by, reason, last_reviewed, verification_status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            cachedSupportLevel.person_id,
            cachedSupportLevel.support_level,
            cachedSupportLevel.level_title,
            cachedSupportLevel.set_by,
            cachedSupportLevel.reason,
            cachedSupportLevel.last_reviewed,
            cachedSupportLevel.verification_status,
          ]
        );
      } else {
        cachedSupportLevel = slRes.rows[0];
      }

      // Seed tasks if empty
      const tasksRes = await client.query(
        "SELECT * FROM caregiver_tasks WHERE person_id = $1",
        ["person:purnima"]
      );
      if (tasksRes.rows.length === 0) {
        for (const task of cachedTasks) {
          await client.query(
            `INSERT INTO caregiver_tasks 
              (id, person_id, title, subtext, scheduled_time, assigned_to, priority, status, category, due_date_label, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              task.id,
              task.person_id,
              task.title,
              task.subtext,
              task.scheduled_time,
              task.assigned_to,
              task.priority,
              task.status,
              task.category,
              task.due_date_label,
            ]
          );
        }
      } else {
        cachedTasks = tasksRes.rows;
      }
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.warn("Neon PostgreSQL caregiver table init warning (using cache fallback):", err);
  }
}

// ── CRUD Methods ─────────────────────────────────────────────────────────────

export async function getCareSupportLevel(personId = "person:purnima"): Promise<CareSupportLevelRecord> {
  try {
    const rows = await queryDb<CareSupportLevelRecord>(
      "SELECT * FROM caregiver_support_levels WHERE person_id = $1",
      [personId]
    );
    if (rows && rows.length > 0) {
      cachedSupportLevel = rows[0];
      return rows[0];
    }
  } catch {
    // Failover to cache
  }
  return cachedSupportLevel;
}

export async function updateCareSupportLevel(
  level: number,
  reason: string,
  setBy = "Anu (Daughter)",
  personId = "person:purnima"
): Promise<CareSupportLevelRecord> {
  const titles: Record<number, string> = {
    1: "Independent / Light Support",
    2: "Guided Routine Support",
    3: "Regular Support",
    4: "High / Continuous Support",
  };
  const levelTitle = titles[level] || "Guided Routine Support";
  const nowStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const record: CareSupportLevelRecord = {
    person_id: personId,
    support_level: level,
    level_title: levelTitle,
    set_by: setBy,
    reason,
    last_reviewed: nowStr,
    verification_status: "caregiver_set",
    updated_at: new Date().toISOString(),
  };

  cachedSupportLevel = record;

  try {
    await queryDb(
      `INSERT INTO caregiver_support_levels 
        (person_id, support_level, level_title, set_by, reason, last_reviewed, verification_status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (person_id) DO UPDATE SET
        support_level = EXCLUDED.support_level,
        level_title = EXCLUDED.level_title,
        set_by = EXCLUDED.set_by,
        reason = EXCLUDED.reason,
        last_reviewed = EXCLUDED.last_reviewed,
        updated_at = NOW()`,
      [personId, level, levelTitle, setBy, reason, nowStr, "caregiver_set"]
    );
  } catch {
    // Failover
  }

  return record;
}

export async function getCareTasks(personId = "person:purnima"): Promise<CareTaskRecord[]> {
  try {
    const rows = await queryDb<CareTaskRecord>(
      "SELECT * FROM caregiver_tasks WHERE person_id = $1 ORDER BY scheduled_time ASC",
      [personId]
    );
    if (rows && rows.length > 0) {
      cachedTasks = rows;
      return rows;
    }
  } catch {
    // Failover
  }
  return cachedTasks;
}

export async function toggleCareTaskStatus(taskId: string): Promise<CareTaskRecord | null> {
  const task = cachedTasks.find((t) => t.id === taskId);
  if (!task) return null;

  task.status = task.status === "completed" ? "pending" : "completed";
  task.updated_at = new Date().toISOString();

  try {
    await queryDb(
      "UPDATE caregiver_tasks SET status = $1, updated_at = NOW() WHERE id = $2",
      [task.status, taskId]
    );
  } catch {
    // Failover
  }

  return task;
}

export async function postponeCareTask(taskId: string, minutes = 30): Promise<CareTaskRecord | null> {
  const task = cachedTasks.find((t) => t.id === taskId);
  if (!task) return null;

  task.due_date_label = `Postponed +${minutes}m (${task.scheduled_time})`;
  task.status = "postponed";
  task.updated_at = new Date().toISOString();

  try {
    await queryDb(
      "UPDATE caregiver_tasks SET due_date_label = $1, status = $2, updated_at = NOW() WHERE id = $3",
      [task.due_date_label, task.status, taskId]
    );
  } catch {
    // Failover
  }

  return task;
}

export async function addCareObservation(
  category: string,
  note: string,
  author = "Anu (Daughter)",
  tags: string[] = [],
  personId = "person:purnima"
): Promise<CareObservationRecord> {
  const obs: CareObservationRecord = {
    id: `obs-${Date.now()}`,
    person_id: personId,
    category,
    note,
    author,
    tags,
    created_at: new Date().toISOString(),
  };

  cachedObservations.unshift(obs);

  try {
    await queryDb(
      `INSERT INTO caregiver_observations (id, person_id, category, note, author, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [obs.id, personId, category, note, author, JSON.stringify(tags)]
    );
  } catch {
    // Failover
  }

  return obs;
}

export async function getCareObservations(personId = "person:purnima"): Promise<CareObservationRecord[]> {
  try {
    const rows = await queryDb<CareObservationRecord>(
      "SELECT * FROM caregiver_observations WHERE person_id = $1 ORDER BY created_at DESC",
      [personId]
    );
    if (rows && rows.length > 0) {
      cachedObservations = rows;
      return rows;
    }
  } catch {
    // Failover
  }
  return cachedObservations;
}
