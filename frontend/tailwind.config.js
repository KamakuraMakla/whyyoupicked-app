/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 14px 40px rgba(148, 163, 184, 0.12)',
        card: '0 18px 45px rgba(15, 118, 110, 0.14)',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        reveal: 'reveal 320ms ease both',
      },
    },
  },
  plugins: [],
}