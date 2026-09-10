import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Heart,
  Sun,
  Coffee,
  Trees,
  CheckCircle2,
  Volume2,
  Image as ImageIcon,
  Wind,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { CompanionPanel } from "./CompanionPanel";
import { SaveMemoryStudio } from "./cognitive-experience/SaveMemoryStudio";
import { CognitiveExperienceSpace } from "./cognitive-experience/CognitiveExperienceSpace";
import { api } from "../lib/api";
import type { PersonSection, VoiceCapability, PersonSession } from "../types";
import { MemoryItem } from "../domain/cognitive-experience";

export const PersonApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState<PersonSection>("day");
  const [showSaveMemoryModal, setShowSaveMemoryModal] = useState(false);
  const [savedMemories, setSavedMemories] = useState<MemoryItem[]>([]);
  const [session, setSession] = useState<PersonSession>({
    personId: "person:purnima",
    displayName: "Purnima",
    preferredLanguage: "Assamese / English",
    village: "Kamrup Rural, Assam",
  });
  const [voice, setVoice] = useState<VoiceCapability | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [routineCompleted, setRoutineCompleted] = useState<Record<string, boolean>>({
    tea: true,
    walk: false,
    lunch: false,
  });
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Breathe in gently" | "Hold with calm" | "Release slowly">("Breathe in gently");

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now);
    setDateLabel(formatted);

    void api.getVoiceCapability("token", "person:purnima").then(setVoice);
  }, []);

  // Gentle breathing exercise loop
  useEffect(() => {
    if (!breathingActive) return;
    const interval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === "Breathe in gently") return "Hold with calm";
        if (prev === "Hold with calm") return "Release slowly";
        return "Breathe in gently";
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [breathingActive]);

  const sectionContent: Record<PersonSection, { title: string; description: string; prompt: string }> = {
    day: {
      title: "What would you like to do now?",
      description: "We can look at your morning together, step by step, at your own pace.",
      prompt: "What is happening today?",
    },
    life: {
      title: "Let’s look at something familiar.",
      description: "We can look at your home tea gardens, the Brahmaputra, or remember family memories.",
      prompt: "Show me my family memories and tea gardens.",
    },
    activity: {
      title: "Let’s choose something that feels good.",
      description: "A soothing breathing rhythm, a folk song, or recalling your garden herbs.",
      prompt: "What gentle activity could we do together now?",
    },
    help: {
      title: "How can we help right now?",
      description: "You are completely safe. Anu and your health team are right here with you.",
      prompt: "I need a moment of help.",
    },
  };

  const content = sectionContent[activeSection];

  return (
    <main className="person-shell">
      {/* Header */}
      <header className="person-header">
        <div>
          <p className="person-wordmark">MindMitra</p>
          <p className="text-xs text-[#6b6b63] font-medium mt-0.5">
            North Eastern Region Cognitive Companion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#332f29]">{session.displayName} Devi</p>
            <p className="text-xs text-[#6b6b63] flex items-center justify-end gap-1">
              <MapPin size={12} className="text-[#5e6f4a]" />
              {session.village}
            </p>
          </div>
          <p className="person-date bg-[#f7eadc] border border-[#e6ddcf] px-3 py-1.5 rounded-xl">
            <CalendarDays aria-hidden="true" size={20} className="text-[#5e6f4a]" />
            <span>{dateLabel}</span>
          </p>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <section aria-labelledby="person-title" className="person-stage">
        <h1 id="person-title" className="text-[#332f29]">
          {content.title}
        </h1>
        <p className="person-introduction">
          Hello, {session.displayName}. {content.description}
        </p>

        {/* Dynamic Section Specific Surfaces */}
        {activeSection === "day" && (
          <div className="w-full mt-6 bg-[#f7eadc] border border-[#e6ddcf] p-5 rounded-2xl">
            <h2 className="text-base font-bold text-[#332f29] font-serif mb-3 flex items-center gap-2">
              <Sun size={20} className="text-[#f97b0a]" />
              Today’s Gentle Routine
            </h2>
            <div className="space-y-3">
              <div
                onClick={() => setRoutineCompleted((s) => ({ ...s, tea: !s.tea }))}
                className="flex items-center justify-between p-3.5 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] cursor-pointer hover:bg-[#fffdf8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ffefd4] text-[#9a3c04] flex items-center justify-center">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#332f29] text-base">Morning Cardamom Tea</p>
                    <p className="text-xs text-[#6b6b63]">Freshly brewed warm tea on the verandah with Anu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6b6b63] hidden sm:inline">07:30 AM</span>
                  <CheckCircle2
                    size={24}
                    className={routineCompleted.tea ? "text-[#6b8f6b] fill-[#6b8f6b]/20" : "text-[#d6d3d1]"}
                  />
                </div>
              </div>

              <div
                onClick={() => setRoutineCompleted((s) => ({ ...s, walk: !s.walk }))}
                className="flex items-center justify-between p-3.5 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] cursor-pointer hover:bg-[#fffdf8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e5ece0] text-[#5e6f4a] flex items-center justify-center">
                    <Trees size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#332f29] text-base">Gentle Garden Stroll</p>
                    <p className="text-xs text-[#6b6b63]">Walking along the marigold flower beds under the warm sun</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6b6b63] hidden sm:inline">08:15 AM</span>
                  <CheckCircle2
                    size={24}
                    className={routineCompleted.walk ? "text-[#6b8f6b] fill-[#6b8f6b]/20" : "text-[#d6d3d1]"}
                  />
                </div>
              </div>

              <div
                onClick={() => setRoutineCompleted((s) => ({ ...s, lunch: !s.lunch }))}
                className="flex items-center justify-between p-3.5 bg-[#fbf1e3] rounded-xl border border-[#e6ddcf] cursor-pointer hover:bg-[#fffdf8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d7f2f4] text-[#1e7a88] flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#332f29] text-base">Lunch & Rest</p>
                    <p className="text-xs text-[#6b6b63]">Light khichdi with fresh garden herbs prepared by Anu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6b6b63] hidden sm:inline">12:30 PM</span>
                  <CheckCircle2
                    size={24}
                    className={routineCompleted.lunch ? "text-[#6b8f6b] fill-[#6b8f6b]/20" : "text-[#d6d3d1]"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "life" && (
          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#332f29] font-serif flex items-center gap-2">
                <ImageIcon size={20} className="text-[#5e6f4a]" />
                Familiar Places & Memories from Assam
              </h2>
              <button
                type="button"
                onClick={() => setShowSaveMemoryModal(true)}
                className="px-4 py-2 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Sparkles size={14} /> Save Memory (স্মৃতি সংৰক্ষণ)
              </button>
            </div>

            {/* Custom Added Memories */}
            {savedMemories.length > 0 && (
              <div className="p-4 bg-[#f0e6d6] rounded-2xl border border-[#d6cbba] space-y-2">
                <p className="text-xs font-bold text-[#736a5e] uppercase tracking-wider">Recently Added to Sanctuary</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedMemories.map((mem) => (
                    <div key={mem.id} className="bg-white p-3 rounded-xl border border-[#e8ded0] flex items-center gap-3">
                      {mem.media_refs?.[0] ? (
                        <img src={mem.media_refs[0]} alt={mem.title} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#f5efe6] flex items-center justify-center text-[#a85e46]">
                          <Heart size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#1d1c16]">{mem.title}</p>
                        <p className="text-[11px] text-[#736a5e] line-clamp-1">{mem.description || "Cherished memory"}</p>
                        <span className="text-[10px] text-[#5e6f4a] font-semibold">
                          {mem.source === "caregiver" ? "Caregiver verified" : "Pending verification"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tea Garden Reminiscence Card */}
              <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl overflow-hidden shadow-xs">
                <img
                  src="/assets/images/assam_tea_garden_1788977277508.jpg"
                  alt="Assam rolling tea gardens watercolor"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="font-serif font-bold text-lg text-[#332f29]">
                    The Green Hills of Tezpur
                  </p>
                  <p className="text-xs text-[#6b6b63] mt-1 leading-relaxed">
                    You used to walk near the tea estate in the cool mornings. Do you remember the fresh fragrance of young tea leaves?
                  </p>
                </div>
              </div>

              {/* Brahmaputra River Reminiscence Card */}
              <div className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl overflow-hidden shadow-xs">
                <img
                  src="/assets/images/brahmaputra_river_1788977296883.jpg"
                  alt="Sunset over Brahmaputra river"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="font-serif font-bold text-lg text-[#332f29]">
                    Evening on the Brahmaputra
                  </p>
                  <p className="text-xs text-[#6b6b63] mt-1 leading-relaxed">
                    The gentle ferry boats gliding across the golden water at twilight. A peaceful sight you always cherished.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "activity" && (
          <div className="w-full mt-6 space-y-6">
            <CognitiveExperienceSpace onBackToDay={() => setActiveSection("day")} />

            <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl">
              <h2 className="text-base font-bold text-[#332f29] font-serif mb-4 flex items-center gap-2">
                <Wind size={20} className="text-[#2596a3]" />
                Gentle Calming Breath
              </h2>

              <div className="flex flex-col items-center justify-center p-6 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl text-center">
                <div
                  className={`w-32 h-32 rounded-full border-4 border-[#5e6f4a] flex items-center justify-center transition-all duration-1000 ${
                    breathingActive ? "scale-110 bg-[#e5ece0]" : "bg-[#fffdf8]"
                  }`}
                >
                  <Wind size={36} className="text-[#5e6f4a]" />
                </div>
                <p className="text-xl font-serif font-bold text-[#332f29] mt-4">
                  {breathingActive ? breathingPhase : "Gentle 4-4 Breathing"}
                </p>
                <p className="text-xs text-[#6b6b63] max-w-sm mt-1">
                  A calm, guided rhythm to soothe tension and bring clarity to this moment.
                </p>

                <button
                  type="button"
                  onClick={() => setBreathingActive(!breathingActive)}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#5e6f4a] text-white font-semibold text-sm hover:bg-[#48583a] transition-colors"
                >
                  {breathingActive ? "Pause breathing" : "Begin breathing rhythm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "help" && (
          <div className="w-full mt-6 space-y-4">
            {/* Safe Place Banner */}
            <div className="p-4 bg-[#e5ece0] border border-[#ccd9c2] rounded-2xl flex items-start gap-3">
              <ShieldCheck size={26} className="text-[#5e6f4a] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#332f29] text-base">You are safe at home</p>
                <p className="text-sm text-[#48583a] mt-0.5">
                  You are in your familiar home in Kamrup Rural. Your daughter Anu is in the kitchen preparing tea.
                </p>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => alert("Calling Anu (Primary Caregiver). She is notified immediately.")}
                className="p-4 rounded-xl bg-[#5e6f4a] text-white flex items-center gap-3 text-left font-semibold text-base hover:bg-[#48583a] transition-colors"
              >
                <PhoneCall size={24} />
                <div>
                  <div>Call Anu (Daughter)</div>
                  <div className="text-xs text-white/80 font-normal">Fast family contact</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => alert("Calling Meena (ASHA Community Health Worker).")}
                className="p-4 rounded-xl bg-[#2596a3] text-white flex items-center gap-3 text-left font-semibold text-base hover:bg-[#1e7a88] transition-colors"
              >
                <PhoneCall size={24} />
                <div>
                  <div>Call Meena (ASHA Worker)</div>
                  <div className="text-xs text-white/80 font-normal">Village healthcare support</div>
                </div>
              </button>
            </div>

            <div className="p-4 bg-[#ffefd4] border border-[#ffdba8] rounded-xl text-left">
              <p className="text-xs font-bold text-[#9a3c04] uppercase tracking-wider">
                Government Tele-MANAS Emergency Lifeline
              </p>
              <p className="text-sm font-semibold text-[#7d330a] mt-0.5">
                Dial 14416 or 1800-891-4416 (24x7 toll-free mental health helpline)
              </p>
            </div>
          </div>
        )}

        {/* AI Voice & Reassuring Companion Panel */}
        <CompanionPanel
          prompt={content.prompt}
          onSendTurn={(msg) => api.sendCompanionTurn("token", session.personId, msg)}
          voice={voice}
        />
      </section>

      {/* Accessible Bottom Navigation Bar */}
      <nav aria-label="Person Navigation" className="person-navigation">
        <button
          type="button"
          data-active={activeSection === "day"}
          onClick={() => setActiveSection("day")}
          className="person-navigation__item"
        >
          <CalendarDays size={24} />
          <span>My Day</span>
        </button>

        <button
          type="button"
          data-active={activeSection === "life"}
          onClick={() => setActiveSection("life")}
          className="person-navigation__item"
        >
          <ImageIcon size={24} />
          <span>Memories</span>
        </button>

        <button
          type="button"
          data-active={activeSection === "activity"}
          onClick={() => setActiveSection("activity")}
          className="person-navigation__item"
        >
          <Sparkles size={24} />
          <span>Activity</span>
        </button>

        <button
          type="button"
          data-active={activeSection === "help"}
          onClick={() => setActiveSection("help")}
          className="person-navigation__item"
        >
          <Heart size={24} />
          <span>Help</span>
        </button>
      </nav>

      {showSaveMemoryModal && (
        <SaveMemoryStudio
          onClose={() => setShowSaveMemoryModal(false)}
          onMemoryAdded={(mem) => setSavedMemories((prev) => [mem, ...prev])}
          defaultRole="person"
        />
      )}
    </main>
  );
};
