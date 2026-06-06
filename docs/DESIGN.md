---
name: Lumina Network Labs
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424654'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737785'
  outline-variant: '#c3c6d6'
  surface-tint: '#0056d2'
  primary: '#0040a1'
  on-primary: '#ffffff'
  primary-container: '#0056d2'
  on-primary-container: '#ccd8ff'
  inverse-primary: '#b2c5ff'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#822800'
  on-tertiary: '#ffffff'
  tertiary-container: '#a93802'
  on-tertiary-container: '#ffcebd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#0040a1'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: Courier Prime
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  canvas-margin: 24px
  sidebar-width: 320px
  node-gap: 16px
  gutter: 16px
---

## Brand & Style

The design system is engineered to facilitate technical clarity and educational engagement. It balances the rigor of professional network engineering tools with the approachability of modern collaborative whiteboards. The visual language is **Corporate/Modern**, prioritizing legibility and structural logic to reduce the cognitive load of complex network topologies.

The UI evokes a sense of **precision, reliability, and discovery**. It avoids the clutter of legacy enterprise software, opting instead for a "canvas-first" philosophy where the network architecture remains the focal point. Surfaces are clean, interactions are fluid, and the hierarchy is reinforced through subtle depth and purposeful color application.

## Colors

The palette is functional, using color as a primary data signifier:
- **Professional Blue (#0056D2):** Used for infrastructure nodes (routers, switches), logic paths, and primary UI actions. It establishes the "blueprint" feel.
- **Vibrant Green (#22C55E):** Reserved for encryption status (locked keys), successful pings, and secure "Success" states.
- **Warning Amber (#F59E0B):** Signals unencrypted data, potential security vulnerabilities, or configuration errors.
- **Canvas & Surface:** The main workspace uses a very light neutral gray with a subtle 16px dot grid to assist in alignment. Inventory and configuration panels use pure white to pop against the canvas.

## Typography

The design system utilizes **Inter** for all UI elements to ensure maximum legibility at small sizes (labels on nodes). For technical data, such as IP addresses or packet headers, a secondary monospaced font is used.

- **Headlines:** Used for panel titles and network names.
- **Body:** Used for descriptions and educational tooltips.
- **Labels:** High-contrast, bold labels are used for device names and status indicators.
- **Monospaced:** Specifically for "IP: 192.168.1.1" type data to maintain character alignment in technical readouts.

## Layout & Spacing

The layout follows a **Fixed Sidebar / Fluid Canvas** model. 
- **The Sidebar:** Located on the left, it houses the inventory of nodes. It has a fixed width and uses an 8px spacing system for its internal components.
- **The Canvas:** An infinite or large-scale fluid area. Components placed here snap to a 16px dot grid.
- **The Property Panel:** An optional right-side drawer that appears when a node or connection is selected, ensuring focus remains on the specific configuration.

Margins of 24px are maintained around the main viewport to prevent "edge crowding" of floating controls.

## Elevation & Depth

Visual hierarchy is managed through **Tonal Layers** and **Ambient Shadows**:

1.  **Level 0 (Background):** The canvas with its dot grid.
2.  **Level 1 (Connections):** Lines and tunnels rendered directly on the canvas.
3.  **Level 2 (Nodes):** Icons and devices. These have a very slight 1px stroke (#E2E8F0) and a tiny "drop" shadow to lift them from the connection lines.
4.  **Level 3 (Floating UI/Inventory):** White cards with a "Soft Shadow" (12% opacity black, 8px blur) to indicate they sit above the simulation space.
5.  **Level 4 (Modals/Overlays):** High-contrast shadows (16% opacity, 16px blur) for focus-heavy educational pop-ups.

## Shapes

The design system uses a **Rounded (0.5rem)** logic to appear modern and friendly:
- **Nodes:** Rounded squares (8px radius) provide a larger hit area for cables than circles while feeling more contemporary than sharp rectangles.
- **Cards & Panels:** Follow the 8px standard.
- **Toggles/Chips:** Use the `rounded-xl` or full pill-shape to distinguish interactive mode-switchers from static informational boxes.

## Components

### Nodes
Nodes consist of a central icon (e.g., Router, PC, Server) inside a rounded-square container. A label is always positioned directly below or inside the container. 

### Connections
- **Standard Link:** A clean 2px solid line (Primary Blue).
- **VPN/Tunnel:** A thicker, translucent "tube" surrounding a dashed center line, indicating encapsulated traffic.
- **Active State:** Lines "pulse" or change color to Green/Amber during simulation.

### Toggles & Mode Switchers
A segmented control (pill-shaped) is used at the top of the canvas to switch between "Basic," "HTTPS," and "E2EE." The active state is indicated by a primary blue fill with white text.

### The "Message" (Envelope)
A small, white envelope icon that travels along connection paths. It should have a subtle glow based on its status (No Glow = Standard, Green Glow = Encrypted, Amber Glow = Warning/Plaintext).

### Action Buttons
Primary buttons use a solid blue fill. Secondary buttons (like "Reset Simulation") use an outlined style with a neutral border to avoid competing with the primary actions.