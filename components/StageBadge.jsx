import { STAGES, problemStage } from '@/lib/constants';

const STYLE = {
  open: 'border-ink/20 bg-paper text-ink2',
  validated: 'border-moss bg-moss text-white',
  claimed: 'border-ink bg-ink text-paper',
  studio: 'border-signal bg-signal text-white',
};
const ICON = { open: '○', validated: '✓', claimed: '🚀', studio: '★' };

// Where a problem is on the loop: Open → Validated → Claimed → In studio.
export default function StageBadge({ problem, stage, small = false, showOpen = true }) {
  const key = stage || problemStage(problem || {});
  if (key === 'open' && !showOpen) return null;
  const s = STAGES[key];
  return (
    <span
      title={s.hint}
      className={`inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wide ${
        small ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      } ${STYLE[key]}`}
    >
      <span aria-hidden="true">{ICON[key]}</span>
      {s.label}
    </span>
  );
}
