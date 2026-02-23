import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  type Hex,
} from "viem";

// ============================================================================
// Canonicalisation
// ============================================================================

/**
 * Default canonicalisation: lowercase, trim whitespace, strip trailing slash.
 * Baseline for all namespaces (github, dns).
 * The contract does not enforce any normalisation — consistency is the caller's
 * responsibility.
 */
export function canonicalise(value: string): string {
  return value.toLowerCase().trim().replace(/\/$/, "");
}

// ============================================================================
// Identifier helpers
// ============================================================================

/**
 * Derive the bytes32 identifier for a (namespace, canonicalString) pair.
 * Matches: keccak256(abi.encode(namespace, canonicalString))
 *
 * This is a pure local computation — no RPC call required.
 */
export function toId(namespace: string, canonicalString: string): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters("string, string"), [
      namespace,
      canonicalString,
    ]),
  );
}

/**
 * Format namespace + canonicalString into a human-readable identifier string.
 * e.g. formatIdentifier("github", "org/repo") → "github:org/repo"
 */
export function formatIdentifier(
  namespace: string,
  canonicalString: string,
): string {
  return `${namespace}:${canonicalString}`;
}

/**
 * Parse a colon-separated identifier string into its parts.
 * e.g. parseIdentifier("github:org/repo") → { namespace: "github", canonicalString: "org/repo" }
 */
export function parseIdentifier(identifier: string): {
  namespace: string;
  canonicalString: string;
} {
  const colonIndex = identifier.indexOf(":");
  if (colonIndex === -1) {
    throw new Error(
      `Invalid identifier (missing namespace): "${identifier}"`,
    );
  }
  return {
    namespace: identifier.slice(0, colonIndex),
    canonicalString: identifier.slice(colonIndex + 1),
  };
}

// ============================================================================
// URL parsing
// ============================================================================

export type ParsedUrl = {
  namespace: string;
  canonicalString: string;
  /** The normalised form, suitable for display: e.g. "github:org/repo" */
  formatted: string;
};

/**
 * Parse a free-form URL or handle into a registry identifier.
 *
 * Accepts all of the following for a GitHub repo:
 *   github.com/org/repo
 *   https://github.com/org/repo
 *   https://www.github.com/org/repo/tree/main  (extra path segments ignored)
 *
 * Accepts all of the following for a DNS domain:
 *   example.com
 *   https://example.com
 *   https://www.example.com/some/path          (path ignored)
 *
 * Throws if the input cannot be mapped to a known namespace.
 */
export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`Cannot parse "${input}" as a URL`);
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (host === "github.com") {
    if (pathParts.length < 2) {
      throw new Error(
        `GitHub URL must include owner and repo: "${input}"`,
      );
    }
    const canonicalString = `${pathParts[0]}/${pathParts[1]}`.toLowerCase();
    return {
      namespace: "github",
      canonicalString,
      formatted: `github:${canonicalString}`,
    };
  }

  if (host.includes(".")) {
    return {
      namespace: "dns",
      canonicalString: host,
      formatted: `dns:${host}`,
    };
  }

  throw new Error(`Cannot determine namespace for "${input}"`);
}
