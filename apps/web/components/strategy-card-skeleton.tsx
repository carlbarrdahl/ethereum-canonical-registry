import { Skeleton } from "@ethereum-canonical-registry/ui/components/skeleton";

export function StrategyCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 h-full flex flex-col gap-3">
      {/* Mini allocation bar skeleton */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Title + subdomain + curator skeleton */}
      <div className="space-y-1 min-w-0 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Stats skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}
