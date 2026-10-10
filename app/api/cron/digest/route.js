import { sendDueDigests } from '@/lib/digest';
import { emailConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Called weekly by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Not allowed' }, { status: 401 });
  }
  if (!emailConfigured()) return Response.json({ skipped: 'RESEND_API_KEY is not set' });
  try {
    return Response.json(await sendDueDigests());
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Digest run failed' }, { status: 500 });
  }
}
