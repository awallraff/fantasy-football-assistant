-- CreateTable
CREATE TABLE "NFLPlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "team" TEXT,
    "season" INTEGER NOT NULL,
    "week" INTEGER,
    "passingYards" DOUBLE PRECISION,
    "passingTDs" INTEGER,
    "passingINTs" INTEGER,
    "passingAttempts" INTEGER,
    "passingCompletions" INTEGER,
    "rushingYards" DOUBLE PRECISION,
    "rushingTDs" INTEGER,
    "rushingAttempts" INTEGER,
    "receivingYards" DOUBLE PRECISION,
    "receivingTDs" INTEGER,
    "receptions" INTEGER,
    "targets" INTEGER,
    "fantasyPoints" DOUBLE PRECISION,
    "pprPoints" DOUBLE PRECISION,
    "halfPprPoints" DOUBLE PRECISION,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NFLPlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFLTeamStats" (
    "id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER,
    "pointsScored" DOUBLE PRECISION,
    "totalYards" DOUBLE PRECISION,
    "passingYards" DOUBLE PRECISION,
    "rushingYards" DOUBLE PRECISION,
    "turnovers" INTEGER,
    "pointsAllowed" DOUBLE PRECISION,
    "yardsAllowed" DOUBLE PRECISION,
    "sacks" INTEGER,
    "interceptions" INTEGER,
    "fumblesRecovered" INTEGER,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NFLTeamStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheInvalidation" (
    "id" TEXT NOT NULL,
    "cacheType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheInvalidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APICallLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APICallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NFLPlayerStats_playerId_season_idx" ON "NFLPlayerStats"("playerId", "season");

-- CreateIndex
CREATE INDEX "NFLPlayerStats_cachedAt_idx" ON "NFLPlayerStats"("cachedAt");

-- CreateIndex
CREATE INDEX "NFLPlayerStats_expiresAt_idx" ON "NFLPlayerStats"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NFLPlayerStats_playerId_season_week_key" ON "NFLPlayerStats"("playerId", "season", "week");

-- CreateIndex
CREATE INDEX "NFLTeamStats_team_season_idx" ON "NFLTeamStats"("team", "season");

-- CreateIndex
CREATE INDEX "NFLTeamStats_cachedAt_idx" ON "NFLTeamStats"("cachedAt");

-- CreateIndex
CREATE INDEX "NFLTeamStats_expiresAt_idx" ON "NFLTeamStats"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NFLTeamStats_team_season_week_key" ON "NFLTeamStats"("team", "season", "week");

-- CreateIndex
CREATE INDEX "CacheInvalidation_timestamp_idx" ON "CacheInvalidation"("timestamp");

-- CreateIndex
CREATE INDEX "CacheInvalidation_cacheType_idx" ON "CacheInvalidation"("cacheType");

-- CreateIndex
CREATE INDEX "APICallLog_timestamp_idx" ON "APICallLog"("timestamp");

-- CreateIndex
CREATE INDEX "APICallLog_endpoint_idx" ON "APICallLog"("endpoint");

-- CreateIndex
CREATE INDEX "APICallLog_success_idx" ON "APICallLog"("success");
