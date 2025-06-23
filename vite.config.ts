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
    include: ['@visx/heatmap', '@visx/scale', '@visx/responsive', '@visx/tooltip', 'react-simple-maps'],
    esbuildOptions: { target: 'es2019' },
    exclude: ['lucide-react'],
  },
});