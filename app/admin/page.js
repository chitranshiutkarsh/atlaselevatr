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
    const [problems, jobs, companies, [{ n: companyTotal }], submissions, comments] = await Promise.all([
      sql`SELECT id, title, industry, country, votes, status, author FROM problems ORDER BY created_at DESC LIMIT 300`,
      listJobs({ includeInactive: true }),
      sql`SELECT id, name, country, industry, problem, website, city, sector, is_unicorn FROM companies WHERE is_unicorn ORDER BY continent, name`,
      sql`SELECT count(*)::int AS n FROM companies`,
      sql`SELECT id, name, country, industry, sector, city, problem, website, founded, submitter, contact FROM company_submissions WHERE status = 'pending' ORDER BY created_at ASC LIMIT 200`,
      sql`SELECT c.id, c.kind, c.body, c.author, c.status, c.helpful, p.id AS problem_id, p.title AS problem FROM problem_comments c JOIN problems p ON p.id = c.problem_id ORDER BY c.created_at DESC LIMIT 150`,
    ]);
    // Pass plain values only to the client component.
    const plainJobs = jobs.map(({ created_at, ...j }) => j);
    return <AdminPanel problems={problems} jobs={plainJobs} companies={companies} companyTotal={companyTotal} submissions={submissions} comments={comments} />;
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
}
