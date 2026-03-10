import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIndexer } from "../lib/indexer";

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
    gql: (query: TemplateStringsArray) => query,
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
});

describe("identifier.get()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns identifier data", async () => {
    const mockResult = {
      data: {
        identifier: {
          id: "0xabc",
          namespace: "github",
          canonicalString: "org/repo",
          owner: "0x123",
          accountAddress: "0x456",
          claimedAt: 1000n,
          revokedAt: null,
          createdAt: 1000n,
        },
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(mockResult),
    });

    const indexer = createIndexer(31337);
    const result = await indexer.identifier.get("0xabc" as `0x${string}`);

    expect(result?.namespace).toBe("github");
    expect(result?.canonicalString).toBe("org/repo");
  });

  it("returns null for non-existent identifier", async () => {
    mockClient.query.mockReturnValue({
      toPromise: vi.fn().mockResolvedValue({ data: { identifier: null } }),
    });

    const indexer = createIndexer(31337);
    const result = await indexer.identifier.get("0xabc" as `0x${string}`);

    expect(result).toBeNull();
  });
});

describe("stats() REST method", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it("calls the /api/stats endpoint", async () => {
    const mockData = {
      data: {
        totalIdentifiers: 10,
        totalOwners: 7,
      },
    };

    mockFetch.mockResolvedValue({ json: async () => mockData });

    const indexer = createIndexer(31337);
    const result = await indexer.stats();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:42069/api/stats",
    );
    expect(result.totalIdentifiers).toBe(10);
  });
});
