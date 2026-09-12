/**
 * Every word on this deck. Edit here, not in deck.jsx.
 *
 * Inline markup in any string: **bold** and `code`.
 * A slide renders its fields in this order:
 *   kicker, h1, h2, quote, rule, figure | image | code | table, bullets,
 *   cards, body, caption, sub
 * `figure`, `art` and `image` name a component or asset that deck.jsx maps.
 */
export default {
  slides: [
    {
      variant: 'title',
      kicker: 'Paper Club',
      h1: '{{TITLE}}',
      rule: true,
      sub: 'Authors, year - presented by you',
    },
    {
      kicker: 'Section',
      h2: 'Your first point',
      bullets: [
        'Point one.',
        'Point two.',
      ],
    },
  ],

  // Text inside animated figures: caption, row labels, one note per step.
  figures: {},
}
