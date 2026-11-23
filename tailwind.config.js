/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pinterest: {
          red: '#E60023',
          redHover: '#ad081b',
          dark: '#111111',
          gray: '#767676',
          lightGray: '#EFEFEF',
          hoverGray: '#E2E2E2',
        },
      },
    },
  },
  plugins: [],
}
