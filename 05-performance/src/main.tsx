import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const entryTypes = PerformanceObserver.supportedEntryTypes
const features = {
  'LCP (largest-contentful-paint)': entryTypes.includes('largest-contentful-paint'),
  'INP (event)': entryTypes.includes('event'),
  'CLS (layout-shift)': entryTypes.includes('layout-shift'),
  'bfcache notRestoredReasons': 'notRestoredReasons' in PerformanceNavigationTiming.prototype,
  'Speculation Rules': HTMLScriptElement.supports?.('speculationrules') ?? false,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>05 · Performance</h1>
    <p>isSecureContext: {isSecureContext ? '✅' : '❌ https://localhost로 열어야 대부분의 기능이 동작해요'}</p>
    <ul>
      {Object.entries(features).map(([name, ok]) => (
        <li key={name}>
          {ok ? '✅' : '❌'} {name}
        </li>
      ))}
    </ul>
  </StrictMode>,
)
