/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-yellow': '#FFF9E6',
        'accent-pink': '#FFD6E7',
        'accent-blue': '#D6E9FF',
        'accent-lavender': '#E6D6FF',
        'text-dark': '#333333',
        'text-light': '#666666',
        'border-light': '#E8E8E8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'], // More elegant font
      },
    },
  },
  plugins: [],
}