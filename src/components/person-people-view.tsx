"use client";

import { CheckCircle2, Heart, MessageSquare, Phone, PhoneCall, Sparkles, UserCheck, Users, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

type FamilyPerson = {
  id: string;
  name: string;
  relationship: string;
  role: string;
  location: string;
  phone: string;
  story: string;
  avatarColor: string;
  scheduleNote: string;
};

const PEOPLE: FamilyPerson[] = [
  {
    id: "rina",
    name: "Rina",
    relationship: "Your Granddaughter",
    role: "Family",
    location: "Guwahati, Assam",
    phone: "+91 98640 54321",
    story: "Rina lives in Guwahati and is working in education. She calls you every Tuesday and Saturday evening at 5:00 PM. She loves your homemade til pitha.",
    avatarColor: "bg-[#d8b878]",
    scheduleNote: "Calling today at 5:00 PM",
  },
  {
    id: "anu",
    name: "Anu",
    relationship: "Your Daughter & Primary Caregiver",
    role: "Primary Caregiver",
    location: "Here with you in Tezpur",
    phone: "+91 98640 12345",
    story: "Anu lives in the house with you in Tezpur. She takes care of the courtyard garden, prepares your cardamom tea, and is right in the house.",
    avatarColor: "bg-[#5e6f4a]",
    scheduleNote: "In the house right now",
  },
  {
    id: "bikash",
    name: "Bikash",
    relationship: "Your Son",
    role: "Family",
    location: "Bengaluru, Karnataka",
    phone: "+91 98450 67890",
    story: "Bikash works in Bengaluru. He visited during the Rongali Bihu festival last month and brought sweets. He sends his warm pranams.",
    avatarColor: "bg-[#a85e46]",
    scheduleNote: "Visited last month for Bihu",
  },
  {
    id: "meena",
    name: "Meena",
    relationship: "ASHA Community Health Worker",
    role: "Community Care",
    location: "Ward 4, Tezpur",
    phone: "+91 98640 98765",
    story: "Meena baideu is your trusted local health worker. She comes by every Thursday morning with a friendly smile to chat and share a cup of tea.",
    avatarColor: "bg-[#6b8f6b]",
    scheduleNote: "Visiting Thursday morning",
  },
];

type PersonPeopleViewProps = {
  onQuickCall: (name: string, phone: string) => void;
};

export function PersonPeopleView({ onQuickCall }: PersonPeopleViewProps) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speakPerson = (person: FamilyPerson) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingId === person.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const text = `${person.name}. ${person.relationship}. ${person.story}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(person.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto pb-6">
      <div className="bg-[#eee1cc] p-5 sm:p-6 rounded-2xl border-2 border-[#e6ddcf]">
        <h2 className="text-2xl sm:text-3xl font-serif text-[#332f29] font-normal">
          People Who Know & Love You
        </h2>
        <p className="text-sm sm:text-base text-[#6b6b63] mt-1">
          These are your loved ones and your familiar circle. You can tap to hear about them or place a gentle call.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {PEOPLE.map((person) => {
          const isSpeaking = speakingId === person.id;
          return (
            <div
              key={person.id}
              className="bg-[#fffaf1] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between gap-3.5"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-13 h-13 rounded-full ${person.avatarColor} text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    {person.name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#332f29]">{person.name}</h3>
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#eee1cc] text-[#5e6f4a] px-2.5 py-0.5 rounded-full">
                        {person.scheduleNote}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#a85e46]">
                      {person.relationship}
                    </p>
                    <p className="text-xs text-[#6b6b63]">{person.location}</p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => speakPerson(person)}
                    className="p-2.5 bg-[#eee1cc] hover:bg-[#d8b878]/50 active:scale-95 text-[#332f29] rounded-xl font-bold transition-all shrink-0"
                    title="Read aloud"
                  >
                    {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onQuickCall(person.name, person.phone)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5e6f4a] hover:bg-[#48583a] active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm"
                  >
                    <Phone size={18} />
                    <span>Call {person.name}</span>
                  </button>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#332f29] font-serif leading-relaxed pt-2.5 border-t border-[#e6ddcf]/70">
                "{person.story}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
