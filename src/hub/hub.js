// The hub discovers decks at build time: every presentations/<slug>/meta.json
// becomes one entry. No central registry to keep in sync.
const modules = import.meta.glob('../../presentations/*/meta.json', { eager: true })

const decks = Object.entries(modules)
  .map(([path, mod]) => {
    const slug = path.split('/').at(-2)
    const meta = mod.default ?? mod
    return {
      slug,
      title: meta.title ?? slug,
      summary: meta.summary ?? '',
      speaker: meta.speaker ?? '',
      date: meta.date ?? '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      href: `./presentations/${slug}/index.html`,
    }
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title))

const list = document.querySelector('#deck-list')
const count = document.querySelector('#deck-count')
const filter = document.querySelector('#filter')

const folio = (n) => String(n + 1).padStart(2, '0')

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.valueOf())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function render(query = '') {
  const q = query.trim().toLowerCase()
  const shown = q
    ? decks.filter((d) => `${d.title} ${d.summary} ${d.speaker} ${d.tags.join(' ')}`.toLowerCase().includes(q))
    : decks

  if (!decks.length) {
    list.innerHTML = `<p class="empty">No decks yet. Run <code>pnpm new "My Paper Title"</code> to start one.</p>`
    count.textContent = ''
    return
  }

  if (!shown.length) {
    list.innerHTML = `<p class="empty">Nothing matches “${escape(query)}”.</p>`
  } else {
    list.innerHTML = shown
      .map((d, i) => {
        const meta = [d.speaker, formatDate(d.date)].filter(Boolean).map((x) => `<span>${escape(x)}</span>`)
        const tags = d.tags.map((t) => `<span class="tag">${escape(t)}</span>`)
        return `
          <a class="entry" href="${d.href}" style="--i:${i}">
            <span class="entry__folio">${folio(i)}</span>
            <span class="entry__body">
              <h2 class="entry__title">${escape(d.title)}</h2>
              ${d.summary ? `<p class="entry__sub">${escape(d.summary)}</p>` : ''}
              ${meta.length || tags.length ? `<p class="entry__meta">${[...meta, ...tags].join('')}</p>` : ''}
            </span>
            <span class="entry__open">Open →</span>
          </a>`
      })
      .join('')
  }

  count.textContent = `${shown.length} of ${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`
}

filter?.addEventListener('input', (e) => render(e.target.value))
render()

const issue = document.querySelector('#issue-date')
if (issue) {
  issue.textContent = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
