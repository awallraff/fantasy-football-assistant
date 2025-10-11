"""
Test nflreadpy to verify 2025 data availability
"""
import nflreadpy as nfl

print("Testing nflreadpy for 2025 data availability...")
print("=" * 60)

# Test 1: Weekly stats for 2025
try:
    print("\n1. Testing weekly stats for 2025...")
    weekly_stats = nfl.load_player_stats(seasons=[2025], summary_level="week")
    print(f"   SUCCESS: Found {len(weekly_stats)} weekly records for 2025")
    print(f"   Columns: {list(weekly_stats.columns)[:10]}...")
    print(f"   Weeks available: {sorted(weekly_stats['week'].unique().to_list())}")
except Exception as e:
    print(f"   FAILED: {e}")

# Test 2: Seasonal stats for 2025
try:
    print("\n2. Testing seasonal stats for 2025...")
    seasonal_stats = nfl.load_player_stats(seasons=[2025], summary_level="reg")
    print(f"   SUCCESS: Found {len(seasonal_stats)} seasonal records for 2025")
    print(f"   Columns: {list(seasonal_stats.columns)[:10]}...")
except Exception as e:
    print(f"   FAILED: {e}")

# Test 3: Roster data for 2025
try:
    print("\n3. Testing roster data for 2025...")
    rosters = nfl.load_rosters(seasons=[2025])
    print(f"   SUCCESS: Found {len(rosters)} roster records for 2025")
    print(f"   Columns: {list(rosters.columns)[:10]}...")
    teams = rosters['team'].unique().to_list()
    print(f"   Teams: {len(teams)} teams")
except Exception as e:
    print(f"   FAILED: {e}")

# Test 4: Compare with 2024 data
try:
    print("\n4. Testing 2024 data for comparison...")
    weekly_2024 = nfl.load_player_stats(seasons=[2024], summary_level="week")
    print(f"   SUCCESS: 2024 weekly records: {len(weekly_2024)}")
    print(f"   Weeks available: {sorted(weekly_2024['week'].unique().to_list())}")
except Exception as e:
    print(f"   FAILED: {e}")

print("\n" + "=" * 60)
print("Conclusion:")
print("If 2025 weekly/seasonal stats are available, we can safely")
print("set LATEST_AVAILABLE_SEASON = 2025 after migrating to nflreadpy")
print("=" * 60)
