import { ponder } from "ponder:registry";
import { identifier, identifierAlias } from "ponder:schema";

/**
 * Handle Claimed event
 * - Upsert identifier row with owner, claimedAt
 * - Clear any stale revokedAt
 */
ponder.on("CanonicalRegistry:Claimed", async ({ event, context }) => {
  const { db } = context;
  const { id, namespace, canonicalString, owner } = event.args;

  await db
    .insert(identifier)
    .values({
      id,
      namespace,
      canonicalString,
      owner: owner.toLowerCase() as `0x${string}`,
      accountAddress: null,
      claimedAt: event.block.timestamp,
      revokedAt: null,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate(() => ({
      owner: owner.toLowerCase() as `0x${string}`,
      claimedAt: event.block.timestamp,
      revokedAt: null,
    }));
});

/**
 * Handle Revoked event
 * - Clear owner, set revokedAt
 */
ponder.on("CanonicalRegistry:Revoked", async ({ event, context }) => {
  const { db } = context;
  const { id } = event.args;

  await db.update(identifier, { id }).set({
    owner: null,
    revokedAt: event.block.timestamp,
  });
});

/**
 * Handle Linked event
 * - Create alias row
 */
ponder.on("CanonicalRegistry:Linked", async ({ event, context }) => {
  const { db } = context;
  const { aliasId, primaryId } = event.args;

  await db
    .insert(identifierAlias)
    .values({
      id: `${aliasId}_${primaryId}`,
      aliasId,
      primaryId,
      linkedAt: event.block.timestamp,
    })
    .onConflictDoUpdate(() => ({
      linkedAt: event.block.timestamp,
    }));
});

/**
 * Handle Unlinked event
 * - Delete alias row
 */
ponder.on("CanonicalRegistry:Unlinked", async ({ event, context }) => {
  const { db } = context;
  const { aliasId, primaryId } = event.args;

  await db.delete(identifierAlias, {
    id: `${aliasId}_${primaryId}`,
  });
});

/**
 * Handle AccountDeployed event
 * - Update identifier with account address
 * - Create identifier row if not yet present (account can be deployed before claim)
 */
ponder.on("CanonicalRegistry:AccountDeployed", async ({ event, context }) => {
  const { db } = context;
  const { id, account } = event.args;

  await db
    .insert(identifier)
    .values({
      id,
      namespace: "",
      canonicalString: "",
      owner: null,
      accountAddress: account.toLowerCase() as `0x${string}`,
      claimedAt: null,
      revokedAt: null,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate(() => ({
      accountAddress: account.toLowerCase() as `0x${string}`,
    }));
});
