// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

/// @title IEscrowFactory
/// @notice Deploys deterministic escrow proxies for identifier-based pre-funding.
interface IEscrowFactory {
    event EscrowDeployed(bytes32 indexed id, address escrow);

    /// @notice Returns the deterministic deposit address for `id`.
    ///         Pure computation — the address must not change on implementation upgrade.
    function predictAddress(bytes32 id) external view returns (address);

    /// @notice Deploys the escrow proxy for `id`. Reverts if already deployed.
    function deployEscrow(bytes32 id) external returns (address escrow);
}
