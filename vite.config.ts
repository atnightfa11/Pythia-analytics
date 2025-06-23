import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  optimizeDeps: {
    include: ['react-simple-maps'],
    esbuildOptions: { target: 'es2019' },
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts', 'react-chartjs-2', 'chart.js'],
          'map-vendor': ['react-simple-maps']
        }
      }
    }
  }
});