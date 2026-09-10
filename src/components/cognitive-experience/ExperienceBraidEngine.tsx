import React, { useState } from "react";
import { Sparkles, ChevronLeft, Volume2, Check } from "lucide-react";
import { ambientAudio } from "../../lib/ambient-audio";
import { speakWarmly } from "../../lib/empathic-speech";

interface Props {
  onComplete: (telemetry: any) => void;
  onBack: () => void;
}

const BRAID_ELEMENTS = [
  { id: "river", label: "Brahmaputra Breeze", assamese: "লুইতৰ শীতল বতাহ", icon: "🌊" },
  { id: "flute", label: "Bamboo Flute Melodies", assamese: "বাঁহীৰ সুৰ", icon: "🪈" },
  { id: "nahor", label: "Nahor Blossom Fragrance", assamese: "নাহৰৰ সুবাস", icon: "🌸" },
  { id: "silk", label: "Golden Muga Silk Texture", assamese: "মুগা কাপোৰৰ স্পৰ্শ", icon: "🧵" },
];

export const ExperienceBraidEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleFinish = () => {
    ambientAudio.stop();
    onComplete({
      game_key: "experience_braid_engine",
      interaction_type: "sensory_grounding",
      engagement_score: 0.96,
      recall_success: true,
      assistance_level: "none",
    });
  };

  return (
    <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            ambientAudio.stop();
            onBack();
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#736a5e] hover:text-[#2c2824] bg-white border border-[#d6cbba] px-3.5 py-1.5 rounded-xl transition"
        >
          <ChevronLeft size={16} /> Back to Cognitive Space
        </button>
        <span className="text-xs font-semibold text-[#5e6f4a] uppercase tracking-wider">
          Sensory Memory Weave (অনুভৱৰ সূতা)
        </span>
      </div>

      <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-2xl font-serif text-[#2c2824] font-bold">
          Weave Today's Sensory Fabric
        </h2>
        <p className="text-sm text-[#605546]">
          Touch the familiar sights, sounds, and fragrances from your home in Tezpur to create a calming sensory braid.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BRAID_ELEMENTS.map((el) => {
            const isChosen = selected.includes(el.id);
            return (
              <button
                key={el.id}
                onClick={() => {
                  toggle(el.id);
                  if (el.id === "flute") ambientAudio.playFolkFlute();
                  if (el.id === "river") ambientAudio.playCourtyardSounds();
                  speakWarmly(`${el.label}. ${el.assamese}`);
                }}
                className={`p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  isChosen
                    ? "border-[#1a3826] bg-[#f2f7f0] shadow-sm"
                    : "border-[#e5dac6] bg-[#fffdfa] hover:bg-[#faf5ec]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{el.icon}</span>
                  <div>
                    <div className="font-serif font-bold text-base text-[#1d1c16]">{el.label}</div>
                    <div className="text-xs text-[#5e6f4a] font-serif">{el.assamese}</div>
                  </div>
                </div>
                {isChosen && (
                  <div className="w-7 h-7 rounded-full bg-[#1a3826] text-white flex items-center justify-center">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#f0e8db]">
          <span className="text-xs text-[#736a5e]">
            {selected.length} element{selected.length === 1 ? "" : "s"} woven
          </span>

          <button
            onClick={handleFinish}
            disabled={selected.length === 0}
            className="px-6 py-2.5 rounded-xl bg-[#1a3826] disabled:opacity-50 hover:bg-[#2d5a3f] text-white font-semibold text-sm transition"
          >
            Complete Weave ✨
          </button>
        </div>
      </div>
    </div>
  );
};
