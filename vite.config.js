import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single config enabling LAN access
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.1.79', // bind to specific IP
    port: 5173,
    strictPort: true,
    cors: true
  }
})
