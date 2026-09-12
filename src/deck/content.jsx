/**
 * Content rendering. A deck keeps its words in content.js and passes them
 * here; this file decides what each field looks like on a slide.
 *
 * Inline markup in any string: **bold** and `code`.
 * Field order on a slide is fixed:
 *   kicker, h1, h2, quote, rule, figure | image | code | table, bullets,
 *   cards, body, caption, sub
 */
import { Fragment } from 'react'
import { Slide } from './Deck.jsx'

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g

/** Turn one content string into React nodes. */
export function rich(text) {
  if (typeof text !== 'string') return text
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    return <Fragment key={i}>{part}</Fragment>
  })
}

const list = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])

/**
 * Build the <Slide> children of a deck from its content file.
 * `figures` maps a figure id to a function that takes that figure's text
 * block and returns the component. `assets` maps an image id to an import.
 */
export function renderSlides(content, figures = {}, assets = {}) {
  const figureText = content.figures || {}

  return content.slides.map((s, i) => (
    <Slide key={i} variant={s.variant}>
      {s.art && figures[s.art]?.(figureText[s.art] || {})}
      {s.kicker && <p className="kicker">{rich(s.kicker)}</p>}
      {s.h1 && <h1>{rich(s.h1)}</h1>}
      {s.h2 && <h2>{rich(s.h2)}</h2>}
      {s.quote && <blockquote>{rich(s.quote)}</blockquote>}
      {s.rule && <div className="rule" />}
      {s.figure && figures[s.figure]?.(figureText[s.figure] || {})}
      {s.image && (
        <figure className="figure plate">
          <img src={assets[s.image]} alt={s.alt || ''} />
        </figure>
      )}
      {s.code && <pre><code>{s.code}</code></pre>}
      {s.table && (
        <table>
          <thead><tr>{s.table.head.map((h) => <th key={h}>{rich(h)}</th>)}</tr></thead>
          <tbody>
            {s.table.rows.map((row, r) => (
              <tr key={r}>{row.map((cell, c) => <td key={c}>{rich(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
      {s.bullets && <ul>{s.bullets.map((b, n) => <li key={n}>{rich(b)}</li>)}</ul>}
      {s.cards && (
        <div className="cols">
          {s.cards.map((card, n) => (
            <div className="card" key={n}>
              <h3>{rich(card.h3)}</h3>
              <p>{rich(card.p)}</p>
            </div>
          ))}
        </div>
      )}
      {list(s.body).map((p, n) => <p key={n}>{rich(p)}</p>)}
      {s.caption && <p className="caption">{rich(s.caption)}</p>}
      {s.sub && <h3>{rich(s.sub)}</h3>}
    </Slide>
  ))
}
