import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from './providers'
import './style.css'

// 아이콘이 없으면 브라우저가 /favicon.ico를 요청해서 404가 나요. 빈 아이콘으로 막아요.
export const metadata: Metadata = { title: '05 · bfcache in Next.js', icons: 'data:,' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
