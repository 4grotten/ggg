import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "430px",
        md: "430px",
        lg: "430px",
        xl: "430px",
        "2xl": "430px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        karta: {
          blue: "hsl(var(--karta-blue))",
          black: "hsl(var(--karta-black))",
          dark: "hsl(var(--karta-dark))",
          gray: "hsl(var(--karta-gray))",
          light: "hsl(var(--karta-light))",
          white: "hsl(var(--karta-white))",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
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
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "ios-alert-in": {
          from: { opacity: "0", transform: "translate(-50%, -50%) scale(0.98)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "ios-alert-out": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -50%) scale(0.98)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "partner-pulse-glow": {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.9)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
        "partner-orbit": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "partner-node-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        "partner-float": {
          "0%, 100%": { filter: "drop-shadow(0 0 12px rgba(191, 255, 0, 0.6)) drop-shadow(0 0 24px rgba(191, 255, 0, 0.3))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(191, 255, 0, 0.9)) drop-shadow(0 0 40px rgba(191, 255, 0, 0.5))" },
        },
        "partner-center-float": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(191, 255, 0, 0.4), 0 0 40px rgba(191, 255, 0, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(191, 255, 0, 0.7), 0 0 60px rgba(191, 255, 0, 0.4)" },
        },
        "partner-coin-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.9" },
          "25%": { transform: "translateY(-8px) rotate(10deg)", opacity: "1" },
          "50%": { transform: "translateY(-4px) rotate(-5deg)", opacity: "0.95" },
          "75%": { transform: "translateY(-10px) rotate(5deg)", opacity: "1" },
        },
        "partner-gem-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg) scale(1)", filter: "drop-shadow(0 0 8px rgba(80, 200, 120, 0.6))" },
          "50%": { transform: "translateY(-12px) rotate(15deg) scale(1.1)", filter: "drop-shadow(0 0 16px rgba(80, 200, 120, 0.8))" },
        },
        "partner-sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "partner-line-pulse": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
        "partner-step-enter-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "30%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "partner-step-enter-left": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "30%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "biometric-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(59, 130, 246, 0.25)" },
          "50%": { boxShadow: "0 0 18px rgba(59, 130, 246, 0.45)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "ios-alert-in": "ios-alert-in 0.2s ease-out forwards",
        "ios-alert-out": "ios-alert-out 0.15s ease-in forwards",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "spin-slow": "spin-slow 2s linear infinite",
        "partner-pulse-glow": "partner-pulse-glow 3s ease-in-out infinite",
        "partner-orbit": "partner-orbit 12s linear infinite",
        "partner-node-pulse": "partner-node-pulse 2s ease-in-out infinite",
        "partner-float": "partner-float 3s ease-in-out infinite",
        "partner-center-float": "partner-center-float 2.5s ease-in-out infinite",
        "partner-coin-float": "partner-coin-float 3s ease-in-out infinite",
        "partner-gem-float": "partner-gem-float 2.5s ease-in-out infinite",
        "partner-sparkle": "partner-sparkle 1.5s ease-in-out infinite",
        "partner-line-pulse": "partner-line-pulse 2s ease-in-out infinite",
        "partner-step-enter-right": "partner-step-enter-right 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "partner-step-enter-left": "partner-step-enter-left 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "biometric-glow": "biometric-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
