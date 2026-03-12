# Reference Implementations

Minimal, self-contained Solidity contracts for the companion ERC-8185 and ERC-8186 standards. No external dependencies.

## [erc-8185/](./erc-8185/) — Off-Chain Entity Registry

Maps off-chain entity identifiers (GitHub repos, DNS domains, npm packages) to Ethereum addresses through pluggable verification.

| File | Lines | Role |
|------|-------|------|
| `IOffChainEntityRegistry.sol` | ~25 | Standard interface |
| `IVerifier.sol` | ~14 | Verifier interface |
| `OffChainEntityRegistry.sol` | ~115 | Minimal registry (claim, revoke, link, unlink) |
| `OracleVerifier.sol` | ~59 | Example EIP-712 oracle verifier |

## [erc-8186/](./erc-8186/) — Identity Account

Deterministic smart accounts (CREATE2) for on-chain identities with arbitrary execution.

| File | Lines | Role |
|------|-------|------|
| `IAccountFactory.sol` | ~16 | Factory interface |
| `IIdentityAccount.sol` | ~17 | Account interface |
| `AccountFactory.sol` | ~51 | Factory using EIP-1167 clones |
| `IdentityAccount.sol` | ~40 | Account with `execute` + `receive` |

## Relationship

ERC-8186 depends on ERC-8185 — the account calls `ownerOf(bytes32)` on the registry to determine who can execute calls. The registry has no dependency on the account.

## Production Implementation

A full implementation with BeaconProxy upgradeability, namespace-specific verifiers, a TypeScript SDK, and backend signing services is at [ethereum-entity-registry](https://github.com/carlbarrdahl/ethereum-entity-registry).
