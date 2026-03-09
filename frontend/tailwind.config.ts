import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        accent: "var(--accent-cream)",
        border: "var(--border)",
        sh: {
          bg: "var(--bg-primary)",
          bg2: "var(--bg-secondary)",
          bg3: "var(--bg-tertiary)",
          sidebar: "var(--bg-sidebar)",
          text: "var(--text-primary)",
          text2: "var(--text-secondary)",
          muted: "var(--text-muted)",
          border: "var(--border)",
          borderHover: "var(--border-hover)",
          accent: "var(--accent-cream)",
          accentHover: "var(--accent-cream-hover)",
          success: "var(--status-success)",
          successBg: "var(--status-success-bg)",
          warning: "var(--status-warning)",
          warningBg: "var(--status-warning-bg)",
          danger: "var(--status-danger)",
          dangerBg: "var(--status-danger-bg)",
          info: "var(--status-info)",
          infoBg: "var(--status-info-bg)",
        },
        shortlyst: {
          bg: "var(--bg-primary)",
          text: "var(--text-primary)",
          accent: "var(--accent-cream)",
          border: "var(--border)",
          muted: "var(--text-muted)",
        }
      },
      animation: {
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
      },
      keyframes: {
        skeleton: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
