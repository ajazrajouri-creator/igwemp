/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // IGWEMP Brand — Deep Indigo / Slate dark theme
        brand: {
          50:  'hsl(238, 100%, 97%)',
          100: 'hsl(238, 90%, 93%)',
          200: 'hsl(238, 85%, 85%)',
          300: 'hsl(238, 80%, 75%)',
          400: 'hsl(238, 75%, 65%)',
          500: 'hsl(238, 70%, 55%)',   // primary
          600: 'hsl(238, 68%, 46%)',
          700: 'hsl(238, 66%, 38%)',
          800: 'hsl(238, 64%, 28%)',
          900: 'hsl(238, 62%, 18%)',
          950: 'hsl(238, 60%, 10%)',
        },
        // Semantic status colors
        status: {
          overdue:  'hsl(0, 72%, 51%)',
          today:    'hsl(25, 95%, 53%)',
          week:     'hsl(38, 92%, 50%)',
          upcoming: 'hsl(217, 91%, 60%)',
        },
        // Dark surface scale
        surface: {
          0:   'hsl(224, 20%, 6%)',   // deepest bg
          1:   'hsl(224, 18%, 9%)',   // page bg
          2:   'hsl(224, 16%, 12%)',  // card bg
          3:   'hsl(224, 14%, 16%)',  // elevated card
          4:   'hsl(224, 12%, 20%)',  // border
          5:   'hsl(224, 10%, 30%)',  // muted border
        },
        // Text scale
        ink: {
          primary:   'hsl(220, 20%, 95%)',
          secondary: 'hsl(220, 10%, 70%)',
          muted:     'hsl(220, 8%, 50%)',
          disabled:  'hsl(220, 6%, 35%)',
        },
      },
      borderRadius: {
        'none': '0',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'glow-brand': '0 0 20px hsl(238, 70%, 55% / 0.3)',
        'glow-sm':    '0 0 8px hsl(238, 70%, 55% / 0.2)',
        'card':       '0 1px 3px hsl(0, 0%, 0% / 0.4), 0 1px 2px hsl(0, 0%, 0% / 0.3)',
        'card-hover': '0 4px 12px hsl(0, 0%, 0% / 0.5), 0 2px 4px hsl(0, 0%, 0% / 0.4)',
        'sidebar':    '2px 0 12px hsl(0, 0%, 0% / 0.3)',
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, hsl(238, 70%, 55%), hsl(258, 70%, 45%))',
        'gradient-surface':  'linear-gradient(180deg, hsl(224, 18%, 9%), hsl(224, 20%, 6%))',
        'gradient-card':     'linear-gradient(145deg, hsl(224, 16%, 12%), hsl(224, 18%, 10%))',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft':  'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':     'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
