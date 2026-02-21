import NodeFetchCache, { FetchInit, FileSystemCache } from "node-fetch-cache";
import pRetry from "p-retry";

export const cachedFetch = NodeFetchCache.create({
  cache: new FileSystemCache({ ttl: 1000 * 60 * 60 }),
});

export async function cachedFetchWithRetry<T>(
  url: string,
  options?: FetchInit
) {
  return pRetry(() => cachedFetch(url, options), { retries: 5 }).then(
    async (r) => {
      if (!r.ok) throw new Error(r.statusText);
      return (await r.json()) as T;
    }
  );
}
