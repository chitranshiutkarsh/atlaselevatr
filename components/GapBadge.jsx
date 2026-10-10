const STYLE = {
  open: 'border-moss bg-moss/10 text-moss',
  gap: 'border-moss bg-moss/10 text-moss',
  thin: 'border-ink/20 bg-paper2 text-ink',
  crowded: 'border-signal/40 bg-signal/10 text-signal',
};

// How crowded a problem is: open whitespace, a gap in this country, thin or crowded.
export default function GapBadge({ verdict, small = false }) {
  if (!verdict) return null;
  return (
    <span
      title={verdict.text}
      className={`inline-flex items-center rounded-full border font-mono uppercase tracking-wide ${
        small ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      } ${STYLE[verdict.kind]}`}
    >
      {verdict.kind === 'crowded' ? '● ' : '◎ '}
      {verdict.label}
    </span>
  );
}
