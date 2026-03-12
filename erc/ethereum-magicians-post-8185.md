# Ethereum Magicians Discussion Post — ERC-8185

> **Title**: ERC-8185: Off-Chain Entity Registry
>
> **Category**: ERCs
>
> **Tags**: identity, registry, agents, off-chain

---

## ERC-8185: Off-Chain Entity Registry

Protocols and AI agents need to resolve off-chain identifiers — GitHub repos, DNS domains, npm packages — to Ethereum addresses. Any agent, any framework, one `ownerOf` call. No standard for this exists.

ERC-8185 defines a standard interface for mapping `(namespace, string)` pairs to Ethereum addresses. Identifiers are hashed to `bytes32`. Ownership is proven through per-namespace verifier contracts (`IVerifier`), enabling a migration path from oracle-signed proofs to ZK verification without changes to the registry.

### Why This Is Needed

Every protocol that needs to address off-chain entities builds its own resolution system — Drips has an oracle for GitHub repos, Gitcoin maintains a project registry, and so on. As AI agents become common consumers of on-chain infrastructure, this fragmentation becomes untenable. Agents need a shared, permissionless lookup they can call on-chain without API keys, without trusted backends, and without requiring the entity to have pre-registered.

### Design

- **Pluggable verification**: `IVerifier` is a single function — `verify(id, claimant, proof) → bool`. Supports oracle-signed proofs today, zkTLS/DNSSEC tomorrow, no registry changes needed.
- **No transfer function**: Changing a registrant requires revoke + re-claim with a new proof. Ownership is always tied to verified control.
- **Single-level aliases**: An entity that controls multiple identifiers (a GitHub repo and a DNS domain) can link them with O(1) resolution.

### Companion ERC

[ERC-8186: Identity Account](https://ethereum-magicians.org/t/erc-8185-off-chain-entity-registry-erc-8186-claimable-escrow/27899) defines deterministic smart accounts (CREATE2) for every identifier, so they can receive funds before the entity has registered. Once claimed, the owner controls the account via a single `execute(target, data, value)` function — no hardcoded withdrawal logic, just a lightweight smart account owned by whoever controls the off-chain identity. It depends on ERC-8185 for ownership resolution but is architecturally independent.

### Reference

- Minimal reference contracts: included in the ERC `assets/erc-8185/` directory
- Full implementation (not audited): [ethereum-entity-registry](https://github.com/carlbarrdahl/ethereum-entity-registry)

Feedback welcome — particularly on the verifier interface design and any overlapping ERCs I've missed.
