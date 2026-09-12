# Paper Club

All Paper Club presentations, kept as web pages.
The root page lists every deck; each deck is a static page under `presentations/`.

## Use

```sh
pnpm install
pnpm dev                    # dev server
pnpm new "Paper title"      # scaffold a new deck
pnpm build                  # build the whole site to dist/
pnpm preview                # serve the build
```

## Adding a presentation

Run `pnpm new "Paper title"`.
This creates `presentations/<slug>/index.html` and `presentations/<slug>/meta.json`.
Edit the slides and fill in `meta.json`; the deck then appears on the index page by itself.

## In a deck

Right and left arrows or space move between slides.
`O` shows the overview grid, `F` is fullscreen, `Esc` leaves the overview.
The URL hash holds the slide number, so you can link to one slide.

Agent rules for this repository are in `CLAUDE.md`.
