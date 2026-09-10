import React, { useState } from "react";
import { StepHints } from "../../../intelligence/specifications/types";

interface Props {
  hints: StepHints;
  onClose: () => void;
  onHintUsed?: (level: number) => void;
}

export const HintModal: React.FC<Props> = ({ hints, onClose, onHintUsed }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);

  const handleNextTier = () => {
    const next = currentLevel + 1;
    setCurrentLevel(next);
    if (onHintUsed) onHintUsed(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbf7ee] border-2 border-[#d6cbba] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in text-[#2c2824]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dfd4c0] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <h3 className="font-serif text-lg font-medium text-[#2c2824]">
              Gentle Guiding Hint
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#736a5e] hover:text-[#2c2824] bg-white border border-[#d6cbba] px-2.5 py-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content of Current Tier */}
        <div className="space-y-3 py-1">
          {/* Tier 1 */}
          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#485935]">
              Hint Tier 1: Gentle Thought
            </div>
            <p className="text-xs sm:text-sm text-[#41382c] leading-relaxed">
              {hints.level_1_gentle_reminder}
            </p>
          </div>

          {/* Tier 2 */}
          {currentLevel >= 2 && hints.level_2_visual_cue && (
            <div className="bg-[#edf4ea] border border-[#9bc490] rounded-2xl p-4 space-y-1 animate-fade-in">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2c401e]">
                Hint Tier 2: Visual Clue
              </div>
              <p className="text-xs sm:text-sm text-[#334224] leading-relaxed">
                {hints.level_2_visual_cue}
              </p>
            </div>
          )}

          {/* Tier 3: Family Voice */}
          {currentLevel >= 3 && hints.level_3_family_voice && (
            <div className="bg-[#f5ede0] border border-[#dfd4c0] rounded-2xl p-4 space-y-1 animate-fade-in">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#856404]">
                Hint Tier 3: {hints.level_3_family_voice.speaker} ({hints.level_3_family_voice.relationship})
              </div>
              <p className="text-xs sm:text-sm text-[#595043] italic leading-relaxed">
                "{hints.level_3_family_voice.text}"
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {currentLevel < 3 && (hints.level_2_visual_cue || hints.level_3_family_voice) ? (
            <button
              type="button"
              onClick={handleNextTier}
              className="text-xs font-medium text-[#485935] hover:text-[#334224] underline underline-offset-2"
            >
              Need a little more help? (Show next clue)
            </button>
          ) : (
            <span className="text-[11px] text-[#736a5e]">
              Take your time, there is no hurry.
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="bg-[#485935] hover:bg-[#39472a] text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
          >
            Got it, thank you
          </button>
        </div>
      </div>
    </div>
  );
};
