// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {IClaimableEscrow} from "./IClaimableEscrow.sol";

/// @title ClaimableEscrow — Reference Implementation
/// @notice Minimal escrow that holds ERC-20 tokens and releases them to the
///         registered owner of an identifier. Deployed as a BeaconProxy by
///         the EscrowFactory.
contract ClaimableEscrow is IClaimableEscrow {
    address public registry;
    bytes32 public id;
    bool private _initialized;

    function initialize(address registry_, bytes32 id_) external {
        require(!_initialized, "already initialized");
        _initialized = true;
        registry = registry_;
        id = id_;
    }

    function withdraw(address token) external {
        // Resolve owner through the registry (follows aliases).
        (bool ok, bytes memory data) = registry.staticcall(
            abi.encodeWithSignature("ownerOf(bytes32)", id)
        );
        require(ok, "registry call failed");
        address owner = abi.decode(data, (address));
        require(owner != address(0), "not yet claimed");

        uint256 balance = _balanceOf(token, address(this));
        require(balance > 0, "nothing to withdraw");

        _transfer(token, owner, balance);
        emit Withdrawn(token, owner, balance);
    }

    function _balanceOf(address token, address account) private view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );
        require(ok, "balanceOf failed");
        return abi.decode(data, (uint256));
    }

    function _transfer(address token, address to, uint256 amount) private {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
    }
}
