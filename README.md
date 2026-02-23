# Ethereum Canonical Registry

[![CI](https://github.com/carlbarrdahl/ethereum-canonical-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/carlbarrdahl/ethereum-canonical-registry/actions/workflows/ci.yml)

A shared on-chain registry that maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses — deployed once per chain, readable by any protocol.

Any identifier gets a deterministic deposit address before its owner has ever interacted with Ethereum. Funds accumulate there until the owner claims ownership and withdraws.

> **Status:** Research and concept stage. Contracts are not audited. Do not use in production.

## Install

```sh
npm install @ethereum-canonical-registry/sdk
```

## Resolve an Identifier

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK();
const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);
// state.id             — bytes32 identifier
// state.depositAddress — where funders should send tokens
// state.owner          — null if unclaimed
// state.balance        — claimable token balance at the deposit address
```

Parse a free-form URL:

```ts
import { parseUrl, toId } from "@ethereum-canonical-registry/sdk";

const { namespace, canonicalString } = parseUrl("https://github.com/org/repo");
const id = toId(namespace, canonicalString);
```

## Fund an Identifier

No registry interaction required. Transfer any ERC-20 directly to the deposit address:

```ts
await token.transfer(state.depositAddress, amount);
```

## Claim an Identifier

Ownership is proven via a namespace-specific verifier. The web API generates signed proofs after off-chain verification.

### GitHub

```ts
// 1. Exchange a GitHub OAuth code for a proof
const res = await fetch("/api/proof/github", {
  method: "POST",
  body: JSON.stringify({ code: oauthCode, owner: "org", repo: "repo", claimant: address }),
});
const { proof } = await res.json();

// 2. Submit the claim on-chain
await sdk.registry.claim("github", "org/repo", proof);
```

### DNS

```ts
// 1. Set a TXT record: _eth-canonical.example.com → 0xYourAddress
// 2. Request a proof from the API
const res = await fetch("/api/proof/dns", {
  method: "POST",
  body: JSON.stringify({ domain: "example.com", claimant: address }),
});
const { proof } = await res.json();

// 3. Submit the claim on-chain
await sdk.registry.claim("dns", "example.com", proof);
```

On success, the registry records `owner[id] = msg.sender` and deploys the escrow proxy at the deposit address.

## Withdraw Funds

Once claimed, pull all accumulated funds to the registered owner:

```ts
await sdk.escrow.withdraw(state.depositAddress, tokenAddress);
```

Anyone can call `withdraw` — funds always go to the registered owner, not the caller.

## On-Chain Integration

```solidity
import {ICanonicalRegistry} from "@ethereum-canonical-registry/contracts/contracts/ICanonicalRegistry.sol";

bytes32 id = keccak256(abi.encode("github", "org/repo"));
address owner = ICanonicalRegistry(registry).ownerOf(id);
```

`ownerOf` resolves through aliases transparently.

## Packages

```
packages/
  contracts/   — Solidity contracts (CanonicalRegistry, ClaimableEscrow, verifiers)
  sdk/         — TypeScript SDK + React hooks
  indexer/     — Ponder event indexer
  ui/          — Shared Shadcn UI components
apps/
  web/         — Next.js frontend
  docs/        — Documentation site
```

See [PROTOCOL.md](./PROTOCOL.md) for the full protocol design, trust model, security considerations, and integration guide.
