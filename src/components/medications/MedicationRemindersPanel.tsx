import React, { useState } from "react";
import {
  Clock,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Edit2,
  Sparkles,
  CalendarCheck,
  Coffee,
  Sun,
  Flame,
  Utensils,
  VolumeX,
} from "lucide-react";
import { MedicationReminder, MedicationDoseInput } from "../../domain/medication";
import { CaregiverDosageModal } from "./CaregiverDosageModal";
import { MedicationAudioNotificationModal } from "./MedicationAudioNotificationModal";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";

interface Props {
  medications: MedicationReminder[];
  language?: "as" | "en";
  routineCompleted?: Record<string, boolean>;
  onMarkTaken: (id: string) => void;
  onAddMedication: (input: MedicationDoseInput) => void;
  onUpdateMedication: (id: string, updates: Partial<MedicationReminder>) => void;
  onDeleteMedication: (id: string) => void;
  onOpenFullSchedule?: () => void;
}

export const MedicationRemindersPanel: React.FC<Props> = ({
  medications,
  language = "as",
  routineCompleted = {},
  onMarkTaken,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onOpenFullSchedule,
}) => {
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [activeNotificationMed, setActiveNotificationMed] = useState<MedicationReminder | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Identify next due medication
  const pendingMeds = medications.filter((m) => m.status === "pending");
  const nextDueMed = pendingMeds[0] || medications[0];

  const handlePlayAudioNotification = (med: MedicationReminder) => {
    setActiveNotificationMed(med);
  };

  const handleInlineAudioTrigger = (med: MedicationReminder) => {
    ambientAudio.playMedicationChime();
    setPlayingAudioId(med.id);

    setTimeout(() => {
      const text =
        language === "as"
          ? med.audioNotificationTextAs || med.audioNotificationText
          : med.audioNotificationText;

      speakWarmly(text, {
        lang: language === "as" ? "as-IN" : "en-IN",
        rate: 0.86,
        onEnd: () => setPlayingAudioId(null),
        onError: () => setPlayingAudioId(null),
      });
    }, 850);
  };

  return (
    <section className="bg-[#fef9f0] border-2 border-[#dfd4c0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:border-[#1a3826]/40 transition">
      {/* ── MODALS ── */}
      {showCaregiverModal && (
        <CaregiverDosageModal
          medications={medications}
          onClose={() => setShowCaregiverModal(false)}
          onAddMedication={onAddMedication}
          onUpdateMedication={onUpdateMedication}
          onDeleteMedication={onDeleteMedication}
        />
      )}

      {activeNotificationMed && (
        <MedicationAudioNotificationModal
          medication={activeNotificationMed}
          language={language}
          onClose={() => setActiveNotificationMed(null)}
          onMarkTaken={(id) => {
            onMarkTaken(id);
            setActiveNotificationMed(null);
          }}
        />
      )}

      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#dfd4c0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a3826] bg-[#eaf0e4] px-2.5 py-0.5 rounded-full">
              স্বাস্থ্য আৰু ঔষধ · MEDICATION CARE
            </span>
            <span className="text-xs text-[#736a5e] hidden sm:inline">
              Syncs with Daily Schedule
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d1c16] mt-1.5">
            Medication Reminders <span className="text-sm font-normal text-[#736a5e]">(ঔষধৰ সময়সূচী)</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#424843] mt-0.5">
            Carefully paced with your meals, tea, and prayers. Anu oversees all doses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Caregiver Dosage Management Button */}
          <button
            type="button"
            onClick={() => setShowCaregiverModal(true)}
            className="px-4 py-2.5 bg-white border border-[#c2c8c1] text-[#1a3826] hover:bg-[#faf6f0] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
          >
            <ShieldCheck size={16} className="text-[#1a3826]" />
            <span>Caregiver Dosage Settings</span>
          </button>

          {/* Audio Notification Trigger */}
          {nextDueMed && (
            <button
              type="button"
              onClick={() => handlePlayAudioNotification(nextDueMed)}
              className="px-4 py-2.5 bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Volume2 size={16} />
              <span>
                {language === "as" ? "ধ্বনি সোঁৱৰণী শুনক" : "Play Audio Reminder"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── SCHEDULE SYNC BANNER ── */}
      <div className="bg-[#f0e8db] border border-[#dfd4c0] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1a3826] text-white flex items-center justify-center shrink-0">
            <CalendarCheck size={16} />
          </div>
          <div>
            <span className="font-bold text-[#1a3826]">
              {language === "as"
                ? "দিনলিপিৰ সৈতে স্বয়ংক্ৰিয় সংগতি (Schedule-Synced):"
                : "Synchronized with Today's Routine:"}
            </span>
            <span className="text-[#595043] ml-1.5">
              Doses anchor to breakfast (08:30 AM), lunch (01:00 PM), and evening prayer (07:30 PM).
            </span>
          </div>
        </div>

        {onOpenFullSchedule && (
          <button
            type="button"
            onClick={onOpenFullSchedule}
            className="text-xs font-semibold text-[#1a3826] underline hover:text-[#2d5a3f] shrink-0"
          >
            View Full Schedule →
          </button>
        )}
      </div>

      {/* ── MEDICATION REMINDERS LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {medications.map((med) => {
          const isTaken = med.status === "taken";
          const isPlayingThis = playingAudioId === med.id;

          // Color theme helpers
          const badgeBg =
            med.schedulePeriod === "morning"
              ? "bg-[#ffdcc3] text-[#904d00]"
              : med.schedulePeriod === "afternoon"
              ? "bg-[#e0f2fe] text-[#0369a1]"
              : "bg-[#fef08a] text-[#854d0e]";

          return (
            <div
              key={med.id}
              className={`bg-white border-2 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs transition duration-200 ${
                isTaken
                  ? "border-[#bdd4b0] bg-[#fdfefc]"
                  : "border-[#dfd4c0] hover:border-[#1a3826]/50"
              }`}
            >
              <div className="space-y-3">
                {/* Time & Period Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg ${badgeBg}`}>
                    {med.scheduleTime}
                  </span>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isTaken
                        ? "bg-[#eaf0e4] text-[#2c401e]"
                        : "bg-[#fef3c7] text-[#b45309]"
                    }`}
                  >
                    {isTaken ? "Completed Today" : "Scheduled / Due"}
                  </span>
                </div>

                {/* Medicine Title & Regional Label */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1d1c16]">
                    {med.medicineName}
                  </h3>
                  <p className="text-xs font-serif text-[#736a5e] mt-0.5">
                    {med.assameseName}
                  </p>
                </div>

                {/* Specific Dosage Box */}
                <div className="bg-[#f8f3ea] border border-[#dfd4c0] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#736a5e] tracking-wider">
                      Specific Dosage (মাত্ৰা)
                    </span>
                    <p className="text-sm font-bold text-[#1a3826] mt-0.5">
                      {med.dosage}
                    </p>
                  </div>
                  <span className="text-xs text-[#736a5e] font-serif">
                    {med.pillShape}
                  </span>
                </div>

                {/* Instructions */}
                <p className="text-xs text-[#595043] leading-relaxed">
                  {language === "as" ? med.assameseInstructions : med.instructions}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#f0e8db] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {/* Audio Notification Trigger */}
                  <button
                    type="button"
                    onClick={() => handlePlayAudioNotification(med)}
                    className="text-xs font-semibold text-[#1a3826] hover:text-[#2d5a3f] flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-[#faf6f0] transition"
                  >
                    <Volume2 size={16} className={isPlayingThis ? "animate-pulse text-[#fe932c]" : ""} />
                    <span>{language === "as" ? "শব্দ শুনক" : "Audio Alert"}</span>
                  </button>

                  {/* Mark Taken Button */}
                  <button
                    type="button"
                    onClick={() => onMarkTaken(med.id)}
                    className={`text-xs font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition ${
                      isTaken
                        ? "bg-[#eaf0e4] text-[#2c401e] hover:bg-[#d8e4cf]"
                        : "bg-[#1a3826] text-white hover:bg-[#2d5a3f]"
                    }`}
                  >
                    <CheckCircle2 size={16} className={isTaken ? "text-[#1a3826]" : "text-white"} />
                    <span>{isTaken ? "Taken" : "Mark Taken"}</span>
                  </button>
                </div>

                {med.verifiedBy && isTaken && (
                  <p className="text-[10px] text-[#736a5e] text-right">
                    Verified by {med.verifiedBy}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
