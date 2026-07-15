/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-error": "#ffffff",
                      "surface-tint": "#4d44e3",
                      "on-primary-container": "#dad7ff",
                      "outline-variant": "#c7c4d8",
                      "on-primary-fixed": "#0f0069",
                      "background": "#faf8ff",
                      "secondary-container": "#2170e4",
                      "on-error-container": "#93000a",
                      "on-surface-variant": "#464555",
                      "surface-container-low": "#f2f3ff",
                      "on-background": "#131b2e",
                      "secondary-fixed-dim": "#adc6ff",
                      "surface": "#faf8ff",
                      "on-tertiary-fixed-variant": "#005320",
                      "border-light": "#E5E7EB",
                      "surface-bright": "#faf8ff",
                      "on-secondary-container": "#fefcff",
                      "on-surface": "#131b2e",
                      "on-primary": "#ffffff",
                      "on-primary-fixed-variant": "#3323cc",
                      "error": "#ba1a1a",
                      "on-secondary-fixed-variant": "#004395",
                      "error-container": "#ffdad6",
                      "surface-dim": "#d2d9f4",
                      "on-tertiary-container": "#78f591",
                      "surface-container-high": "#e2e7ff",
                      "on-tertiary": "#ffffff",
                      "primary-container": "#4f46e5",
                      "secondary-fixed": "#d8e2ff",
                      "primary-fixed-dim": "#c3c0ff",
                      "surface-container": "#eaedff",
                      "ai-gradient-end": "rgba(59, 130, 246, 0.1)",
                      "tertiary-fixed-dim": "#62df7d",
                      "on-tertiary-fixed": "#002109",
                      "surface-container-highest": "#dae2fd",
                      "surface-variant": "#dae2fd",
                      "tertiary-container": "#00702f",
                      "tertiary-fixed": "#7ffc97",
                      "bg-subtle": "#F9FAFB",
                      "inverse-primary": "#c3c0ff",
                      "secondary": "#0058be",
                      "on-secondary-fixed": "#001a42",
                      "inverse-on-surface": "#eef0ff",
                      "on-secondary": "#ffffff",
                      "inverse-surface": "#283044",
                      "outline": "#777587",
                      "ai-gradient-start": "rgba(79, 70, 229, 0.1)",
                      "tertiary": "#005522",
                      "primary": "#3525cd",
                      "text-slate": "#475569",
                      "surface-container-lowest": "#ffffff",
                      "primary-fixed": "#e2dfff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "gutter": "24px",
                      "unit": "8px",
                      "section-gap-mobile": "64px",
                      "container-max": "1280px",
                      "section-gap-desktop": "128px"
              },
              "fontFamily": {
                      "body-lg": ["Geist", "sans-serif"],
                      "label-caps": ["Geist", "sans-serif"],
                      "display-hero-mobile": ["Geist", "sans-serif"],
                      "headline-lg": ["Geist", "sans-serif"],
                      "body-md": ["Geist", "sans-serif"],
                      "button-text": ["Geist", "sans-serif"],
                      "headline-md": ["Geist", "sans-serif"],
                      "display-hero": ["Geist", "sans-serif"]
              },
              "fontSize": {
                      "body-lg": ["18px", {"lineHeight": "1.6", "letterSpacing": "0", "fontWeight": "400"}],
                      "label-caps": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "display-hero-mobile": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "headline-lg": ["40px", {"lineHeight": "1.15", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "body-md": ["16px", {"lineHeight": "1.6", "letterSpacing": "0", "fontWeight": "400"}],
                      "button-text": ["14px", {"lineHeight": "1", "letterSpacing": "0", "fontWeight": "500"}],
                      "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                      "display-hero": ["64px", {"lineHeight": "1.05", "letterSpacing": "-0.03em", "fontWeight": "600"}]
              }
            }
          }
        }.theme,
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
