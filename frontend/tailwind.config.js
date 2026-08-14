/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#07090e',
          900: '#0d111a',
          850: '#121724',
          800: '#181f30',
          700: '#222b42',
          600: '#2f3b59',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 20px 30px -10px rgba(15, 23, 42, 0.08), 0 8px 10px -4px rgba(15, 23, 42, 0.03)',
        glass: '0 20px 50px rgba(15, 23, 42, 0.06)',
        glow: '0 0 28px rgba(99, 102, 241, 0.25)',
        'glow-lg': '0 0 45px rgba(99, 102, 241, 0.35)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        'subtle-grid': 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 1px, transparent 1px)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
