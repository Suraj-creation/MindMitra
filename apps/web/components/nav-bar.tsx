"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",              label: "Home" },
  { href: "/demo/mq",       label: "Quality Gate" },
  { href: "/demo/safety",   label: "Safety Check" },
  { href: "/demo/firewall", label: "Firewall" },
  { href: "/demo/caregiver",label: "Caregiver Card" },
  { href: "/demo/delirium", label: "L5 Alert" },
];

export function NavBar() {
  const path = usePathname();

  return (
    <nav
      className="border-b border-[--color-border] bg-white/80 backdrop-blur sticky top-0 z-50"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-5xl px-4 flex items-center gap-6 h-14">
        {/* Brand */}
        <Link
          href="/"
          className="font-semibold text-[--color-primary] text-base min-h-0"
        >
          MindMitra
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1 overflow-x-auto" role="list">
          {links.slice(1).map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-0 whitespace-nowrap",
                  path === href
                    ? "bg-[--color-primary] text-white"
                    : "text-[--color-text-sub] hover:bg-[--color-surface] hover:text-[--color-text]",
                )}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* SIH badge */}
        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-xs text-[--color-muted] whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-[--color-success]" aria-hidden />
          SIH 2026 · PS26003
        </span>
      </div>
    </nav>
  );
}
