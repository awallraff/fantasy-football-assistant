import { getCurrentNFLWeek, getNextUpcomingWeek } from "@/lib/nfl-season-utils"
import { NFL_SEASON_DATES } from "@/lib/constants/rankings"

describe("nfl-season-utils", () => {
  describe("getCurrentNFLWeek", () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it("returns 1 before regular season start", () => {
      jest.useFakeTimers({ advanceTimers: true })
      // Sep 1 — before REGULAR_SEASON_START_DAY (11)
      jest.setSystemTime(new Date(2025, 8, 1))

      expect(getCurrentNFLWeek()).toBe(1)
    })

    it("returns week 1 on first regular-season day", () => {
      jest.useFakeTimers({ advanceTimers: true })
      jest.setSystemTime(new Date(2025, NFL_SEASON_DATES.REGULAR_SEASON_START_MONTH - 1, NFL_SEASON_DATES.REGULAR_SEASON_START_DAY))

      expect(getCurrentNFLWeek()).toBe(1)
    })
  })

  describe("getNextUpcomingWeek", () => {
    it("returns an object with year and week", () => {
      const r = getNextUpcomingWeek()
      expect(typeof r.year).toBe("number")
      expect(typeof r.week).toBe("number")
      expect(r.week).toBeGreaterThanOrEqual(1)
    })
  })
})
