import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for SouthStack IDE
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize for browser runtime
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    // Exclude WebContainer API from optimization (will add later)
    exclude: ['@webcontainer/api'],
  },
});
