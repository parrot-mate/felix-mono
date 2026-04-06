import type { Config } from 'tailwindcss'
import theme from '@pmate/theme'

export default {
  content: {
    files: [
      './index.html',
      './src/**/*.{ts,tsx,html}',
      './**/*.stories.{js,ts,jsx,tsx}'
    ],
  },
  theme,
  plugins: []
} satisfies Config
