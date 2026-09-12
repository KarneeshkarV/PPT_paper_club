import { Deck, Slide } from '../../src/deck/Deck.jsx'

export default function ExamplePaperDeck() {
  return (
    <Deck>
      <Slide variant="title">
        <p className="kicker">Paper Club · 12 Sep 2026</p>
        <h1>Attention Is All You Need</h1>
        <div className="rule" />
        <h3>Vaswani et al., 2017 - presented by Karneeshkar</h3>
      </Slide>

      <Slide>
        <p className="kicker">The claim</p>
        <h2>Drop recurrence. Keep attention.</h2>
        <blockquote>
          The whole encoder-decoder stack is attention plus feed-forward layers, and it trains
          faster than the recurrent models it replaces.
        </blockquote>
      </Slide>

      <Slide>
        <p className="kicker">Why it holds up</p>
        <h2>Three properties</h2>
        <div className="cols">
          <div className="card">
            <h3>Parallel</h3>
            <p>All positions are computed at once. Sequence length no longer serialises training.</p>
          </div>
          <div className="card">
            <h3>Short paths</h3>
            <p>Any two tokens are one hop apart, so long-range signal does not decay through steps.</p>
          </div>
          <div className="card">
            <h3>Scalable</h3>
            <p>The same block repeats. Capacity grows with width, depth and data, not with new machinery.</p>
          </div>
        </div>
      </Slide>

      <Slide>
        <p className="kicker">Discussion</p>
        <h2>Open questions for the group</h2>
        <ul>
          <li>What did the paper get wrong about positional encoding?</li>
          <li>Which later result would have surprised the authors most?</li>
          <li>Where is quadratic attention still the real bottleneck in 2026?</li>
        </ul>
      </Slide>

      <Slide variant="title">
        <p className="kicker">End</p>
        <h1>Thank you</h1>
        <div className="rule" />
        <p className="caption">Press O for the overview · F for fullscreen</p>
      </Slide>
    </Deck>
  )
}
