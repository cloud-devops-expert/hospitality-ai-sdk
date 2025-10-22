import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1e3a8a', // navy blue
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4b9fc',
          400: '#8094f8',
          500: '#6370f1',
          600: '#4e54e5',
          700: '#3f41ca',
          800: '#3437a3',
          900: '#1e3a8a', // Primary navy blue
          950: '#1a2659',
        },
      },
    },
  },
  plugins: [],
};
export default config;
