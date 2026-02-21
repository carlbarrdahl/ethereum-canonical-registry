import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Production deployment (Sepolia / mainnet).
 * References existing SplitsWarehouse at address passed via parameters.
 *
 * Deploy with:
 *   pnpm hardhat ignition deploy ignition/modules/Registry.production.ts --network sepolia \
 *     --parameters ignition/parameters/sepolia.json
 */
export default buildModule("DeployModuleProduction", (m) => {
  const splitsWarehouse = m.contractAt(
    "SplitsWarehouse",
    m.getParameter<string>("splitsWarehouse"),
  );

  const admin = m.getParameter<string>("admin");
  const trustedSigner = m.getParameter<string>("trustedSigner");

  const escrowImpl = m.contract("ClaimableEscrow", [splitsWarehouse]);
  const registry = m.contract("CanonicalRegistry", [escrowImpl, admin]);

  const dnsVerifier = m.contract("DnsVerifier", [
    registry,
    trustedSigner,
    admin,
  ]);
  const gitHubVerifier = m.contract("GitHubVerifier", [
    registry,
    trustedSigner,
    admin,
  ]);

  m.call(registry, "setVerifier", ["dns", dnsVerifier]);
  m.call(registry, "setVerifier", ["github", gitHubVerifier]);

  return {
    registry,
    escrowImpl,
    splitsWarehouse,
    dnsVerifier,
    gitHubVerifier,
  };
});
