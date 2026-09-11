import React from "react";
import { X, Tablet, Wifi, BatteryCharging, Sparkles, Volume2, ShieldCheck } from "lucide-react";

interface TabletMirrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TabletMirrorModal: React.FC<TabletMirrorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032212]/60 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#c2c8c1]/40 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#c8ebd1] text-[#022111] mb-1">
              <Tablet size={13} /> Live Mirror View
            </div>
            <h2 className="text-lg font-bold font-serif text-[#032212]">
              Aitâ’s Living Room Screen Sanctuary
            </h2>
            <p className="text-xs text-[#424843]">
              Tezpur Ancestral Home · Living Room Teak Stand Tablet · Battery 94% · Synced Real-Time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f2ede4] text-[#424843] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tablet Frame Simulation */}
        <div className="relative rounded-2xl border-4 border-[#1a3826] bg-[#fef9f0] p-6 shadow-inner overflow-hidden min-h-[320px] flex flex-col justify-between">
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8f3ea] to-[#fef9f0] pointer-events-none opacity-90" />

          {/* Tablet Status Header */}
          <div className="relative z-10 flex items-center justify-between text-xs text-[#424843] font-medium border-b border-[#c2c8c1]/30 pb-2">
            <span className="flex items-center gap-1 text-[#1a3826] font-semibold">
              <Sparkles size={13} className="text-[#904d00]" /> MindMitra Living Sanctuary
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#466550]">
                <Volume2 size={13} /> Borxongit Flute (Gentle)
              </span>
              <span className="flex items-center gap-1">
                <Wifi size={13} /> Tezpur Home
              </span>
              <span className="flex items-center gap-1">
                <BatteryCharging size={13} /> 94%
              </span>
            </div>
          </div>

          {/* Centered Calm Sanctuary Display */}
          <div className="relative z-10 py-8 text-center space-y-3">
            <div className="text-4xl sm:text-5xl font-serif font-bold text-[#032212] tracking-tight">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-base sm:text-lg font-serif text-[#904d00]">
              আজি শান্ত সোমবাৰ · তেজপুৰৰ ঘৰ (Calm Morning at Home)
            </div>
            <p className="text-xs sm:text-sm text-[#424843] max-w-md mx-auto">
              বৰষুণৰ টোপালৰ শব্দ আৰু সুৰীয়া বাঁহীৰ সুৰ। অনু ঘৰতে কাষৰ কোঠাতে আছে।
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f2ede4] border border-[#c2c8c1]/60 text-xs text-[#032212] mt-2">
              <ShieldCheck size={14} className="text-[#1a3826]" />
              <span>Sanctuary Mode Active — Zero intrusive alerts shown to Aitâ</span>
            </div>
          </div>

          {/* Bottom Mirror Status */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-[#727972] border-t border-[#c2c8c1]/30 pt-2">
            <span>Next Anchor: 4:00 PM Veranda Cardamom Tea</span>
            <span className="text-[#1a3826] font-medium">Memory Firewall Active</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-colors"
          >
            Close Mirror
          </button>
        </div>
      </div>
    </div>
  );
};
