"use client";
import { PropsWithChildren } from "react";

import { createConfig, http, useWalletClient, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EntityRegistryProvider } from "@ethereum-entity-registry/sdk";
import { hardhat, sepolia, baseSepolia } from "viem/chains";
import { Toaster } from "@ethereum-entity-registry/ui/components/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";

import "@rainbow-me/rainbowkit/styles.css";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        rainbowWallet,
      ],
    },
    {
      groupName: "Development",
      wallets: [rainbowkitBurnerWallet],
    },
  ],
  {
    appName: "Curator",
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  },
);
const isDev = process.env.NODE_ENV === "development";
export const defaultChain = isDev ? hardhat : sepolia;
const config = createConfig({
  chains: isDev ? [hardhat, sepolia, baseSepolia] : [sepolia, baseSepolia],
  connectors,
  defaultChain,
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    ),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <RainbowKitProvider>
            <Registry>
              {children}
              <Toaster />
            </Registry>
          </RainbowKitProvider>
        </NextThemesProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Registry({ children }: PropsWithChildren) {
  const { data: client } = useWalletClient();

  return (
    <EntityRegistryProvider client={client} defaultChain={defaultChain.id}>
      {children}
    </EntityRegistryProvider>
  );
}
