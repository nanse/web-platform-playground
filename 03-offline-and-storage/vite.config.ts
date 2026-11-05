import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { https } from '../scripts/cert.ts'

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // shared/의 컴포넌트가 import하는 react를 이 샘플의 것으로 찾게 해요.
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { https, port: 5103, strictPort: true },
  preview: { https, port: 5103, strictPort: true },
})
