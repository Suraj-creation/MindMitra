import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { VoiceCapability } from "@/lib/api";
import { CompanionPanel } from "./companion-panel";

const noVoice: VoiceCapability = {
  provider: "unavailable",
  realtime_available: false,
  language: "as",
  language_tier: "A",
  speech_input_supported: false,
  speech_output_supported: false,
  fallback: "browser_speech",
  note: "Live voice is unavailable.",
};

describe("CompanionPanel", () => {
  it("shows the governed answer after a person chooses a prompt", async () => {
    const sendTurn = vi.fn().mockResolvedValue({
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
    });
    const user = userEvent.setup();

    render(
      <CompanionPanel
        prompt="What is happening today?"
        sendTurn={sendTurn}
        voice={noVoice}
      />,
    );
    await user.click(screen.getByRole("button", { name: "What is happening today?" }));

    expect(
      await screen.findByText("There is nothing planned that I can see yet."),
    ).toBeVisible();
  });

  it("retains text interaction when speech input is unavailable", () => {
    render(<CompanionPanel prompt="What is happening today?" sendTurn={vi.fn()} voice={noVoice} />);

    expect(screen.getByRole("textbox", { name: "Tell MindMitra what you need" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Speak your question" })).not.toBeInTheDocument();
  });
});
