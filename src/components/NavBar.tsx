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
  if (currentSurface === "person") {
    return null;
  }

  return (
    <header className="border-b border-[#c2c8c1] bg-[#f8f3ea]/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSurface("person")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1a3826] flex items-center justify-center text-white shadow-sm group-hover:bg-[#2d5a3f] transition-colors">
              <HeartHandshake size={20} />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight text-[#1d1c16] font-serif leading-none">
                MindMitra
              </div>
              <div className="text-[10px] text-[#424843] font-medium tracking-wide">
                Cognitive Care Platform · SIH 2026
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => onSelectSurface("person")}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
          >
            <User size={16} />
            <span>Person App (Landing)</span>
          </button>

          <button
            onClick={() => onSelectSurface("caregiver")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "caregiver"
                ? "bg-[#904d00] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Users size={16} />
            <span>Caregiver</span>
          </button>

          <button
            onClick={() => onSelectSurface("asha")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "asha"
                ? "bg-[#0369a1] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Activity size={16} />
            <span>CHW Copilot</span>
          </button>

          <button
            onClick={() => onSelectSurface("clinical")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "clinical"
                ? "bg-[#1d1c16] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Stethoscope size={16} />
            <span>Clinical Bridge</span>
          </button>

          <div className="h-5 w-px bg-[#c2c8c1] mx-1 hidden md:block" />

          <button
            onClick={() => onSelectSurface("demos")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "demos"
                ? "bg-[#fe932c] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Invariant Labs</span>
          </button>

          <button
            onClick={() => onSelectSurface("prototypes")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "prototypes"
                ? "bg-[#904d00] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Layers size={16} />
            <span>Stitch Prototypes</span>
          </button>

          <button
            onClick={() => onSelectSurface("assets")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentSurface === "assets"
                ? "bg-[#1a3826] text-white shadow-xs font-semibold"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#ece8df]"
            }`}
          >
            <Sparkles size={16} />
            <span>Asset Studio</span>
          </button>
        </nav>

        {/* SIH Ministry Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#424843] bg-[#ece8df] border border-[#c2c8c1] px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#1a3826] animate-pulse" />
          <span className="font-medium text-[#1d1c16]">PS26003 (MDoNER)</span>
        </div>
      </div>
    </header>
  );
};
