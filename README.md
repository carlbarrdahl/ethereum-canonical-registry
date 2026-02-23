# Ethereum Canonical Registry

[![CI](https://github.com/carlbarrdahl/ethereum-canonical-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/carlbarrdahl/ethereum-canonical-registry/actions/workflows/ci.yml)

A shared on-chain registry that maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses — deployed once per chain, readable by any protocol.

Every identifier gets a deterministic deposit address before its owner has ever interacted with Ethereum. Funds accumulate there until the owner claims and withdraws.

> **Status:** Research prototype. Contracts are not audited. Do not use in production.

See [OVERVIEW.md](./OVERVIEW.md) for the problem statement, design rationale, and comparisons with ENS, Drips, and EAS. See [spec.md](./spec.md) for the full research paper.

## Install

```sh
npm install @ethereum-canonical-registry/sdk
```

## Resolve an Identifier

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK();

const state = await sdk.registry.resolveIdentifier("github", "org/repo");
// state.id             — bytes32 identifier
// state.depositAddress — where funders should send tokens
// state.owner          — null if unclaimed

// Pass a token address to also fetch the claimable balance
const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);
// state.balance        — claimable token balance at the deposit address
```

### Parse URLs

```ts
import { parseUrl, toId } from "@ethereum-canonical-registry/sdk";

const { namespace, canonicalString } = parseUrl("https://github.com/org/repo");
const id = toId(namespace, canonicalString);
```

## Fund an Identifier

Transfer any ERC-20 directly to the deposit address — no registry interaction required:

```ts
await token.transfer(state.depositAddress, amount);
```

## Claim an Identifier

Ownership is proven via a namespace-specific verifier. The web app handles verification and returns a signed proof.

### GitHub

```ts
// 1. Redirect the user to the claim gateway (handles OAuth)
window.location.href = `/claim/github?owner=org&repo=repo&claimant=${address}`;

// 2. After OAuth, the gateway redirects back with the proof
const proof = new URLSearchParams(window.location.search).get("proof");

// 3. Submit the claim on-chain
await sdk.registry.claim("github", "org/repo", proof);
```

### DNS

```ts
// 1. Add a TXT record: _eth-canonical.example.com → "0xYourAddress"

// 2. Request a proof
const res = await fetch("/api/proof/dns", {
  method: "POST",
  body: JSON.stringify({ domain: "example.com", claimant: address }),
});
const { proof } = await res.json();

// 3. Submit the claim on-chain
await sdk.registry.claim("dns", "example.com", proof);
```

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

## React Hooks

```tsx
import {
  CanonicalRegistryProvider,
  useIdentifier,
  useClaim,
} from "@ethereum-canonical-registry/sdk";

function App() {
  return <CanonicalRegistryProvider>{/* ... */}</CanonicalRegistryProvider>;
}

function IdentifierCard({ id }: { id: `0x${string}` }) {
  const { data } = useIdentifier(id);
  const claim = useClaim();

  return (
    <div>
      <p>Owner: {data?.owner ?? "Unclaimed"}</p>
      <p>Deposit: {data?.escrowAddress}</p>
    </div>
  );
}
```

## Packages

```
packages/
  contracts/   — Solidity contracts (CanonicalRegistry, ClaimableEscrow, verifiers)
  sdk/         — TypeScript SDK + React hooks
  indexer/     — Ponder event indexer
  ui/          — Shared Shadcn UI components
apps/
  web/         — Next.js frontend
  docs/        — Documentation site (concepts, architecture, integration, security)
```

## Documentation

- [OVERVIEW.md](./OVERVIEW.md) — What this is and why it exists
- [spec.md](./spec.md) — Full research paper (design trade-offs, open questions)
- [Documentation site](./apps/docs/) — Concepts, architecture, integration guide, security model, requirements
