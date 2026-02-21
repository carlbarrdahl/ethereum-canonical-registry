# Canonical Registry — Specification (EARS Notation)

This specification uses EARS (Easy Approach to Requirements Syntax) notation.
Each requirement follows one of these templates:

- **Ubiquitous**: The \<system name\> shall \<system response\>.
- **Event-driven**: When \<trigger\>, the \<system name\> shall \<system response\>.
- **State-driven**: While \<state\>, the \<system name\> shall \<system response\>.
- **Conditional**: Where \<optional feature\>, the \<system name\> shall \<system response\>.
- **Unwanted behaviour**: If \<unwanted condition\>, then the \<system name\> shall \<system response\>.

---

## 1. Identifier Derivation

**CR-ID-01** The registry shall derive an identifier `id` from a `(namespace, canonicalString)` pair as `keccak256(abi.encode(namespace, canonicalString))`.

**CR-ID-02** The registry shall use `abi.encode` (not `abi.encodePacked`) to prevent identifier collisions between namespace/string pairs that share a common packed concatenation.

---

## 2. Deterministic Deposit Addresses

**CR-ADDR-01** The registry shall assign every identifier a deterministic Ethereum address, derivable by anyone without making an on-chain call.

**CR-ADDR-02** The registry shall compute deposit addresses via CREATE2 using the identifier as the salt and the BeaconProxy initcode as the creation code.

**CR-ADDR-03** The deposit address shall be stable across escrow implementation upgrades. Only the delegated logic shall change; the proxy address shall remain fixed.

---

## 3. Claiming

**CR-CLAIM-01** When a claimant submits a valid proof for an unclaimed identifier, the registry shall record `owners[id] = msg.sender`.

**CR-CLAIM-02** If an identifier is already claimed, then the registry shall revert the claim transaction.

**CR-CLAIM-03** If no verifier is registered for the requested namespace, then the registry shall revert the claim transaction.

**CR-CLAIM-04** If the submitted proof is invalid (wrong signer, expired, wrong claimant), then the registry shall revert the claim transaction.

**CR-CLAIM-05** If the identifier is an alias, then the registry shall revert the claim transaction.

---

## 4. Escrow Deployment

**CR-ESCROW-01** When an identifier's escrow has not yet been deployed, any caller may deploy it by calling `deployEscrow(id)`.

**CR-ESCROW-02** If the escrow for an identifier has already been deployed, then `deployEscrow` shall revert.

**CR-ESCROW-03** The registry shall deploy each escrow as a `BeaconProxy` pointing to the `UpgradeableBeacon` owned by the registry.

---

## 5. Escrow Withdrawals

**CR-WITH-01** When `withdrawTo(token)` is called on a `ClaimableEscrow`, the escrow shall transfer all `token` balance to the current registered owner of its identifier.

**CR-WITH-02** If the identifier is not yet claimed, then `withdrawTo` shall revert.

**CR-WITH-03** If the total balance of `token` (after pulling from the Splits Warehouse) is zero, then `withdrawTo` shall revert.

**CR-WITH-04** When the escrow has a non-trivial Splits Warehouse internal balance for `token`, the escrow shall call `warehouse.withdraw` before transferring to the owner.

**CR-WITH-05** The registry shall allow anyone to call `withdrawTo` — the caller need not be the owner.

---

## 6. Revocation

**CR-REV-01** When an identifier owner calls `revoke(id)`, the registry shall delete `owners[id]`, returning the identifier to unclaimed state.

**CR-REV-02** If `revoke` is called on an identifier that is an alias, then the registry shall revert.

**CR-REV-03** If `revoke` is called by an address that is not the current owner, then the registry shall revert.

---

## 7. Alias Linking

**CR-LINK-01** When an owner calls `linkIds(aliasId, canonicalId)` and owns both identifiers, the registry shall set `aliases[aliasId] = canonicalId`.

**CR-LINK-02** While an identifier has an alias link, `ownerOf(aliasId)` shall return the owner of the canonical identifier.

**CR-LINK-03** If `canonicalId` is itself an alias, then `linkIds` shall revert.

**CR-LINK-04** When an owner calls `unlinkIds(aliasId)`, the registry shall delete `aliases[aliasId]`.

---

## 8. Verification

**CR-VER-01** The registry shall delegate ownership verification to a verifier contract registered for the relevant namespace.

**CR-VER-02** The registry owner shall be able to register, replace, or remove a verifier for any namespace via `setVerifier`.

**CR-VER-03** An oracle verifier shall reject a proof where `block.timestamp >= expiry`.

**CR-VER-04** An oracle verifier shall reject a proof where the recovered signer does not match `trustedSigner`.

**CR-VER-05** An oracle verifier shall reject a proof where the message hash does not bind to the correct `(registryAddress, id, claimant, expiry)` tuple.

**CR-VER-06** The registry owner shall be able to rotate the trusted signer on any oracle verifier via `setTrustedSigner`.

---

## 9. Escrow Upgradeability

**CR-UPG-01** The registry shall own an `UpgradeableBeacon` to which all `ClaimableEscrow` proxies delegate.

**CR-UPG-02** Only the registry owner shall be able to upgrade the escrow implementation via `upgradeEscrow(newImpl)`.

**CR-UPG-03** After an upgrade, all existing escrow proxy addresses shall remain unchanged.

---

## 10. Ownership Resolution

**CR-OWN-01** `ownerOf(id)` shall follow at most one level of alias indirection.

**CR-OWN-02** `ownerOf(id)` shall return `address(0)` for unclaimed identifiers.
