# Canonical Registry

An on-chain registry that maps off-chain identifiers to Ethereum addresses. Deployed once per chain. Any protocol can read it.

## What it stores

A mapping from `(namespace, string)` pairs to Ethereum addresses.

```
github:org/repo      → 0xAlice
dns:example.com      → 0xBob
npm:package-name     → (unclaimed)
```

The on-chain key is `keccak256(abi.encode(namespace, canonicalString))`.

## How claiming works

The entity proves they control the off-chain identifier. The registry delegates verification to a per-namespace `IVerifier` contract. Current verifiers use oracle-signed proofs (GitHub OAuth, DNS TXT records). The interface supports replacing these with ZK-based verifiers without changing the registry.

```
registry.claim("github", "org/repo", proof)
```

## Deterministic deposit addresses

Every identifier has a CREATE2-derived Ethereum address computable locally before the identifier is claimed. Funds sent to this address accumulate in an escrow proxy and become withdrawable when the entity claims.

```
Funder → token.transfer(depositAddress, amount)
         ...time passes...
Entity → registry.claim("github", "org/repo", proof)
Entity → escrow.withdrawTo(token)
```

The deposit address does not change if ownership changes or the escrow implementation is upgraded.

## Architecture

```
CanonicalRegistry          Pure identity. Maps identifiers to addresses.
                           No funds, no escrow, no opinions about distribution.

EscrowFactory              Optional companion. Deploys escrow proxies.
ClaimableEscrow            Holds funds at deterministic addresses until claimed.

IVerifier                  Per-namespace verification. Oracle now, ZK later.
```

The registry is the shared singleton. The escrow is a module built on top. Distribution protocols read `registry.ownerOf(id)` and handle funds however they choose.

## Interface

```solidity
interface ICanonicalRegistry {
    function ownerOf(bytes32 id) external view returns (address);
}
```

## Trust model

The registry contract has no privileged operators beyond verifier governance (`setVerifier`). Trust assumptions are in the verifiers: oracle verifiers trust the signing service; ZK verifiers trust the proof system.

## Status

Research prototype. Not audited.
