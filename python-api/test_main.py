"""
Unit tests for NFL Data API
Tests for data sanitization and validation functions
"""

import pytest
import pandas as pd
import numpy as np
from main import sanitize_dataframe, validate_nfl_data


class TestSanitizeDataframe:
    """Tests for sanitize_dataframe function"""

    def test_handles_inf_values(self):
        """Test that Inf values are replaced with 0"""
        df = pd.DataFrame({
            'value': [1.0, np.inf, -np.inf, 5.0],
            'name': ['a', 'b', 'c', 'd']
        })
        result, metrics = sanitize_dataframe(df, 'test_df')

        # Verify no Inf values remain
        assert not result['value'].isin([np.inf, -np.inf]).any()
        # Verify Inf was replaced with 0
        assert result['value'].tolist() == [1.0, 0.0, 0.0, 5.0]
        # Verify metrics tracked the Inf values
        assert metrics['inf_count'] == 2
        assert metrics['nan_count'] == 0

    def test_handles_nan_values(self):
        """Test that NaN values are replaced with 0"""
        df = pd.DataFrame({
            'value': [1.0, np.nan, 3.0, np.nan],
            'name': ['a', 'b', 'c', 'd']
        })
        result, metrics = sanitize_dataframe(df, 'test_df')

        # Verify no NaN values remain
        assert not result['value'].isna().any()
        # Verify NaN was replaced with 0
        assert result['value'].tolist() == [1.0, 0.0, 3.0, 0.0]
        # Verify metrics tracked the NaN values
        assert metrics['inf_count'] == 0
        assert metrics['nan_count'] == 2

    def test_handles_both_inf_and_nan(self):
        """Test handling of both Inf and NaN values"""
        df = pd.DataFrame({
            'value': [1.0, np.inf, np.nan, -np.inf, 5.0],
            'score': [100, np.nan, np.inf, 200, -np.inf]
        })
        result, metrics = sanitize_dataframe(df, 'test_df')

        # Verify no problematic values remain
        assert not result.isin([np.inf, -np.inf]).any().any()
        assert not result.isna().any().any()
        # Verify metrics
        assert metrics['inf_count'] == 4  # 2 Inf, 2 -Inf
        assert metrics['nan_count'] == 2

    def test_empty_dataframe(self):
        """Test that empty DataFrame is handled correctly"""
        df = pd.DataFrame()
        result, metrics = sanitize_dataframe(df, 'empty_df')

        assert result.empty
        assert metrics['inf_count'] == 0
        assert metrics['nan_count'] == 0

    def test_no_numeric_columns(self):
        """Test DataFrame with only string columns"""
        df = pd.DataFrame({
            'name': ['Alice', 'Bob', 'Charlie'],
            'position': ['QB', 'RB', 'WR']
        })
        result, metrics = sanitize_dataframe(df, 'string_df')

        # Should return unchanged
        assert result.equals(df)
        assert metrics['inf_count'] == 0
        assert metrics['nan_count'] == 0

    def test_preserves_valid_values(self):
        """Test that valid values are not modified"""
        df = pd.DataFrame({
            'value': [0.0, 1.5, -2.3, 100.0, -50.0],
            'count': [0, 1, 2, 3, 4]
        })
        result, metrics = sanitize_dataframe(df, 'valid_df')

        # DataFrame should be unchanged
        pd.testing.assert_frame_equal(result, df)
        assert metrics['inf_count'] == 0
        assert metrics['nan_count'] == 0


class TestValidateNFLData:
    """Tests for validate_nfl_data function"""

    def test_detects_inf_in_single_column(self, caplog):
        """Test that Inf values are detected and logged"""
        import logging
        caplog.set_level(logging.ERROR)

        df = pd.DataFrame({
            'yards': [100, np.inf, 200],
            'touchdowns': [1, 2, 3]
        })
        validate_nfl_data(df, 'test_data')

        # Check that error was logged
        assert 'UPSTREAM DATA QUALITY ISSUE' in caplog.text
        assert 'yards' in caplog.text
        assert '1 Inf values' in caplog.text

    def test_detects_inf_in_multiple_columns(self, caplog):
        """Test detection of Inf in multiple columns"""
        import logging
        caplog.set_level(logging.ERROR)

        df = pd.DataFrame({
            'yards': [np.inf, 200],
            'touchdowns': [1, np.inf],
            'receptions': [5, 10]
        })
        validate_nfl_data(df, 'test_data')

        # Should log errors for both columns
        assert caplog.text.count('UPSTREAM DATA QUALITY ISSUE') == 2

    def test_no_warning_for_clean_data(self, caplog):
        """Test that clean data produces no warnings"""
        import logging
        caplog.set_level(logging.ERROR)

        df = pd.DataFrame({
            'yards': [100, 200, 300],
            'touchdowns': [1, 2, 3]
        })
        validate_nfl_data(df, 'clean_data')

        # No errors should be logged
        assert 'UPSTREAM DATA QUALITY ISSUE' not in caplog.text

    def test_handles_empty_dataframe(self):
        """Test that empty DataFrame doesn't cause errors"""
        df = pd.DataFrame()
        # Should not raise exception
        validate_nfl_data(df, 'empty_df')

    def test_ignores_string_columns(self, caplog):
        """Test that string columns are ignored"""
        import logging
        caplog.set_level(logging.ERROR)

        df = pd.DataFrame({
            'name': ['Alice', 'Bob'],
            'position': ['QB', 'RB'],
            'yards': [100, 200]
        })
        validate_nfl_data(df, 'mixed_df')

        # No errors for string columns
        assert 'UPSTREAM DATA QUALITY ISSUE' not in caplog.text


class TestCalculateTeamAnalytics:
    """Tests for calculate_team_analytics function"""

    def test_empty_dataframe(self):
        """Test that empty DataFrame returns empty list"""
        from main import calculate_team_analytics
        df = pd.DataFrame()
        result = calculate_team_analytics(df)
        assert result == []

    def test_no_team_column(self):
        """Test that DataFrame without team column returns empty list"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'player_id': ['1', '2'],
            'fantasy_points': [10, 20]
        })
        result = calculate_team_analytics(df)
        assert result == []

    def test_basic_team_aggregation(self):
        """Test basic team-level aggregation"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'team': ['KC', 'KC', 'SF', 'SF'],
            'position': ['QB', 'RB', 'QB', 'WR'],
            'fantasy_points_ppr': [25.0, 15.0, 22.0, 18.0],
            'passing_yards': [300, 0, 280, 0],
            'rushing_yards': [10, 80, 5, 0]
        })

        result = calculate_team_analytics(df)

        assert len(result) == 2
        # KC should have 40 total fantasy points
        kc_stats = [r for r in result if r['team'] == 'KC'][0]
        assert kc_stats['fantasy_points_ppr'] == 40.0

        # SF should have 40 total fantasy points
        sf_stats = [r for r in result if r['team'] == 'SF'][0]
        assert sf_stats['fantasy_points_ppr'] == 40.0

    def test_division_by_zero_handled(self):
        """Test that division by zero is handled correctly with np.where"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'team': ['KC', 'SF'],
            'position': ['RB', 'RB'],
            'rushing_yards': [100, 0],
            'rushing_attempts': [20, 0],  # Zero attempts for SF
            'targets': [5, 0],  # Zero targets for SF
            'receptions': [3, 0],
            'receiving_yards': [30, 0]
        })

        result = calculate_team_analytics(df)

        # KC should have valid yards_per_carry
        kc_stats = [r for r in result if r['team'] == 'KC'][0]
        assert kc_stats['yards_per_carry'] == 5.0

        # SF should have 0.0 (not Inf) for yards_per_carry
        sf_stats = [r for r in result if r['team'] == 'SF'][0]
        assert sf_stats['yards_per_carry'] == 0.0
        assert sf_stats['catch_rate'] == 0.0
        assert sf_stats['yards_per_target'] == 0.0

    def test_offensive_identity_classification(self):
        """Test offensive identity classification"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'team': ['PASS_HEAVY', 'RUN_HEAVY', 'BALANCED'],
            'position': ['QB', 'RB', 'QB'],
            'passing_yards': [400, 150, 250],  # 80%, 30%, 50%
            'rushing_yards': [100, 350, 250]
        })

        result = calculate_team_analytics(df)

        pass_heavy = [r for r in result if r['team'] == 'PASS_HEAVY'][0]
        assert pass_heavy['offensive_identity'] == 'Pass-Heavy'
        assert pass_heavy['passing_percentage'] == 80.0

        run_heavy = [r for r in result if r['team'] == 'RUN_HEAVY'][0]
        assert run_heavy['offensive_identity'] == 'Run-Heavy'
        assert run_heavy['passing_percentage'] == 30.0

        balanced = [r for r in result if r['team'] == 'BALANCED'][0]
        assert balanced['offensive_identity'] == 'Balanced'
        assert balanced['passing_percentage'] == 50.0

    def test_position_specific_fantasy_points(self):
        """Test position-specific fantasy point tracking"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'team': ['KC', 'KC', 'KC', 'KC'],
            'position': ['QB', 'RB', 'WR', 'TE'],
            'fantasy_points_ppr': [25.0, 18.0, 15.0, 10.0]
        })

        result = calculate_team_analytics(df)

        kc_stats = result[0]
        assert kc_stats['qb_fantasy_points'] == 25.0
        assert kc_stats['rb_fantasy_points'] == 18.0
        assert kc_stats['wr_fantasy_points'] == 15.0
        assert kc_stats['te_fantasy_points'] == 10.0

    def test_handles_recent_team_column(self):
        """Test that recent_team column is used when team column is missing"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'recent_team': ['KC', 'SF'],
            'position': ['QB', 'QB'],
            'fantasy_points_ppr': [25.0, 22.0]
        })

        result = calculate_team_analytics(df)

        assert len(result) == 2
        assert result[0]['recent_team'] in ['KC', 'SF']
        assert result[1]['recent_team'] in ['KC', 'SF']

    def test_no_inf_in_output(self):
        """Test that calculate_team_analytics never produces Inf values"""
        from main import calculate_team_analytics
        df = pd.DataFrame({
            'team': ['KC'],
            'position': ['RB'],
            'rushing_yards': [100],
            'rushing_attempts': [0],  # Division by zero
            'targets': [0],
            'receptions': [0],
            'receiving_yards': [0],
            'passing_yards': [0],
            'rushing_yards': [0]
        })

        result = calculate_team_analytics(df)

        # Convert to DataFrame to check for Inf
        result_df = pd.DataFrame(result)
        numeric_cols = result_df.select_dtypes(include=[np.number])

        # No Inf values should exist
        assert not np.isinf(numeric_cols).any().any()


class TestIntegration:
    """Integration tests for combined functionality"""

    def test_sanitize_after_validation(self, caplog):
        """Test full workflow: validate then sanitize"""
        import logging
        caplog.set_level(logging.WARNING)

        df = pd.DataFrame({
            'yards': [100, np.inf, 200],
            'touchdowns': [1, 2, np.nan]
        })

        # Validate (should log warning)
        validate_nfl_data(df, 'upstream_data')
        assert 'UPSTREAM DATA QUALITY ISSUE' in caplog.text

        # Sanitize (should fix issues)
        result, metrics = sanitize_dataframe(df, 'cleaned_data')
        assert not result.isin([np.inf, -np.inf]).any().any()
        assert not result.isna().any().any()
        assert metrics['inf_count'] == 1
        assert metrics['nan_count'] == 1

    def test_division_by_zero_produces_inf(self):
        """Test that division by zero produces Inf (common source)"""
        df = pd.DataFrame({
            'yards': [100, 200, 300],
            'attempts': [10, 0, 15]
        })

        # This is what happens in calculate_team_analytics
        df['yards_per_attempt'] = df['yards'] / df['attempts']

        # Middle value should be Inf
        assert np.isinf(df['yards_per_attempt'].iloc[1])

        # Sanitization should fix it
        result, metrics = sanitize_dataframe(df, 'calc_df')
        assert result['yards_per_attempt'].iloc[1] == 0.0
        assert metrics['inf_count'] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
