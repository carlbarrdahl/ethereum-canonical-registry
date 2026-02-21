/**
 * Color utilities for consistent address-based coloring across the app
 */

export const ALLOCATION_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-lime-500",
  "bg-fuchsia-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-sky-500",
];

/**
 * Generate a deterministic hash from a string (address)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color index for an address
 */
export function getColorIndexForAddress(address: string): number {
  return hashString(address.toLowerCase()) % ALLOCATION_COLORS.length;
}

/**
 * Get a consistent color class for an address
 */
export function getColorForAddress(address: string): string {
  const index = getColorIndexForAddress(address);
  return ALLOCATION_COLORS[index]!;
}
