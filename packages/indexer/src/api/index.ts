import { Hono } from "hono";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { desc, eq, sql, graphql, and } from "ponder";
import { identifier } from "ponder:schema";

const app = new Hono();

// ============================================================================
// GraphQL API (auto-generated from schema)
// ============================================================================

// Ponder auto-generates a GraphQL API at /graphql for all schema tables:
//
//   identifier(id: "0x...")
//   identifiers(where: { owner: "0x..." }, orderBy: "createdAt", orderDirection: "desc")
//   identifierAlias(id: "...")
//   identifierAliases(where: { primaryId: "0x..." })

app.use("/graphql", graphql({ db, schema }));

// ============================================================================
// Custom REST Endpoints
// ============================================================================

/**
 * GET /api/stats
 * Global registry statistics.
 */
app.get("/api/stats", async (c) => {
  const [identifiersResult, ownersResult] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(identifier),
      db
        .select({ count: sql<number>`count(distinct ${identifier.owner})` })
        .from(identifier)
        .where(sql`${identifier.owner} is not null`),
    ]);

  return c.json({
    data: {
      totalIdentifiers: identifiersResult[0]?.count ?? 0,
      totalOwners: ownersResult[0]?.count ?? 0,
    },
  });
});

/**
 * GET /api/identifiers/:namespace?chainId=84532
 * List all claimed identifiers for a given namespace, optionally filtered by chain.
 */
app.get("/api/identifiers/:namespace", async (c) => {
  const namespace = c.req.param("namespace");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 200);
  const chainIdParam = c.req.query("chainId");
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;

  const results = await db
    .select()
    .from(identifier)
    .where(
      chainId !== null
        ? and(eq(identifier.namespace, namespace), eq(identifier.chainId, chainId))
        : eq(identifier.namespace, namespace),
    )
    .orderBy(desc(identifier.createdAt))
    .limit(limit);

  return c.json({
    data: results.map((row) => ({
      ...row,
      claimedAt: row.claimedAt?.toString() ?? null,
      revokedAt: row.revokedAt?.toString() ?? null,
      createdAt: row.createdAt.toString(),
    })),
  });
});

/**
 * GET /api/owner/:address/identifiers?chainId=84532
 * List all identifiers owned by a given address, optionally filtered by chain.
 */
app.get("/api/owner/:address/identifiers", async (c) => {
  const address = c.req.param("address").toLowerCase() as `0x${string}`;
  const chainIdParam = c.req.query("chainId");
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;

  const results = await db
    .select()
    .from(identifier)
    .where(
      chainId !== null
        ? and(eq(identifier.owner, address), eq(identifier.chainId, chainId))
        : eq(identifier.owner, address),
    )
    .orderBy(desc(identifier.createdAt));

  return c.json({
    data: results.map((row) => ({
      ...row,
      claimedAt: row.claimedAt?.toString() ?? null,
      revokedAt: row.revokedAt?.toString() ?? null,
      createdAt: row.createdAt.toString(),
    })),
  });
});

export default app;
