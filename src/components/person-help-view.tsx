"use client";

import { AlertCircle, CheckCircle2, Heart, Home, Phone, PhoneCall, ShieldCheck, UserCheck } from "lucide-react";
import { CompanionPanel } from "@/components/companion-panel";
import type { CompanionTurn, VoiceCapability } from "@/lib/api";

type PersonHelpViewProps = {
  sendTurn: (message: string) => Promise<CompanionTurn>;
  voice: VoiceCapability | null;
  onQuickCall: (name: string, phone: string) => void;
};

export function PersonHelpView({ sendTurn, voice, onQuickCall }: PersonHelpViewProps) {
  return (
    <div className="w-full max-w-7xl mx-auto pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Reassurance, 1-Tap Call, Safe Return Card, Tele-MANAS */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* 1. Safe Reassurance Banner */}
          <section
            aria-label="Reassurance banner"
            className="bg-[#5e6f4a] text-[#fffdf8] rounded-2xl p-5 sm:p-7 shadow-md"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={30} className="text-[#d8b878] shrink-0" />
              <h2 className="font-serif text-2xl sm:text-3xl font-normal">
                You are completely safe.
              </h2>
            </div>
            <p className="text-base sm:text-lg text-[#f7eadc] mt-2.5 leading-relaxed">
              You are at your home in Tezpur, Assam. Anu is right nearby in the next room, and we are right here with you.
            </p>
          </section>

          {/* 2. Immediate One-Tap Call to Caregiver */}
          <section aria-label="Direct help call" className="flex flex-col gap-2">
            <h3 className="text-lg font-serif text-[#332f29] font-normal">
              Immediate Contact
            </h3>

            <button
              type="button"
              onClick={() => onQuickCall("Anu (Daughter)", "+91 98640 12345")}
              className="flex items-center justify-between p-4 sm:p-5 min-h-[76px] bg-[#a85e46] hover:bg-[#8e3d3d] active:scale-[0.99] text-white rounded-2xl transition-all shadow-md"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <PhoneCall size={26} />
                </div>
                <div>
                  <p className="text-xl font-bold">Call Anu (Daughter)</p>
                  <p className="text-xs sm:text-sm text-[#fbf1e3]">In the house · +91 98640 12345</p>
                </div>
              </div>
              <span className="text-sm uppercase tracking-wider font-bold bg-white/20 px-3.5 py-1.5 rounded-xl">
                Tap to Call
              </span>
            </button>
          </section>

          {/* 3. Safe Return Card (For identification if away from home) */}
          <section
            aria-label="Safe Return Identity Card"
            className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[#e6ddcf] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-[#5e6f4a]" />
                <h3 className="font-serif text-lg font-bold text-[#332f29]">
                  Safe Return Card
                </h3>
              </div>
              <span className="text-[11px] font-bold uppercase text-[#5e6f4a] bg-[#eee1cc] px-2.5 py-0.5 rounded-md">
                Emergency Identity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <div>
                <span className="text-[11px] uppercase text-[#6b6b63] font-bold">Name</span>
                <p className="text-lg font-bold text-[#332f29]">Purnima Devi (Aitâ)</p>
              </div>

              <div>
                <span className="text-[11px] uppercase text-[#6b6b63] font-bold">Age</span>
                <p className="text-lg font-bold text-[#332f29]">78 years</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] uppercase text-[#6b6b63] font-bold">Home Address</span>
                <p className="text-base font-medium text-[#332f29]">
                  Ward 4, Tezpur, Sonitpur District, Assam 784001
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase text-[#6b6b63] font-bold">Primary Caregiver</span>
                <p className="text-base font-bold text-[#a85e46]">Anu Devi (Daughter)</p>
                <p className="text-xs text-[#6b6b63]">+91 98640 12345</p>
              </div>

              <div>
                <span className="text-[11px] uppercase text-[#6b6b63] font-bold">Medical Notes</span>
                <p className="text-sm text-[#332f29]">Blood Group B+ · No drug allergies</p>
              </div>
            </div>

            <p className="text-xs text-[#6b6b63] italic mt-3 pt-3 border-t border-[#e6ddcf]">
              "If you meet me and I appear confused or away from home, please kindly call my daughter Anu at the number above."
            </p>
          </section>

          {/* 4. National Tele-MANAS (24x7 Free Helpline) */}
          <section aria-label="National Helplines" className="bg-[#f7eadc] border border-[#e6ddcf] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8e3d3d] uppercase tracking-wider">
                  <Heart size={14} fill="currentColor" />
                  National Tele-MANAS Mental Health Helpline
                </div>
                <h4 className="text-lg font-bold text-[#332f29] mt-0.5">
                  Call 14416 (Toll-Free 24x7)
                </h4>
                <p className="text-xs text-[#6b6b63]">
                  Government of India dedicated support line.
                </p>
              </div>

              <a
                href="tel:14416"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8e3d3d] hover:bg-[#6f3d35] active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm shrink-0"
              >
                <Phone size={16} />
                <span>Call 14416</span>
              </a>
            </div>
          </section>
        </div>

        {/* Right Column: Talk to MindMitra for immediate comfort */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <section aria-label="Talk to MindMitra" className="bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="mb-3">
              <h3 className="text-xl sm:text-2xl font-serif text-[#332f29] font-normal flex items-center gap-2">
                <span>Tell MindMitra how you feel</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#d8b878] text-[#332f29] rounded-full">
                  Instant Reassurance
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-[#6b6b63] mt-1">
                MindMitra is here with you. Ask where you are or ask for your family anytime.
              </p>
            </div>

            <CompanionPanel
              prompt="I need help and reassurance."
              sendTurn={sendTurn}
              voice={voice}
              onAction={(action) => {
                if (action.type === "call_contact" && action.target) {
                  onQuickCall(action.target, action.phone || "+91 98640 12345");
                }
              }}
              quickPrompts={[
                "Where am I right now?",
                "Can I talk to Anu?",
                "I feel a little anxious",
                "What is today's schedule?",
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
