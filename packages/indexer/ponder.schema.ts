import { index, onchainTable, relations } from "ponder";

// ============================================================================
// Core Tables
// ============================================================================

/**
 * Identifier — one row per canonical off-chain identifier (e.g. "github:org/repo")
 * id = keccak256(abi.encode(namespace, canonicalString))
 */
export const identifier = onchainTable(
  "identifier",
  (t) => ({
    id: t.hex().primaryKey(), // bytes32 id
    namespace: t.text().notNull(),
    canonicalString: t.text().notNull(),
    owner: t.hex(), // null = unclaimed / revoked
    escrowAddress: t.hex(), // null until EscrowDeployed fires
    claimedAt: t.bigint(),
    revokedAt: t.bigint(),
    createdAt: t.bigint().notNull(),
  }),
  (table) => ({
    ownerIdx: index().on(table.owner),
    namespaceIdx: index().on(table.namespace),
    escrowIdx: index().on(table.escrowAddress),
  }),
);

/**
 * IdentifierAlias — tracks linkIds / unlinkIds
 * Deleted when unlinked.
 */
export const identifierAlias = onchainTable(
  "identifier_alias",
  (t) => ({
    id: t.text().primaryKey(), // `${aliasId}_${primaryId}`
    aliasId: t.hex().notNull(),
    primaryId: t.hex().notNull(),
    linkedAt: t.bigint().notNull(),
  }),
  (table) => ({
    aliasIdx: index().on(table.aliasId),
    primaryIdx: index().on(table.primaryId),
  }),
);

/**
 * Withdrawal — one row per ClaimableEscrow:Withdrawn event
 */
export const withdrawal = onchainTable(
  "withdrawal",
  (t) => ({
    id: t.text().primaryKey(), // txHash_logIndex
    identifierId: t.hex().notNull(), // looked up via escrow→identifier
    token: t.hex().notNull(),
    to: t.hex().notNull(),
    amount: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    txHash: t.hex().notNull(),
  }),
  (table) => ({
    identifierIdx: index().on(table.identifierId),
    tokenIdx: index().on(table.token),
    toIdx: index().on(table.to),
    timestampIdx: index().on(table.timestamp),
  }),
);

/**
 * WarehouseBalance — claimable balances in SplitsWarehouse per user/token
 */
export const warehouseBalance = onchainTable(
  "warehouse_balance",
  (t) => ({
    id: t.text().primaryKey(), // user_token
    user: t.hex().notNull(),
    token: t.hex().notNull(),
    balance: t.bigint().notNull().default(0n),
    totalEarned: t.bigint().notNull().default(0n),
    totalClaimed: t.bigint().notNull().default(0n),
    totalEarnedUSD: t.bigint().notNull().default(0n),
    lastUpdatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    userIdx: index().on(table.user),
    tokenIdx: index().on(table.token),
  }),
);

// ============================================================================
// Relations
// ============================================================================

export const identifierRelations = relations(identifier, ({ many }) => ({
  withdrawals: many(withdrawal),
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

export const withdrawalRelations = relations(withdrawal, ({ one }) => ({
  identifier: one(identifier, {
    fields: [withdrawal.identifierId],
    references: [identifier.id],
  }),
}));
