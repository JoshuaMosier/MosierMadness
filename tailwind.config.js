/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'mm-blue': '#0a3161',
        'mm-gold': '#ac9437',
        'mm-gray': '#2d2d2d',
        'mm-night': '#06070b',
        'mm-ink': '#0f172a',
        'mm-ember': '#f59e0b',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        display: ['Barlow Condensed', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
