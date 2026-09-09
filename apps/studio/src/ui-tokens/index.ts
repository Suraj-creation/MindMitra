/**
 * MindMitra design tokens — the single source of visual truth.
 *
 * These are consumed by Tailwind (web) and will be consumed by Nativewind
 * (future Expo mobile). Never hard-code colours or spacing — reference tokens.
 *
 * Design principles:
 *  - High contrast (WCAG 2.2 AA minimum, AAA preferred for primary text)
 *  - Large tap targets (≥ 48px touch, ≥ 44px click)
 *  - Warm, calm palette — never clinical white-and-blue
 *  - Generous type scale — elderly users, low-literacy contexts
 */

export const colors = {
  // Brand / primary — warm saffron + deep teal
  primary: {
    50:  "#fff8ed",
    100: "#ffefd4",
    200: "#ffdba8",
    300: "#ffc06f",
    400: "#ff9a33",
    500: "#f97b0a",  // action / CTA
    600: "#ea6300",
    700: "#c24c00",
    800: "#9a3c04",
    900: "#7d330a",
    950: "#431703",
  },
  teal: {
    50:  "#effafb",
    100: "#d7f2f4",
    200: "#b3e5e9",
    300: "#7dd1d9",
    400: "#40b2bd",
    500: "#2596a3",  // interactive / link
    600: "#1e7a88",
    700: "#1d646f",
    800: "#1e515c",
    900: "#1d454e",
    950: "#0d2c34",
  },
  // Neutrals — warm grey (not cold blue-grey)
  stone: {
    50:  "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
  // Semantic
  success: "#16a34a",
  warning: "#d97706",
  danger:  "#dc2626",
  // Escalation levels (L0–L5)
  escalation: {
    L0: "#78716c",  // stone-500
    L1: "#2596a3",  // teal-500
    L2: "#2563eb",  // blue
    L3: "#d97706",  // amber
    L4: "#ea580c",  // orange
    L5: "#dc2626",  // red (urgent)
  },
} as const;

export const spacing = {
  "tap-min":  "48px",  // WCAG minimum touch target
  "click-min":"44px",  // desktop click target
} as const;

export const fontSizes = {
  // Base is larger than default for elderly users
  xs:   "0.875rem",   // 14px
  sm:   "1rem",       // 16px
  base: "1.125rem",   // 18px  ← root
  lg:   "1.25rem",    // 20px
  xl:   "1.5rem",     // 24px
  "2xl":"1.875rem",   // 30px
  "3xl":"2.25rem",    // 36px
  "4xl":"3rem",       // 48px
} as const;

export const radii = {
  sm:  "0.375rem",
  md:  "0.75rem",
  lg:  "1rem",
  xl:  "1.5rem",
  full:"9999px",
} as const;

export const motion = {
  // Prefer reduced-motion: use opacity/transform only; no layout animations
  fast:   "150ms ease-out",
  base:   "250ms ease-out",
  slow:   "400ms ease-out",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
