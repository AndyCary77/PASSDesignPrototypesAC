import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// PasswordGate (../../assets/auth) is built and ready but deliberately not
// wired in right now — see memory: project_password_gate. Re-add by
// importing it plus '../../assets/auth.css' and wrapping <App /> below.
import '../../assets/colors.css'
import '../../assets/main.css'
import '../../assets/mobile.css'
import './notifications.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
