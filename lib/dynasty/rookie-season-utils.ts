/**
 * Rookie Season Utilities
 *
 * Calculates the correct rookie draft class season based on NFL calendar timing.
 *
 * NFL Calendar Logic:
 * - NFL Draft: Late April (typically last Thursday-Saturday)
 * - Season Start: Early September (Week 1)
 * - Season End: Early January (Week 18)
 *
 * Rookie Season Rules:
 * - BEFORE NFL Draft: Show CURRENT year rookies (already drafted, in season/offseason)
 * - AFTER NFL Draft, BEFORE Week 1: Show NEXT year rookies (just drafted, about to start)
 * - AFTER Week 1: Show NEXT year rookies (research next year's incoming class)
 */

/**
 * NFL Calendar Key Dates (approximate)
 */
const NFL_CALENDAR = {
  /** NFL Draft typically happens last week of April */
  DRAFT_MONTH: 3, // April (0-indexed: 0=Jan, 3=April)
  DRAFT_DAY_ESTIMATE: 25,

  /** Season starts first week of September */
  SEASON_START_MONTH: 8, // September (0-indexed: 0=Jan, 8=September)
  SEASON_START_DAY_ESTIMATE: 7,
};

/**
 * Get current rookie season year based on NFL calendar
 *
 * Logic:
 * - Jan 1 - April ~25: Use current year (2025 → show 2025 class)
 * - April ~26 - Aug 31: Use current year (2025 → show 2025 class just drafted)
 * - Sept 1 - Dec 31: Use NEXT year (2025 → show 2026 class for research)
 *
 * @param today - Date object (defaults to today)
 * @returns Rookie season year (e.g., 2025, 2026)
 */
export function getCurrentRookieSeasonYear(today: Date = new Date()): number {
  const currentYear = today.getFullYear();
  const month = today.getMonth(); // 0-indexed (0 = January, 11 = December)
  const day = today.getDate();

  // After September 1st: Advance to next year's rookie class
  if (month >= NFL_CALENDAR.SEASON_START_MONTH) {
    return currentYear + 1;
  }

  // Before September: Use current year
  return currentYear;
}

/**
 * Check if NFL Draft has happened for given year
 *
 * @param year - Year to check (e.g., 2025)
 * @param today - Date object (defaults to today)
 * @returns true if draft has already occurred
 */
export function hasNFLDraftHappened(year: number, today: Date = new Date()): boolean {
  const currentYear = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // If checking a future year, draft hasn't happened yet
  if (year > currentYear) {
    return false;
  }

  // If checking a past year, draft definitely happened
  if (year < currentYear) {
    return true;
  }

  // Same year: Check if we're past draft date (late April)
  if (month > NFL_CALENDAR.DRAFT_MONTH) {
    return true;
  }

  if (month === NFL_CALENDAR.DRAFT_MONTH && day >= NFL_CALENDAR.DRAFT_DAY_ESTIMATE) {
    return true;
  }

  return false;
}

/**
 * Get description text for rookie season status
 *
 * @param year - Rookie season year
 * @param today - Date object (defaults to today)
 * @returns Human-readable description
 */
export function getRookieSeasonDescription(year: number, today: Date = new Date()): string {
  const currentYear = today.getFullYear();
  const month = today.getMonth();
  const draftHappened = hasNFLDraftHappened(year, today);

  if (year === currentYear) {
    if (draftHappened) {
      // If draft happened in current year and we're before September, show "newly drafted"
      if (month < NFL_CALENDAR.SEASON_START_MONTH) {
        return `Newly drafted ${year} rookie class. Landing spots confirmed, training camp ahead.`;
      }
      // After September, show "current season"
      return `Current season rookies with live NFL stats. Rankings based on consensus dynasty values.`;
    }
    return `Pre-draft ${year} rookie class. Rankings based on college production and combine metrics.`;
  }

  if (year === currentYear + 1) {
    if (draftHappened) {
      return `Newly drafted ${year} rookie class. Landing spots confirmed, training camp ahead.`;
    }
    return `Upcoming ${year} rookie class. Pre-draft rankings based on college production.`;
  }

  return `${year} Rookie Class`;
}

/**
 * Get landing spot filter availability
 *
 * Landing spots are only meaningful AFTER the NFL Draft
 *
 * @param year - Rookie season year
 * @param today - Date object (defaults to today)
 * @returns true if landing spot filter should be shown
 */
export function areLandingSpotsAvailable(year: number, today: Date = new Date()): boolean {
  return hasNFLDraftHappened(year, today);
}

/**
 * Get header text for rookie rankings
 *
 * @param year - Rookie season year
 * @param today - Date object (defaults to today)
 * @returns Header text (e.g., "2025 Rookie Class")
 */
export function getRookieHeaderText(year: number, today: Date = new Date()): string {
  const currentYear = today.getFullYear();
  const month = today.getMonth();
  const draftHappened = hasNFLDraftHappened(year, today);

  if (year === currentYear) {
    if (draftHappened) {
      // If draft just happened (April-August), show "Just Drafted"
      if (month < NFL_CALENDAR.SEASON_START_MONTH) {
        return `${year} Rookie Class (Just Drafted)`;
      }
      return `${year} Rookie Class`;
    }
    return `${year} Pre-Draft Rankings`;
  }

  if (year === currentYear + 1) {
    if (draftHappened) {
      return `${year} Rookie Class (Just Drafted)`;
    }
    return `${year} Pre-Draft Rankings`;
  }

  return `${year} Rookie Class`;
}
