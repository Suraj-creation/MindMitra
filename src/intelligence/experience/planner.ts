// The Experience Planner.
//
//   intent / trigger
//     -> candidate templates
//     -> query-shaped retrieval (firewalled)
//     -> deterministic composition from real records
//     -> validation
//     -> ExperienceSpec  |  an honest "I don't have enough saved information"
//
// No LLM call happens anywhere on this path. Section 67 is explicit that
// deterministic database logic should be used where it can answer the
// question, and selecting a template and filling it from typed rows is exactly
// that: an LLM would add latency, cost and a hallucination surface to a
// problem that is a join and a sort. The composed wording is fixed template
// text over real field values, which is why it cannot invent a family member.
//
// The seam for a future LLM pass is deliberate and narrow: it would rewrite
// `prompt` / `invitation_text` / `affirmation` strings only, and the same
// validator below would still have to pass. It would never choose entities,
// never author options, and never emit code.

import * as experienceRepo from "../../db/experience-repository";
import {
  ExperienceEvidence,
  gatherExperienceEvidence,
} from "./evidence";
import {
  EXPERIENCE_TEMPLATES,
  ExperienceTemplate,
  mergeNeeds,
  templateById,
} from "./templates";
import {
  ExperienceReason,
  ExperienceSpec,
  ExperienceTemplateId,
  ExperienceTrace,
  PlanResult,
} from "./types";
import { validateExperienceSpec } from "./validator";

export interface PlanRequest {
  personId: string;
  trigger: "lets_do_something" | "conversation" | "deep_link";
  /** The utterance that prompted this, when the trigger was conversation. */
  conversationText?: string;
  /** Caller may ask for a specific template (e.g. a chatbot follow-up). */
  preferTemplate?: ExperienceTemplateId;
  displayName?: string;
  honorific?: string;
  culture?: string;
  language?: string;
  timeZone?: string;
  /** Max options per question, from the person's capability context. */
  maxChoices?: number;
  difficulty?: 1 | 2 | 3;
}

/**
 * Which templates a conversation is asking for. Bounded keyword routing over
 * the same vocabulary the intent classifier already uses -- a request about
 * yesterday should not come back as a photograph of a river.
 */
export function templatesForConversation(text: string): ExperienceTemplateId[] {
  const t = (text || "").toLowerCase();
  const picked: ExperienceTemplateId[] = [];
  const add = (id: ExperienceTemplateId) => {
    if (!picked.includes(id)) picked.push(id);
  };

  if (/\b(yesterday|this morning|last night|earlier today|what did i do|what happened)\b/.test(t)) {
    add("EVENT_RECALL");
    add("WHO_WAS_THERE");
  }
  if (/\b(who came|who visited|who was (here|with)|came to see)\b/.test(t)) add("WHO_WAS_THERE");
  if (/\b(coming|visit|visiting|arriving|getting ready|prepare)\b/.test(t)) add("WHO_IS_COMING");
  if (/\b(photo|photograph|picture|album|who is this|look at)\b/.test(t)) {
    add("PERSON_RECOGNITION");
    add("PHOTO_MEMORY_RECALL");
  }
  if (/\b(daughter|son|granddaughter|grandson|family|husband|wife|sister|brother)\b/.test(t)) {
    add("PERSON_RECOGNITION");
    add("WHO_WAS_THERE");
  }
  if (/\b(remember|memory|used to|long ago|when i was)\b/.test(t)) add("PHOTO_MEMORY_RECALL");
  if (/\b(where|place|market|river|school|church|temple|home)\b/.test(t)) add("PLACE_RECOGNITION");
  if (/\b(routine|usually|after|next|order of|every day|everyday)\b/.test(t)) add("ROUTINE_SEQUENCE");

  return picked;
}

/**
 * Ordering when nothing more specific was asked for (Section 36).
 * Time of day nudges what is most likely to be meaningful right now; recent
 * history then rotates the order so the same template does not come up twice
 * in a row. Neither is a ban -- a template with good data still wins over an
 * empty one.
 */
function orderCandidates(
  templates: ExperienceTemplate[],
  ev: ExperienceEvidence,
  recent: experienceRepo.RecentExperienceSummary
): ExperienceTemplate[] {
  const timeBias: Record<string, ExperienceTemplateId[]> = {
    early_morning: ["ROUTINE_SEQUENCE", "WHO_IS_COMING"],
    morning: ["ROUTINE_SEQUENCE", "WHO_IS_COMING", "PHOTO_MEMORY_RECALL"],
    afternoon: ["WHO_IS_COMING", "EVENT_RECALL", "PERSON_RECOGNITION"],
    evening: ["EVENT_RECALL", "WHO_WAS_THERE", "PHOTO_MEMORY_RECALL"],
    night: ["PHOTO_MEMORY_RECALL", "PLACE_RECOGNITION"],
  };
  const preferred = timeBias[ev.now.time_of_day] ?? [];

  const score = (t: ExperienceTemplate): number => {
    let s = 0;
    const idx = preferred.indexOf(t.id);
    if (idx >= 0) s += 10 - idx;
    if (recent.recent_template_ids.includes(t.id)) s -= 6;
    if (recent.declined_template_ids.includes(t.id)) s -= 4;
    return s;
  };

  return [...templates].sort((a, b) => score(b) - score(a));
}

const NO_DATA_MESSAGE = "I don't have enough saved information for that one just now.";

/**
 * Plan one experience. Returns `no_data` rather than a weaker experience when
 * nothing qualifies -- offering a different activity is the caller's decision
 * to make, not something to paper over here.
 */
export async function planExperience(req: PlanRequest): Promise<PlanResult> {
  const startedAt = Date.now();
  const personId = req.personId;

  // 1. Candidate templates.
  let candidates: ExperienceTemplate[];
  if (req.preferTemplate) {
    const t = templateById(req.preferTemplate);
    candidates = t ? [t] : [];
  } else if (req.trigger === "conversation" && req.conversationText) {
    const ids = templatesForConversation(req.conversationText);
    // A conversation that points nowhere in particular still gets the full set:
    // "let's do something" is a valid thing to say.
    candidates = ids.length
      ? (ids.map(templateById).filter(Boolean) as ExperienceTemplate[])
      : [...EXPERIENCE_TEMPLATES];
  } else {
    candidates = [...EXPERIENCE_TEMPLATES];
  }

  const trace: ExperienceTrace = {
    requested_at: new Date().toISOString(),
    trigger: req.trigger,
    conversation_text: req.conversationText,
    candidate_templates: [],
    selected_template: null,
    retrieval: { plan: [], counts: {}, blocked: {} },
    entities_used: [],
    media_used: [],
    recent_experience: { recent_template_ids: [], declined_template_ids: [], suppressed_entity_ids: [] },
    validation: null,
    composed_by: "deterministic_composer",
    duration_ms: 0,
  };

  const finish = <T extends PlanResult>(r: T): T => {
    trace.duration_ms = Date.now() - startedAt;
    return r;
  };

  if (candidates.length === 0) {
    return finish({
      status: "no_data",
      message: NO_DATA_MESSAGE,
      detail: `No template matches request (preferTemplate=${req.preferTemplate ?? "none"}).`,
      trace,
    });
  }

  // 2. Query-shaped retrieval: only what these candidates actually need.
  const need = mergeNeeds(candidates);
  trace.retrieval.plan = Object.entries(need)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  if (need.dayOffsets?.length) trace.retrieval.plan.push(`days:${need.dayOffsets.join(",")}`);

  const [evidence, recent] = await Promise.all([
    gatherExperienceEvidence({
      personId,
      timeZone: req.timeZone,
      language: req.language,
      displayName: req.displayName,
      honorific: req.honorific,
      culture: req.culture,
      need,
    }),
    experienceRepo.getRecentExperience(personId).catch(() => ({
      recent_template_ids: [],
      declined_template_ids: [],
      suppressed_entity_ids: [],
      suggestions_in_window: 0,
    })),
  ]);

  trace.retrieval.counts = evidence.counts;
  trace.retrieval.blocked = evidence.blocked;
  trace.recent_experience = {
    recent_template_ids: recent.recent_template_ids,
    declined_template_ids: recent.declined_template_ids,
    suppressed_entity_ids: recent.suppressed_entity_ids,
  };

  // "I could not read your day" and "your day is empty" are different
  // sentences and must not collapse into one (Section 34 vs an outage).
  if (evidence.retrieval_failed && Object.values(evidence.counts).every((n) => n === 0)) {
    return finish({
      status: "no_data",
      message: "I can't look that up right now. Shall we try something else?",
      detail: "Retrieval failed for every requested source.",
      trace,
    });
  }

  // 3. Compose, in preference order, first template that has real data wins.
  const ordered = req.preferTemplate ? candidates : orderCandidates(candidates, evidence, recent);
  const ctxBase = {
    ev: evidence,
    suppressed: new Set(recent.suppressed_entity_ids),
    maxChoices: Math.max(2, Math.min(4, req.maxChoices ?? 3)),
  };

  for (const template of ordered) {
    const specId = `xsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const composed = template.compose({ ...ctxBase, seed: `${personId}:${template.id}:${specId}` });

    if (!composed) {
      trace.candidate_templates.push({
        template_id: template.id,
        eligible: false,
        reason: "not enough verified personal content, or no real distractors",
      });
      continue;
    }

    trace.candidate_templates.push({ template_id: template.id, eligible: true, reason: "composed" });

    const spec: ExperienceSpec = {
      spec_id: specId,
      person_id: personId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + template.freshness_hours * 3600_000).toISOString(),
      template_id: template.id,
      reason: template.reason as ExperienceReason,
      reason_detail: composed.reason_detail,
      title: composed.title,
      subtitle: composed.subtitle,
      invitation_text: composed.invitation_text,
      language: evidence.person.language,
      difficulty: req.difficulty ?? 1,
      modality: template.modality,
      steps: composed.steps,
      completion: {
        message: composed.completion_message,
        graceful_exit: "That's enough for now. We can come back to it whenever you like.",
      },
      measurement_plan: template.measurement,
      provenance: composed.provenance,
      safety: {
        no_score_shown: true,
        no_timer: true,
        no_failure_screen: true,
        skip_always_available: true,
        stop_always_available: true,
      },
    };

    // 4. Validate. A failure is a rejection, not a warning.
    const validation = validateExperienceSpec(spec, evidence);
    trace.validation = validation;
    trace.selected_template = template.id;
    trace.entities_used = Array.from(new Set(spec.steps.flatMap((s) => s.source_entity_ids)));
    trace.media_used = spec.steps
      .filter((s) => s.media)
      .map((s) => ({ media_id: s.media!.media_id, source: s.media!.source }));

    if (!validation.is_valid) {
      console.warn(
        `[Experience] ${template.id} rejected by validator for ${personId}: ${validation.rejection_reasons.join(" | ")}`
      );
      // Fall through to the next template rather than rendering it.
      trace.candidate_templates[trace.candidate_templates.length - 1] = {
        template_id: template.id,
        eligible: false,
        reason: `validation failed: ${validation.rejection_reasons[0]}`,
      };
      trace.selected_template = null;
      continue;
    }

    await experienceRepo.saveExperienceSpec({ spec, trace, validation }).catch((err) => {
      // A spec that could not be persisted is still safe to play right now;
      // only the deep link and the replay path are lost.
      console.warn("[Experience] spec not persisted:", err?.message || err);
    });

    return finish({ status: "ready", spec, trace });
  }

  return finish({
    status: "no_data",
    message: NO_DATA_MESSAGE,
    detail: `No candidate template had enough verified content. Counts: ${JSON.stringify(evidence.counts)}`,
    trace,
  });
}
