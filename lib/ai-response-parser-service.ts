import type { PlayerRanking } from "./rankings-types";

/**
 * Service responsible for parsing AI response text into PlayerRanking objects
 */
export class AIResponseParserService {

  /**
   * Parses AI response text into structured PlayerRanking array
   */
  parseAIResponse(aiResponse: string, week?: number): PlayerRanking[] {
    const rankings: PlayerRanking[] = [];
    const lines = aiResponse.split("\n");

    for (const line of lines) {
      // Updated regex to handle the enhanced format with position and team
      const match = line.match(/(\d+)\. (.*?) \((.*?) - (.*?)\) - Analysis: (.*)/);
      if (match) {
        const [, rank, playerName, position, team, analysis] = match;
        
        // Extract projected points from analysis if available
        const projectedPointsMatch = analysis.match(/(\d+\.?\d*) PPR\/game/);
        let projectedPoints = undefined;
        if (projectedPointsMatch) {
          const pointsPerGame = parseFloat(projectedPointsMatch[1]);
          // For weekly projections, use per-game rate; for season, multiply by 17
          projectedPoints = week ? pointsPerGame : pointsPerGame * 17;
        }
        
        // Calculate tier based on position and projected points
        let tier = undefined;
        if (projectedPoints) {
          tier = this.calculateTier(position, projectedPoints, week);
        }
        
        rankings.push({
          rank: parseInt(rank),
          playerId: `ai-${playerName.toLowerCase().replace(/\s/g, "-")}-${position.toLowerCase()}-${team.toLowerCase()}-${parseInt(rank)}`,
          playerName,
          position,
          team,
          projectedPoints,
          tier,
          notes: analysis,
        });
      } else {
        // Fallback to original format for backward compatibility
        const fallbackMatch = line.match(/(\d+)\. (.*?) - Analysis: (.*)/);
        if (fallbackMatch) {
          const [, rank, playerName, analysis] = fallbackMatch;
          rankings.push({
            rank: parseInt(rank),
            playerId: `ai-${playerName.toLowerCase().replace(/\s/g, "-")}-fallback-${parseInt(rank)}`,
            playerName,
            position: "N/A",
            team: "N/A", 
            notes: analysis,
          });
        }
      }
    }

    return rankings;
  }

  /**
   * Calculates tier based on position and projected points
   */
  private calculateTier(position: string, projectedPoints: number, week?: number): number {
    // Different tier breakpoints for weekly vs seasonal projections
    const seasonalTierBreakpoints = {
      'QB': [300, 280, 260, 240, 220],
      'RB': [280, 250, 220, 190, 160],
      'WR': [250, 220, 190, 160, 130],
      'TE': [180, 150, 120, 100, 80]
    };
    
    const weeklyTierBreakpoints = {
      'QB': [20, 18, 16, 14, 12],
      'RB': [18, 16, 14, 12, 10],
      'WR': [16, 14, 12, 10, 8],
      'TE': [12, 10, 8, 6, 4]
    };
    
    const breakpoints = week 
      ? (weeklyTierBreakpoints[position as keyof typeof weeklyTierBreakpoints] || weeklyTierBreakpoints['WR'])
      : (seasonalTierBreakpoints[position as keyof typeof seasonalTierBreakpoints] || seasonalTierBreakpoints['WR']);
    
    for (let i = 0; i < breakpoints.length; i++) {
      if (projectedPoints >= breakpoints[i]) {
        return i + 1;
      }
    }
    
    return 6; // Tier 6 for lower projections
  }

  /**
   * Validates that a ranking has all required fields
   */
  validateRanking(ranking: PlayerRanking): boolean {
    return !!(
      ranking.rank &&
      ranking.playerId &&
      ranking.playerName &&
      ranking.position &&
      ranking.team
    );
  }

  /**
   * Sorts rankings by rank and ensures sequential ordering
   */
  sortAndValidateRankings(rankings: PlayerRanking[]): PlayerRanking[] {
    // Sort by rank
    const sorted = rankings.sort((a, b) => a.rank - b.rank);
    
    // Ensure sequential ranking (1, 2, 3, ...)
    return sorted.map((ranking, index) => ({
      ...ranking,
      rank: index + 1
    }));
  }
}