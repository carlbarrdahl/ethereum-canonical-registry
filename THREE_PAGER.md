# Canonical Registry

An on-chain registry that maps off-chain identifiers — GitHub repositories, DNS domains, package names — to Ethereum addresses. Deployed once per chain. Any protocol can read it, any entity can register.

---

## The gap

Ethereum has a standard way to address humans (ENS) but no standard way to address off-chain entities. A grants protocol that wants to fund a GitHub repository, a DAO that wants to pay a domain, or a dependency tool that wants to route contributions to every package in a supply chain all face the same problem: the recipient has no Ethereum address.

Today each protocol solves this independently. Drips built a GitHub-to-address registry with an oracle that reads `FUNDING.json` from repos. Gitcoin maintains its own project registry. Any new protocol that needs to address off-chain entities either builds another bespoke registry or depends on someone else's.

The Canonical Registry is a shared primitive so they don't have to.

## What it stores

A mapping from `(namespace, string)` pairs to Ethereum addresses:

```
github:org/repo      → 0xAlice
dns:example.com      → 0xBob
npm:package-name     → (unclaimed)
```

The on-chain key is `keccak256(abi.encode(namespace, canonicalString))`. `abi.encode` (length-prefixed) prevents collisions between namespace/string pairs that share a common packed concatenation.

Normalisation — lowercase, trailing slashes, Unicode — is namespace-specific and enforced off-chain by verifiers and frontends. The contract hashes whatever strings are passed to it.

## Claiming

An entity proves they control the off-chain identifier. The registry delegates proof verification to a per-namespace `IVerifier` contract:

```solidity
interface IVerifier {
    function verify(bytes32 id, address claimant, bytes calldata proof) external returns (bool);
}
```

Current reference verifiers use an oracle model: a backend confirms ownership (GitHub OAuth, DNS TXT record) and signs an EIP-712 proof. The proof is submitted on-chain:

```
registry.claim("github", "org/repo", proof)
```

The verifier interface is designed so oracle verifiers can be replaced with ZK-based verifiers (vlayer, TLSNotary, DNSSEC) as that tooling matures, with no changes to the registry. Existing claims are unaffected when a verifier is swapped.

## Deterministic deposit addresses

Every identifier has a CREATE2-derived Ethereum address computable locally, before the identifier is claimed or the entity has ever interacted with Ethereum.

```
Funder → token.transfer(depositAddress, amount)
         ...time passes...
Entity → registry.claim("github", "org/repo", proof)
Entity → escrow.withdraw(token)
```

This is the property that makes the registry useful beyond a naming service. A protocol can fund any identifier immediately. The entity claims whenever they're ready. Funds accumulate in the interim.

The deposit address is stable: it does not change if ownership changes, and it does not change if the escrow implementation is upgraded.

## Architecture

The system is two independent layers:

**CanonicalRegistry** — pure identity. Maps identifiers to addresses. No funds, no escrow, no opinions about how money flows. One deployment per chain.

**EscrowFactory + ClaimableEscrow** — optional pre-funding module. Deploys a proxy per identifier at the deterministic deposit address. Holds accumulated funds and releases them to the registrant when claimed. Supports both direct ERC-20 transfers and Splits Warehouse deposits.

The registry does not depend on the escrow module. Protocols that only need identity resolution — "who owns this identifier?" — interact with the registry alone.

```solidity
interface ICanonicalRegistry {
    function ownerOf(bytes32 id) external view returns (address);
}
```

This is the entire read interface. A contract that needs to resolve an identifier imports this and nothing else.

## Linking

An entity that controls multiple identifiers (a GitHub repo and a DNS domain) can link them after claiming both:

```
registry.linkIds(primaryId, [aliasId1, aliasId2])
```

Linked aliases resolve to the primary's registrant transparently through `ownerOf`. Each identifier's escrow remains separate, but all withdraw to the same address.

## Comparison with existing projects

### ENS

ENS maps human-readable names to addresses. The Canonical Registry maps entity identifiers (repos, domains, packages) to addresses.

|                    | ENS                                                        | Canonical Registry                                  |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| Subject            | Humans and organisations                                   | Off-chain entities (repos, domains, packages)       |
| Registration model | Proactive — entity must register first                     | Counterfactual — address exists before registration |
| Verification       | Domain auction / registration                              | Pluggable per-namespace proofs                      |
| Pre-funding        | Not supported — name must resolve before funds can be sent | Funds can be sent to any identifier immediately     |

The two are complementary. An ENS name can resolve to a registry deposit address. For DNS domains, the ENS `DNSSECImpl` contract is the natural upgrade path for the oracle-based DNS verifier — wrapping it as an `IVerifier` would provide fully trustless DNS verification with no changes to the registry.

### Drips

Drips maps GitHub repositories to addresses and supports pre-funding. An oracle reads `FUNDING.json` from the repository and records the address on-chain.

|                       | Drips                              | Canonical Registry                              |
| --------------------- | ---------------------------------- | ----------------------------------------------- |
| Scope                 | GitHub repositories                | Any namespace (GitHub, DNS, npm, etc.)          |
| Verification          | Application-specific oracle        | Pluggable `IVerifier` — oracle now, ZK later    |
| Design                | Integrated into the Drips protocol | Standalone primitive — any protocol can read it |
| Verification standard | `FUNDING.json` in repo             | GitHub OAuth (proves admin access)              |

Drips could use the Canonical Registry as its identity layer instead of maintaining a separate resolution system. The registry's `ownerOf(id)` call replaces Drips' internal repo-to-address mapping. Identifiers claimed once in the registry are available to every protocol that reads it.

### EAS

EAS provides attestation infrastructure — schemas, revocation, indexing — but no claiming mechanism or identifier standard for off-chain entities. The current registry stores ownership in an internal mapping for simplicity. A future design could use EAS attestations as the canonical storage layer, inheriting EAS's revocation model and GraphQL indexing. The conditions for that migration are an open research question.

## Integration

**On-chain consumer.** Import `ICanonicalRegistry`. Call `ownerOf(id)`. Route funds to the returned address if claimed, or to the deposit address if not.

**Distribution protocol.** Resolve identifiers to addresses in the frontend at allocation creation time. Store plain Ethereum addresses. No registry interaction at distribution time.

**Registrant.** Obtain a proof from the signing service, call `claim`, then `withdraw` to sweep accumulated funds.

## Trust model

The registry contract has no privileged operators beyond verifier governance (`setVerifier`). It holds no funds.

Oracle verifiers trust the backend signing service. A compromised key allows claiming unclaimed identifiers until rotated. The signing key is rotatable without affecting the registry or existing claims.

ZK verifiers remove the trust assumption entirely. The migration path is to deploy a new `IVerifier` and call `setVerifier`. No other contract changes.

The escrow module has its own trust surface: the `EscrowFactory` admin can upgrade the escrow implementation for all proxies via the beacon. This is independent of the registry admin.

## Status

Research prototype. The reference implementation includes the registry contract, oracle verifiers for GitHub and DNS, the pre-funding module, a TypeScript SDK, and backend signing services. Not audited.
