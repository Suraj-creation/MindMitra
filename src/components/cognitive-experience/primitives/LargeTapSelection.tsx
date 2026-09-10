import React from "react";
import { ResponseOption } from "../../../intelligence/specifications/types";

interface Props {
  options: ResponseOption[];
  selectedOptionId: string | null;
  onSelect: (option: ResponseOption) => void;
  disabled?: boolean;
  bilingual?: boolean;
}

export const LargeTapSelection: React.FC<Props> = ({
  options,
  selectedOptionId,
  onSelect,
  disabled = false,
  bilingual = true,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3.5 w-full">
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={`min-h-[58px] w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer select-none active:scale-[0.99] ${
              isSelected
                ? "bg-[#edf4ea] border-[#485935] shadow-md ring-2 ring-[#485935]/20"
                : "bg-white hover:bg-[#faf6f0] border-[#d6cbba] hover:border-[#485935]/50 shadow-sm"
            } ${disabled ? "opacity-75 cursor-default" : ""}`}
            style={{ minHeight: "58px" }}
          >
            <div className="flex-1 space-y-1">
              <div className="text-base sm:text-lg font-medium text-[#2c2824] leading-snug">
                {option.text}
              </div>
              {bilingual && option.assamese_text && (
                <div className="text-xs sm:text-sm text-[#736a5e] font-serif">
                  {option.assamese_text}
                </div>
              )}
              {option.subtle_visual_cue && (
                <div className="text-[11px] text-[#485935] font-medium flex items-center gap-1 mt-0.5">
                  <span>🍃</span>
                  <span>{option.subtle_visual_cue}</span>
                </div>
              )}
            </div>

            <div
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                isSelected
                  ? "border-[#485935] bg-[#485935] text-white"
                  : "border-[#d6cbba] bg-white text-transparent"
              }`}
            >
              ✓
            </div>
          </button>
        );
      })}
    </div>
  );
};
