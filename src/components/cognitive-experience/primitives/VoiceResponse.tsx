import React, { useState, useEffect } from "react";

interface Props {
  promptText?: string;
  onVoiceCaptured?: (transcript: string, durationSec: number) => void;
  onSkip?: () => void;
}

export const VoiceResponse: React.FC<Props> = ({
  promptText = "Speak your thoughts or memory in your own words...",
  onVoiceCaptured,
  onSkip,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [recordedAudio, setRecordedAudio] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordedAudio(true);
      if (onVoiceCaptured) {
        onVoiceCaptured("Captured spoken reflection", elapsedSec);
      }
    } else {
      setElapsedSec(0);
      setRecordedAudio(false);
      setIsRecording(true);
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    setRecordedAudio(false);
    setElapsedSec(0);
  };

  return (
    <div className="bg-white border-2 border-[#dfd4c0] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm text-center">
      <div className="space-y-1">
        <h4 className="font-serif text-lg font-medium text-[#2c2824]">
          Spoken Reminiscence
        </h4>
        <p className="text-xs text-[#595043] max-w-md mx-auto">
          {promptText}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-md transition transform active:scale-95 ${
            isRecording
              ? "bg-[#c62828] text-white animate-pulse ring-8 ring-[#c62828]/20"
              : recordedAudio
              ? "bg-[#485935] text-white"
              : "bg-[#f5ede0] hover:bg-[#ede3d2] text-[#485935] border-2 border-[#d6cbba]"
          }`}
          style={{ minHeight: "80px", minWidth: "80px" }}
          title={isRecording ? "Tap to finish speaking" : "Tap to speak"}
        >
          {isRecording ? "⏹" : recordedAudio ? "✓" : "🎙️"}
        </button>

        <div className="text-xs font-medium text-[#41382c]">
          {isRecording ? (
            <span className="text-[#c62828] font-semibold flex items-center gap-1.5 justify-center">
              <span className="w-2 h-2 rounded-full bg-[#c62828] animate-ping"></span>
              Listening softly... ({elapsedSec}s)
            </span>
          ) : recordedAudio ? (
            <span className="text-[#485935] font-semibold">
              ✓ Reflection recorded warmly ({elapsedSec}s)
            </span>
          ) : (
            <span className="text-[#736a5e]">Tap microphone when you are ready to speak</span>
          )}
        </div>
      </div>

      {recordedAudio && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-[#faf6f0] px-3.5 py-2 rounded-xl transition"
          >
            ↺ Speak Again
          </button>
          <button
            type="button"
            onClick={() => onVoiceCaptured && onVoiceCaptured("Captured spoken reflection", elapsedSec)}
            className="text-xs bg-[#485935] hover:bg-[#39472a] text-white font-medium px-4 py-2 rounded-xl transition shadow-xs"
          >
            Save Memory Voice
          </button>
        </div>
      )}

      {onSkip && !recordedAudio && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-[#8c8273] hover:text-[#595043] underline underline-offset-2"
          >
            Continue with gentle tap instead
          </button>
        </div>
      )}
    </div>
  );
};
