'use client';

/**
 * Rookie Draft Page
 *
 * Main page for rookie draft management and player evaluation.
 * Features:
 * - Rookie rankings display (dynamically calculated based on NFL calendar)
 * - Player detail modal with dynasty insights
 * - Mobile-first responsive design
 */

import { useState, useMemo } from 'react';
import { RookieRankings } from '@/components/dynasty/rookie-rankings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RookiePlayer } from '@/lib/dynasty/rookie-draft-types';
import {
  getCurrentRookieSeasonYear,
  getRookieSeasonDescription,
  getRookieHeaderText,
} from '@/lib/dynasty/rookie-season-utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RookieDraftPage() {
  // Dynamically calculate current rookie season based on NFL calendar
  const rookieYear = useMemo(() => getCurrentRookieSeasonYear(), []);
  const seasonDescription = useMemo(() => getRookieSeasonDescription(rookieYear), [rookieYear]);
  const headerText = useMemo(() => getRookieHeaderText(rookieYear), [rookieYear]);

  const [selectedPlayer, setSelectedPlayer] = useState<RookiePlayer | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  const handlePlayerClick = (player: RookiePlayer) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="min-h-[44px] px-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-ios-title-1 font-bold">Rookie Draft</h1>
          </div>
          <p className="text-ios-body text-text-secondary">
            Dynasty rookie rankings and draft management for the {rookieYear} class
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600 dark:text-blue-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {headerText}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {seasonDescription}
              {' '}Click any player to view detailed analysis, age curves, and dynasty projections.
            </p>
          </div>
        </div>
      </Card>

      {/* Rookie Rankings */}
      <RookieRankings
        year={rookieYear}
        onPlayerClick={handlePlayerClick}
        showFilters={true}
      />

      {/* Player Detail Modal */}
      <Dialog open={showPlayerModal} onOpenChange={setShowPlayerModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedPlayer.full_name}
                </DialogTitle>
                <DialogDescription>
                  {selectedPlayer.position} • {selectedPlayer.team}
                  {selectedPlayer.college && ` • ${typeof selectedPlayer.college === 'string' ? selectedPlayer.college : selectedPlayer.college.school}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      #{selectedPlayer.consensusRank}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Consensus Rank
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {selectedPlayer.nflDraft.round}.
                      {selectedPlayer.nflDraft.overallPick}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      NFL Draft Pick
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {selectedPlayer.landingSpotGrade}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Landing Spot
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      Tier {selectedPlayer.tier}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dynasty Tier
                    </div>
                  </div>
                </div>

                {/* Projections */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Dynasty Projections</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Year 1 PPG</div>
                      <div className="text-xl font-bold">
                        {selectedPlayer.projection.year1PPG}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Year 3 PPG (Peak)</div>
                      <div className="text-xl font-bold">
                        {selectedPlayer.projection.year3PPG}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Bust Risk</div>
                      <div className="text-xl font-bold">
                        {selectedPlayer.projection.bustRisk}%
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Outcomes */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Projected Outcomes</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="default">Ceiling</Badge>
                      <span className="text-sm">{selectedPlayer.projection.ceiling}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary">Most Likely</Badge>
                      <span className="text-sm">{selectedPlayer.projection.mostLikely}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">Floor</Badge>
                      <span className="text-sm">{selectedPlayer.projection.floor}</span>
                    </div>
                  </div>
                </Card>

                {/* Strengths */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {selectedPlayer.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Concerns */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-orange-700 dark:text-orange-400">
                    Concerns
                  </h3>
                  <ul className="space-y-2">
                    {selectedPlayer.concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 dark:text-orange-400 mt-1">
                          ⚠
                        </span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Physical Profile */}
                {selectedPlayer.age && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Physical Profile</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Age</div>
                        <div className="font-medium">{selectedPlayer.age}</div>
                      </div>
                      {selectedPlayer.height && (
                        <div>
                          <div className="text-muted-foreground">Height</div>
                          <div className="font-medium">{selectedPlayer.height}</div>
                        </div>
                      )}
                      {selectedPlayer.weight && (
                        <div>
                          <div className="text-muted-foreground">Weight</div>
                          <div className="font-medium">{selectedPlayer.weight}</div>
                        </div>
                      )}
                      {selectedPlayer.college && (
                        <div>
                          <div className="text-muted-foreground">College</div>
                          <div className="font-medium">
                            {typeof selectedPlayer.college === 'string' ? selectedPlayer.college : selectedPlayer.college.school}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
