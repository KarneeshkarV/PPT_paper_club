#!/usr/bin/env node
// Scaffold presentations/<slug>/ from templates/deck. Usage: pnpm new "My Paper Title"
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const title = process.argv.slice(2).join(' ').trim()

if (!title) {
  console.error('Usage: pnpm new "Paper title"')
  process.exit(1)
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 60)

const dest = resolve(root, 'presentations', slug)
if (existsSync(dest)) {
  console.error(`presentations/${slug} already exists.`)
  process.exit(1)
}

mkdirSync(dest, { recursive: true })
cpSync(resolve(root, 'templates/deck'), dest, { recursive: true })

const today = new Date().toISOString().slice(0, 10)
for (const file of ['index.html', 'meta.json']) {
  const path = resolve(dest, file)
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('{{TITLE}}', title).replaceAll('{{DATE}}', today))
}

console.log(`Created presentations/${slug}. Run "pnpm dev" and open the index.`)
