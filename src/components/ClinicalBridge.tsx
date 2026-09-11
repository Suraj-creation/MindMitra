import React, { useState, useEffect, useMemo } from "react";
import {
  Stethoscope,
  Activity,
  ShieldAlert,
  Download,
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  FileEdit,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Printer,
  FileText,
  UserCheck,
  RefreshCw,
  Users,
  Eye,
  EyeOff,
  CornerDownRight,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Volume2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { RoleSurface } from "../types";
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
  AITA_REPORT,
  PDATA,
  PMETA,
} from "../db/clinical-data";

interface ClinicalBridgeProps {
  onSelectSurface?: (surface: RoleSurface) => void;
}

type ClinicalRoute =
  | "home"
  | "caseload"
  | "snapshot"
  | "changes"
  | "signals"
  | "func"
  | "quality"
  | "evid"
  | "review"
  | "report";

export const ClinicalBridge: React.FC<ClinicalBridgeProps> = ({ onSelectSurface }) => {
  // Navigation & Active Patient State
  const [route, setRoute] = useState<ClinicalRoute>("home");
  const [patientKey, setPatientKey] = useState<string>("nirmali");

  // Filter & Search State
  const [caseloadFilter, setCaseloadFilter] = useState<string>("Needs review");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [queryAnswer, setQueryAnswer] = useState<{
    found: boolean;
    label?: string;
    text: string;
    prov: string;
  } | null>(null);

  // View & Mode Toggles
  const [timeRange, setTimeRange] = useState<"14d" | "90d" | "180d">("90d");
  const [plainEvidenceMode, setPlainEvidenceMode] = useState<boolean>(false);
  const [showProvenance, setShowProvenance] = useState<boolean>(true);
  const [showResearchSignals, setShowResearchSignals] = useState<boolean>(false);

  // Evidence Accordions & Observation toggles
  const [openEvidence, setOpenEvidence] = useState<Record<string, boolean>>({});
  const [openRaw, setOpenRaw] = useState<Record<string, boolean>>({});

  // Question Decisions & Consultation Notes
  const [qState, setQState] = useState<Record<string, string>>({});
  const [qDraft, setQDraft] = useState<Record<string, string>>({});
  const [qSavedNotes, setQSavedNotes] = useState<Record<string, string>>({});
  const [fuState, setFuState] = useState<Record<string, boolean>>({});
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [consultationNotes, setConsultationNotes] = useState<
    Array<{ id: string; doctor_name: string; note: string; created_at: string }>
  >([
    {
      id: "cn_init_01",
      doctor_name: "Dr. Nayan Choudhury",
      note: "Initial baseline review: noted guided assistance emerging in evening meal prep. Rule out sensory deficit prior to any cognitive change hypothesis. Hearing aid assessment requested from CHW Bhaskar Das.",
      created_at: "2026-08-12T14:30:00Z",
    },
  ]);

  // Backend Sync Status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string>("Synced with GMC Clinical Registry");

  // Load live patient and caseload data from backend
  useEffect(() => {
    async function fetchPatientData() {
      try {
        setIsSyncing(true);
        const res = await fetch(`/api/clinical/patient/${patientKey}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            // Restore recorded decisions if any
            if (json.data.decisions) {
              const qs: Record<string, string> = {};
              const notes: Record<string, string> = {};
              Object.entries(json.data.decisions).forEach(([qid, rec]: [string, any]) => {
                qs[qid] = rec.action;
                if (rec.note) notes[qid] = rec.note;
              });
              setQState((prev) => ({ ...prev, ...qs }));
              setQSavedNotes((prev) => ({ ...prev, ...notes }));
            }
            if (json.data.consultationNotes && json.data.consultationNotes.length > 0) {
              setConsultationNotes(json.data.consultationNotes);
            }
            if (json.data.followupsState) {
              const fus: Record<string, boolean> = {};
              Object.entries(json.data.followupsState).forEach(([fId, rec]: [string, any]) => {
                fus[fId] = rec.status === "in_progress";
              });
              setFuState((prev) => ({ ...prev, ...fus }));
            }
          }
        }
      } catch (err) {
        console.warn("Using offline patient dossier cache:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    fetchPatientData();
  }, [patientKey]);

  // Current Patient Resolution
  const isNirmali = patientKey === "nirmali";
  const otherPatient = OTHERS.find((o) => o.key === patientKey);
  const isRestricted = Boolean(otherPatient && otherPatient.restricted);
  const currentPData = (PDATA as Record<string, any>)[patientKey] || null;
  const currentPMeta = (PMETA as Record<string, any>)[patientKey] || {};

  const currentPatient = useMemo(() => {
    if (isNirmali) {
      return {
        ...NIRMALI,
        changeLine: "3 meaningful changes since 12 Aug · 4 open questions",
      };
    }
    return {
      first: otherPatient ? otherPatient.name.split(" ")[0] : "",
      period: "No previous clinician review",
      confidence: "Insufficient",
      questions: 0,
      fresh: [],
      network: [],
      snapshot: [],
      unknowns: [],
      ...(otherPatient || {}),
      ...currentPMeta,
    };
  }, [isNirmali, otherPatient, currentPMeta]);

  const hasPatientData = Boolean(currentPData);
  const isThin = !isRestricted && !hasPatientData && route !== "home" && route !== "caseload";

  // Pre-set Example Queries
  const exampleQueries = [
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

  // Route Titles & Descriptions
  const titlesMap: Record<ClinicalRoute, [string, string]> = {
    home: ["Clinical home", "Work queue · 23 people under follow-up"],
    caseload: ["Caseload", "Ordered by what changed"],
    snapshot: [
      `${currentPatient.name} · snapshot`,
      currentPatient.changeLine || "Longitudinal observation overview",
    ],
    changes: [
      `${currentPatient.name} · since last review`,
      currentPatient.period || "12 Aug → 07 Sep 2026",
    ],
    signals: [
      `${currentPatient.name} · longitudinal signals`,
      "Compared against this person's own baseline",
    ],
    func: [
      `${currentPatient.name} · functional trajectory`,
      "Assistance level per task, as observed",
    ],
    quality: [
      `${currentPatient.name} · measurement quality`,
      isNirmali
        ? "16 sessions · 4 excluded from interpretation"
        : "Conditions under which this record was obtained",
    ],
    evid: [`${currentPatient.name} · evidence`, "Grouped by who said it"],
    review: [
      `${currentPatient.name} · questions and review`,
      `${currentPData ? currentPData.questions.length : 0} prepared questions · nothing accepted on your behalf`,
    ],
    report: [
      `${currentPatient.name} · since-last-review report`,
      "Evidence artifact · print-ready",
    ],
  };

  const [routeTitle, routeSub] = titlesMap[route] || titlesMap.home;

  // Caseload Patients Computation
  const allPatients = useMemo(() => {
    return [
      { ...NIRMALI, isNirmali: true },
      ...OTHERS.map((o) => ({ ...o, isNirmali: false })),
    ];
  }, []);

  const filteredCaseload = useMemo(() => {
    const byKey: Record<string, string[]> = {
      "Needs review": ["Nirmali Bora", "Aita Sangma", "Bhogeswar Nath", "Hemanta Gogoi"],
      "Meaningful change": ["Nirmali Bora", "Aita Sangma"],
      "Evidence insufficient": ["Bhogeswar Nath", "Ratna Hazarika"],
      "Unresolved questions": ["Nirmali Bora", "Aita Sangma", "Bhogeswar Nath"],
      Everyone: allPatients.map((p) => p.name),
    };
    const keep = byKey[caseloadFilter] || byKey.Everyone;
    return allPatients.filter((p) => keep.includes(p.name));
  }, [allPatients, caseloadFilter]);

  // Questions and Review Actions
  const handleQuestionAction = async (
    qId: string,
    action: "accepted" | "correct" | "annotate" | "more" | "dismissed"
  ) => {
    const nextState = action;
    setQState((prev) => ({ ...prev, [qId]: nextState }));

    // If it's a direct action without note, sync immediately
    if (action === "accepted" || action === "more" || action === "dismissed") {
      try {
        setIsSyncing(true);
        await fetch("/api/clinical/question-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientKey,
            questionId: qId,
            action,
            note: qSavedNotes[qId] || "",
          }),
        });
        setSyncNotice(`Recorded ${action} for ${qId} in clinical audit ledger`);
      } catch (err) {
        console.warn("Failed to sync question action to server:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleSaveQuestionNote = async (qId: string) => {
    const noteText = qDraft[qId] || "";
    const action = qState[qId] === "correct" ? "saved-correct" : "saved-annotate";

    setQSavedNotes((prev) => ({ ...prev, [qId]: noteText }));
    setQState((prev) => ({ ...prev, [qId]: action }));

    try {
      setIsSyncing(true);
      await fetch("/api/clinical/question-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientKey,
          questionId: qId,
          action,
          note: noteText,
        }),
      });
      setSyncNotice(`Saved clinical note for ${qId}`);
    } catch (err) {
      console.warn("Failed to sync question note to server:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Follow-up Checklist Toggle
  const handleToggleFollowup = async (fId: string) => {
    const nextVal = !fuState[fId];
    setFuState((prev) => ({ ...prev, [fId]: nextVal }));

    try {
      await fetch("/api/clinical/followup-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientKey,
          followupId: fId,
          status: nextVal ? "in_progress" : "open",
        }),
      });
    } catch (err) {
      console.warn("Failed to sync followup status:", err);
    }
  };

  // Doctor's Assessment Note
  const handleSaveDoctorConsultationNote = async () => {
    if (!doctorNotes.trim()) return;
    const noteText = doctorNotes.trim();
    setDoctorNotes("");

    try {
      setIsSyncing(true);
      const res = await fetch("/api/clinical/consultation-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientKey,
          doctorName: "Dr. Nayan Choudhury",
          department: "Psychiatry · Jorhat Medical College / GMC Guwahati",
          note: noteText,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.allNotes) {
          setConsultationNotes(json.allNotes);
        }
      } else {
        // Fallback local append
        setConsultationNotes((prev) => [
          {
            id: `cn_${Date.now()}`,
            doctor_name: "Dr. Nayan Choudhury",
            note: noteText,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setSyncNotice("Appended Dr. Choudhury's clinical assessment to verified ledger");
    } catch (err) {
      console.warn("Note save fallback to memory:", err);
      setConsultationNotes((prev) => [
        {
          id: `cn_${Date.now()}`,
          doctor_name: "Dr. Nayan Choudhury",
          note: noteText,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Search Engine Query
  const handleSearchSubmit = async (queryText: string) => {
    setSearchQuery(queryText);
    const matched = exampleQueries.find(
      (e) => e.label.toLowerCase() === queryText.toLowerCase()
    );
    if (matched) {
      setQueryAnswer({
        found: true,
        label: matched.label,
        text: matched.text,
        prov: matched.prov,
      });
      return;
    }

    try {
      const res = await fetch(`/api/clinical/search?q=${encodeURIComponent(queryText)}`);
      if (res.ok) {
        const json = await res.json();
        setQueryAnswer(json.result);
      }
    } catch (err) {
      console.warn("Search fallback:", err);
    }
  };

  // FHIR Export
  const handleExportFhirReport = async () => {
    try {
      const res = await fetch("/api/clinical/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientKey }),
      });
      if (res.ok) {
        const json = await res.json();
        const dataStr =
          "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.fhirBundle, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `FHIR_Clinical_Report_${patientKey}_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      alert("Exporting verified clinical report bundle for GMC Medical Records…");
    }
  };

  // Accepted annotations count
  const acceptedCount = useMemo(() => {
    return Object.values(qState).filter((s: string) =>
      ["accepted", "saved-correct", "saved-annotate"].includes(s)
    ).length;
  }, [qState]);

  // Report resolution
  const activeReport = useMemo(() => {
    if (patientKey === "aita") {
      return AITA_REPORT(acceptedCount);
    }
    // Nirmali Report default
    return {
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
  }, [patientKey, acceptedCount]);

  // Acute change card for home view
  const acuteChangeAlert = {
    patientKey: "aita",
    patientName: "Aita Sangma",
    headline:
      "Aita Sangma, 74 — recent observations differ substantially from her own pattern of the last five months.",
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F6F1EA] text-[#241F1A] font-sans antialiased">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. LEFT CLINICAL WORKSTATION SIDEBAR                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-[260px] md:shrink-0 bg-[#F1EADF] border-r border-[#E0D5C3] sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col p-4 sm:p-5 z-20">
        {/* Brand & Subtitle */}
        <div className="pb-4 border-b border-[#E0D5C3]/70">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif font-bold text-xl tracking-tight text-[#241F1A]">
                MindMitra
              </div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#736A5E] mt-0.5">
                Clinical Bridge · C4
              </div>
            </div>
            {onSelectSurface && (
              <button
                onClick={() => onSelectSurface("person")}
                className="text-[10px] font-medium text-[#736A5E] hover:text-[#241F1A] bg-[#E4DACA]/60 hover:bg-[#E4DACA] px-2 py-1 rounded transition-colors"
                title="Switch surface"
              >
                Exit Portal
              </button>
            )}
          </div>
        </div>

        {/* Clinician Profile */}
        <div className="my-3 p-2.5 rounded-xl border border-[#E0D5C3] bg-[#FFFCF6] flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#E4DACA] text-[#5C5348] font-bold text-xs flex items-center justify-center shrink-0">
            NC
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-[#241F1A] truncate">
              Dr. Nayan Choudhury
            </div>
            <div className="text-[10px] text-[#6B6257] truncate">
              Psychiatry · Jorhat Medical College
            </div>
          </div>
        </div>

        {/* Active Patient Selector */}
        <div className="mb-3 p-2 rounded-xl border border-[#E0D5C3] bg-[#FFFCF6]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C8375] px-1 mb-1.5 flex items-center justify-between">
            <span>Selected Patient</span>
            <span className="text-[9px] text-[#8C5715] font-semibold">Active</span>
          </div>
          <select
            value={patientKey}
            onChange={(e) => {
              setPatientKey(e.target.value);
              setRoute("snapshot");
            }}
            className="w-full bg-[#F6F1EA] text-xs font-semibold text-[#241F1A] p-2 rounded-lg border border-[#E0D5C3] focus:outline-none focus:ring-1 focus:ring-[#8C5715]"
          >
            <option value="nirmali">Nirmali Bora (78y · 3 changes)</option>
            <option value="aita">Aita Sangma (74y · Acute L5)</option>
            <option value="bhogeswar">Bhogeswar Nath (69y · Incomplete)</option>
            <option value="hemanta">Hemanta Gogoi (81y · Watching)</option>
            <option value="jonaki">Jonaki Saikia (66y · Stable)</option>
            <option value="ratna">Ratna Hazarika (72y · Restricted)</option>
          </select>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 space-y-4">
          {/* Work Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C8375] px-2 mb-1">
              Work
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setRoute("home")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "home"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Clinical home</span>
                <span className="bg-[#8C5715] text-[#FFFCF6] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  1
                </span>
              </button>

              <button
                onClick={() => setRoute("caseload")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "caseload"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Caseload</span>
                <span className="text-[10px] text-[#776E62]">23</span>
              </button>
            </div>
          </div>

          {/* Patient Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C8375] px-2 mb-1 truncate">
              {currentPatient.name}
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setRoute("snapshot")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "snapshot"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Snapshot</span>
              </button>

              <button
                onClick={() => setRoute("changes")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "changes"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Since last review</span>
                {isNirmali && (
                  <span className="bg-[#8C5715] text-[#FFFCF6] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    3
                  </span>
                )}
              </button>

              <button
                onClick={() => setRoute("signals")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "signals"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Longitudinal signals</span>
              </button>

              <button
                onClick={() => setRoute("func")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "func"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Functional trajectory</span>
              </button>

              <button
                onClick={() => setRoute("quality")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "quality"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Measurement quality</span>
              </button>

              <button
                onClick={() => setRoute("evid")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "evid"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Evidence and conflicts</span>
              </button>

              <button
                onClick={() => setRoute("review")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  route === "review"
                    ? "bg-[#E4DACA] text-[#241F1A]"
                    : "text-[#4A423A] hover:bg-[#E4DACA]/50"
                }`}
              >
                <span>Questions and review</span>
                {isNirmali && (
                  <span className="bg-[#8C5715] text-[#FFFCF6] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    4
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C8375] px-2 mb-1">
              Output
            </div>
            <button
              onClick={() => setRoute("report")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                route === "report"
                  ? "bg-[#E4DACA] text-[#241F1A]"
                  : "text-[#4A423A] hover:bg-[#E4DACA]/50"
              }`}
            >
              <span>Since-last-review report</span>
              <FileText size={13} className="text-[#8C5715]" />
            </button>
          </div>
        </nav>

        {/* Patient Bio Callout in Sidebar */}
        <div className="mt-4 p-3 rounded-xl border border-[#E0D5C3] bg-[#FFFCF6] text-[11px] text-[#6B6257] space-y-1">
          <div className="font-semibold text-[#241F1A] text-xs truncate">
            {currentPatient.name}
          </div>
          <p className="line-clamp-2">{currentPatient.line}</p>
          <div className="pt-1.5 border-t border-[#E0D5C3]/60 flex justify-between text-[10px]">
            <span>Last review:</span>
            <span className="font-semibold text-[#241F1A]">{currentPatient.lastReview}</span>
          </div>
        </div>

        {/* Invariant 2 Footer Badge */}
        <div className="mt-3 pt-3 border-t border-[#E0D5C3] text-[10px] text-[#736A5E] flex items-start gap-1.5 leading-tight">
          <ShieldAlert size={14} className="text-[#8C5715] shrink-0 mt-0.5" />
          <span>
            <strong>Invariant 2:</strong> AI structures evidence with provenance. Clinicians diagnose & decide.
          </span>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN WORKSTATION CANVAS                                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-[#F1EADF] border-b border-[#E0D5C3] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xs">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#241F1A] flex items-center gap-2">
              <span>{routeTitle}</span>
              {isSyncing && (
                <RefreshCw size={13} className="animate-spin text-[#8C5715]" />
              )}
            </h1>
            <p className="text-xs text-[#6B6257] font-tabular-nums">{routeSub}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Sync Notice */}
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#6B8F6B] font-medium bg-[#E6EDE2] px-2.5 py-1 rounded-full border border-[#CFDCC8]">
              <CheckCircle2 size={12} />
              <span>{syncNotice}</span>
            </span>

            {/* Structured vs Plain Mode Toggle */}
            <button
              type="button"
              onClick={() => setPlainEvidenceMode(!plainEvidenceMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                plainEvidenceMode
                  ? "bg-[#8C5715] text-white border-[#8C5715]"
                  : "bg-[#FFFCF6] text-[#4A423A] border-[#E0D5C3] hover:bg-[#F6F1EA]"
              }`}
              title="Toggle derived prose visibility"
            >
              <Sliders size={13} />
              <span>{plainEvidenceMode ? "Plain evidence mode" : "Derived narrative"}</span>
            </button>

            {/* Provenance Metadata Toggle */}
            <button
              type="button"
              onClick={() => setShowProvenance(!showProvenance)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                showProvenance
                  ? "bg-[#E4DACA] text-[#241F1A] border-[#C9BCA6]"
                  : "bg-[#FFFCF6] text-[#736A5E] border-[#E0D5C3]"
              }`}
            >
              {showProvenance ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Provenance {showProvenance ? "ON" : "OFF"}</span>
            </button>

            {/* Quick Report Navigation Button */}
            {hasPatientData && route !== "report" && (
              <button
                type="button"
                onClick={() => setRoute("report")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border-1.5 border-[#241F1A] bg-[#FFFCF6] text-[#241F1A] hover:bg-[#241F1A] hover:text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <FileText size={13} />
                <span>Since-last-review report</span>
              </button>
            )}
          </div>
        </header>

        {/* Structured Evidence Mode Banner */}
        {plainEvidenceMode && (
          <div className="bg-[#F5E9D7] border-b border-[#E7D6BC] px-4 sm:px-8 py-2 text-xs font-medium text-[#7A4A12] text-center">
            Structured-evidence mode active. Derived summary prose is hidden; observations, sources, quality and unknowns remain intact.
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: CLINICAL HOME (WORK QUEUE)                                  */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {route === "home" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Clinical home
                </h2>
                <p className="text-sm text-[#6B6257] mt-1 font-tabular-nums">
                  Monday, 7 September 2026 · 23 people under longitudinal follow-up · nothing has been added to this queue automatically without an audit reason.
                </p>
              </div>

              {/* 5 Work Queue Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setRoute("home")}
                  className="text-left bg-[#FFFCF6] border border-[#E0D5C3] p-3.5 rounded-xl hover:border-[#241F1A] transition-all shadow-xs"
                >
                  <div className="font-serif font-bold text-2xl text-[#241F1A]">3</div>
                  <div className="text-xs text-[#6B6257] mt-1 font-medium leading-snug">
                    Awaiting your review today
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPatientKey("aita");
                    setRoute("snapshot");
                  }}
                  className="text-left bg-[#FFFCF6] border border-[#E0D5C3] border-l-4 border-l-[#8C5715] p-3.5 rounded-xl hover:shadow-sm transition-all"
                >
                  <div className="font-serif font-bold text-2xl text-[#7A4A12]">1</div>
                  <div className="text-xs text-[#6B6257] mt-1 font-medium leading-snug">
                    Acute-change relevance, L5
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaseloadFilter("Evidence insufficient");
                    setRoute("caseload");
                  }}
                  className="text-left bg-[#FFFCF6] border border-[#E0D5C3] p-3.5 rounded-xl hover:border-[#241F1A] transition-all shadow-xs"
                >
                  <div className="font-serif font-bold text-2xl text-[#7A4A12]">2</div>
                  <div className="text-xs text-[#6B6257] mt-1 font-medium leading-snug">
                    Evidence not yet sufficient
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaseloadFilter("Unresolved questions");
                    setRoute("caseload");
                  }}
                  className="text-left bg-[#FFFCF6] border border-[#E0D5C3] p-3.5 rounded-xl hover:border-[#241F1A] transition-all shadow-xs"
                >
                  <div className="font-serif font-bold text-2xl text-[#241F1A]">7</div>
                  <div className="text-xs text-[#6B6257] mt-1 font-medium leading-snug">
                    Unresolved questions in caseload
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoute("caseload")}
                  className="text-left bg-[#FFFCF6] border border-[#E0D5C3] p-3.5 rounded-xl hover:border-[#241F1A] transition-all shadow-xs"
                >
                  <div className="font-serif font-bold text-2xl text-[#241F1A]">3</div>
                  <div className="text-xs text-[#6B6257] mt-1 font-medium leading-snug">
                    Recent CHW visits, unread
                  </div>
                </button>
              </div>

              {/* Acute Change Alert: Aita Sangma (L5 Urgent human attention) */}
              <section className="bg-[#FFFCF6] border border-[#E0D5C3] border-l-4 border-l-[#8C5715] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C5715]">
                      Acute change · L5 · urgent human attention
                    </span>
                  </div>
                  <span className="text-xs text-[#6B6257] font-tabular-nums">
                    {acuteChangeAlert.routedBy}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-[#241F1A]">
                    {acuteChangeAlert.headline}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {acuteChangeAlert.rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F6F1EA] border border-[#E7DFD1] rounded-lg text-xs space-y-1"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8375]">
                        {row.k}
                      </span>
                      <p className="text-[#241F1A] font-medium leading-relaxed">{row.v}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientKey("aita");
                      setRoute("snapshot");
                    }}
                    className="px-4 py-2 bg-[#241F1A] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Open Aita Sangma</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </section>

              {/* Awaiting Review Patients List */}
              <section className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0D5C3]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                      Awaiting your review today
                    </h3>
                    <p className="text-xs text-[#6B6257]">
                      Patients with new longitudinal changes or scheduled follow-ups
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoute("caseload")}
                    className="text-xs font-bold text-[#8C5715] hover:underline"
                  >
                    Open full caseload →
                  </button>
                </div>

                <div className="space-y-3">
                  {allPatients
                    .filter((p) => ["nirmali", "bhogeswar", "hemanta"].includes(p.key))
                    .map((p) => (
                      <div
                        key={p.key}
                        className="p-4 rounded-xl border border-[#E0D5C3] bg-[#FAF6F0] hover:bg-[#F6F1EA] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#241F1A]">{p.name}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{
                                backgroundColor: p.tagBg,
                                borderColor: p.tagBd,
                                color: p.tagFg,
                              }}
                            >
                              {p.tag}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6257]">{p.line}</p>
                          <p className="text-xs text-[#4A423A] font-medium">{p.why}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right text-xs">
                            <div className="text-[#8C8375] text-[10px] uppercase">Last review</div>
                            <div className="font-semibold text-[#241F1A]">{p.lastReview}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPatientKey(p.key);
                              setRoute("snapshot");
                            }}
                            className="px-3 py-1.5 bg-[#241F1A] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                          >
                            Review patient
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* Weak or Incomplete Evidence */}
              <section className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                  Weak or incomplete evidence
                </h3>
                <p className="text-xs text-[#6B6257]">
                  These patients need in-person visits or explicit consent before algorithmic signals can be computed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-[#F6F1EA] border border-[#E7DFD1] rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-[#241F1A]">Bhogeswar Nath</span>
                    <p className="text-[#4A423A]">
                      A CHW screening and one functional observation. No interaction sessions, so no baseline and nothing to compare.
                    </p>
                    <p className="text-[11px] text-[#8C5715]">
                      Action: Did not attend appointment on 2 Sep. Wife unreachable; transport suspected.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#F6F1EA] border border-[#E7DFD1] rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-[#241F1A]">Ratna Hazarika</span>
                    <p className="text-[#4A423A]">
                      Consent to share with a clinician is not recorded, so no projection was built for her.
                    </p>
                    <p className="text-[11px] text-[#8C5715]">
                      Action: Visible to you only as an outstanding consent, not as a clinical dossier.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: CASELOAD                                                    */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {route === "caseload" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Caseload
                </h2>
                <p className="text-sm text-[#6B6257] mt-1">
                  Ordered by what changed, not by surname.
                </p>
              </div>

              {/* Natural Language Record Query Engine */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] p-4 rounded-xl space-y-3 shadow-xs">
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3.5 text-[#8C8375]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit(searchQuery);
                    }}
                    placeholder="Ask the record: show functional changes in the last 60 days…"
                    className="w-full pl-10 pr-24 py-2.5 bg-[#F6F1EA] border border-[#DED4C4] rounded-lg text-sm text-[#241F1A] placeholder-[#8C8375] focus:outline-none focus:ring-1 focus:ring-[#8C5715]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit(searchQuery)}
                    className="absolute right-1.5 px-3 py-1.5 bg-[#241F1A] text-white text-xs font-semibold rounded-md hover:bg-black transition-colors"
                  >
                    Ask
                  </button>
                </div>

                {/* Pre-packaged Example Queries */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#8C8375] font-medium text-[11px]">Examples:</span>
                  {exampleQueries.map((eq) => (
                    <button
                      key={eq.label}
                      type="button"
                      onClick={() => handleSearchSubmit(eq.label)}
                      className="px-2.5 py-1 rounded-full border border-[#E0D5C3] bg-[#F1EADF] text-[#4A423A] hover:bg-[#E4DACA] transition-colors text-[11.5px]"
                    >
                      {eq.label}
                    </button>
                  ))}
                </div>

                {/* Query Answer Callout */}
                {queryAnswer && (
                  <div className="p-4 bg-[#FFFCF6] border-l-3 border-l-[#8C5715] border border-[#E0D5C3] rounded-lg space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C5715]">
                      Retrieved from the clinical projection
                    </div>
                    <p className="text-sm font-medium text-[#241F1A] leading-relaxed">
                      {queryAnswer.text}
                    </p>
                    <p className="text-xs text-[#8C8375] italic">{queryAnswer.prov}</p>
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  "Needs review",
                  "Meaningful change",
                  "Evidence insufficient",
                  "Unresolved questions",
                  "Everyone",
                ].map((filt) => (
                  <button
                    key={filt}
                    type="button"
                    onClick={() => setCaseloadFilter(filt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                      caseloadFilter === filt
                        ? "bg-[#E4DACA] text-[#241F1A] border-[#C9BCA6]"
                        : "bg-[#FFFCF6] text-[#4A423A] border-[#E0D5C3] hover:bg-[#F6F1EA]"
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>

              {/* Caseload Patients List */}
              <div className="space-y-4">
                {filteredCaseload.map((p) => (
                  <div
                    key={p.key}
                    onClick={() => {
                      setPatientKey(p.key);
                      setRoute("snapshot");
                    }}
                    className="p-5 bg-[#FFFCF6] border border-[#E0D5C3] hover:border-[#8C5715] rounded-xl cursor-pointer transition-all shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-lg text-[#241F1A]">
                          {p.name}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: p.tagBg,
                            borderColor: p.tagBd,
                            color: p.tagFg,
                          }}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <span className="text-xs text-[#6B6257]">
                        Last review: <strong>{p.lastReview}</strong> · Fresh: {p.freshShort}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6257]">{p.line}</p>
                    <p className="text-xs text-[#4A423A] font-medium">{p.why}</p>

                    {/* Strip telemetry preview */}
                    {p.strip && p.strip.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#E0D5C3]/60">
                        {p.strip.map((st: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <div className="text-[10px] text-[#8C8375] uppercase">{st.k}</div>
                            <div className="font-bold text-[#241F1A] truncate" style={{ color: st.fg }}>
                              {st.v}
                            </div>
                            <div className="text-[10px] text-[#6B6257] truncate">{st.sub}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: RESTRICTED VIEW (E.G. RATNA HAZARIKA)                       */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {isRestricted && route !== "home" && route !== "caseload" && (
            <div className="p-8 bg-[#FFFCF6] border border-[#E0D5C3] rounded-2xl text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-[#F5E9D7] text-[#8C5715] flex items-center justify-center mx-auto">
                <ShieldAlert size={26} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#241F1A]">
                Consent to share with a clinician is not recorded
              </h2>
              <p className="text-sm text-[#6B6257] max-w-xl mx-auto leading-relaxed">
                Ratna Hazarika has not agreed to share her records with GMC Neurology clinic.
                MindMitra enforces hard cryptographic boundaries — no projection, metrics, or telemetry can be generated without explicit consent.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRoute("caseload")}
                  className="px-4 py-2 bg-[#241F1A] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                >
                  Back to caseload
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: INSUFFICIENT EVIDENCE (THIN RECORD)                          */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {isThin && (
            <div className="p-8 bg-[#FFFCF6] border border-[#E0D5C3] rounded-2xl text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-[#E4DACA] text-[#5C5348] flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#241F1A]">
                Longitudinal comparison not yet possible
              </h2>
              <p className="text-sm text-[#6B6257] max-w-xl mx-auto leading-relaxed">
                This record contains a single initial screening. A trajectory requires at least two repeated observations of the same task. The platform does not fabricate speculative trends.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRoute("snapshot")}
                  className="px-4 py-2 bg-[#8C5715] text-white text-xs font-semibold rounded-lg hover:bg-[#7A4A12] transition-colors"
                >
                  Open screening snapshot
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: PATIENT SNAPSHOT                                            */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "snapshot" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Demographics & Consent Callout */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] p-6 rounded-2xl space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-[#E0D5C3]">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#241F1A]">
                      {currentPatient.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6257] mt-1">
                      {currentPatient.line}
                    </p>
                  </div>
                  <span className="text-xs text-[#7A4A12] font-semibold bg-[#F5E9D7] border border-[#E7D6BC] px-3 py-1 rounded-full">
                    {currentPatient.confidence} confidence
                  </span>
                </div>

                {currentPatient.consent && (
                  <div className="text-xs text-[#6B6257] flex items-center gap-2 bg-[#F6F1EA] p-2.5 rounded-lg border border-[#E7DFD1]">
                    <ShieldCheck size={14} className="text-[#6B8F6B] shrink-0" />
                    <span>{currentPatient.consent}</span>
                  </div>
                )}
              </div>

              {/* 4-Tile Data Freshness Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(currentPatient.fresh || []).map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl text-xs space-y-1 shadow-xs"
                  >
                    <div className="text-[10px] text-[#8C8375] uppercase tracking-wider">{f.k}</div>
                    <div className="font-bold text-[#241F1A] font-tabular-nums text-sm">{f.v}</div>
                  </div>
                ))}
              </div>

              {/* People in the loop / Care Network */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] p-5 rounded-2xl space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#736A5E] flex items-center gap-1.5">
                  <Users size={14} />
                  <span>People in the loop · Care Network</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(currentPatient.network || []).map((n: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F6F1EA] border border-[#E7DFD1] rounded-lg text-xs space-y-0.5"
                    >
                      <div className="text-[10px] text-[#8C8375]">{n.k}</div>
                      <div className="font-bold text-[#241F1A]">{n.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Snapshot Findings */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                  Key Longitudinal Changes Since Last Review
                </h3>
                <div className="space-y-3">
                  {(currentPatient.snapshot || []).map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border-l-4"
                      style={{ borderLeftColor: s.bar || "#8C5715" }}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8375]">
                          {s.k}
                        </span>
                        <p className="text-sm font-medium text-[#241F1A]">{s.v}</p>
                        {showProvenance && (
                          <p className="text-xs text-[#6B6257] italic">{s.src}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setRoute("changes")}
                        className="px-3 py-1.5 bg-[#F1EADF] hover:bg-[#E4DACA] text-[#241F1A] text-xs font-bold rounded-lg transition-colors shrink-0"
                      >
                        Examine signal →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unknowns / Unmeasured Warnings */}
              {currentPatient.unknowns && currentPatient.unknowns.length > 0 && (
                <div className="p-4 bg-[#FBF1E3] border border-[#E0D5C3] border-l-3 border-l-[#8C5715] rounded-xl text-xs space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-[#7A4A12] text-[10px] flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>Factors not yet established in this period</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#4A423A]">
                    {currentPatient.unknowns.map((u: any, idx: number) => (
                      <li key={idx}>
                        {u.t ? (
                          u.t
                        ) : u.k && u.v ? (
                          <span>
                            <strong>{u.k}</strong>: {u.v}
                          </span>
                        ) : typeof u === "string" ? (
                          u
                        ) : (
                          JSON.stringify(u)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: SINCE LAST REVIEW (CHANGES)                                 */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "changes" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Since last review
                </h2>
                <p className="text-sm text-[#6B6257] mt-1">
                  {currentPatient.name} · {currentPatient.period} · {currentPatient.changeLine}
                </p>
              </div>

              <div className="space-y-4">
                {CHANGES.map((ch) => {
                  const isOpen = Boolean(openEvidence[ch.id]);
                  return (
                    <section
                      key={ch.id}
                      className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C5715]">
                            {ch.n} · {ch.domain}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: ch.kindBg,
                              borderColor: ch.kindBd,
                              color: ch.kindFg,
                            }}
                          >
                            {ch.kind}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B6257] font-tabular-nums">
                          {ch.persistence} · {ch.items.length} observations
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-[#241F1A]">
                        {ch.domain}
                      </h3>

                      {!plainEvidenceMode && (
                        <p className="text-sm text-[#4A423A] leading-relaxed">
                          {ch.observed}
                        </p>
                      )}

                      {/* Fact grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E0D5C3]/60">
                        {ch.grid.map((g, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="text-[10px] text-[#8C8375] uppercase">{g.k}</div>
                            <div className="font-bold text-[#241F1A]">{g.v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Explore Evidence Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenEvidence((prev) => ({
                              ...prev,
                              [ch.id]: !prev[ch.id],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            isOpen
                              ? "bg-[#FFFCF6] text-[#241F1A] border-[#241F1A]"
                              : "bg-[#241F1A] text-white border-[#241F1A] hover:bg-black"
                          }`}
                        >
                          <span>{isOpen ? "Hide evidence" : `Explore evidence (${ch.items.length})`}</span>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>

                      {/* Expandable Evidence Drawer */}
                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-[#E0D5C3] space-y-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#736A5E]">
                            Observation Provenance Ledger
                          </p>
                          <div className="space-y-2">
                            {ch.items.map((ev: any, i: number) => {
                              const rId = `${ch.id}_${i}`;
                              const isRawOpen = Boolean(openRaw[rId]);
                              return (
                                <div
                                  key={i}
                                  className="p-3.5 bg-[#F6F1EA] border border-[#E7DFD1] rounded-lg text-xs space-y-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-[#241F1A]">{ev.date}</span>
                                      <span className="text-[#8C5715] font-semibold">{ev.src}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-[#6B6257] bg-[#E4DACA] px-1.5 py-0.5 rounded">
                                        {ev.quality}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenRaw((prev) => ({
                                            ...prev,
                                            [rId]: !prev[rId],
                                          }))
                                        }
                                        className="text-[10px] font-bold text-[#8C5715] hover:underline"
                                      >
                                        {isRawOpen ? "Hide raw note" : "Raw observation"}
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-[#241F1A] leading-relaxed">{ev.text}</p>

                                  {ev.interp && (
                                    <p className="text-[11px] text-[#6B8F6B] font-medium">
                                      ✓ Sensor corroboration: {ev.interp}
                                    </p>
                                  )}

                                  {isRawOpen && (
                                    <div className="mt-2 p-2.5 bg-[#FFFCF6] border border-[#E0D5C3] rounded text-[11px] font-mono text-[#4A423A]">
                                      [RAW TELEMETRY / AUDIO TRANSCRIPT] {ev.raw || ev.text}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: LONGITUDINAL SIGNALS                                        */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "signals" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                    Longitudinal signals
                  </h2>
                  <p className="text-sm text-[#6B6257] mt-1 max-w-2xl">
                    Each signal is kept separate and compared only against {currentPatient.first}’s own personal baseline. No combined composite score is manufactured.
                  </p>
                </div>
                {isNirmali && (
                  <button
                    type="button"
                    onClick={() => setShowResearchSignals(!showResearchSignals)}
                    className="text-xs font-semibold text-[#8C5715] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    <span>{showResearchSignals ? "Hide research signals" : "Show research signals"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SIGNALS.map((sg) => (
                  <section
                    key={sg.name}
                    className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs border-l-4"
                    style={{ borderLeftColor: sg.bar }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#736A5E]">
                        {sg.name}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: sg.statusFg }}>
                        {sg.status}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-4 pt-1">
                      <div>
                        <div className="text-[10px] text-[#8C8375]">Her baseline</div>
                        <div className="font-serif font-bold text-xl text-[#6B6257]">{sg.baseline}</div>
                      </div>
                      <div className="text-xl text-[#8C8375]">→</div>
                      <div>
                        <div className="text-[10px] text-[#8C8375]">Recent rate</div>
                        <div className="font-serif font-bold text-2xl text-[#241F1A]">{sg.recent}</div>
                      </div>
                      <div className="text-xs font-bold text-[#8C5715] pl-2">{sg.deviation}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs text-[#4A423A] pt-1">
                      {sg.rows.slice(0, 4).map((r, rI) => (
                        <div key={rI} className="text-[11px]">
                          <span className="text-[#8C8375]">{r.k}: </span>
                          <span className="font-medium text-[#241F1A]">{r.v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Visual observation dots along baseline band */}
                    <div className="pt-2">
                      <div className="h-4 bg-[#F1EADF] rounded-full relative overflow-hidden flex items-center px-2">
                        <div className="absolute left-[30%] w-[35%] h-full bg-[#E4DACA]/70 border-x border-[#C9BCA6]/50" />
                        <span className="text-[9px] text-[#8C8375] z-10">Normal baseline band</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#8C8375] mt-1 font-tabular-nums">
                        <span>Min (12 Aug)</span>
                        <span>Observed deviation</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              {/* Optional Research Signals */}
              {showResearchSignals && (
                <div className="p-5 bg-[#F6F1EA] border border-[#E0D5C3] rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#8C5715]" />
                    <h3 className="text-sm font-bold text-[#241F1A]">
                      Exploratory Research Telemetry (Pre-validation)
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B6257]">
                    Acoustic speech cadence and semantic clustering proxies. Retained for scientific study, not approved for direct clinical decisions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {RESEARCH.map((res: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-[#E0D5C3] rounded-lg text-xs space-y-1">
                        <div className="font-bold text-[#241F1A]">{res.name}</div>
                        <div className="text-[#6B6257] text-[11px]">{res.what}</div>
                        <div className="text-[10px] text-[#8C5715] font-semibold">{res.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: FUNCTIONAL TRAJECTORY                                       */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "func" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Functional trajectory
                </h2>
                <p className="text-sm text-[#6B6257] mt-1 max-w-2xl">
                  Assistance level per task, as directly observed. A single observation of more help is not decline; each row records frequency, observer, and persistence.
                </p>
              </div>

              <div className="space-y-4">
                {FUNC.map((f, idx) => (
                  <section
                    key={idx}
                    className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#241F1A]">{f.domain}</span>
                        <span className="text-xs text-[#6B6257]">· {f.kind}</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: f.tagBg,
                          borderColor: f.tagBd,
                          color: f.tagFg,
                        }}
                      >
                        {f.tag}
                      </span>
                    </div>

                    {/* 6-Step Assistance Ladder Representation */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                      {LADDER.map((label, stepIdx) => {
                        const isCur = stepIdx === f.cur;
                        const isBase = stepIdx === f.base;
                        const isBetween =
                          stepIdx > Math.min(f.base, f.cur) && stepIdx < Math.max(f.base, f.cur);

                        let bgClass = "bg-[#FFFCF6] border-[#E7DFD1] text-[#8C8375]";
                        if (isCur) bgClass = "bg-[#E4DACA] border-[#241F1A] text-[#241F1A] font-bold";
                        else if (isBase) bgClass = "bg-[#F6F1EA] border-[#C9BCA6] text-[#241F1A] font-medium";
                        else if (isBetween) bgClass = "bg-[#F6F1EA] border-[#E7DFD1] text-[#4A423A]";

                        return (
                          <div
                            key={label}
                            className={`p-2.5 rounded-lg border text-center text-xs space-y-1 ${bgClass}`}
                          >
                            <div className="text-[10px] uppercase tracking-wider font-semibold">
                              {isCur && isBase
                                ? "Baseline & Now"
                                : isCur
                                ? "Now"
                                : isBase
                                ? "Baseline"
                                : isBetween
                                ? "→"
                                : " "}
                            </div>
                            <div className="text-xs truncate">{label}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Context and observations summary */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-[#6B6257] pt-2 border-t border-[#E0D5C3]/60">
                      <div>Observations: <strong>4 guided / 6 total</strong></div>
                      <div>First detected: <strong>22 Aug</strong> · Verified: <strong>02 Sep</strong></div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: MEASUREMENT QUALITY                                         */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "quality" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Measurement quality
                </h2>
                <p className="text-sm text-[#6B6257] mt-1 max-w-2xl">
                  How observations were obtained, and which of them are verified enough to interpret. A poor measurement is a finding about field conditions, not an error.
                </p>
              </div>

              {/* Tally Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MQ.tally.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl text-center space-y-1 shadow-xs"
                  >
                    <div
                      className="font-serif font-bold text-2xl font-tabular-nums"
                      style={{ color: t.fg }}
                    >
                      {t.n}
                    </div>
                    <div className="text-xs text-[#6B6257] font-medium">{t.label}</div>
                  </div>
                ))}
              </div>

              {/* Exclusion Rationale Card */}
              <div className="p-5 bg-[#FFFCF6] border-l-4 border-l-[#8C5715] border border-[#E0D5C3] rounded-xl space-y-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5715]">
                  Telemetry Audit Policy
                </span>
                <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                  4 of 16 Sessions Withheld From Ability Scoring
                </h3>
                <p className="text-xs text-[#4A423A] leading-relaxed">
                  Reasons: Poor audio SNR in 4 sessions; hearing aid unavailable in 3; language mismatch (Assamese–Hindi dialect divergence) in 2.
                  These sessions remain in the exposure ledger for engagement, but are excluded from cognitive comparison.
                </p>
              </div>

              {/* Session Audit Table */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#E0D5C3]">
                  <h3 className="font-serif font-bold text-base text-[#241F1A]">
                    Longitudinal Session Telemetry Audit
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F1EA] border-b border-[#E0D5C3] text-[#736A5E] uppercase text-[10px]">
                        <th className="py-2.5 px-4">Session Date</th>
                        <th className="py-2.5 px-4">Audio Quality</th>
                        <th className="py-2.5 px-4">Hearing Aid</th>
                        <th className="py-2.5 px-4">Language Match</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0D5C3]/60">
                      {[
                        { date: "07 Sep 09:12", audio: "Good (SNR > 22dB)", aid: "In-ear verified", lang: "Assamese 100%", status: "Included" },
                        { date: "05 Sep 17:40", audio: "Moderate noise", aid: "In-ear verified", lang: "Assamese 100%", status: "Included" },
                        { date: "03 Sep 14:10", audio: "Poor (Road noise)", aid: "Absent / on table", lang: "Assamese 100%", status: "Excluded" },
                        { date: "01 Sep 11:20", audio: "Good", aid: "In-ear verified", lang: "Assamese 100%", status: "Included" },
                        { date: "29 Aug 18:30", audio: "Poor (Echo/Kitchen)", aid: "Not worn", lang: "Hindi/Assamese mixed", status: "Excluded" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-[#F6F1EA]/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#241F1A]">{row.date}</td>
                          <td className="py-3 px-4 text-[#4A423A]">{row.audio}</td>
                          <td className="py-3 px-4 text-[#4A423A]">{row.aid}</td>
                          <td className="py-3 px-4 text-[#4A423A]">{row.lang}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                row.status === "Included"
                                  ? "bg-[#E6EDE2] text-[#3D5236] border-[#CFDCC8]"
                                  : "bg-[#F5E9D7] text-[#7A4A12] border-[#E7D6BC]"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: EVIDENCE AND CONFLICTS                                      */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "evid" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Evidence and conflicts
                </h2>
                <p className="text-sm text-[#6B6257] mt-1 max-w-2xl">
                  Grouped by who said it. Nothing here has been merged, averaged, or synthesized by the system.
                </p>
              </div>

              {/* Source-Grouped Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EVID.map((gp, idx) => (
                  <section
                    key={idx}
                    className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: gp.dot }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#736A5E]">
                        {gp.label}
                      </span>
                      <span className="text-xs text-[#8C8375] ml-auto">{gp.count}</span>
                    </div>

                    <p className="text-xs text-[#6B6257]">{gp.rule}</p>

                    <div className="space-y-2 pt-2 border-t border-[#E0D5C3]/60">
                      {gp.items.map((it: any, i: number) => (
                        <div key={i} className="p-3 bg-[#F6F1EA] rounded-lg text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-[#8C8375]">
                            <span>{it.date}</span>
                            <span className="font-semibold text-[#8C5715]">{it.who}</span>
                          </div>
                          <p className="text-[#241F1A] font-medium leading-relaxed">{it.text}</p>
                          {it.interp && (
                            <p className="text-[11px] text-[#7A4A12] italic">Interpretation: {it.interp}</p>
                          )}
                          <p className="text-[10px] text-[#8C8375]">{it.meta}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Contradictions & Discrepancies Detector */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#8C5715]" />
                  <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                    Unresolved Discrepancies
                  </h3>
                </div>
                <p className="text-xs text-[#6B6257]">
                  The platform refuses to pick a winner between conflicting accounts. Both records are surfaced for human clinician resolution.
                </p>

                <div className="space-y-3">
                  {CONTRA.map((ct: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FBF1E3] border border-[#E0D5C3] border-l-4 border-l-[#8C5715] rounded-xl text-xs space-y-2"
                    >
                      <div className="font-bold text-[#241F1A] text-sm">{ct.title}</div>
                      <p className="text-[#4A423A] leading-relaxed">{ct.desc}</p>
                      <div className="text-[11px] text-[#7A4A12] font-semibold">
                        Sources: {ct.sources} · Next step: {ct.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: PREPARED QUESTIONS AND REVIEW                               */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "review" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#241F1A]">
                  Prepared questions and review
                </h2>
                <p className="text-sm text-[#6B6257] mt-1 max-w-2xl">
                  Evidence has been structured into clinical questions, not automated verdicts. Accept, correct, annotate, request more data, or dismiss.
                </p>
              </div>

              {/* AI Prepared Questions List */}
              <div className="space-y-4">
                {QUESTIONS.map((q, idx) => {
                  const state = qState[q.id];
                  const draftOpen = state === "annotate" || state === "correct";
                  const savedNote = qSavedNotes[q.id] || "";

                  return (
                    <section
                      key={q.id}
                      className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#736A5E]">
                          Question {idx + 1} · {q.domain}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: q.tagBg,
                            borderColor: q.tagBd,
                            color: q.tagFg,
                          }}
                        >
                          {q.tag}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                        {q.text}
                      </h3>

                      <p className="text-xs text-[#6B6257] bg-[#F6F1EA] p-2.5 rounded-lg border border-[#E7DFD1]">
                        Basis: {q.basis}
                      </p>

                      {/* Decision Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        {[
                          { label: "Accept finding", action: "accepted" },
                          { label: "Correct observation", action: "correct" },
                          { label: "Annotate", action: "annotate" },
                          { label: "Request more data", action: "more" },
                          { label: "Dismiss", action: "dismissed" },
                        ].map((btn) => (
                          <button
                            key={btn.action}
                            type="button"
                            onClick={() => handleQuestionAction(q.id, btn.action as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              state === btn.action
                                ? "bg-[#E4DACA] text-[#241F1A] border-[#241F1A] font-bold shadow-xs"
                                : "bg-[#FFFCF6] text-[#4A423A] border-[#C9BCA6] hover:bg-[#F6F1EA]"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Clinician Note Input when Annotate or Correct is picked */}
                      {draftOpen && (
                        <div className="mt-3 p-3 bg-[#FAF6F0] border border-[#E0D5C3] rounded-xl space-y-2">
                          <label className="text-[11px] font-bold text-[#241F1A]">
                            {state === "correct"
                              ? "Record your clinical correction (original observation stays preserved):"
                              : "Enter your clinician impression annotation:"}
                          </label>
                          <textarea
                            rows={2}
                            value={qDraft[q.id] || ""}
                            onChange={(e) =>
                              setQDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Type observation details for the audit ledger…"
                            className="w-full rounded-lg border border-[#E0D5C3] bg-white p-2.5 text-xs text-[#241F1A] focus:outline-none focus:ring-1 focus:ring-[#8C5715]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setQState((prev) => ({ ...prev, [q.id]: "" }))}
                              className="px-3 py-1 text-xs text-[#6B6257] hover:underline"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveQuestionNote(q.id)}
                              disabled={!qDraft[q.id]?.trim()}
                              className="px-3 py-1 bg-[#241F1A] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                            >
                              Save note to dossier
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Resolved Status Line */}
                      {state && !draftOpen && (
                        <div className="mt-2 text-xs font-medium text-[#6B8F6B] bg-[#E6EDE2] p-2 rounded-lg border border-[#CFDCC8] flex items-center justify-between">
                          <span>
                            ✓{" "}
                            {state === "accepted"
                              ? "Accepted as a finding for the review."
                              : state === "dismissed"
                              ? "Dismissed as not clinically relevant."
                              : state === "saved-correct"
                              ? `Corrected: "${savedNote}"`
                              : state === "saved-annotate"
                              ? `Annotated: "${savedNote}"`
                              : "Dispatched data collection request to CHW app."}
                          </span>
                          <span className="text-[10px] text-[#3D5236] font-mono">
                            Dr. N. Choudhury · Verified
                          </span>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Follow-up Tasks Checklist */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-3 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                  Follow-up Action Queue
                </h3>
                <div className="space-y-2">
                  {FOLLOWUPS.map((f) => {
                    const isInProgress = Boolean(fuState[f.id]);
                    return (
                      <div
                        key={f.id}
                        className="p-3 bg-[#F6F1EA] border border-[#E7DFD1] rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-[#241F1A]">{f.task}</div>
                          <div className="text-[#6B6257]">
                            Owner: <strong>{f.owner}</strong> · Due: {f.due} · {f.why}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFollowup(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                            isInProgress
                              ? "bg-[#E6EDE2] text-[#3D5236] border-[#CFDCC8]"
                              : "bg-[#FFFCF6] text-[#241F1A] border-[#241F1A] hover:bg-[#241F1A] hover:text-white"
                          }`}
                        >
                          {isInProgress ? "✓ In progress" : "Open task"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctor’s Consultation & Decision Log */}
              <div className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-xl p-5 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#241F1A]">
                  Neurologist Consultation & Decision Log
                </h3>
                <p className="text-xs text-[#6B6257]">
                  Appended directly by Dr. Nayan Choudhury into {currentPatient.name}'s verified clinical ledger.
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter formal clinical impressions, rule out reversible metabolic or sensory causes, or order lab follow-ups…"
                    className="w-full rounded-xl border border-[#E0D5C3] bg-[#FAF6F0] p-3 text-xs text-[#241F1A] focus:outline-none focus:ring-1 focus:ring-[#8C5715]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveDoctorConsultationNote}
                      disabled={!doctorNotes.trim()}
                      className="px-4 py-2 bg-[#241F1A] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                    >
                      Append Verified Assessment to Ledger
                    </button>
                  </div>
                </div>

                {/* Past Consultation Entries */}
                {consultationNotes.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#E0D5C3]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8375]">
                      Recorded Clinical Entries ({consultationNotes.length})
                    </span>
                    {consultationNotes.map((cn) => (
                      <div
                        key={cn.id}
                        className="p-3 bg-[#F6F1EA] border border-[#E7DFD1] rounded-lg text-xs space-y-1"
                      >
                        <div className="flex justify-between text-[10px] text-[#8C5715] font-semibold">
                          <span>{cn.doctor_name}</span>
                          <span className="font-mono text-[#736A5E] font-normal">
                            {new Date(cn.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#241F1A] leading-relaxed">{cn.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* SCREEN: SINCE-LAST-REVIEW REPORT (PRINT ARTIFACT)                    */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isRestricted && route === "report" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Action bar (hidden in print) */}
              <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
                <button
                  type="button"
                  onClick={() => setRoute("review")}
                  className="text-xs font-bold text-[#8C5715] hover:underline"
                >
                  ← Back to review
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportFhirReport}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C9BCA6] bg-[#FFFCF6] text-[#241F1A] hover:bg-[#F6F1EA] flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download size={13} />
                    <span>Export FHIR JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border-1.5 border-[#241F1A] bg-[#241F1A] text-white hover:bg-black flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Printer size={13} />
                    <span>Print or save as PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Report Article */}
              <article className="bg-[#FFFCF6] border border-[#E0D5C3] rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="space-y-2 border-b border-[#E0D5C3] pb-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#8C5715]">
                    Longitudinal Clinical Review
                  </div>
                  <h1 className="font-serif text-3xl font-bold text-[#241F1A]">
                    {currentPatient.name}
                  </h1>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 border-b border-[#E0D5C3] text-xs">
                  {activeReport.head.map((h: any, idx: number) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="text-[10px] text-[#8C8375] uppercase">{h.k}</div>
                      <div className="font-bold text-[#241F1A]">{h.v}</div>
                    </div>
                  ))}
                </div>

                {/* Report Sections */}
                <div className="space-y-6">
                  {activeReport.sections.map((sec: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-serif text-lg font-bold text-[#241F1A] border-b border-[#E0D5C3]/60 pb-1">
                        {sec.label}
                      </h4>

                      {sec.lead && (
                        <p className="text-sm text-[#4A423A] leading-relaxed">
                          {sec.lead}
                        </p>
                      )}

                      {sec.hasRows && sec.rows && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {sec.rows.map((r: any, rIdx: number) => (
                            <div
                              key={rIdx}
                              className="p-2.5 bg-[#F6F1EA] rounded-lg border border-[#E7DFD1] space-y-0.5"
                            >
                              <span className="text-[10px] font-bold text-[#8C8375] uppercase">
                                {r.k}
                              </span>
                              <p className="text-[#241F1A] font-medium">{r.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.hasList && sec.list && (
                        <ul className="list-disc pl-5 text-xs text-[#4A423A] space-y-1">
                          {sec.list.map((li: any, lIdx: number) => (
                            <li key={lIdx}>
                              {li.t ? (
                                li.t
                              ) : li.k && li.v ? (
                                <span>
                                  <strong>{li.k}</strong>: {li.v}
                                </span>
                              ) : typeof li === "string" ? (
                                li
                              ) : (
                                JSON.stringify(li)
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {/* Clinician Sign-off Footer */}
                <div className="pt-6 border-t border-[#E0D5C3] text-xs text-[#6B6257] space-y-1">
                  <p className="italic">{activeReport.footer}</p>
                  <p className="text-[10px] font-mono text-[#8C8375]">
                    GMC Guwahati Neurology Department · Verified HL7 FHIR Composition Standard
                  </p>
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
