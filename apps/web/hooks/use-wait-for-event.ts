import { type Hex, parseEventLogs } from "viem";
import { usePublicClient } from "wagmi";
import pRetry from "p-retry";

import { getTransactionReceipt } from "viem/actions";

export function useWaitForEvent(abi: readonly unknown[]) {
  const client = usePublicClient();
  return (hash: Hex, eventName: string): Promise<readonly unknown[]> => {
    if (!client) throw new Error("PublicClient not found");
    return pRetry(
      () =>
        getTransactionReceipt(client, { hash }).then(({ logs }) =>
          parseEventLogs({ abi, logs, eventName }),
        ),
      { retries: 5 },
    );
  };
}
