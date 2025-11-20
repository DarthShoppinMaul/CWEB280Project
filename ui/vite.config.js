import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // 🔑 CRITICAL: Allows external connections
    port: 5173,
    cors: true,
  }
})