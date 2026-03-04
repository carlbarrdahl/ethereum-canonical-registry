// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

/// @title IClaimableEscrow
/// @notice Per-identifier escrow that holds funds until the identifier is claimed.
interface IClaimableEscrow {
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    /// @notice Withdraw all `token` balance to the registered owner.
    /// @dev    Anyone may call. Funds always go to the registrant.
    function withdraw(address token) external;
}
