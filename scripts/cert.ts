// 자체 서명 인증서는 경고를 넘겨도 Service Worker 등록이 막혀요.
// 그래서 로컬 CA를 시스템에 설치해 "신뢰된" 인증서를 만드는 mkcert를 써요.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const key = fileURLToPath(new URL('../.certs/localhost-key.pem', import.meta.url))
const cert = fileURLToPath(new URL('../.certs/localhost.pem', import.meta.url))

if (!existsSync(key) || !existsSync(cert)) {
  mkdirSync(dirname(cert), { recursive: true })
  try {
    // 브라우저용 저장소만. JAVA_HOME이 있으면 java 저장소에 sudo로 넣으려다 실패해요.
    execFileSync('mkcert', ['-install'], { stdio: 'inherit', env: { ...process.env, TRUST_STORES: 'system,nss' } })
    execFileSync('mkcert', ['-key-file', key, '-cert-file', cert, 'localhost', '127.0.0.1', '::1'], {
      stdio: 'inherit',
    })
  } catch (cause) {
    throw new Error('HTTPS 인증서를 만들지 못했어요. mkcert가 설치돼 있는지 확인하고 pnpm cert를 다시 실행해요. (README "localhost(HTTPS)로 실행하기")', {
      cause,
    })
  }
}

export const https = { key: readFileSync(key), cert: readFileSync(cert) }
