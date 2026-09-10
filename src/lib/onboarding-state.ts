export type OnboardingProfile = {
  name: string;
  honorific: string;
  honorificAssamese: string;
  preferredLanguage: "as" | "en" | "bn" | "brx" | "kha";
  comforts: string[];
  customComforts: string[];
  sensitivities: string[];
  completed: boolean;
  completedAt?: string;
};

export const DEFAULT_ONBOARDING_PROFILE: OnboardingProfile = {
  name: "Purnima Devi",
  honorific: "Aitâ",
  honorificAssamese: "আইতা",
  preferredLanguage: "as",
  comforts: [
    "morning_tea",
    "borgeet_melodies",
    "muga_handloom",
    "luit_river_mist",
  ],
  customComforts: [],
  sensitivities: [
    "gentle_volume",
    "zero_quizzing",
    "muga_soft_glare",
  ],
  completed: false,
};

export const ONBOARDING_STORAGE_KEY = "mindmitra.onboarding.profile";

export function getStoredOnboardingProfile(): OnboardingProfile {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_PROFILE;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_ONBOARDING_PROFILE;
    return { ...DEFAULT_ONBOARDING_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ONBOARDING_PROFILE;
  }
}

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to persist onboarding profile:", err);
  }
}

export function resetOnboardingProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to reset onboarding profile:", err);
  }
}
