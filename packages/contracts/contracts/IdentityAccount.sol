// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ICanonicalRegistry} from "./ICanonicalRegistry.sol";

/// @title  IdentityAccount (Implementation)
/// @notice One proxy is deployed (via CREATE2 + BeaconProxy) per canonical identifier.
///         The proxy address is deterministic, so funders can deposit before the
///         identifier is claimed — by transferring ERC-20 or ETH directly.
///         Once claimed, the registered owner can call `execute` to interact with
///         any contract through this account.
///
/// @dev    Deployed behind a BeaconProxy by CanonicalRegistry.
///         The beacon can be upgraded to add functionality without changing any proxy address.
contract IdentityAccount is Initializable {
    ICanonicalRegistry public registry;
    bytes32 public id;

    constructor() {
        _disableInitializers();
    }

    function initialize(address registry_, bytes32 id_) external initializer {
        registry = ICanonicalRegistry(registry_);
        id = id_;
    }

    /// @notice Execute an arbitrary call through this account.
    ///         Only the registered owner of the identifier can call this.
    /// @param target  The contract to call.
    /// @param data    The calldata to send.
    /// @param value   The ETH value to forward.
    function execute(address target, bytes calldata data, uint256 value)
        external
        returns (bytes memory)
    {
        require(registry.ownerOf(id) == msg.sender, "IdentityAccount: not owner");
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "IdentityAccount: call failed");
        return result;
    }

    receive() external payable {}
}
