import { type LucideIcon } from "lucide-react";
import { cn } from "@ethereum-canonical-registry/ui/lib/utils";

interface StatBlockProps {
  icon?: LucideIcon;
  label: string;
  children: React.ReactNode;
  detail?: React.ReactNode;
  size?: "default" | "lg";
  className?: string;
}

export function StatBlock({
  icon: Icon,
  label,
  children,
  detail,
  size = "default",
  className,
}: StatBlockProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-xs uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p
        className={cn("font-bold tracking-tight tabular-nums", {
          "text-4xl": size === "lg",
          "text-3xl": size === "default",
        })}
      >
        {children}
      </p>
      {detail && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {detail}
        </div>
      )}
    </div>
  );
}
