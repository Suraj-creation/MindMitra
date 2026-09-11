import React, { useState } from "react";
import { X, FileEdit, Plus, Check, Clock, CloudRain, Heart, Sparkles } from "lucide-react";
import { api } from "../../lib/api";

interface CaregiverNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialObservations?: any[];
  onNoteAdded?: () => void;
}

export const CaregiverNotesModal: React.FC<CaregiverNotesModalProps> = ({
  isOpen,
  onClose,
  initialObservations = [],
  onNoteAdded,
}) => {
  const [newNote, setNewNote] = useState("");
  const [category, setCategory] = useState("routine");
  const [saving, setSaving] = useState(false);
  const [observations, setObservations] = useState(initialObservations);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const res = await api.submitCareObservation(category, newNote.trim(), [category, "caregiver_note"]);
      if (res?.observation) {
        setObservations([res.observation, ...observations]);
      }
      setNewNote("");
      onNoteAdded?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032212]/50 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#c2c8c1]/40 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-1">
              <FileEdit size={13} /> Caregiver Journal & Daily Notes
            </div>
            <h2 className="text-lg font-bold font-serif text-[#032212]">
              Notes from Anu (Primary Caregiver)
            </h2>
            <p className="text-xs text-[#424843]">
              Synchronized to local storage and PostgreSQL database. Formats clinical summaries.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f2ede4] text-[#424843] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-[#f8f3ea] p-4 rounded-2xl border border-[#c2c8c1]/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#032212]">Log a Gentle Note or Domestic Observation</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#c2c8c1] bg-white text-[#032212]"
            >
              <option value="routine">Daily Routine</option>
              <option value="weather">Weather Confinement</option>
              <option value="mood">Mood & Demeanor</option>
              <option value="nutrition">Meals & Hydration</option>
              <option value="family">Family Call / Visitor</option>
            </select>
          </div>

          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            placeholder="e.g., Aitâ hummed Bihu song during morning tea. Enjoyed the warm ginger milk..."
            className="w-full text-xs p-3 rounded-xl border border-[#c2c8c1] bg-white text-[#032212] focus:outline-none focus:ring-2 focus:ring-[#1a3826]"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !newNote.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{saving ? "Saving..." : "Add Note to Log"}</span>
            </button>
          </div>
        </form>

        {/* Past Notes List */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-[#032212] uppercase tracking-wider">
            Recent Notes & Verified Observations
          </div>
          {observations.length === 0 ? (
            <div className="text-xs text-[#727972] p-4 text-center border border-dashed border-[#c2c8c1] rounded-xl">
              No previous notes logged today.
            </div>
          ) : (
            observations.map((obs: any, idx: number) => (
              <div
                key={obs.id || idx}
                className="p-3.5 bg-[#ffffff] border border-[#c2c8c1]/60 rounded-xl space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-[#727972]">
                  <span className="font-semibold text-[#1a3826]">{obs.author || "Anu (Daughter)"}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {new Date(obs.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-[#1d1c16] leading-relaxed">{obs.note}</p>
                {obs.tags && obs.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {obs.tags.map((t: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#f2ede4] text-[10px] text-[#424843] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
