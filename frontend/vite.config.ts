import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración de Vite para Juliam Inventory Management System
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
})

