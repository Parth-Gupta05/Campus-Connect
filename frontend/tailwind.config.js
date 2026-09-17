/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Geist Official Semantic Tokens
        "background-100": "var(--ds-background-100)",
        "background-200": "var(--ds-background-200)",
        "gray-100": "var(--ds-gray-100)",
        "gray-200": "var(--ds-gray-200)",
        "gray-300": "var(--ds-gray-300)",
        "gray-400": "var(--ds-gray-400)",
        "gray-500": "var(--ds-gray-500)",
        "gray-600": "var(--ds-gray-600)",
        "gray-700": "var(--ds-gray-700)",
        "gray-800": "var(--ds-gray-800)",
        "gray-900": "var(--ds-gray-900)",
        "gray-1000": "var(--ds-gray-1000)",

        "gray-alpha-100": "var(--ds-gray-alpha-100)",
        "gray-alpha-200": "var(--ds-gray-alpha-200)",
        "gray-alpha-400": "var(--ds-gray-alpha-400)",

        "blue-700": "var(--ds-blue-700)",
        "red-700": "var(--ds-red-700)",
        "amber-700": "var(--ds-amber-700)",
        "teal-700": "var(--ds-teal-700)",

        // Legacy compatibility mappings
        "primary": "var(--ds-gray-1000)",
        "surface": "var(--ds-background-100)",
        "background": "var(--ds-background-200)",
        "border-light": "var(--ds-gray-400)",
        "on-surface": "var(--ds-gray-1000)",
        "on-surface-variant": "var(--ds-gray-900)",
        "text-slate": "var(--ds-gray-700)",
        "surface-container": "var(--ds-gray-200)",
        "surface-container-high": "var(--ds-gray-300)",
        "surface-container-low": "var(--ds-gray-100)",
        "surface-variant": "var(--ds-gray-200)",
        "primary-container": "var(--ds-gray-200)",
        "secondary-container": "var(--ds-gray-200)",
        "tertiary-container": "var(--ds-teal-700)",
        "error": "var(--ds-red-700)",
        "outline": "var(--ds-gray-400)",
        "outline-variant": "var(--ds-gray-500)",
      },
      fontFamily: {
        sans: ["Geist Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
        // Legacy font bindings mapped to Geist
        "body-lg": ["Geist Sans", "sans-serif"],
        "body-md": ["Geist Sans", "sans-serif"],
        "display-hero": ["Geist Sans", "sans-serif"],
        "display-hero-mobile": ["Geist Sans", "sans-serif"],
        "headline-lg": ["Geist Sans", "sans-serif"],
        "headline-md": ["Geist Sans", "sans-serif"],
        "label-caps": ["Geist Sans", "sans-serif"],
        "button-text": ["Geist Sans", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.05em",
        tight: "-0.04em",
        snug: "-0.02em",
        normal: "-0.01em",
        wide: "0.02em",
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        popup: "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--ds-gray-400)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
