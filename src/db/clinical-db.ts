import { queryDb } from "./neon";
import {
  LADDER,
  NIRMALI,
  CHANGES,
  SIGNALS,
  RESEARCH,
  FUNC,
  MQ,
  EVID,
  CONTRA,
  QUESTIONS,
  FOLLOWUPS,
  OTHERS,
  AITA_CHANGES,
  AITA_SIGNALS,
  AITA_FUNC,
  AITA_MQ,
  AITA_EVID,
  AITA_QUESTIONS,
  AITA_FOLLOWUPS,
  AITA_REPORT,
  PDATA,
  PMETA,
} from "./clinical-data";

export interface QuestionDecisionRecord {
  patient_key: string;
  question_id: string;
  action: "accepted" | "correct" | "annotate" | "more" | "dismissed" | "saved-correct" | "saved-annotate";
  note?: string;
  resolved_line?: string;
  updated_at: string;
}

export interface FollowupStatusRecord {
  patient_key: string;
  followup_id: string;
  status: "open" | "in_progress" | "completed";
  updated_at: string;
}

export interface ConsultationNoteRecord {
  id: string;
  patient_key: string;
  doctor_name: string;
  department: string;
  note: string;
  created_at: string;
}

// In-Memory resilient state
const questionDecisionsMemory = new Map<string, QuestionDecisionRecord>();
const followupStatusMemory = new Map<string, FollowupStatusRecord>();
const consultationNotesMemory: ConsultationNoteRecord[] = [
  {
    id: "cn_init_01",
    patient_key: "nirmali",
    doctor_name: "Dr. Nayan Choudhury",
    department: "Psychiatry · Jorhat Medical College",
    note: "Initial baseline review: noted guided assistance emerging in evening meal prep. Rule out sensory deficit prior to any cognitive change hypothesis. Hearing aid assessment requested from CHW Bhaskar Das.",
    created_at: "2026-08-12T14:30:00Z",
  },
];

// Pre-packaged verified clinical example queries
export const CLINICAL_EXAMPLE_QUERIES = [
  {
    label: "Functional changes, last 60 days",
    text: "Two functional changes in the caseload. Nirmali Bora: meal preparation, independent to guided, first observed 22 Aug, 6 observations, persistent 16 days. Bhogeswar Nath: money handling, one caregiver observation on 26 Aug, not established.",
    prov: "Retrieved from the clinical projection: 2 signals, 7 observations, 3 sources. Nothing generated beyond these records.",
  },
  {
    label: "Observations supporting the cooking change",
    text: "Six: CHW direct observation on 22 Aug, 27 Aug and 02 Sep; caregiver reports on 24 Aug and 28 Aug; one person statement on 30 Aug. Four of the six recorded guided assistance. The 29 Aug observation was made in a different kitchen and is held but not counted.",
    prov: "Provenance preserved on each item. Open change 1 to read them in full.",
  },
  {
    label: "Conflicting medication information",
    text: "Three lists differ on metformin frequency and on one unnamed sleep tablet present only in the caregiver's list. Kept unresolved; no list has been selected or blended.",
    prov: "Sources: clinic record 12 Aug, CHW 02 Sep, caregiver 06 Sep. Action recorded: verify at the 11 Sep review.",
  },
  {
    label: "Low-quality measurements this period",
    text: "Four of sixteen interaction sessions. Reasons: poor audio in four, hearing aid unavailable in three, language mismatch in two. All four are excluded from ability interpretation and retained for exposure.",
    prov: "Device metadata plus CHW note of 24 Aug. See measurement quality.",
  },
];

export async function initClinicalDbTables(): Promise<void> {
  try {
    await queryDb(`
      CREATE TABLE IF NOT EXISTS clinical_question_decisions (
        id VARCHAR(128) PRIMARY KEY,
        patient_key VARCHAR(64) NOT NULL,
        question_id VARCHAR(64) NOT NULL,
        action VARCHAR(64) NOT NULL,
        note TEXT,
        resolved_line TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clinical_followup_status (
        id VARCHAR(128) PRIMARY KEY,
        patient_key VARCHAR(64) NOT NULL,
        followup_id VARCHAR(64) NOT NULL,
        status VARCHAR(64) NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clinical_consultation_notes (
        id VARCHAR(128) PRIMARY KEY,
        patient_key VARCHAR(64) NOT NULL,
        doctor_name VARCHAR(128) NOT NULL,
        department VARCHAR(128) NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("[ClinicalDB] PostgreSQL tables verified or created.");
  } catch (err: any) {
    console.warn("[ClinicalDB] PostgreSQL init skipped or offline, using resilient in-memory store:", err?.message || err);
  }
}

export function getCaseloadSummary(filter: string = "Needs review") {
  const mkPatientRow = (src: any, isN: boolean = false) => ({
    key: src.key,
    name: src.name,
    line: src.line,
    lastReview: src.lastReview,
    freshShort: src.freshShort,
    why: src.why,
    strip: src.strip,
    tag: src.tag,
    tagBg: src.tagBg,
    tagBd: src.tagBd,
    tagFg: src.tagFg,
    cells: src.cells,
  });

  const allRows = [mkPatientRow(NIRMALI, true)].concat(OTHERS.map((o: any) => mkPatientRow(o)));

  const byKey: Record<string, string[]> = {
    "Needs review": ["Nirmali Bora", "Aita Sangma", "Bhogeswar Nath", "Hemanta Gogoi"],
    "Meaningful change": ["Nirmali Bora", "Aita Sangma"],
    "Evidence insufficient": ["Bhogeswar Nath", "Ratna Hazarika"],
    "Unresolved questions": ["Nirmali Bora", "Aita Sangma", "Bhogeswar Nath"],
    "Everyone": allRows.map((x) => x.name),
  };

  const keep = byKey[filter] || byKey.Everyone;
  const filteredRows = allRows.filter((x) => keep.indexOf(x.name) >= 0);

  const queueTiles = [
    { n: "3", label: "Awaiting your review today", fg: "#241F1A", route: "home" },
    { n: "1", label: "Acute-change relevance, L5", fg: "#7A4A12", patient: "aita", route: "snapshot" },
    { n: "2", label: "Evidence not yet sufficient", fg: "#7A4A12", route: "caseload" },
    { n: "7", label: "Unresolved questions across the caseload", fg: "#241F1A", route: "caseload" },
    { n: "3", label: "Recent CHW visits, unread", fg: "#241F1A", route: "caseload" },
  ];

  const acuteAlert = {
    patientKey: "aita",
    patientName: "Aita Sangma",
    age: 74,
    headline: "Aita Sangma, 74 — recent observations differ substantially from her own pattern of the last five months.",
    routedBy: "Routed by the safety engine, 07 Sep 08:40",
    rows: [
      { k: "Observed", v: "New confusion about place, reduced activity, two nights of broken sleep" },
      { k: "Compared with", v: "Her own record, stable across the previous five months" },
      { k: "Measurement", v: "Trustworthy — good audio, hearing aid in use, daughter present" },
      { k: "Sources", v: "Person app × 2 sessions, daughter × 3 entries, CHW × 1 call" },
      { k: "Not known", v: "Infection symptoms, hydration, pain, recent medication change" },
      { k: "System position", v: "No cause inferred. Routed by the deterministic safety engine, not by a model." },
    ],
  };

  const weakQueue = [
    {
      name: "Bhogeswar Nath",
      key: "bhogeswar",
      why: "A CHW screening and one functional observation. No interaction sessions, so no baseline and nothing to compare.",
      action: "He did not attend on 2 September. His wife has not been reachable; transport is the usual reason in that ward.",
    },
    {
      name: "Ratna Hazarika",
      key: "ratna",
      why: "Consent to share with a clinician is not recorded, so no projection was built for her.",
      action: "Visible to you only as an outstanding consent, not as a record.",
    },
  ];

  return {
    queueTiles,
    acuteAlert,
    weakQueue,
    patients: filteredRows,
    allPatients: allRows,
    activeFilter: filter,
    availableFilters: ["Needs review", "Meaningful change", "Evidence insufficient", "Unresolved questions", "Everyone"],
  };
}

export function getPatientDetails(patientKey: string) {
  const isNirmali = patientKey === "nirmali";
  const other = OTHERS.find((o: any) => o.key === patientKey);
  const restrictedPatient = Boolean(other && other.restricted);
  const D = (PDATA as Record<string, any>)[patientKey] || null;

  const patientMeta = (PMETA as Record<string, any>)[patientKey] || {};

  const p = isNirmali
    ? { ...NIRMALI, changeLine: "3 meaningful changes since 12 Aug · 4 open questions" }
    : {
        first: other ? other.name.split(" ")[0] : "",
        period: "No previous clinician review",
        confidence: "Insufficient",
        questions: 0,
        fresh: [],
        network: [],
        snapshot: [],
        unknowns: [],
        ...(other || {}),
        ...patientMeta,
      };

  // Get current recorded decisions for this patient
  const decisions: Record<string, QuestionDecisionRecord> = {};
  questionDecisionsMemory.forEach((rec, memKey) => {
    if (rec.patient_key === patientKey) {
      decisions[rec.question_id] = rec;
    }
  });

  // Get current followup statuses
  const followupsState: Record<string, FollowupStatusRecord> = {};
  followupStatusMemory.forEach((rec, memKey) => {
    if (rec.patient_key === patientKey) {
      followupsState[rec.followup_id] = rec;
    }
  });

  // Get consultation notes
  const consultationNotes = consultationNotesMemory.filter((cn) => cn.patient_key === patientKey);

  // Accepted annotations count
  const acceptedCount = Object.values(decisions).filter((d) =>
    ["accepted", "saved-correct", "saved-annotate"].includes(d.action)
  ).length;

  // Report generator
  let reportData = null;
  if (patientKey === "aita") {
    reportData = AITA_REPORT(acceptedCount);
  } else if (patientKey === "nirmali") {
    reportData = {
      footer:
        "Compiled 07 Sep 2026, 14:20 · sources: 14 person-app sessions, 5 caregiver observations, 3 CHW visits, 1 clinician review · author: Dr. N. Choudhury · every line traceable in the evidence appendix.",
      head: [
        { k: "Review period", v: "12 Aug → 07 Sep 2026" },
        { k: "Data as of", v: "07 Sep 2026, 14:20" },
        { k: "Overall evidence", v: "Moderate confidence" },
        { k: "Sources", v: "14 person-app sessions, 5 caregiver observations, 3 CHW visits" },
        {
          k: "Your annotations",
          v:
            acceptedCount > 0
              ? `${acceptedCount} finding(s) reviewed by you`
              : "None yet — open Questions and review",
        },
      ],
      sections: [
        {
          label: "Executive summary",
          lead:
            "Three changes differ from her own recent pattern: guided assistance now needed for meal preparation, orientation questions well above her baseline for six days, and evening restlessness on six of eight evenings alongside shortened sleep. One interaction signal is not interpretable because of measurement conditions. One medication conflict is unresolved. Pain, hydration and urinary symptoms have not been assessed.",
          hasRows: false,
          hasList: false,
        },
        {
          label: "1 · Function",
          hasRows: true,
          rows: [
            { k: "Fact", v: "Meal preparation requires guided assistance in 4 of 6 observations." },
            { k: "Change", v: "Independent → guided. First observed 22 Aug, held 16 days." },
            { k: "Evidence", v: "CHW × 3 direct observations, caregiver × 2 reports, 1 person statement." },
            { k: "Context", v: "Fatigue reported on 3 of the visits. Sleep below her own baseline in the same period." },
            { k: "Measurement", v: "Good — observed in her own kitchen." },
            { k: "Question", v: "Is this persistent, or is it tracking the sleep disruption?" },
          ],
        },
        {
          label: "2 · Cognitive and interaction",
          hasRows: true,
          rows: [
            {
              k: "Fact",
              v: "Repetition and orientation questions at about 4.3 a day against her own baseline of about 1.7.",
            },
            { k: "Change", v: "+153% against her own record, held 6 days, 28 events." },
            { k: "Measurement", v: "Moderate. 4 of 16 sessions excluded before the comparison was made." },
            { k: "Her own account", v: "“I am not confused. I ask because nobody tells me twice.” 07 Sep." },
            { k: "Question", v: "Reassess hearing before this is read as cognitive." },
          ],
        },
        {
          label: "3 · Behaviour and context",
          hasRows: true,
          rows: [
            { k: "Fact", v: "Restlessness on 6 of 8 evenings, mostly 18:30–20:00, settling by about 21:00." },
            {
              k: "Candidate contributors",
              v: "Sleep 5.2 h against 6.8 h; son's shift change on 29 Aug; heat and road noise recorded by the CHW; unnamed sleep tablet in one medication list.",
            },
            { k: "Not established", v: "Pain, urinary symptoms, environment measurements. No cause attributed." },
            {
              k: "What was tried",
              v: "Son sitting with her and talking about Nagaon. She settled within 20 minutes on 4 of 4 occasions.",
            },
          ],
        },
        {
          label: "Measurement quality",
          hasRows: true,
          rows: [
            { k: "Sessions", v: "16 · 10 good, 2 moderate, 4 poor." },
            {
              k: "Reasons for poor",
              v: "Poor audio in 4; hearing aid unavailable in 3; Assamese–Hindi language mismatch in 2.",
            },
            {
              k: "Effect",
              v: "Word-finding signal withheld from interpretation. Sessions retained for exposure only.",
            },
            { k: "Next measurement", v: "Quiet room, before 17:00, aid in place, language confirmed." },
          ],
        },
        {
          label: "Contradictions",
          hasRows: true,
          rows: [
            {
              k: "Medication list",
              v: "Three sources differ on metformin frequency and on one unnamed sleep tablet. Unresolved; no list selected.",
            },
            {
              k: "Hearing aid",
              v: "Caregiver reports it in use; CHW and device metadata indicate it has been absent since 24 Aug. Unresolved.",
            },
          ],
        },
        {
          label: "Not known for this period",
          hasList: true,
          list: [
            { t: "Pain — no structured observation since 12 Aug." },
            { t: "Hydration — insufficient data." },
            { t: "Urinary symptoms — never assessed." },
            { t: "Sleep — caregiver report only, no instrumented nights." },
          ],
        },
        {
          label: "Interventions since last review",
          hasRows: true,
          rows: [
            {
              k: "Cognitive activity",
              v: "18 sessions, 13 voluntary. Music reminiscence repeatedly preferred; sequencing tasks hardest. Engagement stable. Not established as a measure of cognitive recovery.",
            },
            {
              k: "Caregiver strategy",
              v: "Co-presence in the evenings, introduced 31 Aug by her son. Following its introduction, restlessness settled within about 20 minutes on each recorded occasion. Not evidence that it prevents episodes.",
            },
            {
              k: "CHW education",
              v: "Two family sessions, 24 Aug and 02 Sep. Talking with someone who forgets; things worth putting down.",
            },
          ],
        },
        {
          label: "Open questions for the review",
          hasList: true,
          list: [
            { t: "Is the functional change persistent, or tracking the sleep disruption?" },
            {
              t: "Reassess hearing before interpreting interaction signals. Last audiometry 2019; aid absent since 24 Aug.",
            },
            { t: "Reconcile the medication list with the strips present. Identify the sleep tablet." },
            { t: "Assess pain, hydration and urinary symptoms before attributing the restlessness." },
          ],
        },
      ],
    };
  }

  return {
    patientKey,
    isNirmali,
    restricted: restrictedPatient,
    hasData: Boolean(D),
    patient: p,
    changes: D ? D.changes : [],
    signals: D ? D.signals : [],
    researchSignals: isNirmali ? RESEARCH : [],
    func: D ? D.func : [],
    ladder: LADDER,
    mq: D ? D.mq : MQ,
    evid: D ? D.evid : [],
    contra: D ? D.contra : [],
    questions: D ? D.questions : [],
    followups: D ? D.followups : [],
    decisions,
    followupsState,
    consultationNotes,
    report: reportData,
  };
}

export async function recordQuestionDecision(
  patientKey: string,
  questionId: string,
  action: QuestionDecisionRecord["action"],
  note?: string
): Promise<QuestionDecisionRecord> {
  const resolvedLine =
    action === "accepted"
      ? "Accepted as a finding for the 11 September review."
      : action === "dismissed"
      ? "Dismissed as not clinically relevant. The underlying observations stay in the record."
      : action === "saved-annotate"
      ? "Annotated by you."
      : action === "saved-correct"
      ? "Corrected. A new clinician-authored observation was created; the original was not edited."
      : action === "more"
      ? "Marked as needing more data. A measurement request went to the field worker's app."
      : "";

  const record: QuestionDecisionRecord = {
    patient_key: patientKey,
    question_id: questionId,
    action,
    note: note || "",
    resolved_line: resolvedLine,
    updated_at: new Date().toISOString(),
  };

  const key = `${patientKey}:${questionId}`;
  questionDecisionsMemory.set(key, record);

  try {
    await queryDb(
      `INSERT INTO clinical_question_decisions (id, patient_key, question_id, action, note, resolved_line, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         action = EXCLUDED.action,
         note = EXCLUDED.note,
         resolved_line = EXCLUDED.resolved_line,
         updated_at = EXCLUDED.updated_at`,
      [key, patientKey, questionId, action, note || "", resolvedLine, record.updated_at]
    );
  } catch (err: any) {
    console.warn("[ClinicalDB] Neon query failed, kept in-memory:", err?.message || err);
  }

  return record;
}

export async function toggleFollowupStatus(
  patientKey: string,
  followupId: string,
  status?: FollowupStatusRecord["status"]
): Promise<FollowupStatusRecord> {
  const key = `${patientKey}:${followupId}`;
  const existing = followupStatusMemory.get(key);
  const nextStatus: FollowupStatusRecord["status"] =
    status || (existing?.status === "in_progress" ? "open" : "in_progress");

  const record: FollowupStatusRecord = {
    patient_key: patientKey,
    followup_id: followupId,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  followupStatusMemory.set(key, record);

  try {
    await queryDb(
      `INSERT INTO clinical_followup_status (id, patient_key, followup_id, status, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [key, patientKey, followupId, nextStatus, record.updated_at]
    );
  } catch (err: any) {
    console.warn("[ClinicalDB] Neon query failed, kept in-memory:", err?.message || err);
  }

  return record;
}

export async function addConsultationNote(
  patientKey: string,
  doctorName: string,
  note: string,
  department: string = "Psychiatry · Jorhat Medical College"
): Promise<ConsultationNoteRecord> {
  const id = `cn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: ConsultationNoteRecord = {
    id,
    patient_key: patientKey,
    doctor_name: doctorName || "Dr. Nayan Choudhury",
    department,
    note: note.trim(),
    created_at: new Date().toISOString(),
  };

  consultationNotesMemory.unshift(record);

  try {
    await queryDb(
      `INSERT INTO clinical_consultation_notes (id, patient_key, doctor_name, department, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, patientKey, record.doctor_name, record.department, record.note, record.created_at]
    );
  } catch (err: any) {
    console.warn("[ClinicalDB] Neon query failed, kept in-memory:", err?.message || err);
  }

  return record;
}

export function searchClinicalQuery(queryText: string) {
  const q = queryText.toLowerCase().trim();
  const matchedExample = CLINICAL_EXAMPLE_QUERIES.find((e) =>
    e.label.toLowerCase().includes(q) || q.includes(e.label.toLowerCase())
  );

  if (matchedExample) {
    return {
      found: true,
      label: matchedExample.label,
      text: matchedExample.text,
      prov: matchedExample.prov,
    };
  }

  // Keyword match fallback
  if (q.includes("cooking") || q.includes("meal") || q.includes("kitchen")) {
    return {
      found: true,
      label: "Observations supporting the cooking change",
      text: "Six: CHW direct observation on 22 Aug, 27 Aug and 02 Sep; caregiver reports on 24 Aug and 28 Aug; one person statement on 30 Aug. Four of the six recorded guided assistance.",
      prov: "Retrieved from clinical projection: 6 observations, 3 sources. Provenance preserved.",
    };
  }

  if (q.includes("medication") || q.includes("drug") || q.includes("pill") || q.includes("metformin")) {
    return {
      found: true,
      label: "Conflicting medication information",
      text: "Three lists differ on metformin frequency and on one unnamed sleep tablet present only in the caregiver's list. Kept unresolved; no list has been selected or blended.",
      prov: "Sources: clinic record 12 Aug, CHW 02 Sep, caregiver 06 Sep.",
    };
  }

  if (q.includes("quality") || q.includes("hearing") || q.includes("audio") || q.includes("telemetry")) {
    return {
      found: true,
      label: "Low-quality measurements this period",
      text: "Four of sixteen interaction sessions excluded from ability interpretation due to poor ambient noise, hearing aid unavailable, or language mismatch.",
      prov: "Device metadata plus CHW note of 24 Aug.",
    };
  }

  return {
    found: false,
    text: `Searched clinical projection for "${queryText}". Verified evidence records matched 0 automated claims. Only observed telemetry and direct caregiver/CHW provenance are indexed.`,
    prov: "MindMitra Algorithmic Non-Diagnostic Boundary. Zero model hallucinations allowed.",
  };
}
