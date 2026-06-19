import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Narrative Trader Design Tokens
        arc: {
          950: '#05060A',
          900: '#0B0D14',
          800: '#111420',
          750: '#161A28',
          700: '#1C2133',
          600: '#252B3B',
          500: '#2F3749',
          400: '#3D4663',
          300: '#5A6480',
          200: '#8892A4',
          100: '#C4CAD6',
          50:  '#EEF0F4',
        },
        buy:  '#22C55E',
        hold: '#F59E0B',
        fail: '#EF4444',
        accent: {
          DEFAULT: '#6366F1',
          hover:   '#4F46E5',
          muted:   '#312E81',
          glow:    'rgba(99,102,241,0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(99,102,241,0.2)',
        'glow-buy':    '0 0 16px rgba(34,197,94,0.15)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
