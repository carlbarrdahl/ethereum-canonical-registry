import { cn } from "@workspace/ui/lib/utils";

interface DataRowProps {
  color?: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  value?: React.ReactNode;
  detail?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DataRow({
  color,
  label,
  meta,
  badge,
  value,
  detail,
  children,
  className,
}: DataRowProps) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex items-center gap-3">
        {color && (
          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{label}</p>
            {badge}
          </div>
          {meta && (
            <p className="text-xs text-muted-foreground font-mono">{meta}</p>
          )}
        </div>
        {children}
        {(value || detail) && (
          <div className="text-right shrink-0">
            {value && (
              <p className="text-sm font-semibold tabular-nums">{value}</p>
            )}
            {detail && (
              <p className="text-xs text-muted-foreground">{detail}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
