import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Hub from './hub/Hub.jsx'
import { decks, deckLoaders } from './decks.js'

// Each deck is code-split: opening the hub does not download every deck.
const lazyDecks = Object.fromEntries(
  Object.entries(deckLoaders).map(([slug, load]) => [slug, lazy(load)]),
)

function DeckRoute() {
  const { slug } = useParams()
  const DeckComponent = lazyDecks[slug]
  if (!DeckComponent || !decks.some((d) => d.slug === slug)) return <Navigate to="/" replace />
  return (
    <Suspense fallback={null}>
      <DeckComponent />
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/:slug" element={<DeckRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
