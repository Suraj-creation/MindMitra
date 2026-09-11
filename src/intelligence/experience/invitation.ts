// Conversation -> Experience bridge (Sections 6, 7, 8, 37).
//
// The assistant does not make a game. It notices that one would be useful,
// asks the Experience Planner for a real one, and offers it. If the planner
// has nothing grounded to offer, no invitation is made at all -- an invitation
// that leads to "I don't have enough saved information" is worse than silence.
//
// The gate below is deliberately conservative. An assistant that ends every
// turn with "shall we play a game?" is an engagement trap, and this product is
// explicitly not one: rest, conversation, music, family and doing nothing are
// all valid outcomes of a turn.

import { ClassifiedIntent } from "../context/types";
import { RecentExperienceSummary } from "../../db/experience-repository";
import { templatesForConversation } from "./planner";
import { ExperienceTemplateId } from "./types";

export interface InvitationDecision {
  offer: boolean;
  /** Templates the conversation points at; empty means "whatever fits best". */
  templates: ExperienceTemplateId[];
  /** Internal reason, for the developer trace. */
  why: string;
  /**
   * The person asked for an activity in so many words, rather than the
   * assistant deciding to volunteer one. Callers should give an explicit
   * request a far more generous time budget: dropping an unsolicited offer to
   * keep a reply fast is right, dropping a requested one is just a failure.
   */
  explicit: boolean;
}

/** Intents where an activity could plausibly follow from what was just said. */
const INVITABLE_INTENTS = new Set([
  "MEMORY",
  "PEOPLE",
  "TEMPORAL",
  "ORIENTATION",
  "ROUTINE",
  "MEDIA",
  "GAME",
]);

/** At most this many suggestions in the recent window, however chatty the turn. */
const MAX_SUGGESTIONS_PER_WINDOW = 2;

export function decideInvitation(input: {
  classified: ClassifiedIntent;
  text: string;
  /** Did the turn actually answer from evidence? An invitation after "I don't know" is hollow. */
  hadEvidence: boolean;
  recent: RecentExperienceSummary;
  /** True while an activity is already on screen -- do not offer a second one. */
  activityInProgress: boolean;
}): InvitationDecision {
  const { classified, text, hadEvidence, recent, activityInProgress } = input;
  // Computed up front so a refusal still reports it: the caller uses this for
  // the time budget, not only for the decision.
  const explicit = classified.intent === "GAME" || /\b(let'?s do something|play|activity|game)\b/i.test(text);
  const no = (why: string): InvitationDecision => ({ offer: false, templates: [], why, explicit });

  if (activityInProgress) return no("an activity is already in progress");
  if (classified.intent === "HUMAN_ASSISTANCE") return no("crisis or distress turn");
  if (classified.intent === "SOCIAL") return no("small talk needs no activity");
  if (classified.intent === "ACTION") return no("the person asked to stop or declined something");
  if (classified.mode === "GENERAL") return no("general-knowledge turn, not about this person's life");
  if (!classified.requires_retrieval) return no("no personal retrieval happened this turn");

  // An explicit ask is always honoured, and bypasses the frequency cap: the
  // person asked for it.
  if (!explicit) {
    if (!hadEvidence) return no("nothing was retrieved to build an activity from");
    if (!INVITABLE_INTENTS.has(classified.intent)) return no(`intent ${classified.intent} is not an activity opening`);
    if (recent.suggestions_in_window >= MAX_SUGGESTIONS_PER_WINDOW) {
      return no("already suggested enough for now");
    }
  }

  const templates = templatesForConversation(text);
  return {
    offer: true,
    templates,
    explicit,
    why: explicit
      ? "the person asked for an activity"
      : `${classified.intent} turn with supporting evidence`,
  };
}

/**
 * The person-facing invitation. Calm, optional, and never system-framed --
 * no "AI generated", no template name, no retrieval confidence (Section 38).
 */
export function invitationCopy(specTitle: string, specInvitation: string): {
  text: string;
  accept_label: string;
  decline_label: string;
} {
  return {
    text: specInvitation || `Would you like to try something about ${specTitle.toLowerCase()}?`,
    accept_label: "Yes, let's try it",
    decline_label: "Not now",
  };
}
