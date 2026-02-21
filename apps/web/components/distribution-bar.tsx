import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";

interface Segment {
  key: string;
  weight: number;
  color: string;
  label?: string;
}

interface DistributionBarProps {
  segments: Segment[];
  size?: "sm" | "md";
  className?: string;
}

export function DistributionBar({
  segments,
  size = "md",
  className,
}: DistributionBarProps) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  if (total === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-full bg-muted",
          { "h-2": size === "sm", "h-4": size === "md" },
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-full bg-muted",
        { "h-2": size === "sm", "h-4": size === "md" },
        className,
      )}
    >
      {segments.map((seg) => {
        const pct = (seg.weight / total) * 100;
        const bar = (
          <div
            key={seg.key}
            className={cn(
              seg.color,
              "transition-all first:rounded-l-full last:rounded-r-full hover:opacity-80",
            )}
            style={{ width: `${pct}%` }}
          />
        );

        if (!seg.label) return bar;

        return (
          <Tooltip key={seg.key}>
            <TooltipTrigger asChild>{bar}</TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">{seg.label}</span> —{" "}
              {pct.toFixed(1)}%
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
