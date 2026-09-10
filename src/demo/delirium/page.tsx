"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AcuteChangeState {
  onset_hours: number;
  n_domains: number;
  fluctuating: boolean;
  new_inattention: boolean;
  altered_arousal: boolean;
}

function evaluateAcute(s: AcuteChangeState) {
  const features = [s.fluctuating, s.new_inattention, s.altered_arousal];
  const hasClinicalFeature = features.some(Boolean);
  const isAcute =
    s.onset_hours <= 72 && s.n_domains >= 2 && hasClinicalFeature;

  return {
    isAcute,
    featureNames: [
      s.fluctuating && "fluctuating course",
      s.new_inattention && "new inattention",
      s.altered_arousal && "altered arousal",
    ].filter(Boolean),
    reason: isAcute
      ? `Sudden multi-domain change within ${s.onset_hours}h with ${features.filter(Boolean).length} clinical feature(s). Seek urgent medical assessment — possible causes: delirium, infection, medication effect, dehydration. Do NOT attribute to dementia.`
      : "Criteria not met — onset window, domain count, or clinical features below threshold.",
  };
}

export default function DeliriumDemoPage() {
  const [state, setState] = useState<AcuteChangeState>({
    onset_hours: 24,
    n_domains: 2,
    fluctuating: true,
    new_inattention: false,
    altered_arousal: false,
  });

  const result = evaluateAcute(state);

  function toggle(key: keyof AcuteChangeState) {
    setState((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="danger">Delirium safety rule — L5 always fires</Badge>
        <h1 className="mt-2 text-3xl font-bold">L5 Delirium Alert</h1>
        <p className="mt-1 text-[--color-text-sub] max-w-xl">
          Inject a 12-hour acute multi-domain change with a clinical feature —
          L5 fires instantly and explicitly says{" "}
          <em>"not dementia progression; seek urgent care today."</em>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <Card>
          <CardTitle>Acute change signals</CardTitle>
          <CardDescription>
            All three criteria must hold for L5 to fire.
          </CardDescription>

          <div className="space-y-5">
            {/* Onset */}
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="onset" className="text-sm font-medium">
                  Onset window (hours)
                </label>
                <span className={cn(
                  "text-sm font-bold font-mono",
                  state.onset_hours <= 72 ? "text-red-600" : "text-[--color-muted]",
                )}>
                  {state.onset_hours}h {state.onset_hours <= 72 ? "✓" : "✗ (> 72h)"}
                </span>
              </div>
              <input
                id="onset"
                type="range" min={6} max={168} step={6}
                value={state.onset_hours}
                onChange={(e) => setState((s) => ({ ...s, onset_hours: Number(e.target.value) }))}
                className="w-full accent-[--color-danger]"
              />
              <div className="flex justify-between text-xs text-[--color-muted] mt-0.5">
                <span>6h</span>
                <span className="text-red-500 font-medium">← 72h threshold →</span>
                <span>168h (7 days)</span>
              </div>
            </div>

            {/* Domains */}
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="domains" className="text-sm font-medium">
                  Domains affected
                </label>
                <span className={cn(
                  "text-sm font-bold font-mono",
                  state.n_domains >= 2 ? "text-red-600" : "text-[--color-muted]",
                )}>
                  {state.n_domains} {state.n_domains >= 2 ? "✓" : "✗ (need ≥2)"}
                </span>
              </div>
              <input
                id="domains"
                type="range" min={1} max={6} step={1}
                value={state.n_domains}
                onChange={(e) => setState((s) => ({ ...s, n_domains: Number(e.target.value) }))}
                className="w-full accent-[--color-danger]"
              />
            </div>

            {/* Clinical features */}
            <div>
              <p className="text-sm font-medium mb-2">
                Clinical features{" "}
                <span className="text-xs text-[--color-muted]">(need at least 1)</span>
              </p>
              {(
                [
                  ["fluctuating", "Fluctuating course"],
                  ["new_inattention", "New inattention"],
                  ["altered_arousal", "Altered arousal"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-[--color-border] last:border-0">
                  <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                  <button
                    id={key}
                    role="switch"
                    aria-checked={state[key] as boolean}
                    onClick={() => toggle(key)}
                    className={cn(
                      "relative inline-flex h-6 w-11 rounded-full transition-colors",
                      state[key] ? "bg-red-500" : "bg-stone-300",
                    )}
                  >
                    <span className={cn(
                      "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
                      state[key] ? "translate-x-5" : "translate-x-0.5",
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Result — live, no button needed */}
        <div className="space-y-4">
          <Card className={cn(
            "border-2 transition-all",
            result.isAcute ? "border-red-500 bg-red-50" : "border-[--color-border]",
          )}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl" aria-hidden>
                {result.isAcute ? "🚨" : "📊"}
              </span>
              <div>
                {result.isAcute ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white mb-2">
                      L5 URGENT — Act now
                    </span>
                    <p className="text-sm font-semibold text-red-800">
                      Acute multi-domain change detected
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-[--color-muted]">
                    Below L5 threshold
                  </p>
                )}
              </div>
            </div>

            <p className={cn("text-sm mb-4", result.isAcute ? "text-red-700" : "text-[--color-muted]")}>
              {result.reason}
            </p>

            {result.isAcute && (
              <>
                <div className="space-y-2 mb-4">
                  {[
                    "Contact the primary caregiver immediately",
                    "Contact the CHW or AAM for a same-day visit",
                    "Rule out: delirium, UTI, dehydration, new medication, fall",
                    "Do NOT wait — acute presentations in dementia can deteriorate rapidly",
                  ].map((a, i) => (
                    <div key={i} className="flex gap-2 text-sm text-red-800">
                      <span className="shrink-0 font-bold">{i + 1}.</span>
                      {a}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-red-300 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-[--color-text]">
                    🔒 What this is NOT
                  </p>
                  <p className="text-sm text-[--color-text-sub] mt-1">
                    This is <strong>not</strong> "dementia progressing." Sudden
                    acute change must always rule out a reversible cause first.
                    Only a clinician can interpret the trajectory. The system is
                    demonstrably incapable of making that claim.
                  </p>
                </div>
              </>
            )}

            {/* Criteria summary */}
            <div className="mt-4 pt-4 border-t border-[--color-border] space-y-1.5">
              <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                Criteria
              </p>
              {[
                ["Onset ≤ 72h",       state.onset_hours <= 72],
                ["Domains ≥ 2",       state.n_domains >= 2],
                ["Clinical feature",  result.featureNames.length > 0],
              ].map(([label, met]) => (
                <div key={String(label)} className="flex items-center gap-2 text-sm">
                  <span className={met ? "text-red-500" : "text-stone-400"} aria-hidden>
                    {met ? "✓" : "✗"}
                  </span>
                  <span className={met ? "text-[--color-text]" : "text-[--color-muted]"}>
                    {String(label)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* L5 bypass explanation */}
          <Card className="bg-[--color-surface]">
            <p className="text-xs text-[--color-muted] leading-relaxed">
              <strong className="text-[--color-text]">Why L5 bypasses everything:</strong>{" "}
              L5 ignores the Attention Budget, the novelty check, and the
              actionability gate. It is a safety-rule override — the one
              escalation level that <em>always</em> fires when all three
              criteria hold. The reason string never contains the word
              "progressing."
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
