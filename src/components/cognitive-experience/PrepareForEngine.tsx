import React, { useState } from "react";
import { Clock, ChevronLeft, PhoneCall, Coffee, Sparkles, CheckCircle2 } from "lucide-react";
import { speakWarmly } from "../../lib/empathic-speech";

interface Props {
  onComplete: (telemetry: any) => void;
  onBack: () => void;
}

const UPCOMING_EVENTS = [
  {
    time: "4:00 PM Today",
    title: "Cardamom Tea with Daughter Anu",
    assameseTitle: "অনুৰ সৈতে আবেলিৰ চাহ",
    grounding: "Anu is brewing warm milk tea with crushed green cardamom in the kitchen right now.",
    cues: ["Aroma of fresh cardamom", "Porcelain floral cups from Shillong", "Gentle breeze on the veranda"],
    prompt: "Anu will bring two cups to the veranda. You can relax together and watch the evening birds.",
  },
  {
    time: "5:00 PM Tuesday",
    title: "Phone Call from Granddaughter Rina",
    assameseTitle: "নাতিনী ৰিনাৰ ফোন",
    grounding: "Rina calls from Guwahati to tell you about her university classes and her sweet cat Chutki.",
    cues: ["Her bright cheerful laugh", "She will ask for your recipe for til pitha", "She sends loving pranam"],
    prompt: "No rush to answer, Anu will hold the phone near you and turn on the loudspeaker so you can talk easily.",
  },
];

export const PrepareForEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const event = UPCOMING_EVENTS[selectedIdx];

  const handleFinish = () => {
    onComplete({
      game_key: "prepare_for_engine",
      interaction_type: "orientation",
      engagement_score: 0.92,
      recall_success: true,
      assistance_level: "none",
    });
  };

  return (
    <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#736a5e] hover:text-[#2c2824] bg-white border border-[#d6cbba] px-3.5 py-1.5 rounded-xl transition"
        >
          <ChevronLeft size={16} /> Back to Cognitive Space
        </button>
        <span className="text-xs font-semibold text-[#a85e46] uppercase tracking-wider">
          Orientation & Preparation
        </span>
      </div>

      <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f5e5d1] text-[#904d00] flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#904d00] uppercase tracking-wider">{event.time}</div>
            <h2 className="text-2xl font-serif text-[#2c2824] font-bold mt-0.5">{event.title}</h2>
            <p className="text-xs text-[#736a5e] font-serif">{event.assameseTitle}</p>
          </div>
        </div>

        <p className="text-[#332f29] text-base leading-relaxed bg-[#fbf7ee] p-4 rounded-xl border border-[#e8ded0]">
          {event.grounding}
        </p>

        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5e6f4a] uppercase tracking-wider">
            Sensory Cues to Remember:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {event.cues.map((cue, idx) => (
              <div key={idx} className="bg-white border border-[#d6cbba] p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-[#41382c]">
                <CheckCircle2 size={16} className="text-[#5e6f4a] shrink-0" />
                <span>{cue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] text-sm">
          💡 {event.prompt}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#f0e8db]">
          <button
            onClick={() => speakWarmly(`${event.title}. ${event.grounding} ${event.prompt}`)}
            className="px-4 py-2 rounded-xl bg-[#f5efe6] text-[#1a3826] font-medium text-xs hover:bg-[#ebdcc8] transition"
          >
            🔊 Listen to Gentle Audio
          </button>

          <button
            onClick={handleFinish}
            className="px-6 py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-sm transition"
          >
            I Feel Prepared & Calm ✨
          </button>
        </div>
      </div>
    </div>
  );
};
