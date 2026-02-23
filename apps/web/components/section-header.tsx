import { type LucideIcon } from "lucide-react";
import { Badge } from "@ethereum-canonical-registry/ui/components/badge";
import { cn } from "@ethereum-canonical-registry/ui/lib/utils";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  count?: number;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  icon: Icon,
  count,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
        {action}
      </div>
    </div>
  );
}
