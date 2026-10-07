import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <p className="label">Off the map</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">This page isn&apos;t charted</h1>
      <Link href="/" className="btn-primary mt-6">Back to the atlas</Link>
    </div>
  );
}
