// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal interface for Splits Warehouse (https://docs.splits.org/core/warehouse).
interface IWarehouse {
    /// @notice Deposit tokens into the warehouse on behalf of `receiver`.
    /// @param receiver Address that will own the deposited balance.
    /// @param token    ERC-20 token address.
    /// @param amount   Amount to deposit (caller must have pre-approved the warehouse).
    function deposit(address receiver, address token, uint256 amount) external;

    /// @notice Returns the warehouse balance of `owner` for `token`.
    function balanceOf(address owner, address token) external view returns (uint256);

    /// @notice Withdraw `amount` of `token` from the warehouse to `owner`.
    ///         msg.sender must equal `owner`.
    function withdraw(address owner, address token, uint256 amount) external;
}
