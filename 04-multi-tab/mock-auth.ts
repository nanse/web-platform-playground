// 원티드처럼 동작하는 아주 작은 가짜 인증 서버예요. Vite 서버(dev, preview)에 붙여요.
// - 로그인·로그아웃은 브라우저가 주소로 이동하는 GET 요청이에요. 응답 헤더(Set-Cookie)로 httpOnly 쿠키를 만들고 지운 뒤 redirect_url로 돌려보내요.
// - 세션 확인(/v1/me)은 쿠키가 있으면 200, 없으면 401을 돌려줘요.
// 진짜 원티드는 인증 서버가 다른 서브도메인에 있지만, 이 샘플은 같은 주소(https://localhost:5104)에 있어요.
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

export const SESSION_COOKIE = 'lab_session'

const ACTIONS: Record<string, 'login' | 'logout' | undefined> = {
  '/v1/auth/login': 'login',
  '/v1/auth/logout': 'logout',
}

function hasSession(req: IncomingMessage) {
  return (req.headers.cookie ?? '').split(/;\s*/).some((pair) => pair.startsWith(`${SESSION_COOKIE}=`) && pair.length > SESSION_COOKIE.length + 1)
}

function handle(req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) {
  // HTTPS로 띄운 Vite 서버는 HTTP/2로 응답해요. HTTP/2 요청에는 Host 헤더 대신 :authority가 와요.
  const host = req.headers.host ?? req.headers[':authority']
  const url = new URL(req.url ?? '/', `https://${host}`)

  if (url.pathname === '/v1/me') {
    const signedIn = hasSession(req)
    res.statusCode = signedIn ? 200 : 401
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify(signedIn ? { name: '원티드 회원' } : { error: 'unauthorized' }))
  }

  const action = ACTIONS[url.pathname]
  if (!action) return next()

  // 아무 주소로나 돌려보내면 피싱에 쓰일 수 있어서(열린 리다이렉트), 같은 주소로만 돌려보내요.
  let target: URL
  try {
    target = new URL(url.searchParams.get('redirect_url') ?? '/', url.origin)
  } catch {
    target = new URL('/', url.origin)
  }
  if (target.origin !== url.origin) {
    res.statusCode = 400
    return res.end('redirect_url은 같은 주소만 쓸 수 있어요.')
  }

  // 로그인은 쿠키를 만들고, 로그아웃은 Max-Age=0으로 만료시켜요. HttpOnly라서 JavaScript로는 읽을 수도 지울 수도 없어요.
  const cookie = action === 'login' ? `${SESSION_COOKIE}=${crypto.randomUUID()}; Max-Age=3600` : `${SESSION_COOKIE}=; Max-Age=0`
  res.statusCode = 302
  res.setHeader('Set-Cookie', `${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax`)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Location', target.href)
  res.end()
}

export function mockAuth(): Plugin {
  return {
    name: 'mock-auth',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  }
}
