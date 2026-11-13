import { goTo } from '@/lib/go';

export const dynamic = 'force-dynamic';

export function GET(request, { params }) {
  return goTo(request, 'role', params.id);
}
