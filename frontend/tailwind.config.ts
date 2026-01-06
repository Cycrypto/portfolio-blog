import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Semantic colors (UI 컴포넌트용)
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },

        // Brand colors (브랜드 컬러 - 테마 변경 시 여기만 수정)
        brand: {
          blue: {
            50: "rgb(var(--brand-blue-50))",
            100: "rgb(var(--brand-blue-100))",
            200: "rgb(var(--brand-blue-200))",
            500: "rgb(var(--brand-blue-500))",
            600: "rgb(var(--brand-blue-600))",
            700: "rgb(var(--brand-blue-700))",
            900: "rgb(var(--brand-blue-900))",
          },
          indigo: {
            50: "rgb(var(--brand-indigo-50))",
            500: "rgb(var(--brand-indigo-500))",
            600: "rgb(var(--brand-indigo-600))",
          },
        },

        // Neutral colors (중성 컬러)
        neutral: {
          slate: {
            50: "rgb(var(--neutral-slate-50))",
            200: "rgb(var(--neutral-slate-200))",
            300: "rgb(var(--neutral-slate-300))",
            500: "rgb(var(--neutral-slate-500))",
            600: "rgb(var(--neutral-slate-600))",
            700: "rgb(var(--neutral-slate-700))",
            800: "rgb(var(--neutral-slate-800))",
            900: "rgb(var(--neutral-slate-900))",
          },
          gray: {
            50: "rgb(var(--neutral-gray-50))",
            100: "rgb(var(--neutral-gray-100))",
            200: "rgb(var(--neutral-gray-200))",
            300: "rgb(var(--neutral-gray-300))",
            500: "rgb(var(--neutral-gray-500))",
            600: "rgb(var(--neutral-gray-600))",
            700: "rgb(var(--neutral-gray-700))",
            900: "rgb(var(--neutral-gray-900))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
