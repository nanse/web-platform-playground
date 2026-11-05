import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { https } from '../scripts/cert.ts'

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // shared/의 컴포넌트가 import하는 react를 이 샘플의 것으로 찾게 해요.
  resolve: { dedupe: ['react', 'react-dom'] },
  // bfcache와 Speculation Rules는 "다른 문서로 이동"해야 보여서, 두 번째 페이지(other.html)도 같이 빌드해요.
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        other: fileURLToPath(new URL('other.html', import.meta.url)),
      },
    },
  },
  server: { https, port: 5105, strictPort: true },
  preview: { https, port: 5105, strictPort: true },
})
