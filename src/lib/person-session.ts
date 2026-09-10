export type PersonSession = {
  personId: string;
  displayName: string;
};

export type PersonSessionState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; token: string; person: PersonSession }
  | { kind: "error"; message: string };

const TOKEN_STORAGE_KEY = "mindmitra.person.access_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn("Failed to save person access token:", err);
  }
}

export function clearStoredAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear person access token:", err);
  }
}
