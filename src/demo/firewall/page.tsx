"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  api,
  type PwmReadResponse,
  type SeedResponse,
} from "@/lib/api";

const PERSON_ID = "person:purnima";
const FACT_ID = "f_rina";

interface ReadRow {
  label: string;
  actor_id: string;
  purpose: string;
  expected: string;
  result?: PwmReadResponse;
  loading?: boolean;
}

const BASE_ROWS: ReadRow[] = [
  { label: "Purnima (herself)",         actor_id: "person:purnima:self", purpose: "self_access",     expected: "ALLOW" },
  { label: "Anu — primary caregiver",   actor_id: "actor:anu",           purpose: "personalisation", expected: "ALLOW" },
  { label: "Bikash — secondary (remote son)", actor_id: "actor:bikash",  purpose: "personalisation", expected: "DENY" },
  { label: "Meena — CHW (ASHA)",        actor_id: "actor:meena",         purpose: "personalisation", expected: "DENY" },
  { label: "Anu — for research",        actor_id: "actor:anu",           purpose: "research",        expected: "DENY" },
  { label: "A stranger",               actor_id: "actor:stranger",       purpose: "personalisation", expected: "DENY" },
];

export default function FirewallDemoPage() {
  const [seed, setSeed] = useState<SeedResponse | null>(null);
  const [rows, setRows] = useState<ReadRow[]>(BASE_ROWS);
  const [error, setError] = useState<string | null>(null);
  const [anuConsent, setAnuConsent] = useState(true);
  const [busy, setBusy] = useState(false);

  const doSeed = useCallback(async () => {
    setError(null);
    try {
      const s = await api.seedDemo();
      setSeed(s);
      setRows(BASE_ROWS.map((r) => ({ ...r, result: undefined })));
      setAnuConsent(true);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    void doSeed();
  }, [doSeed]);

  async function runRead(idx: number) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, loading: true } : r)));
    const row = rows[idx];
    try {
      const result = await api.readPwmFact(row.actor_id, PERSON_ID, FACT_ID, row.purpose);
      setRows((rs) =>
        rs.map((r, i) => (i === idx ? { ...r, result, loading: false } : r)),
      );
    } catch (e) {
      setError(String(e));
      setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, loading: false } : r)));
    }
  }

  async function toggleAnuConsent() {
    setBusy(true);
    setError(null);
    try {
      if (anuConsent) {
        await api.revokeConsent(PERSON_ID, "primary_caregiver", "pwm_fact", "personalisation");
        setAnuConsent(false);
      } else {
        await api.grantConsent(PERSON_ID, "primary_caregiver", "pwm_fact", "personalisation");
        setAnuConsent(true);
      }
      // Clear Anu's prior result so the change is obvious.
      setRows((rs) =>
        rs.map((r) =>
          r.actor_id === "actor:anu" && r.purpose === "personalisation"
            ? { ...r, result: undefined }
            : r,
        ),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="teal">CLAUDE.md §1.7 — Invariant 7 · Memory Firewall</Badge>
        <h1 className="mt-2 text-3xl font-bold">Memory Firewall</h1>
        <p className="mt-1 text-[--color-text-sub] max-w-2xl">
          Deny by default. Access to a person&apos;s data is a deterministic
          decision — role × category × purpose × consent × context — and every
          attempt is audited. This runs against the real backend: a seeded
          person, real caregivers, real consent, a real verified fact.
        </p>
      </div>

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

      {/* The protected fact */}
      <Card className="border-teal-200 bg-teal-50/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>The protected fact</CardTitle>
            <p className="text-sm text-[--color-text-sub] mt-1">
              <strong>&quot;Rina is Purnima&apos;s granddaughter.&quot;</strong>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="success">verified</Badge>
              <Badge variant="teal">visibility: person</Badge>
              <Badge variant="teal">visibility: primary_caregiver</Badge>
              <Badge variant="muted">confidence: high</Badge>
            </div>
            <p className="text-xs text-[--color-muted] mt-2">
              The visibility list <strong>excludes</strong> secondary caregivers and
              the CHW — so the firewall will withhold this fact from them, even
              though they have a valid care relationship.
            </p>
          </div>
          <button
            onClick={doSeed}
            className="shrink-0 text-sm px-3 py-2 rounded-lg border border-[--color-border] hover:bg-white transition-colors"
          >
            ↺ Reset scenario
          </button>
        </div>
      </Card>

      {/* Consent control */}
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="mb-0">Purnima&apos;s consent for Anu</CardTitle>
            <p className="text-sm text-[--color-text-sub] mt-1">
              Category <code className="font-mono text-xs">pwm_fact</code> · Purpose{" "}
              <code className="font-mono text-xs">personalisation</code> · Grantee{" "}
              <code className="font-mono text-xs">primary_caregiver</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-medium", anuConsent ? "text-green-700" : "text-red-700")}>
              {anuConsent ? "Consent granted" : "Consent revoked"}
            </span>
            <button
              onClick={toggleAnuConsent}
              disabled={busy}
              role="switch"
              aria-checked={anuConsent}
              className={cn(
                "relative inline-flex h-7 w-12 rounded-full transition-colors disabled:opacity-50",
                anuConsent ? "bg-green-500" : "bg-red-400",
              )}
            >
              <span
                className={cn(
                  "inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform",
                  anuConsent ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
        <p className="text-xs text-[--color-muted] mt-3">
          Revoke consent, then re-run Anu&apos;s read below — watch it flip from{" "}
          <span className="text-green-700 font-medium">ALLOW</span> to{" "}
          <span className="text-red-700 font-medium">DENY (consent_absent)</span>.
        </p>
      </Card>

      {/* Read attempts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Who is trying to read the fact?</h2>
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const r = row.result;
            const decided = r !== undefined;
            const allowed = r?.allowed ?? false;
            return (
              <Card
                key={`${row.actor_id}:${row.purpose}`}
                className={cn(
                  "transition-colors",
                  decided && allowed && "border-green-300 bg-green-50/50",
                  decided && !allowed && "border-red-300 bg-red-50/50",
                )}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="font-medium text-[--color-text]">{row.label}</p>
                    <p className="text-xs text-[--color-muted] font-mono">
                      {row.actor_id} · purpose={row.purpose}
                    </p>
                  </div>

                  {/* Decision */}
                  <div className="flex-1 min-w-[14rem]">
                    {!decided ? (
                      <span className="text-sm text-[--color-muted]">
                        Not yet attempted
                      </span>
                    ) : allowed ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-sm">
                          ✅ ALLOW
                        </span>
                        {r?.fact && (
                          <p className="text-xs text-green-800 mt-0.5">
                            → discloses:{" "}
                            <strong>
                              {String((r.fact.value as Record<string, unknown>).kinship_type)}
                            </strong>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-sm">
                          🛡️ DENY
                        </span>
                        <p className="text-xs text-red-700 mt-0.5 font-mono">
                          {r?.reason_codes.join(", ")}
                        </p>
                        <p className="text-xs text-[--color-muted] mt-0.5">
                          fact withheld · audited
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => runRead(idx)}
                    disabled={row.loading}
                    className="shrink-0 rounded-lg bg-[--color-primary] text-white text-sm font-medium py-2 px-4 hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50"
                  >
                    {row.loading ? "…" : "Attempt read"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="bg-[--color-surface]">
        <p className="text-xs text-[--color-muted] leading-relaxed">
          <strong className="text-[--color-text]">What just happened:</strong> the
          LLM is nowhere near this decision. `firewall.evaluate()` is pure Python —
          it read the fact&apos;s visibility list, resolved the actor&apos;s role and
          the person&apos;s consent, and returned an allow/deny with a reason. Every
          attempt — allowed or denied — was written to the append-only audit log.
          Never-collected categories (raw audio/video, financial) can&apos;t even be
          requested.
        </p>
      </Card>
    </div>
  );
}
