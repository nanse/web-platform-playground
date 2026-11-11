import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'
import { https } from '../scripts/cert.ts'
import { applyApi } from './apply-server.ts'

// 1.5초 늦게 답하는 가짜 사용자 API예요. 요청이 겹치는 순간을 손으로 만들 수 있게 일부러 느리게 했어요.
const slowUser: Connect.SimpleHandleFunction = (req, res) => {
  // use('/api/user', ...)로 붙여서 req.url은 '/1'처럼 남은 부분만 와요.
  const id = Number(req.url?.slice(1))
  const timer = setTimeout(() => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ id, name: `${id}번 사용자` }))
  }, 1500)
  // 브라우저가 요청을 끊으면(abort) 답을 보내지 않아요.
  res.on('close', () => clearTimeout(timer))
}

const userApi: Plugin = {
  name: 'slow-user-api',
  configureServer: (server) => void server.middlewares.use('/api/user', slowUser),
  configurePreviewServer: (server) => void server.middlewares.use('/api/user', slowUser),
}

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  // applyApi: 원티드 지원하기 서버 흉내(실패 쿨다운 캐시)예요. apply-server.ts에 있어요.
  plugins: [react(), tailwindcss(), userApi, applyApi()],
  // shared/의 컴포넌트가 import하는 react를 이 샘플의 것으로 찾게 해요.
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { https, port: 5107, strictPort: true },
  preview: { https, port: 5107, strictPort: true },
})
