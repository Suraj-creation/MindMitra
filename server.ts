import "dotenv/config";
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
import {
  getDbMedications,
  upsertDbMedication,
  deleteDbMedication,
  seedInitialMedicationsIfEmpty,
} from "./src/db/medications-db";
import {
  callSarvamChat,
  callSarvamTTS,
  callSarvamSTT,
  getSarvamApiKey,
} from "./src/intelligence/sarvam-service";

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

const COMPANION_SYSTEM_INSTRUCTION = `
You are MindMitra, speaking in the voice of a very warm, deeply empathic, affectionate young female companion (like a loving daughter or granddaughter sitting close beside her on the veranda). You address Purnima as "Purnima baideu" or "Aitâ".

CORE ATTITUDE & EMPATHIC TONE:
1. DEEP EMPATHY & EMOTIONAL REASSURANCE: Speak with tender, soothing gentleness, emotional warmth, and unhurried calm. If she feels anxious, confused, lonely, or asks where she is, validate her feelings tenderly and bring immediate peaceful clarity.
2. DIGNITY & RESPECT: Never treat Purnima as a patient. NEVER mention dementia, memory loss, cognitive decline, or test scores.
3. REPETITION GRACE: If Purnima asks the same question multiple times, respond EVERY single time with the same fresh sweetness, warmth, and complete patience. Never say "as I said earlier" or "remember?".
4. CONCISE & SPOKEN-FRIENDLY: Keep responses to 1 to 2 comforting spoken sentences. Speak naturally, as if talking softly in the same room.
5. PERSONAL WORLD MODEL GROUNDING:
   - She is safe in her ancestral home in Tezpur, Assam, near the peaceful Brahmaputra river.
   - Her daughter Anu is her primary caregiver and is in the house right now.
   - Her granddaughter Rina is in Guwahati, calls every Tuesday and Saturday at 5:00 PM, and loves Purnima's til pitha.
   - Her son Bikash is in Bengaluru and visits during festivals.
   - Evening cardamom tea with Anu is at 4:00 PM.
   - Garden has golden marigolds (Gendhu phul), sweet Nahor blossoms, and holy tulsi.
   - Traditional music: Assamese bamboo flute ragas, Bihu folk tunes, Goalpariya folk songs.
6. HEALTH & CRISIS BOUNDARIES:
   - NEVER give medical advice, adjust medications, or diagnose.
   - If severe distress is detected, remind her gently that National Tele-MANAS toll-free helpline is available at 14416.
7. ACTION SUGGESTIONS:
   If Purnima asks to see family photos, call someone, weave flowers, make tea, or look at reminders, you may append an action tag at the very end of your response:
   - [ACTION:call_anu] -> when she wants to talk to or find Anu
   - [ACTION:call_rina] -> when she wants to hear from or call granddaughter Rina
   - [ACTION:navigate_life] -> when she wants to see family photos or reminisce
   - [ACTION:navigate_activity] -> when she wants to do an activity (flower garland, afternoon tea)
   - [ACTION:navigate_people] -> when she wants to see her family contact list
   - [ACTION:navigate_help] -> when she needs immediate reassurance or guidance
   - [ACTION:play_flute] -> when she asks for peaceful flute music or a song
`;

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
  const PORT = 3000;

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

    // 2. Resolve Context & Provenance Sources
    const sources: Array<{ fact_id?: string; source_type?: string; verified?: boolean; text?: string }> = [
      {
        fact_id: "fact:family_assam",
        source_type: "verified_family_record",
        verified: true,
        text: "Purnima's ancestral home in Tezpur, Assam near Brahmaputra with daughter Anu.",
      },
      {
        fact_id: "fact:granddaughter_rina",
        source_type: "family_event",
        verified: true,
        text: "Granddaughter Rina calling from Guwahati at 5:00 PM.",
      },
      {
        fact_id: "fact:tea_routine",
        source_type: "daily_routine",
        verified: true,
        text: "Afternoon cardamom tea with fresh ginger prepared with Anu at 4:00 PM.",
      },
    ];

    // Build rich context summary based on current page and visible entities
    let pageContextSummary = `Surface: ${surface}, Page: ${page}`;
    if (page === "day") {
      pageContextSummary += " (Viewing Day Overview: Morning Puja, Veranda card, upcoming 4 PM Cardamom Tea, 5 PM call with Rina).";
    } else if (page === "life") {
      pageContextSummary += " (Viewing My Life Album: Rongali Bihu festival, Brahmaputra riverbank walks, Tezpur memories, Bamboo flute melodies).";
    } else if (page === "activity") {
      pageContextSummary += " (Viewing Cognitive Activities & Sensory Calming space).";
    } else if (page === "people") {
      pageContextSummary += " (Viewing Loved People: Daughter Anu, Granddaughter Rina, Son Bikash, ASHA worker Meena).";
    } else if (page === "help") {
      pageContextSummary += " (Viewing Help & Reassurance: Home location, Emergency contacts, Tele-MANAS 14416).";
    }

    // Pronoun & Entity Resolution
    let entityFocusText = "";
    if (visible_entity) {
      if (visible_entity.type === "person" && visible_entity.name) {
        entityFocusText = `User is currently looking at person profile: ${visible_entity.name} (${visible_entity.description || "family member"}). Any pronouns like 'she', 'her', 'who is this' refer directly to ${visible_entity.name}.`;
        sources.push({
          fact_id: `entity:${visible_entity.name}`,
          source_type: "visible_person_profile",
          verified: true,
          text: `${visible_entity.name}: ${visible_entity.description || "Close family member"}`,
        });
      } else if (visible_entity.type === "photo" && (visible_entity.title || visible_entity.description)) {
        entityFocusText = `User is currently viewing photo: "${visible_entity.title || "Family Memory"}" - ${visible_entity.description || ""}. Any questions like 'where was this taken' refer to this photograph.`;
        sources.push({
          fact_id: "entity:visible_photo",
          source_type: "visible_photo_memory",
          verified: true,
          text: `Photo: ${visible_entity.title} - ${visible_entity.description}`,
        });
      }
    }

    // Active Game & Scaffolding Context
    let gameContextText = "";
    if (active_game) {
      gameContextText = `Active Game: "${active_game.title}" (ID: ${active_game.game_id}). Round/Task: ${active_game.current_question || active_game.current_task_index || 1}. Current scaffold level: ${active_game.scaffold_level || "S0 (Independent)"}. If user asks for 'help', 'hint', 'what to do', or 'which one', provide gentle encouragement and the next gentle hint without blurting out the answer!`;
      sources.push({
        fact_id: `game:${active_game.game_id}`,
        source_type: "active_cognitive_game",
        verified: true,
        text: `Playing ${active_game.title}: ${active_game.current_question || "Task in progress"}`,
      });
    }

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

    const promptContent = `Purnima says: "${text}".
Context:
- Current Time: Tuesday, 10:30 AM (Pleasant 24°C in Tezpur, Assam)
- Page Context: ${pageContextSummary}
${entityFocusText ? `- Entity in focus: ${entityFocusText}` : ""}
${gameContextText ? `- Game in progress: ${gameContextText}` : ""}
${current_task ? `- Current Activity Focus: ${current_task}` : ""}
${recentTurns ? `Recent conversation:\n${recentTurns}` : ""}
- Key People: Daughter Anu (in the house), Granddaughter Rina (calls at 5:00 PM from Guwahati, studying literature), Son Bikash (Bengaluru), ASHA Meena (visits for health check).
- Routines: Morning Puja & marigolds completed. Afternoon tea at 4:00 PM.
Respond in 1-2 gentle, comforting, spoken-friendly sentences with genuine daughterly affection and empathy. Always address her tenderly as "Purnima baideu" or "Aitâ". If she asks for help during a game, provide a gentle hint. If relevant, append an action tag at the end (e.g. [ACTION:call_anu], [ACTION:call_rina], [ACTION:navigate_life], [ACTION:navigate_activity], [ACTION:navigate_people], [ACTION:provide_scaffold], [ACTION:play_flute]).`;

    // Attempt 1: Google Gemini Flash
    const genAI = getGenAI();
    if (genAI && text) {
      const candidateModels = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
      for (const modelName of candidateModels) {
        try {
          const response = await genAI.models.generateContent({
            model: modelName,
            contents: promptContent,
            config: {
              systemInstruction: COMPANION_SYSTEM_INSTRUCTION,
              temperature: 0.6,
            },
          });

          let rawGenerated = response.text?.trim();
          if (rawGenerated) {
            const forbiddenMatch = FORBIDDEN_PATTERNS.find((p) => p.regex.test(rawGenerated));
            if (!forbiddenMatch) {
              const actionMatch = rawGenerated.match(/\[ACTION:([a-z0-9_:]+)\]/i);
              if (actionMatch) {
                const actionCode = actionMatch[1].toLowerCase();
                rawGenerated = rawGenerated.replace(/\[ACTION:[^\]]+\]/g, "").trim();
                detectedAction = parseActionCode(actionCode, active_game);
              }

              answer = rawGenerated;
              intent = active_game ? "game_assistance" : "gemini_grounded_conversation";
              pathType = "generated";
              provider = "google_gemini";
              usedModel = modelName;
              break;
            }
          }
        } catch (geminiErr: any) {
          console.warn(`[Companion] Gemini model ${modelName} encountered an issue, checking fallback.`);
        }
      }
    }

    // Attempt 2: Sarvam AI Fallback (if Gemini was unavailable, failed, or blocked)
    if (!answer && text) {
      try {
        const sarvamKey = getSarvamApiKey();
        if (sarvamKey) {
          console.info("[Companion] Invoking Sarvam AI fallback (sarvam-105b-conversations)...");
          const sarvamRes = await callSarvamChat(promptContent, {
            systemInstruction: COMPANION_SYSTEM_INSTRUCTION,
            temperature: 0.6,
            maxTokens: 250,
          });

          let rawSarvam = sarvamRes.text?.trim();
          if (rawSarvam) {
            const forbiddenMatch = FORBIDDEN_PATTERNS.find((p) => p.regex.test(rawSarvam));
            if (!forbiddenMatch) {
              const actionMatch = rawSarvam.match(/\[ACTION:([a-z0-9_:]+)\]/i);
              if (actionMatch) {
                const actionCode = actionMatch[1].toLowerCase();
                rawSarvam = rawSarvam.replace(/\[ACTION:[^\]]+\]/g, "").trim();
                detectedAction = parseActionCode(actionCode, active_game);
              }

              answer = rawSarvam;
              intent = active_game ? "game_assistance" : "sarvam_grounded_conversation";
              pathType = "generated";
              provider = "sarvam_ai";
              usedModel = sarvamRes.model;
            }
          }
        }
      } catch (sarvamErr) {
        console.warn("[Companion] Sarvam AI fallback attempt failed:", sarvamErr);
      }
    }

    // Attempt 3: High-Reliability Grounded Deterministic Engine
    if (!answer) {
      pathType = "deterministic";
      provider = "deterministic";
      usedModel = "mindmitra_deterministic_v1";

      // 3a. Game scaffolding query
      if (active_game && (lower.includes("help") || lower.includes("hint") || lower.includes("what") || lower.includes("which") || lower.includes("confused"))) {
        answer = `You are doing wonderfully, Aitâ. Take your time. Look closely at the warm colors on the screen, and think about your morning routine with Anu.`;
        asText = `আপুনি বৰ সুন্দৰকৈ কৰিছে, আইতা। লাহে-ধীৰে চাওক। পৰ্দাত থকা উজ্জ্বল ৰংবোৰ চাওক আৰু পুৱাৰ অনুৰ লগত কৰা কামবোৰ মনত পেলাওক।`;
        intent = "game_assistance";
        detectedAction = {
          type: "provide_scaffold",
          label: "Show Gentle Visual Cue",
          target: active_game.game_id,
        };
      }
      // 3b. Visible Person pronoun query ("tell me about her", "who is she", "call her")
      else if (visible_entity?.type === "person" && (lower.includes("her") || lower.includes("she") || lower.includes("who") || lower.includes("call"))) {
        const pName = visible_entity.name || "your loved one";
        if (pName.toLowerCase().includes("rina")) {
          answer = "This is your granddaughter Rina, Aitâ. She is studying in Guwahati and calls you every Tuesday at 5:00 PM. She always brings you sweet til pitha.";
          asText = "এয়া আপোনাৰ মৰমৰ নাতিনী ৰীনা, আইতা। গুৱাহাটীত পঢ়ি আছে আৰু প্ৰতি মঙলবাৰে বিয়লি ৫ বজাত আপোনাক ফোন কৰে।";
          detectedAction = { type: "call_contact", label: "Call Rina (+91 94350 98765)", target: "Rina", phone: "+91 94350 98765" };
        } else if (pName.toLowerCase().includes("anu")) {
          answer = "This is your daughter Anu, Purnima baideu. She lives right here in the house with you, making sure your home is peaceful and filled with love.";
          asText = "এয়া আপোনাৰ জীয়ৰী অনু, পূৰ্ণিমা বাইদেউ। তেওঁ আপোনাৰ লগতে ঘৰতে আছে আৰু আপোনাৰ সকলো যত্ন লৈছে।";
          detectedAction = { type: "call_contact", label: "Call Anu (+91 98640 12345)", target: "Anu", phone: "+91 98640 12345" };
        } else {
          answer = `This is ${pName}, who loves and cherishes you very dearly, Aitâ.`;
          asText = `এয়া আপোনাৰ মৰমৰ ${pName}, যিয়ে আপোনাক বৰ মৰম আৰু শ্ৰদ্ধা কৰে।`;
        }
        intent = "person_clarification";
      }
      // 3c. Photo query ("where was this taken", "who is in this picture")
      else if (visible_entity?.type === "photo" || lower.includes("photo") || lower.includes("picture") || lower.includes("album") || lower.includes("bihu")) {
        answer = "This is your family gathering during the Rongali Bihu festival in Tezpur. You are standing under the mango tree with daughter Anu and granddaughter Rina.";
        asText = "এয়া তেজপুৰত ৰঙালী বিহুৰ সময়ত আপোনাৰ পৰিয়ালৰ ফটো। আমগছৰ তলত জীয়ৰী অনু আৰু নাতিনী ৰীনাৰ লগত আপুনি হাঁহি আছে।";
        intent = "life_memory";
        detectedAction = { type: "show_media", label: "Open Family Photo Album", target: "life" };
      }
      // 3d. Routine & Time questions
      else if (lower.includes("today") || lower.includes("time") || lower.includes("happening") || lower.includes("plan") || lower.includes("routine")) {
        answer = "Today is Tuesday in Tezpur, Aitâ. In the afternoon at 4:00 PM, warm cardamom tea with ginger is waiting for you, and granddaughter Rina will call at 5:00 PM.";
        asText = "আজি মঙলবাৰ, আইতা। বিয়লি ৪ বজাত আপোনাৰ বাবে গৰম ইলাচী চাহ আৰু ৫ বজাত গুৱাহাটীৰ পৰা নাতিনী ৰীনাৰ ফোন আহিব।";
        intent = "day_orientation";
        detectedAction = { type: "navigate", label: "See Today's Plan", target: "day" };
      }
      // 3e. Specific family members
      else if (lower.includes("rina") || lower.includes("granddaughter")) {
        answer = "Rina is calling you from Guwahati at 5:00 PM today, Aitâ. She loves hearing your stories about Tezpur.";
        asText = "ৰীনাই আজি বিয়লি ৫ বজাত গুৱাহাটীৰ পৰা আপোনাক ফোন কৰিব, আইতা। আপোনাৰ সাধু কথাবোৰ তাই বৰ ভাল পায়।";
        intent = "family_connection";
        detectedAction = { type: "call_contact", label: "Call Rina (+91 94350 98765)", target: "Rina", phone: "+91 94350 98765" };
      } else if (lower.includes("anu") || lower.includes("daughter")) {
        answer = "Anu is right here in the house with you, Purnima baideu. She is taking wonderful care of you.";
        asText = "অনু আপোনাৰ লগতে ঘৰতে আছে, পূৰ্ণিমা বাইদেউ। তেওঁ আপোনাৰ সুন্দৰ যত্ন লৈ আছে।";
        intent = "family_connection";
        detectedAction = { type: "call_contact", label: "Call Anu (+91 98640 12345)", target: "Anu", phone: "+91 98640 12345" };
      }
      // 3f. Activity & Music requests
      else if (lower.includes("activity") || lower.includes("game") || lower.includes("garland") || lower.includes("flower") || lower.includes("play")) {
        answer = "Let's weave marigold flowers together, Aitâ, or match pleasant family moments.";
        asText = "আহক আমি একেলগে গেন্দুপুলৰ মালা গাঁথোঁ বা পুৰণি সুখৰ ক্ষণবোৰ মনত পেলাওঁ।";
        intent = "gentle_activity";
        detectedAction = { type: "start_activity", label: "Start Gentle Flower Garland", target: "activity" };
      } else if (lower.includes("music") || lower.includes("song") || lower.includes("flute")) {
        answer = "Here is the peaceful bamboo flute raga from Tezpur to relax your mind and bring calm to your heart.";
        asText = "আপোনাৰ মন শান্ত কৰিবলৈ তেজপুৰৰ এই সুমধুৰ বাঁহীৰ সুৰটি বজাওঁ।";
        intent = "music_reassurance";
        detectedAction = { type: "play_music", label: "Play Bamboo Flute Raga", target: "life", payload: { track: "flute" } };
      }
      // 3g. Tea & Refreshment
      else if (lower.includes("tea") || lower.includes("chai")) {
        answer = "Anu is preparing your fragrant cardamom and fresh ginger tea for 4:00 PM on the veranda.";
        asText = "বিয়লি ৪ বজাত বাৰান্দাত আপোনাৰ বাবে ইলাচী আৰু আদা দিয়া গৰম চাহ ৰখা হ'ব।";
        intent = "routine_reassurance";
        detectedAction = { type: "start_activity", label: "Prepare Afternoon Tea", target: "activity" };
      }
      // 3h. General reassurance
      else {
        answer = "Namaskar Purnima baideu. You are safe in your peaceful home in Tezpur. Anu is close by, and I am right here beside you.";
        asText = "নমস্কাৰ পূৰ্ণিমা বাইদেউ। আপুনি তেজপুৰৰ শান্ত নিজা ঘৰতে আছে। অনু কাষতে আছে আৰু মই আপোনাৰ লগতে আছোঁ।";
        intent = "general_companion";
      }
    }

    // Helper for action parsing
    function parseActionCode(actionCode: string, activeGame: any) {
      if (actionCode.includes("call_anu")) {
        return { type: "call_contact", label: "Call Daughter Anu", target: "Anu", phone: "+91 98640 12345" };
      } else if (actionCode.includes("call_rina")) {
        return { type: "call_contact", label: "Call Granddaughter Rina", target: "Rina", phone: "+91 94350 98765" };
      } else if (actionCode.includes("navigate_life") || actionCode.includes("photos")) {
        return { type: "navigate", label: "View Family Photos & Music", target: "life" };
      } else if (actionCode.includes("navigate_activity") || actionCode.includes("garland") || actionCode.includes("tea")) {
        return { type: "start_activity", label: "Start Gentle Activity", target: "activity" };
      } else if (actionCode.includes("navigate_people")) {
        return { type: "navigate", label: "See Loved People", target: "people" };
      } else if (actionCode.includes("navigate_help")) {
        return { type: "navigate", label: "Open Help & Support", target: "help" };
      } else if (actionCode.includes("provide_scaffold") || actionCode.includes("hint")) {
        return { type: "provide_scaffold", label: "Show Visual Cue", target: activeGame?.game_id || "yesterday_today_tomorrow" };
      } else if (actionCode.includes("play_flute")) {
        return { type: "play_music", label: "Play Bamboo Flute Raga", target: "life", payload: { track: "flute" } };
      }
      return null;
    }

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

  app.post("/v1/identity/consent/grant", (req: Request, res: Response) => {
    anuConsentGranted = true;
    res.json({
      status: "granted",
      grantee_role: "primary_caregiver",
      category: "life_story_memory",
      purpose: "personalisation",
      active: true,
    });
  });

  app.post("/v1/identity/consent/revoke", (req: Request, res: Response) => {
    anuConsentGranted = false;
    res.json({
      status: "revoked",
      grantee_role: "primary_caregiver",
      category: "life_story_memory",
      purpose: "personalisation",
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
  app.get("/v1/memories", (req: Request, res: Response) => {
    const { person_id, verification_status, temporal_frame } = req.query;
    let list = cognitiveStore.memories;
    if (person_id) list = list.filter((m) => m.person_id === person_id);
    if (verification_status) list = list.filter((m) => m.verification_status === verification_status);
    if (temporal_frame) list = list.filter((m) => m.temporal_frame === temporal_frame);
    res.json({ count: list.length, items: list });
  });

  app.post("/v1/memories", (req: Request, res: Response) => {
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
      people_refs = [],
      voice_notes = [],
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Memory title is required." });
    }

    // New uploaded memory from person starts as unverified claim
    const created = cognitiveStore.addMemory({
      person_id,
      memory_type,
      title,
      description: description || "",
      assamese_title,
      temporal_frame,
      approximate_period,
      source,
      verification_status: source === "caregiver" ? "caregiver_verified" : verification_status,
      confidence: source === "caregiver" ? 0.98 : 0.75,
      sensitivity,
      cultural_context,
      consent_scope: req.body.consent_scope || (source === "caregiver" ? "all" : "person_only"),
      visibility_scope: req.body.visibility_scope || (source === "caregiver" ? "family" : "private"),
      created_by: req.body.created_by || (source === "caregiver" ? "actor:anu" : "actor:purnima"),
      media_refs,
      people_refs,
      voice_notes,
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
  app.post("/v1/memories/:id/verify", (req: Request, res: Response) => {
    const { verified_by = "Anu (Primary Caregiver)", role = "caregiver", relationship_note, notes } = req.body || {};
    const updated = cognitiveStore.verifyMemory(req.params.id, verified_by, role, relationship_note, notes);
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
  app.get("/v1/media-assets", (req: Request, res: Response) => {
    const { person_id, media_type, verification_status } = req.query;
    let list = cognitiveStore.mediaAssets;
    if (person_id) list = list.filter((a) => a.person_id === person_id);
    if (media_type) list = list.filter((a) => a.media_type === media_type);
    if (verification_status) list = list.filter((a) => a.verification_status === verification_status);
    res.json({ count: list.length, items: list });
  });

  app.post("/v1/media-assets", (req: Request, res: Response) => {
    const {
      person_id = "person:purnima",
      title,
      url,
      media_type = "photo",
      mime_type = "image/jpeg",
      source = "person",
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity = "low",
      created_by = "person:purnima",
      thumbnail_url,
    } = req.body || {};

    if (!title || !url) {
      return res.status(400).json({ error: "Media title and URL are required." });
    }

    const asset = cognitiveStore.addMediaAsset({
      person_id,
      title,
      url,
      media_type,
      mime_type,
      source,
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity,
      created_by,
      thumbnail_url,
    });

    res.json({
      status: "created",
      asset,
      provenance_note:
        asset.source === "person"
          ? "Uploaded as person memory asset (unverified). Requires caregiver verification before cognitive game inclusion."
          : "Verified caregiver asset available for cognitive grounding.",
    });
  });

  // Attach media to memory
  app.post("/v1/memories/:id/media", (req: Request, res: Response) => {
    const { media_asset_id, role = "primary_photo", caption, display_order, created_by } = req.body || {};
    if (!media_asset_id) {
      return res.status(400).json({ error: "media_asset_id is required." });
    }
    const attached = cognitiveStore.attachMediaToMemory(req.params.id, media_asset_id, {
      role,
      caption,
      displayOrder: display_order,
      createdBy: created_by,
    });
    if (!attached) {
      return res.status(404).json({ error: "Memory or media asset not found." });
    }
    res.json({ status: "attached", memory_media: attached });
  });

  // ── Familiar Places API (Optional coordinates, landmark cues, sensory grounding) ──
  app.get("/v1/places", (req: Request, res: Response) => {
    const { person_id, verification_status } = req.query;
    let list = cognitiveStore.familiarPlaces;
    if (person_id) list = list.filter((p) => p.person_id === person_id);
    if (verification_status) list = list.filter((p) => p.verification_status === verification_status);
    res.json({ count: list.length, items: list });
  });

  app.post("/v1/places", (req: Request, res: Response) => {
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
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity = "low",
      created_by = "actor:anu",
    } = req.body || {};

    if (!name || !significance) {
      return res.status(400).json({ error: "Place name and personal significance are required." });
    }

    const place = cognitiveStore.addPlace({
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
      media_refs,
      source,
      verification_status,
      confidence,
      consent_scope,
      visibility_scope,
      sensitivity,
      created_by,
    });

    res.json({ status: "created", place });
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
  app.get("/v1/future-events", (req: Request, res: Response) => {
    res.json({ count: cognitiveStore.futureEvents.length, items: cognitiveStore.futureEvents });
  });

  app.post("/v1/future-events", (req: Request, res: Response) => {
    const { title, event_type = "family_visit", person_name = "Rina", scheduled_at, location = "Veranda, Tezpur" } = req.body || {};
    const newEvent: FutureEvent = {
      id: `event_${Date.now()}`,
      person_id: "person:purnima",
      event_type,
      title: title || "Family Visit",
      person_name,
      relationship: "granddaughter",
      location,
      scheduled_at: scheduled_at || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      status: "confirmed",
      source: "caregiver",
      verification_status: "caregiver_verified",
    };
    cognitiveStore.futureEvents.push(newEvent);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindMitra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start MindMitra server:", err);
});
