/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark neon sci-fi theme colors
        neon: {
          cyan: '#00ffff',
          purple: '#9f40ff',
          pink: '#ff00ff',
          green: '#00ff41',
          blue: '#0080ff'
        },
        cyber: {
          dark: '#0a0a0a',
          darker: '#050505',
          gray: '#1a1a1a',
          light: '#2a2a2a'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        flicker: 'flicker 1.5s infinite alternate'
      },
      keyframes: {
        glow: {
          from: {
            'text-shadow': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff'
          },
          to: {
            'text-shadow': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff'
          }
        },
        flicker: {
          '0%, 18%, 22%, 25%, 53%, 57%, 100%': {
            'text-shadow': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff, 0 0 20px #00ffff'
          },
          '20%, 24%, 55%': {
            'text-shadow': 'none'
          }
        }
      },
      boxShadow: {
        neon: '0 0 5px theme(colors.neon.cyan), 0 0 20px theme(colors.neon.cyan), 0 0 35px theme(colors.neon.cyan)',
        'neon-purple':
          '0 0 5px theme(colors.neon.purple), 0 0 20px theme(colors.neon.purple), 0 0 35px theme(colors.neon.purple)',
        'neon-pink':
          '0 0 5px theme(colors.neon.pink), 0 0 20px theme(colors.neon.pink), 0 0 35px theme(colors.neon.pink)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
