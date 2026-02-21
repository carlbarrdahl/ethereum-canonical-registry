import { type LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border py-12 text-center space-y-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
