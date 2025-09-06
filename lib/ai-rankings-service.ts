import type { RankingSystem } from "./rankings-types";
import { NflDataFetcherService } from "./nfl-data-fetcher-service";
import { PromptBuilderService } from "./prompt-builder-service";
import { AIResponseParserService } from "./ai-response-parser-service";
import { RankingGeneratorService } from "./ranking-generator-service";

export class AIRankingsService {
  private nflDataService: NflDataFetcherService;
  private promptBuilder: PromptBuilderService;
  private responseParser: AIResponseParserService;
  private rankingGenerator: RankingGeneratorService;

  constructor() {
    this.nflDataService = new NflDataFetcherService();
    this.promptBuilder = new PromptBuilderService();
    this.responseParser = new AIResponseParserService();
    this.rankingGenerator = new RankingGeneratorService();
  }

  async generateAIRankings(
    allRankings: RankingSystem[], 
    options?: { 
      year?: number; 
      week?: number; 
      useHistoricalData?: boolean;
    }
  ): Promise<RankingSystem> {
    // Fetch NFL historical data if requested
    let nflData = null;
    if (options?.useHistoricalData !== false) {
      nflData = await this.nflDataService.fetchHistoricalData({
        year: options?.year,
        week: options?.week
      });
    }

    // Build prompt with historical data context
    this.promptBuilder.buildPromptWithHistoricalData(
      allRankings, 
      nflData, 
      options
    );

    // In a real implementation, you would send this prompt to a large language model.
    // For now, we will simulate the response with historical data context.
    const aiResponse = this.rankingGenerator.simulateAIResponseWithHistoricalData(
      allRankings, 
      nflData,
      options
    );

    // Parse AI response into structured rankings
    const aiRankings = this.responseParser.parseAIResponse(aiResponse, options?.week);

    // Generate final ranking system
    return this.rankingGenerator.generateRankingSystem(aiRankings, nflData, options);
  }

  /**
   * Legacy method for backward compatibility - builds basic prompt without historical data
   */
  private buildPrompt(allRankings: RankingSystem[]): string {
    return this.promptBuilder.buildBasicPrompt(allRankings);
  }

  /**
   * Legacy method for backward compatibility - simulates basic AI response
   */
  private simulateAIResponse(allRankings: RankingSystem[]): string {
    // This is a simplified simulation. A real AI would provide much more nuanced analysis.
    const allPlayers = allRankings.flatMap(system => system.rankings);
    const uniquePlayers = Array.from(new Set(allPlayers.map(p => p.playerName))).map(name => {
      return allPlayers.find(p => p.playerName === name)!;
    });

    let response = "";
    uniquePlayers.slice(0, 50).forEach((player, index) => {
      response += `${index + 1}. ${player.playerName} - Analysis: Consolidated top player based on average ranking across sources.\n`;
    });

    return response;
  }

  /**
   * Legacy method for backward compatibility - parses AI response
   */
  private parseAIResponse(aiResponse: string, week?: number) {
    return this.responseParser.parseAIResponse(aiResponse, week);
  }

  /**
   * Gets cached NFL data for external access
   */
  getCachedNFLData() {
    return this.nflDataService.getCachedData();
  }

  /**
   * Clears NFL data cache
   */
  clearNFLDataCache() {
    this.nflDataService.clearCache();
  }
}
