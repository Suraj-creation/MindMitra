import React, { useState } from "react";

interface Props {
  onContinue: () => void;
  onSkip?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  continueLabel?: string;
  skipLabel?: string;
  showSkip?: boolean;
  disabledContinue?: boolean;
}

export const NavigationControls: React.FC<Props> = ({
  onContinue,
  onSkip,
  onPause,
  onResume,
  continueLabel = "Continue Journey →",
  skipLabel = "Save for later / Continue",
  showSkip = true,
  disabledContinue = false,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const handlePause = () => {
    setIsPaused(true);
    if (onPause) onPause();
  };

  const handleResume = () => {
    setIsPaused(false);
    if (onResume) onResume();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#dfd4c0] w-full">
        {/* Left: Pause / Gentle Rest */}
        <button
          type="button"
          onClick={handlePause}
          className="text-xs text-[#736a5e] hover:text-[#2c2824] bg-white border border-[#d6cbba] hover:bg-[#faf6f0] px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
          title="Pause activity to rest or have tea"
        >
          <span>☕</span>
          <span>Take a Gentle Rest</span>
        </button>

        {/* Right: Skip and Continue */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {showSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[#736a5e] hover:text-[#41382c] px-3 py-2 rounded-xl transition underline underline-offset-2"
            >
              {skipLabel}
            </button>
          )}

          <button
            type="button"
            disabled={disabledContinue}
            onClick={onContinue}
            className={`min-h-[48px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 ${
              disabledContinue
                ? "bg-[#d6cbba] text-white cursor-not-allowed"
                : "bg-[#485935] hover:bg-[#39472a] text-white active:scale-98"
            }`}
            style={{ minHeight: "48px" }}
          >
            <span>{continueLabel}</span>
          </button>
        </div>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf7ee] border-2 border-[#d6cbba] w-full max-w-md rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fade-in text-[#2c2824]">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#edf4ea] text-[#485935] flex items-center justify-center text-2xl border border-[#bdd4b0]">
              🍵
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-medium">Resting Softly</h3>
              <p className="text-xs text-[#595043] max-w-sm mx-auto leading-relaxed">
                Take your time to sip your tea, look out at the courtyard, or rest your eyes. You can resume your journey whenever you are ready.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResume}
                className="bg-[#485935] hover:bg-[#39472a] text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl transition shadow-sm w-full"
                style={{ minHeight: "48px" }}
              >
                ▶ Resume Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
