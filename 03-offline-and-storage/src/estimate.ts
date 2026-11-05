import { useEffect, useState } from 'react'

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}바이트`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)}MB`
  return `${(bytes / 1024 ** 3).toFixed(1)}GB`
}

/** 이 사이트가 쓰는 저장 공간과, 브라우저가 지우지 않게 약속했는지. version이 바뀌면 다시 읽어요. */
export function useStorageInfo(version: unknown) {
  const [info, setInfo] = useState<{ usage: string; persisted: string }>({ usage: '확인하는 중', persisted: '확인하는 중' })

  useEffect(() => {
    if (!navigator.storage?.estimate) return setInfo({ usage: '확인할 수 없어요', persisted: '확인할 수 없어요' })
    void Promise.all([navigator.storage.estimate(), navigator.storage.persisted?.() ?? false]).then(([{ usage = 0, quota = 0 }, persisted]) =>
      setInfo({
        usage: `${formatBytes(usage)} / ${formatBytes(quota)}`,
        persisted: persisted ? '지우지 않기로 했어요' : '공간이 모자라면 지울 수 있어요',
      }),
    )
  }, [version])

  return info
}
