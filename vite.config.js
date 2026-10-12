import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The SPA talks to the Express API on the same origin, so dev needs a proxy.
    proxy: {
      '/api': {
        // 127.0.0.1 e não "localhost": a API liga em IPv4 e o Node pode
        // resolver "localhost" para ::1, o que viraria um 502 no proxy.
        target: process.env.API_URL ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
