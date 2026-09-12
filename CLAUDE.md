# Paper Club - presentation site

This repository holds every Paper Club presentation as a page in one React app.
The root route is an index of all decks.
Each deck is a React component under `presentations/<slug>/`.

Agents working in this repository must follow the rules below.

## Stack

React 19 + Vite, `HashRouter` from react-router.
No UI framework, no CSS framework, no slide library.
The slide runner is `src/deck/Deck.jsx`; it is about 100 lines and it is the only one.

## Structure

```
index.html                     Single HTML entry. Fonts and #root only.
src/main.jsx                   React root and router.
src/App.jsx                    Routes: "/" is the hub, "/:slug" is a deck.
src/decks.js                   Deck discovery. Do not hard-code deck entries.
src/styles/base.css            Design tokens, reset, grain, shared keyframes.
src/hub/Hub.jsx + hub.css      The index page.
src/deck/Deck.jsx              Slide runner: keys, overview, progress, deck bar.
src/deck/Slide.jsx             One slide. Takes `variant="title"`.
src/deck/deck.css              Slide typography and chrome.
templates/deck/                Template copied by the scaffold script.
scripts/new-presentation.js    Scaffold script for a new deck.
presentations/<slug>/
  deck.jsx                     The deck: <Deck> with one <Slide> per slide.
  meta.json                    Deck metadata read by the hub.
  assets/                      Images and files for that deck only.
```

## Rules

1. Add a deck with `pnpm new "Paper title"`.
   Do not create the folder by hand.
   The scaffold makes `deck.jsx` and `meta.json` from `templates/deck/`.
2. Never edit the hub or a route to register a deck.
   `src/decks.js` finds decks with `import.meta.glob` over `/presentations/*/meta.json` and `/presentations/*/deck.jsx`.
   A deck needs both files, or it does not appear.
3. `meta.json` fields: `title`, `summary`, `speaker`, `date` (ISO `YYYY-MM-DD`), `tags` (array of strings).
   `title` and `date` are required for correct sorting.
4. A deck file exports one default component that returns `<Deck>` with `<Slide>` children.
   Import them from `../../src/deck/Deck.jsx`.
   Do not write your own slide runner, key handler or router for a deck.
5. Do not pass `active` or `onSelect` to `<Slide>`; `<Deck>` sets them.
   Keep slides as direct children of `<Deck>`, because `<Deck>` counts them with `Children.toArray`.
6. Slide content classes come from `src/deck/deck.css`:
   `kicker`, `rule`, `cols`, `card`, `figure`, `caption`.
   Plain `h1` `h2` `h3` `p` `ul` `blockquote` `table` `pre` are already styled.
   Do not add per-deck CSS files; if a style is worth having, put it in `deck.css` for every deck.
7. Keep every deck asset inside its own folder and import it, for example
   `import figure from './assets/figure-1.png'`.
   Put shared files in `public/`.
8. Routing stays hash based (`/#/<slug>?s=<slide>`) and `base` stays `'./'` in `vite.config.js`.
   Together they let the build run from any sub-path with no server rules.
   Do not switch to `BrowserRouter` or an absolute base.
9. Do not commit `dist/`, and do not edit files in it.

## Design system

The site is dark: warm near-black ground, light Fraunces serif, gold accent, film grain.
Do not invent a new visual language for one deck.
Change tokens in `src/styles/base.css` only when the whole site changes with them.

- Fonts: `Fraunces` for display and body, `IBM Plex Mono` for metadata and labels.
- Tokens: `--bg`, `--raise`, `--line`, `--fg`, `--dim`, `--accent`.
- Rules and hairlines instead of boxes and shadows. One accent colour, used sparingly.
- Motion is a staggered entry only. Keep the `prefers-reduced-motion` block in `base.css` working.

## Keyboard behaviour (do not break)

`Right` `Left` `space` `PageUp` `PageDown` `Home` `End` move between slides.
`O` opens the overview grid, `F` toggles fullscreen, `Esc` leaves the overview.
The slide number is kept in the URL as `?s=`, so any slide can be linked.

## Tooling

- The package manager is `pnpm`. All scripts and source are ESM.
- `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm new "Title"`.
- Supply-chain policy: a `minimum-release-age` of 14 days is set in `.npmrc` and `package.json`.
  Do not lower or remove it.
  Do not run `npx`; use `pnpm dlx`.
- Add a dependency only when the task cannot be done with React and the existing engine.
  Say why before you add one.

## Verification before you report work as done

1. `pnpm build` finishes with no error.
2. The new or changed deck appears on the hub, and its card opens the deck.
3. The deck was opened in a browser and every slide was checked at 1440x900,
   including the overview grid.
