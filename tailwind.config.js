/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Lumina Network Labs palette (docs/DESIGN.md)
        background: "#f8f9ff",
        surface: "#f8f9ff",
        "surface-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-high": "#dce9ff",
        "surface-variant": "#d3e4fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#424654",
        outline: "#737785",
        "outline-variant": "#c3c6d6",
        primary: "#0040a1",
        "primary-container": "#0056d2",
        "primary-fixed": "#dae2ff",
        "on-primary": "#ffffff",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        secondary: "#16a34a",
        amber: "#f59e0b",
        danger: "#ba1a1a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"Courier Prime"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
