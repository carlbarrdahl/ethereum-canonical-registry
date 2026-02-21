"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import {
  PlusIcon,
  TrendingUpIcon,
  UsersIcon,
  LayersIcon,
  DollarSignIcon,
  ArrowRightIcon,
  FlameIcon,
  StarIcon,
  SparklesIcon,
  GitForkIcon,
} from "lucide-react";
import {
  useStrategies,
  useStrategyBalances,
  useProtocolStats,
  useTrendingStrategies,
  ENS_DOMAIN,
} from "@workspace/sdk";
import { truncate } from "@/lib/truncate";
import { EnsName } from "@/components/ens";
import { USDAmount } from "@/components/amount";
import { StrategyCard } from "@/components/strategy-card";
import { StrategyCardSkeleton } from "@/components/strategy-card-skeleton";
import { ErrorBanner } from "@/components/error-banner";

const TRENDING_STYLES = [
  {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-900/50",
    accent: "text-orange-600 dark:text-orange-400",
  },
  {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-900/50",
    accent: "text-sky-600 dark:text-sky-400",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
    accent: "text-amber-600 dark:text-amber-400",
  },
];

export default function Page() {
  const { data: strategiesPage, isPending, isError: isStrategiesError, refetch: refetchStrategies } = useStrategies({
    orderBy: "timesForked",
    orderDirection: "desc",
    limit: 10,
  });

  // Fetch protocol stats
  const { data: stats, isError: isStatsError } = useProtocolStats();

  // Fetch trending strategies
  const { data: trendingData, isError: isTrendingError } = useTrendingStrategies({
    period: "7d",
    limit: 3,
  });

  // Fetch most copied strategy
  const { data: mostCopiedPage } = useStrategies({
    orderBy: "timesForked",
    orderDirection: "desc",
    limit: 1,
  });

  // Fetch all strategy balances for table display
  const { data: allBalances } = useStrategyBalances({
    limit: 1000,
  });

  const strategies = strategiesPage?.items ?? [];
  const totalStrategies =
    stats?.totalStrategies ?? strategiesPage?.totalCount ?? 0;
  const totalCurators = stats?.totalCurators ?? 0;
  const totalAllocatedUSD = BigInt(stats?.totalAllocatedUSD ?? 0);

  // Build trending cards from real data
  const trendingStrategies = trendingData?.data ?? [];
  const mostCopied = mostCopiedPage?.items?.[0];

  type TrendingCard = {
    badge: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
  };

  const trendingCards: TrendingCard[] = [
    trendingStrategies[0]
      ? {
          badge: "Hot This Week",
          icon: <FlameIcon className="w-3.5 h-3.5" />,
          title:
            trendingStrategies[0].metadata?.title ||
            truncate(trendingStrategies[0].id, 16),
          subtitle: `${trendingStrategies[0].trendingStats.transferCount} donations this week`,
          href: `/strategies/${trendingStrategies[0].id}`,
        }
      : null,
    trendingStrategies[1]
      ? {
          badge: "Rising Star",
          icon: <SparklesIcon className="w-3.5 h-3.5" />,
          title:
            trendingStrategies[1].metadata?.title ||
            truncate(trendingStrategies[1].id, 16),
          subtitle: `${trendingStrategies[1].uniqueDonors} donors`,
          href: `/strategies/${trendingStrategies[1].id}`,
        }
      : null,
    mostCopied && mostCopied.timesForked > 0
      ? {
          badge: "Most Copied",
          icon: <StarIcon className="w-3.5 h-3.5" />,
          title: mostCopied.metadata?.title || truncate(mostCopied.id, 16),
          subtitle: `Copied ${mostCopied.timesForked} times`,
          href: `/strategies/${mostCopied.id}`,
        }
      : null,
  ].filter((card): card is TrendingCard => card !== null);

  // Featured strategies: top 4 for the card row
  const featuredStrategies = strategies.slice(0, 4);

  // Helper to get allocated USD for a strategy
  const getAllocatedUSD = (strategyId: string) =>
    allBalances?.items
      .filter((b) => b.strategyId === strategyId)
      .reduce((sum, b) => sum + BigInt(b.totalReceivedUSD ?? 0), 0n) ?? 0n;

  const hasError =  isStrategiesError || isStatsError || isTrendingError;

  return (
    <div className="px-6 py-8 space-y-12">
      {hasError && (
        <ErrorBanner
          onRetry={() => {
            if (isStrategiesError) refetchStrategies();
          }}
        />
      )}

      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Public Goods Funding
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg">
          Design, publish, and operate capital allocation strategies for the
          public goods ecosystem.
        </p>
        <Link href="/strategies/create">
          <Button icon={PlusIcon} className="mt-1">
            Create Strategy
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="rounded-lg border grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
        <div className="px-5 py-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSignIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Total Allocated
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            <USDAmount amount={totalAllocatedUSD} compact />
          </p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayersIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Active Strategies
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {totalStrategies}
          </p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UsersIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Curators
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {totalCurators}
          </p>
        </div>
      </div>

      {/* Featured Strategies */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Featured Strategies
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StrategyCardSkeleton key={i} />
            ))
          ) : (
            featuredStrategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                allocatedUSD={getAllocatedUSD(s.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Strategies */}
        <section className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              All Strategies
            </h2>
            {strategiesPage && strategiesPage.totalCount > 10 && (
              <Badge variant="secondary" className="text-xs">
                {strategiesPage.totalCount} total
              </Badge>
            )}
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Curator</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Donors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32">
                      <span className="text-muted-foreground">Loading...</span>
                    </TableCell>
                  </TableRow>
                ) : strategies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          No strategies found
                        </p>
                        <Link href="/strategies/create">
                          <Button variant="outline" size="sm" icon={PlusIcon}>
                            Create the first one
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  strategies.map((s, index) => {
                    const strategyAllocatedUSD = getAllocatedUSD(s.id);

                    return (
                      <TableRow key={s.id} className="group">
                        <TableCell className="font-mono text-muted-foreground text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/strategies/${s.id}`}
                            className="group-hover:text-primary transition-colors"
                          >
                            <span className="font-medium hover:underline inline-flex items-center gap-1.5">
                              {s.ensLabel
                                ? `${s.ensLabel}.${ENS_DOMAIN}`
                                : s.metadata?.title || truncate(s.id, 16)}
                              <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            {s.ensLabel && s.metadata?.title && (
                              <p className="text-xs text-muted-foreground font-normal">
                                {s.metadata.title}
                              </p>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <EnsName address={s.owner} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <USDAmount amount={strategyAllocatedUSD} compact />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.uniqueDonors}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Trending */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Trending
            </h2>
            {trendingCards.length === 0 ? (
              <div className="rounded-lg border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No trending strategies yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trendingCards.map((item, index) => {
                  const style =
                    TRENDING_STYLES[index % TRENDING_STYLES.length]!;
                  return (
                    <Link key={item.title} href={item.href} className="block">
                      <div
                        className={`group rounded-lg border ${style.border} ${style.bg} p-4 transition-all hover:shadow-sm`}
                      >
                        <div
                          className={`flex items-center gap-1.5 mb-1.5 ${style.accent}`}
                        >
                          {item.icon}
                          <span className="text-xs font-semibold">
                            {item.badge}
                          </span>
                        </div>
                        <p className="font-semibold group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* CTA */}
          <div className="rounded-lg bg-primary text-primary-foreground p-5 space-y-3">
            <h3 className="font-semibold">Start Curating</h3>
            <p className="text-sm opacity-90">
              Create a strategy to allocate funds across public goods projects.
            </p>
            <Link href="/strategies/create">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRightIcon}
                className="mt-1"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
