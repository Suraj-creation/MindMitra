import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { PersonApp } from "./person-app";

describe("PersonApp", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signs in to the seeded demo tablet from the main page", async () => {
    const loginDevice = vi.spyOn(api, "loginDevice").mockResolvedValue({ accessToken: "demo-token" });
    vi.spyOn(api, "getPersonSession").mockResolvedValue({
      personId: "person:purnima",
      displayName: "Purnima Devi",
    });
    vi.spyOn(api, "getVoiceCapability").mockResolvedValue({
      provider: "browser",
      realtime_available: false,
      language: "as",
      language_tier: "A",
      speech_input_supported: false,
      speech_output_supported: false,
      fallback: "text",
      note: "Demo",
    });

    render(<PersonApp />);

    expect(await screen.findByText(/Hello, Purnima Devi/)).toBeVisible();
    expect(loginDevice).toHaveBeenCalledWith("person:purnima", "mindmitra-demo-device");
    expect(screen.queryByText(/needs to be set up/i)).not.toBeInTheDocument();
  });

  it("keeps the four person destinations visibly labelled", () => {
    render(
      <PersonApp
        initialState={{
          kind: "ready",
          token: "device-token",
          person: { personId: "person:purnima", displayName: "Purnima Devi" },
        }}
      />,
    );

    const navigation = screen.getByRole("navigation", { name: "Your day" });
    expect(navigation).toHaveTextContent("My Day");
    expect(navigation).toHaveTextContent("My Life");
    expect(navigation).toHaveTextContent("Let’s Do Something");
    expect(navigation).toHaveTextContent("Help");
  });
});
