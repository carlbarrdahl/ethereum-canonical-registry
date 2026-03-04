# ERC-YYYY: Claimable Escrow — Reference Implementation

Minimal, self-contained reference implementation of the Claimable Escrow standard.

## Contracts

| File | Description |
|------|-------------|
| `IEscrowFactory.sol` | Factory interface |
| `IClaimableEscrow.sol` | Escrow interface |
| `EscrowFactory.sol` | Minimal factory using EIP-1167 clones |
| `ClaimableEscrow.sol` | Minimal escrow (ERC-20 only) |

## Notes

- This implementation uses EIP-1167 minimal proxies for simplicity. Production deployments may use BeaconProxy for upgradeability (as in the [full implementation](https://github.com/carlbarrdahl/ethereum-canonical-registry)).
- Only ERC-20 tokens are supported. The full implementation additionally supports Splits Warehouse deposits.
- No external dependencies — all ERC-20 interaction is done via low-level calls.
- The factory can be embedded into the registry contract or deployed standalone.
