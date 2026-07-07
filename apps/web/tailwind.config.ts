import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño de PROTEA · Andrea Delgado.
 * Paleta extraída por muestreo de pixel directo del manual de marca oficial
 * (crema, sand, carbón y durazno cálido) — no de los códigos hex impresos en
 * el documento, que no coinciden con los swatches reales mostrados ahí.
 * Se conservan los nombres de clase existentes (clay/terracotta/gold/protea)
 * para no romper el código ya escrito; solo se re-apuntan a los valores
 * reales de marca.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f6f2ef', // swatch 3 del manual de marca
        sand: '#e8e1d7', // swatch 1
        clay: '#524f4a', // hover del carbón (terracotta claro → gris cálido)
        terracotta: '#373737', // swatch 2: carbón — color de acción primario
        protea: {
          50: '#f4ede4', // tinte muy claro del durazno (swatch 4)
          500: '#8a7360',
          700: '#373737', // carbón, mismo que terracotta para fondos oscuros
        },
        gold: '#8a7360', // etiquetas / texto secundario cálido
        ink: '#373737', // swatch 2
        peach: '#ebdaca', // swatch 4: acento cálido suave
      },
      fontFamily: {
        serif: ['Prata', 'Georgia', 'serif'],
        script: ['"Beau Rivage"', 'cursive'],
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
