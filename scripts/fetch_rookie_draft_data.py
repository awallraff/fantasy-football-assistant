#!/usr/bin/env python3
"""
2025 NFL Rookie Draft Data Fetcher

This script fetches real 2025 NFL Draft data including:
- Draft picks (round, overall pick, team)
- Current roster status (active, practice squad, IR)
- Current season performance data (if available)
- Player biographical information

Data Sources:
- nfl_data_py.import_draft_picks() - 2025 NFL Draft results
- nfl_data_py.import_seasonal_rosters() - Current roster status
- nfl_data_py.import_weekly_data() - Performance data (2025 season)
"""

import sys
import json
import argparse
import pandas as pd
import nfl_data_py as nfl
from datetime import datetime
import warnings
import os
from contextlib import contextmanager

# Suppress pandas warnings
warnings.filterwarnings('ignore')
pd.options.mode.chained_assignment = None

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

def fetch_2025_draft_data():
    """
    Fetch complete 2025 NFL Draft data

    Returns:
        dict: Complete rookie draft class data
    """
    try:
        # Fetch 2025 NFL Draft picks
        print("Fetching 2025 NFL Draft data...", file=sys.stderr)
        with suppress_stdout():
            draft_picks = nfl.import_draft_picks([2025])

        if draft_picks.empty:
            print("WARNING: No 2025 draft data available yet", file=sys.stderr)
            return create_fallback_data()

        # Filter to top 3 rounds (most fantasy-relevant rookies)
        top_picks = draft_picks[draft_picks['round'] <= 3].copy()
        print(f"Found {len(top_picks)} picks in rounds 1-3", file=sys.stderr)

        # Fetch 2025 roster data for current team info
        print("Fetching 2025 roster data...", file=sys.stderr)
        with suppress_stdout():
            rosters_2025 = nfl.import_seasonal_rosters([2025])

        # Fetch 2025 weekly stats (if season has started)
        print("Fetching 2025 weekly performance data...", file=sys.stderr)
        weekly_stats = pd.DataFrame()
        try:
            with suppress_stdout():
                weekly_stats = nfl.import_weekly_data([2025])
            print(f"Found {len(weekly_stats)} weekly stat records", file=sys.stderr)
        except Exception as e:
            print(f"Note: 2025 weekly data not available yet: {str(e)}", file=sys.stderr)

        # Fetch 2025 seasonal stats
        print("Fetching 2025 seasonal stats...", file=sys.stderr)
        seasonal_stats = pd.DataFrame()
        try:
            with suppress_stdout():
                seasonal_stats = nfl.import_seasonal_data([2025])
            print(f"Found {len(seasonal_stats)} seasonal stat records", file=sys.stderr)
        except Exception as e:
            print(f"Note: 2025 seasonal data not available yet: {str(e)}", file=sys.stderr)

        # Process and combine all data
        rookies = process_rookie_data(top_picks, rosters_2025, weekly_stats, seasonal_stats)

        result = {
            'year': 2025,
            'rookies': rookies,
            'metadata': {
                'total_rookies': len(rookies),
                'total_draft_picks': len(top_picks),
                'has_performance_data': not weekly_stats.empty,
                'has_roster_data': not rosters_2025.empty,
                'fetched_at': datetime.now().isoformat(),
                'positions': list(set([r['position'] for r in rookies])),
                'teams': list(set([r['nfl_team'] for r in rookies]))
            }
        }

        return result

    except Exception as e:
        print(f"Error fetching 2025 draft data: {str(e)}", file=sys.stderr)
        return {
            'error': str(e),
            'year': 2025,
            'rookies': [],
            'metadata': {
                'total_rookies': 0,
                'fetched_at': datetime.now().isoformat()
            }
        }

def process_rookie_data(draft_picks, rosters, weekly_stats, seasonal_stats):
    """
    Process and combine draft, roster, and performance data

    Args:
        draft_picks: DataFrame of 2025 draft picks
        rosters: DataFrame of 2025 rosters
        weekly_stats: DataFrame of 2025 weekly stats
        seasonal_stats: DataFrame of 2025 seasonal stats

    Returns:
        list: Processed rookie player data
    """
    rookies = []

    # Filter draft picks to fantasy-relevant positions
    fantasy_positions = ['QB', 'RB', 'WR', 'TE']

    for _, pick in draft_picks.iterrows():
        # Get basic draft info
        player_id = pick.get('pfr_id') or pick.get('player_id') or pick.get('gsis_id')
        player_name = pick.get('pfr_player_name') or pick.get('player_name')
        position = pick.get('position', 'UNKNOWN')
        team = pick.get('team', 'TBD')

        # Skip non-fantasy positions
        if position not in fantasy_positions:
            continue

        # Get college info
        college = pick.get('college', 'Unknown')

        # Get additional player info from rosters
        roster_info = {}
        if not rosters.empty and player_id:
            player_roster = rosters[rosters['player_id'] == player_id]
            if not player_roster.empty:
                roster_row = player_roster.iloc[0]
                roster_info = {
                    'height': roster_row.get('height', ''),
                    'weight': roster_row.get('weight', 0),
                    'age': roster_row.get('age', 0),
                    'jersey_number': roster_row.get('jersey_number'),
                    'status': roster_row.get('status', 'ACT'),  # ACT, IR, PS, etc.
                    'depth_chart_position': roster_row.get('depth_chart_position')
                }

        # Get performance data
        performance = get_player_performance(player_id, player_name, weekly_stats, seasonal_stats)

        # Calculate landing spot grade based on team situation
        landing_spot_grade = calculate_landing_spot_grade(position, team, rosters)

        # Build rookie object
        rookie = {
            'player_id': player_id or f"draft_2025_{pick.get('pick', 0)}",
            'player_name': player_name,
            'position': position,
            'nfl_team': team,
            'college': college,
            'draft_capital': {
                'year': 2025,
                'round': int(pick.get('round', 0)),
                'overall_pick': int(pick.get('pick', 0)),
                'team': team
            },
            'physical': {
                'height': roster_info.get('height', ''),
                'weight': roster_info.get('weight', 0),
                'age': roster_info.get('age', 0)
            },
            'roster_status': {
                'status': roster_info.get('status', 'Unknown'),
                'depth_chart': roster_info.get('depth_chart_position'),
                'jersey_number': roster_info.get('jersey_number')
            },
            'performance': performance,
            'landing_spot_grade': landing_spot_grade,
            'is_active': roster_info.get('status') == 'ACT'
        }

        rookies.append(rookie)

    # Sort by draft capital (round, then pick)
    rookies.sort(key=lambda x: (x['draft_capital']['round'], x['draft_capital']['overall_pick']))

    print(f"Processed {len(rookies)} fantasy-relevant rookies", file=sys.stderr)
    return rookies

def get_player_performance(player_id, player_name, weekly_stats, seasonal_stats):
    """Get player performance data from 2025 season"""
    performance = {
        'games_played': 0,
        'stats': {},
        'weekly_stats': []
    }

    if weekly_stats.empty:
        return performance

    # Try to match by player_id first, then by name
    player_weekly = pd.DataFrame()
    if player_id:
        player_weekly = weekly_stats[weekly_stats['player_id'] == player_id]

    if player_weekly.empty and player_name:
        # Try name matching
        name_col = 'player_name' if 'player_name' in weekly_stats.columns else 'player_display_name'
        player_weekly = weekly_stats[weekly_stats[name_col] == player_name]

    if not player_weekly.empty:
        performance['games_played'] = len(player_weekly)

        # Aggregate stats
        stat_columns = [
            'fantasy_points', 'fantasy_points_ppr',
            'passing_yards', 'passing_tds', 'interceptions',
            'rushing_yards', 'rushing_tds', 'rushing_attempts',
            'receiving_yards', 'receiving_tds', 'receptions', 'targets'
        ]

        for stat in stat_columns:
            if stat in player_weekly.columns:
                performance['stats'][stat] = float(player_weekly[stat].sum())

        # Add snap count and usage data if available
        if 'snap_count_pct' in player_weekly.columns:
            performance['stats']['avg_snap_pct'] = float(player_weekly['snap_count_pct'].mean())

        if 'target_share' in player_weekly.columns:
            performance['stats']['avg_target_share'] = float(player_weekly['target_share'].mean())

        # Store weekly breakdown (latest 4 weeks)
        recent_weeks = player_weekly.tail(4)
        for _, week in recent_weeks.iterrows():
            performance['weekly_stats'].append({
                'week': int(week.get('week', 0)),
                'fantasy_points_ppr': float(week.get('fantasy_points_ppr', 0)),
                'snap_pct': float(week.get('snap_count_pct', 0)) if 'snap_count_pct' in week else None
            })

    return performance

def calculate_landing_spot_grade(position, team, rosters):
    """
    Calculate landing spot grade based on team situation

    This is a simplified grading system. In production, you would:
    - Analyze team depth charts
    - Consider offensive scheme fit
    - Evaluate target competition
    - Factor in coaching staff
    """
    # Default grades (simplified - would need real analysis)
    # This should be updated with actual team analysis

    # For now, return a baseline grade
    # In production, analyze rosters to see competition at position
    if not rosters.empty:
        team_roster = rosters[rosters['team'] == team]
        if not team_roster.empty:
            # Check position competition
            position_players = team_roster[team_roster['position'] == position]
            if len(position_players) <= 2:
                return 'A'  # Light competition
            elif len(position_players) <= 4:
                return 'B'  # Moderate competition
            else:
                return 'C'  # Heavy competition

    return 'B'  # Default

def create_fallback_data():
    """Create fallback data if 2025 draft data not available"""
    return {
        'year': 2025,
        'rookies': [],
        'metadata': {
            'total_rookies': 0,
            'error': '2025 NFL Draft data not yet available in nfl_data_py',
            'fetched_at': datetime.now().isoformat()
        }
    }

def main():
    parser = argparse.ArgumentParser(description='Fetch 2025 NFL Rookie Draft Data')
    parser.add_argument('--output', type=str, help='Output file path (default: stdout)')
    parser.add_argument('--year', type=int, default=2025, help='Draft year (default: 2025)')

    args = parser.parse_args()

    # Fetch data
    data = fetch_2025_draft_data()

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
