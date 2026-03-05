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

## [erc-8186/](./erc-8186/) — Claimable Escrow

Deterministic deposit addresses (CREATE2) for pre-funding identifiers before they are claimed.

| File | Lines | Role |
|------|-------|------|
| `IEscrowFactory.sol` | ~16 | Factory interface |
| `IClaimableEscrow.sol` | ~13 | Escrow interface |
| `EscrowFactory.sol` | ~51 | Factory using EIP-1167 clones |
| `ClaimableEscrow.sol` | ~53 | Escrow (ERC-20 only) |

## Relationship

ERC-8186 depends on ERC-8185 — the escrow calls `ownerOf(bytes32)` on the registry to determine where to send funds. The registry has no dependency on the escrow.

## Production Implementation

A full implementation with BeaconProxy upgradeability, Splits Warehouse integration, namespace-specific verifiers, a TypeScript SDK, and backend signing services is at [ethereum-canonical-registry](https://github.com/carlbarrdahl/ethereum-canonical-registry).
