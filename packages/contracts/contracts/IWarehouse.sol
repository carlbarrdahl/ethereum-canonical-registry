// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal interface for Splits Warehouse (https://docs.splits.org/core/warehouse).
/// @dev    The warehouse uses ERC-6909 token IDs, where the ID of an ERC-20 token is
///         uint256(uint160(tokenAddress)). All balance/withdraw calls use this uint256 id.
interface IWarehouse {
    /// @notice Deposit tokens into the warehouse on behalf of `receiver`.
    /// @param receiver Address that will own the deposited balance.
    /// @param token    ERC-20 token address.
    /// @param amount   Amount to deposit (caller must have pre-approved the warehouse).
    function deposit(address receiver, address token, uint256 amount) external;

    /// @notice Returns the warehouse balance of `owner` for ERC-6909 token `id`.
    ///         For ERC-20 tokens, id = uint256(uint160(tokenAddress)).
    function balanceOf(address owner, uint256 id) external view returns (uint256);

    /// @notice Withdraw `amount` of ERC-6909 token `id` from the warehouse to `owner`.
    ///         msg.sender must equal `owner`.
    ///         For ERC-20 tokens, id = uint256(uint160(tokenAddress)).
    function withdraw(address owner, address token, uint256 amount) external;
}
