import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        display: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      colors: {
        // Surface tokens: deep navy shell with graded elevations.
        navy: {
          950: '#060b16',
          900: '#0a1120',
          800: '#0f172a',
          700: '#1a2338',
          600: '#233150',
          500: '#2e3e63'
        },
        // Accent: cool premium gold for highlights and premium moments.
        gold: {
          50: '#fef6dc',
          100: '#fce9ad',
          200: '#f9d87a',
          300: '#f4c355',
          400: '#edae33',
          500: '#d99419',
          600: '#a87212'
        },
        // Accent: cyan for data/progress — high-tech stadium feel.
        cyan: {
          400: '#3fd4ff',
          500: '#22c3f0',
          600: '#0ca9d8'
        },
        // Neutrals re-mapped for the dark theme.
        ink: {
          50: '#f6f8fb',
          100: '#d8deea',
          200: '#a7b1c6',
          300: '#7a85a0',
          400: '#5a6580',
          500: '#424d68',
          600: '#2d3752',
          700: '#1d2742'
        }
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 28px rgba(2,8,20,0.55)',
        pop: '0 1px 0 rgba(255,255,255,0.06) inset, 0 18px 48px rgba(2,8,20,0.65)',
        'gold-glow':
          '0 0 0 1px rgba(244,195,85,0.35) inset, 0 0 24px rgba(244,195,85,0.25)',
        'cyan-glow':
          '0 0 0 1px rgba(63,212,255,0.35) inset, 0 0 24px rgba(63,212,255,0.18)'
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      },
      backgroundImage: {
        'grad-panel':
          'linear-gradient(180deg, rgba(36,52,89,0.55) 0%, rgba(12,20,38,0.7) 100%)',
        'grad-gold':
          'linear-gradient(135deg, #f4c355 0%, #d99419 45%, #a87212 100%)',
        'grad-cyan':
          'linear-gradient(135deg, #3fd4ff 0%, #22c3f0 55%, #0ca9d8 100%)',
        'grad-hero':
          'radial-gradient(1200px 520px at 80% -10%, rgba(63,212,255,0.22) 0%, transparent 55%), radial-gradient(900px 420px at 0% 0%, rgba(244,195,85,0.16) 0%, transparent 55%), linear-gradient(180deg, #0b1528 0%, #060c18 100%)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
