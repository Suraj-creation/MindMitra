// In-Memory & LocalStorage Medication Store for MindMitra
// Coordinates caregiver dosage input, schedule synchronization, and user notifications

import {
  MedicationReminder,
  MedicationDoseInput,
  DEFAULT_MEDICATIONS,
} from "../domain/medication";

const STORAGE_KEY = "mindmitra_medication_reminders_v1";

class MedicationStore {
  private medications: MedicationReminder[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.medications = parsed;
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load medications from localStorage, falling back to defaults:", err);
      }
    }
    // Default initial seed
    this.medications = JSON.parse(JSON.stringify(DEFAULT_MEDICATIONS));
  }

  private save(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.medications));
      } catch (err) {
        console.warn("Could not save medications to localStorage:", err);
      }
    }
  }

  public getAll(personId: string = "person:purnima"): MedicationReminder[] {
    return this.medications.filter((m) => m.personId === personId);
  }

  public getById(id: string): MedicationReminder | undefined {
    return this.medications.find((m) => m.id === id);
  }

  public getNextDue(personId: string = "person:purnima"): MedicationReminder | undefined {
    const list = this.getAll(personId);
    // Return the first pending medication
    return list.find((m) => m.status === "pending") || list[0];
  }

  public add(input: MedicationDoseInput, personId: string = "person:purnima"): MedicationReminder {
    const id = `med:${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const assameseName =
      input.assameseName ||
      (input.medicineName.toLowerCase().includes("pressure") || input.medicineName.toLowerCase().includes("bp")
        ? `প্ৰেচাৰৰ ঔষধ (${input.medicineName})`
        : `নিয়মীয়া ঔষধ (${input.medicineName})`);

    const audioNotificationText = `Namaskar, Purnima baideu. It is time for your ${input.dosage} of ${input.medicineName}. Anu has kept fresh water ready for you.`;
    const audioNotificationTextAs = `নমস্কাৰ পূৰ্ণিমা বাইদেউ। ${input.medicineName} ৰ ${input.dosage} ঔষধ খোৱাৰ সময় হৈছে। অনুৱে এগিলাচ পানী সাজু কৰি থৈছে।`;

    const newMed: MedicationReminder = {
      id,
      personId,
      medicineName: input.medicineName,
      assameseName,
      dosage: input.dosage,
      scheduleTime: input.scheduleTime,
      schedulePeriod: input.schedulePeriod || "morning",
      associatedRoutineKey: input.associatedRoutineKey || "breakfast",
      instructions: input.instructions || "Take with water as guided by caregiver.",
      assameseInstructions: input.assameseInstructions || "কুহুমীয়া পানীৰে অনুৰ সহায়ত খাওক।",
      caregiverName: input.caregiverName || "Anu (Daughter)",
      color: input.color || "emerald",
      pillShape: input.pillShape || "round",
      status: "pending",
      audioNotificationText,
      audioNotificationTextAs,
      createdAt: now,
      updatedAt: now,
    };

    this.medications.push(newMed);
    this.save();
    return newMed;
  }

  public update(id: string, updates: Partial<MedicationReminder>): MedicationReminder | null {
    const idx = this.medications.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const existing = this.medications[idx];
    const updated: MedicationReminder = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Refresh audio texts if dosage or name changed
    if (updates.dosage || updates.medicineName) {
      const medName = updated.medicineName;
      const dosage = updated.dosage;
      updated.audioNotificationText = `Namaskar, Purnima baideu. It is time for your ${dosage} of ${medName}. Anu has kept fresh water ready for you.`;
      updated.audioNotificationTextAs = `নমস্কাৰ পূৰ্ণিমা বাইদেউ। ${medName} ৰ ${dosage} ঔষধ খোৱাৰ সময় হৈছে। অনুৱে এগিলাচ পানী সাজু কৰি থৈছে।`;
    }

    this.medications[idx] = updated;
    this.save();
    return updated;
  }

  public delete(id: string): boolean {
    const prevLen = this.medications.length;
    this.medications = this.medications.filter((m) => m.id !== id);
    if (this.medications.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public markTaken(
    id: string,
    takenAt: string = new Date().toISOString(),
    verifiedBy: string = "Anu (Daughter)"
  ): MedicationReminder | null {
    const med = this.getById(id);
    if (!med) return null;

    return this.update(id, {
      status: "taken",
      lastTakenAt: takenAt,
      verifiedBy,
    });
  }

  public resetToDefaults(): MedicationReminder[] {
    this.medications = JSON.parse(JSON.stringify(DEFAULT_MEDICATIONS));
    this.save();
    return this.medications;
  }
}

export const medicationStore = new MedicationStore();
