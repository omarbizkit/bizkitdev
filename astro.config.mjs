// @ts-check
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server', // Server-side rendering for API routes
  adapter: node({
    mode: 'standalone'
  }),
  site: 'https://bizkit.dev',
  
  // Build configuration
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto'
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '4321'),
    host: process.env.HOST || 'localhost'
  },
  
  // Image optimization
  image: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.unsplash.com'
    }]
  },
  
  // Vite configuration
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['astro'],
            'ui': ['@astrojs/tailwind']
          }
        }
      }
    },
    ssr: {
      noExternal: ['@supabase/supabase-js']
    }
  }
})
