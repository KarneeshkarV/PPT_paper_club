import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base: the built site works from any path (GitHub Pages, a sub-folder, file://).
  base: './',
})
