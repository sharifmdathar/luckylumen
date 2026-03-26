/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: {
          purple: '#7B61FF',
          blue: '#00D1FF',
        }
      }
    },
  },
  plugins: [],
}
