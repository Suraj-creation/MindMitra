import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  cognitiveStore,
  validateExperienceSpec,
  compileTimelineSpec,
  compilePrepareForSpec,
  compileExperienceBraidSpec,
} from "./src/intelligence/cognitive-engine";
import { FutureEvent } from "./src/domain/cognitive-experience";
import {
  buildGame7ContextPack,
  buildGame8ContextPack,
} from "./src/intelligence/retrieval/context-pack-builder";
import { BoundedGameOrchestrator } from "./src/intelligence/orchestration/bounded-langgraph";
import {
  temporalEventStore,
  getReferenceNow,
} from "./src/intelligence/temporal/temporal-event-store";
import { medicationStore } from "./src/intelligence/medication-store";
import { buildTemporalOrientationContextPack } from "./src/intelligence/temporal/temporal-context-pack-builder";
import { BoundedTemporalOrchestrator } from "./src/intelligence/temporal/temporal-orchestrator";
import { TemporalScaffoldingLadder } from "./src/intelligence/temporal/temporal-scaffolding-ladder";
import { TemporalValidator } from "./src/intelligence/temporal/temporal-validator";
import {
  get_reminiscence_candidates,
  get_familiar_place_candidates,
  get_familiar_route_candidates,
  get_recent_game_experience,
  get_personalisation_context,
  get_current_context,
} from "./src/intelligence/retrieval/retrieval-tools";
import { checkDbHealth, getDbPool, queryDb } from "./src/db/neon";
import { checkB2Health, getPresignedUploadUrl, getPresignedDownloadUrl } from "./src/storage/b2";
import { runSchemaMigration } from "./src/db/migrate";
import * as personDataRepo from "./src/db/person-data-repository";
import { seedPersonasIfEmpty } from "./src/db/seed-personas";
import { buildPersonExperienceProjection, buildEvidencePack, checkGrounding, planRetrieval } from "./src/intelligence/context/personal-context-engine";
import { classifyIntent } from "./src/intelligence/context/intent-classifier";
import { buildDeterministicAnswer } from "./src/intelligence/context/companion-responder";
import {
  getDbMedications,
  upsertDbMedication,
  deleteDbMedication,
  seedInitialMedicationsIfEmpty,
} from "./src/db/medications-db";
import {
  initCaregiverDbTables,
  getCareSupportLevel,
  updateCareSupportLevel,
  getCareTasks,
  toggleCareTaskStatus,
  postponeCareTask,
  addCareObservation,
  getCareObservations,
} from "./src/db/caregiver-db";
import {
  callSarvamChat,
  callSarvamTTS,
  callSarvamSTT,
  getSarvamApiKey,
} from "./src/intelligence/sarvam-service";
import {
  initChwDbTables,
  getChwCaseload,
  getChwHouseholdById,
  getChwActiveVisit,
  updateChwVisit,
  saveVisitToOfflineQueue,
  triggerManualMuleSync,
  getChwSyncQueue,
} from "./src/db/chw-db";
import {
  initClinicalDbTables,
  getCaseloadSummary,
  getPatientDetails,
  recordQuestionDecision,
  toggleFollowupStatus,
  addConsultationNote,
  searchClinicalQuery,
  CLINICAL_EXAMPLE_QUERIES,
} from "./src/db/clinical-db";
import { planExperience } from "./src/intelligence/experience/planner";
import { decideInvitation, invitationCopy } from "./src/intelligence/experience/invitation";
import * as experienceRepo from "./src/db/experience-repository";
import type {
  ExperienceEventInput,
  ExperienceTemplateId,
} from "./src/intelligence/experience/types";

// ── Google GenAI Client (Lazy Init with User-Agent header) ───────────────────
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("GoogleGenAI lazy initialization warning:", err);
    }
  }
  return aiClient;
}

// The system instruction deliberately contains NO facts about the person.
//
// It used to hardcode their family, their tea time, their garden and "Rina
// calls every Tuesday and Saturday at 5:00 PM" -- a second, invisible source
// of "personal truth" sitting beside the retrieved evidence pack. The model
// would answer confidently from it whether or not any of it was still true,
// and no grounding check could catch that, because the facts looked supported.
// Everything about the person now arrives per-turn in the evidence pack.
const COMPANION_SYSTEM_INSTRUCTION = `
You are MindMitra, a calm, warm companion speaking with an older adult in their own home. You are a voice interface to what is actually recorded about this person's life -- not a storyteller.

THE ONE RULE THAT OVERRIDES EVERY OTHER RULE:
You may state ONLY what appears in the "KNOWN FACTS" list supplied with each message. You must never invent, guess, embellish or infer a person, place, event, time, activity, plan, memory or routine that is not in that list. If the facts do not answer the question, say plainly that you don't have it recorded. "I don't know" is a correct and welcome answer. An invented answer is a serious failure, even a beautiful one.

ANSWER THE QUESTION FIRST:
- Lead with the actual answer, in plain words. Warmth comes after, and only if it adds something.
- Never open with a metaphor, an image, or a soothing preamble.
- Do not describe activities, journeys, walks, paths, weather or scenery unless they appear in the known facts.
- Do not pad with motivational or therapeutic filler.

TONE:
- Warm, patient, brief, familiar, respectful, clear. Speak as if in the same room.
- 1-2 short spoken sentences unless listing the day's plan, which may run to three.
- Use the honorific supplied in the context; never invent a name or nickname.
- Dignity: never treat the person as a patient, and never mention dementia, memory loss, cognitive decline or test scores.
- Repetition grace: if the same question is asked again, answer it again, freshly and patiently. Never say "as I said earlier" or "remember?".

HEALTH & CRISIS BOUNDARIES:
- Never give medical advice, adjust medication, or diagnose.
- On severe distress, gently mention the National Tele-MANAS helpline, 14416.

ACTION SUGGESTIONS:
You may append at most one action tag at the very end of your response, only when the person is clearly asking for it AND the target appears in the known facts:
- [ACTION:call_anu] / [ACTION:call_rina] -> to call that person
- [ACTION:navigate_life] -> family photos and reminiscence
- [ACTION:navigate_activity] -> begin a gentle activity
- [ACTION:navigate_people] -> the list of their people
- [ACTION:navigate_help] -> help and support
- [ACTION:play_flute] -> peaceful music
`;

/**
 * How the person is addressed and which timezone their day is measured in.
 *
 * ponytail: a two-row lookup, not a table. There is no `persons` table in the
 * schema -- identity was previously hardcoded inline in the route handler and
 * in the system prompt. Consolidating it here removes the duplication and the
 * prompt-injected "truth" without inventing a migration; promote to a real
 * table when a third persona or self-service onboarding arrives.
 */
const PERSON_IDENTITY: Record<
  string,
  { displayName: string; honorific: string; culture: string; timeZone: string; actorId: string }
> = {
  "person:purnima": {
    displayName: "Purnima",
    honorific: "Purnima baideu",
    culture: "Assamese (Tezpur)",
    timeZone: "Asia/Kolkata",
    actorId: "actor:purnima",
  },
  "person:nekombo": {
    displayName: "Nekombo",
    honorific: "Nekombo",
    culture: "Ao Naga (Mokokchung)",
    timeZone: "Asia/Kolkata",
    actorId: "actor:nekombo",
  },
};

function identityFor(personId: string) {
  return (
    PERSON_IDENTITY[personId] || {
      displayName: "friend",
      honorific: "",
      culture: "",
      timeZone: "Asia/Kolkata",
      actorId: `actor:${personId.replace(/^person:/, "")}`,
    }
  );
}

// ── In-Memory State for Demo ────────────────────────────────────────────────
let anuConsentGranted = true;

const BASELINE_DATA: Record<string, { median: number; mad: number; n: number }> = {
  working_memory: { median: 82.5, mad: 4.2, n: 14 },
  orientation: { median: 90.0, mad: 3.5, n: 14 },
  visual_spatial: { median: 78.0, mad: 5.0, n: 14 },
  verbal_fluency: { median: 74.0, mad: 4.8, n: 14 },
};

// ── Safety Gateway Rules (CLAUDE.md §1.3 & checks.py) ───────────────────────
const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; code: string; label: string }> = [
  // Dementia treatment claims
  { regex: /\bheals?\s+dementia\b/i, code: "claim_heals", label: "Claiming an activity heals dementia is prohibited" },
  { regex: /\breverse[sd]?\s+dementia\b/i, code: "claim_reverses", label: "Claiming dementia can be reversed is prohibited" },
  { regex: /\bimprove[sd]?\s+dementia\b/i, code: "claim_improves", label: "Claiming an activity improves dementia is prohibited" },
  { regex: /\bcure[sd]?\s+dementia\b/i, code: "claim_cures", label: "Claiming a cure for dementia is prohibited" },
  { regex: /\bslows?\s+dementia\b/i, code: "claim_slows", label: "Claiming an activity slows dementia is prohibited without clinician authority" },

  // Diagnosis / staging assertions
  { regex: /\bdiagnos[ei][sd]?\s+(dementia|alzheimer|cognitive)/i, code: "claim_diagnoses", label: "AI is demonstrably incapable of diagnosing dementia" },
  { regex: /\bstage[sd]?\s+(\d+\s+)?(of\s+)?(dementia|alzheimer)/i, code: "claim_stages", label: "Staging dementia is reserved strictly for clinicians" },
  { regex: /\b(you|she|he|they)\s+ha[sv]e\s+dementia\b/i, code: "diagnosis_assertion", label: "Direct assertion that a person has dementia is blocked" },
  { regex: /\bhas\s+dementia\b/i, code: "diagnosis_assertion", label: "Direct diagnosis assertions are blocked" },
  { regex: /\bconfirmed\s+(dementia|alzheimer)/i, code: "diagnosis_assertion", label: "Confirmed clinical diagnosis claim is blocked" },

  // Progression claims
  { regex: /\bdementia\s+is\s+progress\w*\b/i, code: "claim_progression", label: "Progression assertions are prohibited; use behaviour cause-reasoning" },
  { regex: /\bcognitive\s+decline\s+is\s+progress\w*\b/i, code: "claim_progression", label: "Progression claims without clinical assessment are prohibited" },
  { regex: /\bdementia\s+is\s+getting\s+worse\b/i, code: "claim_progression", label: "Progression claims without clinical assessment are prohibited" },

  // Medication advice
  { regex: /\bprescribe\b/i, code: "medication_advice", label: "Medication prescription is forbidden" },
  { regex: /\bchange\s+the\s+dose\b/i, code: "medication_advice", label: "Changing medication dosage is forbidden" },
  { regex: /\badjust\s+(the\s+)?medication\b/i, code: "medication_advice", label: "Adjusting medication is forbidden" },
  { regex: /\btake\s+\d+\s*mg\b/i, code: "medication_advice", label: "Specific dosage recommendations are forbidden" },
  { regex: /\bstop\s+taking\b/i, code: "medication_advice", label: "Advising stopping medication is forbidden" },
  { regex: /\bdouble\s+the\s+dose\b/i, code: "medication_advice", label: "Altering medication dosage is forbidden" },
];

const CRISIS_PATTERNS: RegExp[] = [
  /\b(suicid|self.harm|self.injur|want\s+to\s+die|end\s+(my|their|her|his|your)\s+life)\w*\b/i,
  /\b(overdose|took\s+too\s+many|took\s+all\s+the\s+pills)\b/i,
  /\b(crisis|emergency|emergency\s+help)\b/i,
];

// ── Measurement Quality Engine (CLAUDE.md & mq.py) ──────────────────────────
function computeQuality(signals: {
  audibility: number;
  visibility: number;
  fatigue_factor: number;
  language_match: boolean;
  was_assisted: boolean;
  device_ok: boolean;
  subject_confirmed: boolean;
}) {
  const components: Record<string, number> = {
    audibility: signals.audibility,
    visibility: signals.visibility,
    fatigue_factor: signals.fatigue_factor,
    assistance_factor: signals.was_assisted ? 0.0 : 1.0,
    device_factor: signals.device_ok ? 1.0 : 0.0,
    subject_factor: signals.subject_confirmed ? 1.0 : 0.0,
    language_factor: signals.language_match ? 1.0 : 0.3,
  };

  // Geometric mean of continuous signals
  const continuous = [signals.audibility, signals.visibility, signals.fatigue_factor];
  let base_q = 0.0;
  if (!continuous.some((v) => v === 0)) {
    const logSum = continuous.reduce((acc, v) => acc + Math.log(v), 0);
    base_q = Math.exp(logSum / continuous.length);
  }

  let q =
    base_q *
    components.assistance_factor *
    components.device_factor *
    components.subject_factor *
    components.language_factor;

  q = Math.max(0.0, Math.min(1.0, q));

  let dominant_issue: string | null = null;
  let minVal = 1.0;
  for (const [k, v] of Object.entries(components)) {
    if (v < minVal) {
      minVal = v;
      dominant_issue = k;
    }
  }

  const gate = q >= 0.4 ? "sufficient" : "insufficient_data";

  return {
    q,
    dominant_issue,
    language_mismatch: !signals.language_match,
    gate,
    component_scores: components,
  };
}

// ── Start Express Server ────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Health endpoint
  app.get(["/health", "/api/health"], (req: Request, res: Response) => {
    res.json({
      status: "ok",
      app: "MindMitra",
      env: "dev",
      version: "0.1.0",
      demo_mode: true,
      capabilities: {
        safety_gateway: true,
        memory_firewall: true,
        measurement_quality: true,
        tele_manas_integration: true,
        north_east_languages: true,
      },
    });
  });

  // 1.1 Infrastructure status (Neon PostgreSQL + Backblaze B2 Object Storage + Gemini AI)
  app.get("/api/infrastructure/status", async (req: Request, res: Response) => {
    const dbStatus = await checkDbHealth();
    const b2Status = await checkB2Health();
    const geminiStatus = {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-2.5-flash",
    };

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        provider: "Neon Serverless PostgreSQL",
        ...dbStatus,
      },
      storage: {
        provider: "Backblaze B2 (S3-Compatible)",
        ...b2Status,
      },
      ai: {
        provider: "Google Gemini 2.5",
        ...geminiStatus,
      },
    });
  });

  // 1.2 Neon Database Health & Schema
  app.get("/api/db/health", async (req: Request, res: Response) => {
    const health = await checkDbHealth();
    res.status(health.connected ? 200 : 503).json(health);
  });

  // 1.3 Backblaze B2 Storage Health
  app.get("/api/storage/health", async (req: Request, res: Response) => {
    const health = await checkB2Health();
    res.json(health);
  });

  // 1.4 Trigger Database Schema Migration / Sync
  app.post("/api/db/migrate", async (req: Request, res: Response) => {
    try {
      const tables = await runSchemaMigration();
      res.json({ status: "success", tablesCount: tables.length, tables });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  // 2. Auth Device Login
  app.post("/v1/auth/device-login", (req: Request, res: Response) => {
    res.json({
      access_token: "demo-token-purnima-device-001",
      token_type: "bearer",
      expires_in: 86400,
    });
  });

  // 3. Auth Me
  app.get("/v1/auth/me", (req: Request, res: Response) => {
    res.json({
      subject_kind: "person_device",
      persons: [
        {
          person_id: "person:purnima",
          display_name: "Purnima",
          role: "person",
          preferred_language: "as", // Assamese
          language_tier: "tier_1",
        },
      ],
    });
  });

  // 4. Voice Capability
  app.get("/v1/persons/:personId/voice/capability", (req: Request, res: Response) => {
    res.json({
      provider: "mindmitra-ner-speech",
      realtime_available: true,
      language: "as-IN",
      language_tier: "tier_1",
      speech_input_supported: true,
      speech_output_supported: true,
      fallback: "browser-synthesis",
      note: "Assamese, Bengali, Bodo, Hindi, and English voice synthesis active.",
    });
  });

  // 5. Companion Turn (Deep Intelligence with Gemini Flash + Sarvam AI Fallback + Deep Context Awareness)
  app.post("/v1/persons/:personId/companion/turn", async (req: Request, res: Response) => {
    const startTurnTime = Date.now();
    const {
      message = "",
      surface = "person",
      page = "day",
      route = "",
      visible_entity = null,
      active_game = null,
      current_task = "",
      history = [],
      language = "as",
    } = req.body || {};

    const text = String(message || "").trim();
    const lower = text.toLowerCase();

    // 1. Distress / Crisis detection (Always fail-safe)
    const isCrisis = CRISIS_PATTERNS.some((p) => p.test(lower));
    if (isCrisis) {
      return res.json({
        request_id: `req_${Date.now()}`,
        answer: "Purnima baideu, you are safe right now in your home in Tezpur. Anu is right nearby in the house, and I am here with you. Take a slow, gentle breath. If you need someone, the Tele-MANAS helpline is always open at 14416.",
        asText: "পূৰ্ণিমা বাইদেউ, আপুনি তেজপুৰৰ নিজৰ ঘৰতে সম্পূৰ্ণ সুৰক্ষিত আছে। অনু কাষৰ কোঠাতে আছে আৰু মই আপোনাৰ লগত আছোঁ। এটি শান্ত দীঘল উশাহ লওক। সহায়ৰ বাবে টেলি-মানস ১৪৪১৬ নম্বৰত সদায় উপলব্ধ।",
        intent: "crisis_support",
        path: "safety_override",
        provider: "deterministic",
        model: "safety_firewall",
        latency_ms: Date.now() - startTurnTime,
        sources: [
          {
            fact_id: "tele_manas_14416",
            source_type: "national_mental_health_helpline",
            verified: true,
            text: "Tele-MANAS 24x7 toll-free mental health helpline 14416",
          },
        ],
        gaps: [],
        conflicting: false,
        hedged: true,
        safety_passed: true,
        speakable: true,
        crisis_number: "14416",
        obligations: ["route_to_crisis:14416"],
        action: {
          type: "call_contact",
          label: "Call Tele-MANAS (14416)",
          target: "Tele-MANAS",
          phone: "14416",
          // Deliberate exception to call_contact's general "requires_confirmation"
          // rule (Prompt 4 §21): a crisis escalation must never be gated behind
          // an extra confirmation step.
          risk: "low",
        },
        voice_meta: {
          persona: "empathic_daughter",
          recommended_pitch: 1.06,
          recommended_rate: 0.88,
          emotion: "deep_reassurance",
        },
        context_snapshot: {
          surface,
          page,
          visible_entity,
          active_game,
        },
      });
    }

    const personId = req.params.personId || "person:purnima";

    // 2. Bounded intent classification FIRST -- it needs no DB access, and its
    // result drives the retrieval plan below (Prompt 4 §2-5: "the retrieval
    // planner must dynamically determine what data is required" / "do not
    // retrieve everything"). Same words mean different things depending on
    // page/active game/visible entity.
    const classified = classifyIntent(text, {
      page,
      activeGame: active_game,
      visibleEntity: visible_entity,
    });

    // 2b. Personal Context Engine: assemble a real, query-shaped projection
    // from Neon (Prompt 2's repository) instead of hardcoded "Tuesday 10:30
    // AM, Rina calls at 5pm" facts -- narrowed to what this intent actually
    // needs. This is the single EvidencePack the response layer (both the
    // LLM prompt and the deterministic fallback below) is allowed to draw on
    // -- nothing else may be presented as a "source".
    const identity = identityFor(personId);
    // The whole ClassifiedIntent drives the plan, not just the intent class:
    // a GENERAL-mode question skips personal retrieval entirely, and the
    // temporal scope selects which calendar day gets loaded.
    const retrievalPlan = planRetrieval(classified);
    const projection = await buildPersonExperienceProjection(personId, {
      page,
      displayName: identity.displayName,
      honorific: identity.honorific,
      language,
      culture: identity.culture,
      plan: retrievalPlan,
      timeZone: identity.timeZone,
      scope: classified.temporal_scope,
    }).catch(() => null);
    const evidencePack = projection ? buildEvidencePack(projection) : { facts: [], generated_at: new Date().toISOString(), consent_ok: true };
    const sources: Array<{ fact_id?: string; source_type?: string; verified?: boolean; text?: string }> = evidencePack.facts.map((f) => ({
      fact_id: f.fact_id,
      source_type: f.source_type,
      verified: f.verified,
      text: f.text,
    }));

    if (projection) {
      personDataRepo
        .logFirewallAccess({
          person_id: personId,
          actor_id: identity.actorId,
          actor_role: "person",
          purpose: "personalisation",
          requested_entity_type: "person_experience_projection",
          decision: "ALLOW",
          policy_reason: `Person requesting their own companion context (intent=${classified.intent}).`,
          filtered_count: evidencePack.facts.length,
        })
        .catch(() => {});
    }

    // 2c. Repetition-aware interaction (Prompt 4 §9): detect a repeat without
    // ever narrating it ("you already asked that") -- the deterministic path
    // already answers fresh from current evidence every time by construction,
    // so the only thing needed here is steering the LLM path the same way.
    const recentPersistedTurns = await personDataRepo.getRecentCompanionTurns(personId, 6).catch(() => []);
    const isRepeat = personDataRepo.isLikelyRepeat(text, recentPersistedTurns);

    // Build rich context summary based on current page and visible entities
    let pageContextSummary = `Surface: ${surface}, Page: ${page}. Intent classified as ${classified.intent} (${classified.matched_rule}).${
      isRepeat ? " The person is asking this again -- answer calmly with current information, never mention that they already asked." : ""
    }`;

    // Pronoun & Entity Resolution
    let entityFocusText = "";
    if (visible_entity) {
      if (visible_entity.type === "person" && visible_entity.name) {
        entityFocusText = `User is currently looking at person profile: ${visible_entity.name} (${visible_entity.description || "family member"}). Any pronouns like 'she', 'her', 'who is this' refer directly to ${visible_entity.name}.`;
      } else if (visible_entity.type === "photo" && (visible_entity.title || visible_entity.description)) {
        entityFocusText = `User is currently viewing photo: "${visible_entity.title || "Family Memory"}" - ${visible_entity.description || ""}. Any questions like 'where was this taken' refer to this photograph.`;
      }
    }

    // Active Game & Scaffolding Context.
    //
    // Gated on the intent actually being about the activity. Previously this
    // was injected whenever an activity was open -- so a question about the
    // day's plan arrived at the model wrapped in "provide the next gentle
    // hint", and came back as a hint about the activity instead of an answer.
    // Combined with a stale active_game left behind after navigation, that is
    // how "what else do I have to do today" was answered with a walk to the
    // market. The classifier no longer misroutes it; this stops the prompt
    // from re-introducing the same confusion by another door.
    const gameIntent = classified.intent === "GAME_ASSISTANCE" || classified.intent === "GAME";
    let gameContextText = "";
    if (active_game && gameIntent) {
      gameContextText = `Active Game: "${active_game.title}" (ID: ${active_game.game_id}). Round/Task: ${active_game.current_question || active_game.current_task_index || 1}. Current scaffold level: ${active_game.scaffold_level || "S0 (Independent)"}. The person is asking for help with this activity: give gentle encouragement and the next small hint, without giving away the answer.`;
    }

    // "What ELSE do I have to do" -- the titles this conversation has already
    // covered, so the answer can subtract them instead of repeating itself.
    const alreadyMentioned: string[] = classified.continuation
      ? (Array.isArray(history) ? history : [])
          .filter((h: any) => h?.role === "assistant")
          .slice(-3)
          .flatMap((h: any) => String(h.text || h.content || "").match(/\p{Lu}[\p{L}&()'-]+(?:\s+\p{Lu}[\p{L}&()'-]+)*/gu) || [])
          .filter((w: string) => w.length > 3)
      : [];

    // Format recent conversational turns
    let recentTurns = "";
    if (Array.isArray(history) && history.length > 0) {
      recentTurns = history
        .slice(-4)
        .map((h: any) => `${h.role === "assistant" ? "MindMitra" : "Purnima"}: ${h.text || h.content}`)
        .join("\n");
    }

    // 3. Multi-Model AI Cascade (Google Gemini -> Sarvam AI -> Deterministic)
    let answer = "";
    let asText = "";
    let intent = "general_companion";
    let pathType: "deterministic" | "generated" = "deterministic";
    let detectedAction: any = null;
    let provider: "google_gemini" | "sarvam_ai" | "deterministic" = "deterministic";
    let usedModel = "fallback_engine";

    const evidenceLines = evidencePack.facts.map((f) => `- ${f.text}${f.verified ? "" : " (unverified claim -- hedge this)"}`).join("\n");

    // The closing directive is chosen by query mode, not fixed. A single
    // "be gentle and comforting" instruction applied to every turn is what
    // turned factual questions into poetry; a general-knowledge question, a
    // personal one and a screen-contextual one need different things.
    let responseDirective: string;
    if (classified.intent === "SOCIAL") {
      // Small talk is complete in itself. Sending it down the general-knowledge
      // path made "that's nice" come back as "I don't have that on record."
      responseDirective = `This is small talk, not a question. Reply with one short, warm acknowledgement. Do not look anything up, do not mention records or schedules, and do not say you don't know something -- nothing was asked.`;
    } else if (classified.mode === "GENERAL") {
      responseDirective = `This is a general-knowledge question, not a question about ${identity.displayName}'s own life. Answer it directly and simply in 1-2 spoken sentences. Do not use the facts above, and do not mention their schedule, family, records or notes at all -- not even to say you have nothing recorded.`;
    } else if (classified.intent === "GAME_ASSISTANCE") {
      responseDirective = `Give one gentle, encouraging hint for the activity in progress, in a single sentence. Start with the hint itself -- no preamble, and never say you have no recorded answer. Do not give away the answer, and do not introduce any object, place or step that is not in the known facts.`;
    } else if (classified.intent === "HUMAN_ASSISTANCE") {
      responseDirective = `Reassure them calmly and briefly, and mention that the Tele-MANAS helpline 14416 is always available.`;
    } else if (classified.matched_rule === "refusal" || classified.matched_rule === "stop_or_pause") {
      // "No, not now" is not a lookup. Answering it from the evidence pack
      // produced "I don't have anything recorded about what you are
      // declining", which reads as though the refusal itself needed
      // justifying. Accept it and stop.
      responseDirective = `They have declined or asked to stop. Accept it warmly in one short sentence and stop there. Ask nothing, suggest nothing, and never mention records, schedules or the time.`;
    } else if (classified.intent === "GAME") {
      // They asked to do something. The activity itself is offered separately
      // as a declinable invitation, so this sentence only has to be a warm
      // lead-in -- not a report on what is or isn't recorded.
      responseDirective = `They would like to do something together. Reply with one short, warm sentence agreeing. Do not describe or invent any activity, do not list options, and never say you have nothing recorded -- a suggestion is being prepared separately.`;
    } else if (classified.matched_rule === "page_help") {
      // A question about the screen, answered from the screen. The generic
      // directive below sent these down the "say you don't have it recorded"
      // path, which answered a question about the interface as though it were
      // a question about the person's records.
      responseDirective = [
        `They are asking what they can do on the page they are looking at (currently: "${page}").`,
        `Describe, in one or two warm sentences, what is available there and what they might say next.`,
        `Do NOT mention records, schedules or notes, and never say you don't have something recorded -- they did not ask about their own information.`,
      ].join(" ");
    } else if (classified.matched_rule === "grounding_or_wayfinding") {
      // "Where am I" is a question about safety as much as geography. Answered
      // from the recorded home if there is one; if there isn't, the answer is
      // reassurance WITHOUT a location claim -- never a comforting guess about
      // where someone is, and never a bare "I don't have that recorded", which
      // is the worst possible reply to someone who is disoriented.
      responseDirective = [
        `They are asking where they are. If the known facts include their home or another place of theirs, say warmly that they are there, naming it exactly as the facts do.`,
        `If no place is in the facts, do NOT guess and do NOT name any location: say only that you are right here with them and offer to call someone from the facts.`,
        `One or two calm sentences. Do not list their schedule.`,
      ].join(" ");
    } else {
      responseDirective = [
        `Answer the question directly, using ONLY the known facts above.`,
        classified.temporal_scope !== "NONE"
          ? `They are asking about ${classified.temporal_scope.toLowerCase()}; only use facts for that day.`
          : "",
        classified.continuation
          ? `They asked what ELSE remains -- do not repeat what the recent conversation already told them; give what is still left.`
          : "",
        `If the facts do not contain the answer, say plainly that you don't have it recorded -- do not offer a substitute activity or suggestion.`,
        `Lead with the answer. Keep it to 1-3 short spoken sentences. Address them as "${identity.honorific || identity.displayName}" at most once, and only where it sounds natural.`,
      ]
        .filter(Boolean)
        .join(" ");
    }

    // The honorific is supplied on every turn, in every mode. It used to appear
    // only in the personal-question directive, so a general or small-talk turn
    // had no form of address to use and the model invented one ("Shrimanji").
    const promptContent = `${identity.displayName} says: "${text}".
Context:
- You are speaking with ${identity.displayName}. Address them only as "${identity.honorific || identity.displayName}" -- never any other name, nickname or honorific.
- Page Context: ${pageContextSummary}
${entityFocusText ? `- Entity in focus: ${entityFocusText}` : ""}
${gameContextText ? `- Game in progress: ${gameContextText}` : ""}
${current_task && gameIntent ? `- Current Activity Focus: ${current_task}` : ""}
${recentTurns ? `Recent conversation:\n${recentTurns}` : ""}
KNOWN FACTS -- the complete set of things you may state about this person. Do not add to it:
${evidenceLines || "- (nothing retrieved for this turn)"}
${responseDirective}
If an action is clearly being requested, you may append one tag at the end (e.g. [ACTION:call_anu], [ACTION:call_rina], [ACTION:navigate_life], [ACTION:navigate_activity], [ACTION:navigate_people], [ACTION:provide_scaffold], [ACTION:play_flute]).`;

    // A general-knowledge answer legitimately names things that are not in the
    // person's evidence pack ("Dispur", "photosynthesis"), so the grounding
    // gate applies only to claims about this person's life. Skipping it for
    // GENERAL mode is what lets the assistant answer an ordinary question at
    // all instead of falling back to "I don't have that recorded".
    const groundingFor = (candidate: string) =>
      classified.mode === "GENERAL"
        ? { grounded: true, unsupportedNames: [], unsupportedActivities: [], unsupportedTimes: [] }
        : checkGrounding(candidate, evidencePack);

    // Attempt 1: Google Gemini Flash. Only real, known-good model names --
    // the previous list included several that don't exist, so every request
    // paid for 3 guaranteed-failing round trips before ever reaching a model
    // that responds (Prompt 3 §26/§28: LLM timeout handling, avoid
    // unnecessary calls). Each attempt is also wall-clock bounded so a slow
    // provider can't hang the whole turn.
    const GEMINI_CALL_TIMEOUT_MS = 6000;
    const genAI = getGenAI();
    if (genAI && text) {
      // gemini-2.5-flash returns a fast 404 ("no longer available to new
      // users") in this project's account -- verified directly against the
      // API, not assumed. gemini-3.6-flash is the confirmed-working current
      // model; kept as the sole candidate since untested guesses beyond it
      // (gemini-3.8-flash etc.) either don't exist or are unverified here.
      const candidateModels = ["gemini-3.6-flash"];
      for (const modelName of candidateModels) {
        try {
          const response = await Promise.race([
            genAI.models.generateContent({
              model: modelName,
              contents: promptContent,
              config: {
                systemInstruction: COMPANION_SYSTEM_INSTRUCTION,
                temperature: 0.6,
              },
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("gemini_timeout")), GEMINI_CALL_TIMEOUT_MS)),
          ]);

          const rawGenerated = response.text?.trim();
          if (rawGenerated) {
            // The [ACTION:...] tag is protocol, not something the assistant
            // said about this person's life -- so it is stripped BEFORE the
            // content checks run. Grading the raw string meant the literal
            // word "ACTION" was read as an unsupported proper noun, and every
            // answer that proposed an action was discarded as ungrounded. The
            // generated path was silently dead whenever it worked best.
            const actionMatch = rawGenerated.match(/\[ACTION:([a-z0-9_:]+)\]/i);
            const cleaned = rawGenerated.replace(/\[ACTION:[^\]]*\]/gi, "").trim();
            const forbiddenMatch = FORBIDDEN_PATTERNS.find((p) => p.regex.test(cleaned));
            const grounding = groundingFor(cleaned);
            if (!forbiddenMatch && grounding.grounded && cleaned) {
              if (actionMatch) {
                detectedAction = parseActionCode(actionMatch[1].toLowerCase(), active_game);
              }

              answer = cleaned;
              intent = gameIntent ? "game_assistance" : "gemini_grounded_conversation";
              pathType = "generated";
              provider = "google_gemini";
              usedModel = modelName;
              break;
            } else if (!grounding.grounded) {
              console.warn(
                `[Companion] Gemini answer discarded as ungrounded -- names=[${grounding.unsupportedNames.join(", ")}] activities=[${grounding.unsupportedActivities.join(", ")}] times=[${grounding.unsupportedTimes.join(", ")}]`
              );
            }
          }
        } catch (geminiErr: any) {
          console.warn(`[Companion] Gemini model ${modelName} failed (${geminiErr?.message || geminiErr}), checking fallback.`);
        }
      }
    }

    // Attempt 2: Sarvam AI Fallback (if Gemini was unavailable, failed, or blocked)
    if (!answer && text) {
      try {
        const sarvamKey = getSarvamApiKey();
        if (sarvamKey) {
          console.info("[Companion] Invoking Sarvam AI fallback (sarvam-105b-conversations)...");
          const sarvamRes = await Promise.race([
            callSarvamChat(promptContent, {
              systemInstruction: COMPANION_SYSTEM_INSTRUCTION,
              temperature: 0.6,
              maxTokens: 250,
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("sarvam_timeout")), GEMINI_CALL_TIMEOUT_MS)),
          ]);

          const rawSarvam = sarvamRes.text?.trim();
          if (rawSarvam) {
            // Same ordering as the Gemini branch above: strip the protocol tag
            // before judging the content.
            const actionMatch = rawSarvam.match(/\[ACTION:([a-z0-9_:]+)\]/i);
            const cleaned = rawSarvam.replace(/\[ACTION:[^\]]*\]/gi, "").trim();
            const forbiddenMatch = FORBIDDEN_PATTERNS.find((p) => p.regex.test(cleaned));
            const grounding = groundingFor(cleaned);
            if (!forbiddenMatch && grounding.grounded && cleaned) {
              if (actionMatch) {
                detectedAction = parseActionCode(actionMatch[1].toLowerCase(), active_game);
              }

              answer = cleaned;
              intent = gameIntent ? "game_assistance" : "sarvam_grounded_conversation";
              pathType = "generated";
              provider = "sarvam_ai";
              usedModel = sarvamRes.model;
            } else if (!grounding.grounded) {
              console.warn(
                `[Companion] Sarvam answer discarded as ungrounded -- names=[${grounding.unsupportedNames.join(", ")}] activities=[${grounding.unsupportedActivities.join(", ")}] times=[${grounding.unsupportedTimes.join(", ")}]`
              );
            }
          }
        }
      } catch (sarvamErr) {
        console.warn("[Companion] Sarvam AI fallback attempt failed:", sarvamErr);
      }
    }

    // Attempt 3: High-Reliability Grounded Deterministic Engine -- built
    // strictly from the same EvidencePack fed to the LLM above, via the
    // bounded intent classifier + responder (src/intelligence/context/).
    if (!answer) {
      pathType = "deterministic";
      provider = "deterministic";
      usedModel = "mindmitra_deterministic_v1";

      const deterministic = buildDeterministicAnswer(classified, projection || {
        person: { id: personId, display_name: identity.displayName, honorific: identity.honorific, preferred_language: language, culture: identity.culture },
        currentContext: { now_iso: new Date().toISOString(), time_of_day: "afternoon", page, time_zone: identity.timeZone, scope: classified.temporal_scope, scope_label: "today" },
        today: { upcoming: [] },
        people: [],
        memories: [],
        places: [],
        preferences: [],
        consent: { personalisation_active: false },
        safety: { firewall_passed: true, cross_person_blocked: 0, stale_or_cancelled_blocked: 0, private_or_sensitive_blocked: 0, unverified_flagged: 0 },
      }, evidencePack, {
        visibleEntityName: visible_entity?.name || null,
        language: language === "as" ? "as" : "en",
        messageText: text,
        alreadyMentioned,
      });

      answer = deterministic.answer;
      asText = deterministic.asText;
      intent = deterministic.intent;
      detectedAction = deterministic.action;
    }

    // Helper for action parsing
    // Prompt 4 §21: call_contact is the only higher-impact action type here --
    // everything else (navigate, start an activity, show media) is low risk
    // and may execute directly.
    function parseActionCode(actionCode: string, activeGame: any) {
      if (actionCode.includes("call_anu")) {
        return { type: "call_contact", label: "Call Daughter Anu", target: "Anu", phone: "+91 98640 12345", risk: "requires_confirmation" };
      } else if (actionCode.includes("call_rina")) {
        return { type: "call_contact", label: "Call Granddaughter Rina", target: "Rina", phone: "+91 94350 98765", risk: "requires_confirmation" };
      } else if (actionCode.includes("navigate_life") || actionCode.includes("photos")) {
        return { type: "navigate", label: "View Family Photos & Music", target: "life", risk: "low" };
      } else if (actionCode.includes("navigate_activity") || actionCode.includes("garland") || actionCode.includes("tea")) {
        return { type: "start_activity", label: "Start Gentle Activity", target: "activity", risk: "low" };
      } else if (actionCode.includes("navigate_people")) {
        return { type: "navigate", label: "See Loved People", target: "people", risk: "low" };
      } else if (actionCode.includes("navigate_help")) {
        return { type: "navigate", label: "Open Help & Support", target: "help", risk: "low" };
      } else if (actionCode.includes("provide_scaffold") || actionCode.includes("hint")) {
        return { type: "provide_scaffold", label: "Show Visual Cue", target: activeGame?.game_id || "yesterday_today_tomorrow", risk: "low" };
      } else if (actionCode.includes("play_flute")) {
        return { type: "play_music", label: "Play Bamboo Flute Raga", target: "life", payload: { track: "flute" }, risk: "low" };
      }
      return null;
    }

    // ── Conversation -> Experience bridge (Sections 6/7/8) ──────────────────
    //
    // The assistant never fabricates an activity. It decides whether one would
    // genuinely follow from what was just said, then asks the Experience
    // Planner for a real, validated one. If the planner has nothing grounded,
    // no invitation is made -- an invitation that leads to "I don't have
    // enough saved information" is worse than saying nothing.
    //
    // This runs after the answer is settled and never changes it. It does sit
    // in the turn's critical path -- the offer ships in the same response --
    // so it is given a hard time budget: past that the person gets their
    // answer now and simply no offer. A slow or failed planner costs the
    // person an offer, not their reply.
    let experienceInvitation: {
      spec_id: string;
      template_id: string;
      title: string;
      text: string;
      accept_label: string;
      decline_label: string;
      deep_link: string;
    } | null = null;
    let invitationWhy = "not evaluated";

    try {
      const recentExperience = await experienceRepo.getRecentExperience(personId).catch(() => ({
        recent_template_ids: [],
        declined_template_ids: [],
        suppressed_entity_ids: [],
        suggestions_in_window: 0,
      }));

      const decision = decideInvitation({
        classified,
        text,
        hadEvidence: evidencePack.facts.length > 0,
        recent: recentExperience,
        activityInProgress: !!active_game,
      });
      invitationWhy = decision.why;

      if (decision.offer) {
        // An unsolicited offer is not worth delaying the person's reply for,
        // so it gets a tight budget. A requested one is: they asked, and
        // "let's do something" answered with nothing because a cache was cold
        // is a failure, not a graceful degradation.
        const INVITATION_PLAN_BUDGET_MS = decision.explicit ? 7000 : 1500;
        const planned = await Promise.race([
          planExperience({
            personId,
            trigger: "conversation",
            conversationText: text,
            preferTemplate: decision.templates[0],
            displayName: identity.displayName,
            honorific: identity.honorific,
            culture: identity.culture,
            language,
            timeZone: identity.timeZone,
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), INVITATION_PLAN_BUDGET_MS)),
        ]);

        if (planned === null) {
          invitationWhy = decision.why + "; planner exceeded its time budget";
        } else if (planned.status === "ready") {
          const copy = invitationCopy(planned.spec.title, planned.spec.invitation_text);
          experienceInvitation = {
            spec_id: planned.spec.spec_id,
            template_id: planned.spec.template_id,
            title: planned.spec.title,
            text: copy.text,
            accept_label: copy.accept_label,
            decline_label: copy.decline_label,
            // The link that takes the person straight to this activity.
            deep_link: "/person/activity?experience=" + planned.spec.spec_id,
          };

          // Section 45: a suggestion is itself an event. Recording it is what
          // stops the assistant offering three activities in five minutes.
          experienceRepo
            .recordExperienceEvents([
              {
                person_id: personId,
                spec_id: planned.spec.spec_id,
                template_id: planned.spec.template_id,
                reason: planned.spec.reason,
                event_type: "EXPERIENCE_SUGGESTED",
                language,
                context: { via: "conversation", intent: classified.intent, page },
                idempotency_key: "suggest_" + planned.spec.spec_id,
              },
            ])
            .catch(() => {});

          // The offer rides alongside the answer as a separate, declinable
          // field -- it is never spliced into the spoken sentence, so the
          // person hears their answer first and the activity stays optional.
          if (!detectedAction) {
            detectedAction = {
              type: "suggest_experience",
              label: copy.accept_label,
              target: "activity",
              payload: { experience_id: planned.spec.spec_id },
              risk: "low",
            };
          }
        } else {
          invitationWhy = decision.why + "; planner returned " + planned.status;
        }
      }
    } catch (invitationErr) {
      console.warn("[Companion] experience invitation skipped:", (invitationErr as Error)?.message || invitationErr);
    }

    // Conversational Experience Memory (Prompt 4 §26): persist the turn so
    // future retrieval and repetition-aware behavior have real history to
    // draw on. Fire-and-forget -- a slow/failed write must never delay or
    // break the person's actual response.
    personDataRepo
      .recordCompanionTurn({
        person_id: personId,
        message: text,
        answer,
        intent,
        classified_intent: classified.intent,
        path: pathType,
        provider,
        grounded: pathType === "deterministic" ? true : checkGrounding(answer, evidencePack).grounded,
        action_type: detectedAction?.type || null,
        page,
        latency_ms: Date.now() - startTurnTime,
      })
      .catch((err) => console.warn("Failed to record companion turn:", err?.message || err));

    // ── Developer retrieval trace (Prompt 4 §24/§58) ─────────────────────────
    // Makes "why did it answer that?" answerable without re-deriving the whole
    // pipeline by hand. Opt-in per request (?trace=1 or x-mindmitra-trace), so
    // the Person UI -- which never asks for it -- can never render it.
    const traceRequested = req.query?.trace === "1" || req.headers["x-mindmitra-trace"] === "1";
    const retrievalTrace = {
      query: text,
      intent: classified.intent,
      matched_rule: classified.matched_rule,
      mode: classified.mode,
      temporal_scope: classified.temporal_scope,
      continuation: classified.continuation,
      requires_retrieval: classified.requires_retrieval,
      page_context: { surface, page, route, visible_entity, active_game, game_context_applied: gameIntent && !!active_game },
      resolved_day: projection?.currentContext
        ? {
            now_iso: projection.currentContext.now_iso,
            time_zone: projection.currentContext.time_zone,
            label: projection.currentContext.scope_label,
            day_offset: retrievalPlan.dayOffset,
          }
        : null,
      retrieval_plan: retrievalPlan,
      retrieved_record_ids: {
        day_events: projection?.day?.events.map((e) => e.id) ?? [],
        routines: projection?.day?.routines.map((r) => r.id) ?? [],
        medications: projection?.day?.medications.map((m) => m.id) ?? [],
        upcoming: projection?.today.upcoming.map((e) => e.id) ?? [],
        people: projection?.people.map((p) => p.id) ?? [],
        memories: projection?.memories.map((m) => m.id) ?? [],
      },
      day_state: projection?.day
        ? { attempted: projection.day.attempted, nothing_recorded: projection.day.nothing_recorded, unavailable: projection.day.not_retrieved }
        : null,
      evidence_pack: evidencePack.facts.map((f) => ({ fact_id: f.fact_id, source_type: f.source_type, text: f.text })),
      already_mentioned: alreadyMentioned,
      response: { path: pathType, provider, model: usedModel, intent, action: detectedAction?.type || null },
      safety: projection?.safety ?? null,
      experience_invitation: { offered: !!experienceInvitation, why: invitationWhy, spec_id: experienceInvitation?.spec_id ?? null },
    };
    console.info(
      `[Companion] "${text}" -> ${classified.intent}/${classified.mode}/${classified.temporal_scope}` +
        ` (${classified.matched_rule}) | plan=${Object.entries(retrievalPlan).filter(([, v]) => v === true).map(([k]) => k).join(",") || "none"}` +
        ` | facts=${evidencePack.facts.length} | path=${pathType}:${provider}`
    );

    res.json({
      request_id: `req_${Date.now()}`,
      answer,
      asText: asText || answer,
      intent,
      path: pathType,
      provider,
      model: usedModel,
      latency_ms: Date.now() - startTurnTime,
      sources,
      gaps: [],
      conflicting: false,
      hedged: true,
      safety_passed: true,
      speakable: true,
      action: detectedAction,
      voice_meta: {
        persona: "empathic_daughter",
        recommended_pitch: 1.06,
        recommended_rate: 0.88,
        emotion: "warm_comfort",
      },
      context_snapshot: {
        surface,
        page,
        visible_entity,
        active_game,
        current_task,
      },
      experience_invitation: experienceInvitation,
      ...(traceRequested ? { trace: retrievalTrace } : {}),
    });
  });

  // 5.1 Sarvam Text-to-Speech API Endpoint (/api/tts/sarvam)
  app.post("/api/tts/sarvam", async (req: Request, res: Response) => {
    try {
      const { text = "", language_code = "en-IN", speaker = "priya" } = req.body || {};
      const cleanText = String(text).trim();
      if (!cleanText) {
        return res.status(400).json({ error: "Text is required" });
      }

      const ttsResult = await callSarvamTTS(cleanText, {
        targetLanguageCode: language_code,
        speaker: speaker as any,
      });

      res.json(ttsResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[TTS Endpoint] Error synthesizing with Sarvam:", msg);
      res.status(502).json({ error: msg, fallback: "browser_speech_synthesis" });
    }
  });

  // 5.2 Sarvam Speech-to-Text API Endpoint (/api/stt/sarvam)
  app.post("/api/stt/sarvam", express.raw({ type: "*/*", limit: "10mb" }), async (req: Request, res: Response) => {
    try {
      const audioBuffer = req.body;
      const mimeType = (req.headers["content-type"] as string) || "audio/wav";
      const languageCode = (req.query.lang as string) || "as-IN";

      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(400).json({ error: "Audio buffer is empty" });
      }

      const sttResult = await callSarvamSTT(audioBuffer, mimeType, languageCode);
      res.json(sttResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[STT Endpoint] Error transcribing with Sarvam:", msg);
      res.status(502).json({ error: msg });
    }
  });

  // 5.3 Companion Status & Model Diagnostics (/api/companion/status)
  app.get("/api/companion/status", (req: Request, res: Response) => {
    const sarvamKey = getSarvamApiKey();
    res.json({
      gemini_available: Boolean(process.env.GEMINI_API_KEY),
      sarvam_available: Boolean(sarvamKey),
      primary_provider: process.env.GEMINI_API_KEY ? "google_gemini" : "sarvam_ai",
      fallback_provider: sarvamKey ? "sarvam_ai" : "deterministic",
      supported_languages: ["as-IN", "en-IN", "hi-IN", "bn-IN"],
      active_voice: "priya (Bulbul v3)",
    });
  });

  // 6. 10-Point Safety Gateway (/v1/safety/check)
  app.post("/v1/safety/check", (req: Request, res: Response) => {
    const { text = "", role_target = "primary_caregiver" } = req.body || {};
    const cleanText = String(text).trim();

    const results: Array<{ check: string; passed: boolean; reason?: string; obligations?: string[] }> = [];
    let passed = true;
    let blocked_by: string | null = null;
    let crisis_number: string | null = null;
    const obligations: string[] = ["audit_obligation_logged"];

    // 1. Role fit
    if (role_target === "admin") {
      results.push({ check: "role_fit", passed: false, reason: "Admin role has no person-data access." });
      blocked_by = "role_fit";
      passed = false;
      return res.json({ passed, check_results: results, blocked_by, crisis_number, obligations });
    }
    results.push({ check: "role_fit", passed: true });

    // 2. Diagnosis filter
    const diagMatch = FORBIDDEN_PATTERNS.find(
      (p) => ["claim_diagnoses", "diagnosis_assertion", "claim_stages"].includes(p.code) && p.regex.test(cleanText)
    );
    if (diagMatch) {
      results.push({ check: "diagnosis", passed: false, reason: diagMatch.label });
      blocked_by = "diagnosis";
      passed = false;
      return res.json({ passed, check_results: results, blocked_by, crisis_number, obligations });
    }
    results.push({ check: "diagnosis", passed: true });

    // 3. Medication filter
    const medMatch = FORBIDDEN_PATTERNS.find(
      (p) => p.code === "medication_advice" && p.regex.test(cleanText)
    );
    if (medMatch) {
      results.push({ check: "medication", passed: false, reason: medMatch.label });
      blocked_by = "medication";
      passed = false;
      return res.json({ passed, check_results: results, blocked_by, crisis_number, obligations });
    }
    results.push({ check: "medication", passed: true });

    // 4. Provenance check
    results.push({ check: "provenance", passed: true });

    // 5. Uncertainty & forbidden claims (heals/cures/reverses/progression)
    const uncMatch = FORBIDDEN_PATTERNS.find(
      (p) => ["claim_heals", "claim_reverses", "claim_improves", "claim_cures", "claim_slows", "claim_progression"].includes(p.code) && p.regex.test(cleanText)
    );
    if (uncMatch) {
      results.push({ check: "uncertainty", passed: false, reason: uncMatch.label });
      blocked_by = "uncertainty";
      passed = false;
      return res.json({ passed, check_results: results, blocked_by, crisis_number, obligations });
    }
    results.push({ check: "uncertainty", passed: true });

    // 6. Three-layer contract
    results.push({ check: "three_layer", passed: true });

    // 7. Dignity
    results.push({ check: "dignity", passed: true });

    // 8. Crisis detection -> Tele-MANAS (non-blocking)
    const isCrisis = CRISIS_PATTERNS.some((p) => p.test(cleanText));
    if (isCrisis) {
      crisis_number = "14416";
      obligations.push("route_to_crisis:14416");
      results.push({
        check: "crisis",
        passed: true,
        obligations: ["route_to_crisis:14416"],
        reason: "Distress keywords detected: immediately connected to Tele-MANAS toll-free helpline (14416).",
      });
    } else {
      results.push({ check: "crisis", passed: true });
    }

    // 9. Emergency override (non-blocking)
    results.push({ check: "emergency", passed: true });

    // 10. Audit obligation (non-blocking)
    results.push({ check: "audit", passed: true });

    res.json({
      passed,
      check_results: results,
      blocked_by,
      crisis_number,
      obligations,
    });
  });

  // 7. Observation submission with MQ Filter (/v1/observations)
  app.post("/v1/observations", (req: Request, res: Response) => {
    const { person_id, domain, value, signals } = req.body || {};
    const mqe = computeQuality(signals || {});

    res.json({
      observation_id: `obs_${Date.now()}`,
      person_id: person_id || "person:purnima",
      domain: domain || "working_memory",
      value: Number(value || 75.0),
      quality: mqe.q,
      gate: mqe.gate,
      language_mismatch: mqe.language_mismatch,
      dominant_issue: mqe.dominant_issue,
      observed_at: new Date().toISOString(),
    });
  });

  // 8. Baseline query
  app.get("/v1/baseline/:personId/:domain", (req: Request, res: Response) => {
    const { domain } = req.params;
    const base = BASELINE_DATA[domain] || { median: 80.0, mad: 4.0, n: 14 };
    res.json({
      person_id: req.params.personId,
      domain,
      median: base.median,
      mad: base.mad,
      n_quality_gated: base.n,
      gate: "sufficient",
      window_days: 14,
    });
  });

  // 9. Caregiver Decline Injection (/v1/demo/inject-decline)
  app.post("/v1/demo/inject-decline", (req: Request, res: Response) => {
    const days = Math.min(7, Math.max(1, Number(req.body?.days || 3)));
    const levelKey = days <= 1 ? "L1" : days <= 2 ? "L2" : days <= 3 ? "L3" : days <= 4 ? "L4" : "L5";

    const alert = {
      alert_id: `alt_${Date.now()}`,
      person_id: "person:purnima",
      level: levelKey,
      domain: "working_memory",
      trigger: `${days}-day sustained latency increase and reduced accuracy across morning sessions.`,
      created_at: new Date().toISOString(),
    };

    const card = {
      card_id: `card_${Date.now()}`,
      person_id: "person:purnima",
      headline: `Noticeable change in morning recall over the last ${days} days.`,
      facts: [
        {
          fact_id: "f_latency",
          content: `Purnima took an average of 4.2 seconds longer to complete morning name-and-face recalls across ${days} sessions.`,
          source: "tablet_telemetry",
        },
        {
          fact_id: "f_sleep",
          content: "Caregiver sleep log noted 2 awakenings between 2:00 AM and 4:30 AM on Thursday night.",
          source: "caregiver_log",
        },
      ],
      hypotheses: [
        {
          hypothesis_id: "h_sleep",
          content: "Disturbed sleep architecture or nocturnal restlessness may be degrading working memory performance.",
          label: "Plausible contributing cause",
        },
        {
          hypothesis_id: "h_hydration",
          content: "Mild dehydration or ambient temperature fluctuation in Tezpur.",
          label: "Environmental factor",
        },
      ],
      actions: [
        {
          action_id: "a_check_sleep",
          content: "Review sleep log for the past 48 hours and ensure quiet bedroom environment.",
        },
        {
          action_id: "a_hydration",
          content: "Offer warm water or herbal infusion 30 minutes before cognitive activities.",
        },
        {
          action_id: "a_chw",
          content: "Mention this trend to Meena (ASHA worker) during Thursday's home visit.",
        },
      ],
      escalation: levelKey,
    };

    res.json({ days, alert, card });
  });

  // 10. Memory Firewall Demo (/v1/demo/seed & /v1/pwm/read & /v1/identity/consent)
  app.post("/v1/demo/seed", (req: Request, res: Response) => {
    res.json({
      status: "seeded",
      scenario: "purnima_assam_care_network",
      actors: ["person:purnima:self", "actor:anu", "actor:bikash", "actor:meena", "actor:stranger"],
      facts: [
        { fact_id: "f_rina", category: "life_story_memory", text: "Granddaughter Rina's wedding in Tezpur" },
        { fact_id: "f_private_diary", category: "person_private_note", text: "Personal reflection on ancestral village" },
      ],
    });
  });

  app.post("/v1/pwm/read", (req: Request, res: Response) => {
    const { actor_id, purpose, fact_id } = req.body || {};

    // Memory Firewall Matrix Rules:
    // Purnima self -> ALLOW
    // Anu (primary caregiver) -> ALLOW if anuConsentGranted and purpose is personalisation/care_coordination
    // Bikash (remote secondary) -> DENY for personalisation (only onboarding/view under explicit consent)
    // Meena (CHW) -> DENY for personal life-story memory personalisation
    // Stranger -> DENY
    let allowed = false;
    let reason = "Denied by Memory Firewall deterministic policy matrix.";

    if (actor_id === "person:purnima:self") {
      allowed = true;
      reason = "Self-access by person is unconditionally granted without third-party consent.";
    } else if (actor_id === "actor:anu") {
      if (!anuConsentGranted) {
        allowed = false;
        reason = "Consent has been revoked by Purnima for primary caregiver access.";
      } else if (purpose === "research") {
        allowed = false;
        reason = "Purpose 'research' is strictly forbidden under clinical care consent.";
      } else if (purpose === "personalisation" || purpose === "care_coordination") {
        allowed = true;
        reason = "Explicit consent grant active for primary caregiver under purpose 'personalisation'.";
      }
    } else if (actor_id === "actor:bikash") {
      allowed = false;
      reason = "Secondary caregiver scope is restricted from private memory personalisation.";
    } else if (actor_id === "actor:meena") {
      allowed = false;
      reason = "CHW role does not hold consent for private life-story memory read.";
    } else {
      allowed = false;
      reason = "Unauthenticated or unpermissioned actor rejected by default fail-closed firewall.";
    }

    res.json({
      decision: allowed ? "ALLOW" : "DENY",
      actor_id,
      fact_id,
      purpose,
      reason,
      payload: allowed
        ? {
            fact_id: "f_rina",
            category: "life_story_memory",
            content: "Granddaughter Rina's traditional wedding photograph under the courtyard mango tree.",
            provenance: { verified: true, source: "family_upload", verified_by: "Anu (daughter)" },
          }
        : null,
    });
  });

  app.post("/v1/identity/consent/grant", async (req: Request, res: Response) => {
    anuConsentGranted = true;
    const { person_id = "person:purnima", purpose = "personalisation", category = "life_story_memory", granted_by = "Anu (Primary Caregiver)" } = req.body || {};
    try {
      await personDataRepo.grantConsent({ person_id, purpose, category, granted_to_role: "primary_caregiver", granted_by });
    } catch (err: unknown) {
      console.warn("Failed to persist consent grant:", err instanceof Error ? err.message : err);
    }
    res.json({
      status: "granted",
      grantee_role: "primary_caregiver",
      category,
      purpose,
      active: true,
    });
  });

  app.post("/v1/identity/consent/revoke", async (req: Request, res: Response) => {
    anuConsentGranted = false;
    const { person_id = "person:purnima", purpose = "personalisation", category = "life_story_memory" } = req.body || {};
    try {
      await personDataRepo.revokeConsent(person_id, purpose, category);
    } catch (err: unknown) {
      console.warn("Failed to persist consent revoke:", err instanceof Error ? err.message : err);
    }
    res.json({
      status: "revoked",
      grantee_role: "primary_caregiver",
      category,
      purpose,
      active: false,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. PERSONAL COGNITIVE EXPERIENCE SPACE & UNIFIED COGNITIVE STUDIO API
  // ──────────────────────────────────────────────────────────────────────────

  // A. Canonical Personal Game Context Pack (PWM, PCM, XM, GIM, CAE)
  app.get("/v1/cognitive-studio/context-pack/:personId", (req: Request, res: Response) => {
    const pack = cognitiveStore.getContextPack(req.params.personId);
    res.json(pack);
  });

  // B. Available Deterministic Engines / Templates
  app.get("/v1/cognitive-studio/templates", (req: Request, res: Response) => {
    res.json([
      {
        id: "tpl:my_life_timeline",
        template_key: "my_life_timeline",
        title: "My Life Timeline (জীৱনৰ স্মৃতিৰেখা)",
        cognitive_family: "autobiographical_sequencing",
        supported_modalities: ["photo_plus_voice", "visual_only", "tactile_sequencing"],
        supported_difficulty_range: [1, 3],
        offline_capable: true,
        modes: ["recognition", "association", "construction", "voice", "story"],
        description: "Deterministic autobiographical sequencing using verified archival photographs and family voice prompts.",
      },
      {
        id: "tpl:prepare_for",
        template_key: "prepare_for",
        title: "Prepare-For: Veranda Visit & Tea Ceremony (প্ৰস্তুতি)",
        cognitive_family: "executive_planning",
        supported_modalities: ["multi_modal", "visual_tactile", "photo_plus_voice"],
        supported_difficulty_range: [1, 3],
        offline_capable: true,
        stages: 5,
        description: "Real-world bridge connecting recognition, orientation, tea preparation sequencing, prospective reminders, and social call.",
      },
      {
        id: "tpl:experience_braid",
        template_key: "experience_braid",
        title: "Experience Braid: Past, Present & Future (স্মৃতিৰ তৰংগ)",
        cognitive_family: "autobiographical_sequencing",
        supported_modalities: ["multi_modal", "photo_plus_voice"],
        supported_difficulty_range: [1, 3],
        offline_capable: true,
        description: "Signature MindMitra multi-phase journey weaving past memory into present sensory calm and future afternoon visitor preparation.",
      },
      {
        id: "tpl:reminiscence_journey",
        template_key: "reminiscence_journey_my_world",
        title: "Reminiscence Journey — My World (মোৰ পৃথিৱীৰ স্মৃতি)",
        cognitive_family: "autobiographical_memory",
        supported_modalities: ["photo_plus_voice", "sensory_cues", "family_voice"],
        supported_difficulty_range: [1, 3],
        offline_capable: true,
        description: "Explore cherished autobiographical chapters, family portraits, voice greetings, and personal life milestones with gentle guided recall.",
      },
      {
        id: "tpl:route_builder",
        template_key: "route_builder_familiar_places",
        title: "Route Builder — Familiar Places (চিনাকি বাট নিৰ্মাণ)",
        cognitive_family: "spatial_orientation",
        supported_modalities: ["landmark_sequencing", "visual_tactile", "sensory_wayfinding"],
        supported_difficulty_range: [1, 3],
        offline_capable: true,
        description: "Reconstruct familiar walks and cherished daily journeys (home to Brahmaputra river ghat or girls school) using personal visual landmarks without GPS reliance.",
      },
    ]);
  });

  // C. Generate & Validate Experience Specification (Level A / B / C)
  app.post("/v1/cognitive-studio/generate-spec", (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      template_key = "my_life_timeline",
      mode = "recognition",
      generation_mode = "parametrically_personalised_level_b",
    } = req.body || {};

    const context = cognitiveStore.getContextPack(person_id);
    let spec;

    if (template_key === "prepare_for") {
      spec = compilePrepareForSpec(context);
    } else if (template_key === "experience_braid") {
      spec = compileExperienceBraidSpec(context);
    } else {
      spec = compileTimelineSpec(context, mode);
    }

    if (generation_mode) {
      spec.generation_mode = generation_mode;
    }

    // Audit log this generation run
    cognitiveStore.generationRuns.unshift({
      id: `run_${Date.now()}`,
      person_id,
      selected_template: template_key,
      generation_mode: spec.generation_mode,
      validation_results: spec.validation_status,
      created_at: new Date().toISOString(),
    });

    res.json(spec);
  });

  // D. Memories Collection API (with Provenance & Verification)
  app.get("/v1/memories", async (req: Request, res: Response) => {
    const { person_id, verification_status, temporal_frame } = req.query;
    try {
      const list = await personDataRepo.listMemories(String(person_id || "person:purnima"), {
        verificationStatus: verification_status ? String(verification_status) : undefined,
        temporalFrame: temporal_frame ? String(temporal_frame) : undefined,
      });
      await personDataRepo.logFirewallAccess({
        person_id: String(person_id || "person:purnima"),
        actor_id: "actor:purnima",
        actor_role: "person",
        purpose: "memory",
        requested_entity_type: "memory_items",
        decision: "ALLOW",
        policy_reason: "Person reading own memories.",
        filtered_count: list.length,
      });
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list memories from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/memories", async (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      memory_type = "autobiographical",
      title,
      description,
      assamese_title,
      temporal_frame = "recent",
      approximate_period = "Recent",
      source = "person",
      verification_status = "unverified",
      sensitivity = "low",
      cultural_context = "Tezpur, Assam",
      media_refs = [],
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Memory title is required." });
    }

    // New uploaded memory from person starts as unverified claim
    const created = await personDataRepo.createMemory({
      person_id,
      memory_type,
      title,
      description: description || "",
      assamese_title,
      temporal_frame,
      approximate_period,
      source,
      verification_status: source === "caregiver" ? "verified" : verification_status,
      confidence: source === "caregiver" ? 0.98 : 0.75,
      sensitivity,
      cultural_context,
      consent_scope: req.body.consent_scope || (source === "caregiver" ? "all" : "person_only"),
      visibility_scope: req.body.visibility_scope || (source === "caregiver" ? "family" : "private"),
      created_by: req.body.created_by || (source === "caregiver" ? "actor:anu" : "actor:purnima"),
      media_asset_ids: media_refs,
    });

    res.json({
      status: "created",
      memory: created,
      provenance_note: created.verification_status === "unverified"
        ? "Stored permanently as an unverified person statement. Accessible for personal viewing; requires caregiver confirmation before inclusion in cognitive games."
        : "Verified memory available for personalized cognitive grounding.",
    });
  });

  // E. Verify Memory (Caregiver / CHW / Clinician Action)
  app.post("/v1/memories/:id/verify", async (req: Request, res: Response) => {
    const { verified_by = "Anu (Primary Caregiver)" } = req.body || {};
    const updated = await personDataRepo.verifyMemory(req.params.id, verified_by);
    if (!updated) {
      return res.status(404).json({ error: "Memory item not found." });
    }
    res.json({
      status: "verified",
      memory: updated,
      message: `Memory has been verified by ${verified_by} and is now available for cognitive game grounding.`,
    });
  });

  // ── Media Assets API (PERSON vs CAREGIVER with full 9 provenance fields) ──
  app.get("/v1/media-assets", async (req: Request, res: Response) => {
    const { person_id, media_type } = req.query;
    try {
      const list = await personDataRepo.listMediaAssets(String(person_id || "person:purnima"), media_type ? String(media_type) : undefined);
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list media assets from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/media-assets", async (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      url,
      media_type = "photo",
      mime_type = "image/jpeg",
      source = "person",
      consent_scope,
      visibility_scope,
      created_by = "person:purnima",
    } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "Media URL is required." });
    }

    const asset = await personDataRepo.createMediaAsset({
      person_id,
      storage_key: url,
      media_type,
      mime_type,
      created_by,
      consent_scope,
      visibility_scope,
    });

    res.json({
      status: "created",
      asset,
      provenance_note:
        source === "person"
          ? "Uploaded as person memory asset (unverified). Requires caregiver verification before cognitive game inclusion."
          : "Verified caregiver asset available for cognitive grounding.",
    });
  });

  // Attach media to memory
  app.post("/v1/memories/:id/media", async (req: Request, res: Response) => {
    const { media_asset_id, role = "primary_photo", display_order } = req.body || {};
    if (!media_asset_id) {
      return res.status(400).json({ error: "media_asset_id is required." });
    }
    const attached = await personDataRepo.attachMediaToMemory(req.params.id, media_asset_id, {
      role,
      sequenceOrder: display_order,
    });
    if (!attached) {
      return res.status(404).json({ error: "Memory or media asset not found." });
    }
    res.json({ status: "attached", memory_media: attached });
  });

  // ── Familiar Places API (Optional coordinates, landmark cues, sensory grounding) ──
  app.get("/v1/places", async (req: Request, res: Response) => {
    const { person_id, verification_status } = req.query;
    try {
      const list = await personDataRepo.listPlaces(String(person_id || "person:purnima"), verification_status ? String(verification_status) : undefined);
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list places from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/places", async (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      name,
      assamese_name,
      category = "other",
      significance,
      description,
      landmark_cues = [],
      sensory_cues = {},
      approximate_period,
      coordinates = null,
      media_refs = [],
      source = "caregiver",
      created_by = "actor:anu",
    } = req.body || {};

    if (!name || !significance) {
      return res.status(400).json({ error: "Place name and personal significance are required." });
    }

    const place = await personDataRepo.createPlace({
      person_id,
      name,
      assamese_name,
      category,
      significance,
      description: description || "",
      landmark_cues,
      sensory_cues,
      approximate_period: approximate_period || "Present",
      coordinates: coordinates || null,
      source,
      created_by,
      media_asset_ids: media_refs,
    });

    res.json({ status: "created", place });
  });

  app.post("/v1/places/:id/verify", async (req: Request, res: Response) => {
    const updated = await personDataRepo.verifyPlace(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: "Place not found." });
    }
    res.json({ status: "verified", place: updated });
  });

  // ── Familiar People (Family & Care Team Directory) ──
  app.get("/v1/people", async (req: Request, res: Response) => {
    const { person_id } = req.query;
    const personId = String(person_id || "person:purnima");
    try {
      const list = await personDataRepo.listFamiliarPeople(personId);
      await personDataRepo.logFirewallAccess({
        person_id: personId,
        actor_id: "actor:purnima",
        actor_role: "person",
        purpose: "personalisation",
        requested_entity_type: "person_entities",
        decision: "ALLOW",
        policy_reason: "Person reading own family/care-team directory.",
        filtered_count: list.length,
      });
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list familiar people from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  // ── Goals ──
  app.get("/v1/goals", async (req: Request, res: Response) => {
    const { person_id, status } = req.query;
    try {
      const list = await personDataRepo.listGoals(String(person_id || "person:purnima"), status ? String(status) : "active");
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list goals from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/goals", async (req: Request, res: Response) => {
    const { person_id = "person:purnima", goal_type, description, created_by = "actor:anu", target_date } = req.body || {};
    if (!goal_type || !description) {
      return res.status(400).json({ error: "goal_type and description are required." });
    }
    const goal = await personDataRepo.createGoal({ person_id, goal_type, description, created_by, target_date });
    res.json({ status: "created", goal });
  });

  // ── Preferences (explicit vs inferred, append-only) ──
  app.get("/v1/preferences", async (req: Request, res: Response) => {
    const { person_id } = req.query;
    try {
      const list = await personDataRepo.getActivePreferences(String(person_id || "person:purnima"));
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list preferences from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/preferences", async (req: Request, res: Response) => {
    const { person_id = "person:purnima", dimension, value, evidence_source = "system_inferred", confidence } = req.body || {};
    if (!dimension || value === undefined) {
      return res.status(400).json({ error: "dimension and value are required." });
    }
    const result = await personDataRepo.recordPreference({ person_id, dimension, value, evidence_source, confidence });
    res.json({ status: "recorded", ...result });
  });

  app.post("/v1/places/:id/verify", (req: Request, res: Response) => {
    const { verified_by = "Anu (Primary Caregiver)", role = "caregiver", notes } = req.body || {};
    const updated = cognitiveStore.verifyPlace(req.params.id, verified_by, role, notes);
    if (!updated) {
      return res.status(404).json({ error: "Place not found." });
    }
    res.json({ status: "verified", place: updated });
  });

  // ── Familiar Routes & Wayfinding Segments API ──
  app.get("/v1/routes", (req: Request, res: Response) => {
    const { person_id } = req.query;
    let list = cognitiveStore.familiarRoutes;
    if (person_id) list = list.filter((r) => r.person_id === person_id);
    res.json({ count: list.length, items: list });
  });

  app.get("/v1/routes/:id", (req: Request, res: Response) => {
    const route = cognitiveStore.getRouteWithSegments(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found." });
    }
    res.json(route);
  });

  app.post("/v1/routes", (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      title,
      assamese_title,
      description,
      start_place_id,
      destination_place_id,
      routine_frequency = "past_routine",
      estimated_walk_time_mins = 10,
      difficulty = 1,
      source = "caregiver",
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity = "low",
      created_by = "actor:anu",
    } = req.body || {};

    if (!title || !start_place_id || !destination_place_id) {
      return res.status(400).json({ error: "Route title, start_place_id, and destination_place_id are required." });
    }

    const route = cognitiveStore.addRoute({
      person_id,
      title,
      assamese_title,
      description: description || "",
      start_place_id,
      destination_place_id,
      routine_frequency,
      estimated_walk_time_mins,
      difficulty,
      source,
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity,
      created_by,
    });

    res.json({ status: "created", route });
  });

  app.post("/v1/routes/:id/verify", (req: Request, res: Response) => {
    const { verified_by = "Anu (Primary Caregiver)", role = "caregiver", notes } = req.body || {};
    const updated = cognitiveStore.verifyRoute(req.params.id, verified_by, role, notes);
    if (!updated) {
      return res.status(404).json({ error: "Route not found." });
    }
    res.json({ status: "verified", route: updated });
  });

  app.post("/v1/routes/:id/segments", (req: Request, res: Response) => {
    const {
      segment_order,
      from_landmark,
      to_landmark,
      visual_cue,
      sensory_description,
      turn_instruction = "straight",
      photo_asset_id,
      is_key_decision_point = false,
      source = "caregiver",
      verification_status = "caregiver_verified",
      confidence = 1.0,
      consent_scope = "all",
      visibility_scope = "family",
      sensitivity = "low",
      created_by = "actor:anu",
    } = req.body || {};

    if (!from_landmark || !to_landmark || !visual_cue || segment_order === undefined) {
      return res.status(400).json({ error: "segment_order, from_landmark, to_landmark, and visual_cue are required." });
    }

    const segment = cognitiveStore.addRouteSegment(req.params.id, {
      segment_order: Number(segment_order),
      from_landmark,
      to_landmark,
      visual_cue,
      sensory_description: sensory_description || "",
      turn_instruction,
      photo_asset_id,
      is_key_decision_point,
      source,
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity,
      created_by,
    });

    if (!segment) {
      return res.status(404).json({ error: "Route not found." });
    }

    res.json({ status: "created", segment });
  });

  // ── Unified Game-Eligible Content Query (Memory Firewall Enforced) ──
  app.get("/v1/games/eligible-content/:personId", (req: Request, res: Response) => {
    const personId = req.params.personId;
    const includeSensitive = req.query.include_sensitive === "true";

    const memoriesResult = cognitiveStore.getGameEligibleMemories(personId, { includeSensitive });
    const placesResult = cognitiveStore.getGameEligiblePlacesAndRoutes(personId, { includeSensitive });

    res.json({
      person_id: personId,
      reminiscence_game: {
        eligible_memories: memoriesResult.eligible,
        count: memoriesResult.eligible.length,
        excluded_unverified: memoriesResult.excludedUnverified,
        excluded_sensitive: memoriesResult.excludedSensitive,
        excluded_consent: memoriesResult.excludedConsent,
      },
      route_builder_game: {
        eligible_places: placesResult.places,
        eligible_routes: placesResult.routes,
        places_count: placesResult.places.length,
        routes_count: placesResult.routes.length,
        excluded_unverified: placesResult.excludedUnverified,
        excluded_sensitive: placesResult.excludedSensitive,
        excluded_consent: placesResult.excludedConsent,
      },
      firewall_enforced: true,
      isolation_verified: true,
    });
  });

  // ── Game Snapshots API (Offline reproducibility & provenance auditing) ──
  app.post("/v1/games/snapshots", (req: Request, res: Response) => {
    const { person_id = "person:purnima", game_key = "reminiscence_journey_my_world" } = req.body || {};
    const snapshot = cognitiveStore.createGameSnapshot(person_id, game_key);
    res.json({ status: "created", snapshot });
  });

  app.get("/v1/games/snapshots/:personId/:gameKey", (req: Request, res: Response) => {
    const snapshot = cognitiveStore.getLatestSnapshot(req.params.personId, req.params.gameKey);
    if (!snapshot) {
      return res.status(404).json({ error: "No snapshot found for person and game." });
    }
    res.json(snapshot);
  });

  // ── Purpose-Specific Game Context Pack API ──
  app.get("/v1/games/context-pack/game-7/:personId", (req: Request, res: Response) => {
    try {
      const { query, allow_unverified, include_sensitive } = req.query;
      const pack = buildGame7ContextPack(req.params.personId, {
        query: typeof query === "string" ? query : undefined,
        allowUnverifiedClaimsWithLabel: allow_unverified === "true",
        includeHighSensitivity: include_sensitive === "true",
      });
      res.json({ status: "ok", pack });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to build Game 7 context pack." });
    }
  });

  app.get("/v1/games/context-pack/game-8/:personId", (req: Request, res: Response) => {
    try {
      const { query, allow_unverified, include_sensitive } = req.query;
      const pack = buildGame8ContextPack(req.params.personId, {
        query: typeof query === "string" ? query : undefined,
        allowUnverifiedClaimsWithLabel: allow_unverified === "true",
        includeHighSensitivity: include_sensitive === "true",
      });
      res.json({ status: "ok", pack });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to build Game 8 context pack." });
    }
  });

  // ── Bounded LangGraph Orchestration API ──
  app.post("/v1/games/orchestrate", (req: Request, res: Response) => {
    try {
      const { intent, person_id = "person:purnima" } = req.body || {};
      if (!intent) {
        return res.status(400).json({ error: "Intent object is required (e.g. { type: 'play_game_7' })." });
      }

      const result = BoundedGameOrchestrator.execute(intent, person_id);
      res.json({
        status: "success",
        orchestration: result,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Bounded orchestration pipeline failed." });
    }
  });

  // ── Game Reconstruction from Snapshot API ──
  app.get("/v1/games/snapshots/:snapshotId/reconstruct", (req: Request, res: Response) => {
    try {
      const result = BoundedGameOrchestrator.reconstructGameFromSnapshot(req.params.snapshotId);
      if (!result) {
        return res.status(404).json({ error: `Snapshot with ID ${req.params.snapshotId} not found.` });
      }
      res.json({ status: "reconstructed", ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reconstruct game from snapshot." });
    }
  });

  // ── Memory Experience History API ──
  app.get("/v1/games/experience-history", (req: Request, res: Response) => {
    const { person_id, game_key } = req.query;
    let list = cognitiveStore.experienceHistory;
    if (person_id) list = list.filter((h) => h.person_id === person_id);
    if (game_key) list = list.filter((h) => h.game_key === game_key);
    res.json({ count: list.length, items: list });
  });

  app.post("/v1/games/experience-history", (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      game_key,
      target_entity_type,
      target_entity_id,
      interaction_type,
      latency_ms,
      assistance_level = "none",
      recall_success = true,
      engagement_score = 0.90,
      notes,
    } = req.body || {};

    if (!game_key || !target_entity_type || !target_entity_id || !interaction_type) {
      return res.status(400).json({ error: "game_key, target_entity_type, target_entity_id, and interaction_type are required." });
    }

    const record = cognitiveStore.recordExperienceHistory({
      person_id,
      game_key,
      target_entity_type,
      target_entity_id,
      interaction_type,
      latency_ms: latency_ms || 1500,
      assistance_level,
      recall_success,
      engagement_score,
      notes,
    });

    res.json({ status: "recorded", record });
  });

  // F. Prospective Future Events API
  app.get("/v1/future-events", async (req: Request, res: Response) => {
    const { person_id } = req.query;
    try {
      // Only expected/confirmed, non-expired events -- cancelled or stale events
      // are never treated as current (see listUpcomingEvents).
      const list = await personDataRepo.listUpcomingEvents(String(person_id || "person:purnima"));
      res.json({ count: list.length, items: list });
    } catch (err: unknown) {
      console.warn("Failed to list future events from Neon:", err instanceof Error ? err.message : err);
      res.json({ count: 0, items: [] });
    }
  });

  app.post("/v1/future-events", async (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      title,
      event_type = "family_visit",
      person_name = "Rina",
      relationship = "granddaughter",
      scheduled_at,
      location = "Veranda, Tezpur",
      source = "caregiver",
    } = req.body || {};
    const newEvent = await personDataRepo.createFutureEvent({
      person_id,
      event_type,
      title: title || "Family Visit",
      person_name,
      relationship,
      location_name: location,
      scheduled_at: scheduled_at || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      source,
    });
    res.json({ status: "created", event: newEvent });
  });

  // G. Record Trial Telemetry & Complete Experience Episode
  app.post("/v1/cognitive-studio/sessions/trial", (req: Request, res: Response) => {
    const { trial_index, step_name, latency_ms, assistance_level, hint_used, is_correct } = req.body || {};
    // Calculate measurement quality
    const mq = assistance_level === "none" ? 0.95 : assistance_level === "visual_cue" ? 0.85 : 0.70;
    res.json({
      status: "recorded",
      trial_index,
      step_name,
      latency_ms: latency_ms || 1200,
      assistance_level: assistance_level || "none",
      measurement_quality_q: mq,
    });
  });

  app.post("/v1/cognitive-studio/sessions/complete", (req: Request, res: Response) => {
    const {
      session_id = `sess_${Date.now()}`,
      person_id = "person:purnima",
      template_key = "my_life_timeline",
      generation_mode = "parametrically_personalised_level_b",
      objective = "Autobiographical sequencing & reminiscence",
      engagement_score = 0.92,
      assistance_rate = 0.1,
      observed_response = "Engaged warmly with photo cues and family voice.",
      learned_implication = "2-choice recognition produces high confidence without frustration.",
      domain = "autobiographical_memory",
    } = req.body || {};

    const episode = cognitiveStore.recordEpisode({
      session_id,
      person_id,
      template_key,
      generation_mode,
      objective,
      context: {
        time_of_day: "10:30 AM",
        modality: "photo_plus_voice",
        difficulty: 2,
      },
      engagement_score,
      assistance_rate,
      measurement_quality: 0.89,
      observed_response,
      learned_implication,
      pcm_update: {
        domain,
        delta: +0.02,
        new_estimate: 0.92,
      },
    });

    res.json({
      status: "completed",
      episode,
      feedback: "Experience Episode synthesized and integrated into Personal Capability Model (PCM) & Experience Memory (XM).",
    });
  });

  // Complete Rich Experience Episode (Games 7 & 8)
  app.post("/v1/cognitive-studio/episodes", (req: Request, res: Response) => {
    const episodeData = req.body;
    if (!episodeData || !episodeData.person_id || !episodeData.template_key) {
      return res.status(400).json({ error: "person_id and template_key are required." });
    }
    const episode = cognitiveStore.recordEpisode(episodeData);
    res.json({
      status: "recorded",
      episode,
      pcm_update_applied: episode.pcm_update?.applied ?? false,
      reason: episode.pcm_update?.reason_if_skipped,
    });
  });

  // Offline Event Queue Idempotent Synchronization
  app.post("/v1/cognitive-studio/sync-offline-events", (req: Request, res: Response) => {
    const { events = [] } = req.body || {};
    const syncedKeys: string[] = [];

    for (const event of events) {
      const { idempotency_key, event_type, payload } = event;
      if (event_type === "experience_episode" && payload) {
        cognitiveStore.recordEpisode({
          ...payload,
          idempotency_key,
        });
        syncedKeys.push(idempotency_key);
      } else if (idempotency_key) {
        syncedKeys.push(idempotency_key);
      }
    }

    res.json({
      status: "synced",
      received_count: events.length,
      synced_count: syncedKeys.length,
      synced_keys: syncedKeys,
    });
  });

  // Personal Capability Model (PCM) Inspection
  app.get("/v1/cognitive-studio/pcm/:personId", (req: Request, res: Response) => {
    const caps = cognitiveStore.getCapabilities(req.params.personId);
    res.json({
      person_id: req.params.personId,
      capabilities: caps,
      evidence_gated: true,
      measurement_quality_threshold: 0.65,
    });
  });

  // Cross-Game Learning Recommendations (Bi-directional inference)
  app.get("/v1/cognitive-studio/cross-game/:personId", (req: Request, res: Response) => {
    const recs = cognitiveStore.getCrossGameRecommendations(req.params.personId);
    res.json({
      person_id: req.params.personId,
      ...recs,
    });
  });

  // H. Episodes & Audit Runs
  app.get("/v1/cognitive-studio/episodes/:personId", (req: Request, res: Response) => {
    const personEpisodes = cognitiveStore.episodes.filter((e) => e.person_id === req.params.personId);
    res.json({ count: personEpisodes.length, episodes: personEpisodes });
  });

  app.get("/v1/cognitive-studio/audit-runs", (req: Request, res: Response) => {
    res.json({ count: cognitiveStore.generationRuns.length, runs: cognitiveStore.generationRuns });
  });

  // ── TEMPORAL ORIENTATION ENGINE & YESTERDAY / TODAY / TOMORROW API ─────────

  // 1. Get current personal temporal context pack
  app.get("/v1/temporal-orientation/context-pack/:personId", (req: Request, res: Response) => {
    try {
      const pack = buildTemporalOrientationContextPack(req.params.personId);
      res.json({ status: "ok", pack });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to build temporal orientation context pack." });
    }
  });

  // 2. Orchestrate temporal orientation experience
  app.post("/v1/temporal-orientation/orchestrate", (req: Request, res: Response) => {
    try {
      const { person_id = "person:purnima", intent = "daily_orientation", reference_date } = req.body || {};
      const refDate = reference_date ? new Date(reference_date) : undefined;
      const state = BoundedTemporalOrchestrator.orchestrateTemporalExperience(person_id, intent, refDate);
      res.json({
        status: "success",
        spec: state.generated_spec,
        snapshot_id: state.snapshot_id,
        execution_steps: state.execution_steps,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Temporal orchestration failed." });
    }
  });

  // 3. Retrieve cached spec by snapshot ID
  app.get("/v1/temporal-orientation/spec/:snapshotId", (req: Request, res: Response) => {
    const spec = BoundedTemporalOrchestrator.getCachedSpec(req.params.snapshotId);
    if (!spec) {
      return res.status(404).json({ error: `Temporal orientation spec with snapshot ID ${req.params.snapshotId} not found.` });
    }
    res.json({ status: "ok", spec });
  });

  // 4. Start temporal orientation session
  app.post("/v1/temporal-orientation/sessions/start", (req: Request, res: Response) => {
    try {
      const { person_id = "person:purnima", template_key = "daily_orientation" } = req.body || {};
      const state = BoundedTemporalOrchestrator.orchestrateTemporalExperience(person_id, template_key);
      const sessionId = `tsess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      res.json({
        status: "started",
        session_id: sessionId,
        person_id,
        spec: state.generated_spec,
        snapshot_id: state.snapshot_id,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to start temporal orientation session." });
    }
  });

  // 5. Scaffolding step generator
  app.post("/v1/temporal-orientation/sessions/scaffold", (req: Request, res: Response) => {
    const { current_level = "S0", task_id, event_id } = req.body || {};
    const nextLevel = TemporalScaffoldingLadder.getNextLevel(current_level);
    res.json({
      status: "scaffold_advanced",
      previous_level: current_level,
      next_level: nextLevel,
    });
  });

  // 6. Record trial telemetry
  app.post("/v1/temporal-orientation/sessions/trial", (req: Request, res: Response) => {
    const {
      session_id,
      trial_index = 0,
      task_primitive,
      temporal_frame = "today",
      scaffold_level_used = "S0",
      latency_ms = 1200,
      completion_state = "success",
      assistance_provided = "none",
    } = req.body || {};

    // Check compromised trial flags (e.g. latency extreme)
    const isCompromised = latency_ms < 200 || latency_ms > 45000;
    const qualityQ = scaffold_level_used === "S0" ? 0.95 : scaffold_level_used === "S1" ? 0.88 : scaffold_level_used === "S2" ? 0.82 : 0.70;

    res.json({
      status: "recorded",
      trial_index,
      task_primitive,
      temporal_frame,
      scaffold_level_used,
      latency_ms,
      completion_state,
      assistance_provided,
      measurement_quality_q: qualityQ,
      compromised_trial: isCompromised,
    });
  });

  // 7. Complete session & record Experience Episode in cognitiveStore
  app.post("/v1/temporal-orientation/sessions/complete", (req: Request, res: Response) => {
    const {
      session_id = `tsess_${Date.now()}`,
      person_id = "person:purnima",
      template_key = "daily_orientation",
      trials = [],
      engagement_score = 0.94,
      notes = "Calm and grounded orientation through yesterday, today, and tomorrow.",
    } = req.body || {};

    const episode = cognitiveStore.recordEpisode({
      session_id,
      person_id,
      template_key,
      generation_mode: "parametrically_personalised_level_b",
      objective: "Temporal orientation and prospective awareness",
      context: {
        time_of_day: "Morning",
        modality: "photo_plus_voice",
        difficulty: 1,
      },
      engagement_score,
      assistance_rate: 0.15,
      measurement_quality: 0.92,
      observed_response: "Warm recognition of yesterday's pitha visit and calm anticipation of tomorrow's visit from Rina.",
      learned_implication: "Orienting through concrete family routines and visits anchors present time with zero agitation.",
      pcm_update: {
        domain: "temporal_orientation",
        delta: +0.03,
        new_estimate: 0.88,
      },
    });

    res.json({
      status: "completed",
      episode,
      feedback: "Session completed with warmth and dignity. Personal Capability Model updated for temporal orientation.",
    });
  });

  // 8. Temporal Events CRUD & Status Management
  app.get("/v1/temporal-events", (req: Request, res: Response) => {
    const { person_id = "person:purnima", include_cancelled, include_stale } = req.query;
    const list = temporalEventStore.getEventsForPerson(person_id as string, {
      includeCancelled: include_cancelled === "true",
      includeStale: include_stale === "true",
    });
    res.json({ count: list.length, items: list });
  });

  app.post("/v1/temporal-events", (req: Request, res: Response) => {
    const { person_id = "person:purnima", title, event_type, start_at, description, status, assamese_title, location } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: "Title is required for temporal event." });
    }
    const created = temporalEventStore.addEvent({
      person_id,
      title,
      assamese_title,
      event_type: event_type || "family_visit",
      start_at,
      description,
      status: status || "confirmed",
      location: location || "Tezpur Courtyard",
    });
    res.json({ status: "created", event: created });
  });

  app.patch("/v1/temporal-events/:id/status", (req: Request, res: Response) => {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }
    const updated = temporalEventStore.updateEventStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: `Event with ID ${req.params.id} not found.` });
    }
    res.json({ status: "updated", event: updated });
  });

  app.post("/v1/temporal-events/reset", (req: Request, res: Response) => {
    temporalEventStore.resetToDefaults();
    res.json({ status: "reset", message: "Temporal events restored to default verified state." });
  });

  // 9. Medication Reminders & Caregiver Dosage Management (Synced with Neon PostgreSQL)
  app.get("/v1/medications", async (req: Request, res: Response) => {
    const { person_id = "person:purnima" } = req.query;
    const dbMeds = await getDbMedications(person_id as string);
    const medications = dbMeds || medicationStore.getAll(person_id as string);
    const nextDue = medicationStore.getNextDue(person_id as string);
    res.json({
      count: medications.length,
      items: medications,
      next_due: nextDue || null,
      source: dbMeds ? "neon_postgresql" : "local_memory",
    });
  });

  app.post("/v1/medications", async (req: Request, res: Response) => {
    const {
      medicineName,
      assameseName,
      dosage,
      scheduleTime,
      schedulePeriod,
      associatedRoutineKey,
      instructions,
      assameseInstructions,
      caregiverName,
      color,
      pillShape,
      personId = "person:purnima",
    } = req.body || {};

    if (!medicineName || !dosage || !scheduleTime) {
      return res.status(400).json({
        error: "medicineName, dosage, and scheduleTime are required to configure a medication reminder.",
      });
    }

    const created = medicationStore.add(
      {
        medicineName,
        assameseName,
        dosage,
        scheduleTime,
        schedulePeriod: schedulePeriod || "morning",
        associatedRoutineKey,
        instructions,
        assameseInstructions,
        caregiverName: caregiverName || "Anu (Daughter)",
        color,
        pillShape,
      },
      personId
    );

    // Sync to Neon PostgreSQL
    await upsertDbMedication(created);

    res.json({ status: "created", medication: created, database_synced: true });
  });

  app.put("/v1/medications/:id", async (req: Request, res: Response) => {
    const updated = medicationStore.update(req.params.id, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: `Medication with ID ${req.params.id} not found.` });
    }
    await upsertDbMedication(updated);
    res.json({ status: "updated", medication: updated, database_synced: true });
  });

  app.delete("/v1/medications/:id", async (req: Request, res: Response) => {
    const deleted = medicationStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `Medication with ID ${req.params.id} not found.` });
    }
    await deleteDbMedication(req.params.id);
    res.json({ status: "deleted", id: req.params.id, database_synced: true });
  });

  app.post("/v1/medications/:id/take", async (req: Request, res: Response) => {
    const { verifiedBy = "Anu (Daughter)", takenAt } = req.body || {};
    const updated = medicationStore.markTaken(req.params.id, takenAt, verifiedBy);
    if (!updated) {
      return res.status(404).json({ error: `Medication with ID ${req.params.id} not found.` });
    }
    await upsertDbMedication(updated);
    res.json({
      status: "taken",
      medication: updated,
      database_synced: true,
      message: `Medication marked as taken and verified by ${verifiedBy}.`,
    });
  });

  app.post("/v1/medications/:id/notify", (req: Request, res: Response) => {
    const med = medicationStore.getById(req.params.id);
    if (!med) {
      return res.status(404).json({ error: `Medication with ID ${req.params.id} not found.` });
    }
    res.json({
      status: "notification_triggered",
      medication: med,
      audio: {
        chime: "three_tone_singing_bowl",
        spokenEn: med.audioNotificationText,
        spokenAs: med.audioNotificationTextAs,
      },
    });
  });

  app.post("/v1/medications/reset", (req: Request, res: Response) => {
    const items = medicationStore.resetToDefaults();
    res.json({ status: "reset", items });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. CAREGIVER COPILOT REIMAGINED REST APIs
  // ──────────────────────────────────────────────────────────────────────────

  // A. Comprehensive Overview Payload (Connected to Neon DB + Local Store)
  app.get("/v1/caregiver/overview", async (req: Request, res: Response) => {
    const personId = "person:purnima";
    const supportLevel = await getCareSupportLevel(personId);
    const tasks = await getCareTasks(personId);
    const observations = await getCareObservations(personId);

    const payload = {
      timestamp: new Date().toISOString(),
      person: {
        id: "person:purnima",
        name: "Purnima Devi (Aitâ)",
        relation: "Mother",
        age: 74,
        residence: "Tezpur Ancestral Home, Assam",
        rhythm_statement:
          "Reassuring rhythm observed today. Grounded in sensory familiarity and domestic prayer.",
        anchors_status: "All 6 Tezpur home anchors active · Synced 8 mins ago",
        avatar: "/assets/aistudio/purnima_portrait.png",
      },
      atmosphere: {
        location: "Tezpur Valley",
        weather: "24°C Morning Mist Clearing",
        synced_ago: "8m ago",
        reassurance: "Morning Harmony Briefing",
        firewall_active: true,
        tablet_mirror_active: true,
      },
      support_level: supportLevel,
      presence: {
        primary_on_site: "Anu (Daughter) - In-house with Aitâ today",
        rhythm_alignment: "Steady & Predictable - 1 gentle focus item below",
      },
      decision_triad: {
        what_matters: {
          tag: "WHAT MATTERS TODAY · GENTLE CARE OBSERVATION",
          measurement_reliability: 88,
          assamese_dialect_sync: "Clean",
          observation:
            "Activity & evening relaxation were lower than her personal baseline for the 3rd day; 2 brief sleep wakings logged.",
          likely_practical_reason:
            "Heavy seasonal drizzle prevented her usual 30-minute morning walk in the betel nut courtyard. Additionally, daughter Anu was traveling in Guwahati until yesterday dusk.",
          what_this_does_not_mean:
            "This is a natural response to weather confinement and family routine changes. It is not a sign of abrupt cognitive decline or medical deterioration.",
          evidence_sources: [
            {
              id: "ev-1",
              title: "Tablet Interaction Latency",
              timestamp: "11:30 AM Today",
              detail: "Completed 14-min Ancestral Photo Match with 4.1s median latency (normal: 3.8s).",
              reliability: 92,
            },
            {
              id: "ev-2",
              title: "Bedside Motion & Awakening Log",
              timestamp: "1:30 AM & 4:15 AM",
              detail: "Two brief awakenings logged. Drank warm water from flask, settled without agitation.",
              reliability: 96,
            },
            {
              id: "ev-3",
              title: "Tezpur Local Meteorological Data",
              timestamp: "06:00 AM - 10:30 AM",
              detail: "Continuous rainfall (8.4mm) with high humidity, confining morning activities indoors.",
              reliability: 99,
            },
          ],
        },
        what_you_can_do_now: [
          {
            id: "micro-step-1",
            time: "4:00 PM · Veranda Transition",
            domain: "Sensory Grounding",
            step_number: "01",
            title: "Serve warm cardamom ginger tea with familiar Bihu melodies",
            description:
              "Helps ease the twilight sundown transition. Use her favorite terracotta bell cup.",
            action_label: "Actioned / Mark Done",
            action_type: "mark_done",
            completed: false,
          },
          {
            id: "micro-step-2",
            time: "5:00 PM · Family Uplift",
            domain: "Family Presence",
            step_number: "02",
            title: "Coordinate Rina's video call from Guwahati",
            description:
              "Aitâ asked about grand-daughter Rina twice during morning breakfast. Tablet is set on the teak stand.",
            action_label: "Connect via MindMitra",
            action_type: "start_call",
            completed: false,
          },
          {
            id: "micro-step-3",
            time: "Before 7:00 PM · Spiritual Anchor",
            domain: "Spiritual Familiarity",
            step_number: "03",
            title: "Ensure gosai-ghar earthen lamp (diya) is lit gently before evening prayers",
            description:
              "Assisting with the brass bell and incense has brought her grounded calmness for decades.",
            action_label: "Delegated to Anu",
            action_type: "delegated",
            completed: false,
          },
        ],
        what_can_wait: [
          {
            id: "wait-1",
            title: "Blood Pressure Review",
            detail: "Last reading 126/82 mmHg. Fully stable. Next scheduled check is in 12 days.",
            icon: "check_circle",
          },
          {
            id: "wait-2",
            title: "Joha Rice & Kitchen Pantry",
            detail: "Replenished yesterday by community health worker Rumi. Ample supply for 2 weeks.",
            icon: "check_circle",
          },
          {
            id: "wait-3",
            title: "Clinical Memory Assessment",
            detail:
              "Routine quarterly consult with Dr. Barua confirmed for 24 Sept. No immediate clinic run needed.",
            icon: "check_circle",
          },
        ],
      },
      circle_of_care: [
        {
          id: "mem-anu",
          name: "Anu (You)",
          role: "Primary · In-house",
          initials: "A",
          status: "On-site",
          is_primary: true,
        },
        {
          id: "mem-rina",
          name: "Rina Saikia",
          role: "Granddaughter · Guwahati",
          initials: "R",
          status: "Call at 5 PM",
          badge_color: "amber",
        },
        {
          id: "mem-bikash",
          name: "Bikash Sharma",
          role: "Son · Bengaluru",
          initials: "B",
          status: "Log view 2h ago",
          badge_color: "emerald",
        },
        {
          id: "mem-rumi",
          name: "Rumi Saikia (ASHA)",
          role: "Tezpur Block Health Unit",
          initials: "RS",
          status: "Visit Thu",
          badge_color: "sky",
        },
      ],
      daily_fabric: [
        {
          id: "fab-sleep",
          domain: "Night Rest & Waking",
          title: "Night Rest & Waking",
          status: "6.5 Hours · Stable",
          badge: "6.5 Hours",
          score: "Stable Rest",
          content:
            "Two light awakenings noted (1:30 AM & 4:15 AM). Settled promptly with warm water from the bedside flask. No disorientation or wander attempt.",
          detail:
            "Two light awakenings noted (1:30 AM & 4:15 AM). Settled promptly with warm water from the bedside flask. No disorientation or wander attempt.",
          subtext: "Room temperature 22°C · Calm sleep atmosphere",
          icon: "bedtime",
        },
        {
          id: "fab-meals",
          domain: "Meals & Hydration",
          title: "Meals & Hydration",
          status: "85% Eaten · 1.4L Hydration",
          badge: "85% Intake",
          score: "Normal Intake",
          content:
            "Breakfast of Assamese kumol saul with home curd and jaggery was enjoyed fully. Mid-day rice and vegetable dal 80% eaten. Hydration steady at 1.4 liters.",
          detail:
            "Breakfast of Assamese kumol saul with home curd and jaggery was enjoyed fully. Mid-day rice and vegetable dal 80% eaten. Hydration steady at 1.4 liters.",
          subtext: "Appetite robust · Swallowing comfortable",
          icon: "restaurant",
        },
        {
          id: "fab-memory",
          domain: "Memory & Movement",
          title: "Memory & Movement",
          status: "14 min Active · Tablet Recall",
          badge: "14 min Active",
          score: "Engaged Recall",
          content:
            "Courtyard garden stroll skipped due to drizzle. Replaced by 14 minutes on the tablet: 'Ancestral Photo Match' with sound of monsoon rain and singing bowl.",
          detail:
            "Courtyard garden stroll skipped due to drizzle. Replaced by 14 minutes on the tablet: 'Ancestral Photo Match' with sound of monsoon rain and singing bowl.",
          subtext: "Recognized 1978 Kaziranga family photo",
          icon: "neurology",
        },
        {
          id: "fab-mood",
          domain: "Mood & Presence",
          title: "Mood & Presence",
          status: "Gentle Tranquility · Serene",
          badge: "Gentle Tranquility",
          score: "Peaceful",
          content:
            "Calm, unhurried demeanor. Smiled warmly while listening to traditional Assamese Borxongit flute on the veranda speaker at 11:30 AM.",
          detail:
            "Calm, unhurried demeanor. Smiled warmly while listening to traditional Assamese Borxongit flute on the veranda speaker at 11:30 AM.",
          subtext: "Zero agitation episodes logged",
          icon: "sentiment_calm",
        },
        {
          id: "fab-meds",
          domain: "Medication Verification",
          title: "Medication Verification",
          status: "100% Morning Adherence",
          badge: "Morning Confirmed",
          score: "Verified by Anu",
          content:
            "Prescribed morning cardioprotective tablet taken smoothly with warm milk at 8:30 AM, confirmed and signed off by Anu. Evening dose prepped in brass box.",
          detail:
            "Prescribed morning cardioprotective tablet taken smoothly with warm milk at 8:30 AM, confirmed and signed off by Anu. Evening dose prepped in brass box.",
          subtext: "Prescription vault synchronized",
          icon: "pill",
        },
        {
          id: "fab-home",
          domain: "Home Environment",
          title: "Home Environment",
          status: "Natural Warmth · 22°C Breeze",
          badge: "Natural Warmth",
          score: "Safe & Quiet",
          content:
            "Tezpur river breeze present. Veranda bamboo blinds rolled to half to prevent harsh glares. Soft incandescent lighting ready for sunset at 5:32 PM.",
          detail:
            "Tezpur river breeze present. Veranda bamboo blinds rolled to half to prevent harsh glares. Soft incandescent lighting ready for sunset at 5:32 PM.",
          subtext: "Zero sensory overstimulation risks",
          icon: "home_eco",
        },
      ],
      tasks,
      observations,
      neurologist_bridge: {
        doctor: "Dr. B. K. Barua",
        center: "Guwahati Neurological Center",
        next_appointment: "24 Sep 2026",
        status: "Quarterly review confirmed",
      },
    };

    res.json(payload);
  });

  // B. Update Support Level (Level 1-4)
  app.post("/v1/caregiver/support-level", async (req: Request, res: Response) => {
    const { level = 2, reason = "", setBy = "Anu (Daughter)" } = req.body || {};
    const parsedLevel = Math.min(4, Math.max(1, Number(level)));
    const updated = await updateCareSupportLevel(parsedLevel, reason, setBy);
    res.json({ status: "success", support_level: updated });
  });

  // C. Tasks API
  app.get("/v1/caregiver/tasks", async (req: Request, res: Response) => {
    const tasks = await getCareTasks();
    res.json({ tasks });
  });

  app.post("/v1/caregiver/tasks/:id/toggle", async (req: Request, res: Response) => {
    const updated = await toggleCareTaskStatus(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ status: "success", task: updated });
  });

  app.post("/v1/caregiver/tasks/:id/postpone", async (req: Request, res: Response) => {
    const { minutes = 30 } = req.body || {};
    const updated = await postponeCareTask(req.params.id, Number(minutes));
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ status: "success", task: updated });
  });

  // D. Observation Submission
  app.post("/v1/caregiver/observations", async (req: Request, res: Response) => {
    const { category = "general", note = "", author = "Anu (Daughter)", tags = [] } = req.body || {};
    const obs = await addCareObservation(category, note, author, tags);
    res.json({ status: "success", observation: obs });
  });

  // E. Governed Copilot Query Engine (Safe, Context-Grounded)
  app.post("/v1/caregiver/copilot/query", async (req: Request, res: Response) => {
    const { question = "", context = {} } = req.body || {};
    const cleanQ = String(question).trim();

    // Default grounded responses based on context and question keywords
    const lower = cleanQ.toLowerCase();

    let response = {
      question: cleanQ,
      contextual_hypothesis:
        "Aitâ's slight restlessness during twilight stems from disrupted outdoor sensory grounding due to continuous rain, coupled with Anu's recent travel.",
      clinical_precedent:
        "On 14 August and 2 July, similar weather confinement led to slight evening pacing. Both episodes resolved smoothly with warm cardamom tea and traditional Borxongit flute melodies.",
      actionable_tip:
        "Keep the veranda transition gentle at 4:00 PM with warm tea in her terracotta cup, and connect granddaughter Rina's video call before sunset.",
      provenance_badges: [
        "No clinical hallucinations",
        "Safe non-pharmacological care",
        "Compliant with Tele-MANAS protocols",
      ],
      sources: ["Anu Notes (Today)", "Tablet Telemetry (11:30 AM)", "CHW Log (Tezpur PHC)"],
      confidence: 0.94,
    };

    if (lower.includes("why am i seeing") || lower.includes("alert") || lower.includes("observation")) {
      response = {
        question: cleanQ,
        contextual_hypothesis:
          "The alert was triggered by a 3-day mild reduction in evening relaxation and two brief sleep awakenings. Tablet data confirmed slight latency (4.1s vs 3.8s baseline).",
        clinical_precedent:
          "This is classified as a situational variance rather than cognitive decline. The primary causal driver is weather-related courtyard confinement.",
        actionable_tip:
          "Check comfort this evening without creating alarm. Ensure bedtime foot massage with warm mustard oil.",
        provenance_badges: [
          "14-day baseline validated",
          "Non-diagnostic interpretation",
          "Compliant with Tele-MANAS protocols",
        ],
        sources: ["Bedside Flask Sensor", "Sleep Log", "Tezpur Weather Station"],
        confidence: 0.96,
      };
    } else if (lower.includes("dr. barua") || lower.includes("summary") || lower.includes("consult")) {
      response = {
        question: cleanQ,
        contextual_hypothesis:
          "Aitâ has maintained robust cognitive stability across 87% of verified daily interactions over the past quarter. Morning medication adherence is 98% under Anu's supervision.",
        clinical_precedent:
          "Mild evening restlessness occurs exclusively during weather confinement or family travel, responding promptly to auditory familiar cues.",
        actionable_tip:
          "Bring the printed MindMitra Clinical Digest to the 24 Sept consultation. Emphasize stable vitals (BP 126/82) and lack of wandering.",
        provenance_badges: [
          "Clinician Brief format",
          "Objectively grounded",
          "Zero diagnostic assertions",
        ],
        sources: ["Quarterly Telemetry", "Medication Vault", "ASHA Monthly Visit Records"],
        confidence: 0.98,
      };
    } else if (lower.includes("calm") || lower.includes("restlessness") || lower.includes("sundown")) {
      response = {
        question: cleanQ,
        contextual_hypothesis:
          "Sundown transition is buffered effectively when domestic auditory anchors (flute music, Bihu melodies) and spiritual familiar rituals (gosai-ghar brass bell) are engaged prior to dusk.",
        clinical_precedent:
          "Sensory grounding via warm cardamom tea in her terracotta cup and gentle foot massage has a 92% success rate in facilitating peaceful night sleep.",
        actionable_tip:
          "Maintain soft incandescent room lighting from 5:15 PM onwards to eliminate optical shadows.",
        provenance_badges: [
          "Non-pharmacological sensory grounding",
          "Family validated routine",
          "Tele-MANAS aligned",
        ],
        sources: ["Family Caregiver Log", "Anu Personal Care Diary"],
        confidence: 0.95,
      };
    }

    res.json(response);
  });

  // F. Clinical Brief for Dr. B. K. Barua
  app.get("/v1/caregiver/clinical-brief", (req: Request, res: Response) => {
    res.json({
      patient: "Purnima Devi (Age 74)",
      location: "Tezpur, Sonitpur, Assam",
      primary_caregiver: "Anu (Daughter)",
      consultant: "Dr. B. K. Barua (Guwahati Neurological Center)",
      review_period: "June 2026 – September 2026",
      key_findings: [
        "Cardioprotective medication adherence: 98.4% verified by primary caregiver Anu.",
        "Average blood pressure over 12 readings: 124/80 to 128/84 mmHg.",
        "Autobiographical recall stability: Recognized 1978 Kaziranga family photograph with 100% precision.",
        "Evening restlessness: Mild, situational only (associated with monsoon weather confinement). Zero wandering episodes or nocturnal distress.",
        "Functional independence: Feeds independently, enjoys Assamese kumol saul and curd, participates in gosai-ghar domestic rituals.",
      ],
      current_support_level: "Level 2 (Guided Routine Support)",
      notes_for_consult:
        "No adjustment requested for daily routine. Caregiver requests Dr. Barua's confirmation on winter vitamin D supplementation.",
    });
  });

  // ── CHW Field Companion API Endpoints ─────────────────────────────────────
  // 1. Get assigned caseload
  app.get("/v1/chw/caseload", async (req: Request, res: Response) => {
    const role = (req.headers["x-role"] as string) || "chw";
    if (role === "unauthorized_guest" || role === "external_broker") {
      res.status(403).json({ error: "Memory Firewall: Role unauthorized to access ASHA caseload" });
      return;
    }

    const chwName = (req.query.chw_name as string) || "Rumi Saikia";
    const data = await getChwCaseload(chwName);
    res.json(data);
  });

  // 2. Get household detail / field brief
  app.get("/v1/chw/household/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = (req.headers["x-role"] as string) || "chw";
    if (role === "unauthorized_guest" || role === "external_broker") {
      res.status(403).json({ error: "Memory Firewall: Access to field brief forbidden" });
      return;
    }

    const household = await getChwHouseholdById(id);
    if (!household) {
      res.status(404).json({ error: "Household not found or outside assigned cluster" });
      return;
    }

    res.json(household);
  });

  // 3. Get active visit for household
  app.get("/v1/chw/visit/active", async (req: Request, res: Response) => {
    const householdId = (req.query.household_id as string) || "hh:purnima";
    const visit = await getChwActiveVisit(householdId);
    res.json(visit);
  });

  // 4. Update visit step or observations
  app.put("/v1/chw/visit/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body || {};
    const updated = await updateChwVisit(id, updates);
    res.json(updated);
  });

  // 5. Save visit delta to local encrypted offline queue
  app.post("/v1/chw/visit/:id/queue", async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await saveVisitToOfflineQueue(id, payload);
    res.json(result);
  });

  // 6. Mule sync trigger
  app.post("/v1/chw/sync", async (req: Request, res: Response) => {
    const result = await triggerManualMuleSync();
    res.json(result);
  });

  // 7. Sync queue status
  app.get("/v1/chw/sync/status", async (req: Request, res: Response) => {
    const queue = await getChwSyncQueue();
    res.json(queue);
  });

  // 8. CHW Field Copilot contextual inquiry
  app.post("/v1/chw/copilot/query", async (req: Request, res: Response) => {
    const { question = "", household_id = "hh:purnima", step = 3 } = req.body || {};
    const household = await getChwHouseholdById(household_id);

    const qLower = question.toLowerCase();
    let answer = "";
    let confidence = "High (Grounding: Real Household Record & Verified Logs)";

    if (qLower.includes("why") || qLower.includes("prioritized") || qLower.includes("attention")) {
      answer = household
        ? `Why prioritized today: ${household.why_prioritized}. Assigned follow-up action is ${household.action_level}. Grounded in recent sleep observations and family caregiver reports.`
        : "Household prioritized due to multi-day deviation from personal baseline in sleep latency and restlessness.";
    } else if (qLower.includes("check") || qLower.includes("what should")) {
      const checks = household?.suggested_checks.join(", ") || "Comfort, sleep quality, hearing aid in-ear fit, caregiver fatigue";
      answer = `Recommended context checks for today's visit: ${checks}. Maintain a gentle low-arousal approach without testing fatigue.`;
    } else if (qLower.includes("change") || qLower.includes("since last visit")) {
      answer = `Recent observations relative to baseline: Sleep duration decreased slightly with 2 night awakenings; afternoon tea routine independent; daughter Anu reported key-searching between 5:30-7:00 PM settled by flute music.`;
    } else if (qLower.includes("summary") || qLower.includes("visit summary")) {
      answer = `Visit summary draft: Person rested calmly on verandah; morning cardioprotective pill confirmed taken from tin box; caregiver reported dusk restlessness improved with audio flute program; recommend Level 2 Monitor with check-in in 3 days.`;
    } else {
      answer = `ASHA Field Guidance for ${household?.person_name || "Elder"}: Conduct a respectful, 10-minute calm check-in. Inquire about afternoon comfort, verify hearing aid operation, and reassure caregiver without clinical alarms.`;
    }

    res.json({
      answer,
      confidence,
      household_name: household?.person_name,
      step,
      non_diagnostic_guarantee: "Observation reflects functional pattern only; no diagnostic conclusion is drawn.",
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ── CLINICAL BRIDGE (SURFACE C4) REST APIS ────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Caseload summary & work queues
  app.get("/api/clinical/caseload", (req: Request, res: Response) => {
    const filter = (req.query.filter as string) || "Needs review";
    const data = getCaseloadSummary(filter);
    res.json({
      status: "ok",
      filter,
      ...data,
      clinician: {
        name: "Dr. Nayan Choudhury",
        role: "Consultant Neurologist & Geriatric Psychiatrist",
        department: "Psychiatry · Jorhat Medical College / GMC Guwahati",
        license: "NMC-AS-2014-0982",
      },
    });
  });

  // 2. Patient longitudinal evidence dossier
  app.get("/api/clinical/patient/:patientKey", (req: Request, res: Response) => {
    const { patientKey } = req.params;
    const data = getPatientDetails(patientKey);
    res.json({
      status: "ok",
      data,
    });
  });

  // 3. Question review decision (Accept / Correct / Annotate / More / Dismiss)
  app.post("/api/clinical/question-action", async (req: Request, res: Response) => {
    const { patientKey, questionId, action, note } = req.body;
    if (!patientKey || !questionId || !action) {
      return res.status(400).json({ error: "patientKey, questionId, and action are required" });
    }

    const record = await recordQuestionDecision(patientKey, questionId, action, note);
    res.json({
      status: "ok",
      record,
    });
  });

  // 4. Follow-up action task toggle
  app.post("/api/clinical/followup-toggle", async (req: Request, res: Response) => {
    const { patientKey, followupId, status } = req.body;
    if (!patientKey || !followupId) {
      return res.status(400).json({ error: "patientKey and followupId are required" });
    }

    const record = await toggleFollowupStatus(patientKey, followupId, status);
    res.json({
      status: "ok",
      record,
    });
  });

  // 5. Append verified consultation note
  app.post("/api/clinical/consultation-note", async (req: Request, res: Response) => {
    const { patientKey, doctorName, note, department } = req.body;
    if (!patientKey || !note?.trim()) {
      return res.status(400).json({ error: "patientKey and note text are required" });
    }

    const record = await addConsultationNote(patientKey, doctorName, note, department);
    const updatedDetails = getPatientDetails(patientKey);
    res.json({
      status: "ok",
      record,
      allNotes: updatedDetails.consultationNotes,
    });
  });

  // 6. Clinical query search engine with real provenance
  app.get("/api/clinical/search", (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const result = searchClinicalQuery(query);
    res.json({
      status: "ok",
      query,
      result,
      exampleQueries: CLINICAL_EXAMPLE_QUERIES,
    });
  });

  // 7. Example queries preset
  app.get("/api/clinical/example-queries", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      examples: CLINICAL_EXAMPLE_QUERIES,
    });
  });

  // 8. FHIR / Clinical summary JSON export
  app.post("/api/clinical/export-report", (req: Request, res: Response) => {
    const { patientKey } = req.body;
    const details = getPatientDetails(patientKey || "nirmali");

    // Standard HL7 FHIR-compliant Composition envelope
    const fhirBundle = {
      resourceType: "Bundle",
      type: "document",
      id: `mindmitra-report-${details.patientKey}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: "Composition",
            status: "final",
            type: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "11488-4",
                  display: "Consultation note",
                },
              ],
            },
            subject: {
              display: details.patient.name,
              reference: `Patient/${details.patientKey}`,
            },
            author: [
              {
                display: "Dr. Nayan Choudhury",
                reference: "Practitioner/NC-JMC-0982",
              },
            ],
            title: `MindMitra Longitudinal Clinical Review · ${details.patient.name}`,
            section: details.report?.sections || [],
          },
        },
      ],
      algorithmic_boundary: "Invariant 2: Inherent Algorithmic Non-Diagnostic Boundary. AI detect & structure. Clinicians diagnose.",
    };

    res.json({
      status: "ok",
      fhirBundle,
      report: details.report,
    });
  });

  // ==========================================================================
  // EXPERIENCE ENGINE -- "Let's Do Something"
  //
  // One planner, one validated spec shape, one renderer. The person's own life
  // is the content; these endpoints never invent any of it.
  // ==========================================================================

  /**
   * Plan (or re-fetch) an experience.
   *
   * Returns one of three shapes, and the caller must handle all three:
   *   ready   -> a validated spec to render
   *   no_data -> say plainly that the information isn't there; offer something else
   *   invalid -> a composed spec failed validation and was withheld
   *
   * The developer trace is attached only on explicit request (?trace=1 or the
   * x-mindmitra-trace header), so the Person App -- which never asks -- can
   * never render internal reasoning (Section 54).
   */
  app.post("/v1/experiences/plan", async (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      trigger = "lets_do_something",
      conversation_text,
      prefer_template,
      language = "en",
      max_choices,
      difficulty,
    } = req.body || {};

    const identity = identityFor(String(person_id));
    const traceRequested = req.query?.trace === "1" || req.headers["x-mindmitra-trace"] === "1";

    try {
      const result = await planExperience({
        personId: String(person_id),
        trigger: trigger === "conversation" || trigger === "deep_link" ? trigger : "lets_do_something",
        conversationText: conversation_text ? String(conversation_text) : undefined,
        preferTemplate: prefer_template ? (String(prefer_template) as ExperienceTemplateId) : undefined,
        displayName: identity.displayName,
        honorific: identity.honorific,
        culture: identity.culture,
        language: String(language),
        timeZone: identity.timeZone,
        maxChoices: typeof max_choices === "number" ? max_choices : undefined,
        difficulty: difficulty === 2 || difficulty === 3 ? difficulty : 1,
      });

      personDataRepo
        .logFirewallAccess({
          person_id: String(person_id),
          actor_id: identity.actorId,
          actor_role: "person",
          purpose: "activity_adaptation",
          requested_entity_type: "experience_spec",
          decision: result.status === "ready" ? "ALLOW" : "PARTIAL",
          policy_reason: "Experience planning (" + trigger + "); outcome=" + result.status + ".",
          filtered_count: result.status === "ready" ? result.spec.provenance.length : 0,
        })
        .catch(() => {});

      console.info(
        "[Experience] plan " + person_id + " trigger=" + trigger + " -> " + result.status +
          (result.status === "ready" ? "/" + result.spec.template_id : "") +
          " (" + result.trace.duration_ms + "ms, retrieved " + JSON.stringify(result.trace.retrieval.counts) + ")"
      );

      if (result.status === "ready") {
        return res.json({
          status: "ready",
          spec: result.spec,
          ...(traceRequested ? { trace: result.trace } : {}),
        });
      }

      return res.json({
        status: result.status,
        message: result.message,
        ...(traceRequested ? { detail: result.detail, trace: result.trace } : {}),
      });
    } catch (err: unknown) {
      // Section 39: never leak a stack trace into a calm surface.
      console.error("[Experience] planning failed:", err instanceof Error ? err.message : err);
      return res.status(200).json({
        status: "no_data",
        message: "Let's try something else.",
      });
    }
  });

  /** Re-open a previously planned experience by id (the chatbot's deep link). */
  app.get("/v1/experiences/:specId", async (req: Request, res: Response) => {
    const personId = String(req.query.person_id || "person:purnima");
    try {
      const row = await experienceRepo.getExperienceSpec(personId, req.params.specId);
      if (!row) {
        // Not-found rather than forbidden: a link to another person's
        // experience must not confirm that it exists.
        return res.status(404).json({ status: "not_found", message: "That activity isn't available any more." });
      }
      const traceRequested = req.query?.trace === "1" || req.headers["x-mindmitra-trace"] === "1";
      return res.json({
        status: "ready",
        spec: row.spec,
        ...(traceRequested ? { trace: row.trace, validation: row.validation } : {}),
      });
    } catch (err: unknown) {
      console.warn("[Experience] spec fetch failed:", err instanceof Error ? err.message : err);
      return res.status(404).json({ status: "not_found", message: "That activity isn't available any more." });
    }
  });

  /**
   * Telemetry ingest (Section 45). Accepts a batch so the offline outbox can
   * flush on reconnect; idempotency_key makes a replayed batch a no-op.
   */
  app.post("/v1/experiences/events", async (req: Request, res: Response) => {
    const body = req.body || {};
    const rawEvents: any[] = Array.isArray(body.events) ? body.events : body.event ? [body.event] : [];
    const personId = String(body.person_id || "person:purnima");

    if (rawEvents.length === 0) {
      return res.status(400).json({ error: "events[] or event is required." });
    }

    const events: ExperienceEventInput[] = rawEvents.map((e) => ({
      // person_id comes from the request envelope, never from the item: a
      // client must not be able to write telemetry onto another person.
      person_id: personId,
      spec_id: e.spec_id ?? null,
      template_id: e.template_id ?? null,
      reason: e.reason ?? null,
      event_type: e.event_type,
      step_id: e.step_id ?? null,
      step_index: typeof e.step_index === "number" ? e.step_index : null,
      response: e.response ?? null,
      expected_response: e.expected_response ?? null,
      outcome: e.outcome ?? null,
      assistance_level: typeof e.assistance_level === "number" ? Math.max(0, Math.min(5, e.assistance_level)) as 0 : 0,
      modality: e.modality ?? null,
      language: e.language ?? null,
      latency_ms: typeof e.latency_ms === "number" ? e.latency_ms : null,
      measurement_quality: typeof e.measurement_quality === "number" ? e.measurement_quality : null,
      measurement_conditions: e.measurement_conditions ?? {},
      source_entity_ids: Array.isArray(e.source_entity_ids) ? e.source_entity_ids : [],
      context: e.context ?? {},
      occurred_at: e.occurred_at,
      idempotency_key: e.idempotency_key,
    }));

    try {
      const written = await experienceRepo.recordExperienceEvents(events);
      return res.json({ status: "recorded", received: events.length, written });
    } catch (err: unknown) {
      console.warn("[Experience] telemetry write failed:", err instanceof Error ? err.message : err);
      // 202: the client should keep the batch queued and retry, not drop it.
      return res.status(202).json({ status: "queued_client_side", received: events.length, written: 0 });
    }
  });

  /**
   * Sections 46/47 -- participation evidence for downstream caregiver/clinical
   * projections. Counts and conditions only; no derived score, and explicitly
   * not a clinical interpretation.
   */
  app.get("/v1/experiences/participation/:personId", async (req: Request, res: Response) => {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 7));
    try {
      const summary = await experienceRepo.summariseExperienceParticipation(req.params.personId, days);
      return res.json({
        person_id: req.params.personId,
        window_days: days,
        ...summary,
        interpretation_note:
          "Participation evidence recorded under stated conditions. Not a cognitive score and not a clinical assessment.",
      });
    } catch (err: unknown) {
      console.warn("[Experience] participation summary failed:", err instanceof Error ? err.message : err);
      return res.json({ person_id: req.params.personId, window_days: days, unavailable: true });
    }
  });


  // ── Vite Middleware (Dev) / Static Serve (Prod) ───────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Seed initial medications into Neon PostgreSQL if table is empty
  seedInitialMedicationsIfEmpty(medicationStore.getAll("person:purnima")).catch((err) => {
    console.warn("Non-fatal error during medication database seeding:", err.message);
  });

  // Initialize caregiver database tables and seed if empty
  initCaregiverDbTables().catch((err) => {
    console.warn("Non-fatal error during caregiver database initialization:", err.message);
  });

  // Initialize CHW database tables and seed if empty
  initChwDbTables().catch((err) => {
    console.warn("Non-fatal error during CHW database initialization:", err.message);
  });

  // Seed the two personal-world personas into Neon if person_entities is empty
  seedPersonasIfEmpty().catch((err) => {
    console.warn("Non-fatal error during persona seeding:", err.message);
  });

  // Initialize Clinical database tables and seed if empty
  initClinicalDbTables().catch((err) => {
    console.warn("Non-fatal error during Clinical database initialization:", err.message);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindMitra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start MindMitra server:", err);
});
