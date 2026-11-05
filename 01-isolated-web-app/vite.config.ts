import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { https } from '../scripts/cert.ts'

// IWA 안에서는 브라우저가 이 헤더와 CSP를 강제해요. 일반 탭에서 열어도 똑같이 막히도록 preview에서 미리 맞춰둬요.
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "connect-src 'self' https: wss: blob: data:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: blob: data:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
    "require-trusted-types-for 'script'",
  ].join('; '),
}

// HMR은 IWA에서 동작하지 않아서 dev도 build + preview로 띄워요.
export default defineConfig({
  plugins: [react()],
  server: { https, port: 5111, strictPort: true },
  preview: { https, port: 5111, strictPort: true, headers },
})
