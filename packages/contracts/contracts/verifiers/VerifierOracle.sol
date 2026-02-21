// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import {IVerifier} from "../IVerifier.sol";

/// @title  OracleVerifier
/// @notice Base verifier for oracle-signed ownership proofs using EIP-712 typed data.
///         A trusted backend signs {id, claimant, expiry} after confirming off-chain
///         ownership (GitHub OAuth, DNS TXT record, etc.).
///
/// @dev    The EIP-712 domain binds proofs to a specific registry address and chain,
///         preventing both cross-deployment and cross-chain replay.
abstract contract OracleVerifier is IVerifier, Ownable {
    address public immutable registry;
    address public trustedSigner;

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant NAME_HASH = keccak256("CanonicalRegistry");
    bytes32 private constant VERSION_HASH = keccak256("1");

    bytes32 public constant OWNERSHIP_PROOF_TYPEHASH = keccak256(
        "OwnershipProof(bytes32 id,address claimant,uint256 expiry)"
    );

    event TrustedSignerUpdated(address indexed previous, address indexed next);

    constructor(address registry_, address trustedSigner_, address admin) Ownable(admin) {
        registry = registry_;
        trustedSigner = trustedSigner_;
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            NAME_HASH,
            VERSION_HASH,
            block.chainid,
            registry
        ));
    }

    /// @inheritdoc IVerifier
    /// @param proof ABI-encoded (bytes signature, uint256 expiry)
    function verify(bytes32 id, address claimant, bytes calldata proof) external view returns (bool) {
        (bytes memory signature, uint256 expiry) = abi.decode(proof, (bytes, uint256));

        require(block.timestamp < expiry, "OracleVerifier: proof expired");

        bytes32 structHash = keccak256(abi.encode(OWNERSHIP_PROOF_TYPEHASH, id, claimant, expiry));
        bytes32 digest = MessageHashUtils.toTypedDataHash(_domainSeparator(), structHash);
        address recovered = ECDSA.recover(digest, signature);

        return recovered == trustedSigner;
    }

    /// @notice Rotate the trusted signer key (e.g. after key compromise).
    function setTrustedSigner(address signer) external onlyOwner {
        emit TrustedSignerUpdated(trustedSigner, signer);
        trustedSigner = signer;
    }
}
