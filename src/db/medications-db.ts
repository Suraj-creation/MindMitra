import { getDbPool } from "./neon";
import { MedicationReminder } from "../domain/medication";

export async function getDbMedications(personId: string = "person:purnima"): Promise<MedicationReminder[] | null> {
  const pool = getDbPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT * FROM medication_records WHERE person_id = $1 ORDER BY scheduled_time ASC`,
      [personId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows.map((r: any) => ({
      id: r.id,
      personId: r.person_id,
      medicineName: r.medication_name,
      assameseName: r.assamese_name || r.medication_name,
      dosage: r.dosage,
      scheduleTime: r.scheduled_time,
      schedulePeriod: (r.scheduled_time < "12:00" ? "morning" : r.scheduled_time < "17:00" ? "afternoon" : "evening") as any,
      associatedRoutineKey: r.associated_routine_key || "routine",
      instructions: r.instructions || "",
      assameseInstructions: r.instructions || "কুহুমীয়া পানীৰ সৈতে খাব।",
      caregiverName: r.verified_by || "Anu (Daughter)",
      color: r.pill_color || "emerald",
      pillShape: "round",
      status: (r.status || "pending") as any,
      lastTakenAt: r.taken_at ? new Date(r.taken_at).toISOString() : undefined,
      verifiedBy: r.verified_by || undefined,
      audioNotificationText: `Time for your medicine: ${r.medication_name}.`,
      audioNotificationTextAs: `পূৰ্ণিমা বাইদেউ, আপোনাৰ ${r.assamese_name || r.medication_name} ঔষধৰ সময় হৈছে।`,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("Could not read medications from Neon DB, falling back to memory store:", err);
    return null;
  }
}

export async function upsertDbMedication(med: MedicationReminder): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO medication_records (
        id, person_id, medication_name, assamese_name, dosage,
        scheduled_time, associated_routine_key, instructions, pill_color,
        status, taken_at, verified_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO UPDATE SET
        medication_name = EXCLUDED.medication_name,
        assamese_name = EXCLUDED.assamese_name,
        dosage = EXCLUDED.dosage,
        scheduled_time = EXCLUDED.scheduled_time,
        associated_routine_key = EXCLUDED.associated_routine_key,
        instructions = EXCLUDED.instructions,
        pill_color = EXCLUDED.pill_color,
        status = EXCLUDED.status,
        taken_at = EXCLUDED.taken_at,
        verified_by = EXCLUDED.verified_by,
        updated_at = NOW();`,
      [
        med.id,
        med.personId,
        med.medicineName,
        med.assameseName || null,
        med.dosage,
        med.scheduleTime,
        med.associatedRoutineKey || null,
        med.instructions,
        med.color || "emerald",
        med.status,
        med.lastTakenAt ? new Date(med.lastTakenAt) : null,
        med.verifiedBy || null,
      ]
    );
  } catch (err) {
    console.warn("Could not persist medication to Neon DB:", err);
  }
}

export async function deleteDbMedication(id: string): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    await pool.query(`DELETE FROM medication_records WHERE id = $1`, [id]);
  } catch (err) {
    console.warn("Could not delete medication from Neon DB:", err);
  }
}

export async function seedInitialMedicationsIfEmpty(defaultMeds: MedicationReminder[]): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    const res = await pool.query(`SELECT COUNT(*) as count FROM medication_records`);
    const count = parseInt(res.rows[0]?.count || "0", 10);
    if (count === 0) {
      for (const med of defaultMeds) {
        await upsertDbMedication(med);
      }
      console.log(`Seeded ${defaultMeds.length} initial medications into Neon PostgreSQL`);
    }
  } catch (err) {
    console.warn("Could not check/seed medications in Neon DB:", err);
  }
}
