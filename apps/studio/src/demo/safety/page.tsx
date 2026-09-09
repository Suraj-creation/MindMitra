"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, type SafetyCheckResult } from "@/lib/api";

const PRESETS = [
  { label: "she has dementia",        value: "she has dementia",            expected: "BLOCKED" },
  { label: "dementia is progressing", value: "dementia is progressing",     expected: "BLOCKED" },
  { label: "take 10mg donepezil",     value: "take 10mg donepezil",         expected: "BLOCKED" },
  { label: "this activity heals dementia", value: "this activity heals dementia", expected: "BLOCKED" },
  { label: "she is in stage 3 of dementia", value: "she is in stage 3 of dementia", expected: "BLOCKED" },
  { label: "I want to die",           value: "I want to die",               expected: "CRISIS" },
  { label: "Safe (3-layer output)",   value: "Her session performance was lower than her own 14-day average. This is not a diagnosis. Consider checking sleep quality with the care team.", expected: "PASSES" },
];

const CHECK_LABELS: Record<string, string> = {
  role_fit:      "1. Role fit",
  diagnosis:     "2. Diagnosis filter",
  medication:    "3. Medication filter",
  provenance:    "4. Provenance",
  uncertainty:   "5. Uncertainty / forbidden claims",
  three_layer:   "6. Three-layer contract",
  dignity:       "7. Dignity",
  crisis:        "8. Crisis → Tele-MANAS",
  emergency:     "9. Emergency override",
  audit:         "10. Audit obligation",
};

export default function SafetyDemoPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SafetyCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(input?: string) {
    const val = input ?? text;
    if (!val.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.checkSafety(val.trim());
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="danger">CLAUDE.md §1.2 & 1.3 — Invariants 2 & 3</Badge>
        <h1 className="mt-2 text-3xl font-bold">Safety Gateway</h1>
        <p className="mt-1 text-[--color-text-sub] max-w-xl">
          Every user-facing output passes 10 deterministic checks. The system is{" "}
          <em>demonstrably incapable</em> of emitting a diagnosis, staging, or
          progression claim. Try the presets or type your own text.
        </p>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wide mb-2">
          Try a preset
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, value, expected }) => (
            <button
              key={label}
              onClick={() => {
                setText(value);
                handleCheck(value);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                expected === "BLOCKED"
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : expected === "CRISIS"
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <Card>
        <CardTitle>Check any text</CardTitle>
        <CardDescription>
          The gateway runs all 10 checks in order and stops at the first block.
        </CardDescription>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type any text to run through the Safety Gateway…"
          rows={3}
          className="w-full rounded-lg border border-[--color-border] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[--color-primary]/40"
        />
        <button
          onClick={() => handleCheck()}
          disabled={loading || !text.trim()}
          className="mt-3 rounded-lg bg-[--color-primary] text-white font-medium py-2.5 px-6 hover:bg-[--color-primary-hover] transition-colors disabled:opacity-40"
        >
          {loading ? "Checking…" : "Run Safety Gateway"}
        </button>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">
            ⚠️ API unreachable — run{" "}
            <code className="font-mono">uvicorn app.main:app --reload</code>{" "}
            in <code className="font-mono">services/api</code>.
          </p>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card
          className={cn(
            "border-2",
            result.passed
              ? "border-green-400 bg-green-50"
              : "border-red-400 bg-red-50",
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl" aria-hidden>
              {result.passed ? "✅" : "🛡️"}
            </span>
            <div>
              <p
                className={cn(
                  "text-xl font-bold",
                  result.passed ? "text-green-700" : "text-red-700",
                )}
              >
                {result.passed ? "PASSES — safe to emit" : `BLOCKED — ${result.blocked_by?.toUpperCase()}`}
              </p>
              <p className="text-sm mt-1 text-[--color-text-sub]">
                {result.explanation}
              </p>
            </div>
          </div>

          {result.crisis_number && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">
                🆘 Crisis routing: Tele-MANAS {result.crisis_number}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                The output is surfaced with the helpline number immediately.
              </p>
            </div>
          )}

          {/* 10-check waterfall */}
          <div>
            <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wide mb-2">
              10-check waterfall
            </p>
            <div className="space-y-1.5">
              {result.check_results.map((cr) => (
                <div
                  key={cr.check}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    cr.passed
                      ? "bg-green-50 text-green-800"
                      : "bg-red-100 text-red-800 font-medium",
                  )}
                >
                  <span aria-hidden>{cr.passed ? "✓" : "✗"}</span>
                  <span className="flex-1">
                    {CHECK_LABELS[cr.check] ?? cr.check}
                  </span>
                  {cr.reason && (
                    <span className="text-xs font-mono opacity-70">
                      {cr.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
