import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { https } from '../scripts/cert.ts'

// SharedArrayBuffer는 이 페이지가 다른 출처와 격리돼 있을 때(crossOriginIsolated)만 쓸 수 있어요.
// 이 샘플은 다른 출처의 파일을 하나도 불러오지 않아서, 두 헤더를 붙여도 다른 화면에 영향이 없어요.
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // shared/의 컴포넌트가 import하는 react를 이 샘플의 것으로 찾게 해요.
  resolve: { dedupe: ['react', 'react-dom'] },
  // 워커에서만 쓰는 의존성은 dev 서버가 처음엔 못 찾아서, 버튼을 누를 때 찾고 페이지를 새로 고쳐요. 미리 알려 둬요.
  optimizeDeps: { include: ['pdf-lib', 'fontkit'] },
  // bfcache와 Speculation Rules는 "다른 문서로 이동"해야 보여서, 두 번째 페이지(other.html)도 같이 빌드해요.
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        other: fileURLToPath(new URL('other.html', import.meta.url)),
      },
    },
  },
  server: { https, port: 5105, strictPort: true, headers: isolation },
  preview: { https, port: 5105, strictPort: true, headers: isolation },
})
