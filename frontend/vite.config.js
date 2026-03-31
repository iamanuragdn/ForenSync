import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ForenSync',
        short_name: 'ForenSync',
        description: 'Your entire academic world, perfectly synced.',
        theme_color: '#0f172a', 
        icons: [
          {
            src: 'logo_muted_blue.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_muted_blue.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})