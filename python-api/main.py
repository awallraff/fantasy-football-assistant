"""
NFL Data API Service
FastAPI service that wraps nfl_data_py for deployment on Railway/Render
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import nfl_data_py as nfl
import pandas as pd
from datetime import datetime

app = FastAPI(
    title="NFL Data API",
    description="API for fetching NFL player statistics using nfl_data_py",
    version="1.0.0"
)

# CORS middleware - restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NFLDataRequest(BaseModel):
    years: List[int]
    positions: List[str] = ["QB", "RB", "WR", "TE"]
    week: Optional[int] = None


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "service": "NFL Data API",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
def health_check():
    """Health check for Railway/Render"""
    return {"status": "ok"}


@app.get("/api/nfl-data/test")
def test_connection():
    """Test connection to nfl_data_py"""
    try:
        # Try fetching minimal data
        df = nfl.import_weekly_data([2024], ["QB"])
        player_count = len(df['player_id'].unique()) if not df.empty else 0

        return {
            "success": True,
            "message": f"Connection successful. Found {player_count} QB records.",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Test failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/api/nfl-data/extract")
def extract_nfl_data(
    years: str = Query(..., description="Comma-separated years (e.g., '2023,2024')"),
    positions: str = Query("QB,RB,WR,TE", description="Comma-separated positions"),
    week: Optional[int] = Query(None, description="Optional specific week number")
):
    """
    Extract NFL data based on parameters

    Example: /api/nfl-data/extract?years=2024&positions=QB,RB&week=1
    """
    try:
        # Parse parameters
        year_list = [int(y.strip()) for y in years.split(',')]
        position_list = [p.strip().upper() for p in positions.split(',')]

        print(f"Fetching data for years: {year_list}, positions: {position_list}, week: {week}")

        # Fetch weekly stats
        weekly_df = nfl.import_weekly_data(year_list, position_list)
        if week is not None:
            weekly_df = weekly_df[weekly_df['week'] == week]

        # Fetch seasonal stats
        seasonal_df = nfl.import_seasonal_data(year_list, position_list)

        # Fetch roster data
        roster_df = nfl.import_rosters(year_list)
        roster_df = roster_df[roster_df['position'].isin(position_list)]

        # Aggregate weekly stats into season totals
        agg_dict = {
            'fantasy_points': 'sum',
            'fantasy_points_ppr': 'sum',
            'passing_yards': 'sum',
            'passing_tds': 'sum',
            'interceptions': 'sum',
            'rushing_yards': 'sum',
            'rushing_tds': 'sum',
            'rushing_attempts': 'sum',
            'receiving_yards': 'sum',
            'receiving_tds': 'sum',
            'receptions': 'sum',
            'targets': 'sum'
        }

        aggregated_df = weekly_df.groupby(['player_id', 'player_name', 'position', 'team', 'season']).agg(agg_dict).reset_index()

        # Calculate team analytics
        team_analytics = calculate_team_analytics(aggregated_df)

        # Convert to JSON-serializable format
        weekly_stats = weekly_df.fillna(0).to_dict('records')
        seasonal_stats = seasonal_df.fillna(0).to_dict('records')
        aggregated_stats = aggregated_df.fillna(0).to_dict('records')
        player_info = roster_df.to_dict('records')

        return {
            "weekly_stats": weekly_stats,
            "seasonal_stats": seasonal_stats,
            "aggregated_season_stats": aggregated_stats,
            "player_info": player_info,
            "team_analytics": team_analytics,
            "metadata": {
                "years": year_list,
                "positions": position_list,
                "week": week,
                "extracted_at": datetime.utcnow().isoformat(),
                "total_weekly_records": len(weekly_stats),
                "total_seasonal_records": len(seasonal_stats),
                "total_aggregated_records": len(aggregated_stats),
                "total_players": len(roster_df['player_id'].unique()) if not roster_df.empty else 0,
                "total_teams": len(aggregated_df['team'].unique()) if not aggregated_df.empty else 0
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_team_analytics(aggregated_df: pd.DataFrame) -> List[dict]:
    """Calculate team-level analytics from aggregated player data"""
    if aggregated_df.empty:
        return []

    team_stats = aggregated_df.groupby('team').agg({
        'fantasy_points': 'sum',
        'fantasy_points_ppr': 'sum',
        'passing_yards': 'sum',
        'passing_tds': 'sum',
        'interceptions': 'sum',
        'rushing_yards': 'sum',
        'rushing_tds': 'sum',
        'rushing_attempts': 'sum',
        'receiving_yards': 'sum',
        'receiving_tds': 'sum',
        'receptions': 'sum',
        'targets': 'sum'
    }).reset_index()

    # Calculate derived metrics
    team_stats['yards_per_carry'] = team_stats['rushing_yards'] / team_stats['rushing_attempts'].replace(0, 1)
    team_stats['catch_rate'] = team_stats['receptions'] / team_stats['targets'].replace(0, 1)
    team_stats['yards_per_target'] = team_stats['receiving_yards'] / team_stats['targets'].replace(0, 1)

    # Position-specific fantasy points
    for pos in ['QB', 'RB', 'WR', 'TE']:
        pos_df = aggregated_df[aggregated_df['position'] == pos]
        pos_points = pos_df.groupby('team')['fantasy_points_ppr'].sum()
        team_stats[f'{pos.lower()}_fantasy_points'] = team_stats['team'].map(pos_points).fillna(0)

    # Touches and targets
    rb_df = aggregated_df[aggregated_df['position'] == 'RB']
    team_stats['rb_touches'] = team_stats['team'].map(
        rb_df.groupby('team').apply(lambda x: (x['rushing_attempts'] + x['receptions']).sum())
    ).fillna(0)

    wr_df = aggregated_df[aggregated_df['position'] == 'WR']
    team_stats['wr_targets'] = team_stats['team'].map(wr_df.groupby('team')['targets'].sum()).fillna(0)

    te_df = aggregated_df[aggregated_df['position'] == 'TE']
    team_stats['te_targets'] = team_stats['team'].map(te_df.groupby('team')['targets'].sum()).fillna(0)

    # Offensive identity
    total_yards = team_stats['passing_yards'] + team_stats['rushing_yards']
    team_stats['passing_percentage'] = (team_stats['passing_yards'] / total_yards.replace(0, 1)) * 100

    def classify_offense(pct):
        if pct > 60:
            return "Pass-Heavy"
        elif pct < 40:
            return "Run-Heavy"
        else:
            return "Balanced"

    team_stats['offensive_identity'] = team_stats['passing_percentage'].apply(classify_offense)

    # Fill NaN values
    team_stats = team_stats.fillna(0)

    return team_stats.to_dict('records')


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
