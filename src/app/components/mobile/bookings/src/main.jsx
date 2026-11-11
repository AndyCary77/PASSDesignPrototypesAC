import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyPlatform } from '../../assets/platform'
import '../../assets/colors.css'
import '../../assets/main.css'
import '../../assets/mobile.css'
import '../../assets/customer-flags.css'
import '../../assets/week-strip.css'
import '../../assets/touch-cursor.css'
import '../../assets/bottom-sheet.css'
import '../../assets/adjustments-content.css'
import '../../assets/adjustments-sheet.css'
import './bookings.css'
import './visit.css'
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
