/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2.2s infinite',
      },
      zIndex: {
        100: '100',
      },
    },
  },
  plugins: [],
}
