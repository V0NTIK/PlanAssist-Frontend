import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],
      manifest: {
        name: 'PlanAssist – OneSchool Global',
        short_name: 'PlanAssist',
        description: 'AI-powered study planner for OneSchool Global students',
        theme_color: '#7c3aed',
        background_color: '#f5f3ff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          },
        ],
        categories: ['education', 'productivity'],
        shortcuts: [
          {
            name: 'My Tasks',
            short_name: 'Tasks',
            description: 'Go to your task list',
            url: '/?page=tasks',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Calendar',
            short_name: 'Calendar',
            description: 'View your weekly calendar',
            url: '/?page=calendar',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Start Session',
            short_name: 'Session',
            description: 'Start a study session',
            url: '/?page=sessions',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        skipWaiting: true,      // new SW activates immediately on install
        clientsClaim: true,     // new SW takes control of all open tabs right away
        // Cache the app shell (HTML, JS, CSS) for instant loads
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Network-first for API calls (always fresh data)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/planassist-api\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Don't cache these — always need fresh auth/sync
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: false, // Don't run SW in dev mode
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
