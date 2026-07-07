import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño premium de PROTEA.
 * Paleta cálida editorial: crema, terracota suave, verde protea y dorado.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf7f2',
        sand: '#efe7db',
        clay: '#c98b6b',
        terracotta: '#b5674a',
        protea: {
          50: '#f2f5f1',
          500: '#5a7355',
          700: '#3f5239',
        },
        gold: '#a58e6f',
        ink: '#2d2a26',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
      },
    },
  },
  plugins: [],
};

export default config;
