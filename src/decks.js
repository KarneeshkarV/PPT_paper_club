// Deck discovery. Every presentations/<slug>/ folder with a meta.json and a
// deck.jsx shows up here — there is no registry to keep in sync.
const metaModules = import.meta.glob('/presentations/*/meta.json', { eager: true })
const deckModules = import.meta.glob('/presentations/*/deck.jsx')

const slugOf = (path) => path.split('/').at(-2)

export const decks = Object.entries(metaModules)
  .map(([path, mod]) => {
    const meta = mod.default ?? mod
    const slug = slugOf(path)
    return {
      slug,
      title: meta.title ?? slug,
      summary: meta.summary ?? '',
      speaker: meta.speaker ?? '',
      date: meta.date ?? '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
    }
  })
  .filter((deck) => Object.keys(deckModules).some((p) => slugOf(p) === deck.slug))
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title))

export const deckLoaders = Object.fromEntries(
  Object.entries(deckModules).map(([path, load]) => [slugOf(path), load]),
)
