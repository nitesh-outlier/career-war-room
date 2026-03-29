/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        war: {
          bg:      '#0a0e17',
          surface: '#111827',
          border:  '#1e293b',
          amber:   '#d4a853',
          teal:    '#2dd4bf',
          text:    '#e2e8f0',
          muted:   '#64748b',
        },
        agent: {
          strategist:    '#3b82f6',
          contrarian:    '#ef4444',
          mentor:        '#a855f7',
          datascientist: '#22c55e',
          coach:         '#f59e0b',
        },
      },
      keyframes: {
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 12px 2px rgba(212,168,83,0.4)' },
          '50%':      { boxShadow: '0 0 28px 6px rgba(212,168,83,0.75)' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      animation: {
        pulse_glow: 'pulse_glow 2.5s ease-in-out infinite',
        scanline:   'scanline 8s linear infinite',
      },
    },
  },
  plugins: [],
};
