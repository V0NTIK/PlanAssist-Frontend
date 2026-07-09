import React from 'react'
import ReactDOM from 'react-dom/client'
import Shutdown from './Shutdown.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker.
// With skipWaiting+clientsClaim in workbox, the new SW activates immediately
// and claims all tabs. We listen for controllerchange — fired when the new SW
// takes control — and reload the page so users always get the latest assets.
//
// Why controllerchange instead of onNeedRefresh:
//   registerType:'autoUpdate' causes the plugin to call updateSW() automatically,
//   bypassing onNeedRefresh. The controllerchange event is the reliable signal
//   that the new SW has fully activated and the page should reload.

let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

registerSW({
  onNeedRefresh() {
    // autoUpdate mode handles this automatically; no manual banner needed.
    // The controllerchange listener above will reload the page.
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
    <Shutdown />
  </React.StrictMode>,
)
