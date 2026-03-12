# Ethereum Magicians Discussion Post

> **Title**: ERC-XXXX: Off-Chain Entity Registry + ERC-YYYY: Identity Account
>
> **Category**: ERCs
>
> **Tags**: identity, registry, account, funding, off-chain, agents

---

## ERC-XXXX: Off-Chain Entity Registry / ERC-YYYY: Identity Account

Protocols and AI agents need to resolve off-chain identifiers — GitHub repos, DNS domains, npm packages — to Ethereum addresses. Any agent, any framework, one `ownerOf` call. No standard for this exists.

I'm proposing two companion ERCs:

**ERC-XXXX: Off-Chain Entity Registry** — maps `(namespace, string)` pairs to Ethereum addresses. Ownership proven through pluggable verifier contracts (oracle today, ZK tomorrow). One `ownerOf(bytes32)` call resolves any identifier.

**ERC-YYYY: Identity Account** — deterministic smart accounts (CREATE2) for every identifier. Fund `github:org/repo` before anyone has registered. Once claimed, the owner can execute arbitrary calls through the account — withdraw tokens, interact with DeFi, claim airdrops. Address is stable across upgrades.

The two are architecturally independent. The registry holds no funds. The account is optional.

### Why Now

Every protocol that needs to address off-chain entities builds its own resolution system (Drips, Octant, Optimism, etc.). As AI agents become common consumers of on-chain infrastructure, this fragmentation becomes untenable — agents need a shared, permissionless lookup they can call without API keys or trusted backends.

### Key Design Decisions

- **Pluggable verification**: `IVerifier` is a single function — `verify(id, claimant, proof) → bool`. Supports oracle-signed proofs today, zkTLS/DNSSEC tomorrow, no registry changes needed.
- **Deterministic pre-funding**: Every identifier has a computable account address before registration. Agents and protocols can send funds immediately.
- **`execute` over `withdraw`**: The identity account has a single `execute(target, data, value)` function gated to the registered owner. No protocol-level upgrades needed when new integration patterns emerge — the owner encodes whatever call they need.
- **No transfer function**: Changing a registrant requires revoke + re-claim with a new proof. Ownership is always tied to verified control.

### Open Questions

1. **EAS integration** — Should the ownership mapping eventually be stored as EAS attestations for composability?
2. **ERC-165** — Should the interfaces require `supportsInterface`?
3. **Normalization** — Recommended canonicalization per namespace, or entirely off-chain?

### Reference

- Minimal reference contracts: included in the ERC `assets/` directories
- Full implementation (not audited): https://github.com/carlbarrdahl/ethereum-entity-registry

Feedback welcome — particularly on the two-ERC split, the verifier interface, and any overlapping ERCs I've missed.
