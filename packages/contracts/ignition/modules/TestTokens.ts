import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * TestTokens Module — deploys test ERC-20 tokens for local development and Sepolia.
 */
export default buildModule("TestTokens", (m) => {
  const TokenUSDC = m.contract("TestToken", ["USD Coin", "USDC", 6], {
    id: "TokenUSDC",
  });

  const TokenWETH = m.contract("TestToken", ["Wrapped Ether", "WETH", 18], {
    id: "TokenWETH",
  });

  const TokenDAI = m.contract("TestToken", ["Dai Stablecoin", "DAI", 18], {
    id: "TokenDAI",
  });

  return { TokenUSDC, TokenWETH, TokenDAI };
});
