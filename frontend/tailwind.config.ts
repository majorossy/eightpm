import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // SEMANTIC DESIGN TOKENS
        // All components should use these classes
        // ========================================

        // Surfaces: bg-surface-base, bg-surface-card, etc.
        surface: {
          base: 'var(--surface-base)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken)',
          'player-deep': 'var(--player-surface-deep)',
          'player-bar': 'var(--player-surface-bar)',
          'player-queue': 'var(--player-surface-queue)',
          'player-chip': 'var(--player-surface-chip)',
          'player-chip-hover': 'var(--player-surface-chip-hover)',
        },

        // Accent: text-accent, bg-accent, border-accent
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary-hover)',
          muted: 'var(--accent-primary-muted)',
          secondary: 'var(--accent-secondary)',
        },

        // Borders: border-default, border-subtle, border-accent (above)
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle-token)',
        },

        // Interactive: hover:bg-interactive-hover, etc.
        interactive: {
          hover: 'var(--interactive-hover-bg)',
          active: 'var(--interactive-active-bg)',
        },

        // Ring: ring-accent-ring
        'accent-ring': 'var(--ring-accent)',

        // Palette colors (resolve per-theme via CSS variables)
        palette: {
          primary: 'var(--primary)',
          secondary: 'var(--secondary)',
          tertiary: 'var(--tertiary)',
          quaternary: 'var(--quaternary)',
          quinary: 'var(--quinary)',
          senary: 'var(--senary)',
        },

        // Action semantics: text-action-queue, border-action-swap, bg-action-done etc.
        action: {
          play: 'var(--action-play)',
          queue: 'var(--action-queue)',
          frame: 'var(--action-frame)',
          swap: 'var(--action-swap)',
          done: 'var(--action-done)',
        },
      },
      // Semantic text colors: text-primary, text-secondary, text-tertiary, text-inverse
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        inverse: 'var(--text-inverse)',
        accent: 'var(--accent-primary)',
      },
      // Semantic placeholder: placeholder-tertiary
      placeholderColor: {
        tertiary: 'var(--placeholder)',
      },
      // Semantic ring: ring-accent
      ringColor: {
        accent: 'var(--ring-accent)',
      },
      // Semantic border color
      borderColor: {
        accent: 'var(--accent-primary)',
        DEFAULT: 'var(--border-default)',
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
        'jb-mono': ['var(--font-jetbrains-mono)', 'monospace'],
        'bebas-neue': ['var(--font-bebas-neue)', 'Impact', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        sans: ['system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-reverse': 'float 10s ease-in-out infinite reverse',
        'border-glow': 'border-glow 3s linear infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'blink': 'blink 1s ease-in-out infinite',
        // Toast animations
        'toast-slide-in': 'toast-slide-in 0.3s ease-out',
        'toast-fade-out': 'toast-fade-out 0.2s ease-in forwards',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, 20px)' },
        },
        'border-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px var(--tertiary))' },
          '33%': { filter: 'drop-shadow(0 0 20px var(--secondary))' },
          '66%': { filter: 'drop-shadow(0 0 20px var(--quaternary))' },
        },
        'pulse-neon': {
          '0%, 100%': {
            boxShadow: '0 0 10px var(--secondary), inset 0 0 10px color-mix(in srgb, var(--secondary) 10%, transparent)'
          },
          '50%': {
            boxShadow: '0 0 30px var(--secondary), inset 0 0 20px color-mix(in srgb, var(--secondary) 20%, transparent)'
          },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        // Toast keyframes
        'toast-slide-in': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        'toast-fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, var(--tertiary), var(--secondary), var(--quaternary))',
        'title-gradient': 'linear-gradient(180deg, white 0%, var(--quaternary) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
