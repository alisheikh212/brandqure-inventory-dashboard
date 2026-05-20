---
name: Premium Executive Interface
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#45464d'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#40c2fd'
  on-secondary-container: '#004d6a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  numeric-data:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 280px
  container-max-width: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  component-padding-x: 1rem
  component-padding-y: 0.75rem
---

## Brand & Style

The design system is engineered to evoke high-level trust and technical precision for BrandQure. It targets executive-level users who require a professional workspace that balances data density with visual clarity. 

The aesthetic is a **Hybrid-Modern** style. It leverages a dark, high-contrast framing for navigation to provide a sense of authority and focus, while utilizing a clean, high-breadth light workspace for data consumption. Subtle glassmorphism is applied to the navigation layers to add depth and a futuristic quality without sacrificing legibility. The emotional response is one of reliability, sophistication, and effortless control.

## Colors

The palette is anchored by **Deep Navy (#0F172A)** and **Slate (#1E293B)**, creating a "Midnight" theme for the application's structural elements (sidebar, header, and navigation). This provides a sharp contrast against the **Clean White (#FFFFFF)** and **Ghost White (#F8FAFC)** backgrounds of the main content area.

For interactive accents and data visualization, the system employs a technical blue-to-indigo gradient. This adds a "lithium" glow to primary actions, reinforcing the futuristic brand narrative.
- **Surface Primary:** #FFFFFF (Main workspace)
- **Surface Secondary:** #F1F5F9 (Subtle background differentiation)
- **Surface Navigation:** #0F172A (Sidebar background)
- **Accent:** #38BDF8 to #6366F1 (Linear gradient for primary buttons and progress)

## Typography

The typography system utilizes **Geist** for its exceptional readability and technical, developer-centric aesthetic. It is optimized for high-performance SaaS environments where tabular data and numerical precision are paramount.

- **Headlines:** Use Semi-Bold weights with slight negative letter-spacing for a compact, professional look.
- **Data Points:** A specific `numeric-data` role is defined with tabular lining features enabled to ensure numbers align perfectly in lists and dashboard widgets.
- **Labels:** Use Medium to Semi-Bold weights at smaller sizes to maintain hierarchy without needing excessive color contrast.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** model. The navigation sidebar remains at a fixed width of 280px to provide a consistent anchor, while the main content area fluidly expands up to a maximum width of 1440px to prevent excessive line lengths on ultra-wide monitors.

A 12-column grid is utilized for the dashboard's card-based layout.
- **Desktop:** 32px margins with 24px gutters.
- **Tablet:** 24px margins with 16px gutters (8-column grid).
- **Mobile:** 16px margins with 12px gutters (4-column grid).

Spacing follows an 8px rhythmic scale (4px, 8px, 16px, 24px, 32px, 48px, 64px) to ensure mathematical harmony across all components.

## Elevation & Depth

Visual hierarchy in the design system is established through tonal layering and sophisticated ambient shadows:

1.  **The Base Layer:** The background of the workspace sits at the lowest elevation (`#F8FAFC`).
2.  **The Sidebar (Glass):** The sidebar utilizes a backdrop blur of 12px and a semi-transparent background (`rgba(15, 23, 42, 0.8)`). It is bordered by a 1px solid stroke of `rgba(255, 255, 255, 0.1)` to separate it from the content.
3.  **Floating Cards:** Content cards sit on the base layer with a 1px border (`#E2E8F0`) and an extremely soft, wide-spread shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -4px rgba(0, 0, 0, 0.03)`.
4.  **Active Modals/Overlays:** High elevation uses a tighter, darker shadow to indicate immediate priority.

## Shapes

The design system employs a **Rounded** shape language to soften the "enterprise" feel and make the interface more approachable.

- **Core Elements:** Buttons, input fields, and small UI widgets use a border-radius of **12px** (`rounded-lg`).
- **Containers:** Dashboard cards and main content wrappers use a border-radius of **16px** (`rounded-xl`).
- **Pill Elements:** Status tags and chips use a fully rounded (9999px) radius to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons feature the blue-to-indigo gradient with white text. Secondary buttons use a Slate outline with a subtle hover fill. Transitions should be 200ms ease-in-out.

### Input Fields
Inputs use a white background with a 1px Slate-200 border. Upon focus, the border transitions to Primary Blue with a 3px soft outer glow (ring).

### Cards
Cards are the primary container for dashboard data. They must include a consistent 24px internal padding and a subtle header separator if the card contains mixed data types.

### Sidebar Navigation
Navigation items use a "Ghost" style. When active, they should feature a subtle background highlight (`rgba(255, 255, 255, 0.08)`) and a 3px vertical "accent" bar on the leading edge.

### Chips & Badges
Small, low-profile indicators with semi-transparent backgrounds based on status (e.g., Success uses a soft green tint with dark green text). Use weight 600 for label text.