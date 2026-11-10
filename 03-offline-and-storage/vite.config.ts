import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'
import { https } from '../scripts/cert.ts'

type Like = { jobId: number; liked: boolean; likedAt: string }

// Background Sync가 보낼 곳이에요. 받은 좋아요를 서버 메모리에 둬서, 서버를 다시 켜면 사라져요.
// 받은 시각을 같이 남겨서, 화면이 "누른 시각"과 "서버가 받은 시각"을 나란히 보여줘요.
function likesApi(): Plugin {
  const likes = new Map<number, Like & { receivedAt: string }>()
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url !== '/api/likes') return next()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') return res.end(JSON.stringify([...likes.values()]))
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const like = JSON.parse(body) as Like
        if (like.liked) likes.set(like.jobId, { ...like, receivedAt: new Date().toISOString() })
        else likes.delete(like.jobId)
        res.end(JSON.stringify([...likes.values()]))
      } catch {
        res.statusCode = 400
        res.end('{}')
      }
    })
  }
  return {
    name: 'likes-api',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  }
}

// 포트를 고정해야 origin이 안 바뀌어서 SW·저장소 상태가 이어져요.
export default defineConfig({
  plugins: [react(), tailwindcss(), likesApi()],
  // shared/의 컴포넌트가 import하는 react를 이 샘플의 것으로 찾게 해요.
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { https, port: 5103, strictPort: true },
  preview: { https, port: 5103, strictPort: true },
})
