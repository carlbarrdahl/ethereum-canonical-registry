"use client";

import Link from "next/link";
import { type Address } from "viem";
import { ArrowRightIcon, FolderOpenIcon, LayersIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useStrategies } from "@workspace/sdk";

import { EnsName } from "@/components/ens";
import { getColorForAddress } from "@/lib/color-utils";

interface ProjectEntry {
  address: Address;
  label: string | null;
  strategyCount: number;
}

function extractProjects(
  strategies: {
    allocations: { recipient: Address; weight: string; label?: string }[];
  }[],
): ProjectEntry[] {
  const map = new Map<string, ProjectEntry>();

  for (const strategy of strategies) {
    for (const alloc of strategy.allocations) {
      const key = alloc.recipient.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.strategyCount += 1;
        if (!existing.label && alloc.label) {
          existing.label = alloc.label;
        }
      } else {
        map.set(key, {
          address: alloc.recipient,
          label: alloc.label ?? null,
          strategyCount: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.strategyCount - a.strategyCount,
  );
}

function ProjectsPageSkeleton() {
  return (
    <div className="px-6 py-8 space-y-12">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="rounded-lg border divide-y">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: strategiesPage, isPending } = useStrategies({
    limit: 1000,
  });

  const strategies = strategiesPage?.items ?? [];
  const projects = extractProjects(strategies);

  // Create a Set of strategy addresses for quick lookup
  const strategyAddresses = new Set(strategies.map((s) => s.id.toLowerCase()));

  if (isPending) {
    return <ProjectsPageSkeleton />;
  }

  return (
    <div className="px-6 py-8 space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Projects
        </h1>
        <p className="text-muted-foreground text-lg">
          Recipients receiving allocations across funding strategies.
        </p>
      </div>

      {/* Projects list */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            All Recipients
          </h2>
          <Badge variant="secondary" className="text-xs">
            {projects.length} recipient{projects.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border py-12 text-center space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
              <FolderOpenIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No projects yet
            </p>
            <p className="text-xs text-muted-foreground">
              Projects will appear here when strategies allocate funds to
              recipients.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {projects.map((project) => {
              const isStrategy = strategyAddresses.has(
                project.address.toLowerCase(),
              );
              return (
                <Link
                  key={project.address}
                  href={
                    isStrategy
                      ? `/strategies/${project.address}`
                      : `/projects/${project.address}`
                  }
                  className={`px-4 py-3 block hover:bg-muted/50 transition-colors ${
                    isStrategy ? "border-l-2 border-l-primary/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div
                      className={`w-9 h-9 rounded-full ${getColorForAddress(project.address)} shrink-0 flex items-center justify-center`}
                    >
                      <span className="text-xs font-mono text-white font-semibold"></span>
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {project.label || (
                            <EnsName address={project.address} />
                          )}
                        </p>
                        {isStrategy && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 gap-1"
                          >
                            <LayersIcon className="w-2.5 h-2.5" />
                            Strategy
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        <EnsName address={project.address} />
                      </p>
                    </div>

                    {/* Strategy count + arrow */}
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <LayersIcon className="w-3 h-3" />
                        {project.strategyCount} strateg
                        {project.strategyCount !== 1 ? "ies" : "y"}
                      </span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
