import React from "react";
import { User, ShieldCheck, Heart, Sparkles, CheckCircle2, ChevronRight, Eye, Volume2, Compass, Brain, Users, Coffee, Bed } from "lucide-react";

interface PersonCapabilitiesTabProps {
  onOpenSupportModal: () => void;
  supportLevel: number;
}

export const PersonCapabilitiesTab: React.FC<PersonCapabilitiesTabProps> = ({
  onOpenSupportModal,
  supportLevel,
}) => {
  const capabilityDomains = [
    {
      domain: "Autobiographical & Working Memory",
      status: "Robust with Family Cues",
      confidence: "High (94%)",
      current: "Recognizes 1978 Kaziranga family photo, wedding photos, and children's childhood stories effortlessly.",
      scaffolding: "Benefits from paired photo-plus-voice prompts. Avoid open-ended 'Do you remember?' quizzes.",
      icon: Brain,
    },
    {
      domain: "Temporal & Daily Orientation",
      status: "Anchored to Sun & Prayer",
      confidence: "Verified",
      current: "Clearly identifies morning, noon, dusk, and night by natural lighting and gosai-ghar earthen lamp lighting.",
      scaffolding: "Living room tablet clock provides gentle ambient date/time anchors without intrusive alarms.",
      icon: Compass,
    },
    {
      domain: "Spatial Wayfinding & Home Sanctuary",
      status: "Fully Autonomous at Home",
      confidence: "High (98%)",
      current: "Moves freely through Tezpur ancestral house, courtyard veranda, and prayer room without disorientation.",
      scaffolding: "Keep walkways clear of seasonal monsoon umbrellas; soft incandescent night lamps in hallway.",
      icon: Eye,
    },
    {
      domain: "Sensory & Auditory Comfort",
      status: "Highly Responsive to Sound",
      confidence: "High",
      current: "Borxongit flute melodies and rain chimes bring immediate soothing tranquility within 2–3 minutes.",
      scaffolding: "Use terracotta bell cup for tea and avoid loud television news broadcasts in the late afternoon.",
      icon: Volume2,
    },
    {
      domain: "Communication & Language",
      status: "Primary Assamese (Tier 1)",
      confidence: "Verified",
      current: "Expresses thoughts and emotions fluently in Assamese. Comprehends family Hindi/English conversations.",
      scaffolding: "MindMitra speech models run exclusively in verified Assamese (Bulbul/Sarvam) to prevent cognitive fatigue.",
      icon: Users,
    },
    {
      domain: "Executive Daily Functioning",
      status: "Guided Routine Support",
      confidence: "Caregiver Logged",
      current: "Eats kumol saul and curd with relish; washes hands; takes afternoon rest predictably.",
      scaffolding: "Medication placed in morning brass compartment; Anu provides warm milk and verbal verification.",
      icon: Coffee,
    },
  ];

  const dailyRhythm = [
    { time: "06:30 AM", activity: "Wake & Veranda Sunlight", status: "Independent", type: "autonomous" },
    { time: "07:15 AM", activity: "Morning Black Ginger Tea", status: "Independent", type: "autonomous" },
    { time: "08:30 AM", activity: "Breakfast (Kumol Saul) & Morning Cardioprotective Tablet", status: "Supervised by Anu", type: "supported" },
    { time: "10:00 AM", activity: "Betel Courtyard Walk / Tablet Photo Reminiscence", status: "Active (14 min)", type: "autonomous" },
    { time: "01:00 PM", activity: "Mid-day Traditional Lunch & Quiet Nap", status: "Independent", type: "autonomous" },
    { time: "04:00 PM", activity: "Veranda Transition & Warm Cardamom Tea", status: "Guided Scaffolding", type: "supported" },
    { time: "05:00 PM", activity: "Granddaughter Rina Video Call", status: "Family Presence", type: "supported" },
    { time: "06:45 PM", activity: "Gosai-Ghar Evening Prayer & Earthen Lamp", status: "Assisted by Anu", type: "supported" },
    { time: "08:30 PM", activity: "Light Dinner, Bedside Foot Massage & Deep Sleep", status: "Caregiver Supported", type: "supported" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Overview Banner */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f2ede4] border border-[#c2c8c1]/60 flex items-center justify-center text-[#1a3826] shrink-0 font-serif font-bold text-2xl">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-[#032212]">
                  Purnima Devi (Aitâ)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00]">
                  Age 74 · Tezpur, Assam
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#424843] mt-1 max-w-2xl leading-relaxed">
                Comprehensive living profile maintained by daughter Anu. Grounded in lifelong Tezpur domestic routines, familiar river valley sensory anchors, and affectionate family presence.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSupportModal}
            className="shrink-0 px-4 py-2.5 rounded-xl border border-[#c2c8c1] bg-[#f8f3ea] hover:bg-[#f2ede4] text-xs font-semibold text-[#032212] transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>Current: Level {supportLevel} Guide</span>
            <ChevronRight size={14} className="text-[#904d00]" />
          </button>
        </div>
      </div>

      {/* 8-Domain Capability Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#032212]">
              Living Capability Matrix (Personal Baseline)
            </h2>
            <p className="text-xs text-[#424843]">
              Objective functional strengths and tailored gentle scaffolding — never clinical diagnostic labels.
            </p>
          </div>
          <span className="text-xs text-[#1a3826] font-semibold bg-[#c8ebd1] px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={14} /> 6 Domains Synchronized
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {capabilityDomains.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-[#ffffff] border border-[#c2c8c1] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#1a3826]/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#f2ede4] text-[#1a3826]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#032212]">{cap.domain}</h3>
                      <span className="text-[11px] text-[#904d00] font-semibold">{cap.status}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#f8f3ea] px-2 py-0.5 rounded-md text-[#727972] border border-[#c2c8c1]/40">
                    {cap.confidence}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#f8f3ea]/70 rounded-xl">
                    <span className="font-bold text-[#032212] block mb-0.5">Observed Strength:</span>
                    <p className="text-[#424843] leading-relaxed">{cap.current}</p>
                  </div>
                  <div className="p-3 bg-[#f2ede4]/70 rounded-xl">
                    <span className="font-bold text-[#1a3826] block mb-0.5">Gentle Scaffolding:</span>
                    <p className="text-[#1d1c16] leading-relaxed">{cap.scaffolding}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Independence & Scaffolding Timeline */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#c2c8c1]/40 pb-3">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#032212]">
              Aitâ’s Typical Daily Rhythm & Care Scaffolding
            </h2>
            <p className="text-xs text-[#424843]">
              Balancing dignified independence with calm, affectionate family assistance throughout the day.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#c2c8c1]/30">
          {dailyRhythm.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-[#1a3826] w-20 shrink-0">
                  {item.time}
                </span>
                <span className="font-medium text-[#032212]">{item.activity}</span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                  item.type === "autonomous"
                    ? "bg-[#c8ebd1] text-[#022111]"
                    : "bg-[#ffdcc3] text-[#904d00]"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
