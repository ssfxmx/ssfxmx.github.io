import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño — estética arcade japonesa de los noventa.
 *
 * Los colores NO se escriben aquí en hexadecimal: se leen de las variables CSS
 * definidas en src/styles/tokens.css. Así existe un único lugar donde cambiar la
 * paleta, y ningún componente termina con un color suelto en el código.
 *
 * Restricción legal: la inspiración es de paleta, paneles, tipografía y luces.
 * No se usa ningún logo, personaje, sprite ni recurso con copyright.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--color-base) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        edge: 'rgb(var(--color-edge) / <alpha-value>)',

        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        steel: 'rgb(var(--color-steel) / <alpha-value>)',
        magenta: 'rgb(var(--color-magenta) / <alpha-value>)',
        'magenta-deep': 'rgb(var(--color-magenta-deep) / <alpha-value>)',
        orange: 'rgb(var(--color-orange) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',

        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft) / <alpha-value>)',
        'ink-dim': 'rgb(var(--color-ink-dim) / <alpha-value>)',
      },
      fontFamily: {
        // Fuente de píxeles solo para títulos cortos y marcadores.
        // Nunca para párrafos: es ilegible en cuerpo de texto.
        display: ['"Press Start 2P"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 12px rgb(var(--color-primary) / 0.35)',
        'neon-steel': '0 0 12px rgb(var(--color-steel) / 0.35)',
        panel: '0 2px 0 0 rgb(var(--color-edge)), 0 8px 24px rgb(0 0 0 / 0.4)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0.25' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1.2s steps(1) infinite',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
