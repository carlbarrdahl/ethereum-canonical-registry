import { Hono } from "hono";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { desc, eq, sql, graphql } from "ponder";
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
 * GET /api/identifiers/:namespace
 * List all claimed identifiers for a given namespace.
 */
app.get("/api/identifiers/:namespace", async (c) => {
  const namespace = c.req.param("namespace");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 200);

  const results = await db
    .select()
    .from(identifier)
    .where(eq(identifier.namespace, namespace))
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
 * GET /api/owner/:address/identifiers
 * List all identifiers owned by a given address.
 */
app.get("/api/owner/:address/identifiers", async (c) => {
  const address = c.req.param("address").toLowerCase() as `0x${string}`;

  const results = await db
    .select()
    .from(identifier)
    .where(eq(identifier.owner, address))
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
