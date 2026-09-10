import type React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, UserCheck, HeartHandshake, Stethoscope, Sliders, Lock, AlertTriangle, Home } from "lucide-react";

export type NavTab =
  | "person"
  | "caregiver"
  | "asha"
  | "clinical"
  | "mq"
  | "safety"
  | "firewall"
  | "delirium";

const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: "person", label: "Person (Purnima)", icon: Home },
  { id: "caregiver", label: "Caregiver (Anu)", icon: UserCheck },
  { id: "asha", label: "ASHA / CHW", icon: HeartHandshake },
  { id: "clinical", label: "Clinical Bridge", icon: Stethoscope },
  { id: "safety", label: "Safety Gateway", icon: ShieldCheck },
  { id: "mq", label: "Quality Gate", icon: Sliders },
  { id: "firewall", label: "Memory Firewall", icon: Lock },
  { id: "delirium", label: "L5 Delirium", icon: AlertTriangle },
];

export function NavBar({
  activeTab,
  onSelectTab,
}: {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[--color-border] bg-[#fffaf2]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-15 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab("person")}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-85 cursor-pointer"
            type="button"
          >
            <span className="font-serif font-bold text-2xl text-[--color-primary] tracking-tight">
              MindMitra
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 text-xs font-semibold rounded bg-[#ebd7ba] text-[--color-text]">
              NER Cognitive Care
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main system navigation" className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-[--color-primary] text-white shadow-xs font-semibold"
                    : "text-[--color-text-sub] hover:bg-[--color-surface] hover:text-[--color-text]"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* National Helpline Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[--color-muted] shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-[--color-success] animate-pulse" />
          <span className="font-medium text-[--color-text-sub]">Tele-MANAS: <strong className="text-[--color-accent]">14416</strong></span>
        </div>
      </div>
    </header>
  );
}
