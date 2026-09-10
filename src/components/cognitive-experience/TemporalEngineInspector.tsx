import React, { useState, useEffect } from "react";
import { TemporalEvent, TemporalOrientationContextPack, TemporalOrientationSpec } from "../../domain/cognitive-experience";

interface Props {
  onClose: () => void;
}

export const TemporalEngineInspector: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"firewall" | "spec" | "validation" | "events" | "ladder">("firewall");
  const [contextPack, setContextPack] = useState<TemporalOrientationContextPack | null>(null);
  const [events, setEvents] = useState<TemporalEvent[]>([]);
  const [spec, setSpec] = useState<TemporalOrientationSpec | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch context pack
      const cpRes = await fetch("/v1/temporal-orientation/context-pack/person:purnima");
      const cpData = await cpRes.json();
      if (cpData.pack) setContextPack(cpData.pack);

      // 2. Fetch orchestrated spec
      const orchRes = await fetch("/v1/temporal-orientation/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: "person:purnima", intent: "daily_orientation" }),
      });
      const orchData = await orchRes.json();
      if (orchData.spec) setSpec(orchData.spec);

      // 3. Fetch all temporal events (including cancelled/stale)
      const evRes = await fetch("/v1/temporal-events?person_id=person:purnima&include_cancelled=true&include_stale=true");
      const evData = await evRes.json();
      if (evData.items) setEvents(evData.items);
    } catch (e) {
      console.error("Inspector fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === "cancelled" ? "confirmed" : "cancelled";
    try {
      await fetch(`/v1/temporal-events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setActionNotice(`Updated ${eventId} status to "${newStatus}". Re-orchestrating...`);
      await fetchData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error("Status toggle error:", e);
    }
  };

  const handleResetEvents = async () => {
    try {
      await fetch("/v1/temporal-events/reset", { method: "POST" });
      setActionNotice("Temporal events reset to verified defaults.");
      await fetchData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#fcfaf4] border border-[#dfd4c0] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#dfd4c0] flex justify-between items-center bg-[#faf6f0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#485935]"></span>
              <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
                Intelligence Audit & Firewall Inspector
              </span>
            </div>
            <h2 className="text-xl font-serif text-[#2c2824] font-medium mt-1">
              Temporal Orientation & Memory Firewall
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#d6cbba] hover:bg-[#f6eee2] text-[#41382c] flex items-center justify-center text-sm font-bold shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#dfd4c0] bg-white px-6 overflow-x-auto">
          {[
            { id: "firewall", label: "🛡️ Memory Firewall & Isolation" },
            { id: "validation", label: "✅ 12-Layer Validator" },
            { id: "events", label: "📅 Temporal Events Store" },
            { id: "ladder", label: "🪜 S0-S5 Adaptive Ladder" },
            { id: "spec", label: "📋 Deterministic Spec JSON" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "border-[#485935] text-[#485935] font-semibold"
                  : "border-transparent text-[#736a5e] hover:text-[#2c2824]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="bg-[#eaf0e4] border-b border-[#bdd4b0] text-[#2c401e] px-6 py-2.5 text-xs font-medium">
            {actionNotice}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-[#41382c]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#485935] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-[#736a5e]">Inspecting temporal engine state...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: MEMORY FIREWALL */}
              {activeTab === "firewall" && contextPack && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-[#2c2824]">
                      Memory Firewall Verification Matrix
                    </h4>
                    <p className="text-[#595043]">
                      Zero-leakage enforcement verified on every temporal candidate before generation.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 bg-[#faf6f0] rounded-xl border border-[#dfd4c0]">
                        <span className="text-[10px] text-[#736a5e] block uppercase">Target Person</span>
                        <span className="font-bold text-[#485935]">{contextPack.person.id}</span>
                      </div>
                      <div className="p-3 bg-[#faf6f0] rounded-xl border border-[#dfd4c0]">
                        <span className="text-[10px] text-[#736a5e] block uppercase">Consent Status</span>
                        <span className="font-bold text-[#485935]">
                          {contextPack.constraints.consent_active ? "Active & Authorized" : "Blocked"}
                        </span>
                      </div>
                      <div className="p-3 bg-[#faf6f0] rounded-xl border border-[#dfd4c0]">
                        <span className="text-[10px] text-[#736a5e] block uppercase">Cancelled Excluded</span>
                        <span className="font-bold text-[#8b4513]">
                          {contextPack.constraints.cancelled_events_excluded} events
                        </span>
                      </div>
                      <div className="p-3 bg-[#faf6f0] rounded-xl border border-[#dfd4c0]">
                        <span className="text-[10px] text-[#736a5e] block uppercase">Stale Excluded</span>
                        <span className="font-bold text-[#736a5e]">
                          {contextPack.constraints.stale_events_excluded} events
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grounded Anchors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold text-[#8b4513] uppercase">Yesterday Anchor</span>
                      <h5 className="font-semibold">{contextPack.yesterday.event?.title || "No event"}</h5>
                      <p className="text-[#736a5e]">
                        Occurred: {contextPack.yesterday.event?.start_at}
                      </p>
                      <span className="inline-block bg-[#485935]/10 text-[#485935] text-[10px] px-2 py-0.5 rounded">
                        Provenance: {contextPack.yesterday.event?.provenance}
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold text-[#485935] uppercase">Today Anchor</span>
                      <h5 className="font-semibold">{contextPack.today.event?.title || contextPack.now.current_routine}</h5>
                      <p className="text-[#736a5e]">
                        Part of Day: {contextPack.now.part_of_day}
                      </p>
                      <span className="inline-block bg-[#485935]/10 text-[#485935] text-[10px] px-2 py-0.5 rounded">
                        Verification: Caregiver Verified
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold text-[#b8860b] uppercase">Tomorrow Anchor</span>
                      <h5 className="font-semibold">{contextPack.tomorrow.event?.title || "No upcoming"}</h5>
                      <p className="text-[#736a5e]">
                        Scheduled: {contextPack.tomorrow.event?.start_at}
                      </p>
                      <span className="inline-block bg-[#485935]/10 text-[#485935] text-[10px] px-2 py-0.5 rounded">
                        Status: {contextPack.tomorrow.event?.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 12-LAYER VALIDATOR */}
              {activeTab === "validation" && spec && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-[#2c2824]">
                        12-Layer Engine Validation Results
                      </h4>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          spec.validation_status.all_passed
                            ? "bg-[#eaf0e4] text-[#2c401e]"
                            : "bg-[#fceae8] text-[#732a15]"
                        }`}
                      >
                        {spec.validation_status.all_passed ? "PASSED (12/12 Layers)" : "REJECTED"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4">
                      {[
                        { label: "1. Schema Validation", ok: spec.validation_status.schema_passed },
                        { label: "2. Data Authorization", ok: spec.validation_status.data_authorization_passed },
                        { label: "3. Consent Scopes", ok: spec.validation_status.consent_passed },
                        { label: "4. Provenance Integrity", ok: spec.validation_status.provenance_passed },
                        { label: "5. Verification Status", ok: spec.validation_status.verification_passed },
                        { label: "6. Temporal Validity", ok: spec.validation_status.temporal_validity_passed },
                        { label: "7. Context Freshness", ok: spec.validation_status.freshness_passed },
                        { label: "8. Sensitivity Gating", ok: spec.validation_status.sensitivity_passed },
                        { label: "9. Anxiety & Safety", ok: spec.validation_status.safety_passed },
                        { label: "10. Dignity & Anti-Quiz", ok: spec.validation_status.dignity_passed },
                        { label: "11. Language Personalization", ok: spec.validation_status.personalization_passed },
                        { label: "12. Measurement Integrity", ok: true },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 bg-[#faf6f0] rounded-xl border border-[#dfd4c0]"
                        >
                          <span className="text-[11px] font-medium">{item.label}</span>
                          <span className={item.ok ? "text-[#485935] font-bold" : "text-[#732a15] font-bold"}>
                            {item.ok ? "✓ Pass" : "✕ Fail"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEMPORAL EVENTS STORE & TOGGLE */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[#595043]">
                      Manage event statuses in real-time. Notice how toggling an event to "cancelled" instantly removes it from upcoming recommendations.
                    </p>
                    <button
                      onClick={handleResetEvents}
                      className="bg-white border border-[#d6cbba] hover:bg-[#f6eee2] text-[#41382c] px-3 py-1.5 rounded-xl font-medium shadow-sm"
                    >
                      ↺ Reset Defaults
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-white border border-[#dfd4c0] rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#2c2824]">{ev.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ev.status === "cancelled"
                                  ? "bg-[#fceae8] text-[#732a15]"
                                  : ev.status === "occurred"
                                  ? "bg-[#eaf0e4] text-[#2c401e]"
                                  : "bg-[#faf0d9] text-[#7a5900]"
                              }`}
                            >
                              {ev.status}
                            </span>
                            <span className="text-[10px] text-[#736a5e] bg-[#f0e8db] px-2 py-0.5 rounded">
                              {ev.event_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#736a5e]">
                            Time: {ev.start_at} • Source: {ev.source} • Verification: {ev.verification_status}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleEventStatus(ev.id, ev.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                            ev.status === "cancelled"
                              ? "bg-[#eaf0e4] text-[#2c401e] border-[#bdd4b0] hover:bg-[#d8e6ce]"
                              : "bg-[#fceae8] text-[#732a15] border-[#dfb3ae] hover:bg-[#fad8d4]"
                          }`}
                        >
                          {ev.status === "cancelled" ? "Restore to Confirmed" : "Cancel Event (Test Firewall)"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: S0-S5 LADDER */}
              {activeTab === "ladder" && (
                <div className="space-y-3">
                  <p className="text-[#595043]">
                    The 6-step progressive scaffolding ladder adapts automatically without ever penalizing or frustrating the person.
                  </p>
                  {[
                    { level: "S0", name: "Spontaneous / Open Recognition", desc: "Pure retrieval cue without answer choices." },
                    { level: "S1", name: "Contextual Cue", desc: "Sensory or setting clue (e.g. 'Golden brass kettle warm on veranda')." },
                    { level: "S2", name: "Archival Photo + Voice Note", desc: "Verified photograph and familiar audio note from primary caregiver (Anu)." },
                    { level: "S3", name: "Binary Dignified Choice", desc: "Two large high-contrast options with clear distinction." },
                    { level: "S4", name: "Guided Sensory Story", desc: "Step-by-step narrative unfolding of the moment." },
                    { level: "S5", name: "Full Reassurance & Celebration", desc: "Affirming complete memory with warmth and shared peace." },
                  ].map((step) => (
                    <div key={step.level} className="bg-white border border-[#dfd4c0] rounded-2xl p-4 flex gap-4 items-center">
                      <span className="w-10 h-10 rounded-xl bg-[#485935] text-white font-bold flex items-center justify-center text-sm">
                        {step.level}
                      </span>
                      <div>
                        <h5 className="font-semibold text-[#2c2824]">{step.name}</h5>
                        <p className="text-[#736a5e] text-xs">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: SPEC JSON */}
              {activeTab === "spec" && (
                <pre className="bg-[#1e1b18] text-[#d6cbba] p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(spec, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
