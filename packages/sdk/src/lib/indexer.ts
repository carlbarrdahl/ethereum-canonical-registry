import { Client, fetchExchange, gql } from "@urql/core";
import type { Address } from "viem";
import { config, type SupportedChainId } from "../config";

// ============================================================================
// GraphQL Queries
// ============================================================================

const identifiersQuery = gql`
  query Identifiers(
    $where: identifierFilter
    $orderBy: String
    $orderDirection: String
    $limit: Int
    $after: String
  ) {
    identifiers(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      limit: $limit
      after: $after
    ) {
      items {
        id
        namespace
        canonicalString
        owner
        accountAddress
        claimedAt
        revokedAt
        createdAt
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const identifierQuery = gql`
  query Identifier($id: String!) {
    identifier(id: $id) {
      id
      namespace
      canonicalString
      owner
      accountAddress
      claimedAt
      revokedAt
      createdAt
    }
  }
`;

const aliasesQuery = gql`
  query Aliases(
    $where: identifierAliasFilter
    $orderBy: String
    $orderDirection: String
    $limit: Int
    $after: String
  ) {
    identifierAliases(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      limit: $limit
      after: $after
    ) {
      items {
        id
        aliasId
        primaryId
        linkedAt
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ============================================================================
// Types
// ============================================================================

export type Identifier = {
  id: `0x${string}`;
  namespace: string;
  canonicalString: string;
  owner: Address | null;
  accountAddress: Address | null;
  claimedAt: bigint | null;
  revokedAt: bigint | null;
  createdAt: bigint;
};

export type IdentifierAlias = {
  id: string;
  aliasId: `0x${string}`;
  primaryId: `0x${string}`;
  linkedAt: bigint;
};

export type Page<T> = {
  items: T[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string;
  };
};

// ============================================================================
// Filter Types
// ============================================================================

export type IdentifierFilter = {
  id?: string;
  id_in?: string[];
  namespace?: string;
  owner?: string;
  owner_in?: string[];
  accountAddress?: string;
};

export type AliasFilter = {
  aliasId?: string;
  primaryId?: string;
  primaryId_in?: string[];
};

export type QueryVariables<TFilter> = {
  where?: TFilter;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  after?: string;
};

// ============================================================================
// REST API Types
// ============================================================================

export type RegistryStats = {
  totalIdentifiers: number;
  totalOwners: number;
};

export type StatsResponse = {
  data: RegistryStats;
};

// ============================================================================
// Indexer
// ============================================================================

type IndexerBase = {
  client: Client;
  gql: typeof gql;
  baseUrl: string;
  identifier: {
    get: (id: `0x${string}`) => Promise<Identifier | null>;
    query: (
      variables?: QueryVariables<IdentifierFilter>,
    ) => Promise<Page<Identifier> | null>;
  };
  alias: {
    query: (
      variables?: QueryVariables<AliasFilter>,
    ) => Promise<Page<IdentifierAlias> | null>;
  };
  stats: () => Promise<RegistryStats>;
};

export type Indexer = IndexerBase & {
  extend<T>(extension: IndexerExtension<T>): Indexer & T;
};

export type IndexerExtension<T> = (indexer: Indexer) => T;

export function createIndexer(chainId: SupportedChainId): Indexer {
  const url = config[chainId]?.indexer;
  if (!url) throw new Error(`No indexer configured for chain ${chainId}`);

  const baseUrl = url.replace(/\/graphql$/, "");

  const client = new Client({
    url,
    exchanges: [fetchExchange],
    requestPolicy: "network-only",
    preferGetMethod: false,
  });

  const indexer: Indexer = {
    client,
    gql,
    baseUrl,

    extend<T>(extension: IndexerExtension<T>): Indexer & T {
      const extended = extension(indexer);
      return Object.assign(indexer, extended) as Indexer & T;
    },

    identifier: {
      get: async (id: `0x${string}`) => {
        const result = await client
          .query(identifierQuery, { id: id.toLowerCase() })
          .toPromise();
        return result.data?.identifier ?? null;
      },
      query: async (variables: QueryVariables<IdentifierFilter> = {}) => {
        const result = await client
          .query(identifiersQuery, variables)
          .toPromise();
        return result.data?.identifiers ?? null;
      },
    },

    alias: {
      query: async (variables: QueryVariables<AliasFilter> = {}) => {
        const result = await client
          .query(aliasesQuery, variables)
          .toPromise();
        return result.data?.identifierAliases ?? null;
      },
    },

    stats: async () => {
      const response = await fetch(`${baseUrl}/api/stats`);
      const data = (await response.json()) as StatsResponse;
      return data.data;
    },
  };

  return indexer;
}
