# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Fantasy Football Assistant** - a Next.js 15.2.4 application that integrates with the Sleeper API to provide advanced fantasy football analytics, AI-powered player rankings, trade recommendations, and league management tools. The project is deployed on Vercel and syncs with v0.app.

## Build & Development Commands

### Development
\`\`\`bash
npm run dev              # Start Next.js dev server (standard)
npm run dev:unsafe       # Alternative dev command
\`\`\`

### Building & Production
\`\`\`bash
npm run build            # Production build (Next.js)
pnpm run build           # Used in CI/CD pipeline - MUST work without errors
npm start                # Start production server
\`\`\`

### Code Quality
\`\`\`bash
npm run lint             # Run ESLint
npm run precheck         # Runs lint before deployment
\`\`\`

### Testing
\`\`\`bash
npm run test:unit        # Run Jest unit tests
npm run test:integration # Run Jest integration tests
\`\`\`

**Important:** Playwright was removed from this project. Do not attempt to add or use Playwright testing.

## Critical Build Requirements

1. **TypeScript Strict Mode:** The build pipeline uses strict type checking. Avoid union types that make array methods uncallable (e.g., `Type[] | OtherType[]`). Let TypeScript infer types when working with conditional arrays.

2. **Type Safety in Services:** When working with `nfl-data-service.ts` types:
   - `NFLPlayerStats` is the base interface (minimal properties)
   - `NFLWeeklyStats` extends it with weekly data
   - `NFLSeasonalStats` extends it with seasonal data
   - Use specific types, not base types, when accessing `player_name`, `team`, etc.

3. **React Hooks:** All hook dependencies must be properly declared. Use `useCallback` for functions passed to child components or used in other hooks.

## Architecture

### Service Layer Architecture (AI Rankings Pipeline)

The AI rankings system uses a service-oriented architecture with four main services:

1. **NflDataFetcherService** (`lib/nfl-data-fetcher-service.ts`)
   - Spawns Python child process to fetch NFL historical data
   - Returns weekly stats, seasonal stats, and player info
   - Handles cross-process communication with Python scripts

2. **PromptBuilderService** (`lib/prompt-builder-service.ts`)
   - Builds AI prompts with historical performance context
   - Aggregates ranking data from multiple sources (FantasyPros, ESPN, Yahoo)
   - Adds comprehensive NFL player metrics to prompt context

3. **AIResponseParserService** (`lib/ai-response-parser-service.ts`)
   - Parses AI responses into structured ranking data
   - Extracts player names, positions, and analysis

4. **RankingGeneratorService** (`lib/ranking-generator-service.ts`)
   - Generates final ranking systems with consensus scoring
   - Simulates AI responses (can be replaced with real LLM calls)
   - Produces structured `RankingSystem` objects

5. **AIRankingsService** (`lib/ai-rankings-service.ts`)
   - Orchestrates the entire pipeline
   - Entry point: `generateAIRankings(allRankings, options)`
   - Coordinates data fetching, prompt building, AI simulation, and ranking generation

### State Management

**Dashboard state has been refactored into custom hooks** (see `ARCHITECTURAL_REVIEW.md` - completed):

- `use-dashboard-data.ts` - League and roster data management
- `use-league-selection.ts` - Selected league state
- `use-loading-states.ts` - Loading and retry state
- `use-debug-info.ts` - Debug information generation
- `use-local-storage.ts` - Safe localStorage with SSR handling

### Context Providers

**PlayerDataContext** (`contexts/player-data-context.tsx`):
- Global player data loaded from Sleeper API
- Provides `players`, `getPlayerName`, `getPlayer`, `getPlayerPosition`, `getPlayersByPosition`
- Loads all NFL players on mount
- Use this context instead of fetching player data in individual components

### API Integration

**Sleeper API** (`lib/sleeper-api.ts`):
- Main integration with Sleeper fantasy platform
- Key functions:
  - `getUserByUsername(username)` - Fetch user by username
  - `getUserLeagues(userId, season)` - Get user's leagues
  - `getLeagueRosters(leagueId)` - Get league rosters
  - `getAllPlayers(sport)` - Get all player data (cached)
  - `getTransactions(leagueId, week)` - Get league transactions
  - `getTradeHistory(leagueId)` - Get historical trades

**NFL Data Python Bridge** (`lib/nfl-data-service.ts`):
- Spawns Python scripts in `python/` directory
- Fetches historical NFL data using nfl_data_py library
- Returns structured JSON with weekly/seasonal stats

## Key Pages & Routes

- `/` - Home page with league connection
- `/dashboard` - Main dashboard with team roster and league overview
- `/rankings` - Player rankings with AI-powered predictions (uses AI rankings pipeline)
- `/trades` - Trade history and analytics
- `/recommendations` - Trade recommendations
- `/nfl-data` - NFL data management and Python script testing
- `/api/nfl-data` - API endpoint for NFL data fetching

## Python Integration

The project includes Python scripts in the `python/` directory for NFL data fetching:

- Uses `nfl_data_py` library
- Spawned as child processes from Node.js
- Returns JSON data via stdout
- Error handling via stderr

When modifying NFL data services, ensure Python environment has required dependencies.

## Styling

- **Tailwind CSS 4.x** with `@tailwindcss/postcss`
- **Radix UI** components (all using "latest" versions)
- **shadcn/ui** patterns for component library
- Avoid inline styles - use Tailwind utilities

## Important Notes

1. **v0.app Sync:** This repo auto-syncs with v0.app deployments. Some changes may come from v0.
2. **React 19:** Uses React 19 with new features (be mindful of compatibility)
3. **Windows Development:** Project is developed on Windows (uses `child_process` for Python)
4. **No Playwright:** Playwright was intentionally removed. Use Jest for testing.
5. **Legacy Peer Deps:** Run `npm install --legacy-peer-deps` if dependency conflicts occur
6. **Mobile-First Design:** This is a MOBILE-FIRST product. All features MUST work perfectly on 375px viewport (iPhone SE) before desktop optimization. Every component must have mobile-specific responsive design and touch target sizing ≥44px.

## Bark Notification Protocol

**CRITICAL:** You MUST send a Bark push notification to the user via `mcp__bark__send_bark_notification` in these scenarios:

1. **Before asking user for input or a decision** - Always notify before prompting for user response
2. **Task or phase completion** - Notify when major work is done and needs review
3. **Blocking issues** - Notify immediately when encountering errors requiring user intervention
4. **Testing or verification needed** - Notify when user action is required to test/verify changes
5. **Long-running operations finish** - Notify when background work completes

**Notification Levels:**
- `critical` - Errors, blockers, urgent decisions needed
- `timeSensitive` - Task completion, important updates, decisions needed
- `active` - General progress updates, non-urgent notifications

**Example:**
```typescript
mcp__bark__send_bark_notification({
  title: "Sprint 3 - Decision Needed",
  body: "Mobile audit complete. Ready to begin fixes. Review results in Claude Code.",
  level: "timeSensitive"
})
```

**Never** ask the user a question or request input without sending a Bark notification first. The user may be away from their desk and needs to be alerted.

## Common Issues

**Build Failing with Type Errors:**
- Check union types in array operations
- Ensure proper type imports from `nfl-data-service.ts`
- Avoid explicit union types like `Type1[] | Type2[]` - let TypeScript infer

**Python Scripts Not Working:**
- Verify Python environment has `nfl_data_py` installed
- Check `python/` directory scripts are executable
- Review stderr output from child process

**Player Data Not Loading:**
- PlayerDataContext loads on app mount
- Check if `usePlayerData()` hook is used correctly
- Verify Sleeper API is accessible

## Deployment

- **Platform:** Vercel
- **Build Command:** `pnpm run build` (used in pipeline)
- **Framework:** Next.js 15.2.4 (App Router)
- **Node Version:** Compatible with React 19 and Next.js 15

## Action Items from Architectural Review

Completed:
- ✅ Dashboard state management refactored into custom hooks

Pending:
- Decompose large components (dashboard, enhanced-team-roster)
- Create reusable `NoLeaguesConnected` component
- Improve API error handling with retry/exponential backoff
- Replace `any` types with specific types
- Extract inline styles to Tailwind classes
