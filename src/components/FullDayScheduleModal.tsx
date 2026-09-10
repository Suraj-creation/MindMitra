import React from "react";
import { X, Clock, Sun, Coffee, Trees, Utensils, Phone, Flame, Moon, CheckCircle2, Volume2, Pill } from "lucide-react";
import { MedicationReminder } from "../domain/medication";

interface Props {
  onClose: () => void;
  routineCompleted: Record<string, boolean>;
  onToggleRoutine: (key: string) => void;
  medications?: MedicationReminder[];
  onPlayMedicationAudio?: (med: MedicationReminder) => void;
  onToggleMedicationTaken?: (id: string) => void;
}

export const FullDayScheduleModal: React.FC<Props> = ({
  onClose,
  routineCompleted,
  onToggleRoutine,
  medications = [],
  onPlayMedicationAudio,
  onToggleMedicationTaken,
}) => {
  const scheduleItems = [
    {
      key: "morning_stroll",
      time: "07:00 AM",
      title: "Morning Courtyard Walk (ৰাতিপুৱাৰ খোজ)",
      desc: "Gentle walk along the marigold and tulsi beds under the soft Tezpur morning sun.",
      icon: Trees,
      color: "bg-[#e5ece0] text-[#1a3826]",
    },
    {
      key: "tea",
      time: "07:30 AM",
      title: "Morning Cardamom Tea (ইলাচী চাহ)",
      desc: "Freshly brewed warm tea on the veranda with daughter Anu.",
      icon: Coffee,
      color: "bg-[#ffdcc3] text-[#904d00]",
    },
    {
      key: "breakfast",
      time: "08:30 AM",
      title: "Fresh Rice Pitha & Fruit (জলপান)",
      desc: "Warm homemade pitha and sweet seasonal bananas prepared lovingly.",
      icon: Sun,
      color: "bg-[#fef3c7] text-[#b45309]",
    },
    {
      key: "lunch",
      time: "01:00 PM",
      title: "Restful Lunch & Herb Khichdi (দুপৰীয়াৰ আহাৰ)",
      desc: "Light khichdi with garden vegetables, followed by a quiet afternoon rest.",
      icon: Utensils,
      color: "bg-[#e0f2fe] text-[#0369a1]",
    },
    {
      key: "afternoon_tea",
      time: "04:00 PM",
      title: "Cardamom Tea with Anu (অপৰাহ্নৰ চাহ)",
      desc: "Warm ginger-elaichi tea & homemade fresh rice pitha on the back veranda.",
      icon: Coffee,
      color: "bg-[#ffdcc3] text-[#904d00]",
    },
    {
      key: "rina_call",
      time: "05:00 PM",
      title: "Rina calls from Guwahati (ৰীনাৰ ফোন)",
      desc: "Granddaughter Rina dials in to share stories and bring warmth to the evening.",
      icon: Phone,
      color: "bg-[#f3e8ff] text-[#7e22ce]",
    },
    {
      key: "prayer",
      time: "07:30 PM",
      title: "Evening Prayer & Gosai-Ghar Diya (নাম-প্ৰাৰ্থনা)",
      desc: "Earthen oil lamp lighting at the Gosai-Ghar, soft flute melodies, and dinner.",
      icon: Flame,
      color: "bg-[#fef08a] text-[#854d0e]",
    },
    {
      key: "night_rest",
      time: "09:30 PM",
      title: "Warm Milk & Night Sanctuary (নিশাৰ বিশ্ৰাম)",
      desc: "A soothing cup of warm milk with nutmeg, tucked into warm quilts.",
      icon: Moon,
      color: "bg-[#f1f5f9] text-[#475569]",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
        className="bg-[#fef9f0] border border-[#c2c8c1] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#f8f3ea] border-b border-[#e7e2d9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a3826] text-white flex items-center justify-center shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <h2 id="schedule-modal-title" className="text-xl font-serif font-bold text-[#1d1c16]">
                Today’s Gentle Harmony (আজিৰ দিনলিপি)
              </h2>
              <p className="text-xs text-[#424843]">
                Tezpur Sanctuary · A slow, unhurried schedule paced for peace and comfort
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#ece8df] hover:bg-[#e7e2d9] text-[#1d1c16] flex items-center justify-center transition"
            aria-label="Close schedule"
          >
            <X size={18} />
          </button>
        </div>

        {/* Schedule List */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-[#ece8df]/60">
          {scheduleItems.map((item) => {
            const Icon = item.icon;
            const isDone = Boolean(routineCompleted[item.key]);

            const matchingMeds = medications.filter(
              (m) => m.associatedRoutineKey === item.key
            );

            return (
              <div
                key={item.key}
                className="pt-3.5 first:pt-0 space-y-2.5"
              >
                <div
                  onClick={() => onToggleRoutine(item.key)}
                  className="flex items-start justify-between gap-4 cursor-pointer group hover:bg-[#f8f3ea]/60 p-2 rounded-2xl transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#904d00] bg-[#ffdcc3]/60 px-2 py-0.5 rounded-md">
                          {item.time}
                        </span>
                        <h3 className={`font-serif font-semibold text-base text-[#1d1c16] ${isDone ? "line-through opacity-60" : ""}`}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#424843] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <CheckCircle2
                      size={24}
                      className={isDone ? "text-[#1a3826] fill-[#1a3826]/20" : "text-[#c2c8c1] group-hover:text-[#727972]"}
                    />
                  </div>
                </div>

                {/* Synced Medication Reminders for this routine slot */}
                {matchingMeds.length > 0 && (
                  <div className="ml-14 space-y-2">
                    {matchingMeds.map((med) => {
                      const isMedTaken = med.status === "taken";
                      return (
                        <div
                          key={med.id}
                          className="bg-[#f0e8db] border border-[#dfd4c0] rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-xl bg-[#1a3826] text-white flex items-center justify-center shrink-0">
                              <Pill size={14} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#1a3826]">
                                  {med.medicineName}
                                </span>
                                <span className="bg-[#eaf0e4] text-[#2c401e] font-semibold px-2 py-0.5 rounded text-[10px]">
                                  Dose: {med.dosage}
                                </span>
                              </div>
                              <p className="text-[#595043] text-[11px] mt-0.5">
                                {med.assameseName} • {med.scheduleTime}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {onPlayMedicationAudio && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayMedicationAudio(med);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-[#c2c8c1] text-[#1a3826] font-medium text-[11px] hover:bg-[#f8f3ea] flex items-center gap-1 transition"
                              >
                                <Volume2 size={13} />
                                <span>Audio</span>
                              </button>
                            )}

                            {onToggleMedicationTaken && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleMedicationTaken(med.id);
                                }}
                                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center gap-1 transition ${
                                  isMedTaken
                                    ? "bg-[#eaf0e4] text-[#2c401e]"
                                    : "bg-[#1a3826] text-white hover:bg-[#2d5a3f]"
                                }`}
                              >
                                <CheckCircle2 size={13} />
                                <span>{isMedTaken ? "Taken" : "Mark Dose"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f8f3ea] border-t border-[#e7e2d9] flex items-center justify-between text-xs text-[#424843]">
          <span>Tap any item to mark as experienced or complete.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1a3826] text-white font-medium hover:bg-[#2d5a3f] transition shadow-xs"
          >
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
