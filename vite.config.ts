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
