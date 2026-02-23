# Ethereum Canonical Registry

[![CI](https://github.com/ethereum-canonical-registry/ethereum-canonical-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/ethereum-canonical-registry/ethereum-canonical-registry/actions/workflows/ci.yml)

A shared on-chain registry that maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses — deployed once per chain, readable by any protocol.

Any identifier gets a deterministic deposit address before its owner has ever interacted with Ethereum. Funds accumulate there until the owner claims ownership and withdraws.

> **Status:** Research and concept stage. Contracts are not audited. Do not use in production.

## Table of Contents

- [Installing the SDK](#installing-the-sdk)
- [Computing a Deposit Address](#computing-a-deposit-address)
- [Funding an Identifier](#funding-an-identifier)
- [Claiming an Identifier](#claiming-an-identifier)
- [Withdrawing Funds](#withdrawing-funds)
- [Reading Registry State](#reading-registry-state)
- [Packages](#packages)

## Installing the SDK

```sh
npm install @ethereum-canonical-registry/sdk
```

```sh
pnpm add @ethereum-canonical-registry/sdk
```

## Computing a Deposit Address

Every identifier has a deterministic deposit address derivable without any RPC call. Funds sent here accumulate until the owner claims and withdraws.

```ts
import { toId, resolveDepositAddress } from "@ethereum-canonical-registry/sdk";

const id = toId("github", "org/repo");
const depositAddress = resolveDepositAddress(id, REGISTRY_ADDRESS, BEACON_ADDRESS);
```

Identifiers are `(namespace, string)` pairs. Currently supported namespaces:

| Namespace | Example           | Identifies          |
| --------- | ----------------- | ------------------- |
| `github`  | `org/repo`        | A GitHub repository |
| `dns`     | `example.com`     | A DNS domain        |

You can also parse a free-form URL directly:

```ts
import { parseUrl, toId } from "@ethereum-canonical-registry/sdk";

const { namespace, canonicalString } = parseUrl("https://github.com/org/repo");
const id = toId(namespace, canonicalString);
```

## Funding an Identifier

No registry interaction is required. Transfer any ERC-20 directly to the deposit address — before or after the identifier is claimed.

```ts
// Standard ERC-20 transfer — works with any token
await token.transfer(depositAddress, amount);
```

Protocols using Splits Warehouse can also use the deposit address as a normal allocation recipient:

```ts
await warehouse.batchDeposit([depositAddress], token, [amount]);
```

Funds accumulate at the deposit address and become withdrawable once the owner claims.

## Claiming an Identifier

Ownership is proven via a verifier specific to the namespace. Current verifiers use a backend signing service (oracle model) that can be replaced with ZK-based verifiers in the future.

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK(walletClient);

// 1. Generate a proof via the backend for your namespace
const proof = await generateGithubProof({ accessToken, owner, repo, claimant });

// 2. Submit the claim on-chain
const tx = await sdk.registry.claim("github", "org/repo", proof);
await tx.wait();
```

On success, the registry records `owner[id] = msg.sender` and deploys the escrow proxy at the deposit address.

## Withdrawing Funds

Once an identifier is claimed, pull all accumulated funds to the registered owner:

```ts
const tx = await sdk.escrow.withdrawTo(depositAddress, tokenAddress);
await tx.wait();
```

Anyone can call `withdrawTo` — funds always go to the registered owner, not the caller. This lets a frontend or keeper sweep on the owner's behalf.

## Reading Registry State

Check whether an identifier is claimed and resolve its owner:

```ts
const owner = await sdk.registry.ownerOf(id);

if (owner !== zeroAddress) {
  // Claimed — send directly to owner
} else {
  // Unclaimed — send to deposit address for later withdrawal
}
```

For on-chain contracts, the minimal interface is:

```solidity
interface ICanonicalRegistry {
    function ownerOf(bytes32 id) external view returns (address);
}
```

## Packages

```
packages/
  contracts/   — Solidity contracts (CanonicalRegistry, ClaimableEscrow, verifiers)
  sdk/         — TypeScript SDK for interacting with the registry
  indexer/     — Ponder indexer for off-chain query support
  ui/          — Shared UI component library
apps/
  web/         — Frontend app
  docs/        — Documentation site
```

See [PROTOCOL.md](./PROTOCOL.md) for a full description of the protocol design, trust model, security considerations, and integration guide.
