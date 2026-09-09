import { useState } from "react";
import { NavBar, type NavTab } from "@/components/nav-bar";
import { PersonApp } from "@/components/person-app";
import CaregiverDemoPage from "@/demo/caregiver/page";
import DeliriumDemoPage from "@/demo/delirium/page";
import FirewallDemoPage from "@/demo/firewall/page";
import MQDemoPage from "@/demo/mq/page";
import SafetyDemoPage from "@/demo/safety/page";
import { AshaView } from "@/components/asha-view";
import { ClinicalView } from "@/components/clinical-view";
import { ArrowLeft, Heart, Shield, User } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("person");

  const isPersonApp = activeTab === "person";

  return (
    <div className="min-h-screen bg-[--color-bg] text-[--color-text] flex flex-col font-sans selection:bg-[--color-highlight] selection:text-[--color-text]">
      {/* 
        ARCHITECTURAL PURITY:
        Clinical / Administrative navigation tabs are STRICTLY HIDDEN from the Person Application.
        Only when an evaluator or clinician enters a clinical portal is the administrative NavBar rendered.
      */}
      {!isPersonApp && (
        <header className="sticky top-0 z-40 bg-[#eee1cc] border-b border-[#e6ddcf] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("person")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#5e6f4a] hover:bg-[#48583a] active:scale-95 text-white rounded-lg font-bold text-sm transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>Return to Person App (Purnima)</span>
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-[#a85e46]">
              Clinical & Caregiver Subsystems Portal
            </span>
          </div>

          <NavBar activeTab={activeTab} onSelectTab={setActiveTab} />
        </header>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 w-full">
        {isPersonApp ? (
          <PersonApp />
        ) : (
          <main className="mx-auto max-w-6xl px-4 py-8">
            {activeTab === "caregiver" && <CaregiverDemoPage />}
            {activeTab === "asha" && <AshaView />}
            {activeTab === "clinical" && <ClinicalView />}
            {activeTab === "safety" && <SafetyDemoPage />}
            {activeTab === "mq" && <MQDemoPage />}
            {activeTab === "firewall" && <FirewallDemoPage />}
            {activeTab === "delirium" && <DeliriumDemoPage />}
          </main>
        )}
      </div>

      {/* 
        Evaluator & Role Portal Switcher 
        In Person App mode, this sits discreetly at the bottom so evaluators can inspect
        all 4 distinct surfaces while keeping the Person App experience dignified and free of clinical pollution.
      */}
      <footer className="border-t border-[--color-border] bg-[#f5e5d1]/70 py-3.5 px-4 text-xs text-[--color-text-sub] mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span className="font-bold text-[--color-primary]">MindMitra Architecture:</span>
            <span className="text-[--color-text-sub]">4 Distinct Roles on 1 Shared Intelligence Platform</span>
          </div>

          {/* Quick Role Portal Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center" aria-label="Role Switcher">
            <button
              type="button"
              onClick={() => setActiveTab("person")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === "person"
                  ? "bg-[#5e6f4a] text-white shadow-sm"
                  : "bg-[#eee1cc] text-[#332f29] hover:bg-[#d8b878]/50"
              }`}
            >
              👤 Person App
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("caregiver")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === "caregiver"
                  ? "bg-[#a85e46] text-white shadow-sm"
                  : "bg-[#eee1cc] text-[#332f29] hover:bg-[#d8b878]/50"
              }`}
            >
              🏡 Caregiver Copilot
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("asha")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === "asha"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-[#eee1cc] text-[#332f29] hover:bg-[#d8b878]/50"
              }`}
            >
              🩺 ASHA Caseload
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("clinical")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === "clinical"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "bg-[#eee1cc] text-[#332f29] hover:bg-[#d8b878]/50"
              }`}
            >
              🏥 Clinical Bridge
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("safety")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === "safety"
                  ? "bg-[#6f3d35] text-white shadow-sm"
                  : "bg-[#eee1cc] text-[#332f29] hover:bg-[#d8b878]/50"
              }`}
            >
              🛡️ Safety Gateway
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[--color-accent] font-semibold">
              <Heart size={12} fill="currentColor" /> Tele-MANAS: <a href="tel:14416" className="underline font-bold">14416</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
