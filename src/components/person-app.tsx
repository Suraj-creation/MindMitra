"use client";

import { CalendarDays, Heart, Phone, PhoneOff, Sun, Sparkles, Volume2, Globe, Leaf } from "lucide-react";
import { useEffect, useState } from "react";

import { PersonNavigation, type PersonSection } from "@/components/person-navigation";
import { PersonDayView } from "@/components/person-day-view";
import { PersonLifeView } from "@/components/person-life-view";
import { PersonActivityView } from "@/components/person-activity-view";
import { PersonPeopleView } from "@/components/person-people-view";
import { PersonHelpView } from "@/components/person-help-view";
import { PersistentCompanionDrawer } from "@/components/persistent-companion-drawer";
import { api, type VoiceCapability } from "@/lib/api";
import {
  getStoredAccessToken,
  setStoredAccessToken,
  type PersonSessionState,
} from "@/lib/person-session";
import { getStoredOnboardingProfile, type OnboardingProfile } from "@/lib/onboarding-state";
import { speakWarmly } from "@/lib/empathic-speech";

type PersonAppProps = {
  initialState?: Extract<PersonSessionState, { kind: "ready" }>;
  onRevisitOnboarding?: () => void;
};

const DEMO_PERSON_ID = "person:purnima";
const DEMO_DEVICE_SECRET = "mindmitra-demo-device";

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function PersonApp({ initialState, onRevisitOnboarding }: PersonAppProps) {
  const [activeSection, setActiveSection] = useState<PersonSection>("day");
  const [state, setState] = useState<Extract<PersonSessionState, { kind: "ready" }> | null>(
    initialState ?? null,
  );
  const [voice, setVoice] = useState<VoiceCapability | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [startupError, setStartupError] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<"as" | "en">("as");
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(() =>
    getStoredOnboardingProfile(),
  );

  useEffect(() => {
    setOnboardingProfile(getStoredOnboardingProfile());
  }, []);

  // Quick call overlay state
  const [callingContact, setCallingContact] = useState<{ name: string; phone: string } | null>(null);
  const [callConnected, setCallConnected] = useState(false);

  useEffect(() => {
    setDateLabel(todayLabel());
  }, []);

  useEffect(() => {
    if (initialState) return;

    async function startDemoSession() {
      try {
        const existingToken = getStoredAccessToken();
        const token = existingToken ?? (await api.loginDevice(DEMO_PERSON_ID, DEMO_DEVICE_SECRET)).accessToken;
        if (!existingToken) setStoredAccessToken(token);

        const person = await api.getPersonSession(token);
        setState({ kind: "ready", token, person });
        setVoice(await api.getVoiceCapability(token, person.personId));
      } catch {
        setStartupError(true);
      }
    }

    void startDemoSession();
  }, [initialState]);

  const handleQuickCall = (name: string, phone: string) => {
    setCallingContact({ name, phone });
    setCallConnected(false);
    setTimeout(() => {
      setCallConnected(true);
    }, 1800);
  };

  const endCall = () => {
    setCallingContact(null);
    setCallConnected(false);
  };

  const handleReadPageGuidance = () => {
    const welcome = "নমস্কাৰ পূৰ্ণিমা বাইদেউ। আপুনি এতিয়া মাই ডে পৃষ্ঠাত আছে। আজি দিনটো শান্ত আৰু সুন্দৰ। Namaskar Purnima baideu. You are peacefully at home on your Day page.";
    speakWarmly(welcome);
  };

  if (state === null) {
    return (
      <main aria-busy="true" className="min-h-screen bg-[#fef9f0] flex items-center justify-center p-6 text-[#1d1c16]">
        <section aria-live="polite" className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a3826] text-white flex items-center justify-center mx-auto shadow-md">
            <Leaf size={32} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#032212]">MindMitra</h1>
          <p className="text-base text-[#424843]">
            {startupError
              ? "MindMitra is not ready yet. Please start the demo data and try again."
              : "Getting your day ready, Purnima baideu…"}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fef9f0] text-[#1d1c16] flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col flex-1">
        {/* ── Top Header: Brahmaputra Mist & Living Silk Design ───────────── */}
        <header className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#c2c8c1] mb-6">
          {/* Left Brand & Regional Context */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1a3826] text-white flex items-center justify-center shadow-xs shrink-0">
              <Leaf size={22} className="text-[#c8ebd1]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-[#032212] tracking-tight">
                  MindMitra
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#c8ebd1]/60 text-[#1a3826] text-xs font-bold">
                  Elder Sanctuary
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#424843] flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-[#1a3826]">বৃহস্পতিবাৰ, ১০ ছেপ্টেম্বৰ</span>
                <span>·</span>
                <span>Thursday, 10 Sep · তেজপুৰ (Tezpur)</span>
              </p>
            </div>

            {onRevisitOnboarding && (
              <button
                type="button"
                onClick={onRevisitOnboarding}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f3ea] hover:bg-[#ece8df] border border-[#c2c8c1] text-xs font-bold text-[#1a3826] transition-colors shadow-2xs ml-2"
                title="Revisit the Northeast Onboarding Journey"
              >
                <Sparkles size={13} className="text-[#d97706]" />
                <span>Northeast Journey</span>
              </button>
            )}
          </div>

          {/* Desktop Navigation Links (Center) */}
          <div className="hidden lg:flex items-center">
            <PersonNavigation active={activeSection} onChange={setActiveSection} />
          </div>

          {/* Right Cultural Actions: Audio Guidance, Language Toggle, Profile */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {/* Audio Guidance Button */}
            <button
              type="button"
              onClick={handleReadPageGuidance}
              className="p-2.5 rounded-xl bg-[#f8f3ea] hover:bg-[#ece8df] border border-[#c2c8c1] text-[#1a3826] transition-colors shadow-2xs"
              title="Read guidance aloud"
              aria-label="Read guidance aloud"
            >
              <Volume2 size={20} />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setCurrentLocale(currentLocale === "as" ? "en" : "as")}
              className="px-3.5 py-2 rounded-xl bg-[#f8f3ea] hover:bg-[#ece8df] border border-[#c2c8c1] text-xs font-bold text-[#1a3826] flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Toggle Assamese / English"
            >
              <Globe size={16} />
              <span>{currentLocale === "as" ? "অসমীয়া (AS)" : "English (EN)"}</span>
            </button>

            {/* Profile Avatar & Name */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#c2c8c1]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA30g1OtRbXuLnnOBlKgd1XWU8vW4UOQQQ-ZBLBqwiGFxcxoj8iZ4O0QWTUEtPvkcmNgEIkBVckoOjd_g9UJWxFn78ozCv9YpnNKUtUf8jva0JMInEkXQKXAHKZ-YGejQDlC0NXCIV5Ijq1xNlMLUOLsUNtkPLlRk1cFdmyfwruXamQJgwrl-Gn9ssNtD9F1At8ZkMojiYiaEB8x0wsm-LqrnCRBZ8CQ7eXixKYhAGz0aEXfCkpg3SU"
                alt="Purnima Devi"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#1a3826]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/images/muga_silk_weave_1788980069393.jpg";
                }}
              />
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-bold text-[#032212]">
                  {onboardingProfile.honorific || "পূৰ্ণিমা"} {onboardingProfile.name || "দেৱী"}
                </p>
                <p className="text-xs text-[#727972]">তেজপুৰ, অসম</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content Views ─────────────────────────────────────────── */}
        <div className="flex-1 w-full">
          {activeSection === "day" && (
            <PersonDayView
              displayName={onboardingProfile.name || state.person.displayName}
              onNavigate={setActiveSection}
              sendTurn={(msg) => api.sendCompanionTurn(state.token, state.person.personId, msg, { surface: "day" })}
              voice={voice}
              onQuickCall={handleQuickCall}
            />
          )}

          {activeSection === "life" && <PersonLifeView />}

          {activeSection === "activity" && <PersonActivityView />}

          {activeSection === "people" && (
            <PersonPeopleView onQuickCall={handleQuickCall} />
          )}

          {activeSection === "help" && (
            <PersonHelpView
              sendTurn={(msg) => api.sendCompanionTurn(state.token, state.person.personId, msg, { surface: "help" })}
              voice={voice}
              onQuickCall={handleQuickCall}
            />
          )}
        </div>

        {/* Persistent Voice Companion Drawer */}
        <PersistentCompanionDrawer
          currentSection={activeSection}
          isOpen={isCompanionOpen}
          onNavigate={setActiveSection}
          onQuickCall={handleQuickCall}
          onToggle={setIsCompanionOpen}
          sendTurn={(msg, ctx) =>
            api.sendCompanionTurn(state.token, state.person.personId, msg, {
              surface: activeSection,
              ...ctx,
            })
          }
          voice={voice}
        />

        {/* Mobile / Tablet Bottom Navigation Dock */}
        <div className="sticky bottom-0 bg-[#fef9f0]/95 backdrop-blur-md pt-3 pb-3 lg:hidden w-full z-30">
          <PersonNavigation active={activeSection} onChange={setActiveSection} />
        </div>

        {/* Simulated Gentle Family Phone Call Dialog */}
        {callingContact && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div className="bg-[#fef9f0] border-2 border-[#1a3826] rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-4 ${
                  callConnected ? "bg-[#1a3826] scale-105" : "bg-[#1a3826] animate-pulse"
                }`}
              >
                <Phone size={44} className={callConnected ? "" : "animate-bounce"} />
              </div>

              <h3 className="font-serif text-3xl font-bold text-[#032212]">
                {callingContact.name}
              </h3>
              <p className="text-sm font-medium text-[#424843] mt-1">
                {callingContact.phone}
              </p>

              <p className="text-lg text-[#1a3826] font-serif font-medium mt-4">
                {callConnected ? "Connected · Speaking with your family" : "Calling gently…"}
              </p>

              <button
                type="button"
                onClick={endCall}
                className="mt-8 w-full py-4 bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <PhoneOff size={24} />
                <span>End Call</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
