/**
 * Animated figures for this deck.
 * Every figure owns a step counter and autoplays; each element reads its own
 * state from the current step, so the diagram animates by transition only.
 * Styling lives in src/deck/deck.css (.fig, .tok, .fig-bar ...).
 */
import { Fragment, useCallback, useEffect, useState } from 'react'
import { rich } from '../../src/deck/content.jsx'

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useSteps(total, ms = 1100) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReduced())

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setStep((s) => (s + 1) % total), ms)
    return () => clearInterval(id)
  }, [playing, total, ms])

  const go = useCallback((n) => { setPlaying(false); setStep(Math.max(0, Math.min(total - 1, n))) }, [total])
  return { step, playing, setPlaying, go, total }
}

/** Back / Pause / Next for a figure. Keys are swallowed so the deck does not also move. */
function Controls({ step, total, playing, setPlaying, go, caption }) {
  const stop = (e) => e.stopPropagation()
  return (
    <div className="fig-controls" onKeyDown={stop} onKeyUp={stop}>
      <span>{caption}</span>
      <span className="fig-controls__spacer" />
      <button type="button" onClick={() => go(step - 1)} disabled={step === 0}>Back</button>
      <button type="button" aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={() => go(step + 1)} disabled={step === total - 1}>Next</button>
      <span className="fig-controls__count"><b>{step + 1}</b> / {total}</span>
    </div>
  )
}

/** Notes are a plain array in content.js; a short array just holds its last line. */
const noteAt = (notes, step) => (notes?.length ? notes[Math.min(step, notes.length - 1)] : '')

const Tok = ({ state, now, wide, children }) => (
  <span className={['tok', wide ? 'tok--wide' : '', now ? 'tok--now' : ''].filter(Boolean).join(' ')}
        data-state={state || undefined}>{children}</span>
)

/* ------------------------------------------------------------------ */
/* The autoregressive baseline: one committed token per target pass.   */
/* ------------------------------------------------------------------ */
export function BaselineLoop({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(4, 900)
  const out = ['T1', 'T2', 'T3', 'T4']
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.sequence}</span>
          <div className="fig-track">
            <Tok state="done">context</Tok>
            {out.map((t, i) => <Tok key={t} state={i <= step ? 'done' : undefined} now={i === step}>{t}</Tok>)}
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.passes}</span>
          <div className="fig-track">
            {out.map((t, i) => (
              <Tok key={t} state={i <= step ? 'draft' : undefined} wide>pass {i + 1}</Tok>
            ))}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One speculative round: draft, verify left to right, commit.        */
/* ------------------------------------------------------------------ */
export function VerifyRound({ prompt, drafts, acceptUpTo, replacement, caption, notes, labels = {}, words = {} }) {
  const total = drafts.length + 3
  const { step, ...c } = useSteps(total, 1000)

  const proposed = step >= 1
  const verifying = step >= 2
  const checked = Math.min(Math.max(step - 2, 0), drafts.length) // positions resolved so far
  const committed = step >= total - 1

  const verdict = (i) => {
    if (i >= checked) return undefined
    if (i < acceptUpTo) return 'ok'
    if (i === acceptUpTo) return 'bad'
    return 'drop'
  }
  const note = committed ? notes?.[notes.length - 1] : noteAt(notes?.slice(0, -1), step)

  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.prompt}</span>
          <div className="fig-track"><Tok state="done">{prompt}</Tok></div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.propose}</span>
          <div className="fig-track">
            {drafts.map((d, i) => <Tok key={d + i} state={proposed ? 'draft' : undefined}>{d}</Tok>)}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.verify}</span>
          <div className="fig-track">
            {drafts.map((d, i) => (
              <Tok key={d + i} state={verifying ? verdict(i) : undefined} now={i === checked - 1} wide>
                {verdict(i) === 'ok' ? words.accept : verdict(i) === 'bad' ? words.reject : verdict(i) === 'drop' ? words.discard : '·'}
              </Tok>
            ))}
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.commit}</span>
          <div className="fig-track">
            {drafts.map((d, i) => {
              if (!committed) return <Tok key={d + i}>·</Tok>
              if (i < acceptUpTo) return <Tok key={d + i} state="ok">{d}</Tok>
              if (i === acceptUpTo) return <Tok key={d + i} state="target">{replacement}</Tok>
              return <Tok key={d + i} state="drop">-</Tok>
            })}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(note)}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sequential drafting against parallel drafting, on one clock.        */
/* ------------------------------------------------------------------ */
export function SeqVsParallel({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(5, 850)
  const n = 4
  const seqDone = step
  const parDone = step >= 1 ? n : 0
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-lanes">
          <div className="fig-lane">
            <span className="fig-row__label">{labels.sequential}</span>
            <div className="fig-track">
              {Array.from({ length: n }, (_, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem' }}>
                  <Tok state={i < seqDone ? 'draft' : undefined} now={i === seqDone - 1}>draft {i + 1}</Tok>
                  {i < n - 1 && <span className="fig-sep">→</span>}
                </span>
              ))}
            </div>
            <span className="fig-lane__cost">{labels.seqCost} <b>{seqDone || 0}</b> {labels.passes}</span>
          </div>
          <div className="fig-lane">
            <span className="fig-row__label">{labels.parallel}</span>
            <div className="fig-track">
              {Array.from({ length: n }, (_, i) => (
                <Tok key={i} state={i < parDone ? 'draft' : undefined}>draft {i + 1}</Tok>
              ))}
            </div>
            <span className="fig-lane__cost">{labels.parCost} <b>{step >= 1 ? 1 : 0}</b> {labels.pass}</span>
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.clock}</span>
          <div className="fig-track">
            {Array.from({ length: n }, (_, i) => <Tok key={i} state={i < step ? 'done' : undefined} wide>tick {i + 1}</Tok>)}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* A DFlash draft block: confirmed anchor, then masked positions.      */
/* ------------------------------------------------------------------ */
export function DFlashBlock({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(3, 1200)
  const slots = [0, 1, 2, 3, 4, 5, 6]
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.position}</span>
          <div className="fig-track">{slots.map((i) => <Tok key={i} state="done" wide>{i}</Tok>)}</div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.input}</span>
          <div className="fig-track">
            <Tok state="target" wide>{labels.anchor}</Tok>
            {slots.slice(1).map((i) => <Tok key={i} state="mask" wide>{labels.mask}</Tok>)}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.pass}</span>
          <div className="fig-track">
            <Tok state={step >= 1 ? 'target' : undefined} wide>{labels.anchor}</Tok>
            {slots.slice(1).map((i) => (
              <Tok key={i} state={step >= 1 ? 'draft' : undefined} wide>{labels.draft} {i}</Tok>
            ))}
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.kv}</span>
          <div className="fig-track">
            {(labels.layers || []).map((l) => (
              <Tok key={l} state={step >= 2 ? 'draft' : undefined}>{l}</Tok>
            ))}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* EAGLE-3: three target layers fused, then autoregressive drafting.   */
/* ------------------------------------------------------------------ */
export function Eagle3Fuse({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(4, 1000)
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.layers}</span>
          <div className="fig-track">
            {(labels.stages || []).map((l) => (
              <Tok key={l} state={step >= 0 ? 'done' : undefined} wide>{l}</Tok>
            ))}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.fuse}</span>
          <div className="fig-track">
            <Tok state={step >= 1 ? 'draft' : undefined}>{labels.concat}</Tok>
            <span className="fig-sep">→</span>
            <Tok state={step >= 1 ? 'draft' : undefined}>{labels.feature}</Tok>
            <span className="fig-sep">+</span>
            <Tok state={step >= 1 ? 'draft' : undefined}>{labels.embedding}</Tok>
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.decoder}</span>
          <div className="fig-track">
            <Tok state={step >= 2 ? 'draft' : undefined}>{labels.draft} 1</Tok>
            <span className="fig-sep">→</span>
            <Tok state={step >= 3 ? 'draft' : undefined}>{labels.draft} 2</Tok>
            <span className="fig-sep">→</span>
            <Tok state={step >= 3 ? 'draft' : undefined}>{labels.draft} 3</Tok>
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DSpark: parallel backbone, then a left-to-right Markov correction.  */
/* ------------------------------------------------------------------ */
export function DSparkHead({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(5, 900)
  const picks = labels.picks || []
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.backbone}</span>
          <div className="fig-track">
            {picks.map((_, i) => <Tok key={i} state={step >= 1 ? 'draft' : undefined} wide>{labels.base} {i + 1}</Tok>)}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.markov}</span>
          <div className="fig-track">
            {picks.map((t, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem' }}>
                <Tok state={step >= 1 + i + 1 ? 'ok' : undefined} now={step === 1 + i + 1}>{t}</Tok>
                {i < picks.length - 1 && <span className="fig-sep">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Measured throughput, MI300X / MI355X, ROCm.                        */
/* ------------------------------------------------------------------ */
const DATASETS = ['GSM8K', 'MATH500', 'HumanEval', 'MBPP']
const TONE = {
  baseline: 'var(--dim)',
  'Gemma 4 MTP': 'var(--accent)',
  'Native MTP': 'var(--accent)',
  'EAGLE-3': 'var(--cool)',
  DFlash: 'var(--ok)',
  DSpark: '#b99bea',
}
const BASELINE = {
  'gemma-4-26B-A4B-it': [2344, 2181, 1854, 2163],
  'gemma-4-31B-it': [1631, 1365, 1228, 1519],
  'Qwen3-8B': [3698, 3530, 3226, 3268],
  'Qwen3.5-27B': [1555, 1500, 1256, 1418],
  'Qwen3.5-122B-A10B': [1494, 1446, 1105, 1459],
  'Qwen3.6-27B': [1521, 1514, 1481, 1495],
  'Qwen3.6-35B-A3B': [2275, 2235, 2193, 2258],
  'Kimi-K2.5': [324, 310, 301, 311],
  'MiniMax-M3-MXFP8': [2086, 2468, 2317, 2277],
}
const ROWS = [
  ['gemma-4-26B-A4B-it', 'Gemma 4 MTP', [6434, 6161, 4810, 5662], [2.74, 2.83, 2.59, 2.62], 5],
  ['gemma-4-26B-A4B-it', 'EAGLE-3', [5063, 4953, 3997, 4574], [2.16, 2.27, 2.16, 2.11], 4],
  ['gemma-4-26B-A4B-it', 'DFlash', [6327, 6267, 5183, 5214], [2.70, 2.87, 2.79, 2.41], 7],
  ['gemma-4-31B-it', 'Gemma 4 MTP', [3267, 3006, 2424, 3020], [2.00, 2.20, 1.97, 1.99], 4],
  ['gemma-4-31B-it', 'EAGLE-3', [2915, 2891, 2278, 2793], [1.79, 2.12, 1.86, 1.84], 5],
  ['gemma-4-31B-it', 'DFlash', [3183, 3197, 2514, 2914], [1.95, 2.34, 2.05, 1.92], 7],
  ['gemma-4-31B-it', 'DSpark', [2971, 3004, 2425, 2797], [1.82, 2.20, 1.98, 1.84], 7],
  ['Qwen3-8B', 'EAGLE-3', [4347, 3105, 3376, 3798], [1.18, 0.88, 1.05, 1.16], 5],
  ['Qwen3-8B', 'DFlash', [4678, 3828, 4103, 3982], [1.27, 1.08, 1.27, 1.22], 11],
  ['Qwen3-8B', 'DSpark', [6032, 4048, 4769, 4936], [1.63, 1.15, 1.48, 1.51], 7],
  ['Qwen3.5-27B', 'Native MTP', [2537, 2564, 2044, 2268], [1.66, 1.70, 1.63, 1.60], 5],
  ['Qwen3.5-27B', 'DFlash', [2397, 2482, 1829, 2042], [1.54, 1.65, 1.46, 1.44], 7],
  ['Qwen3.5-122B-A10B', 'Native MTP', [3107, 3183, 2044, 2747], [2.08, 2.20, 1.85, 1.88], 7],
  ['Qwen3.5-122B-A10B', 'DFlash', [2356, 2572, 1838, 2019], [1.58, 1.78, 1.66, 1.38], 7],
  ['Qwen3.6-27B', 'Native MTP', [2609, 2701, 2373, 2411], [1.72, 1.78, 1.60, 1.61], 5],
  ['Qwen3.6-27B', 'DFlash', [2176, 2411, 2070, 2069], [1.43, 1.59, 1.40, 1.38], 7],
  ['Qwen3.6-35B-A3B', 'Native MTP', [3253, 3334, 2811, 2903], [1.43, 1.49, 1.28, 1.29], 6],
  ['Qwen3.6-35B-A3B', 'DFlash', [4276, 4600, 4036, 3990], [1.88, 2.06, 1.84, 1.77], 7],
  ['Kimi-K2.5', 'EAGLE-3', [728, 722, 649, 619], [2.24, 2.33, 2.16, 1.99], 4],
  ['Kimi-K2.5', 'DFlash', [768, 832, 727, 687], [2.37, 2.68, 2.42, 2.21], 7],
  ['MiniMax-M3-MXFP8', 'EAGLE-3', [3807, 4772, 4835, 4487], [1.82, 1.93, 2.09, 1.97], 4],
].map(([target, method, throughputs, speedups, n]) => ({ target, method, throughputs, speedups, n }))

const TARGETS = [...new Set(ROWS.map((r) => r.target))]

export function ThroughputChart({ note, baseline = 'Baseline' }) {
  const [target, setTarget] = useState(TARGETS[0])
  const [shown, setShown] = useState(false)

  // Re-run the grow transition whenever the target changes.
  useEffect(() => {
    setShown(false)
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [target])

  const series = [
    { method: baseline, throughputs: BASELINE[target], speedups: null, n: null },
    ...ROWS.filter((r) => r.target === target),
  ]
  const max = Math.max(...series.flatMap((s) => s.throughputs))

  return (
    <div className="fig fig-chart">
      <div className="fig-pick" onKeyDown={(e) => e.stopPropagation()}>
        {TARGETS.map((t) => (
          <button key={t} type="button" aria-pressed={t === target} onClick={() => setTarget(t)}>{t}</button>
        ))}
      </div>
      <div className="fig-groups">
        {DATASETS.map((ds, d) => (
          <div className="fig-group" key={ds}>
            <div className="fig-bars">
              {series.map((s, i) => (
                <div className="fig-bar" key={s.method} style={{ '--tone': TONE[s.method] || TONE.baseline, '--i': i }}>
                  <span className="fig-bar__val">{s.speedups ? `${s.speedups[d].toFixed(2)}×` : '1.00×'}</span>
                  <span
                    className="fig-bar__fill"
                    style={{ height: shown ? `${(s.throughputs[d] / max) * 100}%` : '0%' }}
                    title={`${s.method} · ${s.throughputs[d].toLocaleString()} tok/s`}
                  />
                </div>
              ))}
            </div>
            <div className="fig-group__name">{ds}</div>
          </div>
        ))}
      </div>
      <div className="fig-legend">
        {series.map((s) => (
          <span key={s.method} style={{ '--tone': TONE[s.method] || TONE.baseline }}>
            <i />{s.method}{s.n ? ` · N=${s.n}` : ''}
          </span>
        ))}
      </div>
      <p className="fig-note">{rich(note)}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Title art: a stream of drafted tokens, most of them accepted.       */
/* Deterministic, so the opening slide looks the same every time.      */
/* ------------------------------------------------------------------ */
const TICKS = (() => {
  let seed = 20260823
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const out = []
  let run = 0
  let kind = 'idle'
  for (let i = 0; i < 132; i += 1) {
    if (run === 0) {
      const r = rand()
      kind = r > 0.74 ? 'ok' : r > 0.68 ? 'no' : 'idle'
      run = kind === 'ok' ? 3 + Math.floor(rand() * 4) : 1
    }
    run -= 1
    const wave = Math.sin(i / 9) * 0.5 + Math.sin(i / 3.1) * 0.22
    out.push({ i, kind, h: 16 + (wave + 0.75) * 52 + rand() * 14 })
  }
  return out
})()

export function TitleArt() {
  return (
    <svg className="slide-art" viewBox="0 0 1320 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="art-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".22" stopColor="#fff" stopOpacity="1" />
          <stop offset=".78" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="art-mask"><rect width="1320" height="220" fill="url(#art-fade)" /></mask>
      </defs>
      <g mask="url(#art-mask)">
        <g className="slide-art__scroll">
        {[0, 1320].map((dx) => TICKS.map(({ i, kind, h }) => (
          <rect
            key={`${dx}-${i}`}
            className={`slide-art__tick slide-art__tick--${kind}`}
            x={dx + i * 10}
            y={110 - h / 2}
            width="3"
            height={h}
            style={{ '--d': `${(i % 22) * 120}ms` }}
          />
        )))}
        </g>
      </g>
      <line className="slide-art__rule" x1="0" y1="110" x2="1320" y2="110" mask="url(#art-mask)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Causal mask: the four speculative positions in one pass, each one   */
/* still reading only its own prefix.                                  */
/* ------------------------------------------------------------------ */
export function CausalMask({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(5, 1100)
  const toks = labels.tokens || []
  const rows = step - 1
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.pass}</span>
          <div className="fig-track">
            <Tok state="done">{labels.context}</Tok>
            <span className="fig-sep">+</span>
            {toks.map((t, i) => (
              <Tok key={t} state={step > 0 ? 'draft' : undefined} now={i === rows}>{t}</Tok>
            ))}
          </div>
        </div>
        <div className="fig-hr" />
        <div className="fig-mask">
          <span />
          {toks.map((t) => <span key={t} className="fig-mask__head">{t}</span>)}
          {toks.map((t, r) => (
            <Fragment key={t}>
              <span className="fig-mask__head fig-mask__head--row">{t}</span>
              {toks.map((u, col) => (
                <span
                  key={u}
                  className="fig-mask__cell"
                  data-on={r <= rows && col <= r ? '' : undefined}
                  data-off={r <= rows && col > r ? '' : undefined}
                >{r <= rows ? (col <= r ? '✓' : '−∞') : ''}</span>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One forward pass gives one distribution per position, shifted left. */
/* ------------------------------------------------------------------ */
export function OnePassLogits({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(4, 1200)
  const inputs = labels.inputs || []
  const preds = labels.predicts || []
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.input}</span>
          <div className="fig-track">{inputs.map((t) => <Tok key={t} state="done" wide>{t}</Tok>)}</div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.hidden}</span>
          <div className="fig-track">
            {inputs.map((t, i) => <Tok key={t} state={step >= 1 ? 'draft' : undefined} wide>h{i + 1}</Tok>)}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.head}</span>
          <div className="fig-track">
            {inputs.map((t) => <Tok key={t} state={step >= 2 ? 'target' : undefined} wide>{labels.logits}</Tok>)}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.softmax}</span>
          <div className="fig-track">
            {preds.map((t) => <Tok key={t} state={step >= 3 ? 'ok' : undefined} wide>P({t})</Tok>)}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sampling acceptance: min(1, p/q), then the residual distribution.   */
/* ------------------------------------------------------------------ */
const BarPair = ({ label, q, p, on }) => (
  <div className="fig-prob">
    <span className="fig-prob__name">{label}</span>
    <span className="fig-prob__bar"><i style={{ width: on ? `${q * 100}%` : 0, background: 'var(--accent)' }} /></span>
    <span className="fig-prob__val">q {q.toFixed(2)}</span>
    <span className="fig-prob__bar"><i style={{ width: on ? `${p * 100}%` : 0, background: 'var(--cool)' }} /></span>
    <span className="fig-prob__val">p {p.toFixed(2)}</span>
  </div>
)

export function AcceptSample({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(4, 1400)
  return (
    <div className="fig">
      <div className="fig-stage">
        <BarPair label="A" q={0.5} p={0.3} on={step >= 0} />
        <BarPair label="B" q={0.3} p={0.4} on={step >= 0} />
        <BarPair label="C" q={0.2} p={0.3} on={step >= 0} />
        <div className="fig-hr" />
        <div className="fig-row">
          <span className="fig-row__label">{labels.proposes}</span>
          <div className="fig-track">
            <Tok state={step >= 1 ? (step >= 3 ? 'bad' : 'draft') : undefined} wide>A</Tok>
            <span className="fig-sep">{labels.acceptWith}</span>
            <Tok state={step >= 1 ? 'target' : undefined} wide>{labels.rule}</Tok>
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.residual}</span>
          <div className="fig-track">
            <Tok state={step >= 3 ? 'drop' : undefined} wide>A 0</Tok>
            <Tok state={step >= 3 ? 'ok' : undefined} wide>B 50%</Tok>
            <Tok state={step >= 3 ? 'ok' : undefined} wide>C 50%</Tok>
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* KV cache: accepted speculative entries stay, the rest are dropped.  */
/* ------------------------------------------------------------------ */
export function KvCommit({ caption, notes, labels = {} }) {
  const { step, ...c } = useSteps(5, 1200)
  const base = labels.cached || []
  const spec = labels.proposed || []
  const verdict = ['ok', 'ok', 'bad', 'drop']
  return (
    <div className="fig">
      <div className="fig-stage">
        <div className="fig-row">
          <span className="fig-row__label">{labels.cache}</span>
          <div className="fig-track">
            {base.map((t) => <Tok key={t} state="done">{t}</Tok>)}
            {spec.map((t, i) => (
              <Tok
                key={`${t}-${i}`}
                state={step === 0 ? undefined
                  : step < 3 ? 'draft'
                  : step === 3 ? (i < 2 ? 'ok' : 'draft')
                  : i < 2 ? 'ok' : 'drop'}
                now={step === 2 && i === 2}
              >{t}</Tok>
            ))}
            {step >= 4 && <Tok state="target">{labels.correction}</Tok>}
          </div>
        </div>
        <div className="fig-row">
          <span className="fig-row__label">{labels.verification}</span>
          <div className="fig-track">
            {spec.map((t, i) => (
              <Tok key={t + i} state={step >= 2 ? verdict[i] : undefined} wide>
                {t} {verdict[i] === 'ok' ? '✓' : verdict[i] === 'bad' ? '✗' : '–'}
              </Tok>
            ))}
          </div>
        </div>
      </div>
      <p className="fig-note">{rich(noteAt(notes, step))}</p>
      <Controls step={step} {...c} caption={caption} />
    </div>
  )
}
