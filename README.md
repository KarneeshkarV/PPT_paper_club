# Paper Club

All Paper Club presentations, kept as pages in one React app.
The index route lists every deck; each deck is a component under `presentations/`.

## Use

```sh
pnpm install
pnpm dev                    # dev server
pnpm new "Paper title"      # scaffold a new deck
pnpm build                  # build to dist/
pnpm preview                # serve the build
```

## Adding a presentation

Run `pnpm new "Paper title"`.
This creates `presentations/<slug>/deck.jsx` and `presentations/<slug>/meta.json`.
Write the slides, fill in `meta.json`, and the deck appears on the index by itself.

A deck is plain JSX:

```jsx
import { Deck, Slide } from '../../src/deck/Deck.jsx'

export default function DeckPage() {
  return (
    <Deck>
      <Slide variant="title">
        <p className="kicker">Paper Club</p>
        <h1>Your title</h1>
      </Slide>
      <Slide>
        <h2>A point</h2>
        <ul><li>…</li></ul>
      </Slide>
    </Deck>
  )
}
```

## In a deck

Right and left arrows or space move between slides.
`O` shows the overview grid, `F` is fullscreen, `Esc` leaves the overview.
The URL carries the slide number (`/#/slug?s=3`), so you can link to one slide.

Agent rules for this repository are in `CLAUDE.md`.
