import { describe, expect, it } from "vitest";

import { sessionState } from "./person-session";

describe("sessionState", () => {
  it("requires trusted setup when no device token is available", () => {
    expect(sessionState(null)).toEqual({ kind: "setup-required" });
  });

  it("keeps the authenticated person bound to their device token", () => {
    expect(
      sessionState("device-token", {
        personId: "person:purnima",
        displayName: "Purnima Devi",
      }),
    ).toEqual({
      kind: "ready",
      token: "device-token",
      person: {
        personId: "person:purnima",
        displayName: "Purnima Devi",
      },
    });
  });
});
