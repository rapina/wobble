import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Use absolute path for web deployment (Vercel), relative for Capacitor
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true'
  const isDebugBuild = mode === 'development'

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      // Custom flag for debug builds (import.meta.env.DEV is always false in vite build)
      __DEV_BUILD__: JSON.stringify(isDebugBuild),
      // Ensure proper NODE_ENV for debug builds
      'process.env.NODE_ENV': JSON.stringify(isDebugBuild ? 'development' : 'production'),
    },
    plugins: [react(), tailwindcss()],
    base: isCapacitorBuild ? './' : '/', // './' for Capacitor, '/' for web
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
      // Debug build settings
      minify: isDebugBuild ? false : 'esbuild',
      sourcemap: isDebugBuild ? true : false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
