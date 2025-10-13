/**
 * Unit Tests for Rookie Season Utilities
 */

import {
  getCurrentRookieSeasonYear,
  hasNFLDraftHappened,
  getRookieSeasonDescription,
  areLandingSpotsAvailable,
  getRookieHeaderText,
} from '../rookie-season-utils';

describe('Rookie Season Utilities', () => {
  describe('getCurrentRookieSeasonYear', () => {
    it('should return current year before September', () => {
      // January 15, 2025
      const jan15 = new Date(2025, 0, 15);
      expect(getCurrentRookieSeasonYear(jan15)).toBe(2025);

      // April 1, 2025 (before draft)
      const apr1 = new Date(2025, 3, 1);
      expect(getCurrentRookieSeasonYear(apr1)).toBe(2025);

      // August 31, 2025 (last day before season)
      const aug31 = new Date(2025, 7, 31);
      expect(getCurrentRookieSeasonYear(aug31)).toBe(2025);
    });

    it('should return next year after September 1st', () => {
      // September 1, 2025
      const sept1 = new Date(2025, 8, 1);
      expect(getCurrentRookieSeasonYear(sept1)).toBe(2026);

      // October 13, 2025
      const oct13 = new Date(2025, 9, 13);
      expect(getCurrentRookieSeasonYear(oct13)).toBe(2026);

      // December 31, 2025
      const dec31 = new Date(2025, 11, 31);
      expect(getCurrentRookieSeasonYear(dec31)).toBe(2026);
    });
  });

  describe('hasNFLDraftHappened', () => {
    it('should return false for future years', () => {
      const today = new Date(2025, 5, 15); // June 15, 2025
      expect(hasNFLDraftHappened(2026, today)).toBe(false);
      expect(hasNFLDraftHappened(2027, today)).toBe(false);
    });

    it('should return true for past years', () => {
      const today = new Date(2025, 5, 15); // June 15, 2025
      expect(hasNFLDraftHappened(2024, today)).toBe(true);
      expect(hasNFLDraftHappened(2023, today)).toBe(true);
    });

    it('should return false before draft date in current year', () => {
      // April 1, 2025 (before draft ~April 25)
      const preDraft = new Date(2025, 3, 1);
      expect(hasNFLDraftHappened(2025, preDraft)).toBe(false);
    });

    it('should return true after draft date in current year', () => {
      // April 26, 2025 (after draft)
      const postDraft = new Date(2025, 3, 26);
      expect(hasNFLDraftHappened(2025, postDraft)).toBe(true);

      // June 1, 2025
      const june = new Date(2025, 5, 1);
      expect(hasNFLDraftHappened(2025, june)).toBe(true);
    });
  });

  describe('getRookieSeasonDescription', () => {
    it('should describe current year pre-draft', () => {
      const preDraft = new Date(2025, 3, 1); // April 1, 2025
      const desc = getRookieSeasonDescription(2025, preDraft);
      expect(desc).toContain('Pre-draft');
      expect(desc).toContain('college production');
    });

    it('should describe current year post-draft', () => {
      // June (before season start): Newly drafted
      const june2025 = new Date(2025, 5, 1);
      const descJune = getRookieSeasonDescription(2025, june2025);
      expect(descJune).toContain('Newly drafted');
      expect(descJune).toContain('Landing spots confirmed');

      // September (season started): Current season
      const sept2025 = new Date(2025, 8, 1);
      const descSept = getRookieSeasonDescription(2025, sept2025);
      expect(descSept).toContain('Current season');
      expect(descSept).toContain('live NFL stats');
    });

    it('should describe next year pre-draft', () => {
      const preDraft = new Date(2025, 0, 15); // January 15, 2025
      const desc = getRookieSeasonDescription(2026, preDraft);
      expect(desc).toContain('Upcoming');
      expect(desc).toContain('2026');
    });

    it('should describe next year post-draft', () => {
      // In June 2025, if we're looking at 2026, it's still upcoming (2026 draft is in April 2026)
      const june2025 = new Date(2025, 5, 1);
      const desc2026 = getRookieSeasonDescription(2026, june2025);
      expect(desc2026).toContain('Upcoming');
      expect(desc2026).toContain('2026');

      // But in June 2026, if we look at 2026, it's newly drafted
      const june2026 = new Date(2026, 5, 1);
      const desc2026PostDraft = getRookieSeasonDescription(2026, june2026);
      expect(desc2026PostDraft).toContain('Newly drafted');
      expect(desc2026PostDraft).toContain('2026');
    });
  });

  describe('areLandingSpotsAvailable', () => {
    it('should return true only after draft', () => {
      const preDraft = new Date(2025, 3, 1); // April 1, 2025
      const postDraft = new Date(2025, 5, 1); // June 1, 2025

      expect(areLandingSpotsAvailable(2025, preDraft)).toBe(false);
      expect(areLandingSpotsAvailable(2025, postDraft)).toBe(true);
    });

    it('should return false for future years', () => {
      const today = new Date(2025, 5, 15); // June 15, 2025
      expect(areLandingSpotsAvailable(2026, today)).toBe(false);
    });

    it('should return true for past years', () => {
      const today = new Date(2025, 5, 15); // June 15, 2025
      expect(areLandingSpotsAvailable(2024, today)).toBe(true);
    });
  });

  describe('getRookieHeaderText', () => {
    it('should return correct header for current year pre-draft', () => {
      const preDraft = new Date(2025, 3, 1); // April 1, 2025
      const header = getRookieHeaderText(2025, preDraft);
      expect(header).toContain('2025');
      expect(header).toContain('Pre-Draft');
    });

    it('should return correct header for current year post-draft', () => {
      // June (just drafted): Shows "Just Drafted"
      const june2025 = new Date(2025, 5, 1);
      const headerJune = getRookieHeaderText(2025, june2025);
      expect(headerJune).toBe('2025 Rookie Class (Just Drafted)');

      // September (season started): No "Just Drafted" qualifier
      const sept2025 = new Date(2025, 8, 1);
      const headerSept = getRookieHeaderText(2025, sept2025);
      expect(headerSept).toBe('2025 Rookie Class');
    });

    it('should return correct header for next year post-draft', () => {
      // In June 2026, looking at 2026 class shows "Just Drafted"
      const june2026 = new Date(2026, 5, 1);
      const header = getRookieHeaderText(2026, june2026);
      expect(header).toContain('2026');
      expect(header).toContain('Just Drafted');
    });
  });

  describe('Integration: Full NFL Calendar Cycle', () => {
    it('should correctly transition through entire year', () => {
      // January 2025: Show 2025 class, draft hasn't happened
      const jan = new Date(2025, 0, 15);
      expect(getCurrentRookieSeasonYear(jan)).toBe(2025);
      expect(hasNFLDraftHappened(2025, jan)).toBe(false);
      expect(areLandingSpotsAvailable(2025, jan)).toBe(false);

      // May 2025: Show 2025 class, draft just happened
      const may = new Date(2025, 4, 1);
      expect(getCurrentRookieSeasonYear(may)).toBe(2025);
      expect(hasNFLDraftHappened(2025, may)).toBe(true);
      expect(areLandingSpotsAvailable(2025, may)).toBe(true);

      // September 2025: Switch to 2026 class, draft hasn't happened yet
      const sept = new Date(2025, 8, 1);
      expect(getCurrentRookieSeasonYear(sept)).toBe(2026);
      expect(hasNFLDraftHappened(2026, sept)).toBe(false);
      expect(areLandingSpotsAvailable(2026, sept)).toBe(false);

      // December 2025: Still showing 2026 class, draft in future
      const dec = new Date(2025, 11, 15);
      expect(getCurrentRookieSeasonYear(dec)).toBe(2026);
      expect(hasNFLDraftHappened(2026, dec)).toBe(false);
      expect(areLandingSpotsAvailable(2026, dec)).toBe(false);
    });
  });
});
