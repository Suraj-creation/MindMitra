// Grounded deterministic responder (Prompt 3 §13/§14). Replaces the old
// hardcoded if/else chain (server.ts used to answer "Rina calls at 5pm"
// verbatim regardless of whether that was true) with answers built strictly
// from the EvidencePack. When there's no supporting evidence, it says so --
// it does not invent a plausible-sounding fact.

import { ClassifiedIntent } from "./types";
import { EvidencePack, PersonExperienceProjection } from "./types";
import { clockInZone, DEFAULT_TIME_ZONE, minutesOfDay } from "./personal-context-engine";

// Prompt 4 §21: low-risk actions (navigate, show media, start an activity) may
// execute directly; higher-impact ones (calling a real person) must not be
// auto-executed by the assistant -- the contract marks this explicitly so
// every consumer (current UI or future ones) has to make a deliberate choice
// about it rather than inheriting a default.
export type ActionRisk = "low" | "requires_confirmation";

export interface DeterministicAction {
  type: string;
  label: string;
  target?: string;
  phone?: string;
  payload?: Record<string, unknown>;
  risk: ActionRisk;
}

export interface DeterministicAnswer {
  answer: string;
  asText: string;
  intent: string;
  action: DeterministicAction | null;
}

const ACTION_RISK: Record<string, ActionRisk> = {
  call_contact: "requires_confirmation",
  navigate: "low",
  show_media: "low",
  play_music: "low",
  start_activity: "low",
  provide_scaffold: "low",
};

function withRisk(action: Omit<DeterministicAction, "risk">): DeterministicAction {
  return { ...action, risk: ACTION_RISK[action.type] || "requires_confirmation" };
}

// ── Day-plan answers (Prompt 4 §8/§9/§11/§20) ────────────────────────────────

interface DayItem {
  label: string;
  /** Minutes since midnight, for ordering; null sorts last. */
  at: number | null;
  past: boolean;
}

function toMinutes(clock: string): number | null {
  const m = clock.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const mer = m[3]?.toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

/**
 * Flattens the day into one ordered list of commitments. Events, routine and
 * medicines are three different tables but one question -- "what do I have to
 * do" -- so the answer has to read as a single plan, not three reports.
 */
function collectDayItems(projection: PersonExperienceProjection): { remaining: DayItem[]; done: DayItem[] } {
  const tz = projection.currentContext.time_zone || DEFAULT_TIME_ZONE;
  const day = projection.day;
  const items: DayItem[] = [];

  if (day) {
    for (const e of day.events) {
      const clock = clockInZone(e.scheduled_at, tz);
      items.push({
        label: `${e.title}${e.person_name ? ` with ${e.person_name}` : ""} at ${clock}`,
        at: toMinutes(clock),
        past: e.past,
      });
    }
    for (const r of day.routines) {
      items.push({
        label: r.time_of_day ? `${r.title} at ${r.time_of_day}` : r.title,
        at: toMinutes(r.time_of_day || ""),
        past: r.past,
      });
    }
    for (const m of day.medications) {
      items.push({ label: `${m.name} at ${m.scheduled_time}`, at: toMinutes(m.scheduled_time), past: m.taken });
    }
  }

  const byTime = (a: DayItem, b: DayItem) => (a.at ?? 1e9) - (b.at ?? 1e9);
  return {
    remaining: items.filter((i) => !i.past).sort(byTime),
    done: items.filter((i) => i.past).sort(byTime),
  };
}

/**
 * "today" / "tomorrow" / an actual weekday -- computed in the person's zone so
 * a late-evening answer doesn't call tomorrow morning "today".
 */
function dayLabelFor(iso: string, projection: PersonExperienceProjection): string {
  const tz = projection.currentContext.time_zone || DEFAULT_TIME_ZONE;
  const dateIn = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  const now = new Date(projection.currentContext.now_iso);
  const target = new Date(iso);
  const todayKey = dateIn(now);
  const tomorrowKey = dateIn(new Date(now.getTime() + 86400000));
  const targetKey = dateIn(target);
  if (targetKey === todayKey) return "today";
  if (targetKey === tomorrowKey) return "tomorrow";
  return `on ${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(target)}`;
}

function joinLabels(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * The answer to "what do I have to do today" / "what else".
 *
 * Every branch is decided by what retrieval actually returned. There is no
 * branch that produces a suggestion, because inventing something for the
 * person to do is precisely the failure this replaced: an empty day must come
 * back as "I don't have anything recorded", never as "perhaps a walk".
 */
function buildDayAnswer(
  projection: PersonExperienceProjection,
  opts: { honorific: string; continuation: boolean; alreadyMentioned: string[] }
): { answer: string; asText: string } {
  const { honorific } = opts;
  const day = projection.day;
  const label = projection.currentContext.scope_label || "today";
  const asLabel = label === "tomorrow" ? "কাইলৈ" : label === "yesterday" ? "কালি" : "আজি";

  if (!day || !day.attempted) {
    return {
      answer: `I can't check your plan for ${label} right now, ${honorific}.`,
      asText: `${asLabel}ৰ পৰিকল্পনা এই মুহূৰ্তত চাব পৰা নাই।`,
    };
  }
  if (day.not_retrieved) {
    return {
      answer: `I can't check your plan for ${label} right now, ${honorific}. Let's try again in a little while.`,
      asText: `${asLabel}ৰ পৰিকল্পনা এই মুহূৰ্তত চাব পৰা নাই। অলপ পিছত আকৌ চাওঁ।`,
    };
  }

  const { remaining, done } = collectDayItems(projection);

  // Nothing at all on record for this day.
  if (day.nothing_recorded) {
    const next = projection.today.upcoming[0];
    if (next) {
      const clock = clockInZone(next.scheduled_at, projection.currentContext.time_zone || DEFAULT_TIME_ZONE);
      return {
        answer: `I don't have anything recorded for ${label}, ${honorific}. The next thing I have is ${next.title} at ${clock}.`,
        asText: `${asLabel}ৰ বাবে মোৰ ওচৰত একো লিখা নাই। পিছৰ কামটো হ'ল ${next.title}, ${clock} বজাত।`,
      };
    }
    return {
      answer: `I don't have anything recorded for ${label}, ${honorific}.`,
      asText: `${asLabel}ৰ বাবে মোৰ ওচৰত একো লিখা নাই।`,
    };
  }

  // "What ELSE" -- drop what this conversation has already covered (§9/§18).
  const filtered = opts.continuation
    ? remaining.filter((i) => !opts.alreadyMentioned.some((m) => m && i.label.toLowerCase().includes(m.toLowerCase())))
    : remaining;

  if (filtered.length === 0) {
    const suffix = done.length ? ` You've already had ${joinLabels(done.slice(0, 2).map((d) => d.label))}.` : "";
    return {
      answer: `There's nothing else recorded for ${label}, ${honorific}.${suffix}`,
      asText: `${asLabel}ৰ বাবে আৰু একো বাকী নাই।`,
    };
  }

  const shown = filtered.slice(0, 3).map((i) => i.label);
  const more =
    filtered.length > shown.length
      ? ` There ${filtered.length - shown.length === 1 ? "is" : "are"} ${filtered.length - shown.length} more after that.`
      : "";
  // "Still left" is only honest when something actually was subtracted --
  // "what about tomorrow" is a continuation of the conversation but not a
  // continuation of the same day's list.
  const lead = opts.continuation && filtered.length < remaining.length ? "Still left" : "Coming up";
  return {
    answer: `${lead} ${label}: ${joinLabels(shown)}, ${honorific}.${more}`,
    asText: `${asLabel}: ${joinLabels(shown)}।`,
  };
}

// Question words and verbs that get capitalized at the start of a sentence and
// would otherwise read as somebody's name.
const NOT_A_NAME = new Set([
  "when", "what", "who", "where", "why", "how", "which", "the", "and", "but", "did",
  "does", "can", "could", "would", "should", "show", "tell", "call", "play", "give",
  "today", "tomorrow", "yesterday", "tonight", "coming", "going", "visiting", "here",
  "there", "this", "that", "please", "okay", "yes", "not", "have", "has", "was", "are",
  "let", "lets", "make", "take", "know", "think", "remember", "still",
]);

/**
 * A name in the question that matches nobody in this person's circle.
 *
 * Without this, "when is Lakshmi coming?" fell through to the generic day list
 * and answered with today's medicines -- technically grounded, but not an
 * answer, and it left the person believing Lakshmi was accounted for.
 * §50 wants an explicit unknown instead.
 *
 * ponytail: capitalized-token heuristic, so it only fires on typed or
 * well-capitalized speech input. A lowercase ASR transcript falls back to the
 * previous behaviour rather than guessing; upgrade path is matching against
 * the people list with a fuzzy comparator.
 */
function unknownNameIn(message: string | undefined, projection: PersonExperienceProjection): string | null {
  if (!message) return null;
  const known = new Set(projection.people.map((p) => p.name.toLowerCase()));
  // If someone we know is named too, answer about them rather than declaring
  // an unknown ("who is coming with Rina?" resolves Rina).
  if ([...known].some((n) => message.toLowerCase().includes(n))) return null;
  // \p{L} rather than \p{Ll} so an internally capitalized name stays one token:
  // "TestPerson" must not split into "Test" + "Person" and read as a stranger.
  for (const token of message.match(/\p{Lu}\p{L}{2,}/gu) || []) {
    const lower = token.toLowerCase();
    if (NOT_A_NAME.has(lower) || known.has(lower)) continue;
    // Only treat it as a person if the sentence is asking about one.
    if (/\b(who|when|where)\b/i.test(message) || /\b(call|show|visit)\w*\b/i.test(message)) return token;
  }
  return null;
}

function findPerson(projection: PersonExperienceProjection, nameHint?: string | null) {
  if (!nameHint) return null;
  const lower = nameHint.toLowerCase();
  return projection.people.find((p) => p.name.toLowerCase() === lower || lower.includes(p.name.toLowerCase())) || null;
}

/**
 * Resolve a person from the relationship the question actually named.
 *
 * "Tell me about my granddaughter" used to fall through to people[0] and come
 * back "This is your daughter, Anu" -- a real person, but the wrong one, which
 * is a worse failure than saying nothing. The relationship word in the
 * question is a hard constraint, not a hint: if no one holds that
 * relationship, the caller must say so rather than substitute whoever is first
 * in the list.
 */
const RELATIONSHIP_WORDS = [
  "granddaughter", "grandson", "grandchild", "daughter", "son", "wife", "husband",
  "sister", "brother", "mother", "father", "niece", "nephew", "neighbour", "neighbor",
  "caregiver", "doctor", "nurse", "health worker", "asha worker", "friend",
];

export function relationshipNamedIn(text?: string | null): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  // Longest first so "granddaughter" is not shadowed by "daughter".
  for (const word of [...RELATIONSHIP_WORDS].sort((a, b) => b.length - a.length)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) return word;
  }
  return null;
}

function findPersonByRelationship(projection: PersonExperienceProjection, relationship: string | null) {
  if (!relationship) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[_-]+/g, " ").trim();
  const target = norm(relationship);
  return (
    projection.people.find((p) => norm(p.relationship) === target) ||
    projection.people.find((p) => norm(p.relationship).includes(target)) ||
    null
  );
}

export function buildDeterministicAnswer(
  classified: ClassifiedIntent,
  projection: PersonExperienceProjection,
  pack: EvidencePack,
  opts: {
    visibleEntityName?: string | null;
    language?: "as" | "en";
    messageText?: string;
    /** Titles the conversation has already covered, for "what else" (§9/§18). */
    alreadyMentioned?: string[];
  } = {}
): DeterministicAnswer {
  const honorific = projection.person.honorific || "Aitâ";
  const as = opts.language === "as";

  switch (classified.intent) {
    // General knowledge and pleasantries: no personal claim may be made here,
    // so the deterministic path deliberately produces no facts at all. The LLM
    // path answers these normally; this is only the no-provider fallback.
    case "INFORMATION": {
      return {
        answer: `I'm not able to look that up right now, ${honorific}.`,
        asText: `এইটো এতিয়া চাব পৰা নাই।`,
        intent: "general_knowledge",
        action: null,
      };
    }

    case "SOCIAL": {
      return {
        answer: `I'm right here with you, ${honorific}.`,
        asText: `মই আপোনাৰ লগতে আছোঁ।`,
        intent: "social_acknowledgement",
        action: null,
      };
    }
    case "HUMAN_ASSISTANCE": {
      // Who to call, in the order this person's own relationship graph gives:
      // primary caregiver, then close family, then the health worker, then
      // clinical. Never improvised, never a generic "contact someone".
      const CLOSENESS: Record<string, number> = { primary_caregiver: 0, family_core: 1, community_chw: 2, clinical: 3 };
      const reachable = projection.people
        .filter((p) => p.is_emergency && p.phone)
        .sort((a, b) => (CLOSENESS[a.closeness ?? ""] ?? 9) - (CLOSENESS[b.closeness ?? ""] ?? 9));
      const first = reachable[0] ?? null;
      const callAction = first?.phone
        ? withRisk({ type: "call_contact", label: `Call ${first.name}`, target: first.name, phone: first.phone })
        : withRisk({ type: "call_contact", label: "Call Tele-MANAS (14416)", target: "Tele-MANAS", phone: "14416" });

      if (classified.matched_rule === "emergency_contact_request") {
        if (!first) {
          return {
            answer: `I don't have anyone recorded to call for you, ${honorific}. The Tele-MANAS helpline is always open at 14416.`,
            asText: `মোৰ ওচৰত কাকো মাতিবলৈ নম্বৰ নাই। টেলি-মানস ১৪৪১৬ নম্বৰ সদায় খোলা আছে।`,
            intent: "emergency_contacts",
            action: withRisk({ type: "call_contact", label: "Call Tele-MANAS (14416)", target: "Tele-MANAS", phone: "14416" }),
          };
        }
        const others = reachable.slice(1, 3).map((p) => `${p.name} (${p.relationship.replace(/_/g, " ")})`);
        return {
          answer:
            `Call ${first.name}, your ${first.relationship.replace(/_/g, " ")} — ${first.phone}.` +
            (others.length ? ` If ${first.name} doesn't answer, there is ${others.join(", and ")}.` : ""),
          asText: `${first.name} ক মাতক — ${first.phone}।`,
          intent: "emergency_contacts",
          action: callAction,
        };
      }

      if (classified.matched_rule === "emotional_support") {
        // Meet the feeling first. No helpline script, no schedule, no attempt
        // to fix it -- and never a correction of what they are feeling.
        return {
          answer:
            `I'm here with you, ${honorific}. That sounds like a hard thing to be sitting with.` +
            (first ? ` Would you like me to call ${first.name}?` : ""),
          asText: `মই আপোনাৰ লগতে আছোঁ। এইটো সঁচাকৈ কঠিন কথা।`,
          intent: "emotional_support",
          action: first ? callAction : null,
        };
      }

      return {
        answer:
          `${honorific}, you are safe right now. I am right here with you.` +
          (first ? ` ${first.name} can be reached at ${first.phone}.` : "") +
          ` If you need someone, the Tele-MANAS helpline is always open at 14416.`,
        asText: `${honorific}, আপুনি এতিয়া সম্পূৰ্ণ সুৰক্ষিত আছে। মই আপোনাৰ লগত আছোঁ। সহায়ৰ বাবে টেলি-মানস ১৪৪১৬ নম্বৰত সদায় উপলব্ধ।`,
        intent: "crisis_support",
        action: withRisk({ type: "call_contact", label: "Call Tele-MANAS (14416)", target: "Tele-MANAS", phone: "14416" }),
      };
    }

    case "ORIENTATION":
    case "TEMPORAL": {
      // A question naming a specific person ("when is Rina coming?") is asking
      // about that person's event, not for the whole day's list -- answer it
      // directly and keep the precision the day list would blur.
      const stranger = unknownNameIn(opts.messageText, projection);
      if (stranger) {
        return {
          answer: `I don't have anyone called ${stranger} in your circle, ${honorific}.`,
          asText: `${stranger} নামৰ কাৰোবা তথ্য মোৰ ওচৰত নাই।`,
          intent: "person_unknown",
          action: null,
        };
      }

      const named = opts.messageText
        ? projection.people.find((p) => opts.messageText!.toLowerCase().includes(p.name.toLowerCase()))
        : null;
      if (named) {
        const tz = projection.currentContext.time_zone || DEFAULT_TIME_ZONE;
        const lower = named.name.toLowerCase();
        // Prefer the day-scoped row (it carries the day label the person asked
        // about); fall back to the general upcoming list.
        const dayHit = projection.day?.events.find(
          (e) => (e.person_name || "").toLowerCase() === lower || e.title.toLowerCase().includes(lower)
        );
        const upcomingHit = projection.today.upcoming.find(
          (e) => (e.person_name || "").toLowerCase() === lower || e.title.toLowerCase().includes(lower)
        );
        const hit = dayHit || upcomingHit;
        if (hit) {
          const clock = clockInZone(hit.scheduled_at, tz);
          const whenWord = dayHit ? (projection.currentContext.scope_label || "today") : dayLabelFor(hit.scheduled_at, projection);
          const past = dayHit?.past;
          return {
            answer: past
              ? `${hit.title} was ${whenWord} at ${clock}, ${honorific}.`
              : `${hit.title} is ${whenWord} at ${clock}, ${honorific}.`,
            asText: `${honorific}, ${clock} বজাত: ${hit.title}।`,
            intent: "day_orientation",
            action: withRisk({ type: "navigate", label: "See Today's Plan", target: "day" }),
          };
        }
        return {
          answer: `I don't have anything recorded with ${named.name}, ${honorific}.`,
          asText: `${named.name}ৰ লগত একো কাম লিখা নাই।`,
          intent: "day_orientation",
          action: null,
        };
      }

      const built = buildDayAnswer(projection, {
        honorific,
        continuation: classified.continuation,
        alreadyMentioned: opts.alreadyMentioned || [],
      });
      return {
        ...built,
        intent: "day_orientation",
        action: withRisk({ type: "navigate", label: "See Today's Plan", target: "day" }),
      };
    }

    case "PEOPLE": {
      const stranger = unknownNameIn(opts.messageText, projection);
      if (stranger && !opts.visibleEntityName) {
        return {
          answer: `I don't have anyone called ${stranger} in your circle, ${honorific}.`,
          asText: `${stranger} নামৰ কাৰোবা তথ্য মোৰ ওচৰত নাই।`,
          intent: "person_unknown",
          action: null,
        };
      }
      // Resolution order: a name in the question, then the person on screen,
      // then the relationship the question named. Only a question that named
      // nothing at all falls back to the closest contact.
      const namedRelationship = relationshipNamedIn(opts.messageText);
      const person =
        findPerson(projection, opts.messageText) ||
        findPerson(projection, opts.visibleEntityName) ||
        findPersonByRelationship(projection, namedRelationship) ||
        (namedRelationship ? null : projection.people[0]) ||
        null;

      if (!person && namedRelationship) {
        // The question named a relationship nobody in the data holds. Saying
        // so is correct; answering about a different relative is not.
        return {
          answer: `I don't have a ${namedRelationship} recorded in your circle, ${honorific}.`,
          asText: `আপোনাৰ তথ্যত ${namedRelationship} ৰ কোনো নথিপত্ৰ নাই।`,
          intent: "person_unknown",
          action: null,
        };
      }

      if (!person) {
        return {
          answer: `I don't have anyone in your circle to show yet, ${honorific}.`,
          asText: `এতিয়ালৈ আপোনাৰ পৰিয়ালৰ তথ্য পোৱা নাই।`,
          intent: "person_clarification",
          action: null,
        };
      }
      const relLabel = person.relationship.replace(/_/g, " ");
      return {
        answer: `This is your ${relLabel}, ${person.name}${person.phone ? `. You can call at ${person.phone}` : ""}.`,
        asText: `এয়া আপোনাৰ ${relLabel}, ${person.name}।`,
        intent: "person_clarification",
        action: person.phone ? withRisk({ type: "call_contact", label: `Call ${person.name}`, target: person.name, phone: person.phone }) : null,
      };
    }

    case "MEMORY": {
      const mem = pack.facts.find((f) => f.source_type === "memory_item");
      if (!mem) {
        return {
          answer: `I don't have that memory saved yet, ${honorific}. Would you like to tell me about it?`,
          asText: `এই স্মৃতিটো এতিয়ালৈ সংৰক্ষিত হোৱা নাই।`,
          intent: "life_memory",
          action: withRisk({ type: "navigate", label: "Open My Life", target: "life" }),
        };
      }
      return {
        answer: mem.text,
        asText: mem.text,
        intent: "life_memory",
        action: withRisk({ type: "navigate", label: "Open My Life", target: "life" }),
      };
    }

    case "GAME_ASSISTANCE": {
      return {
        answer: `You are doing wonderfully, ${honorific}. Take your time -- look closely, and trust what feels familiar.`,
        asText: `আপুনি বৰ সুন্দৰকৈ কৰিছে। লাহে-ধীৰে চাওক, আৰু আপোনাৰ মনত যিটো চিনাকি লাগে সেইটো বিশ্বাস কৰক।`,
        intent: "game_assistance",
        action: withRisk({ type: "provide_scaffold", label: "Show Gentle Visual Cue" }),
      };
    }

    case "GAME": {
      return {
        answer: `Let's do something meaningful together, ${honorific}.`,
        asText: `আহক, আমি একেলগে অৰ্থপূৰ্ণ কিবা এটা কৰোঁ।`,
        intent: "gentle_activity",
        action: withRisk({ type: "start_activity", label: "Start an Activity", target: "activity" }),
      };
    }

    case "MEDIA": {
      return {
        answer: `Here is some peaceful music for you, ${honorific}.`,
        asText: `আপোনাৰ বাবে এটা শান্ত সুৰ আছে।`,
        intent: "music_reassurance",
        action: withRisk({ type: "play_music", label: "Play Music", target: "life" }),
      };
    }

    case "ROUTINE":
    case "REMINDER": {
      const routines = projection.day?.routines || [];
      const meds = projection.day?.medications || [];
      if (routines.length === 0 && meds.length === 0) {
        // The old version silently fell back to the next *event* here, so a
        // question about routine was answered with an unrelated appointment.
        const built = buildDayAnswer(projection, {
          honorific,
          continuation: classified.continuation,
          alreadyMentioned: opts.alreadyMentioned || [],
        });
        return { ...built, intent: "routine_reassurance", action: withRisk({ type: "navigate", label: "See Today's Plan", target: "day" }) };
      }
      // A question that names one thing -- "when do I have lunch?", "what do I
      // do in the evening?" -- gets that thing, not the first three rows of the
      // day. Listing the whole morning in answer to a question about lunch is
      // the same precision failure as answering about the daughter when the
      // granddaughter was asked for.
      const asked = (opts.messageText || "").toLowerCase();
      const BUCKETS: Array<[RegExp, number, number]> = [
        [/\bmorning\b/, 5 * 60, 12 * 60],
        [/\bafternoon\b/, 12 * 60, 17 * 60],
        [/\bevening\b/, 17 * 60, 20 * 60],
        [/\bnight\b/, 20 * 60, 24 * 60],
      ];
      const named = routines.filter((r) => {
        const words = r.title.toLowerCase().match(/\p{L}{4,}/gu) || [];
        return words.some((w) => asked.includes(w));
      });
      const bucket = BUCKETS.find(([re]) => re.test(asked));
      const inBucket = bucket
        ? routines.filter((r) => {
            const m = minutesOfDay(r.time_of_day);
            return m !== null && m >= bucket[1] && m < bucket[2];
          })
        : [];
      const focused = named.length > 0 ? named : inBucket;

      if (focused.length > 0) {
        const said = focused
          .slice(0, 3)
          .map((r) => (r.time_of_day ? `${r.title} at ${r.time_of_day}` : r.title));
        return {
          answer: `${joinLabels(said)}, ${honorific}.`,
          asText: `${joinLabels(said)}。`,
          intent: "routine_reassurance",
          action: withRisk({ type: "navigate", label: "See Today's Plan", target: "day" }),
        };
      }

      const parts = [
        ...routines.map((r) => (r.time_of_day ? `${r.title} at ${r.time_of_day}` : r.title)),
        ...meds.filter((m) => !m.taken).map((m) => `${m.name} at ${m.scheduled_time}`),
      ];
      return {
        answer: `Your usual day: ${joinLabels(parts.slice(0, 3))}, ${honorific}.`,
        asText: `আপোনাৰ সাধাৰণ দিনটো: ${joinLabels(parts.slice(0, 3))}।`,
        intent: "routine_reassurance",
        action: withRisk({ type: "navigate", label: "See Today's Plan", target: "day" }),
      };
    }

    case "HELP": {
      const asking = (opts.messageText || "").toLowerCase();
      const isGrounding =
        /\b(where am i|where are we|whose house|what is this place|which place is this|am i at home|is this my home|how do i get home|take me home)\b/.test(
          asking
        );

      if (isGrounding) {
        // Answered from the person's own recorded home, never from a
        // comforting guess. A reassuring claim about where someone is, made
        // with no evidence, is the exact failure this whole layer exists to
        // prevent -- so with no home recorded it reassures without asserting
        // a location, and offers the person who can.
        const home =
          projection.places.find((p) => /home|house/i.test(p.name) || /home/i.test(p.significance || "")) || null;
        const caregiver =
          projection.people.find((p) => /daughter|son|caregiver|wife|husband/i.test(p.relationship)) ||
          projection.people[0] ||
          null;

        if (home) {
          return {
            answer: `You're at home, ${honorific} — ${home.name}. I'm right here with you.`,
            asText: `আপুনি নিজৰ ঘৰতে আছে — ${home.name}। মই আপোনাৰ লগতে আছোঁ।`,
            intent: "grounding",
            action: caregiver?.phone
              ? withRisk({ type: "call_contact", label: `Call ${caregiver.name}`, target: caregiver.name, phone: caregiver.phone })
              : null,
          };
        }

        return {
          answer: `I don't have your address recorded, ${honorific}, but I'm right here with you.${
            caregiver ? ` We can call ${caregiver.name} if you'd like.` : ""
          }`,
          asText: `আপোনাৰ ঠিকনা মোৰ ওচৰত লিখা নাই, কিন্তু মই আপোনাৰ লগতে আছোঁ।`,
          intent: "grounding",
          action: caregiver?.phone
            ? withRisk({ type: "call_contact", label: `Call ${caregiver.name}`, target: caregiver.name, phone: caregiver.phone })
            : null,
        };
      }

      // Otherwise: help with whatever surface the person is actually on, not
      // the same sentence on every page.
      const page = projection.currentContext.page || "day";
      const perPage: Record<string, { text: string; target: string }> = {
        day: { text: `You can ask me what's happening today, or who is coming.`, target: "day" },
        life: { text: `You can ask about your photographs, or the people in them.`, target: "life" },
        activity: { text: `You can say "let's do something", or ask me for a little help with what's open.`, target: "activity" },
        people: { text: `You can ask about anyone here, or ask me to call them.`, target: "people" },
        help: { text: `You can ask where you are, or ask me to call someone.`, target: "help" },
      };
      const guide = perPage[page] || perPage.day;

      return {
        answer: `I'm here, ${honorific}. ${guide.text}`,
        asText: `মই ইয়াতে আছোঁ। আপুনি মোক যিকোনো কথা সুধিব পাৰে।`,
        intent: "general_help",
        action: withRisk({ type: "navigate", label: "Stay here", target: guide.target }),
      };
    }

    case "ACTION": {
      return {
        answer: `Alright, ${honorific}. We can stop here.`,
        asText: `ঠিক আছে। আমি ইয়াতে ৰৈ যাব পাৰোঁ।`,
        intent: "stop_action",
        action: withRisk({ type: "navigate", label: "Back to My Day", target: "day" }),
      };
    }

    case "NAVIGATION": {
      return {
        answer: `Let me take you there, ${honorific}.`,
        asText: `আহক, মই আপোনাক তালৈ লৈ যাওঁ।`,
        intent: "navigation",
        action: withRisk({ type: "navigate", label: "Navigate", target: "day" }),
      };
    }

    default: {
      return {
        answer: `Namaskar ${honorific}. You are safe in your home, and I am right here beside you.`,
        asText: `নমস্কাৰ ${honorific}। আপুনি নিজৰ ঘৰত সুৰক্ষিত আছে, মই আপোনাৰ লগতে আছোঁ।`,
        intent: "general_companion",
        action: null,
      };
    }
  }
}
