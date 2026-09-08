"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, type InjectDeclineResponse } from "@/lib/api";

const LEVEL_COLOR: Record<string, string> = {
  L1: "var(--color-L1)", L2: "var(--color-L2)", L3: "var(--color-L3)",
  L4: "var(--color-L4)", L5: "var(--color-L5)",
};

export default function CaregiverDemoPage() {
  const [days, setDays] = useState(3);
  const [result, setResult] = useState<InjectDeclineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await api.injectDecline(days);
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const card = result?.card;
  const alert = result?.alert;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="warning">Three-layer output contract · real pipeline</Badge>
        <h1 className="mt-2 text-3xl font-bold">Caregiver Alert Card</h1>
        <p className="mt-1 text-[--color-text-sub] max-w-2xl">
          This is <strong>not</strong> a mock-up. Injecting decline persists real
          observations, computes the personal baseline (z/MAD), runs the
          deterministic alert-eligibility function, and generates a card that must
          pass the Safety Gateway before it is shown.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardTitle>Inject below-baseline sessions</CardTitle>
        <CardDescription>
          Seeds a 24-day baseline (~0.80) then N recent days declining to ~0.64.
        </CardDescription>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="days" className="text-sm font-medium">
                Consecutive days below baseline
              </label>
              <span className="font-mono text-[--color-primary] font-bold">{days}</span>
            </div>
            <input
              id="days" type="range" min={1} max={10} value={days}
              onChange={(e) => { setDays(Number(e.target.value)); setResult(null); }}
              className="w-full accent-[--color-primary]"
            />
            <div className="flex justify-between text-xs text-[--color-muted] mt-0.5">
              <span>1 day — likely below threshold</span>
              <span>3+ days — caregiver action (L3)</span>
            </div>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="rounded-lg bg-[--color-primary] text-white font-medium py-2.5 px-6 hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50"
          >
            {loading ? "Running pipeline…" : "Inject & generate card →"}
          </button>
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">
            ⚠️ API unreachable — run{" "}
            <code className="font-mono">uvicorn app.main:app --reload</code> in{" "}
            <code className="font-mono">services/api</code>.
          </p>
          <p className="text-xs text-red-500 mt-1 font-mono break-all">{error}</p>
        </Card>
      )}

      {result && card && (
        <div className="space-y-4">
          {/* Pipeline summary */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="muted">{result.baseline_points} baseline points</Badge>
            <span className="text-[--color-muted]">→</span>
            {alert ? (
              <>
                <Badge variant="muted">z = {alert.z.toFixed(2)}</Badge>
                <Badge variant="muted">persistence {alert.persistence_days}d</Badge>
                <span className="text-[--color-muted]">→</span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-xs font-bold"
                  style={{ background: LEVEL_COLOR[alert.level] ?? "var(--color-L2)" }}
                >
                  {alert.level} alert
                </span>
              </>
            ) : (
              <Badge variant="success">within her own pattern — no alert</Badge>
            )}
            <span className="text-[--color-muted]">→</span>
            <Badge variant={card.safety_passed ? "success" : "danger"}>
              Safety Gateway {card.safety_passed ? "passed" : "blocked"}
            </Badge>
            <Badge variant="muted">measurement: {card.measurement_confidence}</Badge>
          </div>

          {card.level ? (
            <>
              {/* Level header */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white"
                  style={{ background: LEVEL_COLOR[card.level] ?? "var(--color-L3)" }}
                >
                  <span aria-hidden>⚡</span> {card.level} — Caregiver action
                </span>
                <span className="text-xs text-[--color-muted]">
                  {new Date(card.generated_at).toLocaleString()}
                </span>
              </div>

              {/* FACT */}
              <Card className="border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded">FACT</span>
                  <span className="text-xs text-[--color-muted]">Sourced · Confidence-rated</span>
                </div>
                <div className="space-y-3">
                  {card.facts.map((f, i) => (
                    <div key={i} className="border-l-2 border-blue-300 pl-3">
                      <p className="text-sm">{f.content}</p>
                      <p className="text-xs text-[--color-muted] mt-0.5">
                        Source: {f.source} · Confidence: {(f.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* HYPOTHESIS */}
              {card.hypothesis && (
                <Card className="border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded">HYPOTHESIS</span>
                    <span className="text-xs font-semibold text-amber-700">{card.hypothesis.label}</span>
                  </div>
                  <p className="text-sm text-amber-900">{card.hypothesis.content}</p>
                </Card>
              )}

              {/* ACTION */}
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded">ACTION</span>
                  <span className="text-xs text-green-700">Concrete · Safe · Guideline-aligned</span>
                </div>
                <ol className="space-y-2">
                  {card.actions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm text-green-900">
                      <span className="shrink-0 font-bold">{i + 1}.</span>{a}
                    </li>
                  ))}
                </ol>
              </Card>

              {/* What this is NOT */}
              <div className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm text-[--color-muted]">
                🔒 <strong>What this is not:</strong> {card.what_this_is_not}
              </div>

              {/* Feedback */}
              {feedback ? (
                <p className="text-sm text-[--color-muted] text-center">
                  Feedback recorded: <strong>{feedback}</strong>. This adjusts the
                  alert threshold for future weeks.
                </p>
              ) : (
                <div className="flex gap-2 justify-center">
                  {["Useful", "There was a reason", "Not useful"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setFeedback(l)}
                      className="px-4 py-2 rounded-full text-sm border border-[--color-border] hover:bg-[--color-surface] transition-colors"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed text-center py-10">
              <p className="text-3xl mb-2">🌿</p>
              <p className="text-sm text-[--color-text-sub]">{card.actions[0]}</p>
              <p className="text-xs text-[--color-muted] mt-2">{card.what_this_is_not}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
