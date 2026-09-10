import type { UserOnboardingProfile } from "../types";

export const DEFAULT_PROFILE: UserOnboardingProfile = {
  completed: false,
  name: "পূৰ্ণিমা দেৱী",
  honorific: "aita", // "Aitâ" or "Baideu"
  place: "তেজপুৰ, অসম (Tezpur, Assam)",
  subplace: "Courtyard near the Brahmaputra banks",
  language: "as",
  joys: ["tea_ceremony", "flute_ragas", "marigolds", "family_photos"],
  sensitivities: ["no_quizzing", "no_rushing", "dim_light_protection"],
  trustedCaregiverName: "Anu (Daughter / জীয়ৰী)",
  trustedCaregiverPhone: "+91 98640 12345",
};

const STORAGE_KEY = "mindmitra_onboarding_profile_v1";
const COMPLETED_FLAG = "mindmitra_onboarding_completed_v1";

export function loadOnboardingProfile(): UserOnboardingProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (e) {
    console.warn("Error loading onboarding profile:", e);
  }
  return DEFAULT_PROFILE;
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMPLETED_FLAG) === "true";
  } catch {
    return false;
  }
}

export function saveOnboardingProfile(profile: UserOnboardingProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    if (profile.completed) {
      localStorage.setItem(COMPLETED_FLAG, "true");
    }
  } catch (e) {
    console.warn("Error saving onboarding profile:", e);
  }
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COMPLETED_FLAG);
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Error resetting onboarding:", e);
  }
}
