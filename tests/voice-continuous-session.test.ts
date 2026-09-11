// Continuous voice session turn-taking (Prompt 4 §29-§34, §47).
//
// The reported bug: open voice, speak once, get an answer -- and the microphone
// goes dead. Recognition ran with continuous = false, its onend set isListening
// false, and nothing ever re-armed it, so SPEAKING transitioned to CLOSED after
// every single response instead of back to LISTENING.
//
// These cover the decisions that loop is made of. The scheduling itself lives
// in the React provider and needs a browser; what is testable here is what the
// provider asks before each transition.

import test from "node:test";
import assert from "node:assert/strict";
import {
  decideTranscript,
  isBareCommand,
  isInterrupt,
  isSelfEcho,
  relistenDelayMs,
  shouldRelisten,
  stateAfterSpeaking,
} from "../src/lib/voice-turn-taking";

const base = { sessionActive: true, processing: false, recognitionRunning: false, speaking: false };

// ── §30/§33: the loop closes on itself ──────────────────────────────────────

test("§33 After speaking, an open session goes back to listening -- not silent", () => {
  assert.equal(stateAfterSpeaking(true), "listening");
  assert.equal(shouldRelisten(base), true, "an idle open session re-arms the microphone");
});

test("§31 Only closing the session ends the loop", () => {
  assert.equal(stateAfterSpeaking(false), "idle");
  assert.equal(shouldRelisten({ ...base, sessionActive: false }), false, "minimize/stop ends listening");
});

test("§30 The loop does not listen over itself or over an in-flight turn", () => {
  assert.equal(shouldRelisten({ ...base, processing: true }), false, "not while the turn is being answered");
  assert.equal(shouldRelisten({ ...base, recognitionRunning: true }), false, "not if already listening");
});

test("§32 Listening continues during playback so the person can interrupt", () => {
  assert.equal(shouldRelisten({ ...base, speaking: true }), true, "microphone stays open while speaking");
  assert.ok(
    relistenDelayMs({ speaking: true }) > relistenDelayMs({ speaking: false }),
    "but re-arms more slowly during playback, so it doesn't thrash"
  );
});

// ── §32: barge-in, without the assistant answering itself ───────────────────

test("§32 A bare 'stop' is obeyed immediately and does not generate a reply", () => {
  assert.equal(isInterrupt("okay, stop"), true);
  assert.equal(isBareCommand("okay, stop"), true);
  assert.equal(decideTranscript("okay, stop", { speaking: true, currentlySpeaking: "Rina is coming at four and" }), "obey_and_relisten");
});

test("§32 A real question spoken over the assistant interrupts it and is answered", () => {
  const decision = decideTranscript("what about tomorrow instead", {
    speaking: true,
    currentlySpeaking: "Rina is coming at four in the afternoon",
  });
  assert.equal(decision, "interrupt_and_send");
});

test("Echo guard: the assistant transcribing its own voice is discarded, not answered", () => {
  const spoken = "Rina is coming at four in the afternoon";
  assert.equal(isSelfEcho("rina is coming at four in the afternoon", spoken), true);
  assert.equal(isSelfEcho("Rina is coming at four", spoken), true, "a partial echo is still an echo");
  assert.equal(decideTranscript("rina is coming at four", { speaking: true, currentlySpeaking: spoken }), "ignore_echo");

  // Without this the assistant would answer itself in a loop -- so a genuine
  // utterance must still get through.
  assert.equal(isSelfEcho("what should I do before then", spoken), false);
  assert.equal(decideTranscript("what should I do before then", { speaking: true, currentlySpeaking: spoken }), "interrupt_and_send");
});

test("Echo guard is inert when nothing is being spoken", () => {
  assert.equal(isSelfEcho("anything at all", ""), false);
  assert.equal(decideTranscript("what is happening today", { speaking: false, currentlySpeaking: "" }), "send");
});

test("An empty transcript is never sent as a turn", () => {
  assert.equal(decideTranscript("   ", { speaking: false, currentlySpeaking: "" }), "ignore_echo");
});

// ── §47: the full sequence, as a walk through the decisions ─────────────────

test("§47 A full session: speak, answer, listen again, interrupt, continue, then minimize", () => {
  let sessionActive = true;
  const trace: string[] = [];

  // 1. Person speaks; nothing is playing, so it goes straight to a turn.
  assert.equal(decideTranscript("what do I have to do today", { speaking: false, currentlySpeaking: "" }), "send");
  trace.push("turn_1_sent");

  // 2. While the answer plays, the microphone stays open.
  assert.equal(shouldRelisten({ ...base, speaking: true }), true);

  // 3. The answer ends -- and the session returns to listening, not to silence.
  assert.equal(stateAfterSpeaking(sessionActive), "listening");
  trace.push("relisten_1");

  // 4. Person speaks again without touching the microphone.
  assert.equal(decideTranscript("what about tomorrow", { speaking: false, currentlySpeaking: "" }), "send");
  trace.push("turn_2_sent");

  // 5. Person interrupts the second answer.
  assert.equal(
    decideTranscript("no, tell me about Rina", { speaking: true, currentlySpeaking: "Tomorrow you have tea at four" }),
    "interrupt_and_send"
  );
  trace.push("turn_3_sent");
  assert.equal(stateAfterSpeaking(sessionActive), "listening");
  trace.push("relisten_2");

  // 6. Minimize -- and only now does voice stop.
  sessionActive = false;
  assert.equal(stateAfterSpeaking(sessionActive), "idle");
  assert.equal(shouldRelisten({ ...base, sessionActive }), false);
  trace.push("closed");

  assert.deepEqual(trace, [
    "turn_1_sent",
    "relisten_1",
    "turn_2_sent",
    "turn_3_sent",
    "relisten_2",
    "closed",
  ]);
});
