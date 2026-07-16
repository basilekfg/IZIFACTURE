import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#00C853",
          dark: "#00A844",
          light: "#E8FDF0",
        },
        sidebar: {
          DEFAULT: "#004D40",
          hover: "#003D33",
          active: "#00332A",
        },
        brand: {
          dark: "#1A1A2E",
          surface: "#F8F9FA",
        },
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        info: "#3B82F6",
      },
    },
  },
  plugins: [],
};
export default config;
