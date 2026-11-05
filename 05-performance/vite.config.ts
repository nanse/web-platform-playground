import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { https } from '../scripts/cert.ts'

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  plugins: [react()],
  server: { https, port: 5105, strictPort: true },
  preview: { https, port: 5105, strictPort: true },
})
