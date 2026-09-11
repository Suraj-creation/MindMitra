import React from "react";
import { X, SearchCheck, CheckCircle2, CloudRain, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

interface EvidenceItem {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
  reliability: number;
}

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem[];
  observation: string;
  practicalReason: string;
  whatThisDoesNotMean: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  evidence,
  observation,
  practicalReason,
  whatThisDoesNotMean,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032212]/50 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#c2c8c1]/40 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <SearchCheck size={14} /> Full Evidence & Provenance Audit
            </div>
            <h2 className="text-xl font-bold font-serif text-[#032212]">
              Why Am I Seeing This Gentle Observation?
            </h2>
            <p className="text-xs text-[#424843] mt-1">
              MindMitra generates zero unverified alerts. Every observation is grounded in verifiable home facts and validated against Aitâ’s personal 14-day baseline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f2ede4] text-[#424843] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Observation Review */}
        <div className="p-4 bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
            Core Observation Under Review
          </div>
          <p className="text-sm font-serif text-[#032212] leading-relaxed">
            "{observation}"
          </p>
        </div>

        {/* The Two Essential Clinical Clarifications */}
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-[#f2ede4] border border-[#c2c8c1]/60 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a3826] mb-1.5">
              <CloudRain size={16} /> Likely Practical Reason
            </div>
            <p className="text-xs text-[#1d1c16] leading-relaxed">
              {practicalReason}
            </p>
          </div>

          <div className="p-4 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ba1a1a] mb-1.5">
              <AlertTriangle size={16} /> What This Does NOT Mean
            </div>
            <p className="text-xs text-[#1d1c16] leading-relaxed">
              {whatThisDoesNotMean}
            </p>
          </div>
        </div>

        {/* Raw Sensor & Behavioral Fact Traces */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#032212] mb-3 flex items-center justify-between">
            <span>Verified Source Telemetry Points ({evidence.length})</span>
            <span className="text-[11px] text-[#466550] font-medium flex items-center gap-1">
              <ShieldCheck size={14} /> Memory Firewall Cryptographically Signed
            </span>
          </div>

          <div className="space-y-2.5">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#ffffff] border border-[#c2c8c1] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#032212]">{item.title}</span>
                    <span className="text-[10px] text-[#424843] flex items-center gap-1 bg-[#f2ede4] px-2 py-0.5 rounded-full">
                      <Clock size={10} /> {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#424843] leading-relaxed">{item.detail}</p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-[10px] font-semibold text-[#727972]">Reliability</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#c8ebd1] text-[#022111]">
                    <CheckCircle2 size={12} /> {item.reliability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-colors"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
