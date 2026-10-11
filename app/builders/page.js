import { redirect } from 'next/navigation';

// The builders board now lives on /studio.
export default function BuildersPage({ searchParams }) {
  const need = typeof searchParams.need === 'string' ? `?need=${encodeURIComponent(searchParams.need)}` : '';
  redirect(`/studio${need}#builders`);
}
