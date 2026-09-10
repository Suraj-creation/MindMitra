/**
 * MindMitra design tokens — the single source of visual truth.
 * Ported from @mindmitra/ui-tokens (DESIGN.md Part F).
 */

export const tokens = {
  colors: {
    // Saffron & Warm Amber Brand Palette
    primary: {
      50:  "#fff8ed",
      100: "#ffefd4",
      200: "#ffdba8",
      300: "#ffc06f",
      400: "#ff9a33",
      500: "#f97b0a",
      600: "#ea6300",
      700: "#c24c00",
      800: "#9a3c04",
      900: "#7d330a",
      950: "#431703",
    },
    // Forest / Deep Sage (Person Surface Primary)
    sage: {
      50:  "#f4f6f1",
      100: "#e5ece0",
      200: "#ccd9c2",
      300: "#adc19e",
      400: "#8fa77e",
      500: "#5e6f4a", // Primary person brand
      600: "#48583a",
      700: "#38452d",
      800: "#2d3725",
      900: "#262e20",
    },
    // Deep Teal
    teal: {
      50:  "#effafb",
      100: "#d7f2f4",
      200: "#b3e5e9",
      300: "#7dd1d9",
      400: "#40b2bd",
      500: "#2596a3",
      600: "#1e7a88",
      700: "#1d646f",
      800: "#1e515c",
      900: "#1d454e",
      950: "#0d2c34",
    },
    // Warm Stone Neutrals
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
    // Canvas & Surface Colors
    canvas: "#fbf1e3",
    surface: "#f7eadc",
    card: "#eee1cc",
    border: "#e6ddcf",
    text: "#332f29",
    textSub: "#6b6b63",
    muted: "#7a7a71",
    // Escalation Levels
    escalation: {
      L0: "#78716c",
      L1: "#2596a3",
      L2: "#2563eb",
      L3: "#d97706",
      L4: "#ea580c",
      L5: "#dc2626",
    }
  },
  typography: {
    fontEditorial: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }
} as const;
