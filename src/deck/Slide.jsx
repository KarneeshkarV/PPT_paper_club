/**
 * One slide. `variant="title"` gives the bottom-aligned opening/closing layout.
 * `active` and `onSelect` are set by <Deck>; do not pass them by hand.
 */
export default function Slide({ variant, active = false, onSelect, children }) {
  const className = ['slide', variant ? `slide--${variant}` : ''].filter(Boolean).join(' ')
  return (
    <section
      className={className}
      data-active={active || undefined}
      onClick={onSelect}
      // In the overview grid the whole slide is a click target.
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
    >
      {children}
    </section>
  )
}
