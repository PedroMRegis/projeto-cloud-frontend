import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Em desenvolvimento, o proxy reproduz as regras de rota do ALB:
//   /api/chat*, /api/conversations*  -> chatbot
//   /api/*                           -> backend-api
// Em produção quem faz isso é o listener do ALB; o frontend só usa caminhos
// relativos e não conhece endereço de serviço nenhum.
const chatbot = process.env.CHATBOT_URL ?? 'http://localhost:8002'
const backend = process.env.BACKEND_URL ?? 'http://localhost:8001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/chat': { target: chatbot, changeOrigin: true },
      '/api/conversations': { target: chatbot, changeOrigin: true },
      '/api': { target: backend, changeOrigin: true },
    },
  },
})
