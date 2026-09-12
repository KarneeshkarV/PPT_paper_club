import { defineConfig } from 'vite'
import { readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const decksDir = resolve(root, 'presentations')

// Every presentations/<slug>/index.html becomes its own build entry.
function deckEntries() {
  if (!existsSync(decksDir)) return {}
  return Object.fromEntries(
    readdirSync(decksDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(resolve(decksDir, d.name, 'index.html')))
      .map((d) => [d.name, resolve(decksDir, d.name, 'index.html')]),
  )
}

export default defineConfig({
  // Relative base: the built site works from any path (GitHub Pages, file://, subfolder).
  base: './',
  build: {
    rollupOptions: {
      input: {
        hub: resolve(root, 'index.html'),
        ...deckEntries(),
      },
    },
  },
})
