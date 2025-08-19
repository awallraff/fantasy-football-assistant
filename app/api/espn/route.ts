import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season') || '2025';

  // Try multiple seasons if 2025 doesn't work
  const seasonsToTry = ['2024', '2023'];
  if (season === '2025') {
    seasonsToTry.unshift('2025');
  }

  let lastError = null;

  for (const currentSeason of seasonsToTry) {
    const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${currentSeason}/players?view=players_wl`;
    
    try {
      console.log(`Trying ESPN API for season: ${currentSeason}`);
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://fantasy.espn.com/',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`ESPN API success for season ${currentSeason}: Found ${data.players?.length || 0} players`);
        // Add season info to response
        return NextResponse.json({ ...data, season: currentSeason });
      } else {
        console.log(`ESPN API failed for season ${currentSeason}: ${response.status}`);
        lastError = `ESPN API error: ${response.status}`;
        continue;
      }
    } catch (error) {
      console.log(`ESPN API error for season ${currentSeason}:`, error);
      lastError = error instanceof Error ? error.message : 'Unknown error';
      continue;
    }
  }

  // If all seasons failed, return error
  return NextResponse.json({ 
    error: lastError || 'ESPN API unavailable',
    details: `Tried seasons: ${seasonsToTry.join(', ')}`,
    note: 'ESPN API may be restricted or unavailable'
  }, { status: 503 });
}