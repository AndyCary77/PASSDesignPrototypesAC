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
import './account.css'
// Last, so it can override the app's own styles — this is the platform
// override layer, and several of its rules are single-class.
import '../../assets/android.css'

// Stamp data-platform on <html> before the first render, so the chosen
// platform's chrome paints straight away rather than flashing iOS first.
applyPlatform()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
