// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal interface consumed by ClaimableEscrow to resolve the registered owner.
interface ICanonicalRegistry {
    /// @return The owner of `id` resolving through any alias, or address(0) if unclaimed.
    function ownerOf(bytes32 id) external view returns (address);
}
