"use client";

import { CalendarDays, Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { CompanionPanel } from "@/components/companion-panel";
import { PersonNavigation, type PersonSection } from "@/components/person-navigation";
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

const sectionContent: Record<
  PersonSection,
  { title: string; description: string; prompt: string }
> = {
  day: {
    title: "What would you like to do now?",
    description: "We can look at your day together, at your own pace.",
    prompt: "What is happening today?",
  },
  life: {
    title: "Let’s look at something familiar.",
    description: "We can talk about someone, a place, a photograph, or a song.",
    prompt: "Show me my family.",
  },
  activity: {
    title: "Let’s choose something that feels good.",
    description: "We can find a gentle activity for this moment.",
    prompt: "What could we do together now?",
  },
  help: {
    title: "How can we help right now?",
    description: "You can ask for help in your own words. We will take it one step at a time.",
    prompt: "I need help.",
  },
};

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

  if (state === null) {
    return (
      <main aria-busy="true" className="person-shell person-shell--setup">
        <section aria-live="polite" className="person-setup">
          <p className="person-wordmark">MindMitra</p>
          <p className="person-loading">
            {startupError ? "MindMitra is not ready yet. Please start the demo data and try again." : "Getting your day ready…"}
          </p>
        </section>
      </main>
    );
  }

  const content = sectionContent[activeSection];

  return (
    <main className="person-shell">
      <header className="person-header">
        <p className="person-wordmark">MindMitra</p>
        <p className="person-date">
          <CalendarDays aria-hidden="true" size={22} strokeWidth={1.8} />
          <span suppressHydrationWarning>{dateLabel}</span>
        </p>
      </header>

      <section aria-labelledby="person-title" className="person-stage">
        <h1 id="person-title">{content.title}</h1>
        <p className="person-introduction">Hello, {state.person.displayName}. {content.description}</p>

        <CompanionPanel
          prompt={content.prompt}
          sendTurn={(message) => api.sendCompanionTurn(state.token, state.person.personId, message)}
          voice={voice}
        />

        {activeSection === "help" && (
          <p className="person-help-note">
            <Heart aria-hidden="true" size={22} fill="currentColor" strokeWidth={1.8} />
            If you feel unsafe, say so or tap the button above. We will help you take the next step.
          </p>
        )}
      </section>

      <PersonNavigation active={activeSection} onChange={setActiveSection} />
    </main>
  );
}
