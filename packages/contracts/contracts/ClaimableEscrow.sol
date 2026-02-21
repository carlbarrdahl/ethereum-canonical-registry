// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IWarehouse} from "./IWarehouse.sol";
import {ICanonicalRegistry} from "./ICanonicalRegistry.sol";

/// @title  ClaimableEscrow (Implementation)
/// @notice One proxy is deployed (via CREATE2 + BeaconProxy) per canonical identifier.
///         The proxy address is deterministic, so funders can deposit before the
///         identifier is claimed — either by transferring ERC-20 directly to this
///         address, or via the Splits Warehouse using this address as the recipient.
///         Once claimed, the registered owner calls `withdrawTo` to pull funds out.
///
/// @dev    Deployed behind a BeaconProxy by CanonicalRegistry.
///         The warehouse address is set as immutable in the implementation constructor
///         and shared by all proxies. The canonical Splits Warehouse for the chain
///         should be passed when deploying the implementation.
///         The beacon can be upgraded to fix bugs without changing any proxy address.
contract ClaimableEscrow is Initializable {
    using SafeERC20 for IERC20;

    /// @notice Canonical Splits Warehouse for this chain. Set once at implementation deploy time.
    IWarehouse public immutable warehouse;

    ICanonicalRegistry public registry;
    bytes32 public id;

    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    /// @param warehouse_ Canonical Splits Warehouse address for this chain.
    constructor(address warehouse_) {
        warehouse = IWarehouse(warehouse_);
        _disableInitializers();
    }

    function initialize(address registry_, bytes32 id_) external initializer {
        registry = ICanonicalRegistry(registry_);
        id = id_;
    }

    /// @notice Withdraw all funds held for this identifier to the registered owner.
    ///         Handles both Splits Warehouse balances (from warehouse.deposit / batchDeposit)
    ///         and direct ERC-20 transfers to this address.
    ///         Anyone may call; funds always go to the address registered in the registry.
    /// @param token ERC-20 token address to withdraw.
    function withdrawTo(address token) external {
        address owner = registry.ownerOf(id);
        require(owner != address(0), "ClaimableEscrow: not yet claimed");

        // Pull any Splits Warehouse balance to this contract first.
        uint256 warehouseAmount = warehouse.balanceOf(address(this), token);
        if (warehouseAmount > 0) {
            warehouse.withdraw(address(this), token, warehouseAmount);
        }

        // Transfer full own balance — covers warehouse withdrawal + any direct transfers.
        uint256 total = IERC20(token).balanceOf(address(this));
        require(total > 0, "ClaimableEscrow: nothing to withdraw");
        IERC20(token).safeTransfer(owner, total);

        emit Withdrawn(token, owner, total);
    }
}
