import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-3xl font-bold mb-3">Canonical Registry docs</h1>
      <p className="text-muted-foreground mb-6">
        Protocol architecture, contracts, SDK, and indexing.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/docs" className="font-medium underline">
          Open docs
        </Link>
      </div>
    </div>
  );
}
