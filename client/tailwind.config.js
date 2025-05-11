/** @type {import('tailwindcss').Config} */
const tailwindcssAnimate = require('tailwindcss-animate')

module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        screen: '#26453D',
        surface: '#E6DCC7',
        'primary-hover': '#FF9A5A',
        'primary-active': '#E67336',
        'secondary-hover': '#FF6D3B',
        'text-primary': '#2B2B2B',
        'text-secondary': '#5BB3DB',
        'accent-glow': '#FF5722',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        luckiest: ["'Luckiest Guy'", 'cursive'],
        bangers: ["'Bangers'", 'cursive'],
        rubik: ["'Rubik'", 'sans-serif'],
        fredoka: ["'Fredoka'", 'sans-serif'],
      },
    },
  },
  plugins: [
    tailwindcssAnimate
  ],
}
