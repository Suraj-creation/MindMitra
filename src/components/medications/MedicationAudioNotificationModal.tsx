import React, { useEffect, useState } from "react";
import { Volume2, VolumeX, CheckCircle2, Clock, X, Heart, ShieldCheck } from "lucide-react";
import { MedicationReminder } from "../../domain/medication";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";

interface Props {
  medication: MedicationReminder;
  language?: "as" | "en";
  onClose: () => void;
  onMarkTaken: (id: string) => void;
}

export const MedicationAudioNotificationModal: React.FC<Props> = ({
  medication,
  language = "as",
  onClose,
  onMarkTaken,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const playVoiceNotification = () => {
    // 1. Play peaceful 3-tone singing bowl chime
    ambientAudio.playMedicationChime();
    setIsPlayingAudio(true);

    // 2. Small 800ms offset so chime resonates peacefully before speech
    setTimeout(() => {
      const speechText =
        language === "as"
          ? medication.audioNotificationTextAs || medication.audioNotificationText
          : medication.audioNotificationText;

      speakWarmly(speechText, {
        lang: language === "as" ? "as-IN" : "en-IN",
        rate: 0.86, // dignified and slow
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }, 850);
  };

  useEffect(() => {
    playVoiceNotification();

    return () => {
      cancelEmpathicSpeech();
    };
  }, [medication.id]);

  const handleTaken = () => {
    cancelEmpathicSpeech();
    onMarkTaken(medication.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medication-alert-title"
        className="bg-[#fef9f0] border-2 border-[#1a3826] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn"
      >
        {/* Calming Top Accent Banner */}
        <div className="bg-[#1a3826] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-[#c8ebd1]">
              <Volume2 size={20} className={isPlayingAudio ? "animate-pulse" : ""} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#adcfb5] font-bold">
                Medication Reminder · ঔষধৰ সোঁৱৰণী
              </span>
              <h3 id="medication-alert-title" className="text-lg font-serif font-bold text-white">
                {language === "as" ? "শান্তিপূৰ্ণ সোঁৱৰণী" : "Gentle Reminder for You"}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              cancelEmpathicSpeech();
              onClose();
            }}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Audio Visualizer & Playing Indicator */}
          <div className="bg-[#f0e8db] border border-[#dfd4c0] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1 h-5">
                <span className={`w-1.5 bg-[#1a3826] rounded-full ${isPlayingAudio ? "h-5 animate-pulse" : "h-2"}`} />
                <span className={`w-1.5 bg-[#1a3826] rounded-full ${isPlayingAudio ? "h-3.5 animate-pulse delay-100" : "h-2"}`} />
                <span className={`w-1.5 bg-[#1a3826] rounded-full ${isPlayingAudio ? "h-4 animate-pulse delay-200" : "h-2"}`} />
                <span className={`w-1.5 bg-[#1a3826] rounded-full ${isPlayingAudio ? "h-2 animate-pulse delay-75" : "h-1.5"}`} />
              </div>
              <span className="text-xs font-serif text-[#453d33]">
                {isPlayingAudio
                  ? language === "as"
                    ? "অনুৰ কণ্ঠত কোৱা হৈছে..."
                    : "Speaking softly in room..."
                  : language === "as"
                  ? "বাৰ্তা সমাপ্ত হৈছে"
                  : "Audio chime played"}
              </span>
            </div>

            <button
              type="button"
              onClick={playVoiceNotification}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#c2c8c1] text-[#1a3826] text-xs font-semibold hover:bg-[#faf6f0] flex items-center gap-1.5 transition shadow-2xs"
            >
              <Volume2 size={14} />
              <span>{language === "as" ? "পুনৰ শুনক" : "Listen Again"}</span>
            </button>
          </div>

          {/* Medicine Details Card */}
          <div className="bg-white border-2 border-[#dfd4c0] rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-[#ffdcc3] text-[#904d00] text-xs font-bold px-3 py-1 rounded-full">
                <Clock size={13} />
                <span>{medication.scheduleTime}</span>
              </span>
              <span className="text-xs font-medium text-[#736a5e] bg-[#f8f3ea] px-2.5 py-1 rounded-md border border-[#dfd4c0]">
                Caregiver: {medication.caregiverName}
              </span>
            </div>

            <div>
              <h4 className="text-2xl font-serif font-bold text-[#1d1c16]">
                {medication.medicineName}
              </h4>
              <p className="text-sm font-serif text-[#736a5e] mt-0.5">
                {medication.assameseName}
              </p>
            </div>

            {/* Dosage Badge */}
            <div className="bg-[#eaf0e4] border border-[#bdd4b0] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#2c401e] font-bold">
                  Prescribed Dosage · নিৰ্দিষ্ট মাত্ৰা
                </span>
                <p className="text-base font-bold text-[#1a3826] mt-0.5">
                  {medication.dosage}
                </p>
              </div>
              <span className="w-7 h-7 rounded-full bg-white border-2 border-[#1a3826] flex items-center justify-center text-xs font-bold text-[#1a3826]">
                Rx
              </span>
            </div>

            {/* Instructions */}
            <div className="pt-2 text-xs text-[#595043] leading-relaxed border-t border-[#f0e8db]">
              <p className="font-semibold text-[#1d1c16] mb-0.5">
                {language === "as" ? "সেৱনৰ নিয়ম:" : "Instructions:"}
              </p>
              <p>{language === "as" ? medication.assameseInstructions : medication.instructions}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleTaken}
              className="w-full py-3.5 rounded-2xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-md"
            >
              <CheckCircle2 size={20} />
              <span>{language === "as" ? "মই ঔষধ খালোঁ (Mark as Taken)" : "I Have Taken the Dose"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                cancelEmpathicSpeech();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#f0e8db] text-[#595043] font-medium text-xs sm:text-sm transition"
            >
              <span>{language === "as" ? "১০ মিনিট পিছত সোঁৱৰাব (Remind Later)" : "Remind Me in 10 Minutes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
