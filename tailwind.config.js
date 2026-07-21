/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // Supabase-inspired neutral + green palette
        brand: {
          50: '#eefdf5',
          100: '#d6f9e6',
          200: '#b0f2cf',
          300: '#76e6ac',
          400: '#3ecf8e',
          500: '#24b47e',
          600: '#16a372',
          700: '#128261',
          800: '#136a55',
          900: '#125648',
          950: '#073027',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        card: '0 1px 3px rgba(15,23,42,0.05), 0 4px 12px rgba(15,23,42,0.05)',
        lift: '0 8px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        'slide-in': 'slide-in 0.22s ease-out',
      },
    },
  },
  plugins: [],
};
