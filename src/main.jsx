import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker.
// With skipWaiting+clientsClaim in workbox, the new SW activates immediately.
// We listen for the onNeedRefresh callback (fired when a new SW has installed)
// and dispatch a custom event so App.jsx can show the update banner.
registerSW({
  onNeedRefresh() {
    // New SW installed and active — notify the app to show the update banner
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  onOfflineReady() {
    // App is cached and ready for offline use — no UI needed
  },
  onRegistered(swRegistration) {
    // Poll for SW updates every 60 seconds while the app is open
    if (swRegistration) {
      setInterval(() => swRegistration.update(), 60 * 1000);
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
