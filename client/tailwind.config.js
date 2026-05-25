/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uady: {
          blue: '#003b71',
          gold: '#d4af37',
        }
      }
    },
  },
  plugins: [],
}
