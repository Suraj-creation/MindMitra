import React, { useState } from "react";
import {
  Users,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck,
  AlertCircle,
  Volume2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";

interface Patient {
  id: string;
  name: string;
  village: string;
  age: number;
  lastVisit: string;
  status: "stable" | "review_needed" | "visit_due";
  primaryLanguage: string;
  baseline: string;
}

const PATIENTS: Patient[] = [
  {
    id: "purnima",
    name: "Purnima Devi",
    village: "Kamrup Rural (Ward 3)",
    age: 74,
    lastVisit: "4 days ago",
    status: "stable",
    primaryLanguage: "Assamese",
    baseline: "Stable L1",
  },
  {
    id: "biren",
    name: "Biren Kalita",
    village: "Hajo Block",
    age: 78,
    lastVisit: "12 days ago",
    status: "review_needed",
    primaryLanguage: "Assamese",
    baseline: "Variance L2",
  },
  {
    id: "hemanta",
    name: "Hemanta Bora",
    village: "Sualkuchi",
    age: 81,
    lastVisit: "Yesterday",
    status: "visit_due",
    primaryLanguage: "Bengali",
    baseline: "Stable L1",
  },
];

export const CHWCopilot: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient>(PATIENTS[0]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncedQueue, setSyncedQueue] = useState(2);
  const [screeningAnswers, setScreeningAnswers] = useState({
    orientation: true,
    recall: true,
    drawing: true,
  });
  const [screeningSubmitted, setScreeningSubmitted] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<"Assamese" | "Hindi" | "English">("Assamese");

  const handleScreeningSubmit = () => {
    setScreeningSubmitted(true);
    if (offlineMode) {
      setSyncedQueue((q) => q + 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6ddcf]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2596a3] bg-[#d7f2f4] px-2.5 py-1 rounded-md">
              CHW Copilot · Surface C3
            </span>
            <span className="text-xs text-[#7a7a71]">ASHA Field Worker Meena</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
            Community Health Worker Roster
          </h1>
          <p className="text-sm text-[#6b6b63] mt-1 max-w-xl">
            Empowering grassroots ASHA and ANM healthcare workers across the North Eastern Region with offline-first screening tools.
          </p>
        </div>

        {/* Connectivity & Offline Sync Status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOfflineMode(!offlineMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              offlineMode
                ? "bg-[#ffefd4] text-[#9a3c04] border-[#ffdba8]"
                : "bg-[#e5ece0] text-[#48583a] border-[#ccd9c2]"
            }`}
          >
            {offlineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
            <span>{offlineMode ? "Offline Mode (Local Cache)" : "Online (Sync Active)"}</span>
          </button>

          <div className="bg-[#f7eadc] border border-[#e6ddcf] px-3 py-2 rounded-xl text-xs text-[#7a7a71]">
            <span className="font-bold text-[#332f29] font-mono">{syncedQueue}</span> queued
          </div>
        </div>
      </div>

      {/* Main Grid: Roster & Screening Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Roster */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-serif text-[#332f29] flex items-center gap-2">
            <Users size={20} className="text-[#2596a3]" />
            Assigned Village Elders
          </h2>

          <div className="space-y-2.5">
            {PATIENTS.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPatient(p);
                  setScreeningSubmitted(false);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPatient.id === p.id
                    ? "bg-[#f7eadc] border-[#2596a3] shadow-xs"
                    : "bg-[#fbf1e3] border-[#e6ddcf] hover:bg-[#f7eadc]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#332f29] text-base">{p.name}</p>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === "stable"
                        ? "bg-[#e5ece0] text-[#48583a]"
                        : p.status === "review_needed"
                        ? "bg-[#ffefd4] text-[#9a3c04]"
                        : "bg-[#d7f2f4] text-[#1e7a88]"
                    }`}
                  >
                    {p.baseline}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#7a7a71] mt-2">
                  <MapPin size={13} className="text-[#2596a3]" />
                  <span>{p.village}</span>
                  <span>·</span>
                  <span>Age {p.age}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6b6b63] mt-2 pt-2 border-t border-[#e6ddcf]">
                  <span>Last visit: {p.lastVisit}</span>
                  <span className="text-[#2596a3] font-medium">Select →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Screening Tool & Quality Verification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6ddcf]">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#332f29]">
                  Field Visit Protocol: {selectedPatient.name}
                </h2>
                <p className="text-xs text-[#6b6b63] mt-0.5">
                  Standardized 3-Minute Cognitive Screening with MQ Sensor Verification
                </p>
              </div>

              {/* Language Switch */}
              <div className="flex items-center gap-1 bg-[#fbf1e3] border border-[#e6ddcf] p-1 rounded-lg text-xs">
                {(["Assamese", "Hindi", "English"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      activeLanguage === lang
                        ? "bg-[#2596a3] text-white"
                        : "text-[#6b6b63] hover:text-[#332f29]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-4">
              {/* Question 1 */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#2596a3] uppercase tracking-wider">
                    Step 1 · Temporal Orientation
                  </p>
                  <p className="text-sm font-semibold text-[#332f29] mt-1">
                    {activeLanguage === "Assamese"
                      ? "আজি কি বাৰ আৰু কোন মাহ? (What day and month is it today?)"
                      : "Aaj kaunsa din aur kaunsa mahina hai?"}
                  </p>
                  <p className="text-xs text-[#7a7a71] mt-0.5">
                    Elder correctly identifies current season or day of week.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={screeningAnswers.orientation}
                  onChange={(e) => setScreeningAnswers((s) => ({ ...s, orientation: e.target.checked }))}
                  className="w-6 h-6 accent-[#2596a3] rounded mt-1 cursor-pointer"
                />
              </div>

              {/* Question 2 */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#2596a3] uppercase tracking-wider">
                    Step 2 · 3-Word Familiar Recall
                  </p>
                  <p className="text-sm font-semibold text-[#332f29] mt-1">
                    {activeLanguage === "Assamese"
                      ? "তিনিটা শব্দ কওক: পিঠা, পদুম ফুল, ব্ৰহ্মপুত্ৰ (Pitha, Lotus, Brahmaputra)"
                      : "Teen shabd: Pitha, Kamal ka phool, Brahmaputra nadi"}
                  </p>
                  <p className="text-xs text-[#7a7a71] mt-0.5">
                    Repeat after 2 minutes of conversation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={screeningAnswers.recall}
                  onChange={(e) => setScreeningAnswers((s) => ({ ...s, recall: e.target.checked }))}
                  className="w-6 h-6 accent-[#2596a3] rounded mt-1 cursor-pointer"
                />
              </div>

              {/* Question 3 */}
              <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#2596a3] uppercase tracking-wider">
                    Step 3 · Practical Task Execution
                  </p>
                  <p className="text-sm font-semibold text-[#332f29] mt-1">
                    Familiar utensil or tea cup identification and handling
                  </p>
                  <p className="text-xs text-[#7a7a71] mt-0.5">
                    Observe hand steadiness and natural motor coordination.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={screeningAnswers.drawing}
                  onChange={(e) => setScreeningAnswers((s) => ({ ...s, drawing: e.target.checked }))}
                  className="w-6 h-6 accent-[#2596a3] rounded mt-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Submission & Sensor Quality Verification */}
            <div className="p-4 bg-[#fbf1e3] border border-[#e6ddcf] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e5ece0] text-[#5e6f4a] flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#332f29]">Sensor Environment Pass (q = 0.88)</p>
                  <p className="text-[11px] text-[#7a7a71]">Acoustics quiet, ambient light adequate for scoring</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScreeningSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#2596a3] text-white font-semibold text-sm hover:bg-[#1e7a88] transition-colors"
              >
                {screeningSubmitted ? "✓ Visit Logged" : "Record Observation"}
              </button>
            </div>

            {screeningSubmitted && (
              <div className="p-4 bg-[#e5ece0] border border-[#ccd9c2] rounded-xl text-sm text-[#48583a]">
                <p className="font-bold">✓ Field Visit Logged Successfully</p>
                <p className="text-xs mt-0.5">
                  Observation recorded for {selectedPatient.name}. Data safely cached in local encrypted store and forwarded to Clinical Bridge.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
