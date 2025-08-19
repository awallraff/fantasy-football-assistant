
interface EspnPlayer {
  id: number;
  fullName: string;
  proTeamId: number;
  defaultPositionId: number;
  player: {
    firstName: string;
    lastName: string;
    fullName: string;
    eligibleSlots: number[];
    proTeamId: number;
  };
}

interface EspnResponse {
  players: EspnPlayer[];
}

export class EspnAPI {
  private baseUrl = "/api/espn";
  private hasLoggedError = false;

  async getDraftRankings(season: number = 2025): Promise<EspnPlayer[]> {
    try {
      const url = `${this.baseUrl}?season=${season}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data: EspnResponse = await response.json();
      return data.players || [];
    } catch (error) {
      // Only log once to reduce console spam
      if (!this.hasLoggedError) {
        this.hasLoggedError = true;
        console.warn("ESPN API not accessible:", error instanceof Error ? error.message : error);
        console.info("Note: ESPN API may be restricted - using graceful fallback");
      }
      
      // Return empty array to fail gracefully
      return [];
    }
  }
}
