import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * TestTokens Module - Deploy test ERC20 tokens and ERC-4626 vaults
 * 
 * Deploys standard test tokens (USDC, WETH, DAI) and mock vaults for testing.
 * Use for testnets (Sepolia) or local development.
 * 
 * Usage:
 *   npx hardhat ignition deploy ignition/modules/TestTokens.ts --network sepolia
 */
export default buildModule("TestTokens", (m) => {
  // Deploy test tokens with IDs that match what generate-abi.ts and tokens.ts expect
  const TokenUSDC = m.contract(
    "TestToken",
    ["USD Coin", "USDC", 6],
    { id: "TokenUSDC" }
  );
  
  const TokenWETH = m.contract(
    "TestToken",
    ["Wrapped Ether", "WETH", 18],
    { id: "TokenWETH" }
  );
  
  const TokenDAI = m.contract(
    "TestToken",
    ["Dai Stablecoin", "DAI", 18],
    { id: "TokenDAI" }
  );

  // Deploy MockVault4626 (ERC-4626 vaults for testing)
  const MockVaultUSDC = m.contract(
    "MockVault4626",
    [TokenUSDC, "USDC Vault", "mUSDC"],
    { id: "MockVaultUSDC" }
  );

  const MockVaultDAI = m.contract(
    "MockVault4626",
    [TokenDAI, "DAI Vault", "mDAI"],
    { id: "MockVaultDAI" }
  );

  return {
    TokenUSDC,
    TokenWETH,
    TokenDAI,
    MockVaultUSDC,
    MockVaultDAI,
  };
});
