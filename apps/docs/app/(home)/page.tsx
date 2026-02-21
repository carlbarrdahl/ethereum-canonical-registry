import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-3xl font-bold mb-3">support.eth curator docs</h1>
      <p className="text-muted-foreground mb-6">
        Protocol architecture, contracts, SDK, and indexing.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/docs" className="font-medium underline">
          Open docs
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/docs/architecture" className="font-medium underline">
          Architecture
        </Link>
      </div>
    </div>
  );
}
