# @ethereum-entity-registry/sdk

[![npm](https://img.shields.io/npm/v/@ethereum-entity-registry/sdk)](https://www.npmjs.com/package/@ethereum-entity-registry/sdk)

TypeScript SDK and React hooks for the [Ethereum Entity Registry](https://github.com/ethereum-entity-registry) — a shared on-chain registry that maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses.

Every identifier gets a deterministic deposit address before its owner has ever touched Ethereum. Funds accumulate there until the owner claims and takes control.

> **Status:** Research prototype. Contracts are not audited. Do not use in production.

## Install

```sh
npm install @ethereum-entity-registry/sdk
```

**Peer dependencies**

```sh
npm install viem wagmi @tanstack/react-query sonner
```

## Quick Start

```ts
import { EntityRegistrySDK } from "@ethereum-entity-registry/sdk";

// Read-only (no wallet)
const sdk = new EntityRegistrySDK();

// With a wallet for write operations
const sdk = new EntityRegistrySDK(walletClient);

// Explicit chain (defaults to chain from wallet, or hardhat locally)
const sdk = new EntityRegistrySDK(walletClient, 84532); // Base Sepolia
```

**Supported chains**

| Chain | ID |
|---|---|
| Mainnet | `1` |
| Sepolia | `11155111` |
| Base | `8453` |
| Base Sepolia | `84532` |
| Hardhat (local) | `31337` |

---

## SDK Reference

### `sdk.registry`

#### `resolve(input, token?)`

Resolve any identifier string to its on-chain state.

```ts
const state = await sdk.registry.resolve("github.com/org/repo");
// state.id             — bytes32 identifier
// state.depositAddress — deterministic account address (fund here)
// state.owner          — registered owner, or null if unclaimed

// Pass a token address to include the balance
const state = await sdk.registry.resolve("github.com/org/repo", tokenAddress);
// state.balance        — ERC-20 balance at the deposit address
```

All of these formats are accepted:

```ts
sdk.registry.resolve("github:org/repo");
sdk.registry.resolve("https://github.com/org/repo");
sdk.registry.resolve("example.com");
sdk.registry.resolve("dns:example.com");
sdk.registry.resolve("npmjs.com/package/foo");
```

#### `ownerOf(id)`

```ts
const owner = await sdk.registry.ownerOf(id); // Address | null
```

#### `predictAddress(id)`

Compute the deterministic deposit address without an RPC call.

```ts
const address = await sdk.registry.predictAddress(id);
```

#### `toId(namespace, canonicalString)`

Derive the bytes32 identifier for a namespace/value pair.

```ts
const id = await sdk.registry.toId("github", "org/repo");
```

#### `claim(input, proof)`

Submit a verified proof to register ownership on-chain.

```ts
await sdk.registry.claim("github.com/org/repo", proofBytes);
```

#### `revoke(input)`

Release ownership of a claimed identifier.

```ts
await sdk.registry.revoke("github.com/org/repo");
```

#### `linkIds(primaryId, aliasIds)` / `unlinkIds(primaryId, aliasIds)`

Create or remove aliases between identifiers (e.g. link a GitHub org to a domain).

```ts
await sdk.registry.linkIds(primaryId, [aliasId1, aliasId2]);
await sdk.registry.unlinkIds(primaryId, [aliasId1]);
```

#### `deployAccount(id)`

Explicitly deploy the identity account contract for an identifier (auto-deployed on first `execute` otherwise).

```ts
await sdk.registry.deployAccount(id);
```

---

### `sdk.account`

#### `execute(accountAddress, target, data, value?)`

Call any contract from the identity account. Only the registered owner can call this.

```ts
await sdk.account.execute(accountAddress, target, data);
await sdk.account.execute(accountAddress, target, data, parseEther("0.1"));
```

#### `encodeERC20Transfer(token, recipient, amount)`

Encode an ERC-20 transfer to be executed via the identity account.

```ts
const { target, data } = sdk.account.encodeERC20Transfer(
  tokenAddress,
  recipient,
  amount,
);
await sdk.account.execute(state.depositAddress, target, data);
```

#### `encodeWarehouseWithdraw(warehouse, account, token)`

Encode a Splits Warehouse withdrawal.

```ts
const call = sdk.account.encodeWarehouseWithdraw(
  warehouseAddress,
  state.depositAddress,
  tokenAddress,
);
await sdk.account.execute(state.depositAddress, call.target, call.data);
```

---

### Utility functions

#### `parseUrl(input)`

Parse any URL or namespace-prefixed string into its components.

```ts
import { parseUrl } from "@ethereum-entity-registry/sdk";

parseUrl("https://github.com/org/repo");
// → { namespace: "github", canonicalString: "org/repo", formatted: "github:org/repo" }

parseUrl("example.com");
// → { namespace: "dns", canonicalString: "example.com", formatted: "dns:example.com" }
```

#### `toId(namespace, canonicalString)`

Pure local computation of the bytes32 identifier — no RPC call needed.

```ts
import { toId } from "@ethereum-entity-registry/sdk";

const id = toId("github", "org/repo");
// keccak256(abi.encode("github", "org/repo"))
```

---

## React Hooks

### Setup

Wrap your app with `EntityRegistryProvider`:

```tsx
import { EntityRegistryProvider } from "@ethereum-entity-registry/sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EntityRegistryProvider walletClient={walletClient}>
        {/* ... */}
      </EntityRegistryProvider>
    </QueryClientProvider>
  );
}
```

### Read hooks

```tsx
import {
  useOwnerOf,
  usePredictAddress,
  useToId,
} from "@ethereum-entity-registry/sdk";

// Resolve owner of an identifier
const { data: owner } = useOwnerOf(id);

// Get the deterministic deposit address
const { data: depositAddress } = usePredictAddress(id);

// Compute bytes32 id from namespace + string
const { data: id } = useToId("github", "org/repo");
```

### Write hooks

```tsx
import {
  useClaim,
  useRevoke,
  useLinkIds,
  useUnlinkIds,
  useDeployAccount,
  useExecute,
} from "@ethereum-entity-registry/sdk";

function ClaimButton({ input, proof }) {
  const claim = useClaim();

  return (
    <button
      onClick={() => claim.mutate({ input, proof })}
      disabled={claim.isPending}
    >
      Claim
    </button>
  );
}

function ExecuteButton({ accountAddress, target, data }) {
  const execute = useExecute();

  return (
    <button onClick={() => execute.mutate({ accountAddress, target, data })}>
      Execute
    </button>
  );
}
```

---

## Claim Flow

### GitHub

```ts
// 1. Redirect to the OAuth gateway
window.location.href = `/claim/github?owner=org&repo=repo&claimant=${address}`;

// 2. After OAuth, the gateway returns with a signed proof
const proof = new URLSearchParams(window.location.search).get("proof");

// 3. Submit on-chain
await sdk.registry.claim("github.com/org/repo", proof);
```

### DNS

```ts
// 1. Add a TXT record to your domain:
//    _eth-entity.example.com → "0xYourAddress"

// 2. Request a proof from the signing service
const res = await fetch("/api/proof/dns", {
  method: "POST",
  body: JSON.stringify({ domain: "example.com", claimant: address }),
});
const { proof } = await res.json();

// 3. Submit on-chain
await sdk.registry.claim("example.com", proof);
```

---

## On-Chain Integration (Solidity)

```solidity
import {IEntityRegistry} from "@ethereum-entity-registry/contracts/contracts/IEntityRegistry.sol";

address registry = 0x081a5907ab0A77fCc84cf217B62730b9341Ee687; // Base Sepolia

bytes32 id = keccak256(abi.encode("github", "org/repo"));
address owner = IEntityRegistry(registry).ownerOf(id);

// ownerOf resolves through aliases transparently
```

**Deployed addresses**

| Network | Registry |
|---|---|
| Base Sepolia | `0x081a5907ab0A77fCc84cf217B62730b9341Ee687` |
| Sepolia | see `deployments.json` |

---

## Links

- [GitHub](https://github.com/ethereum-entity-registry)
- [Documentation](https://ethereum-entity-registry.vercel.app/docs)
- [npm](https://www.npmjs.com/package/@ethereum-entity-registry/sdk)
- [Contracts](https://www.npmjs.com/package/@ethereum-entity-registry/contracts)
