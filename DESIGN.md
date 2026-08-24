---
name: Safe Utility Interface
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1120px
  gutter: 24px
---

## Brand & Style

This design system centers on a **Safe** visual identity, prioritizing functional clarity and immediate user trust. The brand personality is professional, utilitarian, and calm, designed for a private utility app where data clarity is paramount. 

The design style is **Minimalist-Modern**, leaning heavily into high-quality typography and intentional whitespace. It avoids unnecessary ornamentation to reduce cognitive load, resulting in an interface that feels dependable and lightweight. The emotional response should be one of "controlled efficiency"—a digital environment where the user feels in complete command of their information without the distractions of aggressive marketing aesthetics.

## Colors

The palette is restrained and grounded in neutral tones to ensure longevity and professional appeal. 

- **Primary & Text:** The seed color `#111827` (Charcoal/Navy) serves as the anchor for all high-emphasis text and primary interaction points. 
- **Surfaces:** Pure white (`#FFFFFF`) is used for the main canvas, while `#F9FAFB` provides a subtle shift for containers, sidebars, or grouped content to create soft visual separation.
- **Functional Colors:** Success, Warning, and Danger colors are used strictly for status communication. They utilize a slightly desaturated "Professional" profile to remain visible without feeling loud or alarming.
- **Borders:** A consistent light gray (`#E5E7EB`) is used for all structural divisions, maintaining a "thin-line" aesthetic.

## Typography

This design system utilizes **Inter** for all roles to leverage its exceptional legibility and systematic weight distribution. 

The hierarchy is built on a strict "Functional Scale." Large display titles use tighter letter spacing and heavier weights to command attention, while body text maintains a generous line height for readability. Small labels and "overlines" use an increased letter spacing and uppercase styling to distinguish metadata from actionable content. For mobile devices, `display` type should scale down to `headline-lg` metrics to maintain visual balance.

## Layout & Spacing

The layout philosophy follows a **centered fixed-grid model** for desktop, ensuring that utility content remains focused and scannable without excessive eye-travel.

- **Grid:** A 12-column grid is used for desktop (1120px max-width). For mobile, a single-column layout with 16px side margins is standard.
- **Rhythm:** An 8px base unit (with a 4px half-step) governs all padding and margins. 
- **Breathability:** Components are encouraged to use generous internal padding (`16px` to `24px`) to maintain the "calm" aesthetic. Lists and card stacks should utilize `12px` or `16px` gaps to prevent visual crowding.

## Elevation & Depth

Visual hierarchy is achieved through **Low-contrast outlines** and **Ambient shadows**. 

- **Level 0 (Base):** The main background (`#FFFFFF`).
- **Level 1 (Cards/Surfaces):** Uses a 1px solid border in `#E5E7EB`. For interactive states, a very soft, diffused shadow is applied (Y: 1px, Blur: 3px, Opacity: 0.05) to suggest a slight lift.
- **Level 2 (Modals/Overlays):** These use a more pronounced but still natural shadow (Y: 4px, Blur: 12px, Opacity: 0.1) and a white background.
- **Depth Metaphor:** There is no "glass" or "blur" effect; depth is communicated purely through stacking layers and subtle tonal shifts in surface color.

## Shapes

The design system employs a **Soft** shape language. 

Standard components (buttons, input fields, small cards) use a `0.25rem` (4px) corner radius. Larger containers or "Keep-style" cards use `0.5rem` (8px). This creates a professional, structural feel that avoids the playfulness of pill-shaped buttons while remaining more approachable than sharp, 90-degree corners.

## Components

### Buttons
Buttons are rectangular with a 4px corner radius.
- **Primary:** Solid `#111827` with white text.
- **Secondary:** White background with `#E5E7EB` border and `#111827` text.
- **Ghost:** No border or background; text-only until hover.

### Cards
Cards are the primary container for data. They feature a 1px border (`#E5E7EB`) and a 8px corner radius. For grouped utilities, a `surface` (`#F9FAFB`) background can be used to differentiate the card from the main canvas.

### Input Fields
Inputs use a white background, 4px corner radius, and 1px border. Focus states are indicated by a 1px solid `#111827` border or a very subtle 2px soft outer glow. Labels are placed above the field using `label-md`.

### Status Indicators (Chips)
Small, non-pill badges used for status. They utilize a low-opacity background of the functional color (e.g., 10% green) with high-contrast text of the same hue.

### Lists
List items are separated by subtle horizontal lines (`#E5E7EB`). They should feature generous vertical padding (12px-16px) to maintain the spaced, breathable aesthetic.

### Progress Bars
Thin, 4px tall tracks using `#F3F4F6` with a solid primary or functional color fill to indicate completion or health.