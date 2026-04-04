import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        protein: '#0F9E75',
        carbs: '#E09B20',
        fat: '#D85A30',
        pro: '#7F77DD',
      },
    },
  },
  plugins: [],
}

export default config
