# Ethereum Canonical Registry

A minimal on-chain registry that maps off-chain identifiers to Ethereum addresses. It is designed as a shared public-good primitive — deployed once per chain, like ENS. Any protocol can read it, any entity can be addressed before it has interacted with Ethereum.

## The problem

Many off-chain entities — open source repositories, websites, developer accounts — have no Ethereum address. Protocols that want to send value or data to them have two options: require the entity to register an address first, or rely on a trusted intermediary to resolve addresses on their behalf.

Both options have drawbacks. Requiring registration means you can only interact with entities that have already opted in. Using a trusted intermediary means someone can manipulate the mapping.

## What this is

A registry contract that:

- Assigns every identifier a deterministic Ethereum address before anyone registers
- Lets owners claim identifiers later by proving ownership
- Accepts pluggable, swappable verification methods per identifier type

The registry holds no funds and has no privileged operators. It is a coordination layer — a shared source of truth that any protocol can read.

## How identifiers work

Every identifier is a `(namespace, string)` pair:

| Namespace | Example string | Identifies          |
| --------- | -------------- | ------------------- |
| `github`  | `org/repo`     | A GitHub repository |
| `dns`     | `example.com`  | A DNS domain        |

The on-chain ID is `keccak256(abi.encode(namespace, canonicalString))`. Uses `abi.encode` (length-prefixed) rather than `abi.encodePacked` to prevent collisions between namespace/string pairs that share a common concatenation.

Normalization rules (lowercase, trailing slashes, etc.) are namespace-specific and enforced off-chain by verifiers and frontends. The contract hashes whatever strings are passed to it.

## Deterministic addresses

Every identifier has a corresponding Ethereum address derived deterministically using CREATE2. This address can be computed by anyone — no on-chain call required — from the identifier and the registry address.

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK();
const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);
// state.depositAddress — where funders should send tokens
```

This address is where funds accumulate. Any ERC-20 transfer to this address is held in the escrow until the identifier is claimed. A `ClaimableEscrow` proxy is deployed at this address when the identifier is first claimed.

The key property: **a protocol can address any identifier and deposit funds to it before the owner has ever interacted with Ethereum.**

## Upgradeable escrow (Beacon Proxy)

Each escrow is deployed as a `BeaconProxy` pointing to an `UpgradeableBeacon` managed by the registry. The proxy bytecode and constructor args are deterministic per identifier, so the deposit address is stable and predictable.

If a bug is found in the escrow logic, the registry admin can upgrade the implementation via `upgradeEscrowImplementation(newImpl)`. All existing proxy addresses remain unchanged — only the delegated logic behind them changes.

The escrow implementation handles two funding paths in a single `withdraw` call:

1. **Direct ERC-20 transfers** — any `token.transfer(depositAddress, amount)` is held in the escrow contract's own balance.
2. **Splits Warehouse deposits** — protocols that call `warehouse.deposit(depositAddress, token, amount)` or `warehouse.batchDeposit` accumulate a warehouse balance under the deposit address.

`withdraw` pulls the warehouse balance to the escrow first, then transfers the combined total to the registered owner. Both funding paths work simultaneously with no configuration required.

## Claiming ownership

To claim an identifier, the owner submits a proof to the registry. The registry delegates verification to a verifier contract registered for that namespace.

```
registry.claim("github", "org/repo", proofBytes)
```

On a valid proof, the registry records `owner[id] = msg.sender` and deploys the escrow proxy if not already deployed.

### Verifiers

Each namespace has one verifier. Current verifiers use a trusted backend service (oracle model):

- **GitHub**: backend checks admin access via GitHub OAuth, signs a proof
- **DNS**: backend resolves `_eth-canonical.<domain>` TXT record, signs a proof

The verifier interface is:

```solidity
interface IVerifier {
    function verify(bytes32 id, address claimant, bytes calldata proof) external returns (bool);
}
```

Verifiers are swappable per namespace without changing the registry. The oracle-based verifiers can be replaced with ZK-based verifiers (e.g. vlayer, TLSNotary) as that tooling matures.

All oracle proofs use EIP-712 typed data signatures. The domain separator includes `chainId` and the registry address, preventing both cross-chain and cross-deployment replay.

## Withdrawing funds

Once an identifier is claimed, anyone can call `withdraw` on the escrow proxy. Funds held at the escrow address are transferred to the registered owner's address.

```ts
await sdk.escrow.withdraw(depositAddress, tokenAddress);
```

Anyone can call `withdraw` — funds always go to the registered owner, not to the caller.

## Revocation

An owner can revoke their claim, returning the identifier to unclaimed state:

```
registry.revoke("github", "org/repo")
```

Only primary identifiers can be revoked directly. If the identifier has aliases, call `unlinkIds` first to restore them as independent identifiers. Any aliases not unlinked before revocation become stale (resolve to `address(0)`) and are automatically cleared the next time someone claims that alias identifier.

Funds remain at the same escrow address and will be claimable by whoever claims the identifier next.

## Linking identifiers

A project may have multiple identifiers (`github:org/repo`, `dns:example.com`). These are separate by default with separate deposit addresses. The owner can link them after claiming both:

```ts
await sdk.registry.linkIds(primaryId, [aliasId1, aliasId2]);
```

Linked aliases resolve to the primary's owner. Funds in each escrow remain separate but both withdraw to the same address. Aliases can be unlinked with `unlinkIds`.

## Trust model

The registry contract itself has no privileged operators beyond the admin key (which controls `setVerifier` and `upgradeEscrowImplementation`). It holds no funds. The trust assumptions are in the verifiers:

- **Oracle verifiers** (current): you trust the backend signing service checked ownership correctly. The signing key can be rotated; the service can be replaced by upgrading the verifier contract.
- **ZK verifiers** (future): ownership is proven cryptographically on-chain. No trust assumption beyond the proof system.

For DNS domains, a fully trustless path already exists via DNSSEC (used by ENS). A `VerifierDNSSEC` contract wrapping ENS's `DNSSECImpl` would replace the oracle verifier with no changes to the registry.

## Security considerations

- **Proof replay**: EIP-712 domain separator binds proofs to a specific chain and registry address. Proofs include an expiry timestamp (default 1 hour). Proofs are bound to a specific `claimant` address — they cannot be used by any other sender. Within the TTL window, a proof could technically be re-used by the same claimant after a revoke; this is mitigated by the backend issuing fresh proofs on each request.
- **Identifier collisions**: `abi.encode` (length-prefixed) prevents collisions between different namespace/string pairs that produce the same packed concatenation.
- **Normalization**: rules are namespace-specific and enforced by verifiers, not globally by the contract. Future namespaces may be case-sensitive.
- **Oracle key compromise**: a compromised signing key allows claiming any unclaimed identifier in all namespaces sharing that verifier. Mitigation: HSM for key storage, key rotation via `setTrustedSigner`, and a defined upgrade path to ZK verifiers.
- **Escrow upgradeability**: the beacon is owned by the registry contract. Implementation upgrades are gated by `onlyOwner` via `upgradeEscrowImplementation`.
- **No ownership transfer**: there is no `transferOwnership` function. The only way to change the associated address is to revoke and re-claim with a fresh proof. This is intentional — it ties the registered address to the actual identity owner at claim time — but it means wallet rotation requires a new verification round-trip.

## Design trade-offs

### Why a proxy per identifier, not a shared pool?

An alternative design would hold all funds in a single contract with a `deposits[id][token]` mapping instead of deploying one `ClaimableEscrow` proxy per identifier. This would be simpler and cheaper.

The beacon proxy approach is chosen for composability. Because each identifier has a standalone Ethereum address, **any protocol can fund an identifier without knowing the registry exists** — callers transfer tokens to a normal address, and any Splits-native protocol can use `warehouse.deposit(depositAddress, ...)` as they would with any other recipient. A shared pool would require every funder to call a registry-specific `deposit(id, token, amount)` function, creating a direct dependency on the registry for every upstream protocol.

The cost is ~200k gas at claim time to deploy the proxy, plus the complexity of the beacon upgrade mechanism.

### Counterfactual addresses as a primitive

The deposit address is derivable by anyone before registration. This property — **fund before claim** — is what makes the registry useful as a shared primitive rather than just a naming service. A protocol like Gitcoin can route funding to `github:org/repo` without coordinating with the repo's maintainers; the maintainers claim the funds whenever they're ready. The escrow holds the balance in the interim.

This differs from ENS, which requires the owner to register before the name resolves to anything. The counterfactual address exists in the derivation formula from day one.

## Integration guide

### As a funder or upstream protocol

You don't need to know the registry exists. Compute the deposit address for any identifier and transfer tokens directly to it — before or after the identifier is claimed.

```ts
import { CanonicalRegistrySDK } from "@ethereum-canonical-registry/sdk";

const sdk = new CanonicalRegistrySDK();
const { depositAddress } = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress);

// Standard ERC-20 transfer — no registry interaction required
await token.transfer(depositAddress, amount);
```

Funds accumulate at the deposit address until the identifier's owner claims and withdraws them.

### As a smart contract reading registry state

The minimal interface for on-chain consumers is `ICanonicalRegistry`:

```solidity
interface ICanonicalRegistry {
    function ownerOf(bytes32 id) external view returns (address);
}
```

A contract can resolve the current owner of any identifier and route payments accordingly:

```solidity
bytes32 id = keccak256(abi.encode("github", "org/repo"));
address owner = ICanonicalRegistry(registry).ownerOf(id);

if (owner != address(0)) {
    // Identifier is claimed — send directly to owner
    token.transfer(owner, amount);
} else {
    // Identifier is unclaimed — send to deposit address for later withdrawal
    token.transfer(depositAddress, amount);
}
```

`ownerOf` resolves through aliases transparently — no special handling needed for linked identifiers.

### As the identifier owner (claiming and withdrawing)

1. **Generate a proof** via the web API for your namespace (GitHub OAuth or DNS TXT record).
2. **Claim** — submits the proof on-chain and deploys the escrow proxy:

```ts
await sdk.registry.claim("github", "org/repo", proof);
```

3. **Withdraw** — pulls all accumulated funds from the escrow to your address:

```ts
await sdk.escrow.withdraw(depositAddress, tokenAddress);
```

Anyone can trigger `withdraw` — funds always go to the registered owner, not the caller. This means a frontend or keeper can sweep on the owner's behalf.

### Splits Warehouse integration

Any protocol that routes funds via Splits Warehouse can use deposit addresses as allocation recipients. The deposit address for any identifier is a normal Ethereum address — pass it to `warehouse.batchDeposit` as you would any other recipient.

```
Funder → warehouse.batchDeposit([escrowAddress, ...], token, amounts)
           → escrow accumulates warehouse balance
           → owner claims registry identifier
           → escrow.withdraw(token)
               pulls warehouse balance + any direct transfers → owner
```

The deposit address is computable before the identifier is claimed, so protocols can allocate funds to unclaimed identifiers — funds accumulate in the warehouse and become withdrawable the moment the owner claims.

### Adding a new namespace

Deploy a verifier implementing `IVerifier` and propose it to the registry admin for registration. Since the registry is a shared deployment, namespace registration is controlled by registry governance — anyone can build and propose a verifier, but `setVerifier` requires the admin key.

```solidity
interface IVerifier {
    function verify(bytes32 id, address claimant, bytes calldata proof) external returns (bool);
}

// Called by registry admin
registry.setVerifier("npm", address(npmVerifier));
```

Any `verify` implementation is valid — oracle-signed, ZK proof, on-chain attestation. Existing namespaces are unaffected.

## Relationship to existing projects

- **ENS**: maps human-readable names to addresses. This registry maps entity identifiers (repos, domains) to addresses. Complementary — an ENS name can resolve to a registry deposit address.
- **EAS**: the natural long-term storage layer for ownership attestations. The current design stores ownership in a simple mapping for self-containment; migrating to EAS as the canonical source of truth is a defined future direction.
- **Splits**: every deposit address is a first-class Splits Warehouse recipient. The escrow implementation handles both `warehouse.batchDeposit` (used by Splits-native protocols) and direct ERC-20 transfers in a single `withdraw` call.
- **Drips Network**: maps GitHub repositories to addresses with pre-funding support. Uses an oracle to read `FUNDING.json` from repos. This registry generalises the same idea across namespaces with a pluggable verifier interface and a defined path toward trustless verification.

## Source layout

```
packages/contracts/contracts/
  CanonicalRegistry.sol       — registry contract (ownership, linking, beacon)
  ClaimableEscrow.sol         — escrow implementation (initializable, behind BeaconProxy)
  IVerifier.sol               — verifier interface
  ICanonicalRegistry.sol      — registry interface (consumed by escrow)
  IWarehouse.sol              — Splits Warehouse interface
  verifiers/
    VerifierOracle.sol        — base: EIP-712 oracle-signed proofs
    VerifierGitHub.sol        — GitHub OAuth verifier
    VerifierDns.sol           — DNS TXT record verifier
```

## Status

Research and concept stage. Contracts are not audited. Do not use in production.
