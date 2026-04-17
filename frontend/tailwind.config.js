export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a', // Navy Blue
          light: '#3b82f6',
          dark: '#172554',
        },
        accent: {
          DEFAULT: '#fbbf24', // Gold
          hover: '#d97706',
        },
        surface: '#f3f4f6', // Light Grey for backgrounds
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
}