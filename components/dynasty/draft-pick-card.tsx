'use client';

/**
 * Draft Pick Card Component
 *
 * Displays a draft pick with its calculated valuation, tier badge,
 * and contextual information in a mobile-responsive card layout.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type DraftPick,
  type PickValuation,
  valuateDraftPick,
  DEFAULT_VALUATION_CONFIG,
  type ValuationConfig,
} from '@/lib/dynasty/draft-pick-valuation';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface DraftPickCardProps {
  /** The draft pick to display */
  pick: DraftPick;

  /** Optional custom valuation config (defaults to standard league) */
  config?: ValuationConfig;

  /** Show detailed breakdown? */
  showDetails?: boolean;

  /** Compact mode for smaller displays */
  compact?: boolean;

  /** Optional click handler */
  onClick?: (pick: DraftPick, valuation: PickValuation) => void;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// Styling Helpers
// ============================================================================

/**
 * Get badge color based on tier
 */
function getTierColor(tier: PickValuation['tier']): string {
  const colors: Record<PickValuation['tier'], string> = {
    elite: 'bg-purple-600 text-white hover:bg-purple-700',
    premium: 'bg-blue-600 text-white hover:bg-blue-700',
    solid: 'bg-green-600 text-white hover:bg-green-700',
    depth: 'bg-yellow-600 text-white hover:bg-yellow-700',
    lottery: 'bg-gray-600 text-white hover:bg-gray-700',
  };
  return colors[tier];
}

/**
 * Get tier label
 */
function getTierLabel(tier: PickValuation['tier']): string {
  const labels: Record<PickValuation['tier'], string> = {
    elite: 'Elite',
    premium: 'Premium',
    solid: 'Solid',
    depth: 'Depth',
    lottery: 'Lottery',
  };
  return labels[tier];
}

/**
 * Get position badge color
 */
function getPositionColor(position: DraftPick['position']): string {
  const colors: Record<DraftPick['position'], string> = {
    early: 'bg-green-100 text-green-800 border-green-300',
    mid: 'bg-blue-100 text-blue-800 border-blue-300',
    late: 'bg-orange-100 text-orange-800 border-orange-300',
    unknown: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[position];
}

/**
 * Get ordinal suffix
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================================================
// Component
// ============================================================================

export function DraftPickCard({
  pick,
  config = DEFAULT_VALUATION_CONFIG,
  showDetails = false,
  compact = false,
  onClick,
  className = '',
}: DraftPickCardProps) {
  // Calculate valuation
  const valuation = React.useMemo(() => valuateDraftPick(pick, config), [pick, config]);

  // Determine if pick is current year or future
  const currentYear = new Date().getFullYear();
  const isFuturePick = pick.year > currentYear;

  // Format round display
  const roundDisplay = `${pick.round}${getOrdinalSuffix(pick.round)}`;

  // Format value display
  const valueDisplay = Math.round(valuation.finalValue).toLocaleString();

  // Handler
  const handleClick = () => {
    if (onClick) {
      onClick(pick, valuation);
    }
  };

  // Compact mode
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[60px]">
            <div className="text-2xl font-bold text-gray-900">{roundDisplay}</div>
            <div className="text-xs text-gray-500">{pick.year}</div>
          </div>

          <div>
            <Badge className={getTierColor(valuation.tier)} variant="secondary">
              {getTierLabel(valuation.tier)}
            </Badge>
            {pick.position !== 'unknown' && (
              <Badge className={`ml-2 ${getPositionColor(pick.position)}`} variant="outline">
                {pick.position}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">{valueDisplay}</div>
          <div className="text-xs text-gray-500">value</div>
        </div>
      </div>
    );
  }

  // Full card mode
  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {roundDisplay} Round - {pick.year}
              {isFuturePick && (
                <Calendar className="h-4 w-4 text-gray-400" />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {pick.position !== 'unknown' && `${pick.position} pick • `}
              Value: {valueDisplay}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Badge className={getTierColor(valuation.tier)} variant="secondary">
              {getTierLabel(valuation.tier)}
            </Badge>
            {pick.position !== 'unknown' && (
              <Badge className={getPositionColor(pick.position)} variant="outline">
                {pick.position}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Value breakdown */}
        <div className="space-y-3">
          {/* Description */}
          <p className="text-sm text-gray-700">
            {valuation.description}
          </p>

          {/* Player value equivalent */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span>
              Equivalent to player ranked{' '}
              <span className="font-semibold">
                {valuation.playerValueEquivalent.low}-{valuation.playerValueEquivalent.high}
              </span>
            </span>
          </div>

          {/* Show detailed breakdown if requested */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Value Breakdown
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Base Value</div>
                  <div className="font-semibold">{Math.round(valuation.rawValue)}</div>
                </div>

                <div>
                  <div className="text-gray-500">Year Adjusted</div>
                  <div className="font-semibold flex items-center gap-1">
                    {Math.round(valuation.discountedValue)}
                    {isFuturePick && (
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">Position Adjusted</div>
                  <div className="font-semibold flex items-center gap-1">
                    {Math.round(valuation.positionAdjustedValue)}
                    {pick.position === 'early' && (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    )}
                    {pick.position === 'late' && (
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">Final Value</div>
                  <div className="font-bold text-lg">{valueDisplay}</div>
                </div>
              </div>

              {/* Config info */}
              {config.isSuperflex && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <Badge variant="outline" className="text-xs">
                    Superflex Scoring
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// List View Component
// ============================================================================

export interface DraftPickListProps {
  /** Array of draft picks to display */
  picks: DraftPick[];

  /** Optional custom valuation config */
  config?: ValuationConfig;

  /** Show detailed breakdown? */
  showDetails?: boolean;

  /** Use compact mode? */
  compact?: boolean;

  /** Optional click handler */
  onPickClick?: (pick: DraftPick, valuation: PickValuation) => void;

  /** Empty state message */
  emptyMessage?: string;

  /** Custom class name */
  className?: string;
}

export function DraftPickList({
  picks,
  config = DEFAULT_VALUATION_CONFIG,
  showDetails = false,
  compact = false,
  onPickClick,
  emptyMessage = 'No draft picks available',
  className = '',
}: DraftPickListProps) {
  // Sort picks by value (descending) - must be before early return
  const sortedPicks = React.useMemo(() => {
    return [...picks].sort((a, b) => {
      const valA = valuateDraftPick(a, config);
      const valB = valuateDraftPick(b, config);
      return valB.finalValue - valA.finalValue;
    });
  }, [picks, config]);

  if (picks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedPicks.map((pick) => (
        <DraftPickCard
          key={pick.id}
          pick={pick}
          config={config}
          showDetails={showDetails}
          compact={compact}
          onClick={onPickClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default DraftPickCard;
