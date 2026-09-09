"use client";

import { CheckCircle2, Heart, Music, Pause, Play, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { ambientAudio } from "@/lib/ambient-audio";

type PhotoMemory = {
  id: string;
  title: string;
  relationship: string;
  location: string;
  story: string;
  provenance: string;
  imageAlt: string;
  accentColor: string;
};

const FAMILY_MEMORIES: PhotoMemory[] = [
  {
    id: "mem-1",
    title: "Rina & Bikash under the Mango Tree",
    relationship: "Your Granddaughter Rina & Son Bikash",
    location: "Tezpur home courtyard, Rongali Bihu festival",
    story:
      "Rina was wearing her muga mekhela sador. You rolled fresh warm til pitha together on the courtyard stove. Bikash had just arrived from Bengaluru.",
    provenance: "Verified family photograph · Shared by daughter Anu",
    imageAlt: "Family gathered in sunny courtyard under mango tree",
    accentColor: "bg-[#d8b878]/30",
  },
  {
    id: "mem-2",
    title: "Tea Garden by the Brahmaputra",
    relationship: "Your Favorite Morning Walk",
    location: "Tezpur Riverside Ghats, Assam",
    story:
      "The morning mist rises softly over the green tea bushes. You loved walking along the red soil path while the morning temple bells rang across the river.",
    provenance: "Verified memory · Cherished place",
    imageAlt: "Scenic green tea estate by the river",
    accentColor: "bg-[#5e6f4a]/20",
  },
  {
    id: "mem-3",
    title: "Making Magh Bihu Pitha",
    relationship: "Traditional Family Kitchen Routine",
    location: "Tezpur Home Kitchen",
    story:
      "Grinding fresh black sesame seeds with fragrant liquid gur in the stone mortar. Rina always stood beside you with an eager plate for the very first hot pitha.",
    provenance: "Verified family routine",
    imageAlt: "Traditional Assamese pitha on brass platter",
    accentColor: "bg-[#a85e46]/20",
  },
];

type MelodyTrack = {
  id: string;
  title: string;
  type: "flute" | "drone";
  description: string;
};

const MELODIES: MelodyTrack[] = [
  {
    id: "track-1",
    title: "Peaceful Bihu Bamboo Flute",
    type: "flute",
    description: "Gentle pentatonic folk notes echoing the hills of Assam.",
  },
  {
    id: "track-2",
    title: "Morning River Tanpura Drone",
    type: "drone",
    description: "Soothing meditative acoustic drone for calm and focus.",
  },
];

export function PersonLifeView() {
  const [activeTab, setActiveTab] = useState<"photos" | "music" | "places">("photos");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<string>("");
  const [speakingMemoryId, setSpeakingMemoryId] = useState<string | null>(null);

  const toggleMusic = (track: MelodyTrack) => {
    if (playingTrack === track.id) {
      ambientAudio.stop();
      setPlayingTrack(null);
      setActiveNote("");
    } else {
      if (track.type === "flute") {
        ambientAudio.playFolkFlute((note) => setActiveNote(note));
      } else {
        ambientAudio.playTanpuraDrone();
        setActiveNote("Sa - Pa");
      }
      setPlayingTrack(track.id);
    }
  };

  const speakStory = (memory: PhotoMemory) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMemoryId === memory.id) {
      window.speechSynthesis.cancel();
      setSpeakingMemoryId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const text = `${memory.title}. ${memory.relationship}. ${memory.story}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.onend = () => setSpeakingMemoryId(null);
    utterance.onerror = () => setSpeakingMemoryId(null);

    setSpeakingMemoryId(memory.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Category selector */}
      <div className="flex items-center gap-2 p-1.5 bg-[#eee1cc] rounded-xl max-w-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activeTab === "photos"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          Photographs & Stories
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("music")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activeTab === "music"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          Music & Melodies
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("places")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activeTab === "places"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          Familiar Places
        </button>
      </div>

      {/* 1. PHOTOGRAPHS & STORIES */}
      {activeTab === "photos" && (
        <div className="flex flex-col gap-5">
          <p className="text-[#6b6b63] text-base">
            These are your family memories and cherished moments from Tezpur. Tap any story to listen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FAMILY_MEMORIES.map((mem) => {
              const isSpeaking = speakingMemoryId === mem.id;
              return (
                <article
                  key={mem.id}
                  className="bg-[#fffaf1] border-2 border-[#e6ddcf] hover:border-[#5e6f4a]/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all"
                >
                  {/* Decorative cultural illustration placeholder */}
                  <div>
                    <div className={`w-full h-28 ${mem.accentColor} flex items-center justify-center p-4 relative`}>
                      <div className="text-center">
                        <span className="font-serif text-xl sm:text-2xl text-[#332f29] font-medium">
                          {mem.title}
                        </span>
                        <p className="text-xs uppercase font-bold text-[#5e6f4a] mt-0.5">
                          {mem.location}
                        </p>
                      </div>

                      <span className="absolute bottom-2 right-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#5e6f4a] bg-white/90 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={11} />
                        {mem.provenance}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                      <span className="text-xs sm:text-sm font-bold text-[#a85e46]">
                        {mem.relationship}
                      </span>

                      <p className="text-base text-[#332f29] leading-relaxed font-serif">
                        "{mem.story}"
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 pt-0 mt-auto">
                    <button
                      type="button"
                      onClick={() => speakStory(mem)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold bg-[#eee1cc] hover:bg-[#d8b878]/50 active:scale-95 text-[#332f29] transition-all"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX size={16} /> Stop voice
                        </>
                      ) : (
                        <>
                          <Volume2 size={16} /> Listen to story
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MUSIC & MELODIES */}
      {activeTab === "music" && (
        <div className="flex flex-col gap-5">
          <div className="bg-[#eee1cc] p-5 rounded-2xl border border-[#e6ddcf]">
            <h3 className="text-2xl font-serif text-[#332f29] font-normal">
              Music of the Brahmaputra
            </h3>
            <p className="text-sm text-[#6b6b63] mt-1">
              Soft, unhurried melodies generated live. Tap to listen and relax in your courtyard.
            </p>

            {activeNote && (
              <div className="mt-3 flex items-center gap-2 text-sm font-mono font-bold text-[#5e6f4a] bg-[#fffaf1] px-3 py-1.5 rounded-lg inline-flex">
                <span className="w-2 h-2 rounded-full bg-[#5e6f4a] animate-ping" />
                Playing note: {activeNote}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MELODIES.map((track) => {
              const isCurrent = playingTrack === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? "bg-[#fffaf1] border-[#5e6f4a] shadow-md scale-[1.01]"
                      : "bg-[#fffaf1] border-[#e6ddcf] hover:border-[#d8b878]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleMusic(track)}
                      aria-label={isCurrent ? "Pause melody" : "Play melody"}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? "bg-[#5e6f4a] text-white animate-pulse"
                          : "bg-[#eee1cc] text-[#5e6f4a] hover:bg-[#5e6f4a] hover:text-white"
                      }`}
                    >
                      {isCurrent ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[#332f29]">{track.title}</h4>
                      <p className="text-xs sm:text-sm text-[#6b6b63]">{track.description}</p>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-xs font-bold text-[#5e6f4a] uppercase tracking-wider bg-[#5e6f4a]/10 px-3 py-1 rounded-full shrink-0">
                      Playing
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FAMILIAR PLACES */}
      {activeTab === "places" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 shadow-sm flex flex-col">
            <h4 className="font-serif text-xl text-[#332f29]">The Nahor Tree in your Courtyard</h4>
            <p className="text-sm sm:text-base text-[#6b6b63] mt-2 leading-relaxed">
              Planted over thirty years ago. In spring, the white petals with bright golden center fall gently onto the courtyard stone. You and Anu often sit in its shade for afternoon tea.
            </p>
          </div>

          <div className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 shadow-sm flex flex-col">
            <h4 className="font-serif text-xl text-[#332f29]">Bhairabi Temple Ghat, Tezpur</h4>
            <p className="text-sm sm:text-base text-[#6b6b63] mt-2 leading-relaxed">
              High on the hill overlooking the great Brahmaputra river. You used to visit during every autumn festival to offer marigolds and light an earthen lamp at dusk.
            </p>
          </div>

          <div className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 shadow-sm flex flex-col">
            <h4 className="font-serif text-xl text-[#332f29]">Your Brass Puja Bell</h4>
            <p className="text-sm sm:text-base text-[#6b6b63] mt-2 leading-relaxed">
              Rests on the polished wooden shelf in the morning room. Its gentle clear ring greets every sunrise in your household.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
