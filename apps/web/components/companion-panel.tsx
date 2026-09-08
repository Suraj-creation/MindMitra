"use client";

import { LoaderCircle, RotateCcw, Send, Volume2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import type { CompanionTurn, VoiceCapability } from "@/lib/api";

type CompanionPanelProps = {
  prompt: string;
  sendTurn: (message: string) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
};

export function CompanionPanel({ prompt, sendTurn, voice }: CompanionPanelProps) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const submit = async (nextMessage: string) => {
    const trimmed = nextMessage.trim();
    if (!trimmed || isSending) return;

    setError("");
    setIsSending(true);
    try {
      const turn = await sendTurn(trimmed);
      setAnswer(turn.answer);
      setMessage("");
    } catch {
      setError("I could not reach MindMitra just now. You can try again, or choose Help.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(message);
  };

  useEffect(() => {
    if (!answer || !voice?.speech_output_supported || typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = voice.language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [answer, voice]);

  const speakAnswer = () => {
    if (!answer || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = voice?.language ?? "en";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section aria-label="Talk with MindMitra" className="companion-panel">
      <button className="person-primary-action" disabled={isSending} onClick={() => void submit(prompt)} type="button">
        {isSending ? <LoaderCircle aria-hidden="true" className="is-spinning" size={30} /> : <Send aria-hidden="true" size={30} />}
        <span>{isSending ? "One moment…" : prompt}</span>
      </button>

      <form className="companion-form" onSubmit={handleSubmit}>
        <label htmlFor="companion-message">Tell MindMitra what you need</label>
        <div className="companion-form__controls">
          <input
            id="companion-message"
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="You can type here"
            value={message}
          />
          <button aria-label="Send your message" className="companion-send" disabled={!message.trim() || isSending} type="submit">
            <Send aria-hidden="true" size={25} />
            <span>Send</span>
          </button>
        </div>
      </form>

      {answer && (
        <div aria-live="polite" className="companion-answer">
          <p>{answer}</p>
          {voice?.speech_output_supported && typeof window !== "undefined" && "speechSynthesis" in window && (
            <button className="companion-listen" onClick={speakAnswer} type="button">
              <Volume2 aria-hidden="true" size={23} />
              Listen again
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="companion-error" role="status">
          <p>{error}</p>
          <button onClick={() => void submit(message || prompt)} type="button">
            <RotateCcw aria-hidden="true" size={22} />
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
