"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { CuratorSDK, type SupportedChainId } from "..";
import type { WalletClient } from "viem";

type CuratorContextValue<T extends CuratorSDK = CuratorSDK> = {
  sdk: T | null;
};

const CuratorContext = createContext<CuratorContextValue>({
  sdk: null,
});

type CuratorProviderProps<T extends CuratorSDK> = PropsWithChildren<{
  client?: WalletClient;
  defaultChain?: SupportedChainId;
}>;

export function CuratorProvider<T extends CuratorSDK = CuratorSDK>({
  children,
  client,
  defaultChain,
}: CuratorProviderProps<T>): React.ReactNode {
  const [sdk, setSdk] = useState<CuratorSDK | null>(() => {
    return new CuratorSDK(client, defaultChain);
  });

  useEffect(() => {
    setSdk(new CuratorSDK(client, defaultChain));
  }, [client, defaultChain]);

  return (
    <CuratorContext.Provider value={{ sdk }}>
      {children}
    </CuratorContext.Provider>
  );
}

export function useCuratorSDK<T extends CuratorSDK = CuratorSDK>(): {
  sdk: T | null;
} {
  const context = useContext(CuratorContext);
  if (!context) {
    throw new Error("useCuratorSDK must be used within a CuratorProvider");
  }
  return context as { sdk: T | null };
}
