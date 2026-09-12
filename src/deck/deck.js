// Minimal slide engine shared by every deck.
// Markup contract: <div class="deck"><section class="slide">…</section>…</div>
// Keys: → / ← / space / home / end, o = overview, f = fullscreen, esc = leave overview.
function initDeck() {
  const deck = document.querySelector('.deck')
  const slides = [...document.querySelectorAll('.slide')]
  if (!deck || !slides.length) return

  const bar = document.createElement('div')
  bar.className = 'deck-bar'
  bar.innerHTML = `
    <a href="../../index.html">← Index</a>
    <span class="deck-bar__spacer"></span>
    <button type="button" data-act="overview">Overview (O)</button>
    <button type="button" data-act="prev">Prev</button>
    <button type="button" data-act="next">Next</button>
    <span class="deck-bar__counter"><b class="js-current">1</b> / ${slides.length}</span>`
  document.body.append(bar)

  const progress = document.createElement('div')
  progress.className = 'progress'
  document.body.append(progress)

  const current = bar.querySelector('.js-current')
  let index = 0

  function show(next, push = true) {
    index = Math.max(0, Math.min(slides.length - 1, next))
    slides.forEach((s, i) => s.toggleAttribute('data-active', i === index))
    current.textContent = String(index + 1)
    progress.style.width = `${((index + 1) / slides.length) * 100}%`
    if (push) history.replaceState(null, '', `#${index + 1}`)
  }

  const setOverview = (on) => document.body.toggleAttribute('data-overview', on)
  const inOverview = () => document.body.hasAttribute('data-overview')

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); show(index + 1); break
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); show(index - 1); break
      case 'Home': show(0); break
      case 'End': show(slides.length - 1); break
      case 'o': case 'O': setOverview(!inOverview()); break
      case 'f': case 'F':
        document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
        break
      case 'Escape': if (inOverview()) setOverview(false); break
    }
  })

  bar.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'next') show(index + 1)
    if (act === 'prev') show(index - 1)
    if (act === 'overview') setOverview(!inOverview())
  })

  slides.forEach((slide, i) =>
    slide.addEventListener('click', () => {
      if (!inOverview()) return
      show(i)
      setOverview(false)
    }),
  )

  show(Number(location.hash.slice(1)) - 1 || 0, false)
}

initDeck()
