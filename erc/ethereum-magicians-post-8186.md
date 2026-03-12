# Ethereum Magicians Discussion Post — ERC-8186

> **Title**: ERC-8186: Identity Account
>
> **Category**: ERCs
>
> **Tags**: identity, account, funding, off-chain, agents, CREATE2

---

## ERC-8186: Identity Account

A companion to [ERC-8185: Off-Chain Entity Registry](https://ethereum-magicians.org/t/erc-8185-off-chain-entity-registry-erc-8186-claimable-escrow/27899).

ERC-8185 maps off-chain identifiers to Ethereum addresses, but only after the entity has registered. The most compelling use cases — an AI agent funding every dependency in a project, a grants protocol allocating to unclaimed repos — require sending value *before* the entity has engaged with Ethereum.

ERC-8186 defines deterministic smart accounts for every identifier. The address is a pure function of the identifier and the factory (CREATE2), computable locally without an on-chain call. Funds accumulate at the address. Once the entity registers, they control the account.

### Design

- **Deterministic addressing**: `predictAddress(id)` returns the account address. Stable across implementation upgrades.
- **Owner-gated execution**: The registered owner calls `execute(target, data, value)` to make any call through the account — withdraw tokens, interact with DeFi, claim airdrops, pull from a Splits Warehouse, or anything else.
- **No hardcoded `withdraw`**: Earlier drafts had a permissionless `withdraw(token)` function. We replaced it with `execute` because a fixed withdrawal interface requires protocol-level upgrades every time a new integration pattern emerges. `execute` delegates that flexibility to the owner — the account becomes a lightweight smart account owned by whoever controls the off-chain identity.
- **Native ETH**: Implementations SHOULD support ETH via `receive()`.

### What changed from the earlier draft

The original ERC-8186 ("Claimable Escrow") defined a `withdraw(token)` function that anyone could call, with funds always going to the registrant. This was simple but limiting — it only handled ERC-20 token withdrawal and required beacon upgrades for any new functionality.

The new design replaces the entire escrow concept with a single `execute` function:

```solidity
interface IIdentityAccount {
    function execute(address target, bytes calldata data, uint256 value)
        external returns (bytes memory);
}
```

This is strictly more capable: the owner can encode an ERC-20 `transfer`, a Splits Warehouse `withdraw`, a vesting contract `claim`, or any other call. The trade-off is that withdrawal is no longer permissionless — only the registered owner can act — but in practice the owner will always be the one initiating withdrawals.

### Reference

- Minimal reference contracts: included in the ERC `assets/erc-8186/` directory
- Full implementation (not audited): [ethereum-entity-registry](https://github.com/carlbarrdahl/ethereum-entity-registry)

Feedback welcome — particularly on the `execute` interface and whether reentrancy guards should be REQUIRED vs RECOMMENDED.
