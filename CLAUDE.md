# Paper Club - presentation site

This repository holds every Paper Club presentation as a web page.
The root page is an index of all decks.
Each deck is a static page under `presentations/<slug>/`.

Agents working in this repository must follow the rules below.

## Structure

```
index.html                     Hub page. Lists all decks. Do not hard-code deck entries.
src/hub/                       Hub styles and discovery script.
src/deck/                      Shared slide engine (deck.css + deck.js). Used by every deck.
templates/deck/                Template copied by the scaffold script.
scripts/new-presentation.js    Scaffold script for a new deck.
presentations/<slug>/
  index.html                   The deck itself.
  meta.json                    Deck metadata read by the hub.
  assets/                      Images and files for that deck only.
vite.config.js                 Multi-page build. Auto-registers every presentations/<slug>/index.html.
```

## Rules

1. Add a deck with `pnpm new "Paper title"`.
   Do not create the folder by hand.
   The scaffold makes `index.html` and `meta.json` from `templates/deck/`.
2. Never edit the hub to register a deck.
   The hub finds decks through `import.meta.glob` over `presentations/*/meta.json`.
   A deck without a valid `meta.json` does not appear in the index.
3. `meta.json` fields: `title`, `summary`, `speaker`, `date` (ISO `YYYY-MM-DD`), `tags` (array of strings).
   `title` and `date` are required for correct sorting.
4. Every deck links its styles as `/src/deck/deck.css` and its script as `/src/deck/deck.js`.
   Do not copy the slide engine into a deck.
5. Deck markup contract:
   `<div class="deck">` holds one `<section class="slide">` per slide.
   Use `slide--title` for title and closing slides.
   Helper classes: `kicker`, `rule`, `cols`, `card`, `figure`, `caption`.
6. Keep every deck asset inside its own folder.
   Reference it with a relative path, for example `./assets/figure-1.png`.
   Put shared files in `public/`.
7. `base` in `vite.config.js` stays `'./'`.
   This keeps the built site working from any sub-path, such as GitHub Pages.
   Do not change it to an absolute path.
8. Do not commit `dist/`.
   Do not edit files in `dist/`; they are build output.

## Design system

Do not invent a new visual language for a deck.
Change the tokens in `src/deck/deck.css` only if the whole site changes with it.

- Fonts: `Fraunces` for display and body text, `IBM Plex Mono` for metadata and labels.
- Colour tokens: `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--accent` (vermilion).
- Style: printed-journal look. Paper ground, hairline and heavy rules, grain overlay, one accent colour.
- Motion is subtle: staggered entry only. Keep the `prefers-reduced-motion` support.

## Keyboard behaviour (do not break)

`Right` `Left` `space` `PageUp` `PageDown` `Home` `End` move between slides.
`O` opens the overview grid, `F` toggles fullscreen, `Esc` leaves the overview.
The current slide number is written to the URL hash, so a link can open one slide.

## Tooling

- The package manager is `pnpm`. Node scripts are ESM.
- `pnpm dev` runs the dev server, `pnpm build` builds to `dist/`, `pnpm preview` serves the build.
- Supply-chain policy: a `minimum-release-age` of 14 days is set in `.npmrc` and `package.json`.
  Do not lower or remove it.
  Do not run `npx`; use `pnpm dlx`.
- Add a dependency only when the task cannot be done with plain HTML, CSS and the existing engine.
  Say why before you add one.

## Verification before you report work as done

1. `pnpm build` finishes with no error.
2. The new or changed deck appears on the hub page, and its link opens the deck.
3. The deck was opened in a browser and each slide was checked at 1440x900.
