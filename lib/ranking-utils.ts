/**
 * Ranking Utilities
 *
 * Utility functions for working with player rankings and tiers.
 */

/**
 * Gets the Tailwind CSS background color class for a given tier.
 *
 * Tiers are mapped to colors as follows:
 * - Tier 1: Red (highest priority)
 * - Tier 2: Orange
 * - Tier 3: Yellow
 * - Tier 4: Green
 * - Tier 5: Blue
 * - Tier 6+: Purple
 * - No tier: Gray
 *
 * @param tier - The tier number (1-6+) or undefined
 * @returns A Tailwind CSS background color class
 *
 * @example
 * ```ts
 * const color = getTierColor(1); // "bg-red-500"
 * const color = getTierColor(undefined); // "bg-gray-500"
 * ```
 */
export function getTierColor(tier?: number): string {
  if (!tier) return "bg-gray-500";

  switch (tier) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-green-500";
    case 5:
      return "bg-blue-500";
    default:
      return "bg-purple-500";
  }
}
