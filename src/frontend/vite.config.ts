import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Load connection config
// Try to load from frontend directory first, then fall back to parent directory
let configPath = path.resolve(__dirname, './connection.config.json')
if (!fs.existsSync(configPath)) {
  configPath = path.resolve(__dirname, '../connection.config.json')
}
const connectionConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

// Get backend configuration
const { backend, proxy } = connectionConfig

// Always use IPv4 for the backend connection to avoid IPv6 issues
// This ensures we always connect via 127.0.0.1 instead of [::1]
const backendHost = '127.0.0.1' // Force IPv4
const backendUrl = `${backend.protocol}://${backendHost}:${backend.port}`
const wsBackendUrl = `ws://${backendHost}:${backend.port}`

// Log the configuration
console.log(`Using IPv4 address (${backendHost}) to connect to backend`)

console.log(`Configuring Vite proxy to backend at: ${backendUrl}`)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [proxy.api_path]: {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(new RegExp(`^${proxy.api_path}`), '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      [proxy.ws_path]: {
        target: wsBackendUrl,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@api': path.resolve(__dirname, './src/api'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@context': path.resolve(__dirname, './src/context'),
      '@store': path.resolve(__dirname, './src/store'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
})
