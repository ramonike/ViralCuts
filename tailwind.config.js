/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Space Grotesk", "ui-monospace", "monospace"],
      },
      colors: {
        // Paleta ViralCuts
        coral: {
          DEFAULT: "#e8412a",
          light: "#ff5a42",
          subtle: "rgba(232,65,42,0.12)",
        },
        amber: {
          DEFAULT: "#f0a500",
          light: "#ffc12b",
          subtle: "rgba(240,165,0,0.12)",
        },
        teal: {
          DEFAULT: "#00c9a7",
          subtle: "rgba(0,201,167,0.12)",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      animation: {
        "timeline-pulse": "vc-timeline-pulse 3s ease-in-out infinite",
        "fade-in": "vc-fade-in 0.25s ease forwards",
        "scale-in": "vc-scale-in 0.2s ease forwards",
        "pulse-dot": "vc-pulse 1.4s ease-in-out infinite",
      },
      keyframes: {
        "vc-timeline-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "vc-fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "vc-scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "vc-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
      },
      boxShadow: {
        coral: "0 4px 20px rgba(232,65,42,0.25)",
        amber: "0 4px 20px rgba(240,165,0,0.20)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        elevated: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};
