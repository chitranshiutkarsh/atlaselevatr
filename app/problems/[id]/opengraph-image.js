import { ImageResponse } from 'next/og';
import { getProblem } from '@/lib/queries';
import { prettyName } from '@/lib/geo';
import { SITE } from '@/lib/constants';

export const runtime = 'nodejs';
export const alt = 'A problem on Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Share card for WhatsApp, LinkedIn and X: the problem, how many people face
// it, and a call to add your voice.
export default async function Image({ params }) {
  let p = null;
  try {
    p = await getProblem(parseInt(params.id, 10));
  } catch {}
  const title = p?.title || 'The world’s problems, mapped and ranked';
  const faced = p ? Math.max(p.proofs || 0, p.votes || 0) : 0;
  const where = p ? `${p.industry} · ${prettyName(p.country)}` : SITE.tagline;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F4F1EA', padding: '64px 72px', color: '#14213D', fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }}>
          <span style={{ fontWeight: 700 }}>Atlas</span>
          <span style={{ fontSize: 22, color: '#4A5468', letterSpacing: 4, textTransform: 'uppercase' }}>{where}</span>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 58 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            {faced > 0 && <span style={{ fontSize: 88, fontWeight: 700, color: '#E4572E' }}>{String(faced)}</span>}
            <span style={{ fontSize: faced > 0 ? 34 : 40 }}>
              {faced > 0 ? `${faced === 1 ? 'person faces this.' : 'people face this.'} Do you?` : 'Does this happen to you?'}
            </span>
          </div>
          <span style={{ display: 'flex', background: '#14213D', color: '#F4F1EA', borderRadius: 999, padding: '18px 32px', fontSize: 28, fontFamily: 'sans-serif', fontWeight: 600 }}>
            Add your voice →
          </span>
        </div>
      </div>
    ),
    size
  );
}
