/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kite: {
          bg: 'var(--kite-bg)',
          surface: 'var(--kite-surface)',
          border: 'var(--kite-border)',
          text: 'var(--kite-text)',
          muted: 'var(--kite-muted)',
          blue: 'var(--kite-blue)',
          accent: 'var(--kite-accent)',
          green: 'var(--kite-green)',
          red: 'var(--kite-red)',
          yellow: 'var(--kite-yellow)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
