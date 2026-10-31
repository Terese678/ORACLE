import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The '' lets us read BACKBOARD_API_KEY from .env.
  // It stays in this file and is never sent to the browser.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Same job as api/backboard/[...path].js, but for `npm run dev`
        '/api/backboard': {
          target: 'https://app.backboard.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/backboard/, '/api'),
          headers: { 'X-API-Key': env.BACKBOARD_API_KEY }
        }
      }
    }
  }
})