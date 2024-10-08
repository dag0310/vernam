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
            "purpose": "maskable",
            "sizes": "48x48",
            "src": "/img/maskable/maskable_icon_x48.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "72x72",
            "src": "/img/maskable/maskable_icon_x72.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "96x96",
            "src": "/img/maskable/maskable_icon_x96.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "128x128",
            "src": "/img/maskable/maskable_icon_x128.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "192x192",
            "src": "/img/maskable/maskable_icon_x192.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "384x384",
            "src": "/img/maskable/maskable_icon_x384.png",
            "type": "image/png"
          },
          {
            "purpose": "maskable",
            "sizes": "512x512",
            "src": "/img/maskable/maskable_icon_x512.png",
            "type": "image/png"
          }
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
