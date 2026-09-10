import React, { useState } from "react";
import { ambientAudio } from "../../../lib/ambient-audio";

interface Props {
  soundType?: "courtyard" | "flute" | "tanpura" | "river" | string;
  label?: string;
  voiceNote?: {
    speakerName: string;
    relationship: string;
    transcript: string;
    audioUrl?: string;
  };
}

export const AudioPlayback: React.FC<Props> = ({
  soundType = "flute",
  label = "Brahmaputra Gentle Flute",
  voiceNote,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  const togglePlayback = () => {
    if (isPlaying) {
      ambientAudio.stop();
      setIsPlaying(false);
    } else {
      if (soundType === "courtyard") ambientAudio.playCourtyardSounds();
      else if (soundType === "tanpura") ambientAudio.playTanpuraDrone();
      else ambientAudio.playFolkFlute();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-[#faf6f0] border border-[#dfd4c0] rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm transition active:scale-95 ${
              isPlaying
                ? "bg-[#485935] text-white animate-pulse"
                : "bg-white border border-[#d6cbba] text-[#485935] hover:bg-[#edf4ea]"
            }`}
            title={isPlaying ? "Pause soothing sound" : "Play soothing sound"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <div>
            <div className="text-xs font-semibold text-[#2c2824] flex items-center gap-1.5">
              <span>🎵</span>
              <span>{label}</span>
            </div>
            <div className="text-[11px] text-[#736a5e] mt-0.5">
              {isPlaying ? "Softly playing ambient acoustic soundscape" : "Tap to listen to soothing cultural melody"}
            </div>
          </div>
        </div>

        {voiceNote && (
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-[#485935] hover:text-[#334224] underline underline-offset-2 font-medium"
          >
            {showTranscript ? "Hide Words" : "Show Words"}
          </button>
        )}
      </div>

      {/* Voice Note & Transcript */}
      {voiceNote && (
        <div className="pt-2 border-t border-[#e5dac6] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#334224]">
            <span>🗣️</span>
            <span>
              {voiceNote.speakerName} ({voiceNote.relationship})
            </span>
          </div>
          {showTranscript && (
            <p className="text-[#595043] italic bg-white p-3 rounded-xl border border-[#dfd4c0] mt-1">
              "{voiceNote.transcript}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
