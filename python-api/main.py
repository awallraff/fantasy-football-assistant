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
        # Try fetching minimal data - import_weekly_data doesn't take positions parameter
        df = nfl.import_weekly_data([2024])

        # Filter for QBs
        if not df.empty and 'position' in df.columns:
            qb_df = df[df['position'] == 'QB']
            player_count = len(qb_df['player_id'].unique()) if not qb_df.empty else 0
        else:
            player_count = 0

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

        # Fetch weekly stats - import_weekly_data doesn't take positions parameter
        weekly_df = nfl.import_weekly_data(year_list)
        # Filter by position
        if not weekly_df.empty and 'position' in weekly_df.columns:
            weekly_df = weekly_df[weekly_df['position'].isin(position_list)]
        if week is not None:
            weekly_df = weekly_df[weekly_df['week'] == week]

        # Fetch seasonal stats - import_seasonal_data doesn't take positions parameter
        seasonal_df = nfl.import_seasonal_data(year_list)
        # Filter by position
        if not seasonal_df.empty and 'position' in seasonal_df.columns:
            seasonal_df = seasonal_df[seasonal_df['position'].isin(position_list)]

        # Fetch roster data - use import_seasonal_rosters (correct function name)
        roster_df = nfl.import_seasonal_rosters(year_list)
        if not roster_df.empty and 'position' in roster_df.columns:
            roster_df = roster_df[roster_df['position'].isin(position_list)]

        # Aggregate weekly stats into season totals
        # Only aggregate columns that exist in the dataframe
        available_cols = weekly_df.columns.tolist()

        agg_dict = {}
        for col in ['fantasy_points', 'fantasy_points_ppr', 'passing_yards', 'passing_tds',
                    'interceptions', 'rushing_yards', 'rushing_tds', 'rushing_attempts',
                    'receiving_yards', 'receiving_tds', 'receptions', 'targets']:
            if col in available_cols:
                agg_dict[col] = 'sum'

        # Determine groupby columns based on what's available
        groupby_cols = ['player_id']
        for col in ['player_name', 'player_display_name', 'position', 'recent_team', 'team', 'season']:
            if col in available_cols:
                groupby_cols.append(col)

        # Only aggregate if we have data
        if not weekly_df.empty and agg_dict:
            aggregated_df = weekly_df.groupby(groupby_cols).agg(agg_dict).reset_index()
        else:
            aggregated_df = pd.DataFrame()

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
                "total_teams": len(aggregated_df['team'].unique()) if not aggregated_df.empty and 'team' in aggregated_df.columns else (len(aggregated_df['recent_team'].unique()) if not aggregated_df.empty and 'recent_team' in aggregated_df.columns else 0)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_team_analytics(aggregated_df: pd.DataFrame) -> List[dict]:
    """Calculate team-level analytics from aggregated player data"""
    if aggregated_df.empty:
        return []

    # Determine team column name (could be 'team' or 'recent_team')
    team_col = None
    if 'team' in aggregated_df.columns:
        team_col = 'team'
    elif 'recent_team' in aggregated_df.columns:
        team_col = 'recent_team'
    else:
        return []  # No team column available

    # Build aggregation dictionary based on available columns
    available_cols = aggregated_df.columns.tolist()
    agg_dict = {}

    stat_columns = [
        'fantasy_points', 'fantasy_points_ppr', 'passing_yards', 'passing_tds',
        'interceptions', 'rushing_yards', 'rushing_tds', 'rushing_attempts',
        'receiving_yards', 'receiving_tds', 'receptions', 'targets'
    ]

    for col in stat_columns:
        if col in available_cols:
            agg_dict[col] = 'sum'

    # If no stat columns available, return empty
    if not agg_dict:
        return []

    # Perform aggregation only on available columns
    team_stats = aggregated_df.groupby(team_col).agg(agg_dict).reset_index()

    # Calculate derived metrics only if base columns exist
    if 'rushing_yards' in team_stats.columns and 'rushing_attempts' in team_stats.columns:
        team_stats['yards_per_carry'] = team_stats['rushing_yards'] / team_stats['rushing_attempts'].replace(0, 1)

    if 'receptions' in team_stats.columns and 'targets' in team_stats.columns:
        team_stats['catch_rate'] = team_stats['receptions'] / team_stats['targets'].replace(0, 1)

    if 'receiving_yards' in team_stats.columns and 'targets' in team_stats.columns:
        team_stats['yards_per_target'] = team_stats['receiving_yards'] / team_stats['targets'].replace(0, 1)

    # Position-specific fantasy points
    for pos in ['QB', 'RB', 'WR', 'TE']:
        pos_df = aggregated_df[aggregated_df['position'] == pos]
        if not pos_df.empty and 'fantasy_points_ppr' in pos_df.columns:
            pos_points = pos_df.groupby(team_col)['fantasy_points_ppr'].sum()
            team_stats[f'{pos.lower()}_fantasy_points'] = team_stats[team_col].map(pos_points).fillna(0)

    # Touches and targets
    rb_df = aggregated_df[aggregated_df['position'] == 'RB']
    if not rb_df.empty and 'rushing_attempts' in rb_df.columns and 'receptions' in rb_df.columns:
        team_stats['rb_touches'] = team_stats[team_col].map(
            rb_df.groupby(team_col).apply(lambda x: (x['rushing_attempts'] + x['receptions']).sum())
        ).fillna(0)

    wr_df = aggregated_df[aggregated_df['position'] == 'WR']
    if not wr_df.empty and 'targets' in wr_df.columns:
        team_stats['wr_targets'] = team_stats[team_col].map(wr_df.groupby(team_col)['targets'].sum()).fillna(0)

    te_df = aggregated_df[aggregated_df['position'] == 'TE']
    if not te_df.empty and 'targets' in te_df.columns:
        team_stats['te_targets'] = team_stats[team_col].map(te_df.groupby(team_col)['targets'].sum()).fillna(0)

    # Offensive identity - only if passing and rushing yards exist
    if 'passing_yards' in team_stats.columns and 'rushing_yards' in team_stats.columns:
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
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
