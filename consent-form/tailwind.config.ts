import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Hiragino Kaku Gothic ProN', 'Hiragino Sans',
          'Noto Sans JP', 'Meiryo', '"Yu Gothic"', 'sans-serif',
        ],
        serif: [
          'Hiragino Mincho ProN', 'Noto Serif JP',
          '"Yu Mincho"', 'Georgia', 'serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config
