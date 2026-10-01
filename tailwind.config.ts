import type { Config } from 'tailwindcss'

// Palette and type scale from DESIGN.md. Theme-aware colours resolve through
// CSS variables defined in src/index.css (light + prefers-color-scheme dark).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00ED64', strong: '#13AA52', soft: '#E3FCF7' },
        ink: { DEFAULT: '#001E2B', 2: '#112733' },
        link: '#016BF8',
        danger: '#CF000F',
        warning: '#FFC010',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        'nav-active': 'var(--color-nav-active)',
        'nav-active-fg': 'var(--color-nav-active-fg)',
      },
      fontFamily: {
        sans: [
          '"Euclid Circular A"',
          'Akzidenz',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"Source Code Pro"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['32px', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.25', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.6' }],
        small: ['14px', { lineHeight: '1.5' }],
        label: ['14px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '600' }],
        code: ['13px', { lineHeight: '1.5' }],
      },
      borderRadius: { control: '8px', card: '16px', panel: '18px' },
      boxShadow: {
        card: '0 8px 18px rgba(0, 30, 43, 0.08)',
        overlay: '0 18px 30px rgba(0, 30, 43, 0.14)',
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
      spacing: { 'tab-bar': '64px' },
    },
  },
} satisfies Config
