import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Use absolute path for web deployment (Vercel), relative for Capacitor
  const isCapacitorBuild = mode === 'development' || process.env.CAPACITOR_BUILD === 'true'

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [react(), tailwindcss()],
    base: isCapacitorBuild ? './' : '/', // './' for Capacitor, '/' for web
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
