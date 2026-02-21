import { getAddress, pad } from "viem";

/**
 * Ethereum Client Diversity Allocations
 *
 * Based on client distribution data from https://clientdiversity.org
 *
 * Client diversity is critical for Ethereum's resilience. If a single client
 * is used by 2/3rds (66%) of validators, there's a very real risk of chain
 * disruption and monetary loss for node operators.
 *
 * Goal: <33% marketshare for all clients
 * Danger: >66% marketshare for any single client
 */

export const CONSENSUS_CLIENTS_METADATA = {
  title: "Ethereum Consensus Clients",
  description:
    "Supporting the teams behind Ethereum consensus layer clients. Allocations are weighted by current network usage to fund development proportionally while encouraging client diversity. No single client should exceed 33% marketshare to prevent chain disruption risks.",
};

export const CONSENSUS_CLIENTS = [
  {
    recipient: getAddress(pad("0xC101", { size: 20 })),
    label: "Lighthouse",
    percentage: 37.6,
  },
  {
    recipient: getAddress(pad("0xC102", { size: 20 })),
    label: "Erigon",
    percentage: 26.04,
  },
  {
    recipient: getAddress(pad("0xC103", { size: 20 })),
    label: "Prysm",
    percentage: 17.81,
  },
  {
    recipient: getAddress(pad("0xC104", { size: 20 })),
    label: "Teku",
    percentage: 7.4,
  },
  {
    recipient: getAddress(pad("0xC105", { size: 20 })),
    label: "Nimbus",
    percentage: 4.58,
  },
  {
    recipient: getAddress(pad("0xC106", { size: 20 })),
    label: "Lodestar",
    percentage: 2.92,
  },
  {
    recipient: getAddress(pad("0xC107", { size: 20 })),
    label: "Grandine",
    percentage: 2.5,
  },
];

export const EXECUTION_CLIENTS_METADATA = {
  title: "Ethereum Execution Clients",
  description:
    "Funding the teams building Ethereum execution layer clients. Allocations reflect current network distribution to support development proportionally. Maintaining client diversity on the execution layer is equally critical - a bug in a majority client could prevent finality or cause chain splits.",
};

export const EXECUTION_CLIENTS = [
  {
    recipient: getAddress(pad("0xE101", { size: 20 })),
    label: "Geth",
    percentage: 41,
  },
  {
    recipient: getAddress(pad("0xE102", { size: 20 })),
    label: "Nethermind",
    percentage: 38,
  },
  {
    recipient: getAddress(pad("0xE103", { size: 20 })),
    label: "Besu",
    percentage: 16,
  },
  {
    recipient: getAddress(pad("0xE104", { size: 20 })),
    label: "Erigon",
    percentage: 3,
  },
  {
    recipient: getAddress(pad("0xE105", { size: 20 })),
    label: "Reth",
    percentage: 2,
  },
];

export const DEFAULT_ALLOCATIONS_METADATA = {
  title: "Ethereum Public Goods",
  description:
    "Supporting critical Ethereum infrastructure and open source development. Equal allocation across protocol security, open source software funding, and decentralized science initiatives.",
};

export const DEFAULT_ALLOCATIONS = [
  {
    recipient: getAddress(pad("0xD101", { size: 20 })),
    label: "Ethereum Security",
    percentage: 33.33,
  },
  {
    recipient: getAddress(pad("0xD102", { size: 20 })),
    label: "Gitcoin OSS",
    percentage: 33.33,
  },
  {
    recipient: getAddress(pad("0xD103", { size: 20 })),
    label: "DeepFunding",
    percentage: 33.34,
  },
];

/**
 * Convert percentage-based allocations to weight-based allocations
 * Weight is calculated as percentage * 100 to maintain precision
 */
export const getClientAllocationsWithWeights = () => {
  const consensusAllocations = CONSENSUS_CLIENTS.map((client) => ({
    recipient: client.recipient,
    label: client.label,
    weight: Math.round(client.percentage * 100),
  }));

  const executionAllocations = EXECUTION_CLIENTS.map((client) => ({
    recipient: client.recipient,
    label: client.label,
    weight: Math.round(client.percentage * 100),
  }));

  return [...consensusAllocations, ...executionAllocations];
};
