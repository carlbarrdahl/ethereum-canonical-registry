import { index, onchainTable, primaryKey, relations } from "ponder";

// ============================================================================
// Core Tables
// ============================================================================

/**
 * Identifier — one row per canonical off-chain identifier per chain
 * id = keccak256(abi.encode(namespace, canonicalString))
 */
export const identifier = onchainTable(
  "identifier",
  (t) => ({
    chainId: t.integer().notNull(),
    id: t.hex().notNull(), // bytes32 id
    namespace: t.text().notNull(),
    canonicalString: t.text().notNull(),
    owner: t.hex(), // null = unclaimed / revoked
    accountAddress: t.hex(), // null until AccountDeployed fires
    claimedAt: t.bigint(),
    revokedAt: t.bigint(),
    createdAt: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.chainId, table.id] }),
    ownerIdx: index().on(table.owner),
    namespaceIdx: index().on(table.namespace),
    accountIdx: index().on(table.accountAddress),
  }),
);

/**
 * IdentifierAlias — tracks linkIds / unlinkIds
 * Deleted when unlinked.
 */
export const identifierAlias = onchainTable(
  "identifier_alias",
  (t) => ({
    chainId: t.integer().notNull(),
    id: t.text().notNull(), // `${aliasId}_${primaryId}`
    aliasId: t.hex().notNull(),
    primaryId: t.hex().notNull(),
    linkedAt: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.chainId, table.id] }),
    aliasIdx: index().on(table.aliasId),
    primaryIdx: index().on(table.primaryId),
  }),
);

// ============================================================================
// Relations
// ============================================================================

export const identifierRelations = relations(identifier, ({ many }) => ({
  aliases: many(identifierAlias, { relationName: "primaryAliases" }),
}));

export const identifierAliasRelations = relations(
  identifierAlias,
  ({ one }) => ({
    primary: one(identifier, {
      fields: [identifierAlias.primaryId],
      references: [identifier.id],
      relationName: "primaryAliases",
    }),
  }),
);
