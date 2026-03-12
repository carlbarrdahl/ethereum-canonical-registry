import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import TestTokensModule from "./TestTokens.js";

/**
 * Sepolia deployment — production infrastructure with test tokens.
 *
 * Deploy with:
 *   pnpm hardhat ignition deploy ignition/modules/Registry.sepolia.ts --network sepolia \
 *     --parameters ignition/parameters/sepolia.json
 */
export default buildModule("DeployModule", (m) => {
  const admin = m.getParameter<string>("admin");
  const trustedSigner = m.getParameter<string>("trustedSigner");

  const accountImpl = m.contract("IdentityAccount", []);
  const registry = m.contract("EntityRegistry", [accountImpl, admin]);

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
