import { ponder } from "ponder:registry";
import { identifier, identifierAlias } from "ponder:schema";

/**
 * Handle Claimed event
 * - Upsert identifier row with owner, claimedAt
 * - Clear any stale revokedAt
 */
ponder.on("EntityRegistry:Claimed", async ({ event, context }) => {
  const { db, network } = context;
  const { chainId } = network;
  const { id, namespace, canonicalString, owner } = event.args;

  await db
    .insert(identifier)
    .values({
      chainId,
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
ponder.on("EntityRegistry:Revoked", async ({ event, context }) => {
  const { db, network } = context;
  const { chainId } = network;
  const { id } = event.args;

  await db.update(identifier, { chainId, id }).set({
    owner: null,
    revokedAt: event.block.timestamp,
  });
});

/**
 * Handle Linked event
 * - Create alias row
 */
ponder.on("EntityRegistry:Linked", async ({ event, context }) => {
  const { db, network } = context;
  const { chainId } = network;
  const { aliasId, primaryId } = event.args;

  await db
    .insert(identifierAlias)
    .values({
      chainId,
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
ponder.on("EntityRegistry:Unlinked", async ({ event, context }) => {
  const { db, network } = context;
  const { chainId } = network;
  const { aliasId, primaryId } = event.args;

  await db.delete(identifierAlias, {
    chainId,
    id: `${aliasId}_${primaryId}`,
  });
});

/**
 * Handle AccountDeployed event
 * - Update identifier with account address
 * - Create identifier row if not yet present (account can be deployed before claim)
 */
ponder.on("EntityRegistry:AccountDeployed", async ({ event, context }) => {
  const { db, network } = context;
  const { chainId } = network;
  const { id, account } = event.args;

  await db
    .insert(identifier)
    .values({
      chainId,
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
