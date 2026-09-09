"use client";

import { CalendarDays, Heart, Phone, PhoneOff, Sun } from "lucide-react";
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

type PersonAppProps = {
  initialState?: Extract<PersonSessionState, { kind: "ready" }>;
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

export function PersonApp({ initialState }: PersonAppProps) {
  const [activeSection, setActiveSection] = useState<PersonSection>("day");
  const [state, setState] = useState<Extract<PersonSessionState, { kind: "ready" }> | null>(
    initialState ?? null,
  );
  const [voice, setVoice] = useState<VoiceCapability | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [startupError, setStartupError] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

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

  if (state === null) {
    return (
      <main aria-busy="true" className="person-shell person-shell--setup">
        <section aria-live="polite" className="person-setup">
          <p className="person-wordmark">MindMitra</p>
          <p className="person-loading">
            {startupError
              ? "MindMitra is not ready yet. Please start the demo data and try again."
              : "Getting your day ready, Purnima baideu…"}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="person-shell relative">
      {/* MindMitra Person Header - Clean, Peaceful, Non-Clinical */}
      <header className="person-header flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#e6ddcf]">
        <div className="flex items-center gap-3">
          <div>
            <p className="person-wordmark">MindMitra</p>
            <span className="text-xs font-semibold text-[#5e6f4a]">
              For Purnima Devi · Tezpur, Assam
            </span>
          </div>
        </div>

        {/* Top Desktop Navigation Bar for Laptops / Desktops */}
        <div className="hidden lg:flex items-center">
          <PersonNavigation active={activeSection} onChange={setActiveSection} />
        </div>

        <p className="person-date">
          <CalendarDays aria-hidden="true" size={20} strokeWidth={1.8} />
          <span suppressHydrationWarning>{dateLabel}</span>
        </p>
      </header>

      {/* Main Content Area per Section */}
      <div className="py-4 lg:py-6 flex-1 w-full">
        {activeSection === "day" && (
          <PersonDayView
            displayName={state.person.displayName}
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

      {/* Persistent Empathic Voice Companion Drawer */}
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

      {/* 5-Area Canonical Navigation Bar (Mobile / Tablet bottom dock, hidden on desktop/laptop) */}
      <div className="sticky bottom-0 bg-[#fbf1e3]/95 backdrop-blur-sm pt-2 pb-2 lg:hidden">
        <PersonNavigation active={activeSection} onChange={setActiveSection} />
      </div>

      {/* Simulated Gentle Family Phone Call Dialog */}
      {callingContact && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#fffaf1] border-2 border-[#5e6f4a] rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-4 ${
                callConnected ? "bg-[#5e6f4a] scale-105" : "bg-[#5e6f4a] animate-pulse"
              }`}
            >
              <Phone size={44} className={callConnected ? "" : "animate-bounce"} />
            </div>

            <h3 className="font-serif text-3xl font-bold text-[#332f29]">
              {callingContact.name}
            </h3>
            <p className="text-sm font-medium text-[#6b6b63] mt-1">
              {callingContact.phone}
            </p>

            <p className="text-lg text-[#5e6f4a] font-serif font-medium mt-4">
              {callConnected ? "Connected · Speaking with your family" : "Calling gently…"}
            </p>

            <button
              type="button"
              onClick={endCall}
              className="mt-8 w-full py-4 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <PhoneOff size={24} />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
