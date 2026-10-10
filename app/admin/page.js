import AdminLogin from '@/components/AdminLogin';
import AdminPanel from '@/components/AdminPanel';
import SetupNotice from '@/components/SetupNotice';
import { db } from '@/lib/db';
import { listJobs } from '@/lib/queries';
import { isAdmin, adminConfigured } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="mx-auto mt-16 max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold">Admin is not set up</h1>
        <p className="mt-2 text-ink2">
          Add an <code className="font-mono text-sm">ADMIN_PASSWORD</code> (8+ characters) in Vercel → Settings →
          Environment Variables, then redeploy.
        </p>
      </div>
    );
  }
  if (!isAdmin()) return <AdminLogin />;

  try {
    const sql = await db();
    const [problems, jobs, companies, [{ n: companyTotal }], submissions, comments, leads, proofs, intros] = await Promise.all([
      sql`SELECT id, title, industry, country, votes, status, author FROM problems ORDER BY created_at DESC LIMIT 300`,
      listJobs({ includeInactive: true }),
      sql`SELECT id, name, country, industry, problem, website, city, sector, is_unicorn FROM companies WHERE is_unicorn ORDER BY continent, name`,
      sql`SELECT count(*)::int AS n FROM companies`,
      sql`SELECT s.id, s.name, s.country, s.industry, s.sector, s.city, s.problem, s.website, s.founded, s.submitter, s.contact,
          s.problem_id, p.title AS for_problem
        FROM company_submissions s LEFT JOIN problems p ON p.id = s.problem_id
        WHERE s.status = 'pending' ORDER BY s.created_at ASC LIMIT 200`,
      sql`SELECT c.id, c.kind, c.body, c.author, c.status, c.helpful, p.id AS problem_id, p.title AS problem FROM problem_comments c JOIN problems p ON p.id = c.problem_id ORDER BY c.created_at DESC LIMIT 150`,
      sql`SELECT b.id, b.name, b.email, b.phone, b.linkedin, b.city, b.stage, b.commitment, b.needs, b.pitch, b.status, b.notes, b.created_at, p.id AS problem_id, p.title AS problem, p.votes FROM builder_interests b JOIN problems p ON p.id = b.problem_id ORDER BY (b.status = 'new') DESC, b.created_at DESC LIMIT 500`,
      sql`SELECT pp.id, pp.story, pp.frequency, pp.pay, pp.who, pp.city, pp.author, pp.status, p.id AS problem_id, p.title AS problem
        FROM problem_proofs pp JOIN problems p ON p.id = pp.problem_id ORDER BY pp.created_at DESC LIMIT 200`,
      sql`SELECT i.id, i.name, i.email, i.message, i.status, i.created_at, b.name AS builder, b.email AS builder_email,
          p.id AS problem_id, p.title AS problem
        FROM intro_requests i JOIN builder_interests b ON b.id = i.builder_id JOIN problems p ON p.id = b.problem_id
        ORDER BY (i.status = 'new') DESC, i.created_at DESC LIMIT 200`,
    ]);
    // Pass plain values only to the client component.
    const plainJobs = jobs.map(({ created_at, ...j }) => j);
    return <AdminPanel problems={problems} jobs={plainJobs} companies={companies} companyTotal={companyTotal} submissions={submissions} comments={comments}
        leads={leads.map((l) => ({ ...l, created_at: new Date(l.created_at).toISOString() }))}
        proofs={proofs}
        intros={intros.map((i) => ({ ...i, created_at: new Date(i.created_at).toISOString() }))}
      />;
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
}
