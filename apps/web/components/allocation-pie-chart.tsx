"use client";

import { Pie, PieChart, Cell, Tooltip as RechartsTooltip } from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@workspace/ui/components/chart";

const COLORS = [
  { bg: "bg-blue-400", fill: "hsl(217, 91%, 60%)" },
  { bg: "bg-green-400", fill: "hsl(142, 71%, 45%)" },
  { bg: "bg-pink-400", fill: "hsl(330, 81%, 60%)" },
  { bg: "bg-yellow-400", fill: "hsl(45, 93%, 47%)" },
  { bg: "bg-purple-400", fill: "hsl(270, 70%, 60%)" },
  { bg: "bg-orange-400", fill: "hsl(25, 95%, 53%)" },
] as const;

const getColor = (index: number) => COLORS[index % COLORS.length]!;

type Allocation = {
  recipient: string;
  weight: number;
  label?: string;
};

type AllocationPieChartProps = {
  allocations: Allocation[];
  className?: string;
  showLegend?: boolean;
};

export function AllocationPieChart({
  allocations,
  className,
  showLegend = false,
}: AllocationPieChartProps) {
  const totalWeight = allocations.reduce((sum, a) => sum + (a.weight || 0), 0);

  const chartData = allocations.map((a, i) => ({
    name:
      a.label ||
      (a.recipient
        ? `${a.recipient.slice(0, 6)}...${a.recipient.slice(-4)}`
        : `Allocation ${i + 1}`),
    value: a.weight || 0,
    fill: getColor(i).fill,
  }));

  const chartConfig = allocations.reduce(
    (acc, a, i) => {
      const key = `allocation-${i}`;
      acc[key] = {
        label:
          a.label ||
          (a.recipient
            ? `${a.recipient.slice(0, 6)}...${a.recipient.slice(-4)}`
            : `Allocation ${i + 1}`),
        color: getColor(i).fill,
      };
      return acc;
    },
    { value: { label: "Weight" } } as ChartConfig,
  );

  return (
    <div className={className}>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[200px] w-full"
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            strokeWidth={2}
            paddingAngle={1}
          />
        </PieChart>
      </ChartContainer>

      {/* Legend (optional) */}
      {showLegend && (
        <div className="space-y-1.5 w-full max-w-xs mx-auto mt-4">
          {allocations.map((a, i) => {
            const percent =
              totalWeight > 0
                ? ((a.weight / totalWeight) * 100).toFixed(1)
                : "0";
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColor(i).bg}`}
                />
                <span className="text-sm truncate flex-1">
                  {a.label ||
                    (a.recipient
                      ? `${a.recipient.slice(0, 6)}...${a.recipient.slice(-4)}`
                      : "No address")}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
