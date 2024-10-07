import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import replace from '@rollup/plugin-replace'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    replace({
      BUILD_TIMESTAMP: () => JSON.stringify(new Date().toISOString()),
      preventAssignment: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vernam',
        short_name: 'Vernam',
        background_color: '#000000',
        theme_color: '#000000',
        lang: undefined,
        icons: [
          {
            "src": "/img/favicon-16x16.png",
            "sizes": "16x16",
            "type": "image/png"
          },
          {
            "src": "/img/favicon-32x32.png",
            "sizes": "32x32",
            "type": "image/png"
          },
          {
            "src": "/img/favicon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/img/favicon-256x256.png",
            "sizes": "256x256",
            "type": "image/png"
          },
          {
            "src": "/img/favicon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1024,
  },
})
