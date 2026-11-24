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
          bg: '#0A0C1F',
          dark: '#050712',
          purple: '#1E1238',
          card: '#121633',
        },
        gold: {
          light: '#FFEAA7',
          DEFAULT: '#F5B041',
          dark: '#B7791F',
          metallic: '#D4AF37',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 176, 65, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(245, 176, 65, 0.9)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
