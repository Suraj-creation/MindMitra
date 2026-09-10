import React from "react";
import { CompletionConfiguration } from "../../../intelligence/specifications/types";

interface SuccessProps {
  completion: CompletionConfiguration;
  onExit: () => void;
  bilingual?: boolean;
}

export const GentleSuccessCelebration: React.FC<SuccessProps> = ({
  completion,
  onExit,
  bilingual = true,
}) => {
  return (
    <div className="bg-white border-2 border-[#bdd4b0] rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-md animate-fade-in max-w-xl mx-auto">
      <div className="w-16 h-16 mx-auto rounded-full bg-[#edf4ea] text-[#485935] flex items-center justify-center text-3xl border-2 border-[#bdd4b0]">
        🌸
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-medium text-[#2c401e]">
          {completion.celebration_title}
        </h3>
        <p className="text-xs sm:text-sm text-[#41382c] leading-relaxed max-w-md mx-auto">
          {completion.celebration_message}
        </p>
        {bilingual && completion.assamese_celebration_message && (
          <p className="text-xs text-[#595043] font-serif italic max-w-md mx-auto pt-1">
            "{completion.assamese_celebration_message}"
          </p>
        )}
      </div>

      <div className="bg-[#faf6f0] border border-[#dfd4c0] rounded-2xl p-4 text-xs text-[#595043] leading-relaxed">
        <span className="font-medium text-[#41382c] block mb-1">
          {completion.summary_reminiscence_prompt}
        </span>
        <span className="text-[11px] text-[#736a5e]">
          {completion.graceful_exit_text}
        </span>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onExit}
          className="bg-[#485935] hover:bg-[#39472a] text-white text-xs sm:text-sm font-semibold px-8 py-3 rounded-xl transition shadow-sm w-full sm:w-auto"
          style={{ minHeight: "48px" }}
        >
          ✓ Gracefully Return to Space
        </button>
      </div>
    </div>
  );
};

interface RetryProps {
  message: string;
  onRetry: () => void;
  onOpenHint?: () => void;
}

export const GentleRetryMessage: React.FC<RetryProps> = ({
  message,
  onRetry,
  onOpenHint,
}) => {
  return (
    <div className="bg-[#fcf8f0] border border-[#e5dac6] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#595043] animate-fade-in shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">🌿</span>
        <div>
          <span className="font-semibold text-[#41382c]">Every thought is welcome:</span>
          <p className="text-[#595043] mt-0.5">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {onOpenHint && (
          <button
            type="button"
            onClick={onOpenHint}
            className="text-xs text-[#485935] hover:text-[#334224] bg-white border border-[#bdd4b0] px-3 py-1.5 rounded-lg transition"
          >
            🌸 View Hint
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="text-xs bg-[#485935] text-white px-3.5 py-1.5 rounded-lg font-medium hover:bg-[#39472a] transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
