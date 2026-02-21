# Curator Contracts

Smart contracts for the Curator platform: strategy-based token distribution on Ethereum with 0xSplits integration.

## Architecture

- **Strategy** – Core contract for weighted token distribution; deployed as minimal proxies (clones) via the factory.
- **StrategyFactory** – Deploys new Strategy instances and holds the implementation. Uses the official SplitsWarehouse.
- **SplitsWarehouse** – 0xSplits integration for unified withdrawals (use existing deployment on testnet/mainnet).
- **ForeverSubnameRegistrar** – ENS subdomain registration (e.g. `strategy.support.eth`).
- **Multicall3** – Batches multiple contract calls into a single transaction (official deployment on mainnet/sepolia, mock for local dev). Note: Not used for ENS registration due to `msg.sender` authorization requirements.
- **TestToken** – ERC20 test tokens for local development only.

## Local Development

### Tests

```bash
pnpm hardhat test
```

### Deploy locally

Deploy full stack to a local Hardhat node:

```bash
# Terminal 1: start node
pnpm hardhat node

# Terminal 2: deploy
pnpm hardhat ignition deploy ignition/modules/Strategy.ts --network localhost
pnpm hardhat ignition deploy ignition/modules/ENS.dev.ts --network localhost

# Generate deployments.json (SDK, indexer, web)
pnpm run generate-abi
```

**Strategy.ts** deploys: SplitsWarehouse, Strategy (implementation), StrategyFactory, Multicall3, and test tokens (USDC, WETH, DAI).

**ENS.dev.ts** deploys a complete ENS infrastructure for local testing that matches official ENS behavior:

- Strict authorization for reverse records (matching Sepolia/mainnet)
- No trusted relationships that don't exist in production
- Tests will catch authorization issues before deploying to testnet

## Sepolia / Mainnet

Use the **production** module so the official SplitsWarehouse is used and test tokens are not deployed.

### 1. Environment

```bash
# Recommended: Hardhat keystore
pnpm hardhat keystore set SEPOLIA_RPC_URL
pnpm hardhat keystore set SEPOLIA_PRIVATE_KEY

# Or .env
# SEPOLIA_RPC_URL=...
# SEPOLIA_PRIVATE_KEY=0x...
```

### 2. Deploy Curator contracts (Sepolia)

```bash
pnpm hardhat ignition deploy ignition/modules/Strategy.production.ts \
  --network sepolia \
  --parameters ignition/parameters/sepolia.json
```

This uses SplitsWarehouse at `0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8` and deploys only Strategy (implementation) and StrategyFactory. No test tokens.

### 3. ENS Registrar (optional)

If you use ENS subdomains (e.g. `strategy.support.eth`):

#### Prerequisites

1. **Own the parent domain** (e.g., `support-dev.eth`) on the target network
2. **Wrap it in NameWrapper with CANNOT_UNWRAP fuse** - Required for ForeverSubnameRegistrar to work
3. **Deploy the registrar**
4. **Approve the registrar** to manage subdomains

#### Step 1: Wrap Parent Domain with CANNOT_UNWRAP Fuse

The ForeverSubnameRegistrar requires the parent domain to have the `CANNOT_UNWRAP` fuse burned. This allows it to create subdomains with `PARENT_CANNOT_CONTROL`.

**Calculate tokenId for your domain:**

```bash
bun -e "import { id } from 'ethers'; console.log(id('your-label'))"
# For support-dev.eth: 0xbf7423a8dd10b7a51c13dedd43d0b64e52728e01bf8c0d327f2ab185a75f9262
```

**Option A: Using cast (if you have private key)**

```bash
# 1. Approve NameWrapper to transfer domain from BaseRegistrar
cast send 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85 \
  "approve(address,uint256)" \
  0x0635513f179D50A207757E05759CbD106d7dFcE8 \
  <TOKEN_ID> \
  --private-key $SEPOLIA_PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL

# 2. Wrap with CANNOT_UNWRAP fuse (value: 1)
cast send 0x0635513f179D50A207757E05759CbD106d7dFcE8 \
  "wrapETH2LD(string,address,uint16,address)" \
  "your-label" \
  <OWNER_ADDRESS> \
  1 \
  <RESOLVER_ADDRESS> \
  --private-key $SEPOLIA_PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL
```

**Option B: Using Etherscan + MetaMask**

See `scripts/wrap-ens-domain.html` for a user-friendly interface, or use Etherscan directly:

1. **Approve**: https://sepolia.etherscan.io/address/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85#writeContract
   - Function: `approve`
   - Parameters:
     - `to`: `0x0635513f179D50A207757E05759CbD106d7dFcE8` (NameWrapper)
     - `tokenId`: Your calculated token ID
   - Set Gas Limit to: `200000`

2. **Wrap**: https://sepolia.etherscan.io/address/0x0635513f179D50A207757E05759CbD106d7dFcE8#writeContract
   - Function: `wrapETH2LD`
   - Parameters:
     - `label`: `"your-label"` (without .eth)
     - `wrappedOwner`: Your address
     - `ownerControlledFuses`: `1` (CANNOT_UNWRAP)
     - `resolver`: PublicResolver address

#### Step 2: Deploy ForeverSubnameRegistrar

Set the parent domain in `ignition/parameters/sepolia.json`:

```json
{
  "Registrar": {
    "nameWrapper": "0x0635513f179D50A207757E05759CbD106d7dFcE8",
    "resolver": "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
    "reverseRegistrar": "0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6",
    "parentNode": "0x..."
  }
}
```

Deploy:

```bash
pnpm hardhat ignition deploy ignition/modules/Registrar.ts \
  --network sepolia \
  --parameters ignition/parameters/sepolia.json
```

#### Step 3: Approve Registrar to Manage Subdomains

On NameWrapper, approve the registrar:

```bash
cast send 0x0635513f179D50A207757E05759CbD106d7dFcE8 \
  "setApprovalForAll(address,bool)" \
  <REGISTRAR_ADDRESS> \
  true \
  --private-key $SEPOLIA_PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL
```

Or on Etherscan: https://sepolia.etherscan.io/address/0x0635513f179D50A207757E05759CbD106d7dFcE8#writeContract

#### Step 4: Verify Deployment

```bash
npm run verify-ens:sepolia
```

This will check:

- ENS infrastructure contracts
- ForeverSubnameRegistrar deployment
- Parent domain wrapping status
- Registrar approval
- Attempt to register `verify.support-dev.eth` as a test

### 4. Generate ABIs

After any deployment:

```bash
pnpm run generate-abi
```

Writes `deployments.json` (addresses + ABIs) to `packages/sdk`, `packages/indexer`, and `apps/web`.

### 5. SDK config

Set `packages/sdk/src/config.ts` for the chain:

```typescript
[sepolia.id]: {
  factory: "0x...",        // StrategyFactory from deployments
  warehouse: "0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8",
  indexer: "https://...",
  foreverSubnameRegistrar: "0x...", // if using ENS
}
```

### 6. Indexer

- In `packages/indexer/ponder.config.ts`, enable the chain (e.g. add `sepolia` to active chains).
- Set `PONDER_RPC_URL_11155111` (or the chain id) in `packages/indexer/.env.local`.
- Optionally set a start block in config for faster sync.

### 7. Verify on Etherscan

```bash
pnpm hardhat verify --network sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

Example (StrategyFactory):

```bash
pnpm hardhat verify --network sepolia 0x... "0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8"
```

## Deployment summary

| Network | Module                   | Parameters file                    |
| ------- | ------------------------ | ---------------------------------- |
| Local   | `Strategy.ts`            | None                               |
| Sepolia | `Strategy.production.ts` | `ignition/parameters/sepolia.json` |
| Mainnet | `Strategy.production.ts` | `ignition/parameters/mainnet.json` |

**Shared infrastructure**

- SplitsWarehouse: `0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8` (Sepolia & mainnet)
- Multicall3: `0xcA11bde05977b3631167028862bE2a173976CA11` (Sepolia & mainnet)
- ENS (Sepolia): NameWrapper `0x0635513f179D50A207757E05759CbD106d7dFcE8`, Resolver `0x8948458626811dd0c23EB25Cc74291247077cC51`
- ENS (Mainnet): NameWrapper `0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401`, Resolver `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`

## Troubleshooting

- **"Deployment already exists"** – Ignition reuses existing deployments. To start fresh for a chain: remove `ignition/deployments/chain-<chainId>/` then redeploy.
- **ENS registration fails** – Confirm you own and have wrapped the parent domain and have approved the registrar.
- **Indexer not syncing** – Check RPC URL, contract addresses in config, and start block / chain id.

## Security notes

- Strategy instances are immutable; owner can change allocations but cannot withdraw recipient funds.
- Funds are distributed into SplitsWarehouse; withdrawals are pull-based by recipients.
- No upgrade path or admin keys on strategy logic.
