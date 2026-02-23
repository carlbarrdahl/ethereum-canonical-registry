import { cn } from "@ethereum-canonical-registry/ui/lib/utils";

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  children,
  columns = 3,
  className,
}: StatsGridProps) {
  return (
    <div
      className={cn(
        "rounded-lg border grid divide-y sm:divide-y-0 sm:divide-x",
        {
          "grid-cols-1 sm:grid-cols-2": columns === 2,
          "grid-cols-1 sm:grid-cols-3": columns === 3,
          "grid-cols-2 md:grid-cols-4": columns === 4,
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StatsGridCellProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsGridCell({ children, className }: StatsGridCellProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
