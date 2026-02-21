// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OracleVerifier} from "./VerifierOracle.sol";

/// @notice Verifies GitHub repository ownership via a trusted backend signer.
///         The backend confirms admin access via GitHub OAuth before signing.
contract GitHubVerifier is OracleVerifier {
    constructor(address registry_, address trustedSigner_, address admin)
        OracleVerifier(registry_, trustedSigner_, admin) {}
}
