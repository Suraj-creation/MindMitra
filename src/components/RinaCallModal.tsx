import React, { useState } from "react";
import { X, Phone, PhoneCall, Volume2, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { speakWarmly, cancelEmpathicSpeech } from "../lib/empathic-speech";

interface Props {
  onClose: () => void;
}

export const RinaCallModal: React.FC<Props> = ({ onClose }) => {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">("idle");
  const [isPlayingVoiceNote, setIsPlayingVoiceNote] = useState(false);

  const startCall = () => {
    setCallState("ringing");
    speakWarmly("Connecting to Rina in Guwahati. Ringing now...", {
      onEnd: () => {
        setTimeout(() => {
          setCallState("connected");
          speakWarmly("Aita! Namaskar! How is your morning in Tezpur? I am so happy to hear your voice.", {
            rate: 0.9,
            pitch: 1.1,
          });
        }, 1200);
      },
    });
  };

  const endCall = () => {
    cancelEmpathicSpeech();
    setCallState("idle");
  };

  const playVoiceNote = () => {
    if (isPlayingVoiceNote) {
      cancelEmpathicSpeech();
      setIsPlayingVoiceNote(false);
      return;
    }
    setIsPlayingVoiceNote(true);
    speakWarmly(
      "Aita, Anu told me you enjoyed your morning tea on the verandah today! I'm calling you this afternoon at five sharp with pictures from Guwahati.",
      {
        rate: 0.92,
        pitch: 1.1,
        onEnd: () => setIsPlayingVoiceNote(false),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rina-modal-title"
        className="bg-[#fef9f0] border border-[#c2c8c1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#f8f3ea] border-b border-[#e7e2d9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a3826]" />
            <h2 id="rina-modal-title" className="text-lg font-serif font-bold text-[#1d1c16]">
              Granddaughter Rina (নাতিনী ৰীনা)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              endCall();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#ece8df] hover:bg-[#e7e2d9] text-[#1d1c16] flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-[#1a3826]/20 shadow-md">
            <img
              src="/assets/images/rina_granddaughter_portrait_1789020459100.jpg"
              alt="Granddaughter Rina"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to Google cloud storage or placeholder
                (e.target as HTMLImageElement).src =
                  "https://storage.googleapis.com/maker-suite-media-prod/applets/8c098952-596c-4e02-bb5c-f895cfa0cb6e/rina_granddaughter_portrait_1789020459100.jpg";
              }}
            />
            {callState === "connected" && (
              <span className="absolute bottom-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
              Guwahati, Assam · Dialing 5:00 PM
            </p>
            <h3 className="text-2xl font-serif font-bold text-[#1d1c16] mt-0.5">
              Rina Borah
            </h3>
            <p className="text-xs text-[#424843] max-w-sm mx-auto mt-1 leading-relaxed">
              Your elder granddaughter working in Guwahati. She calls every afternoon to tell stories about her university classes and hear your blessings.
            </p>
          </div>

          {callState === "idle" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={startCall}
                  className="px-6 py-3 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <PhoneCall size={18} />
                  <span>Call Rina in Guwahati Now</span>
                </button>

                <button
                  type="button"
                  onClick={playVoiceNote}
                  className={`px-5 py-3 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                    isPlayingVoiceNote
                      ? "bg-[#ffdcc3] border-[#fe932c] text-[#904d00]"
                      : "bg-[#f8f3ea] border-[#c2c8c1] text-[#1d1c16] hover:bg-[#ece8df]"
                  }`}
                >
                  <Volume2 size={18} />
                  <span>{isPlayingVoiceNote ? "Playing Audio Note..." : "Hear Rina’s Greeting"}</span>
                </button>
              </div>

              <div className="p-3 bg-[#eaf0e4] border border-[#bdd4b0] rounded-2xl text-xs text-[#2c401e] flex items-center justify-center gap-2">
                <Heart size={14} className="text-[#1a3826] fill-[#1a3826]/20" />
                <span>Rina’s scheduled call is at 5:00 PM today.</span>
              </div>
            </div>
          )}

          {callState === "ringing" && (
            <div className="p-6 bg-[#f8f3ea] rounded-2xl border border-[#e7e2d9] space-y-3">
              <div className="flex items-center justify-center gap-2 text-[#904d00] font-semibold text-sm animate-pulse">
                <Phone size={18} />
                <span>Ringing Guwahati line...</span>
              </div>
              <p className="text-xs text-[#424843]">
                Connecting to Rina’s phone in Ulubari, Guwahati.
              </p>
              <button
                type="button"
                onClick={endCall}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold"
              >
                Cancel Call
              </button>
            </div>
          )}

          {callState === "connected" && (
            <div className="p-5 bg-[#eaf0e4] rounded-2xl border border-[#bdd4b0] space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#1a3826] font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Connected • Voice Active</span>
              </div>
              <p className="text-sm font-serif italic text-[#1d1c16] bg-white/70 p-3 rounded-xl border border-[#c2c8c1]/40">
                “Aita! Namaskar! How is your morning in Tezpur? I am so happy to hear your voice!”
              </p>
              <button
                type="button"
                onClick={endCall}
                className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
              >
                End Call
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
