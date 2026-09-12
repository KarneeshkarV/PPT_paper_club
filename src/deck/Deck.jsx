import { Children, cloneElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { decks } from '../decks.js'
import './deck.css'

export { default as Slide } from './Slide.jsx'

/**
 * Slide runner. A deck file returns <Deck> with one <Slide> per slide.
 * Keys: → ← space PageUp PageDown Home End, O overview, F fullscreen, Esc leaves overview.
 * The slide number is kept in the URL (?s=3), so any slide can be linked.
 */
export function Deck({ children }) {
  const { slug } = useParams()
  const meta = decks.find((d) => d.slug === slug)
  const slides = useMemo(() => Children.toArray(children), [children])
  const [params, setParams] = useSearchParams()
  const [overview, setOverview] = useState(false)

  const wanted = Number(params.get('s')) - 1
  const index = Number.isInteger(wanted) && wanted >= 0 && wanted < slides.length ? wanted : 0

  const go = useCallback(
    (next) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next))
      setParams(clamped === 0 ? {} : { s: String(clamped + 1) }, { replace: true })
    },
    [slides.length, setParams],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ':
          e.preventDefault(); go(index + 1); break
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); go(index - 1); break
        case 'Home': go(0); break
        case 'End': go(slides.length - 1); break
        case 'o': case 'O': setOverview((v) => !v); break
        case 'f': case 'F':
          document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
          break
        case 'Escape': setOverview(false); break
        default: break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [go, index, slides.length])

  // The deck takes over the viewport; the hub scrolls normally.
  useEffect(() => {
    document.body.dataset.deck = ''
    return () => delete document.body.dataset.deck
  }, [])

  useEffect(() => {
    if (overview) document.body.dataset.overview = ''
    else delete document.body.dataset.overview
  }, [overview])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="progress" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />

      <div className="deck">
        {slides.map((slide, i) =>
          cloneElement(slide, {
            key: i,
            active: i === index,
            onSelect: overview ? () => { go(i); setOverview(false) } : undefined,
          }),
        )}
      </div>

      <div className="deck-bar">
        <Link to="/">← Index</Link>
        {meta && <span className="deck-bar__title">{meta.title}</span>}
        <span className="deck-bar__spacer" />
        <button type="button" onClick={() => setOverview((v) => !v)}>Overview (O)</button>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>Prev</button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === slides.length - 1}>Next</button>
        <span className="deck-bar__counter">
          <b>{index + 1}</b> / {slides.length}
        </span>
      </div>
    </>
  )
}

export default Deck
