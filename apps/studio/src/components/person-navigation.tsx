"use client";

import { HeartHandshake, Home, Images, Sparkles, Users } from "lucide-react";

export type PersonSection = "day" | "life" | "activity" | "people" | "help";

const items: Array<{
  id: PersonSection;
  label: string;
  icon: typeof Home;
}> = [
  { id: "day", label: "My Day", icon: Home },
  { id: "life", label: "My Life", icon: Images },
  { id: "activity", label: "Let’s Do Something", icon: Sparkles },
  { id: "people", label: "People", icon: Users },
  { id: "help", label: "Help", icon: HeartHandshake },
];

type PersonNavigationProps = {
  active: PersonSection;
  onChange: (section: PersonSection) => void;
};

export function PersonNavigation({ active, onChange }: PersonNavigationProps) {
  return (
    <nav aria-label="Your day" className="person-navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          aria-current={active === id ? "page" : undefined}
          className="person-navigation__item"
          data-active={active === id}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
