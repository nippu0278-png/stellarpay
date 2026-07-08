import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.browser': true,
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      stream: 'readable-stream',
      events: 'events',
      util: 'util',
    }
  }
})

