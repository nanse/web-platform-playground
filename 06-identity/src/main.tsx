import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const features = {
  'Passkeys (WebAuthn)': 'PublicKeyCredential' in window,
  'PasswordCredential': 'PasswordCredential' in window,
  'WebOTP': 'OTPCredential' in window,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>06 · Identity</h1>
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
