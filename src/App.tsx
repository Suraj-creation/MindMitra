import React, { useState, useEffect } from "react";
import { NavBar } from "./components/NavBar";
import { PersonApp } from "./components/PersonApp";
import { CaregiverCopilot } from "./components/CaregiverCopilot";
import { CHWCopilot } from "./components/CHWCopilot";
import { ClinicalBridge } from "./components/ClinicalBridge";
import { DemosView } from "./components/DemosView";
import { PrototypesView } from "./components/PrototypesView";
import { AssetStudioView } from "./components/AssetStudioView";
import { CompanionProvider, useCompanion } from "./context/CompanionContext";
import { FloatingVoiceCompanion } from "./components/FloatingVoiceCompanion";
import type { RoleSurface } from "./types";

function AppContent() {
  const [currentSurface, setCurrentSurface] = useState<RoleSurface>("person");
  const companion = useCompanion();

  useEffect(() => {
    companion.updateContext({
      surface: currentSurface,
      route: `/${currentSurface}`,
    });
  }, [currentSurface, companion.updateContext]);

  return (
    <div className="min-h-screen bg-[--color-bg] text-[--color-text] flex flex-col font-sans selection:bg-[--color-highlight] selection:text-[--color-text]">
      <NavBar currentSurface={currentSurface} onSelectSurface={setCurrentSurface} />

      {currentSurface === "person" ? (
        <PersonApp onSelectSurface={setCurrentSurface} />
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {currentSurface === "caregiver" && <CaregiverCopilot />}
          {currentSurface === "asha" && <CHWCopilot />}
          {currentSurface === "clinical" && <ClinicalBridge />}
          {currentSurface === "demos" && <DemosView />}
          {currentSurface === "prototypes" && <PrototypesView />}
          {currentSurface === "assets" && <AssetStudioView />}
        </main>
      )}

      {/* Floating Conversational Voice-to-Voice Companion across the whole page */}
      <FloatingVoiceCompanion />
    </div>
  );
}

export default function App() {
  return (
    <CompanionProvider>
      <AppContent />
    </CompanionProvider>
  );
}

