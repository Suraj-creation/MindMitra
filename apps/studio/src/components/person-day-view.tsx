"use client";

import { Bell, Calendar, Clock, Heart, Music, Phone, Sparkles, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { CompanionPanel } from "@/components/companion-panel";
import type { CompanionTurn, VoiceCapability } from "@/lib/api";
import type { PersonSection } from "@/components/person-navigation";

type PersonDayViewProps = {
  displayName: string;
  onNavigate: (section: PersonSection) => void;
  sendTurn: (message: string) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
  onQuickCall: (name: string, phone: string) => void;
};

export function PersonDayView({
  displayName,
  onNavigate,
  sendTurn,
  voice,
  onQuickCall,
}: PersonDayViewProps) {
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
      setDateString(
        now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ambient Orientation, Rhythm & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 1. Ambient Orientation Card (Where am I in time? Where am I?) */}
          <section
            aria-label="Current time and place"
            className="bg-[#eee1cc] border-2 border-[#e6ddcf] rounded-2xl p-5 sm:p-7 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6ddcf] pb-4">
              <div>
                <span className="text-sm uppercase tracking-wider font-bold text-[#5e6f4a] flex items-center gap-1.5">
                  <Sun size={18} className="text-[#c9a34f]" />
                  Tezpur, Assam · Sunny 24°C
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#332f29] mt-1 font-normal">
                  Namaskar, {displayName} baideu.
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-[#332f29]">
                  {timeString || "10:30 AM"}
                </div>
                <div className="text-sm font-medium text-[#6b6b63]">
                  {dateString || "Tuesday, 8 September"}
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-3 text-base sm:text-lg text-[#332f29]">
              <span className="inline-block w-3 h-3 rounded-full bg-[#6b8f6b] shrink-0" />
              <p className="font-medium">
                You are at home in Tezpur. Anu is close by in the house.
              </p>
            </div>
          </section>

          {/* 2. What is happening next? (Familiar Daily Rhythm) */}
          <section aria-label="What is happening next" className="flex flex-col gap-2.5">
            <h3 className="text-xl font-serif text-[#332f29] font-normal flex items-center gap-2">
              <Clock size={20} className="text-[#5e6f4a]" />
              What is happening today?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Item 1 */}
              <div className="bg-[#f7eadc] border-2 border-[#5e6f4a] rounded-xl p-4 flex flex-col justify-between min-h-[105px] shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-[#5e6f4a]">
                  <span>RIGHT NOW</span>
                  <span className="w-2 h-2 rounded-full bg-[#5e6f4a] animate-ping" />
                </div>
                <p className="text-base font-bold text-[#332f29] mt-1">
                  Courtyard time & gentle breeze
                </p>
                <span className="text-xs text-[#6b6b63]">Quiet morning in the garden</span>
              </div>

              {/* Item 2 */}
              <div className="bg-[#fffaf1] border border-[#e6ddcf] rounded-xl p-4 flex flex-col justify-between min-h-[105px]">
                <span className="text-xs font-bold text-[#a85e46]">4:00 PM</span>
                <p className="text-base font-bold text-[#332f29] mt-1">
                  Cardamom Tea with Anu
                </p>
                <span className="text-xs text-[#6b6b63]">Warm tea & homemade snacks</span>
              </div>

              {/* Item 3 */}
              <div className="bg-[#fffaf1] border border-[#e6ddcf] rounded-xl p-4 flex flex-col justify-between min-h-[105px]">
                <span className="text-xs font-bold text-[#a85e46]">5:00 PM</span>
                <p className="text-base font-bold text-[#332f29] mt-1">
                  Rina will call from Guwahati
                </p>
                <span className="text-xs text-[#6b6b63]">Granddaughter's regular call</span>
              </div>
            </div>
          </section>

          {/* 3. Quick Actions */}
          <section aria-label="Things to do now" className="flex flex-col gap-2.5">
            <h3 className="text-xl font-serif text-[#332f29] font-normal">
              What would you like to do right now?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigate("activity")}
                className="flex items-center gap-3.5 p-3.5 min-h-[70px] bg-[#fffaf1] hover:bg-[#eee1cc] active:scale-[0.98] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-xl text-left transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5e6f4a]/15 text-[#5e6f4a] flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#332f29]">Make a flower garland</p>
                  <p className="text-xs sm:text-sm text-[#6b6b63]">Gentle flower arrangement for altar</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("life")}
                className="flex items-center gap-3.5 p-3.5 min-h-[70px] bg-[#fffaf1] hover:bg-[#eee1cc] active:scale-[0.98] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-xl text-left transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-[#a85e46]/15 text-[#a85e46] flex items-center justify-center shrink-0">
                  <Music size={24} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#332f29]">Listen to a peaceful song</p>
                  <p className="text-xs sm:text-sm text-[#6b6b63]">Bihu flute & traditional melodies</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("people")}
                className="flex items-center gap-3.5 p-3.5 min-h-[70px] bg-[#fffaf1] hover:bg-[#eee1cc] active:scale-[0.98] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-xl text-left transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-[#d8b878]/30 text-[#332f29] flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#332f29]">See family photographs</p>
                  <p className="text-xs sm:text-sm text-[#6b6b63]">Rina, Bikash, and Tezpur memories</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onQuickCall("Rina", "+91 98640 54321")}
                className="flex items-center gap-3.5 p-3.5 min-h-[70px] bg-[#fffaf1] hover:bg-[#eee1cc] active:scale-[0.98] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-xl text-left transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-[#6b8f6b]/20 text-[#5e6f4a] flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#332f29]">Call Rina in Guwahati</p>
                  <p className="text-xs sm:text-sm text-[#6b6b63]">Tap to speak with your granddaughter</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Spoken Conversation with MindMitra (Docked side-by-side on Laptop) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <section aria-label="Conversation companion" className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="mb-3">
              <h3 className="text-xl sm:text-2xl font-serif text-[#332f29] font-normal flex items-center gap-2">
                <span>Talk with MindMitra</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#d8b878] text-[#332f29] rounded-full">
                  Empathic Voice
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-[#6b6b63] mt-1">
                Ask anything in your own words. We can talk about your day, your family, or your songs.
              </p>
            </div>

            <CompanionPanel
              prompt="What is happening today?"
              sendTurn={sendTurn}
              voice={voice}
              onAction={(action) => {
                if (action.type === "navigate" && action.target) {
                  onNavigate(action.target as any);
                } else if (action.type === "call_contact" && action.target) {
                  onQuickCall(action.target, action.phone || "+91 98640 12345");
                } else if (action.type === "start_activity") {
                  onNavigate("activity");
                } else if (action.type === "show_media") {
                  onNavigate("life");
                }
              }}
              quickPrompts={[
                "What is happening today?",
                "When will Rina call?",
                "Can we hear a song?",
                "Tell me about Tezpur",
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
