import { Deck, Slide } from '../../src/deck/Deck.jsx'

export default function DeckPage() {
  return (
    <Deck>
      <Slide variant="title">
        <p className="kicker">Paper Club</p>
        <h1>{{TITLE}}</h1>
        <div className="rule" />
        <h3>Authors, year - presented by you</h3>
      </Slide>

      <Slide>
        <p className="kicker">Section</p>
        <h2>Your first point</h2>
        <ul>
          <li>Point one.</li>
          <li>Point two.</li>
        </ul>
      </Slide>
    </Deck>
  )
}
