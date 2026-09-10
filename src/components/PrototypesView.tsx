import React, { useState } from "react";
import { Layers, ExternalLink, RefreshCw, Smartphone, Monitor } from "lucide-react";

interface PrototypeInfo {
  id: string;
  name: string;
  url: string;
  role: string;
  description: string;
  targetDevice: "mobile" | "desktop";
}

const PROTOTYPES: PrototypeInfo[] = [
  {
    id: "person",
    name: "Person App (Purnima)",
    url: "/design-prototype/MindMitra-Person-App.html",
    role: "Elder living with mild cognitive impairment",
    description: "Designed in Stitch with large touch affordances, high-contrast warm stone/saffron aesthetic, and gentle step-by-step cues.",
    targetDevice: "mobile",
  },
  {
    id: "caregiver",
    name: "Caregiver Copilot (Anu)",
    url: "/design-prototype/MindMitra-Caregiver-Copilot.html",
    role: "Primary family caregiver",
    description: "Attention budget management, 3-layer decline observation card, and safety check timeline.",
    targetDevice: "desktop",
  },
  {
    id: "chw",
    name: "CHW Copilot (Meena)",
    url: "/design-prototype/MindMitra-CHW-Copilot.html",
    role: "ASHA / Community health worker",
    description: "Village elder roster, rapid 3-minute screening, and offline-first sensor quality telemetry.",
    targetDevice: "mobile",
  },
  {
    id: "clinical",
    name: "Clinical Bridge (Dr. Barman)",
    url: "/design-prototype/MindMitra Clinical Bridge.html",
    role: "GMC Hospital Neurologist",
    description: "Longitudinal cognitive trajectory evidence blocks, provenance ledger, and diagnosis-refusal guardrails.",
    targetDevice: "desktop",
  },
];

export const PrototypesView: React.FC = () => {
  const [activeProto, setActiveProto] = useState<PrototypeInfo>(PROTOTYPES[0]);
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6ddcf]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7d330a] bg-[#ffdba8]/50 px-2.5 py-1 rounded-md">
              Stitch Design Prototypes
            </span>
            <span className="text-xs text-[#7a7a71]">Google AI Studio UI Design Tool</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
            Stitch Interactive Prototype Explorer
          </h1>
          <p className="text-sm text-[#6b6b63] mt-1 max-w-2xl">
            Live sandboxed exploration of the 4 complete UI prototypes created in Stitch during the design phase of MindMitra.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6ddcf] bg-[#fbf1e3] text-xs font-semibold text-[#332f29] hover:bg-[#f7eadc] transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reload Frame</span>
          </button>

          <a
            href={activeProto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5e6f4a] text-xs font-semibold text-white hover:bg-[#48583a] transition-colors"
          >
            <ExternalLink size={14} />
            <span>Open Standalone</span>
          </a>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROTOTYPES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveProto(p)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeProto.id === p.id
                ? "bg-[#f7eadc] border-[#5e6f4a] shadow-xs"
                : "bg-[#fbf1e3] border-[#e6ddcf] hover:bg-[#f7eadc]/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#332f29]">{p.name}</span>
              {p.targetDevice === "mobile" ? (
                <Smartphone size={16} className="text-[#6b6b63]" />
              ) : (
                <Monitor size={16} className="text-[#6b6b63]" />
              )}
            </div>
            <p className="text-xs text-[#a85e46] font-medium mt-1">{p.role}</p>
            <p className="text-[11px] text-[#7a7a71] mt-1 line-clamp-2">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Frame Container */}
      <div className="bg-[#eee1cc] p-4 rounded-2xl border border-[#e6ddcf] flex justify-center">
        <div
          className={`w-full bg-white rounded-xl shadow-md overflow-hidden border border-[#d6d3d1] transition-all duration-300 ${
            activeProto.targetDevice === "mobile" ? "max-w-md h-[780px]" : "h-[820px]"
          }`}
        >
          <iframe
            key={iframeKey}
            src={activeProto.url}
            title={activeProto.name}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
