import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow access from network (for mobile device testing)
    https: false, // Set to true if you need HTTPS for local development
    // Note: Web Speech API requires HTTPS in production, but works on localhost without it
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})


