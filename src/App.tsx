import React, { useState } from "react";
import { NavBar } from "./components/NavBar";
import { PersonApp } from "./components/PersonApp";
import { CaregiverCopilot } from "./components/CaregiverCopilot";
import { CHWCopilot } from "./components/CHWCopilot";
import { ClinicalBridge } from "./components/ClinicalBridge";
import { DemosView } from "./components/DemosView";
import { PrototypesView } from "./components/PrototypesView";
import { AssetStudioView } from "./components/AssetStudioView";
import type { RoleSurface } from "./types";

export default function App() {
  const [currentSurface, setCurrentSurface] = useState<RoleSurface>("person");

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
    </div>
  );
}
