// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OracleVerifier} from "./VerifierOracle.sol";

/// @notice Verifies DNS domain ownership via a trusted backend signer.
///         The backend confirms a TXT record at _eth-canonical.<domain>
///         matches the claimant's address before signing.
///
///         To upgrade to trustless DNSSEC verification, deploy a new IVerifier
///         that wraps ENS's DNSSECImpl and replace this via registry.setVerifier().
contract DnsVerifier is OracleVerifier {
    constructor(address registry_, address trustedSigner_, address admin)
        OracleVerifier(registry_, trustedSigner_, admin) {}
}
