# DESIGN.md — Brahmaputra Mist & Living Silk Design System

```yaml
name: Brahmaputra Mist & Living Silk
colors:
  surface: '#fef9f0'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ece8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#424843'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#727972'
  outline-variant: '#c2c8c1'
  surface-tint: '#466550'
  primary: '#032212'
  on-primary: '#ffffff'
  primary-container: '#1a3826'
  on-primary-container: '#81a28a'
  inverse-primary: '#adcfb5'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#321500'
  on-tertiary: '#ffffff'
  tertiary-container: '#4d290b'
  on-tertiary-container: '#c48f69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8ebd1'
  primary-fixed-dim: '#adcfb5'
  on-primary-fixed: '#022111'
  on-primary-fixed-variant: '#2f4d3a'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#f5ba92'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#653d1e'
  background: '#fef9f0'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  headline-xl:
    fontFamily: Merriweather
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Merriweather
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.005em
  headline-lg-mobile:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Merriweather
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0em
  body-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 2rem
  touch-target-min: 3.5rem
```

## Brand & Style

The design system embodies a serene, dignified, and culturally grounded sanctuary tailored for cognitive wellness, elder accessibility, and dementia-informed care. Drawing inspiration from Northeast India—the slow mist over the Brahmaputra, the structured calm of lush tea terraces, and the enduring warmth of handloomed raw silks—the visual philosophy balances clinical clarity with profound emotional safety.

### Aesthetic Movement
- **Tactile Organic Warmth & Frosted Serenity:** Soft, warm paper/silk surfaces layered with delicate, non-disorienting translucent overlays.
- **Biophilic Clarity:** Natural earthen tones that lower cortisol, paired with deliberate contrast to ensure immediate legibility for aging eyes.
- **Elder-Centric Dignity:** Devoid of clinical sterility or condescending playfulness. Every touch target, visual signpost, and typographic cadence treats the user with timeless respect and reassuring calm.

## Colors

The palette directly references the dawn landscapes, lush botanical terraces, and artisanal weaves of the Northeast river valleys. High contrast ratios ensure WCAG AAA accessibility across vital reading and interactive states, specifically considering reduced visual acuity, cataracts, and contrast sensitivity loss.

### Primary Palette
- **Deep Tea Moss (`#1A3826`):** Primary brand anchor. Used for primary interactive actions, key active boundaries, and high-emphasis serif typography. Grounding, authoritative, yet natural.
- **Valley Moss (`#2D5A3F`):** Secondary botanical green. Utilized for secondary action states, progressive indicators, and stable positive feedback states.

### Accent & Warmth
- **Morning Amber (`#D97706`):** Primary accent. Used sparingly for high-salience focus rings, primary highlights, milestones, and gentle prompts requiring elder attention without alarm.
- **Sunlight Gold (`#F59E0B`):** Warm morning glow. Employed in subtle gradient blends, warm badge backgrounds, and supportive celebratory moments.
- **Earthen Clay (`#8C5E3C`):** Earth tone for secondary context markers, gentle category dividers, and auxiliary supporting graphics.

### Neutrals & Surfaces
- **Muga Silk Cream (`#FEF9F0` / `#FBF9F4`):** Default ambient background evoking unbleached raw silk and warm handmade parchment. Eliminates the blinding glare of pure `#FFFFFF`.
- **Raw Cotton Surface (`#F8F3EA` / `#F4EFE6`):** Primary container surface and card background, offering gentle separation from the ambient canvas.
- **River Stone Border (`#C2C8C1` / `#E3DBCF`):** Tactile outline color providing clear structural boundary definition without stark, sharp harshness.
- **Serene Night Slate (`#1D1C16` / `#0F172A`):** Core text color. Deep ink slate providing 13.5:1 contrast against `#FEF9F0`, offering superior reading comfort over harsh solid black.
- **Muted Slate Ink (`#424843` / `#475569`):** Secondary metadata, instructions, and passive supportive labeling.

## Typography

The typographic hierarchy is intentionally structured with generous proportions, generous vertical rhythm, and humanist cadence to accommodate age-related macular degeneration, presbyopia, and processing slowdowns.

- **Headings (Merriweather):** Chosen for its sturdy, open letterforms, pronounced serifs, and high x-height. Conveys the grounding dignity of traditional literary forms and oral storytelling traditions.
- **Body Text (Plus Jakarta Sans):** Selected for its clear humanist geometry, spacious counters, and wide character spacing, preventing letters from crowding together during sustained reading.
- **Labels & Functional Controls (Inter):** Utilitarian and unambiguous; distinguishes numbers, field tags, and directional cues clearly without visual fatigue.

## Layout & Spacing

The layout is built upon an unhurried, single-column reading discipline with spacious margins, preventing cognitive overload and visual scanning fatigue.

### Layout Principles
- **Predictable Linear Progression:** Onboarding and daily pathways prioritize vertical, single-lane progression. Avoid split columns or conflicting parallel tasks.
- **Generous Safe Gutters:**
  - **Mobile (<768px):** 4-column layout with `1.25rem` screen edge margins and `1rem` gutters.
  - **Tablet (768px–1024px):** 8-column layout constrained to a maximum reading width of `680px` for narrative onboarding forms.
  - **Desktop (>1024px):** Centered modal architecture anchored to an `800px` reading card container, surrounded by misted canvas margins.
- **Touch Targets:** Absolute minimum touch target height and width of `56px` (`3.5rem`) for interactive buttons, radio options, and navigation elements to accommodate fine-motor tremor and joint stiffness.

## Elevation & Depth

Visual depth is achieved through tactile material stacking rather than sharp, clinical dropshadows. The approach evokes morning mist over the valley: quiet, physical, and soft.

### Surface Tiers
- **Tier 0 (The Living Ground):** Muga Silk Cream (`#FEF9F0`) with a continuous micro-texture of woven fiber, establishing warmth.
- **Tier 1 (Resting Cards & Canvas Panels):** Raw Cotton (`#F8F3EA`) framed by a subtle, tactile outline (`1.5px` solid `#C2C8C1`). Shadows are diffused ambient blooms: `0 6px 20px -4px rgba(26, 56, 38, 0.06), 0 2px 6px -1px rgba(26, 56, 38, 0.04)`.
- **Tier 2 (Interactive Modules & Floating Headers):** Frosted Muga Glass (`rgba(254, 249, 240, 0.85)` with `backdrop-filter: blur(12px)`), bounded by `1px solid rgba(194, 200, 193, 0.8)`. Shadow: `0 12px 28px -6px rgba(29, 28, 22, 0.08)`.
- **Tier 3 (Modals & Guidance Overlays):** Solid Raw Cotton base with `0 24px 48px -12px rgba(29, 28, 22, 0.16)`. Backdrop overlay is a deep dawn-mist wash: `rgba(29, 28, 22, 0.45)` with `backdrop-filter: blur(6px)`.

## Shapes

The form language uses balanced rounded geometry (`roundedness: 2`, `0.5rem` / `8px` baseline, `1rem` / `16px` for cards). 

- **Containers & Surfaces:** Primary cards and elevated groups employ `16px` (`1rem`) border radii.
- **Interactive Buttons & Selectors:** Buttons and selectable card options use `12px` to `16px` corner curvature, preserving distinct shape boundaries under hand touch.
- **Badges & Progress Nodes:** Organic circular forms (`9999px`) provide clear numerical sequences.

## Components

### 1. Buttons
- **Primary Action (Botanical Solid):**
  - **Height:** Minimum `56px`.
  - **Background:** Deep Tea Moss (`#1A3826`), transitioning on hover/press to Valley Moss (`#2D5A3F`).
  - **Typography:** `label-lg`, pure white (`#FFFFFF`), with an accompanying clear directional icon.
  - **Focus State:** `3px` solid Morning Amber (`#D97706`) with a `2px` offset.
- **Secondary Action (Outlined Cotton):**
  - **Height:** Minimum `56px`.
  - **Surface:** Transparent or Raw Cotton (`#F8F3EA`), `2px` solid border in Deep Tea Moss (`#1A3826`).
  - **Typography:** `label-lg`, Deep Tea Moss (`#1A3826`).

### 2. Selection Cards (Radio / Checkbox Groups)
- **Role:** Central to onboarding questions (e.g., identifying relation, language preferences, cognitive baseline).
- **Structure:** Full-width card with minimum height of `64px`, featuring `16px` padding.
- **Inactive State:** Background `#F8F3EA`, border `1.5px solid #C2C8C1`, text `#1D1C16`.
- **Selected State:** Background `rgba(26, 56, 38, 0.05)`, border `2.5px solid #1A3826`. Accompanied by a large `24px` filled selection glyph containing a checkmark in Morning Amber (`#D97706`).

### 3. Text Inputs & Form Fields
- **Height:** `60px` input area with high-legibility `body-lg` text.
- **Labels:** Always permanently visible above the field set in `label-lg` Serene Night Slate (`#1D1C16`).
- **Supportive Hint Text:** Positioned below the input in `body-md` Muted Slate Ink (`#424843`).
- **Border:** `2px solid #C2C8C1`. On focus: `2.5px solid #1A3826` and soft Amber aura (`0 0 0 4px rgba(217, 119, 6, 0.15)`).

### 4. Progress Stepper (Mist & River Milestones)
- **Layout:** Horizontal indicator with generous milestone nodes (`36px` diameter).
- **Completed Nodes:** Deep Tea Moss (`#1A3826`) with solid white checkmarks.
- **Active Node:** Morning Amber (`#D97706`) surrounded by an illuminated pulse ring (`rgba(217, 119, 6, 0.25)`).
- **Connecting Lines:** `4px` thickness for clear spatial connection, filled with Valley Moss for finished milestones and `#C2C8C1` for upcoming ones.

### 5. Memory & Familiarity Anchor Cards
- **Role:** Specialized onboarding cards showcasing cultural, regional, or familial prompts to reduce disorientation.
- **Styling:** Gentle Raw Cotton (`#F8F3EA`) surface wrapped with an inner border of woven earthen clay (`#8C5E3C` at 20% opacity), paired with an audio playback button (`56px` circular) to read prompts aloud in regional vernaculars.
