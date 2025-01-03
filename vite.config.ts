import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { PluginOption } from 'vite'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), basicSsl()],
  worker: {
    format: 'es',
    plugins: () => [] as PluginOption[]
  },
  assetsInclude: ['**/*.mp3'],
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks: {
          worklet: [
            './src/audio/worklets/playback-processor.ts',
            './src/audio/worklets/distortion-processor.ts',
            './src/audio/worklets/decimator-processor.ts'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src')
    }
  },
  server: {
    cors: true,
    host: '0.0.0.0',
    headers: {
      'Permissions-Policy': 'private-state-token-redemption=(), private-state-token-issuance=(), browsing-topics=()'
    },
    fs: {
      // enable access to parent directory
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['src/audio/worklets/*']
  },
  base: './',
})
