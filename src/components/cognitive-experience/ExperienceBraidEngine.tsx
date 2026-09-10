import React, { useState } from "react";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";

interface Props {
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
}

export const ExperienceBraidEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [activePhase, setActivePhase] = useState<"past" | "present" | "future">("past");
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  const handleNextPhase = (next: "present" | "future" | "complete") => {
    if (next === "complete") {
      onComplete([], "Completed Full Experience Braid: Past, Present, and Future Orientation.");
    } else {
      setCompletedPhases((prev) => [...prev, activePhase]);
      setActivePhase(next);
    }
  };

  return (
    <div id="experience-braid-engine" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#9e472a]/15 text-[#6e2b16] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Signature Experience Braiding
              </span>
              <span className="text-xs text-[#736a5e]">MindMitra Multi-Temporal Studio</span>
            </div>
            <h2 className="text-2xl font-serif text-[#2c2824] mt-2 font-medium">
              Experience Braid <span className="text-lg font-normal text-[#605546]">(স্মৃতিৰ তৰংগ)</span>
            </h2>
            <p className="text-[#595043] text-sm mt-1 max-w-2xl">
              Weaving your past memories, present peaceful courtyard, and upcoming afternoon visit into a single continuous journey.
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-4 py-2 rounded-xl transition"
          >
            ← Back to Space
          </button>
        </div>

        {/* 3-Phase Stepper */}
        <div className="mt-6 pt-4 border-t border-[#ede4d4] grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { id: "past", label: "Phase 1: Cherished Past", sub: "1968 Wedding in Tezpur" },
            { id: "present", label: "Phase 2: Calm Present", sub: "Courtyard Sun & Marigolds" },
            { id: "future", label: "Phase 3: Looking Ahead", sub: "Rina's 4:00 PM Veranda Tea" },
          ].map((phase) => (
            <div
              key={phase.id}
              onClick={() => setActivePhase(phase.id as any)}
              className={`p-3 rounded-xl cursor-pointer transition ${
                activePhase === phase.id
                  ? "bg-[#485935] text-white shadow-sm"
                  : completedPhases.includes(phase.id)
                  ? "bg-[#eaf0e4] text-[#2c401e] border border-[#bdd4b0]"
                  : "bg-white text-[#736a5e] border border-[#d6cbba]"
              }`}
            >
              <span className="font-semibold block">{phase.label}</span>
              <span className="text-[11px] opacity-80 mt-0.5 block">{phase.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PHASE 1: PAST ── */}
      {activePhase === "past" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Phase 1: Anchored Memory</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Your Wedding Day Under the Tezpur Courtyard Awning (1968)
            </h3>
            <p className="text-sm text-[#665c4f]">
              Before today's afternoon routine, let us hold this luminous chapter in our minds.
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-[#dfd4c0] bg-white shadow-sm">
            <div className="h-72 w-full bg-[#eae3d5]">
              <img
                src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                alt="1968 Wedding"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs sm:text-sm text-[#453d33] font-serif leading-relaxed italic">
                "Relatves from across Assam gathered in Tezpur. The courtyard was dressed in Nahor flowers, and Prabin stood beside you with a radiant smile."
              </p>
              <div className="pt-2 flex justify-between items-center border-t border-[#f0e8db] text-xs text-[#736a5e]">
                <span>Archival Memory • Verified</span>
                <span className="font-semibold text-[#485935]">Recorded with Anu</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => handleNextPhase("present")}
              className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
            >
              Anchor into Present Courtyard (Phase 2) →
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 2: PRESENT ── */}
      {activePhase === "present" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Phase 2: Sensory Orientation</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Today in Your Tezpur Home: Morning Sun & Gentle Breeze
            </h3>
            <p className="text-sm text-[#665c4f]">
              You are safe in your familiar courtyard. Anu is in the home, and fresh marigolds are blooming outside.
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-[#dfd4c0] bg-white shadow-sm">
            <div className="h-72 w-full bg-[#eae3d5]">
              <img
                src="/assets/images/assamese_courtyard_1788980055319.jpg"
                alt="Tezpur Courtyard"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#595043]">
                <span className="font-semibold text-[#2c2824]">Brahmaputra Morning Flute Melodies</span>
                <span>Calming Audio</span>
              </div>
              <button
                onClick={() => setAudioPlaying(!audioPlaying)}
                className="w-full py-3 rounded-xl bg-[#485935] text-white text-xs font-medium hover:bg-[#384629] transition flex items-center justify-center gap-2"
              >
                {audioPlaying ? "⏸ Pause Courtyard Flute Raga" : "▶ Play Courtyard Bamboo Flute Raga"}
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => handleNextPhase("future")}
              className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
            >
              Look Forward to 4 PM Tea (Phase 3) →
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 3: FUTURE ── */}
      {activePhase === "future" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Phase 3: Looking Forward</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Rina is Coming from Guwahati at 4:00 PM
            </h3>
            <p className="text-sm text-[#665c4f]">
              You have grounded your past and anchored in today. Now we prepare for an affectionate family evening.
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-[#dfd4c0] bg-white shadow-sm">
            <div className="h-72 w-full bg-[#eae3d5]">
              <img
                src="/assets/images/rina_granddaughter_portrait_1789020459100.jpg"
                alt="Granddaughter Rina"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-[#f2ecde] border border-[#dfd4c0] rounded-xl p-4 text-xs sm:text-sm text-[#453d33]">
                <strong>Rina:</strong> "Aitâ, I will be with you on the veranda at 4:00 PM. We will sip warm cardamom tea together!"
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => handleNextPhase("complete")}
              className="bg-[#485935] text-white text-xs font-medium px-8 py-3.5 rounded-xl hover:bg-[#39472a] transition shadow-md"
            >
              Complete Experience Braid & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
