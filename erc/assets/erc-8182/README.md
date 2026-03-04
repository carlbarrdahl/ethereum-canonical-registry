# ERC-8182: Off-Chain Entity Registry — Reference Implementation

Minimal, self-contained reference implementation of the Off-Chain Entity Registry standard.

## Contracts

| File | Description |
|------|-------------|
| `IOffChainEntityRegistry.sol` | Standard interface |
| `IVerifier.sol` | Verifier interface |
| `OffChainEntityRegistry.sol` | Minimal registry implementation |
| `OracleVerifier.sol` | Example EIP-712 oracle verifier |

## Notes

- This implementation uses a simple `admin` address for access control. Production deployments should use a more robust governance mechanism.
- The `OracleVerifier` is one possible verifier implementation. The standard supports any verification mechanism (ZK proofs, DNSSEC, etc.) through the `IVerifier` interface.
- This implementation does not include escrow functionality. See [ERC-8183](../../erc-8183-claimable-escrow.md) for the companion pre-funding standard.
