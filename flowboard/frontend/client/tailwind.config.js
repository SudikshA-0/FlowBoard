/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          // Pastel pink → lavender (light theme friendly), still strong enough for accents.
          50:  '#FFF1F7', // blush
          100: '#FFE4F0',
          200: '#FFC8E2',
          300: '#F9A8D4', // pink-300-ish
          400: '#E879F9', // fuchsia-ish
          500: '#C084FC', // lavender accent
          600: '#A855F7',
          700: '#7C3AED',
          800: '#5B21B6',
          900: '#3B0764',
        },
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.14)',
        modal: '0 32px 80px rgba(0,0,0,0.35)',
      },
      animation: {
        'slide-up':   'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)',
        'fade-in':    'fadeIn 0.2s ease',
        'bounce-sm':  'bounceSm 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        slideUp:  { from: { opacity:'0', transform:'translateY(20px) scale(.97)' }, to:{ opacity:'1', transform:'none' } },
        fadeIn:   { from: { opacity:'0' }, to:{ opacity:'1' } },
        bounceSm: { '0%':{ transform:'scale(.9)' }, '60%':{ transform:'scale(1.04)' }, '100%':{ transform:'scale(1)' } },
      },
    },
  },
  plugins: [],
};
