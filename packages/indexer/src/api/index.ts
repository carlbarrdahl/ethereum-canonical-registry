import { Hono } from "hono";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { desc, eq, sql, and, gte, graphql, client } from "ponder";
import {
  strategy,
  distribution,
  transfer,
  donor,
  strategyBalance,
  fork,
} from "ponder:schema";

const app = new Hono();

// ============================================================================
// GraphQL API (auto-generated from schema)
// ============================================================================

// Ponder auto-generates a GraphQL API at /graphql
// This provides full CRUD queries for all schema tables:
//
// Queries available:
//   - strategy(id: "0x...")
//   - strategys(where: {...}, orderBy: {...}, limit: N)
//   - allocation(id: "...")
//   - allocations(where: {...}, ...)
//   - distribution(id: "...")
//   - distributions(where: {...}, ...)
//   - payout(id: "...")
//   - payouts(where: {...}, ...)
//   - transfer(id: "...")
//   - transfers(where: {...}, ...)
//   - donor(id: "...")
//   - donors(where: {...}, ...)
//   - strategyBalance(id: "...")
//   - strategyBalances(where: {...}, ...)
//   - fork(id: "...")
//   - forks(where: {...}, ...)
//
// Example GraphQL queries:
//
// Get a strategy:
//   query { strategy(id: "0x...") { id owner allocations timesForked } }
//
// List strategies ordered by times forked:
//   query { strategys(orderBy: "timesForked", orderDirection: "desc", limit: 10) { items { id owner timesForked } } }
//
// Get strategies by owner:
//   query { strategys(where: { owner: "0x..." }) { items { id allocations } } }

app.use("/graphql", graphql({ db, schema }));

// ============================================================================
// Custom REST Endpoints (for complex queries not easily done in GraphQL)
// ============================================================================

/**
 * Get trending strategies (most activity in last 24h/7d)
 * This requires aggregation which is easier in SQL
 * Uses load-balanced, rate-limited RPC to handle the volume
 */
app.get("/api/strategies/trending", async (c) => {
  const period = c.req.query("period") ?? "24h";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10"), 50);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const threshold = period === "7d" ? now - 604800n : now - 86400n;

  const trending = await db
    .select({
      strategyId: transfer.strategyId,
      transferCount: sql<number>`count(*)`.as("transferCount"),
      totalAmount: sql<bigint>`sum(${transfer.amount})`.as("totalAmount"),
    })
    .from(transfer)
    .where(
      and(eq(transfer.direction, "in"), gte(transfer.timestamp, threshold)),
    )
    .groupBy(transfer.strategyId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  if (trending.length === 0) {
    return c.json({ data: [], period });
  }

  const strategyIds = trending.map((t) => t.strategyId);
  const strategies = await db
    .select()
    .from(strategy)
    .where(sql`${strategy.id} IN (${sql.join(strategyIds, sql`, `)})`);

  const result = trending.map((t) => {
    const s = strategies.find((s) => s.id === t.strategyId);
    return {
      ...s,
      // Convert BigInt fields to strings for JSON serialization
      createdAt: s?.createdAt?.toString(),
      createdAtBlock: s?.createdAtBlock?.toString(),
      lastUpdatedAt: s?.lastUpdatedAt?.toString(),
      lastUpdatedAtBlock: s?.lastUpdatedAtBlock?.toString(),
      trendingStats: {
        transferCount: t.transferCount,
        totalAmount: t.totalAmount?.toString(),
      },
    };
  });

  return c.json({ data: result, period });
});

/**
 * Get global protocol stats (aggregations)
 */
app.get("/api/stats", async (c) => {
  const strategiesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(strategy);
  const totalStrategies = strategiesResult[0]?.count ?? 0;

  const curatorsResult = await db
    .select({ count: sql<number>`count(distinct ${strategy.owner})` })
    .from(strategy);
  const totalCurators = curatorsResult[0]?.count ?? 0;

  const donorsResult = await db
    .select({ count: sql<number>`count(distinct ${donor.address})` })
    .from(donor);
  const totalDonors = donorsResult[0]?.count ?? 0;

  const distributionsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(distribution);
  const totalDistributions = distributionsResult[0]?.count ?? 0;

  const totalAllocatedResult = await db
    .select({
      totalUSD: sql<bigint>`sum(${strategyBalance.totalReceivedUSD})`,
    })
    .from(strategyBalance);
  const totalAllocatedUSD =
    totalAllocatedResult[0]?.totalUSD?.toString() ?? "0";

  const balancesByToken = await db
    .select({
      token: strategyBalance.token,
      totalReceived: sql<bigint>`sum(${strategyBalance.totalReceived})`,
      totalDistributed: sql<bigint>`sum(${strategyBalance.totalDistributed})`,
    })
    .from(strategyBalance)
    .groupBy(strategyBalance.token);

  return c.json({
    data: {
      totalStrategies,
      totalCurators,
      totalDonors,
      totalDistributions,
      totalAllocatedUSD,
      totalsByToken: balancesByToken.map((b) => ({
        token: b.token,
        totalReceived: b.totalReceived?.toString() ?? "0",
        totalDistributed: b.totalDistributed?.toString() ?? "0",
      })),
    },
  });
});

/**
 * Get fork lineage for a strategy (recursive query)
 */
app.get("/api/strategies/:address/lineage", async (c) => {
  const address = c.req.param("address").toLowerCase() as `0x${string}`;

  const result = await db
    .select()
    .from(strategy)
    .where(eq(strategy.id, address));

  if (result.length === 0) {
    return c.json({ error: "Strategy not found" }, 404);
  }

  const currentStrategy = result[0]!;

  // Walk up the sourceStrategy chain
  const ancestors: string[] = [];
  let current = currentStrategy.sourceStrategy;

  while (current) {
    ancestors.push(current);
    const parent = await db
      .select()
      .from(strategy)
      .where(eq(strategy.id, current));
    current = parent[0]?.sourceStrategy ?? null;
  }

  // Get direct children
  const children = await db
    .select()
    .from(fork)
    .where(eq(fork.sourceStrategyId, address));

  return c.json({
    data: {
      strategy: address,
      sourceStrategy: currentStrategy.sourceStrategy,
      ancestors: ancestors.reverse(),
      children: children.map((f) => f.childStrategyId),
      depth: ancestors.length,
    },
  });
});

export default app;
