import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import TestTokensModule from "./TestTokens.js";

/**
 * Local development: deploys SplitsWarehouse, ClaimableEscrow (impl),
 * CanonicalRegistry, DnsVerifier, GitHubVerifier, and test tokens.
 *
 * For Sepolia use Registry.sepolia.ts with --parameters.
 * For mainnet use Registry.production.ts with --parameters.
 */
export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  const splitsWarehouse = m.contract("SplitsWarehouse", [
    "Splits Warehouse",
    "SPW",
  ]);

  // Deploy escrow implementation (warehouse is immutable in impl constructor)
  const escrowImpl = m.contract("ClaimableEscrow", [splitsWarehouse]);

  // Deploy registry with escrow impl and deployer as admin
  const registry = m.contract("CanonicalRegistry", [escrowImpl, deployer]);

  // Deploy verifiers (registry, trustedSigner=deployer, admin=deployer)
  const dnsVerifier = m.contract("DnsVerifier", [
    registry,
    deployer,
    deployer,
  ]);
  const gitHubVerifier = m.contract("GitHubVerifier", [
    registry,
    deployer,
    deployer,
  ]);

  // Register verifiers on the registry
  m.call(registry, "setVerifier", ["dns", dnsVerifier]);
  m.call(registry, "setVerifier", ["github", gitHubVerifier]);

  // Deploy test tokens
  const testTokensModule = m.useModule(TestTokensModule);

  return {
    registry,
    escrowImpl,
    splitsWarehouse,
    dnsVerifier,
    gitHubVerifier,
    ...testTokensModule,
  };
});
