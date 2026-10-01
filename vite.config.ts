import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export default defineConfig(({ command, mode }) => {
  // Without these the bundler dead-code-eliminates the app (src/lib/supabase.ts
  // throws), producing a "successful" blank build. Fail the build instead.
  if (command === 'build') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
    const missing = REQUIRED_ENV.filter((key) => !env[key])
    if (missing.length > 0) {
      throw new Error(`Missing ${missing.join(', ')}. Set them in .env.local or the host's env.`)
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
