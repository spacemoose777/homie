import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: "#FF6B6B",
          light: "#FFB3B3",
          dark: "#E05252",
        },
        warm: {
          DEFAULT: "#FFD93D",
        },
        primary: "#FF6B6B",
        accent: "#6366f1",
        "text-base": "#1a1a2e",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
