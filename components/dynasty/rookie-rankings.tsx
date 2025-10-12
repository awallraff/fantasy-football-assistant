'use client';

/**
 * Rookie Rankings Component
 *
 * Displays dynasty rookie rankings with mobile-first responsive design.
 * Features:
 * - Mobile card view / Desktop table view
 * - Filter by position, tier, landing spot
 * - Sort by consensus rank, NFL draft capital, upside
 * - Click to view detailed player profile
 */

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  RookiePlayer,
  RookieFilterOptions,
  RookieSortOption,
  RookieDraftClass,
} from '@/lib/dynasty/rookie-draft-types';
import {
  getRookieDraftClass,
  filterRookies,
  sortRookies,
} from '@/lib/dynasty/rookie-data-service';

// ============================================================================
// Component Props
// ============================================================================

export interface RookieRankingsProps {
  /** Year of rookie class to display */
  year?: number;

  /** Callback when player is clicked */
  onPlayerClick?: (player: RookiePlayer) => void;

  /** Show filters */
  showFilters?: boolean;

  /** Compact mode (fewer details) */
  compact?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function RookieRankings({
  year = 2025,
  onPlayerClick,
  showFilters = true,
  compact = false,
}: RookieRankingsProps) {
  // Load rookie class data
  const [draftClass, setDraftClass] = useState<RookieDraftClass | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter and sort state
  const [filters, setFilters] = useState<RookieFilterOptions>({});
  const [sortBy, setSortBy] = useState<RookieSortOption>('consensus-rank');

  // Fetch rookie data on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getRookieDraftClass(year)
      .then((data) => {
        if (mounted) {
          setDraftClass(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading rookie draft class:', err);
        if (mounted) {
          setDraftClass({ year, players: [], rankings: [], updatedAt: new Date(), sources: [] });
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [year]);

  // Apply filters and sorting
  const filteredAndSortedRookies = useMemo(() => {
    if (!draftClass) return [];
    let result = filterRookies(draftClass.players, filters);
    result = sortRookies(result, sortBy);
    return result;
  }, [draftClass, filters, sortBy]);

  // Filter handlers
  const handlePositionFilter = (value: string) => {
    if (value === 'all') {
      setFilters((prev) => ({ ...prev, position: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, position: [value] }));
    }
  };

  const handleTierFilter = (value: string) => {
    if (value === 'all') {
      setFilters((prev) => ({ ...prev, tier: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, tier: [parseInt(value)] }));
    }
  };

  const handleLandingSpotFilter = (value: string) => {
    if (value === 'all') {
      setFilters((prev) => ({ ...prev, landingSpotGrade: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, landingSpotGrade: [value] }));
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as RookieSortOption);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{year} Rookie Rankings</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading rookie rankings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{year} Rookie Rankings</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedRookies.length} players
            {filters.position && ` • ${filters.position[0]}`}
            {filters.tier && ` • Tier ${filters.tier[0]}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Position Filter */}
          <Select onValueChange={handlePositionFilter} defaultValue="all">
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="QB">QB</SelectItem>
              <SelectItem value="RB">RB</SelectItem>
              <SelectItem value="WR">WR</SelectItem>
              <SelectItem value="TE">TE</SelectItem>
            </SelectContent>
          </Select>

          {/* Tier Filter */}
          <Select onValueChange={handleTierFilter} defaultValue="all">
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="1">Tier 1 (Elite)</SelectItem>
              <SelectItem value="2">Tier 2 (Premium)</SelectItem>
              <SelectItem value="3">Tier 3 (Solid)</SelectItem>
              <SelectItem value="4">Tier 4 (Depth)</SelectItem>
              <SelectItem value="5">Tier 5 (Lottery)</SelectItem>
            </SelectContent>
          </Select>

          {/* Landing Spot Filter */}
          <Select onValueChange={handleLandingSpotFilter} defaultValue="all">
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Landing Spot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Landing Spots</SelectItem>
              <SelectItem value="A+">A+ (Elite)</SelectItem>
              <SelectItem value="A">A (Great)</SelectItem>
              <SelectItem value="A-">A- (Good)</SelectItem>
              <SelectItem value="B+">B+ (Above Average)</SelectItem>
              <SelectItem value="B">B (Average)</SelectItem>
              <SelectItem value="B-">B- (Below Average)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select onValueChange={handleSortChange} defaultValue="consensus-rank">
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consensus-rank">Consensus Rank</SelectItem>
              <SelectItem value="nfl-draft-capital">NFL Draft Capital</SelectItem>
              <SelectItem value="upside">Upside (Year 3)</SelectItem>
              <SelectItem value="landing-spot">Landing Spot</SelectItem>
              <SelectItem value="position-rank">Position Rank</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {filteredAndSortedRookies.map((player) => (
          <Card
            key={player.player_id}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onPlayerClick?.(player)}
          >
            <div className="space-y-2">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">#{player.consensusRank}</span>
                    <span className="font-medium">{player.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline">{player.position}</Badge>
                    <span>{player.team}</span>
                    {player.college && (
                      <>
                        <span>•</span>
                        <span>{typeof player.college === 'string' ? player.college : player.college.school}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  className="flex-shrink-0"
                  variant={player.tier === 1 ? 'default' : player.tier === 2 ? 'secondary' : 'outline'}
                >
                  Tier {player.tier}
                </Badge>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">NFL Pick</div>
                  <div className="font-medium">
                    {player.nflDraft.round}.{player.nflDraft.overallPick}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Landing Spot</div>
                  <div className="font-medium">{player.landingSpotGrade}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Year 3 PPG</div>
                  <div className="font-medium">{player.projection.year3PPG}</div>
                </div>
              </div>

              {/* Projection Row */}
              {!compact && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Ceiling:</span> {player.projection.ceiling}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Rank</th>
              <th className="text-left p-3 font-medium">Player</th>
              <th className="text-left p-3 font-medium">Pos</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="text-left p-3 font-medium">College</th>
              <th className="text-left p-3 font-medium">NFL Pick</th>
              <th className="text-left p-3 font-medium">Tier</th>
              <th className="text-left p-3 font-medium">Landing Spot</th>
              <th className="text-right p-3 font-medium">Year 3 PPG</th>
              {!compact && <th className="text-left p-3 font-medium">Ceiling</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRookies.map((player, index) => (
              <tr
                key={player.player_id}
                className={`border-b cursor-pointer hover:bg-accent transition-colors ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                }`}
                onClick={() => onPlayerClick?.(player)}
              >
                <td className="p-3 font-semibold">#{player.consensusRank}</td>
                <td className="p-3 font-medium">{player.full_name}</td>
                <td className="p-3">
                  <Badge variant="outline">{player.position}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{player.team}</td>
                <td className="p-3 text-muted-foreground">
                  {player.college ? (typeof player.college === 'string' ? player.college : player.college.school) : 'N/A'}
                </td>
                <td className="p-3">
                  R{player.nflDraft.round}, #{player.nflDraft.overallPick}
                </td>
                <td className="p-3">
                  <Badge
                    variant={player.tier === 1 ? 'default' : player.tier === 2 ? 'secondary' : 'outline'}
                  >
                    Tier {player.tier}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      player.landingSpotGrade.startsWith('A')
                        ? 'default'
                        : player.landingSpotGrade.startsWith('B')
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {player.landingSpotGrade}
                  </Badge>
                </td>
                <td className="p-3 text-right font-medium">{player.projection.year3PPG}</td>
                {!compact && (
                  <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {player.projection.ceiling}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAndSortedRookies.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No rookies found matching your filters.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setFilters({})}
          >
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
