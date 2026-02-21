"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  WalletIcon,
  ArrowUpRightIcon,
  DollarSignIcon,
  LayersIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  GitForkIcon,
  TrendingUpIcon,
  FlameIcon,
  SparklesIcon,
  StarIcon,
  PiggyBankIcon,
  SendIcon,
  ExternalLinkIcon,
  ClockIcon,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { StatBlock } from "@/components/stat-block";
import { DataRow } from "@/components/data-row";
import { SectionHeader } from "@/components/section-header";
import { DistributionBar } from "@/components/distribution-bar";
import { StatsGrid, StatsGridCell } from "@/components/stats-grid";
import { EmptyState } from "@/components/empty-state";
import { ALLOCATION_COLORS } from "@/lib/color-utils";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ALLOCATIONS = [
  { key: "0x1234", weight: 40, color: "bg-blue-500", label: "Gitcoin Grants" },
  { key: "0x5678", weight: 25, color: "bg-emerald-500", label: "Protocol Guild" },
  { key: "0x9abc", weight: 20, color: "bg-pink-500", label: "Octant" },
  { key: "0xdef0", weight: 15, color: "bg-amber-500", label: "Giveth" },
];

const MOCK_ROWS = [
  {
    color: "bg-blue-500",
    label: "Gitcoin Grants",
    address: "0x1234...5678",
    pct: "40.0%",
    usd: "$12,400",
  },
  {
    color: "bg-emerald-500",
    label: "Protocol Guild",
    address: "0x5678...9abc",
    pct: "25.0%",
    usd: "$7,750",
  },
  {
    color: "bg-pink-500",
    label: "Octant",
    address: "0x9abc...def0",
    pct: "20.0%",
    usd: "$6,200",
  },
  {
    color: "bg-amber-500",
    label: "Giveth",
    address: "0xdef0...1234",
    pct: "15.0%",
    usd: "$4,650",
    badge: true,
  },
];

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

// ---------------------------------------------------------------------------
// Helper to display code snippets inline
// ---------------------------------------------------------------------------

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border bg-muted/50 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded ${className}`} />
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StyleguidePage() {
  return (
    <div className="px-6 py-8 space-y-12">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Home
      </Link>

      {/* Page hero */}
      <div className="space-y-4 pb-10 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Design Styleguide
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Visual reference for support.eth curator's design language. All components
          shown here use reusable primitives that can be composed across the app.
        </p>
      </div>

      {/* ================================================================= */}
      {/*  TYPOGRAPHY                                                       */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Typography Scale" />
        <div className="rounded-lg border divide-y">
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Page Title
            </p>
            <p className="text-3xl md:text-4xl font-bold tracking-tight">
              Public Goods Funding
            </p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Financial Number
            </p>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              $31,000.00
            </p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Section Heading
            </p>
            <p className="text-lg font-semibold tracking-tight">Allocations</p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Stat Label
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <WalletIcon className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider font-medium">
                Balance
              </span>
            </div>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Inline Label
            </p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Available Yield
            </p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Body Text
            </p>
            <p className="text-sm">
              Design, publish, and operate capital allocation strategies for the
              public goods ecosystem.
            </p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Metadata
            </p>
            <p className="text-xs text-muted-foreground">
              Curated by vitalik.eth — 5 donors — 3 forks
            </p>
          </div>
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Monospace
            </p>
            <p className="font-mono text-xs">0x1234...5678</p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COLORS                                                           */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Allocation Colors"
          count={ALLOCATION_COLORS.length}
        />
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {ALLOCATION_COLORS.map((color) => (
              <Swatch key={color} className={color} label={color} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  BUTTONS                                                          */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Button Hierarchy" />
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Primary — Fund, Distribute
            </p>
            <div className="flex flex-wrap gap-2">
              <Button icon={WalletIcon}>Fund</Button>
              <Button icon={ArrowUpRightIcon}>Distribute</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Secondary — Ghost actions near title
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" icon={PencilIcon}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" icon={GitForkIcon}>
                Fork
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Tertiary — Outline actions
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={PlusIcon}>
                Connect Vault
              </Button>
              <Button variant="outline" size="sm" icon={PlusIcon}>
                Add Recipient
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              State — Default small with icon
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm" icon={TrendingUpIcon}>
                Harvest
              </Button>
              <Button variant="default" size="sm" isLoading loadingText="Harvesting...">
                Harvest
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              CTA — Secondary on primary background
            </p>
            <div className="rounded-lg bg-primary text-primary-foreground p-5 space-y-3">
              <h3 className="font-semibold">Start Curating</h3>
              <p className="text-sm opacity-90">
                Create a strategy to allocate funds across public goods projects.
              </p>
              <Button variant="secondary" size="sm" icon={ArrowUpRightIcon}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  STAT BLOCK                                                       */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="StatBlock"
          description="Reusable stat display with icon, label, value, and optional token detail."
        />
        <CodeBlock>{`import { StatBlock } from "@/components/stat-block";

<StatBlock icon={WalletIcon} label="Balance" size="lg">
  $31,000.00
</StatBlock>`}</CodeBlock>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border p-6 space-y-6">
            <StatBlock icon={WalletIcon} label="Balance" size="lg">
              $31,000.00
            </StatBlock>
            <StatBlock
              icon={ArrowUpRightIcon}
              label="Distributed"
              size="lg"
              detail={
                <>
                  <span>12.5 ETH</span>
                  <span>8,400 USDC</span>
                </>
              }
            >
              $18,200.00
            </StatBlock>
          </div>
          <div className="rounded-lg border p-6">
            <StatsGrid columns={3} className="border-0 rounded-none">
              <StatsGridCell>
                <StatBlock icon={DollarSignIcon} label="Total Allocated">
                  $2.4M
                </StatBlock>
              </StatsGridCell>
              <StatsGridCell>
                <StatBlock icon={LayersIcon} label="Strategies">
                  142
                </StatBlock>
              </StatsGridCell>
              <StatsGridCell>
                <StatBlock icon={UsersIcon} label="Curators">
                  89
                </StatBlock>
              </StatsGridCell>
            </StatsGrid>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  STATS GRID                                                       */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="StatsGrid"
          description="Bordered divided grid for stat groups. Matches the homepage stats and vault stats pattern."
        />
        <CodeBlock>{`import { StatsGrid, StatsGridCell } from "@/components/stats-grid";

<StatsGrid columns={3}>
  <StatsGridCell>
    <StatBlock icon={DollarSignIcon} label="Total Allocated">$2.4M</StatBlock>
  </StatsGridCell>
  ...
</StatsGrid>`}</CodeBlock>
        <StatsGrid columns={3}>
          <StatsGridCell>
            <StatBlock icon={DollarSignIcon} label="Total Allocated">
              $2.4M
            </StatBlock>
          </StatsGridCell>
          <StatsGridCell>
            <StatBlock icon={LayersIcon} label="Active Strategies">
              142
            </StatBlock>
          </StatsGridCell>
          <StatsGridCell>
            <StatBlock icon={UsersIcon} label="Curators">
              89
            </StatBlock>
          </StatsGridCell>
        </StatsGrid>

        <p className="text-xs text-muted-foreground">4-column variant (vault stats):</p>
        <StatsGrid columns={4}>
          <StatsGridCell>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Principal
            </p>
            <p className="text-sm font-semibold tabular-nums">1,000.00 USDC</p>
          </StatsGridCell>
          <StatsGridCell className="bg-green-50/50 dark:bg-green-950/10">
            <p className="text-[11px] uppercase tracking-wider text-green-700 dark:text-green-400 mb-0.5">
              Available Yield
            </p>
            <p className="text-sm font-semibold tabular-nums">42.50 USDC</p>
          </StatsGridCell>
          <StatsGridCell>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Total Harvested
            </p>
            <p className="text-sm font-semibold tabular-nums">128.00 USDC</p>
          </StatsGridCell>
          <StatsGridCell>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Harvests
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tabular-nums">7</p>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <ClockIcon className="h-2.5 w-2.5" />
                3d ago
              </span>
            </div>
          </StatsGridCell>
        </StatsGrid>
      </section>

      {/* ================================================================= */}
      {/*  DISTRIBUTION BAR                                                 */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="DistributionBar"
          description="Colored segmented bar for allocation/weight breakdowns. Available in sm and md sizes."
        />
        <CodeBlock>{`import { DistributionBar } from "@/components/distribution-bar";

<DistributionBar
  segments={[
    { key: "a", weight: 40, color: "bg-blue-500", label: "Gitcoin" },
    { key: "b", weight: 25, color: "bg-emerald-500", label: "Protocol Guild" },
  ]}
  size="md"
/>`}</CodeBlock>
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Medium (default) — used in allocation sections
            </p>
            <DistributionBar segments={MOCK_ALLOCATIONS} size="md" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Small — used in strategy cards
            </p>
            <DistributionBar segments={MOCK_ALLOCATIONS} size="sm" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Empty state
            </p>
            <DistributionBar segments={[]} size="md" />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  SECTION HEADER                                                   */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="SectionHeader"
          description="Consistent section heading with optional icon, count badge, description, and action slot."
        />
        <CodeBlock>{`import { SectionHeader } from "@/components/section-header";

<SectionHeader
  title="Allocations"
  count={4}
  action={<Button variant="outline" size="sm">Add</Button>}
/>`}</CodeBlock>
        <div className="rounded-lg border p-6 space-y-8">
          <SectionHeader title="Allocations" count={4} />
          <SectionHeader
            title="Yield Vaults"
            description="ERC-4626 vaults directing yield to this strategy."
            action={
              <Button variant="outline" size="sm" icon={PlusIcon}>
                Connect Vault
              </Button>
            }
          />
          <SectionHeader
            title="Trending"
            icon={TrendingUpIcon}
          />
          <SectionHeader
            title="Distribution History"
            action={
              <span className="text-sm text-muted-foreground">
                3 transactions
              </span>
            }
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/*  DATA ROW                                                         */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="DataRow"
          description="Reusable list row with color dot, label, metadata, badge, and right-aligned value."
        />
        <CodeBlock>{`import { DataRow } from "@/components/data-row";

<div className="rounded-lg border divide-y">
  <DataRow
    color="bg-blue-500"
    label="Gitcoin Grants"
    meta="0x1234...5678"
    value="40.0%"
    detail="$12,400"
  />
</div>`}</CodeBlock>
        <div className="rounded-lg border divide-y">
          {MOCK_ROWS.map((row) => (
            <DataRow
              key={row.address}
              color={row.color}
              label={row.label}
              meta={row.address}
              badge={
                row.badge ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 gap-1"
                  >
                    <LayersIcon className="w-2.5 h-2.5" />
                    Strategy
                  </Badge>
                ) : undefined
              }
              value={row.pct}
              detail={row.usd}
            />
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COMPOSED: HERO SPLIT                                             */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Hero Split Layout"
          description="Asymmetric grid used on detail pages — identity left, financial data right."
        />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 pb-10 border-b rounded-lg border p-6">
          <div className="lg:col-span-3 space-y-5">
            {/* Title + actions */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Public Goods Strategy
                </h1>
                <div className="flex items-center gap-1 shrink-0 pt-1.5">
                  <Button variant="ghost" size="sm" icon={PencilIcon}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={GitForkIcon}>
                    Fork
                  </Button>
                </div>
              </div>
            </div>

            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono text-xs">
                publicgoods.curate.eth
              </Badge>
              <span>
                Curated by{" "}
                <span className="text-foreground font-medium">vitalik.eth</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="w-3 h-3" /> 42 donors
              </span>
              <span className="inline-flex items-center gap-1">
                <GitForkIcon className="w-3 h-3" /> 7 forks
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-lg">
              A diversified public goods strategy allocating across grants
              platforms, protocol funding, and direct project support.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <StatBlock
              icon={WalletIcon}
              label="Balance"
              size="lg"
              detail={
                <>
                  <span>12.5 ETH</span>
                  <span>8,400 USDC</span>
                </>
              }
            >
              $31,000.00
            </StatBlock>
            <StatBlock
              icon={ArrowUpRightIcon}
              label="Distributed"
              size="lg"
              detail={
                <>
                  <span>8.2 ETH</span>
                  <span>5,600 USDC</span>
                </>
              }
            >
              $18,200.00
            </StatBlock>
            <div className="flex items-center gap-2">
              <Button icon={WalletIcon}>Fund</Button>
              <Button variant="outline" icon={ArrowUpRightIcon}>
                Distribute
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COMPOSED: ALLOCATION SECTION                                     */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Allocation Section"
          description="Composed from SectionHeader + DistributionBar + DataRow list."
          count={4}
        />
        <DistributionBar segments={MOCK_ALLOCATIONS} />
        <div className="rounded-lg border divide-y">
          {MOCK_ROWS.map((row) => (
            <div
              key={row.address}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <DataRow
                color={row.color}
                label={row.label}
                meta={row.address}
                badge={
                  row.badge ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 gap-1"
                    >
                      <LayersIcon className="w-2.5 h-2.5" />
                      Strategy
                    </Badge>
                  ) : undefined
                }
                value={row.pct}
                detail={row.usd}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COMPOSED: STRATEGY CARD                                          */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Strategy Cards"
          description="Two card variants for displaying strategies: compact grid cards and featured hero cards."
        />
        
        <CodeBlock>{`// Compact card for grids
import { StrategyCard } from "@/components/strategy-card";

<StrategyCard strategy={strategy} allocatedUSD={allocatedUSD} />

// Featured card for hero sections
import { FeaturedStrategyCard } from "@/components/featured-strategy-card";

<FeaturedStrategyCard strategy={strategy} allocatedUSD={allocatedUSD} />

// Both cards use getColorForAddress() to assign colors from ALLOCATION_COLORS`}</CodeBlock>
        
        {/* Compact Strategy Cards */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Compact Cards — Used in grids (StrategyCard component)
          </p>
          <p className="text-xs text-muted-foreground">
            Features a HoverCard that displays full description and complete allocation list on hover.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Public Goods Strategy", subdomain: "publicgoods", curator: "vitalik.eth", amount: "$12.4K", allocs: 4, donors: 42, forks: 7 },
              { title: "DeFi Infrastructure", subdomain: "defi-infra", curator: "dankrad.eth", amount: "$8.2K", allocs: 6, donors: 18, forks: 3 },
              { title: "Climate Action", subdomain: "climate", curator: "griff.eth", amount: "$5.1K", allocs: 3, donors: 25, forks: 12 },
              { title: "Open Source", subdomain: "opensource", curator: "carl.eth", amount: "$3.8K", allocs: 5, donors: 9, forks: 1 },
            ].map((s) => (
              <div
                key={s.title}
                className="block group cursor-pointer h-full"
              >
                <div className="rounded-lg border overflow-hidden h-full flex flex-col transition-colors hover:border-muted-foreground/25">
                  {/* Mini allocation bar (h-2) */}
                  <div className="flex h-2 w-full bg-muted">
                    {MOCK_ALLOCATIONS.map((a) => (
                      <div
                        key={a.key}
                        className={a.color}
                        style={{ width: `${a.weight}%` }}
                      />
                    ))}
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4 flex-1">
                    {/* Title + subdomain + curator */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.subdomain}.curate.eth
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        by {s.curator}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t">
                      <span className="font-semibold text-sm tabular-nums">
                        {s.amount}
                      </span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <LayersIcon className="w-3.5 h-3.5" />
                          {s.allocs}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {s.donors}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <GitForkIcon className="w-3.5 h-3.5" />
                          {s.forks}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Strategy Card */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Featured Card — Large hero variant (FeaturedStrategyCard component)
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="rounded-lg border overflow-hidden hover:border-muted-foreground/25 transition-colors">
              {/* Allocation Bar - Larger (h-3) */}
              <div className="flex h-3 w-full overflow-hidden bg-muted">
                {MOCK_ALLOCATIONS.map((a) => (
                  <div
                    key={a.key}
                    className={a.color}
                    style={{ width: `${a.weight}%` }}
                  />
                ))}
              </div>

              <div className="p-6 space-y-6">
                {/* Title & Metadata */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                        Public Goods Strategy
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        by vitalik.eth
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      publicgoods.curate.eth
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    A diversified public goods strategy allocating across grants
                    platforms, protocol funding, and direct project support.
                  </p>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <LayersIcon className="w-4 h-4" />
                    4
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <UsersIcon className="w-4 h-4" />
                    42
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <GitForkIcon className="w-4 h-4" />
                    7
                  </span>
                </div>

                {/* Allocations Preview */}
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Allocations
                  </p>
                  <div className="space-y-2">
                    {MOCK_ALLOCATIONS.map((alloc) => (
                      <div
                        key={alloc.key}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${alloc.color}`}
                          />
                          <span className="truncate">{alloc.label}</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {alloc.weight.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fund Button - Placed near financial data */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between gap-4 pt-5 border-t">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                      Total Allocated
                    </p>
                    <p className="text-2xl font-bold tracking-tight tabular-nums">
                      $31,000
                    </p>
                  </div>
                  <Button icon={WalletIcon}>Fund</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COMPOSED: TRENDING CARDS                                         */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Trending Cards" icon={TrendingUpIcon} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { badge: "Hot This Week", icon: FlameIcon, title: "Climate Action Fund", subtitle: "24 donations this week" },
            { badge: "Rising Star", icon: SparklesIcon, title: "DeFi Infrastructure", subtitle: "18 donors" },
            { badge: "Most Copied", icon: StarIcon, title: "Public Goods Strategy", subtitle: "Copied 7 times" },
          ].map((item, index) => {
            const style = TRENDING_STYLES[index % TRENDING_STYLES.length]!;
            return (
              <div
                key={item.title}
                className={`group rounded-lg border ${style.border} ${style.bg} p-4 transition-all hover:shadow-sm cursor-pointer`}
              >
                <div
                  className={`flex items-center gap-1.5 mb-1.5 ${style.accent}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{item.badge}</span>
                </div>
                <p className="font-semibold group-hover:text-primary transition-colors truncate">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================= */}
      {/*  COMPOSED: VAULT CARD                                             */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Vault Card"
          description="Yield vault with header actions and stats grid."
          action={
            <Button variant="outline" size="sm" icon={PlusIcon}>
              Connect Vault
            </Button>
          }
        />
        <div className="rounded-lg border transition-colors">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
            <div className="min-w-0">
              <div className="text-sm font-medium inline-flex items-center gap-1.5">
                Aave USDC Vault
                <span className="text-xs text-muted-foreground font-normal">
                  (aUSDC)
                </span>
                <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Source: <span className="font-mono">0xaave...3f2c</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" icon={PiggyBankIcon}>
                Deposit
              </Button>
              <Button variant="default" size="sm" icon={TrendingUpIcon}>
                Harvest
              </Button>
            </div>
          </div>
          <StatsGrid columns={4} className="border-0 rounded-none">
            <StatsGridCell>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Principal
              </p>
              <p className="text-sm font-semibold tabular-nums">1,000.00 USDC</p>
            </StatsGridCell>
            <StatsGridCell className="bg-green-50/50 dark:bg-green-950/10">
              <p className="text-[11px] uppercase tracking-wider text-green-700 dark:text-green-400 mb-0.5">
                Available Yield
              </p>
              <p className="text-sm font-semibold tabular-nums">42.50 USDC</p>
            </StatsGridCell>
            <StatsGridCell>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Total Harvested
              </p>
              <p className="text-sm font-semibold tabular-nums">128.00 USDC</p>
            </StatsGridCell>
            <StatsGridCell>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Harvests
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tabular-nums">7</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <ClockIcon className="h-2.5 w-2.5" />
                      3d ago
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Last harvested: Feb 7, 2026</TooltipContent>
                </Tooltip>
              </div>
            </StatsGridCell>
          </StatsGrid>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  TABLE                                                            */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Table Section" />
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
              {[
                { title: "Public Goods Strategy", curator: "vitalik.eth", amount: "$12,400", donors: 42 },
                { title: "DeFi Infrastructure", curator: "dankrad.eth", amount: "$8,200", donors: 18 },
                { title: "Climate Action Fund", curator: "griff.eth", amount: "$5,100", donors: 25 },
              ].map((s, i) => (
                <TableRow key={s.title} className="group">
                  <TableCell className="font-mono text-muted-foreground text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium inline-flex items-center gap-1.5 group-hover:text-primary transition-colors cursor-pointer">
                      {s.title}
                      <ArrowUpRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.curator}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {s.amount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.donors}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  EMPTY STATE                                                      */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="EmptyState"
          description="Reusable empty state component with icon, title, description, and optional action."
        />
        <CodeBlock>{`import { EmptyState } from "@/components/empty-state";

<EmptyState
  icon={PiggyBankIcon}
  title="No yield vaults connected"
  description="Connect an ERC-4626 vault to earn yield for this strategy."
  action={<Button variant="outline" size="sm">Connect Vault</Button>}
/>`}</CodeBlock>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EmptyState
            icon={PiggyBankIcon}
            title="No yield vaults connected"
            description="Connect an ERC-4626 vault to earn yield for this strategy."
            action={
              <Button variant="outline" size="sm" icon={PlusIcon}>
                Connect Vault
              </Button>
            }
          />
          <EmptyState
            icon={SendIcon}
            title="No distributions yet"
            description="Use the Distribute button to send funds to recipients."
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/*  SKELETONS                                                        */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Skeleton States"
          description="Match skeleton shapes to real content layout."
        />
        <div className="rounded-lg border p-6 space-y-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Hero skeleton
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
              <div className="lg:col-span-3 space-y-4">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Data row skeleton
            </p>
            <div className="rounded-lg border divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  METADATA BADGES                                                  */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Metadata Badges" />
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs">
              publicgoods.curate.eth
            </Badge>
            <span>
              Curated by{" "}
              <span className="text-foreground font-medium">vitalik.eth</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="w-3 h-3" /> 42 donors
            </span>
            <span className="inline-flex items-center gap-1">
              <GitForkIcon className="w-3 h-3" /> 7 forks
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              4 recipients
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <LayersIcon className="w-3 h-3" />
              Strategy
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              0x1234...5678
            </Badge>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  PAGE WRAPPER                                                     */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader
          title="Page"
          description="Page wrapper component that eliminates boilerplate for back link, title, description, and actions."
        />
        <CodeBlock>{`import { Page } from "@/components/page";

<Page
  backLink={{ href: "/", label: "Back to Home" }}
  title="Page Title"
  description="Page description text."
  actions={<Button>Action</Button>}
>
  {/* page content */}
</Page>`}</CodeBlock>
        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-4">
            Example: This page (and all detail pages) should use the Page component.
            It handles the px-6 py-8 wrapper, spacing, back link, title/description layout,
            and actions positioning automatically.
          </p>
          <div className="rounded-lg border bg-background p-3 text-xs space-y-2">
            <code className="block text-muted-foreground">{"<Page"}</code>
            <code className="block text-muted-foreground ml-2">
              {`backLink={{ href: "/", label: "Back to Strategies" }}`}
            </code>
            <code className="block text-muted-foreground ml-2">
              title="Strategy Detail"
            </code>
            <code className="block text-muted-foreground ml-2">
              description="View allocations, balance, and distribution history."
            </code>
            <code className="block text-muted-foreground">{">"}</code>
            <code className="block text-muted-foreground ml-2">
              {"{/* hero grid, sections, etc */}"}
            </code>
            <code className="block text-muted-foreground">{"</Page>"}</code>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  REUSABLE COMPONENTS INDEX                                        */}
      {/* ================================================================= */}
      <section className="space-y-5">
        <SectionHeader title="Reusable Components" />
        <div className="rounded-lg border divide-y">
          {[
            {
              name: "Page",
              path: "@/components/page",
              desc: "Page wrapper with back link, title, description, actions, and content spacing.",
            },
            {
              name: "StatBlock",
              path: "@/components/stat-block",
              desc: "Icon + label + large number + optional token detail. Used for financial stats.",
            },
            {
              name: "DataRow",
              path: "@/components/data-row",
              desc: "Color dot + label + meta + badge + right-aligned value. Used in list sections.",
            },
            {
              name: "SectionHeader",
              path: "@/components/section-header",
              desc: "Section heading with optional icon, count badge, description, and action.",
            },
            {
              name: "DistributionBar",
              path: "@/components/distribution-bar",
              desc: "Colored segmented progress bar with tooltips. Available in sm and md sizes.",
            },
            {
              name: "StatsGrid / StatsGridCell",
              path: "@/components/stats-grid",
              desc: "Bordered divided grid for stat groups. 2, 3, or 4 column layouts.",
            },
            {
              name: "EmptyState",
              path: "@/components/empty-state",
              desc: "Empty state with icon, title, description, and optional action button.",
            },
            {
              name: "StrategyCard",
              path: "@/components/strategy-card",
              desc: "Compact strategy card for grids with allocation bar, metadata, and hover details.",
            },
            {
              name: "FeaturedStrategyCard",
              path: "@/components/featured-strategy-card",
              desc: "Large featured strategy card with full allocations preview and fund button.",
            },
          ].map((c) => (
            <div key={c.name} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {c.path}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs text-right">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
