/**
 * The deck is a renderer only. Every word lives in content.js.
 * Map a figure id from that file to its component in FIGURES, and an image
 * id to its imported asset in ASSETS.
 */
import { Deck } from '../../src/deck/Deck.jsx'
import { renderSlides } from '../../src/deck/content.jsx'
import content from './content.js'

const FIGURES = {}
const ASSETS = {}

export default function DeckPage() {
  return <Deck>{renderSlides(content, FIGURES, ASSETS)}</Deck>
}
