---
name: FocusFlow Light
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004dea'
  primary: '#0041c8'
  on-primary: '#ffffff'
  primary-container: '#0055ff'
  on-primary-container: '#e3e6ff'
  inverse-primary: '#b6c4ff'
  secondary: '#506600'
  on-secondary: '#ffffff'
  secondary-container: '#c1f100'
  on-secondary-container: '#546b00'
  tertiary: '#972500'
  on-tertiary: '#ffffff'
  tertiary-container: '#c13301'
  on-tertiary-container: '#ffe1d9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b3'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a0'
  on-tertiary-fixed: '#3b0900'
  on-tertiary-fixed-variant: '#872100'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  code:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style

The design system embodies "Cognitive Momentum," a philosophy where high-velocity productivity meets clarity of thought. The brand personality is professional, precise, and energetic, designed to reduce cognitive load while maintaining an edge of digital-native excitement.

The style is **Modern Corporate with a High-Contrast Edge**. It utilizes clean, expansive white space typical of high-end SaaS, but punctuates it with aggressive, tech-forward accents. The UI feels airborne and fast—achieved through generous margins, razor-sharp typography, and surgical use of vibrant color. The light mode transition shifts the focus from "deep work" to "active execution," providing a crisp, high-visibility environment for daylight productivity.

## Colors

The palette is anchored by **Electric Blue** (#0055FF), representing focused intelligence and momentum. **Cyber Lime** (#CCFF00) serves as a high-visibility disruptor, used sparingly for critical actions and progress indicators. 

In this light mode configuration:
- **Surface Strategy:** Backgrounds are pure white (#FFFFFF). Successive layers use cool greys (Slate scale) to create a sense of organized hierarchy without relying on heavy shadows.
- **Contrast:** Typography adheres to a strict high-contrast ratio. The primary text color is Slate 950 (#0F172A), ensuring maximum legibility.
- **Accents:** Electric Blue is used for primary buttons, active states, and links. Cyber Lime is reserved for "success" states or high-energy highlights (e.g., a "New" badge or a completed task).

## Typography

The design system exclusively utilizes **Geist**, a typeface engineered for precision and readability in technical environments. 

- **Display Logic:** Large headlines use tight tracking and heavy weights to create a sense of "Momentum." 
- **Body Logic:** Standard text uses regular weights with ample line-height to ensure clarity against the white background.
- **Labels:** Small labels utilize semi-bold weights and slight tracking increases to maintain a professional, systematic feel.
- **Technical Content:** For data or monospaced needs, use the Geist Mono variant to reinforce the developer-friendly, precise aesthetic.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a maximum width of 1280px to prevent excessive line lengths on ultra-wide monitors, while fluidly adapting below that threshold.

- **Grid:** A 12-column grid is used for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** An 8px base unit drives all spacing. Consistent padding (e.g., 24px/32px) within cards and containers ensures the "Focus" aspect of the brand identity—giving elements room to breathe.
- **Breakpoints:** 
    - Mobile: < 600px
    - Tablet: 600px - 1024px
    - Desktop: > 1024px

## Elevation & Depth

Visual hierarchy in this design system is primarily driven by **Tonal Layering** rather than heavy shadows.

- **Level 0 (Base):** White (#FFFFFF).
- **Level 1 (Sub-navigation/Sidebars):** Surface-container-low (#F8FAFC).
- **Level 2 (Cards/Modals):** White, but defined by a 1px border (#E2E8F0) and a very soft, diffused ambient shadow (0px 4px 20px rgba(15, 23, 42, 0.05)).
- **Interactive States:** When hovered, elements may lift slightly (increased shadow) or shift to Surface-container-mid (#F1F5F9).

This "flat-plus" approach keeps the UI feeling light, fast, and modern.

## Shapes

The shape language is **Soft-Geometric**. We avoid the playfulness of fully rounded corners in favor of a "Soft" 0.25rem (4px) radius. This provides a professional, engineered look that feels modern without being sterile.

- **Components:** Buttons and input fields use a 4px radius.
- **Containers:** Large cards and modals use an 8px (rounded-lg) radius to soften the overall layout.
- **Exceptions:** Status "pills" may use a full-round radius to distinguish them as non-interactive data points.

## Components

- **Buttons:** 
    - *Primary:* Electric Blue background, white text. No border.
    - *Secondary:* White background, 1px border (Slate 200), Slate 950 text.
    - *Accent:* Cyber Lime background, Slate 950 text (high impact).
- **Input Fields:** White background with a 1px Slate 200 border. On focus, the border shifts to Electric Blue with a subtle 2px blue glow.
- **Cards:** White surface, 1px Slate 200 border, 8px corner radius. Headlines inside cards should be Geist Semi-bold.
- **Chips/Badges:**
    - *Standard:* Light grey background, Slate 700 text.
    - *Active:* Light blue tint, Electric Blue text.
- **Lists:** Clean rows separated by 1px Slate 100 dividers. Hover states should trigger a shift to Surface-container-low.
- **Checkboxes/Radio Buttons:** Precise 16px boxes with Electric Blue fill when active. High-contrast checkmark.