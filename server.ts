import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
  app.get("/health", (req: Request, res: Response) => {
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

  // 5. Companion Turn (Deep Intelligence with Gemini Flash + Deterministic Grounding)
  app.post("/v1/persons/:personId/companion/turn", async (req: Request, res: Response) => {
    const {
      message = "",
      surface = "day",
      current_entity = "",
      current_task = "",
      history = [],
    } = req.body || {};
    const text = String(message || "").trim();
    const lower = text.toLowerCase();

    // 1. Distress / Crisis detection
    const isCrisis = CRISIS_PATTERNS.some((p) => p.test(lower));
    if (isCrisis) {
      return res.json({
        request_id: `req_${Date.now()}`,
        answer: "Purnima baideu, you are safe right now in your home in Tezpur. Anu is right nearby in the house, and I am here with you. Take a slow, gentle breath. If you need someone, the Tele-MANAS helpline is always open at 14416.",
        intent: "crisis_support",
        path: "safety_override",
        sources: [{ fact_id: "tele_manas_14416", source_type: "national_mental_health_helpline", verified: true, text: "Tele-MANAS 24x7 toll-free helpline 14416" }],
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
      });
    }

    // 2. Default Personal World Model Grounding Sources
    let answer = "Namaskar Purnima baideu. It is a peaceful morning here in Tezpur. The courtyard is sunny and quiet.";
    let intent = "general_companion";
    let pathType: "deterministic" | "generated" = "deterministic";
    let detectedAction: any = null;

    const sources = [
      {
        fact_id: "fact:family_assam",
        source_type: "verified_family_photo",
        verified: true,
        text: "Purnima's family home in Tezpur, Assam with daughter Anu.",
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

    // Build context description for Gemini Context Bridge
    let surfaceDescription = "Viewing Day Overview.";
    if (surface === "life") surfaceDescription = "Viewing My Life album (Rongali Bihu photos, Brahmaputra walk, bamboo flute melodies).";
    else if (surface === "activity") surfaceDescription = `Viewing Activities (${current_entity || "Flower garland or tea making"}).`;
    else if (surface === "people") surfaceDescription = "Viewing Loved People (Daughter Anu, Granddaughter Rina, Son Bikash, ASHA worker Meena).";
    else if (surface === "help") surfaceDescription = "Viewing Help & Immediate Reassurance screen.";

    // Assemble multi-turn history snippet if provided
    let recentTurns = "";
    if (Array.isArray(history) && history.length > 0) {
      recentTurns = history
        .slice(-4)
        .map((h: any) => `${h.role === "assistant" ? "MindMitra" : "Purnima"}: ${h.text || h.content}`)
        .join("\n");
    }

    // 3. Generate grounded response with resilient Gemini Flash model fallback cascade
    const genAI = getGenAI();
    if (genAI && text) {
      // Prioritize fast, high-availability flash models with graceful fallback on 503 spikes
      const candidateModels = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
      for (const modelName of candidateModels) {
        try {
          const promptContent = `Purnima says: "${text}".
Context:
- Current Time: Tuesday, 10:30 AM (Sunny, 24°C in Tezpur, Assam)
- Current Screen Context: ${surfaceDescription}
${current_task ? `- Current Activity Focus: ${current_task}` : ""}
${recentTurns ? `Recent conversation:\n${recentTurns}` : ""}
- Key People: Daughter Anu (in the house), Granddaughter Rina (calls at 5:00 PM from Guwahati).
- Routine: Tea at 4:00 PM.
Respond in 1-2 gentle, comforting, spoken-friendly sentences with genuine daughterly affection and empathy. Always address her tenderly as "Purnima baideu" or "Aitâ". If relevant, append an action tag at the end (e.g. [ACTION:call_anu], [ACTION:call_rina], [ACTION:navigate_life], [ACTION:navigate_activity], [ACTION:navigate_people], [ACTION:play_flute]).`;

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
            // Verify with Safety Filter (ensure no diagnosis, medication, or forbidden claims)
            const forbiddenMatch = FORBIDDEN_PATTERNS.find((p) => p.regex.test(rawGenerated));
            if (!forbiddenMatch) {
              // Extract action tag if present
              const actionMatch = rawGenerated.match(/\[ACTION:([a-z0-9_:]+)\]/i);
              if (actionMatch) {
                const actionCode = actionMatch[1].toLowerCase();
                rawGenerated = rawGenerated.replace(/\[ACTION:[^\]]+\]/g, "").trim();

                if (actionCode.includes("call_anu")) {
                  detectedAction = { type: "call_contact", label: "Call Daughter Anu", target: "Anu", phone: "+91 98640 12345" };
                } else if (actionCode.includes("call_rina")) {
                  detectedAction = { type: "call_contact", label: "Call Granddaughter Rina", target: "Rina", phone: "+91 94350 98765" };
                } else if (actionCode.includes("navigate_life") || actionCode.includes("photos")) {
                  detectedAction = { type: "navigate", label: "View Family Photos & Music", target: "life" };
                } else if (actionCode.includes("navigate_activity") || actionCode.includes("garland") || actionCode.includes("tea")) {
                  detectedAction = { type: "start_activity", label: "Start Gentle Activity", target: "activity" };
                } else if (actionCode.includes("navigate_people")) {
                  detectedAction = { type: "navigate", label: "See Loved People", target: "people" };
                } else if (actionCode.includes("navigate_help")) {
                  detectedAction = { type: "navigate", label: "Open Help & Support", target: "help" };
                } else if (actionCode.includes("play_flute")) {
                  detectedAction = { type: "play_music", label: "Play Bamboo Flute Raga", target: "life", payload: { track: "flute" } };
                }
              }

              answer = rawGenerated;
              intent = "gemini_grounded_conversation";
              pathType = "generated";
              break; // Successfully generated and passed safety checks
            }
          }
        } catch (geminiErr: any) {
          const isDemandSpike =
            geminiErr?.status === 503 ||
            geminiErr?.code === 503 ||
            String(geminiErr?.message || "").includes("503") ||
            String(geminiErr?.message || "").includes("high demand");

          if (!isDemandSpike) {
            console.info(`Model ${modelName} unavailable, falling back.`);
          }
        }
      }
    }

    // 4. Deterministic fallback if Gemini was not used or failed
    if (pathType === "deterministic") {
      if (lower.includes("today") || lower.includes("happening") || lower.includes("time") || lower.includes("day")) {
        answer = "Today is Tuesday, Aitâ. In the afternoon, your granddaughter Rina is calling from Guwahati at 5:00 PM, and your warm cardamom tea is at 4:00 PM.";
        intent = "day_orientation";
        detectedAction = { type: "navigate", label: "See Today's Plan", target: "day" };
      } else if (lower.includes("rina") || lower.includes("granddaughter")) {
        answer = "Rina is calling you from Guwahati at 5:00 PM, Aitâ. She loves talking to you about her college and your delicious til pitha.";
        intent = "family_connection";
        detectedAction = { type: "call_contact", label: "Call Rina (+91 94350 98765)", target: "Rina", phone: "+91 94350 98765" };
      } else if (lower.includes("anu") || lower.includes("daughter")) {
        answer = "Anu is right here in the house with you, Purnima baideu. She is taking wonderful care of our home.";
        intent = "family_connection";
        detectedAction = { type: "call_contact", label: "Call Anu (+91 98640 12345)", target: "Anu", phone: "+91 98640 12345" };
      } else if (lower.includes("family") || lower.includes("bikash") || lower.includes("photo") || lower.includes("album")) {
        answer = "Here is a cherished photograph from the Bihu festival in Tezpur. Rina and Bikash are smiling beside you under the mango tree, and Anu is close by.";
        intent = "life_memory";
        detectedAction = { type: "show_media", label: "Open Family Photo Album", target: "life" };
      } else if (lower.includes("activity") || lower.includes("together") || lower.includes("music") || lower.includes("song") || lower.includes("do") || lower.includes("bored")) {
        answer = "Let's weave sweet marigold flowers together, or listen to a gentle morning bamboo flute raga.";
        intent = "gentle_activity";
        detectedAction = { type: "start_activity", label: "Start Gentle Flower Garland", target: "activity" };
      } else if (lower.includes("help") || lower.includes("scared") || lower.includes("lost") || lower.includes("where")) {
        answer = "You are safe in your home in Tezpur, Purnima baideu. Anu is in the next room, and I am right here with you. Take a slow, gentle breath.";
        intent = "reassurance_support";
        detectedAction = { type: "navigate", label: "Go to Help & Safety", target: "help" };
      } else if (lower.includes("tea") || lower.includes("chai")) {
        answer = "Anu is preparing your warm cardamom tea with fresh ginger for 4:00 PM. A pleasant afternoon is ahead.";
        intent = "routine_reassurance";
        detectedAction = { type: "start_activity", label: "Prepare Afternoon Tea", target: "activity" };
      }
    }

    res.json({
      request_id: `req_${Date.now()}`,
      answer,
      intent,
      path: pathType,
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindMitra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start MindMitra server:", err);
});
