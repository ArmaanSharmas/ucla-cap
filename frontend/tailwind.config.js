/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ucla: {
          blue: '#2D68C4',
          'blue-dark': '#1d50a0',
          'blue-light': '#4a82d8',
          gold: '#F2A900',
          'gold-dark': '#d49000',
          navy: '#003B5C',
          'navy-dark': '#002a42',
          'navy-light': '#004a75',
        },
      },
    },
  },
  plugins: [],
}
