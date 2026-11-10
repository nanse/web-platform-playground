'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

// 레이아웃은 앱 안에서 화면을 바꿔도 그대로 남아요. 그래서 여기 만든 캐시도 목록과 상세를 오가는 동안 살아 있어요.
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
