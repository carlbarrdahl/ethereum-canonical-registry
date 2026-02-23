# Ethereum Canonical Registry

[![CI](https://github.com/ethereum-canonical-registry/ethereum-canonical-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/ethereum-canonical-registry/ethereum-canonical-registry/actions/workflows/ci.yml)

A shared on-chain registry that maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses — deployed once per chain, readable by any protocol.

Any identifier gets a deterministic deposit address before its owner has ever interacted with Ethereum. Funds accumulate there until the owner claims ownership and withdraws.

> **Status:** Research and concept stage. Contracts are not audited. Do not use in production.

## Table of Contents

- [Installing the Contracts](#installing-the-contracts)
- [Installing the SDK](#installing-the-sdk)
- [Resolving an Identifier](#resolving-an-identifier)
- [Funding an Identifier](#funding-an-identifier)
- [Claiming an Identifier](#claiming-an-identifier)
- [Withdrawing Funds](#withdrawing-funds)
- [Reading Registry State](#reading-registry-state)
- [Suggesting a Verifier](#suggesting-a-verifier)
- [Packages](#packages)

## Installing the Contracts

Install the contracts package to import interfaces and contracts into your Solidity project:

```sh
npm install @ethereum-canonical-registry/contracts
```

Then import directly in Solidity:

```solidity
import {ICanonicalRegistry} from "@ethereum-canonical-registry/contracts/contracts/ICanonicalRegistry.sol";
import {IVerifier} from "@ethereum-canonical-registry/contracts/contracts/IVerifier.sol";
```

For Foundry, add a remapping in `remappings.txt`:

```
@ethereum-canonical-registry/contracts/=node_modules/@ethereum-canonical-registry/contracts/
```

## Installing the SDK

```sh
npm install @ethereum-canonical-registry/sdk
```

```sh
pnpm add @ethereum-canonical-registry/sdk
```

## Resolving an Identifier

`resolveIdentifier` returns the deposit address, owner, and ERC-20 balance for an identifier in a single batched RPC call. It handles canonicalisation and id derivation internally.

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK();

const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);
// state.id             — bytes32 identifier
// state.depositAddress — where funders should send tokens
// state.owner          — null if unclaimed
// state.balance        — claimable token balance at the deposit address
```

Identifiers are `(namespace, string)` pairs. Currently supported namespaces:

| Namespace | Example       | Identifies          |
| --------- | ------------- | ------------------- |
| `github`  | `org/repo`    | A GitHub repository |
| `dns`     | `example.com` | A DNS domain        |

To compute just the bytes32 id locally (no RPC):

```ts
import { toId } from "@ethereum-canonical-registry/sdk";

const id = toId("github", "org/repo");
```

You can also parse a free-form URL:

```ts
import { parseUrl, toId } from "@ethereum-canonical-registry/sdk";

const { namespace, canonicalString } = parseUrl("https://github.com/org/repo");
const id = toId(namespace, canonicalString);
```

## Funding an Identifier

No registry interaction is required. Transfer any ERC-20 directly to the deposit address — before or after the identifier is claimed.

```ts
// Standard ERC-20 transfer — works with any token
await token.transfer(state.depositAddress, amount);
```

Protocols using Splits Warehouse can also use the deposit address as a normal allocation recipient:

```ts
await warehouse.batchDeposit([state.depositAddress], token, [amount]);
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

Use `resolveIdentifier` for the full state, or call individual methods as needed:

```ts
// Full state in one call
const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);

// Or just the owner
const owner = await sdk.registry.ownerOf(id);

// Or just the deposit address
const depositAddress = await sdk.registry.predictAddress(id);
```

For on-chain contracts, the minimal interface is:

```solidity
interface ICanonicalRegistry {
    function ownerOf(bytes32 id) external view returns (address);
}
```

## Suggesting a Verifier

Have an off-chain identity or platform that should be addressable on-chain? Suggestions for new namespaces and verifiers are welcome — [open an issue](https://github.com/ethereum-canonical-registry/ethereum-canonical-registry/issues/new) using the template below.

```markdown
**Namespace:** e.g. `npm`, `twitter`, `orcid`
**Identifies:** e.g. npm packages, Twitter accounts, researcher profiles
**Ownership signal:** how an owner proves control (OAuth scope, DNS record, file in repo, etc.)
**Verification approach:** oracle-signed, DNSSEC, ZK proof, on-chain attestation, other
**Links:** any prior art or relevant specs
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
