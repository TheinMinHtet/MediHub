/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#F5F7F5',
          100: '#EBF2ED',
          200: '#CFDDD2',
          300: '#A9C4B1',
          400: '#829688',
          500: '#5A7C65',
          600: '#486552',
          700: '#3D5A47',
          800: '#2F4838',
          900: '#1C2A21',
        },
      },
    },
  },
  plugins: [],
};
