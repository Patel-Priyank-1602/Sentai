import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
          400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
          800: "#3730a3", 900: "#312e81", 950: "#1e1b4b",
        },
        cyber: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
          800: "#065f46", 900: "#064e3b",
        },
        danger: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
          400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
          800: "#991b1b", 900: "#7f1d1d",
        },
        warning: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
          400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
          800: "#92400e", 900: "#78350f",
        },
        surface: {
          50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1",
          400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155",
          800: "#1e293b", 900: "#0f172a", 950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scan-line": "scan-line 2s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-glow": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        "slide-up": { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "slide-down": { "0%": { transform: "translateY(-10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scan-line": { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.4)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-cyber": "0 0 20px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
