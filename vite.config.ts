import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        // The mobile prototypes are standalone HTML apps (their own React
        // roots), not react-router routes — each needs registering here or
        // `vite build` only emits the root index.html and these 404 in
        // production. `pnpm dev` serves any file path directly, so this gap
        // only shows up after a real build/deploy.
        mobileAccount: path.resolve(__dirname, 'src/app/components/mobile/account/index.html'),
        mobileCareBridge: path.resolve(__dirname, 'src/app/components/mobile/carebridge/index.html'),
        mobileMessaging: path.resolve(__dirname, 'src/app/components/mobile/messaging/index.html'),
        mobileMileagePay: path.resolve(__dirname, 'src/app/components/mobile/mileage-pay/index.html'),
        mobileNotifications: path.resolve(__dirname, 'src/app/components/mobile/notifications/index.html'),
      },
    },
  },
})
