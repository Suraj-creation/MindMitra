import type React from "react";
import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, PhoneCall, Wifi, WifiOff, FileText, Send, User } from "lucide-react";

type Language = "as" | "bn" | "brx" | "hi" | "en";

const LANG_CONFIG: Record<Language, { label: string; script: string; greeting: string }> = {
  as: { label: "Assamese", script: "অসমীয়া", greeting: "নমস্কাৰ পূৰ্ণিমা বাইদেউ" },
  bn: { label: "Bengali", script: "বাংলা", greeting: "নমস্কার পূর্ণিমা দিদি" },
  brx: { label: "Bodo", script: "बड़ो", greeting: "खुलुमबाय पूर्णिमा" },
  hi: { label: "Hindi", script: "हिंदी", greeting: "नमस्ते पूर्णिमा जी" },
  en: { label: "English", script: "English", greeting: "Namaskar Purnima Baideu" },
};

const SCREENING_ITEMS = [
  { id: "orientation", label: "Orientation to season & festival (e.g., Rongali/Kati Bihu cycle)", domain: "orientation" },
  { id: "recognition", label: "Immediate recognition of primary caregiver (Anu) & familiar family photos", domain: "memory" },
  { id: "hydration", label: "Daily hydration & morning warm chai routine completed", domain: "routine" },
  { id: "sleep", label: "Caregiver reports no nocturnal confusion or 2:00 AM wandering", domain: "sleep" },
  { id: "language_match", label: "Speaks comfortably in preferred mother tongue without fatigue", domain: "speech" },
  { id: "medication", label: "Routine blood pressure / prescribed medication taken on time", domain: "medication" },
  { id: "independence", label: "Completed tablet memory activity without family prompted answers", domain: "quality" },
  { id: "mood", label: "Displays calm, reassuring affect (no unprovoked acute anxiety)", domain: "affect" },
  { id: "caregiver_stress", label: "Caregiver Anu reports manageable daily fatigue (Zarit score check)", domain: "caregiver" },
  { id: "mobility", label: "Courtyard walking without acute gait instability or fall risk", domain: "safety" },
];

export function AshaView() {
  const [lang, setLang] = useState<Language>("as");
  const [checks, setChecks] = useState<Record<string, boolean>>({
    orientation: true,
    recognition: true,
    hydration: true,
    sleep: false, // Flagged
    language_match: true,
    medication: true,
    independence: true,
    mood: true,
    caregiver_stress: true,
    mobility: true,
  });
  const [offline, setOffline] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldNotes, setFieldNotes] = useState(
    "Visited Tezpur residence at 11:30 AM. Anu mentioned restless sleep between 2:00 AM and 4:00 AM for past 2 nights. Purnima smiled warmly at granddaughter Rina's photo. Advised warm hydration before evening routine."
  );

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
    setSubmitted(false);
  };

  const flaggedCount = Object.values(checks).filter((v) => !v).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[--color-border] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="teal">ASHA / Community Health Worker Copilot</Badge>
            <span className="text-xs text-[--color-muted]">Sonitpur District, Assam</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 text-[--color-text]">
            Field Visit Screening: Purnima Baideu
          </h1>
          <p className="text-sm text-[--color-text-sub] mt-0.5">
            CHW Meena Borah · Primary Contact: Anu (Daughter) · Community Health Centre Tezpur
          </p>
        </div>

        {/* Offline sync status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOffline(!offline)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer bg-white"
          >
            {offline ? (
              <>
                <WifiOff size={14} className="text-amber-600" />
                <span className="text-amber-800">Field Offline Mode (Buffered)</span>
              </>
            ) : (
              <>
                <Wifi size={14} className="text-emerald-600" />
                <span className="text-emerald-800">Connected (Tezpur CHC)</span>
              </>
            )}
          </button>
          <a
            href="tel:14416"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[--color-secondary] text-white text-xs font-semibold hover:opacity-90"
          >
            <PhoneCall size={14} />
            <span>Tele-MANAS (14416)</span>
          </a>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-[--color-text-sub] shrink-0">Field Language:</span>
        {(Object.keys(LANG_CONFIG) as Language[]).map((key) => {
          const cfg = LANG_CONFIG[key];
          const isSelected = lang === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLang(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-[--color-primary] text-white shadow-xs"
                  : "bg-white border border-[--color-border] text-[--color-text] hover:bg-[--color-surface]"
              }`}
            >
              {cfg.label} ({cfg.script})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visit Brief & Protocol */}
        <div className="space-y-6">
          <Card className="bg-[#fcf8f2] border-[--color-border]">
            <CardTitle className="text-base flex items-center gap-2">
              <User size={18} className="text-[--color-primary]" />
              Visit Brief & Context
            </CardTitle>
            <CardDescription>
              Summary generated from caregiver telemetry prior to arrival
            </CardDescription>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs uppercase tracking-wide">
                  <AlertCircle size={14} /> Attention Item
                </div>
                <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                  Caregiver Anu logged 2 night awakenings on Thursday. Cognitive latency increased by 38% on morning sessions. Check hydration & room temperature.
                </p>
              </div>

              <div className="text-xs space-y-1.5 text-[--color-text-sub]">
                <div className="flex justify-between border-b border-[--color-border]/60 pb-1">
                  <span>Preferred Greeting:</span>
                  <span className="font-semibold text-[--color-text]">{LANG_CONFIG[lang].greeting}</span>
                </div>
                <div className="flex justify-between border-b border-[--color-border]/60 pb-1">
                  <span>Home Village:</span>
                  <span className="font-medium text-[--color-text]">Bhomoraguri, Tezpur</span>
                </div>
                <div className="flex justify-between border-b border-[--color-border]/60 pb-1">
                  <span>Primary Anchor:</span>
                  <span className="font-medium text-[--color-text]">Granddaughter Rina (Photo #1)</span>
                </div>
                <div className="flex justify-between">
                  <span>Last PHC Review:</span>
                  <span className="font-medium text-[--color-text]">18 days ago</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Safety Notice */}
          <Card className="border-emerald-200 bg-emerald-50/60">
            <h3 className="font-semibold text-xs text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-700" />
              Safety Gateway Invariant
            </h3>
            <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
              As an ASHA worker, record observable behaviors only. Never state or record that a person &ldquo;has worsening dementia&rdquo; or change medication. Escalate acute changes to CHC Medical Officer.
            </p>
          </Card>
        </div>

        {/* Right 2 Columns: 10-Point Checklist & Field Notes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">10-Point Field Assessment</CardTitle>
                <CardDescription>
                  Tap any item to toggle healthy state vs flagged issue
                </CardDescription>
              </div>
              <Badge variant={flaggedCount === 0 ? "success" : flaggedCount <= 2 ? "warning" : "danger"}>
                {flaggedCount === 0 ? "All Stable" : `${flaggedCount} Item(s) Flagged`}
              </Badge>
            </div>

            <div className="mt-4 divide-y divide-[--color-border]">
              {SCREENING_ITEMS.map((item, idx) => {
                const isPassed = checks[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className="w-full py-3 flex items-start justify-between gap-3 text-left hover:bg-[--color-surface]/50 transition-colors px-2 rounded-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono text-[--color-muted] mt-0.5 w-5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${isPassed ? "text-[--color-text]" : "text-amber-900 font-semibold"}`}>
                          {item.label}
                        </p>
                        <span className="text-xs text-[--color-muted] capitalize">Domain: {item.domain}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {isPassed ? "Normal" : "Flagged"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Field Notes & Save */}
            <form onSubmit={handleSubmit} className="mt-6 pt-4 border-t border-[--color-border] space-y-3">
              <label htmlFor="field-notes" className="text-xs font-bold text-[--color-text-sub] uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={15} /> Field Observations & Caregiver Dialogue
              </label>
              <textarea
                id="field-notes"
                rows={3}
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full text-sm p-3 rounded-lg border border-[--color-border] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                placeholder="Add observational notes..."
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-[--color-muted]">
                  Stored with cryptographic provenance & timestamp
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[--color-primary] text-white text-xs font-bold hover:bg-[--color-primary-hover] cursor-pointer"
                >
                  <Send size={14} />
                  <span>{submitted ? "Observation Recorded ✓" : "Save Field Assessment"}</span>
                </button>
              </div>
            </form>

            {submitted && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Field observation logged and queued for CHC sync. Caregiver Anu notified of recommendations.</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
