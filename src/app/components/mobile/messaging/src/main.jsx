import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyPlatform } from '../../assets/platform'
// PasswordGate (../../assets/auth) is built and ready but deliberately not
// wired in right now — see memory: project_password_gate. Re-add by
// importing it plus '../../assets/auth.css' and wrapping <App /> below.
import '../../assets/colors.css'
import '../../assets/main.css'
import '../../assets/mobile.css'
import '../../assets/mobile-account.css'
import './messaging.css'
// Last, so the platform layer can override this app's own styles. (Android styling isn't wired
// in here — these two still hand-roll their phone frame; see project_mobile_platform_toggle.)
import '../../assets/ios-liquid-glass.css'
import './ios-glass.css'

// Stamp data-platform on <html> before first render so the iOS 26 layer applies from first paint.
applyPlatform()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
