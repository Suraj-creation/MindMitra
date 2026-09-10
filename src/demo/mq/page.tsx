"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, type ObservationResponse } from "@/lib/api";

type SignalKey =
  | "audibility"
  | "visibility"
  | "fatigue_factor"
  | "language_match"
  | "was_assisted"
  | "device_ok"
  | "subject_confirmed";

const DEFAULT_SIGNALS = {
  audibility: 1.0,
  visibility: 1.0,
  language_match: true,
  fatigue_factor: 0.9,
  was_assisted: false,
  device_ok: true,
  subject_confirmed: true,
};

const SIGNAL_META: Record<
  string,
  { label: string; hint: string; type: "slider" | "toggle" }
> = {
  audibility:        { label: "Volume / audibility",  hint: "Set to 0 to simulate turning the volume down", type: "slider" },
  visibility:        { label: "Screen visibility",    hint: "Brightness × contrast × font size factor",   type: "slider" },
  fatigue_factor:    { label: "Fatigue factor",       hint: "1.0 = fully rested; 0 = extreme fatigue",    type: "slider" },
  language_match:    { label: "Language matches preferred", hint: "Off = language mismatch (NOT a cognitive failure)", type: "toggle" },
  was_assisted:      { label: "Was assisted",         hint: "Anomalous latency-accuracy pattern detected",type: "toggle" },
  device_ok:         { label: "Device OK",            hint: "No data gaps or integrity failures",         type: "toggle" },
  subject_confirmed: { label: "Subject confirmed",    hint: "Shared-device identity check passed",        type: "toggle" },
};

export default function MQDemoPage() {
  const [signals, setSignals] = useState({ ...DEFAULT_SIGNALS });
  const [result, setResult] = useState<ObservationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.submitObservation("person:demo", "memory", 0.75, {
        audibility: signals.audibility,
        visibility: signals.visibility,
        language_match: signals.language_match,
        fatigue_factor: signals.fatigue_factor,
        was_assisted: signals.was_assisted,
        device_ok: signals.device_ok,
        subject_confirmed: signals.subject_confirmed,
      });
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const isInsufficient = result?.gate === "insufficient_data";

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="primary">CLAUDE.md §1.4 — Invariant 4</Badge>
        <h1 className="mt-2 text-3xl font-bold">Measurement-Quality Gate</h1>
        <p className="mt-1 text-[--color-text-sub] max-w-xl">
          Bad data <strong>cannot</strong> raise an alarm. Set volume to 0 and
          hit Check — the system refuses to score the observation. This is the
          most memorable 20 seconds of the SIH demo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <Card>
          <CardTitle>Signal controls</CardTitle>
          <CardDescription>Simulate sensor conditions</CardDescription>

          <div className="space-y-5">
            {Object.entries(SIGNAL_META).map(([key, meta]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={key}
                    className="text-sm font-medium text-[--color-text]"
                  >
                    {meta.label}
                  </label>
                  {meta.type === "slider" && (
                    <span className="text-sm font-mono text-[--color-muted]">
                      {(signals[key as SignalKey] as number).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[--color-muted] mb-1.5">{meta.hint}</p>

                {meta.type === "slider" ? (
                  <input
                    id={key}
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={signals[key as SignalKey] as number}
                    onChange={(e) =>
                      setSignals((s) => ({
                        ...s,
                        [key]: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[--color-primary]"
                  />
                ) : (
                  <button
                    id={key}
                    role="switch"
                    aria-checked={signals[key as SignalKey] as boolean}
                    onClick={() =>
                      setSignals((s) => ({
                        ...s,
                        [key]: !s[key as SignalKey],
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 rounded-full transition-colors",
                      (signals[key as SignalKey] as boolean)
                        ? "bg-[--color-success]"
                        : "bg-red-400",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
                        (signals[key as SignalKey] as boolean)
                          ? "translate-x-5"
                          : "translate-x-0.5",
                      )}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-primary] text-white font-medium py-2.5 px-4 hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50"
            >
              {loading ? "Checking…" : "Check observation quality"}
            </button>
            <button
              onClick={() => {
                setSignals({ ...DEFAULT_SIGNALS });
                setResult(null);
              }}
              className="px-4 py-2.5 rounded-lg border border-[--color-border] text-[--color-text-sub] hover:bg-[--color-surface] transition-colors text-sm"
            >
              Reset
            </button>
          </div>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-700">
                ⚠️ Could not reach the API — is{" "}
                <code className="font-mono">uvicorn app.main:app</code> running?
              </p>
              <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
            </Card>
          )}

          {result && (
            <Card
              className={cn(
                "border-2 transition-colors",
                isInsufficient
                  ? "border-red-400 bg-red-50"
                  : "border-green-400 bg-green-50",
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl" aria-hidden>
                  {isInsufficient ? "🚫" : "✅"}
                </span>
                <span
                  className={cn(
                    "text-xl font-bold",
                    isInsufficient ? "text-red-700" : "text-green-700",
                  )}
                >
                  {isInsufficient ? "INSUFFICIENT DATA" : "SUFFICIENT"}
                </span>
              </div>

              <p
                className={cn(
                  "text-sm mb-4",
                  isInsufficient ? "text-red-700" : "text-green-700",
                )}
              >
                {result.message}
              </p>

              {result.language_mismatch && (
                <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm font-medium text-amber-800">
                    ⚠️ Language mismatch detected
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This is a <strong>measurement</strong> issue — it is{" "}
                    <strong>never</strong> counted as a cognitive failure for
                    the person.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                  Component scores
                </p>
                {Object.entries(result.component_scores).map(([k, rawVal]) => {
                  const v = Number(rawVal);
                  return (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    <span className="w-40 text-[--color-text-sub] text-xs font-mono">
                      {k}
                    </span>
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          v >= 0.4 ? "bg-green-500" : "bg-red-500",
                        )}
                        style={{ width: `${v * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-mono text-[--color-muted]">
                      {v.toFixed(2)}
                    </span>
                  </div>
                );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between text-sm">
                <span className="text-[--color-muted]">q (quality weight)</span>
                <span className="font-bold font-mono text-lg">
                  {result.q.toFixed(3)}
                </span>
              </div>
            </Card>
          )}

          {!result && !error && (
            <Card className="border-dashed text-center py-12 text-[--color-muted]">
              <p className="text-4xl mb-3">🎙️</p>
              <p className="text-sm">
                Adjust the sliders and click{" "}
                <strong>Check observation quality</strong>
              </p>
              <p className="text-xs mt-1">
                Try setting <strong>audibility to 0</strong> first.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
