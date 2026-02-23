"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { CanonicalRegistrySDK, type SupportedChainId } from "..";
import type { WalletClient } from "viem";

type CanonicalRegistryContextValue<T extends CanonicalRegistrySDK = CanonicalRegistrySDK> = {
  sdk: T | null;
};

const CanonicalRegistryContext = createContext<CanonicalRegistryContextValue>({
  sdk: null,
});

type CanonicalRegistryProviderProps<T extends CanonicalRegistrySDK> = PropsWithChildren<{
  client?: WalletClient;
  defaultChain?: SupportedChainId;
}>;

export function CanonicalRegistryProvider<T extends CanonicalRegistrySDK = CanonicalRegistrySDK>({
  children,
  client,
  defaultChain,
}: CanonicalRegistryProviderProps<T>): React.ReactNode {
  const [sdk, setSdk] = useState<CanonicalRegistrySDK | null>(() => {
    return new CanonicalRegistrySDK(client, defaultChain);
  });

  useEffect(() => {
    setSdk(new CanonicalRegistrySDK(client, defaultChain));
  }, [client, defaultChain]);

  return (
    <CanonicalRegistryContext.Provider value={{ sdk }}>
      {children}
    </CanonicalRegistryContext.Provider>
  );
}

export function useCanonicalRegistrySDK<T extends CanonicalRegistrySDK = CanonicalRegistrySDK>(): {
  sdk: T | null;
} {
  const context = useContext(CanonicalRegistryContext);
  if (!context) {
    throw new Error("useCanonicalRegistrySDK must be used within a CanonicalRegistryProvider");
  }
  return context as { sdk: T | null };
}
