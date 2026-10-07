import StartupForm from '@/components/StartupForm';

export const metadata = { title: 'List your startup' };

export default function AddStartupPage() {
  return (
    <div className="mx-auto max-w-2xl pt-12">
      <p className="label">Free · No login</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">List your startup</h1>
      <p className="mt-3 text-ink2">
        Building something? Add it to the atlas with the problem you&apos;re solving. We review every listing before it
        goes live, usually within a day. Already listed but the details are wrong? Submit it again with the right ones.
      </p>
      <StartupForm />
    </div>
  );
}
