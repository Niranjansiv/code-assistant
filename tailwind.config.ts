import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      "#050810",
        surface: "#0D1117",
      },
      fontFamily: {
        sans:      ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:      ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        syne:      ["var(--font-syne)", "Syne", "system-ui", "sans-serif"],
        spacemono: ["var(--font-spacemono)", "Space Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        "pulse-slow":"pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                     to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
    },
  },
  plugins: [],
};

export default config;
