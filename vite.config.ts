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

// The shadcn/ui codegen tool that produced src/app/components/ui/* writes
// imports with the package version baked into the specifier itself, e.g.
// "@radix-ui/react-label@2.1.2" or "lucide-react@0.487.0" — presumably
// meant for an import-map-based environment, not a real bundler. These
// don't match how the packages are actually installed (unversioned, per
// package.json), so Rollup can't resolve them. Most ui/ files have never
// actually been imported by a real page before now, so this has stayed
// latent — strip the trailing "@<version>" and resolve normally instead of
// hand-editing every generated file that happens to hit this.
function versionedImportResolver() {
  return {
    name: 'versioned-import-resolver',
    async resolveId(source, importer) {
      const match = source.match(/^((?:@[^/@]+\/)?[^@]+)@\d+\.\d+\.\d+[\w.-]*$/)
      if (!match) return null
      return this.resolve(match[1], importer, { skipSelf: true })
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    versionedImportResolver(),
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
        mobileCustomerDocuments: path.resolve(__dirname, 'src/app/components/mobile/customer-documents/index.html'),
        mobileCustomers: path.resolve(__dirname, 'src/app/components/mobile/customers/index.html'),
        mobileEmployees: path.resolve(__dirname, 'src/app/components/mobile/employees/index.html'),
        mobileEmployeeDocuments: path.resolve(__dirname, 'src/app/components/mobile/employee-documents/index.html'),
        mobileMessaging: path.resolve(__dirname, 'src/app/components/mobile/messaging/index.html'),
        mobileMileagePay: path.resolve(__dirname, 'src/app/components/mobile/mileage-pay/index.html'),
        mobileNotifications: path.resolve(__dirname, 'src/app/components/mobile/notifications/index.html'),
      },
    },
  },
})
