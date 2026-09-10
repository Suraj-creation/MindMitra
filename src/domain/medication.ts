// Domain Model for Medication Reminders & Caregiver Dosage Management
// Culturally grounded for elderly care in Assam (Purnima & caregiver daughter Anu)

export type PillShape = "round" | "capsule" | "oval" | "drops";
export type SchedulePeriod = "morning" | "afternoon" | "evening" | "night";
export type MedicationStatus = "pending" | "taken" | "skipped";

export interface MedicationReminder {
  id: string;
  personId: string;
  medicineName: string; // Clinical / brand name e.g. "Amlodipine (Blood Pressure)"
  assameseName: string; // Regional display name e.g. "প্ৰেচাৰৰ ঔষধ (Amlodipine)"
  dosage: string; // Specific dosage e.g. "5 mg", "1 tablet", "10 mg"
  scheduleTime: string; // e.g. "09:00 AM"
  schedulePeriod: SchedulePeriod;
  associatedRoutineKey: string; // e.g. "breakfast", "lunch", "afternoon_tea", "prayer", "night_rest"
  instructions: string; // e.g. "Take after breakfast with lukewarm water."
  assameseInstructions: string; // e.g. "পুৱাৰ জলপান খোৱাৰ পিছত এগিলাচ কুহুমীয়া পানীৰে খাব।"
  caregiverName: string; // e.g. "Anu (Daughter)"
  color: string; // e.g. "emerald" | "amber" | "blue" | "rose" | "purple"
  pillShape: PillShape;
  status: MedicationStatus;
  lastTakenAt?: string; // ISO string
  verifiedBy?: string; // e.g. "Anu (Daughter)"
  audioNotificationText: string;
  audioNotificationTextAs: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDoseInput {
  medicineName: string;
  assameseName?: string;
  dosage: string;
  scheduleTime: string;
  schedulePeriod: SchedulePeriod;
  associatedRoutineKey?: string;
  instructions?: string;
  assameseInstructions?: string;
  caregiverName?: string;
  color?: string;
  pillShape?: PillShape;
}

// Initial Verified Prescriptions for Purnima (verified by daughter Anu & Dr. Baruah, Tezpur)
export const DEFAULT_MEDICATIONS: MedicationReminder[] = [
  {
    id: "med:amlodipine_morning",
    personId: "person:purnima",
    medicineName: "Amlodipine (Blood Pressure)",
    assameseName: "প্ৰেচাৰৰ ঔষধ (Amlodipine)",
    dosage: "5 mg (1 small white tablet)",
    scheduleTime: "09:00 AM",
    schedulePeriod: "morning",
    associatedRoutineKey: "breakfast",
    instructions: "Take 1 tablet after morning rice pitha & fruit with half cup of lukewarm water.",
    assameseInstructions: "ৰাতিপুৱাৰ জলপান খোৱাৰ পিছত এগিলাচ কুহুমীয়া পানীৰ সৈতে এটা টেবলেট খাব।",
    caregiverName: "Anu (Daughter)",
    color: "emerald",
    pillShape: "round",
    status: "taken",
    lastTakenAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    verifiedBy: "Anu (Daughter)",
    audioNotificationText:
      "Namaskar, Purnima baideu. It is time for your morning blood pressure medicine, 5 milligrams. Anu has placed lukewarm water right next to your cup.",
    audioNotificationTextAs:
      "নমস্কাৰ পূৰ্ণিমা বাইদেউ। পুৱাৰ প্ৰেচাৰৰ ঔষধ ৫ মিলিগ্ৰাম খোৱাৰ সময় হৈছে। অনুৱে এগিলাচ কুহুমীয়া পানী আপোনাৰ কাষতে ৰাখিছে।",
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-10T09:05:00Z",
  },
  {
    id: "med:donepezil_afternoon",
    personId: "person:purnima",
    medicineName: "Donepezil (Memory Support)",
    assameseName: "স্মৃতি আৰু মনৰ শান্ত ঔষধ (Donepezil)",
    dosage: "5 mg (1 peach tablet)",
    scheduleTime: "01:30 PM",
    schedulePeriod: "afternoon",
    associatedRoutineKey: "lunch",
    instructions: "Take after afternoon khichdi. Anu will hand it to you in the sunny dining room.",
    assameseInstructions: "দুপৰীয়াৰ ভাত খোৱাৰ পিছত খাব। অনুৱে নিজেই আপোনাক আনি দিব।",
    caregiverName: "Anu (Daughter)",
    color: "amber",
    pillShape: "oval",
    status: "pending",
    audioNotificationText:
      "Purnima baideu, after your warm lunch, Anu has your afternoon memory medicine ready with fresh water.",
    audioNotificationTextAs:
      "পূৰ্ণিমা বাইদেউ, দুপৰীয়াৰ আহাৰৰ পিছত অনুৱে দুপৰীয়াৰ ঔষধটো এগিলাচ পানীৰ সৈতে লৈ আহিছে।",
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-10T08:00:00Z",
  },
  {
    id: "med:calcium_night",
    personId: "person:purnima",
    medicineName: "Calcium & Vitamin D3",
    assameseName: "হাড়ৰ পুষ্টি আৰু কেলচিয়াম (Calcium D3)",
    dosage: "500 mg (1 chewable tablet)",
    scheduleTime: "08:00 PM",
    schedulePeriod: "evening",
    associatedRoutineKey: "prayer",
    instructions: "Chew slowly after evening Gosai-Ghar prayer before dinner.",
    assameseInstructions: "সন্ধিয়া গোসাঁই ঘৰত চাকি জ্বলোৱাৰ পিছত লাহে লাহে চোবাই খাব।",
    caregiverName: "Anu (Daughter)",
    color: "blue",
    pillShape: "capsule",
    status: "pending",
    audioNotificationText:
      "Peaceful evening, Purnima baideu. Time for your evening calcium tablet after lighting the oil lamp with Anu.",
    audioNotificationTextAs:
      "শুভ সন্ধিয়া পূৰ্ণিমা বাইদেউ। গোসাঁই ঘৰৰ চাকি জ্বলোৱাৰ পিছত কেলচিয়ামৰ ঔষধটো খোৱাৰ সময় হ’ল।",
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-10T08:00:00Z",
  },
];
