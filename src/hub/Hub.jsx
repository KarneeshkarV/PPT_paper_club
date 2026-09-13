import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { decks } from '../decks.js'
import './hub.css'

const folio = (n) => String(n + 1).padStart(2, '0')

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.valueOf())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Hub() {
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return decks
    return decks.filter((d) =>
      `${d.title} ${d.summary} ${d.speaker} ${d.tags.join(' ')}`.toLowerCase().includes(q),
    )
  }, [query])

  // A feature card spans two columns; it only looks right once the grid has rows to fill.
  const featured = !query && decks.length >= 3

  const issue = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="wrap">
        <div className="rail">
          <span>Paper Club</span>
          <span>Volume 01 - {issue}</span>
          <span>
            {folio(decks.length - 1)} {decks.length === 1 ? 'deck' : 'decks'}
          </span>
        </div>

        <header className="hero">
          <h1>
            The
            <br />
            Reading<i>.</i>
          </h1>
        </header>

        <div className="filterbar">
          <label htmlFor="filter">Search</label>
          <input
            id="filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="title, speaker, tag…"
            autoComplete="off"
          />
        </div>

        <main className="cards">
          {decks.length === 0 && (
            <p className="empty">
              No decks yet. Run <code>pnpm new "My Paper Title"</code> to start one.
            </p>
          )}
          {decks.length > 0 && shown.length === 0 && (
            <p className="empty">Nothing matches “{query}”.</p>
          )}
          {shown.map((deck, i) => (
            <Link
              key={deck.slug}
              to={`/${deck.slug}`}
              className={`card${i === 0 && featured ? ' card--feature' : ''}`}
              style={{ '--i': i }}
            >
              <span className="folio">
                {folio(i)}
                {i === 0 && featured ? ' - Latest' : ''}
              </span>
              <h2>{deck.title}</h2>
              {deck.summary && <p>{deck.summary}</p>}
              {deck.tags.length > 0 && (
                <span className="tags">
                  {deck.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </span>
              )}
              <span className="foot">
                <span>{[deck.speaker, formatDate(deck.date)].filter(Boolean).join(' - ')}</span>
                <span className="go">Open →</span>
              </span>
            </Link>
          ))}
        </main>

        <footer className="colophon">
          <span className="mark" aria-hidden="true">
            ◆
          </span>
        </footer>
      </div>
    </>
  )
}
