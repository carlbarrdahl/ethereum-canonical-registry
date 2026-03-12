import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import TestTokensModule from "./TestTokens.js";

/**
 * Local development: deploys IdentityAccount (impl), EntityRegistry,
 * DnsVerifier, GitHubVerifier, and test tokens.
 *
 * For Sepolia use Registry.sepolia.ts with --parameters.
 * For mainnet use Registry.production.ts with --parameters.
 */
export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  const accountImpl = m.contract("IdentityAccount", []);
  const registry = m.contract("EntityRegistry", [accountImpl, deployer]);

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

  m.call(registry, "setVerifier", ["dns", dnsVerifier], { id: "SetDnsVerifier" });
  m.call(registry, "setVerifier", ["github", gitHubVerifier], { id: "SetGitHubVerifier" });

  const testTokensModule = m.useModule(TestTokensModule);

  return {
    registry,
    accountImpl,
    dnsVerifier,
    gitHubVerifier,
    ...testTokensModule,
  };
});
