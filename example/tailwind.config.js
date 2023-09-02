/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(-50px, -50px)' },
          '50%': { transform: 'translate(100px, 50px) rotate(360deg)' },
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')]
}
