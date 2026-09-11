import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, HeartHandshake, Info } from "lucide-react";

interface SupportLevelModalProps {
  currentLevel: number;
  currentReason: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (level: number, reason: string) => Promise<void>;
}

export const SupportLevelModal: React.FC<SupportLevelModalProps> = ({
  currentLevel,
  currentReason,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [reason, setReason] = useState(currentReason);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const levels = [
    {
      level: 1,
      title: "Level 1: Independent / Light Support",
      summary: "Autonomous in daily rhythms. Benefits from gentle prospective reminders and light ambient orientation.",
    },
    {
      level: 2,
      title: "Level 2: Guided Routine Support (Current)",
      summary:
        "Benefits from structured auditory cues for morning medication and warm companionship during the late afternoon veranda transition.",
    },
    {
      level: 3,
      title: "Level 3: Regular Support",
      summary: "Step-by-step cueing for multi-step domestic tasks, active family check-ins, and consistent evening reassurance.",
    },
    {
      level: 4,
      title: "Level 4: High / Continuous Support",
      summary: "Full hands-on guidance for personal care, continuous environmental safety oversight, and synchronized CHW support.",
    },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedLevel, reason);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032212]/50 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl max-w-xl w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <HeartHandshake size={14} /> Practical Scaffolding Guide
            </div>
            <h2 className="text-xl font-bold font-serif text-[#032212]">
              Update Aitâ’s Care & Support Guide
            </h2>
            <p className="text-xs text-[#424843] mt-1">
              Select the everyday scaffolding level that best reflects Aitâ’s practical daily needs today.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f2ede4] text-[#424843] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Anti-Stigma Guardrail Box */}
        <div className="p-3.5 bg-[#f8f3ea] border border-[#ffdcc3] rounded-2xl flex items-start gap-3">
          <Info size={18} className="text-[#904d00] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1d1c16] leading-relaxed">
            <span className="font-bold text-[#904d00]">Human Context Note:</span> This is a practical day-to-day scaffolding guide set by Anu. It is an operational care guide, <strong className="font-semibold underline decoration-[#904d00]">not an automated dementia stage or clinical score</strong>.
          </div>
        </div>

        {/* Level Radio List */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {levels.map((item) => (
            <button
              key={item.level}
              type="button"
              onClick={() => {
                setSelectedLevel(item.level);
                if (!reason || reason === currentReason) {
                  setReason(item.summary);
                }
              }}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                selectedLevel === item.level
                  ? "border-[#1a3826] bg-[#f2ede4] shadow-xs"
                  : "border-[#c2c8c1]/60 bg-[#ffffff] hover:bg-[#f8f3ea]/60"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  selectedLevel === item.level
                    ? "border-[#1a3826] bg-[#1a3826] text-white"
                    : "border-[#727972]"
                }`}
              >
                {selectedLevel === item.level && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-bold text-[#032212]">{item.title}</div>
                <div className="text-xs text-[#424843] mt-0.5 leading-relaxed">{item.summary}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Caregiver Observation / Rationale */}
        <div>
          <label className="block text-xs font-bold text-[#032212] mb-1">
            Caregiver Scaffolding Notes & Observations
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3826] text-[#032212]"
            placeholder="Describe why this scaffolding level is appropriate for Aitâ's current daily rhythm..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#424843] hover:bg-[#f2ede4] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-all shadow-xs flex items-center gap-1.5"
          >
            {isSaving ? "Saving to Database..." : "Save Scaffolding Guide"}
          </button>
        </div>
      </div>
    </div>
  );
};
