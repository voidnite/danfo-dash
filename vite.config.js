import { defineConfig } from 'vite'
import os from 'node:os'
import path from 'node:path'

// Keep Vite's dependency cache OUT of the OneDrive-synced project folder.
// OneDrive locks files mid-sync, which causes EPERM rmdir errors in
// node_modules/.vite. The OS temp dir is local and safe.
export default defineConfig({
  cacheDir: path.join(os.tmpdir(), 'danfo-dash-vite-cache'),
  build: {
    chunkSizeWarningLimit: 900,
  },
})
