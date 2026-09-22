/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4D6B16',
          light: '#6F8F24',
          faint: '#F1F3EC',
        },
        ink: '#171717',
        muted: '#6B6B63',
        subtle: '#92928A',
        surface: '#F7F7F2',
        card: '#FFFFFF',
        border: '#E4E5DC',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
