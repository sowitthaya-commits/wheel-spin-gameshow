import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: '#050508',
          dark: '#020204',
          purple: '#120D1F',
          card: '#0D0D14',
          border: '#2A2415',
        },
        gold: {
          light: '#FFF5C0',
          bright: '#FFE57F',
          DEFAULT: '#F5B041',
          dark: '#9E6B15',
          metallic: '#D4AF37',
          deep: '#734E0C',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'flare': 'flare 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 176, 65, 0.3)' },
          '100%': { boxShadow: '0 0 45px rgba(245, 176, 65, 0.85), 0 0 20px rgba(255, 235, 127, 0.6)' },
        },
        flare: {
          '0%': { opacity: '0.6', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
