#!/usr/bin/env python3
"""
NFL Data Extractor using nflreadpy
Extracts player statistics for QB, RB, WR, TE positions from 2020-present
Now supports 2025 season data!
"""

import sys
import json
import argparse
from datetime import datetime
import warnings
import os
from contextlib import contextmanager

# Use nflreadpy (supports 2025 data)
import nflreadpy as nfl

# Suppress warnings
warnings.filterwarnings('ignore')

@contextmanager
def suppress_stdout():
    """Context manager to suppress stdout temporarily"""
    with open(os.devnull, "w") as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        try:
            yield
        finally:
            sys.stdout = old_stdout

def get_current_season():
    """Get the current NFL season year"""
    current_date = datetime.now()
    # NFL season typically starts in September
    if current_date.month >= 9:
        return current_date.year
    else:
        return current_date.year - 1

def extract_player_stats(years=None, positions=None, week=None):
    """
    Extract player statistics from NFL data

    Args:
        years: List of years to extract (default: current season only)
        positions: List of positions to extract (default: ['QB', 'RB', 'WR', 'TE'])
        week: Specific week to extract (optional)

    Returns:
        dict: Processed player statistics
    """
    if years is None:
        current_season = get_current_season()
        # Limit to current season only by default to reduce memory usage
        years = [current_season]

    if positions is None:
        positions = ['QB', 'RB', 'WR', 'TE']

    try:
        # Get weekly player stats using nflreadpy
        print(f"Fetching weekly stats for years: {years}", file=sys.stderr)
        with suppress_stdout():
            weekly_stats = nfl.load_player_stats(seasons=years, summary_level="week")

        # Convert from Polars to Pandas for compatibility with rest of code
        weekly_stats = weekly_stats.to_pandas()

        # Filter by positions
        if 'position' in weekly_stats.columns:
            weekly_stats = weekly_stats[weekly_stats['position'].isin(positions)]

        # Filter by specific week if provided
        if week is not None and 'week' in weekly_stats.columns:
            weekly_stats = weekly_stats[weekly_stats['week'] == week]

        # Get seasonal stats using nflreadpy
        print(f"Fetching seasonal stats for years: {years}", file=sys.stderr)
        with suppress_stdout():
            seasonal_stats = nfl.load_player_stats(seasons=years, summary_level="reg")

        # Convert from Polars to Pandas
        seasonal_stats = seasonal_stats.to_pandas()

        # Filter by positions
        if 'position' in seasonal_stats.columns:
            seasonal_stats = seasonal_stats[seasonal_stats['position'].isin(positions)]

        # Get player roster data using nflreadpy
        print(f"Fetching roster data for years: {years}", file=sys.stderr)
        with suppress_stdout():
            rosters = nfl.load_rosters(seasons=years)

        # Convert from Polars to Pandas
        rosters = rosters.to_pandas()

        # nflreadpy rosters use 'gsis_id' instead of 'player_id'
        # Rename for consistency with player stats
        if 'gsis_id' in rosters.columns and 'player_id' not in rosters.columns:
            rosters = rosters.rename(columns={'gsis_id': 'player_id'})

        # Filter by positions
        if 'position' in rosters.columns:
            rosters = rosters[rosters['position'].isin(positions)]

        # Create aggregated season stats from weekly data if needed
        aggregated_season_stats = []
        if not weekly_stats.empty and week is None:  # Only aggregate when looking at all weeks
            print(f"Aggregating weekly stats into season totals...", file=sys.stderr)
            aggregated_season_stats = aggregate_weekly_to_season(weekly_stats, rosters)

        # Get team-level analytics
        print(f"Calculating team analytics for years: {years}", file=sys.stderr)
        team_analytics = calculate_team_analytics(weekly_stats, seasonal_stats, rosters, aggregated_season_stats)

        # Process and combine data
        processed_data = {
            'weekly_stats': process_weekly_stats(weekly_stats),
            'seasonal_stats': process_seasonal_stats(seasonal_stats),
            'aggregated_season_stats': aggregated_season_stats,
            'player_info': process_player_info(rosters),
            'team_analytics': team_analytics,
            'metadata': {
                'years': years,
                'positions': positions,
                'week': week,
                'extracted_at': datetime.now().isoformat(),
                'total_weekly_records': len(weekly_stats),
                'total_seasonal_records': len(seasonal_stats),
                'total_aggregated_records': len(aggregated_season_stats),
                'total_players': len(rosters['player_id'].unique()) if not rosters.empty else 0,
                'total_teams': len(team_analytics),
                'data_source': 'nflreadpy'
            }
        }

        return processed_data

    except Exception as e:
        print(f"Error extracting NFL data: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            'error': str(e),
            'weekly_stats': [],
            'seasonal_stats': [],
            'player_info': [],
            'metadata': {
                'years': years,
                'positions': positions,
                'week': week,
                'extracted_at': datetime.now().isoformat(),
                'total_weekly_records': 0,
                'total_seasonal_records': 0,
                'total_players': 0,
                'data_source': 'nflreadpy'
            }
        }

def process_weekly_stats(df):
    """Process weekly statistics data with fantasy-focused metrics"""
    if df.empty:
        return []

    # Map column names (nflreadpy uses player_display_name)
    column_mapping = {}
    if 'player_display_name' in df.columns and 'player_name' not in df.columns:
        column_mapping['player_display_name'] = 'player_name'
    if 'recent_team' in df.columns and 'team' not in df.columns:
        column_mapping['recent_team'] = 'team'

    # Rename columns if needed
    df_processed = df.copy()
    if column_mapping:
        df_processed = df_processed.rename(columns=column_mapping)

    # Fantasy-focused relevant columns
    relevant_columns = [
        # Core identifiers
        'player_id', 'player_name', 'position', 'team', 'season', 'week',
        # Fantasy scoring
        'fantasy_points', 'fantasy_points_ppr',
        # Passing metrics (QB focus)
        'passing_yards', 'passing_tds', 'interceptions', 'attempts', 'completions',
        'passing_air_yards', 'passing_yards_after_catch', 'passing_first_downs',
        'passing_epa',
        # Rushing metrics (RB/QB focus)
        'rushing_yards', 'rushing_tds', 'carries', 'rushing_first_downs',
        'rushing_epa', 'rushing_yards_after_contact',
        # Receiving metrics (WR/TE/RB focus)
        'receiving_yards', 'receiving_tds', 'receptions', 'targets',
        'receiving_air_yards', 'receiving_yards_after_catch', 'receiving_first_downs',
        'receiving_epa', 'target_share',
        # Advanced metrics
        'wopr', 'special_teams_tds', 'racr'
    ]

    # Only include columns that exist in the dataframe
    available_columns = [col for col in relevant_columns if col in df_processed.columns]
    processed_df = df_processed[available_columns].fillna(0)

    # Add calculated fantasy metrics
    if 'targets' in processed_df.columns and 'receptions' in processed_df.columns:
        processed_df['catch_rate'] = processed_df.apply(
            lambda row: (row['receptions'] / row['targets'] * 100) if row['targets'] > 0 else 0, axis=1
        )

    if 'attempts' in processed_df.columns and 'completions' in processed_df.columns:
        processed_df['completion_rate'] = processed_df.apply(
            lambda row: (row['completions'] / row['attempts'] * 100) if row['attempts'] > 0 else 0, axis=1
        )

    return processed_df.to_dict('records')

def process_seasonal_stats(df):
    """Process seasonal statistics data with fantasy-focused metrics"""
    if df.empty:
        return []

    # Map column names
    column_mapping = {}
    if 'player_display_name' in df.columns and 'player_name' not in df.columns:
        column_mapping['player_display_name'] = 'player_name'
    if 'recent_team' in df.columns and 'team' not in df.columns:
        column_mapping['recent_team'] = 'team'

    # Rename columns if needed
    df_processed = df.copy()
    if column_mapping:
        df_processed = df_processed.rename(columns=column_mapping)

    # Fantasy-focused seasonal columns
    relevant_columns = [
        # Core identifiers
        'player_id', 'player_name', 'position', 'team', 'season',
        'games',
        # Fantasy scoring
        'fantasy_points', 'fantasy_points_ppr',
        # Passing metrics (QB focus)
        'passing_yards', 'passing_tds', 'interceptions', 'attempts', 'completions',
        'passing_air_yards', 'passing_yards_after_catch', 'passing_first_downs',
        'passing_epa', 'dakota',
        # Rushing metrics (RB/QB focus)
        'rushing_yards', 'rushing_tds', 'carries', 'rushing_first_downs',
        'rushing_epa', 'rushing_yards_after_contact',
        # Receiving metrics (WR/TE/RB focus)
        'receiving_yards', 'receiving_tds', 'receptions', 'targets',
        'receiving_air_yards', 'receiving_yards_after_catch', 'receiving_first_downs',
        'receiving_epa', 'target_share',
        # Advanced metrics
        'wopr', 'racr', 'special_teams_tds'
    ]

    # Only include columns that exist in the dataframe
    available_columns = [col for col in relevant_columns if col in df_processed.columns]
    processed_df = df_processed[available_columns].fillna(0)

    # Add calculated per-game and efficiency metrics
    games_col = 'games' if 'games' in processed_df.columns else None

    if games_col:
        # Per-game averages
        for stat in ['fantasy_points', 'fantasy_points_ppr', 'passing_yards', 'rushing_yards',
                    'receiving_yards', 'targets', 'receptions']:
            if stat in processed_df.columns:
                processed_df[f'{stat}_per_game'] = processed_df.apply(
                    lambda row: row[stat] / row[games_col] if row[games_col] > 0 else 0, axis=1
                )

    # Efficiency metrics
    if 'targets' in processed_df.columns and 'receptions' in processed_df.columns:
        processed_df['catch_rate'] = processed_df.apply(
            lambda row: (row['receptions'] / row['targets'] * 100) if row['targets'] > 0 else 0, axis=1
        )

    if 'attempts' in processed_df.columns and 'completions' in processed_df.columns:
        processed_df['completion_rate'] = processed_df.apply(
            lambda row: (row['completions'] / row['attempts'] * 100) if row['attempts'] > 0 else 0, axis=1
        )

    if 'carries' in processed_df.columns and 'rushing_yards' in processed_df.columns:
        processed_df['yards_per_carry'] = processed_df.apply(
            lambda row: row['rushing_yards'] / row['carries'] if row['carries'] > 0 else 0, axis=1
        )

    if 'targets' in processed_df.columns and 'receiving_yards' in processed_df.columns:
        processed_df['yards_per_target'] = processed_df.apply(
            lambda row: row['receiving_yards'] / row['targets'] if row['targets'] > 0 else 0, axis=1
        )

    return processed_df.to_dict('records')

def process_player_info(df):
    """Process player roster information"""
    if df.empty:
        return []

    # Map column names
    column_mapping = {}
    if 'full_name' in df.columns and 'player_name' not in df.columns:
        column_mapping['full_name'] = 'player_name'

    # Rename columns if needed
    df_processed = df.copy()
    if column_mapping:
        df_processed = df_processed.rename(columns=column_mapping)

    # Get most recent info for each player
    if 'season' in df_processed.columns:
        latest_info = df_processed.sort_values('season').groupby('player_id').last().reset_index()
    else:
        latest_info = df_processed.groupby('player_id').last().reset_index()

    relevant_columns = [
        'player_id', 'player_name', 'position', 'team', 'jersey_number',
        'height', 'weight', 'birth_date', 'college', 'season'
    ]

    # Only include columns that exist in the dataframe
    available_columns = [col for col in relevant_columns if col in latest_info.columns]
    processed_df = latest_info[available_columns].fillna('')

    return processed_df.to_dict('records')

def calculate_team_analytics(weekly_stats, seasonal_stats, rosters, aggregated_season_stats=None):
    """Calculate team-level offensive and defensive analytics"""
    import pandas as pd

    team_data = []

    if (weekly_stats.empty and seasonal_stats.empty) or rosters.empty:
        print("No data available for team analytics", file=sys.stderr)
        return team_data

    # Use aggregated seasonal stats if available, then seasonal, then weekly
    if aggregated_season_stats and len(aggregated_season_stats) > 0:
        data_source = pd.DataFrame(aggregated_season_stats)
        print(f"Using aggregated seasonal data with {len(data_source)} records", file=sys.stderr)
    elif not seasonal_stats.empty:
        data_source = seasonal_stats
        print(f"Using seasonal data with {len(data_source)} records", file=sys.stderr)
    else:
        data_source = weekly_stats
        print(f"Using weekly data with {len(data_source)} records", file=sys.stderr)

    # Get team information from rosters
    team_col = 'team' if 'team' in rosters.columns else None

    if not team_col:
        print("No team column found in roster data", file=sys.stderr)
        return team_data

    # Create player-to-team mapping
    player_teams = rosters[['player_id', team_col]].set_index('player_id')[team_col].to_dict()
    print(f"Found {len(player_teams)} player-team mappings", file=sys.stderr)

    # Add team info to data source
    data_source = data_source.copy()
    data_source['team'] = data_source['player_id'].map(player_teams)

    # Get unique teams
    teams = data_source['team'].dropna().unique()
    print(f"Found {len(teams)} unique teams", file=sys.stderr)

    for team in teams:
        if not team or team == '' or pd.isna(team):
            continue

        team_players = data_source[data_source['team'] == team]

        # Calculate offensive metrics
        offensive_stats = {
            'team': team,
            'total_fantasy_points': team_players['fantasy_points'].sum() if 'fantasy_points' in team_players.columns else 0,
            'total_fantasy_points_ppr': team_players['fantasy_points_ppr'].sum() if 'fantasy_points_ppr' in team_players.columns else 0,

            # Passing offense
            'passing_yards': team_players['passing_yards'].sum() if 'passing_yards' in team_players.columns else 0,
            'passing_tds': team_players['passing_tds'].sum() if 'passing_tds' in team_players.columns else 0,
            'interceptions_thrown': team_players['interceptions'].sum() if 'interceptions' in team_players.columns else 0,

            # Rushing offense
            'rushing_yards': team_players['rushing_yards'].sum() if 'rushing_yards' in team_players.columns else 0,
            'rushing_tds': team_players['rushing_tds'].sum() if 'rushing_tds' in team_players.columns else 0,
            'rushing_attempts': team_players['carries'].sum() if 'carries' in team_players.columns else 0,

            # Receiving offense
            'receiving_yards': team_players['receiving_yards'].sum() if 'receiving_yards' in team_players.columns else 0,
            'receiving_tds': team_players['receiving_tds'].sum() if 'receiving_tds' in team_players.columns else 0,
            'receptions': team_players['receptions'].sum() if 'receptions' in team_players.columns else 0,
            'targets': team_players['targets'].sum() if 'targets' in team_players.columns else 0,
        }

        # Calculate efficiency metrics
        if offensive_stats['rushing_attempts'] > 0:
            offensive_stats['yards_per_carry'] = offensive_stats['rushing_yards'] / offensive_stats['rushing_attempts']
        else:
            offensive_stats['yards_per_carry'] = 0

        if offensive_stats['targets'] > 0:
            offensive_stats['catch_rate'] = (offensive_stats['receptions'] / offensive_stats['targets']) * 100
            offensive_stats['yards_per_target'] = offensive_stats['receiving_yards'] / offensive_stats['targets']
        else:
            offensive_stats['catch_rate'] = 0
            offensive_stats['yards_per_target'] = 0

        # Get position info from rosters
        team_roster = rosters[rosters['team'] == team] if 'team' in rosters.columns else pd.DataFrame()
        player_positions = {}
        if not team_roster.empty:
            player_positions = team_roster.set_index('player_id')['position'].to_dict()

        # Add position info to team_players
        team_players_with_pos = team_players.copy()
        team_players_with_pos['position'] = team_players_with_pos['player_id'].map(player_positions)

        # Position breakdowns
        qb_stats = team_players_with_pos[team_players_with_pos['position'] == 'QB']
        rb_stats = team_players_with_pos[team_players_with_pos['position'] == 'RB']
        wr_stats = team_players_with_pos[team_players_with_pos['position'] == 'WR']
        te_stats = team_players_with_pos[team_players_with_pos['position'] == 'TE']

        offensive_stats.update({
            'qb_fantasy_points': qb_stats['fantasy_points_ppr'].sum() if 'fantasy_points_ppr' in qb_stats.columns and not qb_stats.empty else 0,
            'rb_fantasy_points': rb_stats['fantasy_points_ppr'].sum() if 'fantasy_points_ppr' in rb_stats.columns and not rb_stats.empty else 0,
            'wr_fantasy_points': wr_stats['fantasy_points_ppr'].sum() if 'fantasy_points_ppr' in wr_stats.columns and not wr_stats.empty else 0,
            'te_fantasy_points': te_stats['fantasy_points_ppr'].sum() if 'fantasy_points_ppr' in te_stats.columns and not te_stats.empty else 0,

            'rb_touches': ((rb_stats['carries'].sum() if 'carries' in rb_stats.columns and not rb_stats.empty else 0) +
                          (rb_stats['targets'].sum() if 'targets' in rb_stats.columns and not rb_stats.empty else 0)),
            'wr_targets': wr_stats['targets'].sum() if 'targets' in wr_stats.columns and not wr_stats.empty else 0,
            'te_targets': te_stats['targets'].sum() if 'targets' in te_stats.columns and not te_stats.empty else 0,
        })

        # Determine offensive identity
        total_offense = offensive_stats['passing_yards'] + offensive_stats['rushing_yards']
        if total_offense > 0:
            passing_pct = (offensive_stats['passing_yards'] / total_offense) * 100
            offensive_stats['offensive_identity'] = 'Pass-Heavy' if passing_pct > 60 else 'Run-Heavy' if passing_pct < 40 else 'Balanced'
            offensive_stats['passing_percentage'] = passing_pct
        else:
            offensive_stats['offensive_identity'] = 'Unknown'
            offensive_stats['passing_percentage'] = 0

        team_data.append(offensive_stats)

    return team_data

def aggregate_weekly_to_season(weekly_stats, rosters):
    """Aggregate weekly statistics into season totals"""
    import pandas as pd

    if weekly_stats.empty:
        return []

    print(f"Aggregating {len(weekly_stats)} weekly records...", file=sys.stderr)

    # Map column names for consistency
    column_mapping = {}
    if 'player_display_name' in weekly_stats.columns and 'player_name' not in weekly_stats.columns:
        column_mapping['player_display_name'] = 'player_name'

    df_processed = weekly_stats.copy()
    if column_mapping:
        df_processed = df_processed.rename(columns=column_mapping)

    # Get team and position info from rosters
    if not rosters.empty:
        player_info = rosters[['player_id', 'team', 'position']].drop_duplicates('player_id')
        df_processed = df_processed.merge(player_info, on='player_id', how='left', suffixes=('', '_roster'))
        # Use roster info if weekly data doesn't have team/position
        if 'team_roster' in df_processed.columns:
            df_processed['team'] = df_processed['team'].fillna(df_processed['team_roster'])
        if 'position_roster' in df_processed.columns:
            df_processed['position'] = df_processed['position'].fillna(df_processed['position_roster'])

    # Define stats to sum
    sum_stats = [
        'fantasy_points', 'fantasy_points_ppr',
        'passing_yards', 'passing_tds', 'interceptions', 'attempts', 'completions',
        'rushing_yards', 'rushing_tds', 'carries',
        'receiving_yards', 'receiving_tds', 'receptions', 'targets',
        'passing_first_downs', 'rushing_first_downs', 'receiving_first_downs'
    ]

    # Group by player and season, sum the stats
    groupby_cols = ['player_id', 'season']
    if 'player_name' in df_processed.columns:
        groupby_cols.append('player_name')
    if 'position' in df_processed.columns:
        groupby_cols.append('position')
    if 'team' in df_processed.columns:
        groupby_cols.append('team')

    # Get available sum stats
    available_sum_stats = [stat for stat in sum_stats if stat in df_processed.columns]

    # Aggregate the data
    agg_dict = {stat: 'sum' for stat in available_sum_stats}
    agg_dict['week'] = 'count'  # Count games played

    aggregated = df_processed.groupby(groupby_cols, as_index=False).agg(agg_dict)
    aggregated = aggregated.rename(columns={'week': 'games'})

    # Calculate per-game averages and efficiency metrics
    if not aggregated.empty:
        # Per-game averages
        for stat in available_sum_stats:
            if stat in aggregated.columns:
                aggregated[f'{stat}_per_game'] = aggregated[stat] / aggregated['games']

        # Efficiency metrics
        if 'targets' in aggregated.columns and 'receptions' in aggregated.columns:
            aggregated['catch_rate'] = (aggregated['receptions'] / aggregated['targets'] * 100).fillna(0)

        if 'attempts' in aggregated.columns and 'completions' in aggregated.columns:
            aggregated['completion_rate'] = (aggregated['completions'] / aggregated['attempts'] * 100).fillna(0)

        if 'carries' in aggregated.columns and 'rushing_yards' in aggregated.columns:
            aggregated['yards_per_carry'] = (aggregated['rushing_yards'] / aggregated['carries']).fillna(0)

        if 'targets' in aggregated.columns and 'receiving_yards' in aggregated.columns:
            aggregated['yards_per_target'] = (aggregated['receiving_yards'] / aggregated['targets']).fillna(0)

        if 'receptions' in aggregated.columns and 'receiving_yards' in aggregated.columns:
            aggregated['yards_per_reception'] = (aggregated['receiving_yards'] / aggregated['receptions']).fillna(0)

    print(f"Created {len(aggregated)} aggregated season records", file=sys.stderr)
    return aggregated.fillna(0).to_dict('records')

def main():
    parser = argparse.ArgumentParser(description='Extract NFL player data using nflreadpy')
    parser.add_argument('--years', nargs='+', type=int, help='Years to extract (default: current season)')
    parser.add_argument('--positions', nargs='+', default=['QB', 'RB', 'WR', 'TE'],
                       help='Positions to extract (default: QB RB WR TE)')
    parser.add_argument('--week', type=int, help='Specific week to extract')
    parser.add_argument('--output', type=str, help='Output file path (default: stdout)')

    args = parser.parse_args()

    # Extract data
    data = extract_player_stats(years=args.years, positions=args.positions, week=args.week)

    # Output results
    json_output = json.dumps(data, indent=2, default=str)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(json_output)
        print(f"Data saved to {args.output}", file=sys.stderr)
    else:
        print(json_output)

if __name__ == "__main__":
    main()
