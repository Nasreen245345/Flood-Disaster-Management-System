/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a', // Blue 900 - Deep Royal Blue
        secondary: '#3b82f6', // Blue 500 - Bright Action Blue
        accent: '#06b6d4', // Cyan 500 - Highlights
        critical: '#e11d48', // Rose 600 - Alerts
        success: '#10b981', // Emerald 500
        warning: '#f59e0b', // Amber 500
        surface: '#ffffff', // White
        background: '#eff6ff', // Blue 50 - Very light blue tint
        text: {
          main: '#0f172a', // Slate 900 - High Contrast
          muted: '#64748b', // Slate 500
          light: '#f8fafc', // Slate 50
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
