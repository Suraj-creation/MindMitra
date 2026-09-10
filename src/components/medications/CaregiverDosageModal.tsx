import React, { useState } from "react";
import { X, Plus, Trash2, Edit3, Volume2, ShieldCheck, Check, Clock, Sparkles } from "lucide-react";
import { MedicationReminder, MedicationDoseInput, PillShape, SchedulePeriod } from "../../domain/medication";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly, cancelEmpathicSpeech } from "../../lib/empathic-speech";

interface Props {
  medications: MedicationReminder[];
  onClose: () => void;
  onAddMedication: (input: MedicationDoseInput) => void;
  onUpdateMedication: (id: string, updates: Partial<MedicationReminder>) => void;
  onDeleteMedication: (id: string) => void;
}

export const CaregiverDosageModal: React.FC<Props> = ({
  medications,
  onClose,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [medicineName, setMedicineName] = useState("");
  const [assameseName, setAssameseName] = useState("");
  const [dosage, setDosage] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00 AM");
  const [schedulePeriod, setSchedulePeriod] = useState<SchedulePeriod>("morning");
  const [associatedRoutineKey, setAssociatedRoutineKey] = useState("breakfast");
  const [instructions, setInstructions] = useState("");
  const [assameseInstructions, setAssameseInstructions] = useState("");
  const [caregiverName, setCaregiverName] = useState("Anu (Daughter)");
  const [color, setColor] = useState("emerald");
  const [pillShape, setPillShape] = useState<PillShape>("round");

  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setMedicineName("");
    setAssameseName("");
    setDosage("");
    setScheduleTime("09:00 AM");
    setSchedulePeriod("morning");
    setAssociatedRoutineKey("breakfast");
    setInstructions("");
    setAssameseInstructions("");
    setCaregiverName("Anu (Daughter)");
    setColor("emerald");
    setPillShape("round");
    setEditingId(null);
  };

  const handleStartEdit = (med: MedicationReminder) => {
    setEditingId(med.id);
    setMedicineName(med.medicineName);
    setAssameseName(med.assameseName);
    setDosage(med.dosage);
    setScheduleTime(med.scheduleTime);
    setSchedulePeriod(med.schedulePeriod);
    setAssociatedRoutineKey(med.associatedRoutineKey || "breakfast");
    setInstructions(med.instructions);
    setAssameseInstructions(med.assameseInstructions);
    setCaregiverName(med.caregiverName);
    setColor(med.color);
    setPillShape(med.pillShape);
    setActiveTab("edit");
  };

  const handleTestAudio = () => {
    const medText = medicineName || "Daily Medicine";
    const doseText = dosage || "prescribed dosage";
    const testTextAs = `নমস্কাৰ পূৰ্ণিমা বাইদেউ। ${medText} ৰ ${doseText} খোৱাৰ সময় হৈছে। অনুৱে এগিলাচ পানী সাজু কৰি থৈছে।`;

    ambientAudio.playMedicationChime();
    setTestAudioPlaying(true);

    setTimeout(() => {
      speakWarmly(testTextAs, {
        lang: "as-IN",
        rate: 0.86,
        onEnd: () => setTestAudioPlaying(false),
        onError: () => setTestAudioPlaying(false),
      });
    }, 850);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim() || !dosage.trim()) {
      return;
    }

    if (activeTab === "edit" && editingId) {
      onUpdateMedication(editingId, {
        medicineName,
        assameseName: assameseName.trim() || medicineName,
        dosage,
        scheduleTime,
        schedulePeriod,
        associatedRoutineKey,
        instructions: instructions || "Take with water under caregiver supervision.",
        assameseInstructions: assameseInstructions || "কুহুমীয়া পানীৰে অনুৰ উপস্থিতিত খাওক।",
        caregiverName,
        color,
        pillShape,
      });
      setSaveSuccessMsg(`Updated dosage for ${medicineName}.`);
    } else {
      onAddMedication({
        medicineName,
        assameseName: assameseName.trim() || medicineName,
        dosage,
        scheduleTime,
        schedulePeriod,
        associatedRoutineKey,
        instructions: instructions || "Take with water under caregiver supervision.",
        assameseInstructions: assameseInstructions || "কুহুমীয়া পানীৰে অনুৰ উপস্থিতিত খাওক।",
        caregiverName,
        color,
        pillShape,
      });
      setSaveSuccessMsg(`Added new medication: ${medicineName} (${dosage}).`);
    }

    setTimeout(() => setSaveSuccessMsg(null), 3000);
    resetForm();
    setActiveTab("list");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="caregiver-dosage-modal-title"
        className="bg-[#fef9f0] border border-[#c2c8c1] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#1a3826] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 text-[#c8ebd1] flex items-center justify-center shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#adcfb5] font-bold">
                Caregiver Controls · সেৱিকা পৰিচালনা
              </span>
              <h2 id="caregiver-dosage-modal-title" className="text-xl font-serif font-bold text-white">
                Input & Adjust Medicine Dosages
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              cancelEmpathicSpeech();
              onClose();
            }}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#dfd4c0] bg-[#f8f3ea] px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveTab("list");
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition ${
              activeTab === "list"
                ? "bg-[#fef9f0] text-[#1a3826] border-t border-x border-[#dfd4c0]"
                : "text-[#736a5e] hover:text-[#1a3826]"
            }`}
          >
            Current Prescriptions ({medications.length})
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveTab("add");
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition ${
              activeTab === "add"
                ? "bg-[#fef9f0] text-[#1a3826] border-t border-x border-[#dfd4c0]"
                : "text-[#736a5e] hover:text-[#1a3826]"
            }`}
          >
            <Plus size={14} />
            <span>Add New Medicine & Dosage</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {saveSuccessMsg && (
            <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
              <Check size={16} />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: LIST VIEW */}
          {activeTab === "list" && (
            <div className="space-y-4">
              <p className="text-xs text-[#595043]">
                Caregivers can update specific dosages (e.g. adjusting from 5 mg to 10 mg) or set schedule anchors. Reminders automatically sync with Purnima's daily routine.
              </p>

              <div className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="bg-white border-2 border-[#dfd4c0] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-[#1a3826]/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1a3826] bg-[#eaf0e4] px-2.5 py-0.5 rounded-md">
                          {med.scheduleTime}
                        </span>
                        <span className="text-xs text-[#736a5e]">
                          Synced with: {med.associatedRoutineKey || "Daily Routine"}
                        </span>
                        {med.status === "taken" && (
                          <span className="text-[10px] bg-[#dcfce7] text-[#166534] font-bold px-2 py-0.5 rounded-full">
                            Taken Today
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-serif font-bold text-[#1d1c16]">
                        {med.medicineName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded">
                          Dose: {med.dosage}
                        </span>
                        <span className="text-[#595043]">{med.assameseName}</span>
                      </div>
                      <p className="text-xs text-[#736a5e] pt-1">
                        {med.instructions}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(med)}
                        className="px-3 py-1.5 rounded-xl border border-[#c2c8c1] text-[#1a3826] hover:bg-[#faf6f0] text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Edit3 size={13} />
                        <span>Edit Dose</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteMedication(med.id)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Medication"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: ADD / EDIT FORM */}
          {(activeTab === "add" || activeTab === "edit") && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Medicine Name */}
                <div>
                  <label className="block text-xs font-bold text-[#1d1c16] mb-1">
                    Medicine Name (ঔষধৰ নাম) *
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g. Amlodipine (Blood Pressure) or Donepezil"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  />
                </div>

                {/* Specific Dosage Input */}
                <div>
                  <label className="block text-xs font-bold text-[#1d1c16] mb-1">
                    Specific Dosage (নিৰ্দিষ্ট মাত্ৰা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 5 mg (1 small tablet) or 10 mg"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assamese Regional Display Name */}
                <div>
                  <label className="block text-xs font-medium text-[#424843] mb-1">
                    Familiar Assamese Label (অসমীয়া নাম)
                  </label>
                  <input
                    type="text"
                    value={assameseName}
                    onChange={(e) => setAssameseName(e.target.value)}
                    placeholder="e.g. প্ৰেচাৰৰ পুৱাৰ ঔষধ"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  />
                </div>

                {/* Schedule Time */}
                <div>
                  <label className="block text-xs font-bold text-[#1d1c16] mb-1">
                    Schedule Time (নিৰ্দিষ্ট সময়) *
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="e.g. 09:00 AM, 01:30 PM, 08:00 PM"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  />
                </div>
              </div>

              {/* Schedule Sync & Routine Anchor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#424843] mb-1">
                    Time Period (দিনৰ ভাগ)
                  </label>
                  <select
                    value={schedulePeriod}
                    onChange={(e) => setSchedulePeriod(e.target.value as SchedulePeriod)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  >
                    <option value="morning">Morning (ৰাতিপুৱা)</option>
                    <option value="afternoon">Afternoon (দুপৰীয়া)</option>
                    <option value="evening">Evening (সন্ধিয়া)</option>
                    <option value="night">Night (নিশা)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a3826] mb-1">
                    Sync with Daily Routine Anchor (দিনলিপিৰ সৈতে সংগতি)
                  </label>
                  <select
                    value={associatedRoutineKey}
                    onChange={(e) => setAssociatedRoutineKey(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                  >
                    <option value="breakfast">After Morning Breakfast (জলপানৰ পিছত - 08:30 AM)</option>
                    <option value="lunch">After Restful Lunch (দুপৰীয়াৰ ভাতৰ পিছত - 01:00 PM)</option>
                    <option value="afternoon_tea">With Afternoon Tea (চাহৰ সৈতে - 04:00 PM)</option>
                    <option value="prayer">After Evening Prayer (সন্ধিয়া নাম-প্ৰাৰ্থনাৰ পিছত - 07:30 PM)</option>
                    <option value="night_rest">Before Night Rest (শুবৰ সময়ত - 09:30 PM)</option>
                  </select>
                </div>
              </div>

              {/* Ingestion Instructions */}
              <div>
                <label className="block text-xs font-medium text-[#424843] mb-1">
                  Caregiver Instructions (সেৱনৰ দিহা)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take 1 tablet after morning breakfast with half cup of lukewarm water."
                  className="w-full text-xs p-3 bg-white border border-[#c2c8c1] rounded-xl focus:outline-none focus:border-[#1a3826]"
                />
              </div>

              {/* Audio Preview Section */}
              <div className="bg-[#f0e8db] border border-[#dfd4c0] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a3826]">
                    <Sparkles size={14} />
                    <span>Audio Notification Preview</span>
                  </div>
                  <p className="text-[11px] text-[#595043] mt-0.5">
                    Test how the gentle chime and Assamese spoken reminder will sound for Purnima.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestAudio}
                  className="px-4 py-2 bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Volume2 size={15} />
                  <span>{testAudioPlaying ? "Playing..." : "Test Audio Notification"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#dfd4c0]">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("list");
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-[#595043] hover:bg-[#f0e8db] rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Check size={16} />
                  <span>{activeTab === "edit" ? "Update Dosage & Save" : "Save Medication"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
