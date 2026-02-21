import { ponder } from "ponder:registry";
import { identifier, withdrawal } from "ponder:schema";

/**
 * Handle ClaimableEscrow:Withdrawn event
 * - Insert withdrawal record
 * - Look up the identifier by escrow address to link records
 */
ponder.on("ClaimableEscrow:Withdrawn", async ({ event, context }) => {
  const { db } = context;
  const { token, to, amount } = event.args;
  const escrowAddress = event.log.address.toLowerCase() as `0x${string}`;

  // Find the identifier that owns this escrow
  const escrowIdentifier = await db.sql.query.identifier.findFirst({
    where: (t, { eq }) => eq(t.escrowAddress, escrowAddress),
  });

  const identifierId =
    escrowIdentifier?.id ??
    (escrowAddress as `0x${string}`);

  await db.insert(withdrawal).values({
    id: `${event.transaction.hash}_${event.log.logIndex}`,
    identifierId,
    token: token.toLowerCase() as `0x${string}`,
    to: to.toLowerCase() as `0x${string}`,
    amount,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
  });
});
