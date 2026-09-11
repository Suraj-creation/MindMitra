// Turn-taking decisions for the continuous voice session (Prompt 4 §29-§34).
//
// Extracted from CompanionContext so the parts that can actually be wrong --
// when to hand the microphone back, and whether a transcript is the assistant
// hearing itself -- are plain functions with a test, rather than branches
// buried in React callbacks that only a browser can reach.

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

/** Words that should cut the assistant off mid-sentence. */
export const INTERRUPT_WORDS = /\b(stop|wait|hold on|quiet|enough|hush|shush|no more)\b/i;

export function isInterrupt(transcript: string): boolean {
  return INTERRUPT_WORDS.test(transcript);
}

/** A bare "stop" is a command to obey, not a question to answer. */
export function isBareCommand(transcript: string): boolean {
  return isInterrupt(transcript) && transcript.trim().split(/\s+/).length <= 3;
}

const words = (t: string): string[] =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Is this transcript just the assistant hearing its own voice?
 *
 * Barge-in requires the microphone to stay open while the speaker plays, so on
 * a device with weak echo cancellation the recognizer transcribes the assistant.
 * Without this guard the assistant answers itself, forever.
 *
 * ponytail: word-overlap against the text currently being spoken. Cheap, and
 * adequate for the short spoken answers this system produces; if it ever
 * misfires, the upgrade is a dedicated getUserMedia stream with an explicit
 * echo canceller rather than a better heuristic.
 */
export function isSelfEcho(transcript: string, currentlySpeaking: string, threshold = 0.6): boolean {
  if (!currentlySpeaking) return false;
  const heard = words(transcript);
  if (heard.length === 0) return true;
  const spoken = new Set(words(currentlySpeaking));
  const overlap = heard.filter((w) => spoken.has(w)).length / heard.length;
  return overlap > threshold;
}

export interface TurnTakingContext {
  /** The continuous session is open -- only minimize/stop/close clears this. */
  sessionActive: boolean;
  /** A turn is in flight; listening would capture nothing useful. */
  processing: boolean;
  /** A recognition pass is already running. */
  recognitionRunning: boolean;
  /** The assistant is currently speaking (listening anyway enables barge-in). */
  speaking: boolean;
}

/**
 * Should the microphone be re-armed right now?
 *
 * This is the decision the old implementation never made at all: recognition
 * ended, isListening went false, and nothing restarted it -- so voice went
 * silent after exactly one answer. The session, not the individual recognition
 * pass, is what keeps the conversation alive.
 */
export function shouldRelisten(ctx: TurnTakingContext): boolean {
  if (!ctx.sessionActive) return false;
  if (ctx.processing) return false;
  if (ctx.recognitionRunning) return false;
  return true;
}

/** Longer pause while speaking, so re-arming doesn't thrash during playback. */
export function relistenDelayMs(ctx: Pick<TurnTakingContext, "speaking">): number {
  return ctx.speaking ? 600 : 250;
}

export type TranscriptDecision = "ignore_echo" | "obey_and_relisten" | "interrupt_and_send" | "send";

/** What to do with a final transcript, given whether we are mid-utterance. */
export function decideTranscript(transcript: string, opts: { speaking: boolean; currentlySpeaking: string }): TranscriptDecision {
  if (!transcript.trim()) return "ignore_echo";
  if (!opts.speaking) return "send";
  if (!isInterrupt(transcript) && isSelfEcho(transcript, opts.currentlySpeaking)) return "ignore_echo";
  if (isBareCommand(transcript)) return "obey_and_relisten";
  return "interrupt_and_send";
}

/**
 * The state the session moves to when the assistant finishes speaking.
 * SPEAKING -> LISTENING while the session is open; SPEAKING -> IDLE only once
 * it has been closed. The bug was that this was always the second one.
 */
export function stateAfterSpeaking(sessionActive: boolean): VoiceState {
  return sessionActive ? "listening" : "idle";
}
