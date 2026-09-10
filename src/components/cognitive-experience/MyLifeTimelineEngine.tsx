import React, { useState } from "react";
import { Calendar, ChevronLeft, Volume2, Sparkles, Heart } from "lucide-react";
import { speakWarmly } from "../../lib/empathic-speech";

interface Props {
  onComplete: (telemetry: any) => void;
  onBack: () => void;
}

const TIMELINE_CHAPTERS = [
  {
    period: "1940s — Childhood in Tezpur",
    title: "The Courtyard and the River Breeze",
    assameseTitle: "চোতালৰ বতাহ আৰু শৈশৱ",
    description: "Playing with marigold seeds near the Mahabhairab temple road as river steamers whistled at sunset.",
    image: "/assets/images/assamese_courtyard_1788980055319.jpg",
  },
  {
    period: "1965 — Wedding & Home",
    title: "Traditional Muga Silk and Blessing",
    assameseTitle: "মুগা কাপোৰ আৰু গৃহপ্ৰৱেশ",
    description: "Draped in golden golden Muga silk, surrounded by family singing traditional biya naam songs.",
    image: "/assets/images/vintage_assamese_wedding_1789020439671.jpg",
  },
  {
    period: "1970s–1990s — Teaching Career",
    title: "Tezpur Girls High School",
    assameseTitle: "তেজপুৰ বালিকা উচ্চতৰ বিদ্যালয়ৰ শিক্ষয়িত্ৰী",
    description: "Teaching Assamese literature and poetry to generations of young girls under the shade of nahor trees.",
    image: "/assets/images/tezpur_school_memory_1789020475367.jpg",
  },
  {
    period: "Present Day — Veranda Moments",
    title: "Peaceful Veranda & Tea with Anu",
    assameseTitle: "বৰান্দাৰ চাহ আৰু অনুৰ সান্নিধ্য",
    description: "Warm cardamom tea every evening at 4 PM while listening to the flute melodies drifting from the river.",
    image: "/assets/images/assamese_tea_ceremony_1789020488707.jpg",
  },
];

export const MyLifeTimelineEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const chapter = TIMELINE_CHAPTERS[currentIndex];

  const handleNext = () => {
    if (currentIndex < TIMELINE_CHAPTERS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete({
        game_key: "timeline_engine",
        interaction_type: "reminiscence",
        engagement_score: 0.95,
        recall_success: true,
        assistance_level: "none",
      });
    }
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
        <span className="text-xs font-semibold text-[#485935] uppercase tracking-wider">
          Chapter {currentIndex + 1} of {TIMELINE_CHAPTERS.length}
        </span>
      </div>

      <div className="bg-white border border-[#dfd4c0] rounded-2xl overflow-hidden shadow-sm">
        <div className="h-64 sm:h-72 w-full bg-[#eae3d5] relative">
          <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
            <div>
              <span className="bg-[#1a3826]/90 text-white text-xs px-3 py-1 rounded-full font-medium">
                {chapter.period}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold mt-2">
                {chapter.title}
              </h2>
              <p className="text-sm text-white/90 font-serif">{chapter.assameseTitle}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          <p className="text-[#332f29] text-base leading-relaxed">{chapter.description}</p>

          <div className="flex items-center justify-between pt-4 border-t border-[#f0e8db]">
            <button
              onClick={() => speakWarmly(`${chapter.title}. ${chapter.description}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5efe6] text-[#1a3826] font-medium text-xs hover:bg-[#ebdcc8] transition"
            >
              <Volume2 size={16} /> Listen with Voice
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white font-semibold text-sm transition"
            >
              {currentIndex < TIMELINE_CHAPTERS.length - 1 ? "Next Chapter →" : "Complete Reflection ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
