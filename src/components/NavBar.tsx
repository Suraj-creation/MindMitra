import React from "react";
import {
  HeartHandshake,
  User,
  Users,
  Stethoscope,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { RoleSurface } from "../types";

interface NavBarProps {
  currentSurface: RoleSurface;
  onSelectSurface: (surface: RoleSurface) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentSurface, onSelectSurface }) => {
  return (
    <header className="border-b border-[#e6ddcf] bg-[#fbf1e3]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSurface("person")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#5e6f4a] flex items-center justify-center text-white shadow-sm group-hover:bg-[#48583a] transition-colors">
              <HeartHandshake size={20} />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight text-[#332f29] font-serif leading-none">
                MindMitra
              </div>
              <div className="text-[10px] text-[#6b6b63] font-medium tracking-wide">
                Cognitive Care Platform · SIH 2026
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => onSelectSurface("person")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "person"
                ? "bg-[#5e6f4a] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <User size={16} />
            <span>Person</span>
          </button>

          <button
            onClick={() => onSelectSurface("caregiver")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "caregiver"
                ? "bg-[#a85e46] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <Users size={16} />
            <span>Caregiver</span>
          </button>

          <button
            onClick={() => onSelectSurface("chw")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "chw"
                ? "bg-[#2596a3] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <Activity size={16} />
            <span>CHW Copilot</span>
          </button>

          <button
            onClick={() => onSelectSurface("clinical")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "clinical"
                ? "bg-[#332f29] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <Stethoscope size={16} />
            <span>Clinical Bridge</span>
          </button>

          <div className="h-5 w-px bg-[#e6ddcf] mx-1 hidden md:block" />

          <button
            onClick={() => onSelectSurface("demos")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "demos"
                ? "bg-[#d97706] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Invariant Labs</span>
          </button>

          <button
            onClick={() => onSelectSurface("prototypes")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "prototypes"
                ? "bg-[#7d330a] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <Layers size={16} />
            <span>Stitch Prototypes</span>
          </button>

          <button
            onClick={() => onSelectSurface("assets")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "assets"
                ? "bg-[#5e6f4a] text-white shadow-xs font-semibold"
                : "text-[#6b6b63] hover:text-[#332f29] hover:bg-[#f7eadc]"
            }`}
          >
            <Sparkles size={16} />
            <span>Asset Studio</span>
          </button>
        </nav>

        {/* SIH Ministry Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#7a7a71] bg-[#f7eadc] border border-[#e6ddcf] px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#6b8f6b] animate-pulse" />
          <span className="font-medium text-[#332f29]">PS26003 (MDoNER)</span>
        </div>
      </div>
    </header>
  );
};
