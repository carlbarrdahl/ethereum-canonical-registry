// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {IEscrowFactory} from "./IEscrowFactory.sol";
import {ClaimableEscrow} from "./ClaimableEscrow.sol";

/// @title EscrowFactory — Reference Implementation
/// @notice Deploys one minimal proxy per identifier at a deterministic address.
///         Uses a simple CREATE2 clone pattern. Production implementations may
///         use BeaconProxy for upgradeability.
contract EscrowFactory is IEscrowFactory {
    address public immutable registry;
    address public immutable implementation;

    constructor(address registry_) {
        registry = registry_;
        implementation = address(new ClaimableEscrow());
    }

    function predictAddress(bytes32 id) public view returns (address) {
        bytes32 initCodeHash = keccak256(_creationCode(id));
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff), address(this), id, initCodeHash
        )))));
    }

    function deployEscrow(bytes32 id) external returns (address escrow) {
        require(predictAddress(id).code.length == 0, "already deployed");
        bytes memory code = _creationCode(id);
        assembly {
            escrow := create2(0, add(code, 0x20), mload(code), id)
        }
        require(escrow != address(0), "deploy failed");

        ClaimableEscrow(escrow).initialize(registry, id);
        emit EscrowDeployed(id, escrow);
    }

    /// @dev Minimal clone creation code that deploys a proxy delegating to `implementation`.
    ///      Uses EIP-1167 minimal proxy pattern.
    function _creationCode(bytes32) private view returns (bytes memory) {
        address impl = implementation;
        return abi.encodePacked(
            // EIP-1167 minimal proxy creation code
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            impl,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
}
