import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    strictPort: false,
  },
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
      'embla-carousel-autoplay',
      'embla-carousel-react',
      'exceljs',
      'xlsx',
      'jspdf',
      'jspdf-autotable',
      'jszip',
      'recharts',
      'react-hook-form',
      'zod'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./assets"),
    },
  },
});
