// ------ vite.config.js ----------------------------------------
// Settings for Vite, the tool that builds and runs ORACLE.
// The only custom part is the dev proxy below. It does the same
// job as api/backboard.js, but only when you run `npm run dev`
// on your computer, because Vite does not run Vercel functions.
// -------------------------------------------------------------

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Read BACKBOARD_API_KEY from .env. The '' means "read all
  // variables, not only VITE_ ones". The key stays in this file
  // on your computer and is never sent to the browser.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Any call to /api/backboard is caught here while developing
        '/api/backboard': {
          target: 'https://app.backboard.io',
          changeOrigin: true,

          // /api/backboard?path=threads/messages
          // becomes /api/threads/messages on Backboard
          rewrite: (url) => {
            const path = new URL(url, 'http://localhost').searchParams.get('path')
            return `/api/${path}`
          },

          // Add the secret key on the way out
          headers: { 'X-API-Key': env.BACKBOARD_API_KEY }
        }
      }
    }
  }
})