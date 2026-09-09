export type PersonSession = {
  personId: string;
  displayName: string;
};

export type PersonSessionState =
  | { kind: "setup-required" }
  | { kind: "ready"; token: string; person: PersonSession };

export const PERSON_ACCESS_TOKEN_KEY = "mindmitra.person.access-token";

export function sessionState(
  token: string | null,
  person?: PersonSession,
): PersonSessionState {
  return token && person
    ? { kind: "ready", token, person }
    : { kind: "setup-required" };
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PERSON_ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PERSON_ACCESS_TOKEN_KEY, token);
  }
}

export function clearStoredAccessToken(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PERSON_ACCESS_TOKEN_KEY);
  }
}
