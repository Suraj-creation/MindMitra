import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("person API boundary", () => {
  it("exchanges a caregiver-held device secret for the tablet session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "device-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_at: "2030-01-01T00:00:00Z",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.loginDevice("person:purnima", "setup-secret")).resolves.toMatchObject({
      accessToken: "device-token",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/device-login",
      expect.objectContaining({
        body: JSON.stringify({ person_id: "person:purnima", device_secret: "setup-secret" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("derives the one person session from the authenticated identity response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          actor_id: "person:purnima:self",
          display_name: "Purnima Devi",
          subject_kind: "person_device",
          persons: [
            {
              person_id: "person:purnima",
              display_name: "Purnima Devi",
              role: "person",
              preferred_language: "as",
              language_tier: "A",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.getPersonSession("device-token")).resolves.toEqual({
      personId: "person:purnima",
      displayName: "Purnima Devi",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer device-token" }),
      }),
    );
  });

  it("sends a companion message without client-supplied identity or consent", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          request_id: "turn-1",
          answer: "There is nothing planned that I can see yet.",
          intent: "orientation",
          path: "fallback",
          sources: [],
          gaps: ["No routine is available."],
          conflicting: false,
          hedged: false,
          safety_passed: true,
          speakable: true,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.sendCompanionTurn("device-token", "person:purnima", "What is happening today?");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/v1/persons/person:purnima/companion/turn",
      expect.objectContaining({
        body: JSON.stringify({ message: "What is happening today?", speakable: true }),
        headers: expect.objectContaining({ Authorization: "Bearer device-token" }),
      }),
    );
  });
});
