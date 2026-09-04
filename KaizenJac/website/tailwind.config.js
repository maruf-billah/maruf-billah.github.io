/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          amber: '#D97706',
          blue: '#2563EB',
          teal: '#0D9488',
        }
      }
    },
  },
  plugins: [],
}
