# Deployment Guide

## Overview

The deployment is organized into modular ignition files that can be composed together:

- **Strategy.ts** - Local development (Hardhat network)
- **Strategy.sepolia.ts** - Sepolia testnet with test tokens
- **Strategy.production.ts** - Mainnet (production)
- **TestTokens.ts** - Standalone test token and vault deployment
- **Registrar.ts** - ENS registrar deployment
- **ENS.dev.ts** - Full ENS infrastructure for local development

## Deployment Commands

### Local Development

Deploys everything including ENS infrastructure, test tokens, and vaults:

```bash
cd packages/contracts
pnpm hardhat ignition deploy ignition/modules/Strategy.ts --network localhost
```

### Sepolia Testnet

Deploys Strategy, StrategyFactory, and test tokens/vaults using existing infrastructure:

```bash
cd packages/contracts
pnpm hardhat ignition deploy ignition/modules/Strategy.sepolia.ts \
  --network sepolia \
  --parameters ignition/parameters/sepolia.json
```

### Mainnet (Production)

Deploys Strategy, StrategyFactory, YieldRedirector, and YieldRedirectorFactory using existing infrastructure:

```bash
cd packages/contracts
bun run deploy:mainnet
```

Or directly:

```bash
cd packages/contracts
pnpm hardhat ignition deploy ignition/modules/Strategy.production.ts \
  --network mainnet \
  --parameters ignition/parameters/mainnet.json
```

### Standalone Test Tokens

Deploy only test tokens and vaults (useful for testing):

```bash
cd packages/contracts
pnpm hardhat ignition deploy ignition/modules/TestTokens.ts \
  --network sepolia \
  --parameters ignition/parameters/sepolia.json
```

### ENS Registrar

Deploy the ForeverSubnameRegistrar for a specific ENS name:

```bash
cd packages/contracts
pnpm hardhat ignition deploy ignition/modules/Registrar.ts \
  --network sepolia \
  --parameters ignition/parameters/sepolia.json
```

## Configuration

### Test Tokens

The `TestTokens` module deploys a standard set of test tokens and vaults:

**Tokens:**

- USDC (6 decimals)
- WETH (18 decimals)
- DAI (18 decimals)

**Vaults:**

- MockVaultUSDC (for USDC)
- MockVaultDAI (for DAI)

To customize which tokens are deployed, edit `ignition/modules/TestTokens.ts` directly.

### Network Parameters

Each network has its own parameter file in `ignition/parameters/`:

- **hardhat.json** - Local development
- **sepolia.json** - Sepolia testnet
- **mainnet.json** - Mainnet

## Module Structure

### Strategy.ts

Local development module that includes:

- Full ENS infrastructure (via ENS.dev.ts)
- SplitsWarehouse
- Strategy & StrategyFactory
- Test tokens and vaults (via TestTokens.ts)

### Strategy.sepolia.ts

Sepolia deployment that includes:

- References existing SplitsWarehouse and ReverseRegistrar
- Deploys Strategy & StrategyFactory
- Deploys test tokens and vaults (via TestTokens.ts)

### Strategy.production.ts

Production deployment (mainnet/sepolia) that includes:

- References existing SplitsWarehouse and ReverseRegistrar
- Deploys Strategy & StrategyFactory
- Deploys YieldRedirector4626 implementation & YieldRedirectorFactory
- No test tokens (production uses real tokens)

### TestTokens.ts

Reusable module for deploying:

- Test ERC20 tokens (configured via parameters)
- Mock ERC-4626 vaults (configured via parameters)
- YieldRedirector4626 implementation
- YieldRedirectorFactory

## Example Workflows

### Testing on Sepolia

1. Deploy: `bun run deploy:sepolia`
2. Test tokens and vaults will be deployed along with Strategy contracts

### Adding a New Test Token

1. Edit `ignition/modules/TestTokens.ts` and add the new token:

```typescript
const TokenTEST = m.contract("TestToken", ["Test Token", "TEST", 18], {
  id: "TokenTEST",
});
```

2. Add a vault if needed:

```typescript
const MockVaultTEST = m.contract(
  "MockVault4626",
  [TokenTEST, "Test Vault", "mTEST"],
  { id: "MockVaultTEST" },
);
```

3. Add to the return statement:

```typescript
return {
  // ... existing tokens ...
  TokenTEST,
  MockVaultTEST,
  // ...
};
```

4. Update `packages/sdk/src/tokens.ts` to add the token metadata

## Notes

- Test tokens are only deployed on local and testnet environments
- Production deployments use real token addresses (not deployed)
- All modules are designed to be composable and reusable
- The TestTokens module can be used standalone or as part of larger deployments
