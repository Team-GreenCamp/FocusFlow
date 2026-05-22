---
name: Cognitive Momentum
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for FocusFlow, an AI-driven productivity platform designed to reduce cognitive load and facilitate "deep work" states. The brand personality is **intelligent, kinetic, and serene**. It balances the precision of high-tech AI with the tranquility required for concentrated effort.

The visual style is a sophisticated blend of **Minimalism** and **Glassmorphism**. It utilizes a "Bento Grid" organizational structure to compartmentalize information into digestible, high-contrast modules. The interface relies on generous whitespace, subtle motion, and translucent layers to create a sense of depth without cluttering the user's mental space.

## Colors
The palette is centered on a high-energy **Deep Indigo to Electric Blue** gradient, symbolizing the transition from deep thought to active execution. 

- **Primary:** Used for main actions, active states, and progress indicators. The gradient should be applied sparingly to maintain its impact.
- **Secondary (Cyber Lime):** Reserved for AI-driven insights, task completion signals, and critical highlights. It provides a sharp, high-contrast "pop" against dark backgrounds.
- **Neutrals:** The dark mode uses a "Deep Obsidian" base to minimize eye strain, while the light mode utilizes a cool-tinted off-white.
- **Semantic Colors:** Success states utilize the Soft Mint/Cyber Lime tones; errors are represented by a muted coral to avoid breaking the cool-toned harmony.

## Typography
The typographic scale prioritizes hierarchy and scanning. **Geist** provides a technical, geometric edge for headings, while **Inter** ensures maximum readability for task descriptions and system notes.

- **Display Styles:** Use for dashboard greetings and primary focus metrics. High tracking (tight letter spacing) adds a modern, editorial feel.
- **Body Styles:** Generous line-height (1.6) is mandatory to prevent text-heavy sections from feeling overwhelming.
- **Labels:** Monospaced-leaning Geist labels are used for metadata, tags, and AI confidence scores.

## Layout & Spacing
This design system utilizes a **Fluid Bento Grid** model. Content is organized into modular "cells" that adapt to screen size while maintaining consistent internal padding.

- **Grid Model:** 12-column desktop grid with 24px gutters.
- **Bento Logic:** Elements should be grouped into cards with varying spans (e.g., 1x1, 2x1, 2x2).
- **Responsive Behavior:** On mobile, the 12-column grid collapses into a single-column stack, but maintains the 8px base unit for all vertical rhythm. 
- **Whitespace:** Every layout must include at least one "void" area or significantly oversized margin to give the user's eyes a place to rest.

## Elevation & Depth
Depth is created through **Glassmorphism** and soft, colored shadows rather than traditional grey-scale elevation.

- **Surface Layers:** The primary container style is a semi-transparent surface with a `backdrop-filter: blur(20px)`. This creates a sense of the UI floating over the obsidian background.
- **Shadows:** Use "Ambient Blue" shadows. Instead of pure black, shadows should use a low-opacity Indigo tint (`rgba(55, 48, 163, 0.15)`) to maintain the color narrative.
- **Borders:** Thin, 1px strokes with a linear gradient (top-left to bottom-right) from `white/20%` to `white/5%` should be used to define card edges without adding visual weight.

## Shapes
The shape language is **refined and approachable**. 

- **Corner Radii:** Standard components (buttons, inputs) use a 0.5rem (8px) radius. 
- **Container Radii:** Bento cards and large containers use `rounded-xl` (1.5rem / 24px) to create a distinct modular feel.
- **AI Components:** Elements generated by AI or representing "flow" states may use slightly more exaggerated rounding or organic, pill-shaped blobs to differentiate them from static system elements.

## Components
- **Buttons:** Primary buttons use the Indigo-to-Blue gradient with a subtle "shimmer" hover effect. Secondary buttons are ghost-style with the 1px gradient border.
- **Bento Cards:** The foundational unit. Each card must have a consistent 24px internal padding and the glassmorphic background.
- **Inputs:** Fields are dark and recessed with a subtle inner glow on focus. The cursor and focus ring should use the Secondary Cyber Lime color.
- **Status Chips:** Small, pill-shaped indicators. For "Completed" or "Optimized," use the Soft Mint background with dark text.
- **Micro-interactions:** Use "Spring" physics for transitions (e.g., `stiffness: 300, damping: 20`). Cards should subtly scale up (1.02x) on hover to indicate interactivity.
- **AI Suggestion Box:** A specialized component with a moving gradient border to signify active computation or "live" intelligence.