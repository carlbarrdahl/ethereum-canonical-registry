// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Implemented by each namespace-specific ownership verifier (e.g. zkTLS for GitHub, DNSSEC for DNS).
interface IVerifier {
    /// @param id      The bytes32 identifier being claimed.
    /// @param claimant The address asserting ownership.
    /// @param proof   Encoded proof data (ZK proof, oracle signature, etc.).
    /// @return True if the proof is valid and claimant owns the identifier.
    function verify(bytes32 id, address claimant, bytes calldata proof) external returns (bool);
}
