import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'casino-dark':       '#07070F',
        'casino-dark2':      '#0C0C18',
        'casino-dark3':      '#11111F',
        'casino-gold':       '#C9A227',
        'casino-gold-dark':  '#9A7A1E',
        'casino-gold-light': '#F0D060',
        'casino-red':        '#8B0000',
        'casino-red-bright': '#CC2200',
        'casino-cream':      '#EDE0C4',
        'casino-muted':      '#787890',
        'casino-green':      '#00C853',
        'casino-border':     'rgba(201,162,39,0.22)',
      },
    },
  },
  plugins: [],
}

export default config
