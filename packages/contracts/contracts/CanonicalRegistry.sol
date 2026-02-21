// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import {IVerifier} from "./IVerifier.sol";
import {ICanonicalRegistry} from "./ICanonicalRegistry.sol";
import {ClaimableEscrow} from "./ClaimableEscrow.sol";

/// @title  CanonicalRegistry
/// @notice Maps off-chain identifiers (GitHub repos, DNS domains) to Ethereum addresses.
///
/// @dev    This contract handles ownership claims only — it holds no funds.
///         Each identifier has a deterministic Ethereum address (via CREATE2).
///         The escrow implementation behind the beacon determines how funds are
///         held and released.
///
///         Identifier format:
///           bytes32 id = keccak256(abi.encode(namespace, canonicalString))
///           e.g. keccak256(abi.encode("github", "org/repo"))
///                keccak256(abi.encode("dns",    "example.com"))
///
///         Canonicalization rules are namespace-specific and enforced off-chain
///         by verifiers and frontends, not by this contract.
contract CanonicalRegistry is ICanonicalRegistry, Ownable {

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    UpgradeableBeacon public immutable beacon;

    /// @notice keccak256(bytes(namespace)) => verifier contract address
    mapping(bytes32 => address) public verifiers;

    /// @notice identifier => registered owner address (zero = unclaimed or is an alias)
    mapping(bytes32 => address) public owners;

    /// @notice identifier => canonical identifier (zero = not an alias)
    ///         Aliases are set via linkIds(). Only one level of indirection is allowed.
    mapping(bytes32 => bytes32) public aliases;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Claimed(bytes32 indexed id, string namespace, string canonicalString, address indexed owner);
    event Revoked(bytes32 indexed id, string namespace, string canonicalString, address indexed previousOwner);
    event Linked(bytes32 indexed aliasId, bytes32 indexed primaryId);
    event Unlinked(bytes32 indexed aliasId, bytes32 indexed primaryId);
    event EscrowDeployed(bytes32 indexed id, address escrow);
    event VerifierUpdated(bytes32 indexed namespaceKey, address verifier);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address escrowImpl_, address admin) Ownable(admin) {
        beacon = new UpgradeableBeacon(escrowImpl_, address(this));
    }

    // -------------------------------------------------------------------------
    // Identifier helpers
    // -------------------------------------------------------------------------

    /// @notice Computes the canonical identifier for a (namespace, canonicalString) pair.
    /// @dev    Uses abi.encode (length-prefixed) instead of abi.encodePacked to prevent
    ///         collisions between different namespace/string pairs that share a common
    ///         concatenation (e.g. "githu" + "borg/repo" vs "github" + "org/repo").
    function toId(string calldata namespace, string calldata canonicalString) public pure returns (bytes32) {
        return keccak256(abi.encode(namespace, canonicalString));
    }

    /// @notice Resolves an identifier to its canonical form, following one alias hop if present.
    function canonicalOf(bytes32 id) public view returns (bytes32) {
        bytes32 primary = aliases[id];
        return primary == bytes32(0) ? id : primary;
    }

    /// @notice Returns the owner of `id`, resolving through any alias.
    function ownerOf(bytes32 id) public view returns (address) {
        return owners[canonicalOf(id)];
    }

    // -------------------------------------------------------------------------
    // CREATE2 escrow helpers (BeaconProxy)
    // -------------------------------------------------------------------------

    /// @dev Builds the BeaconProxy constructor args for a given identifier.
    function _escrowInitData(bytes32 id) internal view returns (bytes memory) {
        return abi.encodeCall(ClaimableEscrow.initialize, (address(this), id));
    }

    /// @notice Returns the deterministic address for the ClaimableEscrow proxy of `id`.
    ///         This address is stable and can be computed by any frontend before
    ///         the escrow is deployed, so funders can transfer tokens directly to it.
    ///         The address does NOT change if the escrow implementation is upgraded
    ///         via the beacon — only the proxy bytecode and constructor args matter.
    function predictAddress(bytes32 id) public view returns (address) {
        bytes32 initcodeHash = keccak256(abi.encodePacked(
            type(BeaconProxy).creationCode,
            abi.encode(address(beacon), _escrowInitData(id))
        ));
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            id,
            initcodeHash
        )))));
    }

    /// @notice Deploys the ClaimableEscrow proxy for `id` if it has not been deployed yet.
    ///         Anyone may call this. The escrow is not required to exist for funding;
    ///         it only needs to be deployed before the owner withdraws.
    function deployEscrow(bytes32 id) public returns (address escrow) {
        require(predictAddress(id).code.length == 0, "CanonicalRegistry: escrow already deployed");
        escrow = address(new BeaconProxy{salt: id}(address(beacon), _escrowInitData(id)));
        emit EscrowDeployed(id, escrow);
    }

    // -------------------------------------------------------------------------
    // Claims
    // -------------------------------------------------------------------------

    /// @notice Claim ownership of an identifier by submitting a valid proof.
    ///         Deploys the ClaimableEscrow if not yet deployed.
    function claim(
        string calldata namespace,
        string calldata canonicalString,
        bytes calldata proof
    ) external {
        bytes32 id = toId(namespace, canonicalString);
        require(ownerOf(id) == address(0), "CanonicalRegistry: already claimed");

        address verifier = verifiers[keccak256(bytes(namespace))];
        require(verifier != address(0), "CanonicalRegistry: no verifier for namespace");
        require(IVerifier(verifier).verify(id, msg.sender, proof), "CanonicalRegistry: invalid proof");

        // Clear a stale alias entry left by a revoked primary, so this id
        // becomes its own primary rather than inheriting the old primary's state.
        if (aliases[id] != bytes32(0)) {
            delete aliases[id];
        }

        owners[id] = msg.sender;
        emit Claimed(id, namespace, canonicalString, msg.sender);

        // Deploy escrow lazily if not yet deployed so the owner can withdraw immediately.
        if (predictAddress(id).code.length == 0) {
            deployEscrow(id);
        }
    }

    // -------------------------------------------------------------------------
    // Linking
    // -------------------------------------------------------------------------

    /// @notice Link one or more aliases to `primaryId` so all resolve to the same owner.
    ///         All identifiers must already be claimed by msg.sender.
    ///         `primaryId` must not itself be an alias (no chaining).
    ///         All-or-nothing: any invalid alias reverts the entire transaction.
    ///         Funds in each identifier's escrow remain separate; all withdraw to the same owner.
    function linkIds(bytes32 primaryId, bytes32[] calldata aliasIds) external {
        require(owners[primaryId] == msg.sender, "CanonicalRegistry: not owner of primary");
        require(aliases[primaryId] == bytes32(0), "CanonicalRegistry: primary is itself an alias");

        for (uint256 i = 0; i < aliasIds.length; i++) {
            bytes32 aliasId = aliasIds[i];
            require(aliasId != primaryId, "CanonicalRegistry: cannot link to self");
            require(owners[aliasId] == msg.sender, "CanonicalRegistry: not owner of alias");
            require(aliases[aliasId] == bytes32(0), "CanonicalRegistry: alias already linked");

            aliases[aliasId] = primaryId;
            delete owners[aliasId];

            emit Linked(aliasId, primaryId);
        }
    }

    /// @notice Unlink one or more aliases from their primary, restoring each as an
    ///         independently owned identifier under msg.sender.
    ///         Only callable by the current owner of the primary.
    ///         All-or-nothing: any invalid alias reverts the entire transaction.
    function unlinkIds(bytes32 primaryId, bytes32[] calldata aliasIds) external {
        require(owners[primaryId] == msg.sender, "CanonicalRegistry: not owner of primary");

        for (uint256 i = 0; i < aliasIds.length; i++) {
            bytes32 aliasId = aliasIds[i];
            require(aliases[aliasId] == primaryId, "CanonicalRegistry: not an alias of this primary");

            delete aliases[aliasId];
            owners[aliasId] = msg.sender;

            emit Unlinked(aliasId, primaryId);
        }
    }

    // -------------------------------------------------------------------------
    // Revocation
    // -------------------------------------------------------------------------

    /// @notice Current owner voluntarily revokes their claim, returning the identifier
    ///         to unclaimed state. Funds remain at the same escrow address
    ///         and will be claimable by whoever claims the identifier next.
    ///         If `id` is a primary with aliases pointing to it, call unlinkIds() first
    ///         to restore independent ownership to those aliases. Any aliases not unlinked
    ///         before revocation become stale (resolve to address(0)) and are automatically
    ///         cleared the next time someone claims that alias identifier.
    function revoke(
        string calldata namespace,
        string calldata canonicalString
    ) external {
        bytes32 id = toId(namespace, canonicalString);
        require(aliases[id] == bytes32(0), "CanonicalRegistry: cannot revoke an alias");
        require(owners[id] == msg.sender, "CanonicalRegistry: not owner");
        address previous = owners[id];
        delete owners[id];
        emit Revoked(id, namespace, canonicalString, previous);
    }

    // -------------------------------------------------------------------------
    // Admin — verifier management
    // -------------------------------------------------------------------------

    /// @notice Register or replace the verifier contract for a namespace.
    ///         Existing claims under the previous verifier remain valid.
    function setVerifier(string calldata namespace, address verifier) external onlyOwner {
        bytes32 key = keccak256(bytes(namespace));
        verifiers[key] = verifier;
        emit VerifierUpdated(key, verifier);
    }
}
