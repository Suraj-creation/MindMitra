// Bounded, deterministic intent classification (Prompt 3 §9/§10). Replaces the
// scattered `lower.includes(...)` chain that used to live inline in the
// companion-turn route handler with one small, testable, rule-ordered
// function. Context (page/active game/visible entity) can change which class
// the same words resolve to -- e.g. "help" means something different inside
// a game than on My Day.
//
// Beyond the intent class this also answers three questions the response layer
// needs *before* it decides how to answer at all:
//   - mode:           is this general knowledge, personal knowledge, or a
//                     question that only the current screen can disambiguate?
//   - temporal_scope: which day is being asked about (resolved deterministically
//                     downstream against a real clock, never by the LLM)
//   - continuation:   "what ELSE" -- the answer must subtract what's already
//                     been covered rather than repeat the whole day.

import { ClassifiedIntent, IntentClass, QueryMode, TemporalScope } from "./types";

export interface IntentContext {
  page?: string;
  activeGame?: { game_id: string } | null;
  visibleEntity?: { type: string; name?: string } | null;
}

const CRISIS_WORDS = /\b(want to die|kill myself|end it all|can'?t go on|nobody loves me|hurt myself)\b/i;

// ── Personal-knowledge markers (Prompt 4 §7) ─────────────────────────────────
// Any of these means the question is about THIS person's life and must be
// answered from retrieved data, never from the model's own knowledge.
const PERSONAL_MARKERS: RegExp[] = [
  /\b(my|mine|myself|our|ours|we|us)\b/,
  /\bi\b/,
  /\b(today|tonight|tomorrow|yesterday)\b/,
  /\b(this|last|next)\s+(morning|afternoon|evening|night|week|month|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  /\b(have to do|has to do|need to do|needs to do|supposed to|to do|left to do)\b/,
  /\b(usually|normally|always|every day|everyday)\b/,
  /\b(daughter|son|granddaughter|grandson|grandchild|family|husband|wife|mother|father|sister|brother|caregiver)\b/,
  /\b(routine|schedule|appointment|reminder|medicine|medication|tablet|pill)\b/,
  /\bwhat happened\b/,
];

// Demonstratives/deixis: these can only be resolved against what is on screen,
// so they force CONTEXTUAL mode rather than a general-knowledge answer.
const DEIXIS = /\b(this|that|these|those|here|there|it|her|him|she|he|them)\b/;

// Definitional / world-knowledge shapes. Deliberately narrow: "who is X" is
// NOT here, because in this app "who is Rina" vastly outnumbers "who is
// Gandhi", and answering a family question from model knowledge is the worst
// possible failure. Person lookup that finds nobody degrades to a plain
// "I don't have anyone by that name" instead.
const GENERAL_KNOWLEDGE_SHAPES: RegExp[] = [
  /^(what|what's)\s+(is|are|was|were|does|do)?\s*(a|an|the)?\s*\p{L}+/u,
  /\b(capital of|meaning of|definition of|how many|how far|how much does|who invented|who wrote|who discovered|what year)\b/,
  /\b(tell me a joke|tell me a story|sing a song)\b/,
];

// Whole-utterance pleasantries -- acknowledgements that need no retrieval and
// no lookup (Prompt 4 §36). Matched against the FULL trimmed utterance so that
// "okay what else do you have to do today" is not mistaken for "okay".
const SMALL_TALK = /^(ok|okay|alright|yes|yeah|no|nope|thanks|thank you|thank you so much|that'?s nice|nice|lovely|good|very good|hmm|mm|ah|oh|i see|sure|fine|beautiful)[.!]?$/;

// A refusal usually arrives with a leading acknowledgement ("no, I don't want
// to", "no thanks", "nah not right now"). Anchoring the old pattern at ^ meant
// every one of those fell through to the CONVERSATIONAL fallback, and a
// refusal came back as "I don't have it recorded why you said no" -- which is
// both nonsense and the opposite of honouring it. The leading token is now
// optional, and a bare "no thanks" counts on its own.
const REFUSAL =
  /^(no|nope|nah|not)?[,.\s]*\s*(i don'?t want to|i do not want to|not now|not right now|no more|leave it|stop it|i don'?t feel like it|i'?m not in the mood|maybe later|another time)\b/;
const BARE_REFUSAL = /^(no thanks|no thank you|no,? not now|nah|nope)[.!]?$/;

// Grounding and wayfinding. "Where am I" is one of the most important things a
// person can say in this app and it matched no rule at all -- it fell through
// to the generic companion fallback, which answered the same sentence on every
// page regardless of anything retrieved.
const GROUNDING =
  /\b(where am i|where are we|whose house is this|what is this place|which place is this|am i at home|is this my home|how do i get home|take me home)\b/;

function hasPersonalMarker(t: string): boolean {
  return PERSONAL_MARKERS.some((r) => r.test(t));
}

// "How do I make tea?" is a how-to question; "How do I *usually* make tea?"
// asks about this person's own routine (Prompt 4 §38). The pronoun alone can't
// separate them, so a bare how-to counts as general knowledge unless a
// possessive or frequency word makes it personal.
const HOW_TO = /^how\s+(do|can|should|would|to)\s+(i|you|we|one)?\b/;
const PERSONAL_QUALIFIER = /\b(my|mine|our|ours|usually|normally|always|every day|everyday|routine|used to)\b/;
// Getting somewhere is never a generic how-to for this person -- orientation
// and wayfinding questions must stay on the retrieval path.
const WAYFINDING = /\b(get|go|going|find|reach|back|home|way)\b/;

function isGenericHowTo(t: string): boolean {
  return HOW_TO.test(t) && !PERSONAL_QUALIFIER.test(t) && !WAYFINDING.test(t) && !DEIXIS.test(t);
}

/** "What else", "what about X", "and then?" -- the answer must not simply repeat itself. */
function isContinuation(t: string): boolean {
  return /\b(what else|anything else|what about|how about|and then|after that|else)\b/.test(t) || /^(and|then)\b/.test(t);
}

/**
 * Deterministic temporal scope detection (Prompt 4 §15). This only identifies
 * WHICH scope the words refer to -- turning that into real dates happens
 * against a real clock and the person's timezone in the context engine. The
 * LLM is never asked to work out what "today" means.
 */
function detectTemporalScope(t: string): TemporalScope {
  if (/\btomorrow\b/.test(t)) return "TOMORROW";
  if (/\byesterday\b/.test(t) || /\blast night\b/.test(t)) return "YESTERDAY";
  if (/\b(today|tonight|this morning|this afternoon|this evening|rest of the day)\b/.test(t)) return "TODAY";
  if (/\b(right now|at the moment|just now)\b/.test(t) || /what'?s next|happens next|what next/.test(t)) return "NOW";
  return "NONE";
}

function decideMode(t: string, ctx: IntentContext): QueryMode {
  if (isGenericHowTo(t)) return "GENERAL";
  if (hasPersonalMarker(t)) return "PERSONAL";
  if (DEIXIS.test(t)) return "CONTEXTUAL";
  // Checked BEFORE the on-screen-context fallback: "what is the capital of
  // Assam" is world knowledge whether or not a game happens to be open.
  // Letting screen context win here is what made every utterance during an
  // activity look like it was about that activity.
  if (GENERAL_KNOWLEDGE_SHAPES.some((r) => r.test(t))) return "GENERAL";
  if (ctx.activeGame || ctx.visibleEntity) return "CONTEXTUAL";
  return "CONTEXTUAL";
}

export function classifyIntent(text: string, ctx: IntentContext = {}): ClassifiedIntent {
  const t = text.toLowerCase().trim();

  const temporal_scope = detectTemporalScope(t);
  const continuation = isContinuation(t);
  const personal = hasPersonalMarker(t);

  const finish = (
    intent: IntentClass,
    confidence: number,
    matched_rule: string,
    overrides: Partial<ClassifiedIntent> = {}
  ): ClassifiedIntent => {
    // A generic how-to stays general even when a keyword rule (e.g. "tea" ->
    // ROUTINE) would otherwise mark the turn personal.
    const mode = isGenericHowTo(t) ? "GENERAL" : overrides.mode ?? decideMode(t, ctx);
    // Personal and contextual questions are answered from retrieved evidence;
    // general knowledge and pleasantries are not (Prompt 4 §37 -- do not
    // blindly call RAG, do not blindly skip it).
    const requires_retrieval =
      overrides.requires_retrieval ?? (mode !== "GENERAL" && intent !== "SOCIAL");
    // Every field is resolved explicitly rather than by spreading `overrides`
    // last: that spread put a rule's `mode: "PERSONAL"` back on top of the
    // computed one, so "how do I make tea" came out labelled PERSONAL while
    // its retrieval flag said GENERAL -- and the turn answered "I can't check
    // your plan" to a question that was never about the person's plan.
    return {
      intent,
      confidence,
      matched_rule,
      mode,
      temporal_scope: overrides.temporal_scope ?? temporal_scope,
      continuation: overrides.continuation ?? continuation,
      requires_retrieval,
    };
  };

  // "Who do I call?" is not a question about the person's circle in general --
  // it is a request for the escalation order, and it must reach the branch that
  // has it. Routed above small talk so "no one is here, who do I call" is not
  // swallowed by the leading "no".
  if (/\b(who (do|can|should) i (call|ring|phone)|who can help|i need help|call someone|is anyone there|nobody is here|no one is here)\b/.test(t)) {
    return finish("HUMAN_ASSISTANCE", 0.9, "emergency_contact_request", { mode: "PERSONAL" });
  }

  // Distress that is real but not a crisis. This had no rule, so "I feel very
  // alone today" fell to the generic fallback and was answered with a greeting.
  // It carries its own matched_rule so the response layer can meet the feeling
  // instead of reaching for the helpline script.
  if (/\b(i (feel|am|'m) (so )?(lonely|alone|sad|low|down|frightened|scared|afraid|worried|useless|a burden)|i miss (my|him|her|them)|nobody (comes|visits|cares)|i want to go home|i feel like crying|everything is confusing)\b/.test(t)) {
    return finish("HUMAN_ASSISTANCE", 0.85, "emotional_support", { mode: "PERSONAL" });
  }

  if (CRISIS_WORDS.test(t)) {
    return finish("HUMAN_ASSISTANCE", 0.99, "crisis_language", { mode: "CONTEXTUAL", requires_retrieval: true });
  }

  // Pleasantries and refusals resolve before anything else: they are complete
  // in themselves and retrieving the person's day to answer "that's nice"
  // is pure waste.
  if (SMALL_TALK.test(t)) {
    return finish("SOCIAL", 0.9, "small_talk", { mode: "GENERAL", requires_retrieval: false });
  }

  if (REFUSAL.test(t) || BARE_REFUSAL.test(t)) {
    return finish("ACTION", 0.9, "refusal", { mode: "CONTEXTUAL", requires_retrieval: false });
  }

  // Checked before the day-plan and help rules: "where am I" carries neither
  // day words nor the word "help", and it must never be answered from the
  // model's own knowledge.
  if (GROUNDING.test(t)) {
    return finish("HELP", 0.9, "grounding_or_wayfinding", { mode: "PERSONAL" });
  }

  if (/\b(stop|pause|be quiet|hush|enough)\b/.test(t) || /\bnot now\b/.test(t)) {
    return finish("ACTION", 0.85, "stop_or_pause", { requires_retrieval: false });
  }

  // ── The load-bearing ordering fix ──────────────────────────────────────────
  // This rule used to sit at the top and fire on the bare word "what", so with
  // a game open (or, far worse, a STALE game left in context after navigating
  // away) "what else do I have to do today" was answered as a game hint --
  // which is exactly how a question about the day's plan came back as a
  // poetic nudge about a walk to the market.
  //
  // Two guards now: the phrasing must actually be a request for help with the
  // task at hand, and a question carrying explicit personal/temporal markers
  // is never a game hint no matter what is on screen.
  const GAME_HELP_PHRASING = /\b(help|hint|clue|stuck|confused|which one|don'?t know|do not know|i can'?t|what do i do|what now)\b/;
  if (ctx.activeGame && GAME_HELP_PHRASING.test(t) && !personal && temporal_scope === "NONE") {
    return finish("GAME_ASSISTANCE", 0.9, "active_game+help_phrasing", { mode: "CONTEXTUAL" });
  }

  if (/\b(do this together|together|with me|help me do)\b/.test(t)) {
    return finish("GAME_ASSISTANCE", 0.8, "do_together", { mode: "CONTEXTUAL" });
  }

  if (/\b(help|hint)\b/.test(t) && !ctx.activeGame) {
    return finish("HELP", 0.75, "help_no_game_context");
  }

  // "show me <Name>" means "show me this person" (checked against the
  // original, non-lowercased text so capitalization still carries meaning) --
  // must be checked before the generic NAVIGATION rule below, which "show me"
  // would otherwise match first.
  const showMeMatch = text.match(/show me\s+(\S+)/i);
  if (showMeMatch && /^\p{Lu}/u.test(showMeMatch[1])) {
    return finish("PEOPLE", 0.8, "show_me_named_person", { mode: "PERSONAL" });
  }

  if (ctx.visibleEntity?.type === "person" && /\b(her|him|she|he|who|call)\b/.test(t)) {
    return finish("PEOPLE", 0.85, "visible_person+pronoun", { mode: "CONTEXTUAL" });
  }

  if (ctx.visibleEntity?.type === "photo" || /\b(photo|picture|album)\b/.test(t)) {
    return finish("MEDIA", 0.8, "photo_context");
  }

  // Day-plan questions. Obligation phrasing ("what do I have to do") is the
  // clearest possible signal and is checked alongside the older day words.
  if (
    /\b(today|happening|plan|schedule)\b/.test(t) ||
    /happens next|what'?s next|what next/.test(t) ||
    /\b(have to do|need to do|supposed to|left to do|to do)\b/.test(t)
  ) {
    return finish("ORIENTATION", 0.85, "day_orientation_words", {
      mode: "PERSONAL",
      temporal_scope: temporal_scope === "NONE" ? "TODAY" : temporal_scope,
    });
  }

  // Checked before the bare temporal reference: "when do I have lunch?" opens
  // with "when", but it is a question about a standing routine, not about a
  // date. Answering it with the day's first three rows is the same precision
  // failure as answering about the daughter when the granddaughter was asked
  // for. A question naming no routine ("when is Rina coming") still falls
  // through to TEMPORAL below.
  if (/\b(routine|tea|chai|lunch|prayer|breakfast|dinner|supper|bath|nap|siesta)\b/.test(t)) {
    return finish("ROUTINE", 0.75, "routine_words", { mode: "PERSONAL" });
  }

  if (/\b(when|tomorrow|yesterday|this morning|tonight|after|before|last|next week)\b/.test(t)) {
    return finish("TEMPORAL", 0.75, "temporal_reference", { mode: "PERSONAL" });
  }

  // "What happens in the evening?" carries no possessive and no day word, so it
  // fell through to the general-knowledge shape and was answered with a
  // dictionary definition of the word "evening". In this app, a question about
  // a part of the day is a question about THIS person's day.
  if (
    /\b(morning|afternoon|evening|night|daytime)\b/.test(t) &&
    /\b(what|when|which|happens?|happening|do i|i do|usually|normally|comes?)\b/.test(t)
  ) {
    return finish("ROUTINE", 0.75, "time_of_day_routine", { mode: "PERSONAL" });
  }

  if (/\b(medicine|medication|tablet|pill|dose)\b/.test(t)) {
    return finish("ROUTINE", 0.8, "medication_words", { mode: "PERSONAL" });
  }

  if (/\b(remember|memory|remind me about|recall)\b/.test(t)) {
    return finish("MEMORY", 0.8, "memory_words", { mode: "PERSONAL" });
  }

  if (/\b(call|phone|ring)\b/.test(t)) {
    return finish("PEOPLE", 0.85, "call_words", { mode: "PERSONAL" });
  }

  // The relationship vocabulary here must match the one the responder resolves
  // against (companion-responder.ts RELATIONSHIP_WORDS). It used to list only
  // granddaughter/daughter/son/family, so "tell me about my wife" reached no
  // rule at all and was answered with the generic companion greeting instead
  // of "I don't have a wife recorded".
  if (
    /\b(who is|who'?s|family)\b/.test(t) ||
    /\b(granddaughter|grandson|grandchild|daughter|son|wife|husband|sister|brother|mother|father|niece|nephew|neighbour|neighbor|caregiver|asha worker|health worker)\b/.test(t)
  ) {
    return finish("PEOPLE", 0.75, "family_reference", { mode: "PERSONAL" });
  }

  if (/\b(let'?s do something|activity|game|garland|craft)\b/.test(t)) {
    return finish("GAME", 0.75, "activity_request", { mode: "CONTEXTUAL" });
  }

  if (/\b(music|song|flute|play)\b/.test(t)) {
    return finish("MEDIA", 0.75, "music_request");
  }

  if (/\b(remind|reminder|set a)\b/.test(t)) {
    return finish("REMINDER", 0.7, "reminder_words", { mode: "PERSONAL" });
  }

  if (/\b(take me|go to|open|show me)\b/.test(t)) {
    return finish("NAVIGATION", 0.7, "navigation_words");
  }

  // "What can I do here?" is a question about the screen, not about the
  // person's records -- answering it from the evidence pack produced "I don't
  // have it recorded what you can do right now", which is both unhelpful and
  // slightly alarming. Placed last among the rules so every more specific
  // reading wins first: "what do I have to do today" is still the day plan.
  if (/\b(what can i do|what should i do|what do i do|what is this page|what happens here|how does this work|what am i looking at)\b/.test(t)) {
    return finish("HELP", 0.7, "page_help", { mode: "CONTEXTUAL", requires_retrieval: false });
  }

  // Nothing matched. A question with no personal marker that looks like a
  // definition is ordinary general knowledge and gets answered as such --
  // it does not need (and must not fabricate) personal context.
  const mode = decideMode(t, ctx);
  if (mode === "GENERAL") {
    return finish("INFORMATION", 0.6, "general_knowledge_shape", { mode: "GENERAL", requires_retrieval: false });
  }

  return finish("CONVERSATIONAL", 0.4, "fallback");
}
