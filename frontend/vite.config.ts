import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'polkadot-vendor': ['@polkadot/api', '@polkadot/api-contract', '@polkadot/extension-dapp'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  preview: {
    port: 3000,
  },
})
