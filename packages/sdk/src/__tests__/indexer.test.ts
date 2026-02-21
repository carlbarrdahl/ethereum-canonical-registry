import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIndexer } from "../lib/indexer";
import type { Client } from "@urql/core";

const mockQuery = vi.fn();
const mockClient = {
  query: mockQuery,
};

vi.mock("@urql/core", () => {
  return {
    Client: vi.fn(function () {
      return mockClient;
    }),
    fetchExchange: vi.fn(),
    gql: (query: string) => query,
  };
});

describe("createIndexer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructs correct base URL from GraphQL URL", () => {
    const indexer = createIndexer(31337);
    expect(indexer.baseUrl).toBe("http://localhost:42069");
  });

  it("strips /graphql suffix from URL", () => {
    const indexer = createIndexer(11155111);
    expect(indexer.baseUrl).toBe(
      "https://curatefund-production.up.railway.app",
    );
  });
});

describe("strategy.get() allocation version filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters allocations to only include current allocationsVersion", async () => {
    const mockResult = {
      data: {
        strategy: {
          id: "0x123",
          allocationsVersion: 2,
          allocations: {
            items: [
              {
                recipient: "0xaaa",
                weight: "50",
                label: "Old allocation",
                version: 1,
              },
              {
                recipient: "0xbbb",
                weight: "50",
                label: "Current allocation",
                version: 2,
              },
              {
                recipient: "0xccc",
                weight: "50",
                label: "Another current",
                version: 2,
              },
            ],
          },
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const strategy = await indexer.strategy.get(
      "0x123" as `0x${string}`,
    );

    expect(strategy?.allocations).toHaveLength(2);
    expect(strategy?.allocations[0].version).toBe(2);
    expect(strategy?.allocations[1].version).toBe(2);
  });

  it("handles empty allocations array", async () => {
    const mockResult = {
      data: {
        strategy: {
          id: "0x123",
          allocationsVersion: 1,
          allocations: {
            items: [],
          },
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const strategy = await indexer.strategy.get(
      "0x123" as `0x${string}`,
    );

    expect(strategy?.allocations).toEqual([]);
  });

  it("handles strategy with no allocations", async () => {
    const mockResult = {
      data: {
        strategy: {
          id: "0x123",
          allocationsVersion: 1,
          allocations: null,
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const strategy = await indexer.strategy.get(
      "0x123" as `0x${string}`,
    );

    expect(strategy?.allocations).toEqual([]);
  });

  it("returns null for non-existent strategy", async () => {
    const mockResult = {
      data: {
        strategy: null,
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const strategy = await indexer.strategy.get(
      "0x123" as `0x${string}`,
    );

    expect(strategy).toBeNull();
  });
});

describe("strategy.query() allocation version filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters allocations per-strategy in list results", async () => {
    const mockResult = {
      data: {
        strategys: {
          items: [
            {
              id: "0x111",
              allocationsVersion: 2,
              allocations: {
                items: [
                  { recipient: "0xa", weight: "50", version: 1 },
                  { recipient: "0xb", weight: "50", version: 2 },
                ],
              },
            },
            {
              id: "0x222",
              allocationsVersion: 1,
              allocations: {
                items: [
                  { recipient: "0xc", weight: "100", version: 1 },
                  { recipient: "0xd", weight: "50", version: 2 },
                ],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const result = await indexer.strategy.query({});

    expect(result?.items[0].allocations).toHaveLength(1);
    expect(result?.items[0].allocations[0].recipient).toBe("0xb");

    expect(result?.items[1].allocations).toHaveLength(1);
    expect(result?.items[1].allocations[0].recipient).toBe("0xc");
  });

  it("handles empty result set", async () => {
    const mockResult = {
      data: {
        strategys: {
          items: [],
          totalCount: 0,
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const result = await indexer.strategy.query({});

    expect(result?.items).toEqual([]);
    expect(result?.totalCount).toBe(0);
  });

  it("returns null on query failure", async () => {
    const mockResult = {
      data: null,
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const result = await indexer.strategy.query({});

    expect(result).toBeNull();
  });
});

describe("REST API methods", () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe("trending()", () => {
    it("constructs correct URL with query params", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: [], period: "24h" }),
      });

      const indexer = createIndexer(31337);
      await indexer.trending({ period: "7d", limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:42069/api/strategies/trending?period=7d&limit=10",
      );
    });

    it("handles missing/default params", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: [], period: "24h" }),
      });

      const indexer = createIndexer(31337);
      await indexer.trending();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:42069/api/strategies/trending",
      );
    });

    it("returns parsed JSON response", async () => {
      const mockData = {
        data: [
          {
            id: "0x123",
            trendingStats: { transferCount: 5, totalAmount: "1000" },
          },
        ],
        period: "24h",
      };
      mockFetch.mockResolvedValue({
        json: async () => mockData,
      });

      const indexer = createIndexer(31337);
      const result = await indexer.trending();

      expect(result).toEqual(mockData);
    });
  });

  describe("lineage()", () => {
    it("lowercases address in URL", async () => {
      const mockData = {
        data: {
          strategy: "0xabc",
          sourceStrategy: null,
          ancestors: [],
          children: [],
          depth: 0,
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const indexer = createIndexer(31337);
      await indexer.lineage("0xABC" as `0x${string}`);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:42069/api/strategies/0xabc/lineage",
      );
    });

    it("returns null on non-OK response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const indexer = createIndexer(31337);
      const result = await indexer.lineage("0xABC" as `0x${string}`);

      expect(result).toBeNull();
    });

    it("returns data property on success", async () => {
      const mockData = {
        data: {
          strategy: "0xabc",
          sourceStrategy: "0xdef",
          ancestors: ["0xdef"],
          children: [],
          depth: 1,
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const indexer = createIndexer(31337);
      const result = await indexer.lineage("0xABC" as `0x${string}`);

      expect(result).toEqual(mockData.data);
    });
  });
});
