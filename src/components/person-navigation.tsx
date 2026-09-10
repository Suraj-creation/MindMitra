"use client";

import { HeartHandshake, Home, Images, Sparkles, Users } from "lucide-react";

export type PersonSection = "day" | "life" | "activity" | "people" | "help";

const items: Array<{
  id: PersonSection;
  label: string;
  assamese: string;
  icon: typeof Home;
}> = [
  { id: "day", label: "My Day", assamese: "আজিৰ দিন", icon: Home },
  { id: "life", label: "My Life", assamese: "মোৰ জীৱন", icon: Images },
  { id: "activity", label: "Let’s Do Something", assamese: "মনৰ আনন্দ", icon: Sparkles },
  { id: "people", label: "People", assamese: "আপোন মানুহ", icon: Users },
  { id: "help", label: "Help", assamese: "সহায়", icon: HeartHandshake },
];

type PersonNavigationProps = {
  active: PersonSection;
  onChange: (section: PersonSection) => void;
  className?: string;
};

export function PersonNavigation({ active, onChange, className = "" }: PersonNavigationProps) {
  return (
    <nav
      aria-label="Primary Sanctuary Navigation"
      className={`flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#f8f3ea] border border-[#c2c8c1]/80 ${className}`}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl text-sm transition-all active:scale-98 ${
              isActive
                ? "bg-[#1a3826] text-white font-bold shadow-[0_2px_8px_rgba(26,56,38,0.16)]"
                : "text-[#424843] hover:text-[#1d1c16] hover:bg-[#f2ede4] font-medium"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} className={isActive ? "text-[#c8ebd1]" : ""} />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
