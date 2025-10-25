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

### Testing Requirements

**CRITICAL: All code changes MUST be tested before deployment.**

1. **Always Run Unit Tests:**
   - Run `npm run test:unit` after implementing any feature
   - Verify all tests pass before committing
   - Do NOT skip this step - test failures must be addressed

2. **Large Features Require Additional Testing:**
   - **Browser Testing**: For UI changes, cache implementations, or user-facing features
     - Test in Chrome DevTools (Application tab for cache/storage)
     - Verify functionality works as expected in real browser
     - Test mobile viewport (375px) for mobile-first features

   - **Performance Testing**: For performance-critical changes (caching, API calls, data processing)
     - Measure actual performance improvements (not theoretical)
     - Use browser console debug tools (`indexedDBDebug.test()`, etc.)
     - Compare before/after metrics with real data

   - **Integration Testing**: For multi-service features
     - Test service interactions work correctly
     - Verify fallback chains function as designed
     - Test error handling paths

3. **Testing Checklist Before Deployment:**
   - [ ] `npm run test:unit` passes
   - [ ] `npm run build` passes with no errors
   - [ ] Browser testing completed (for UI/cache/user-facing changes)
   - [ ] Performance benchmarks measured (for performance changes)
   - [ ] Integration tests validated (for multi-service features)

**Do NOT claim code is "fully tested" unless:**
- Unit tests have been executed and pass
- Browser/performance testing completed (if applicable)
- All relevant test types for the change have been performed

## Critical Build Requirements

1. **TypeScript Strict Mode:** The build pipeline uses strict type checking. Avoid union types that make array methods uncallable (e.g., `Type[] | OtherType[]`). Let TypeScript infer types when working with conditional arrays.

2. **Type Safety in Services:** When working with `nfl-data-service.ts` types:
   - `NFLPlayerStats` is the base interface (minimal properties)
   - `NFLWeeklyStats` extends it with weekly data
   - `NFLSeasonalStats` extends it with seasonal data
   - Use specific types, not base types, when accessing `player_name`, `team`, etc.

3. **React Hooks:** All hook dependencies must be properly declared. Use `useCallback` for functions passed to child components or used in other hooks.

## Agent Engagement Protocol

**CRITICAL: The project-manager agent MUST be engaged on EVERY user request.**

### When to Engage project-manager Agent

**ALWAYS invoke the project-manager agent:**
- **At the start of EVERY user request** (before any code changes)
- Before creating new files (components, pages, services, utilities, docs)
- Before starting new features or sprints
- After completing features or sprints
- When adding or updating documentation
- During code refactoring
- When cleaning up temporary files

### What the project-manager Agent Does

The project-manager agent ensures:
1. **File Naming Conventions**: All new files follow project standards (kebab-case for TS/JS, snake_case for Python)
2. **Directory Organization**: Files are placed in correct locations (page-specific vs. shared components, lib/ vs. utils/)
3. **Documentation Categorization**: Distinguish permanent reference docs from temporary sprint/task docs
4. **Cleanup Operations**: Identify and remove stale, unused, or obsolete files
5. **Project Hygiene**: Maintain clean, organized codebase free of organizational technical debt

### Engagement Examples

**Example 1: Before creating new files**
```
User: "Add a new waiver wire analyzer page"
Assistant: [Invokes project-manager agent first to verify naming and location]
project-manager: "New page should be app/waiver-wire/page.tsx, components in app/waiver-wire/components/"
Assistant: [Proceeds with implementation following guidance]
```

**Example 2: After completing work**
```
User: "Sprint 3 is complete"
Assistant: [Invokes project-manager agent to audit and cleanup]
project-manager: "Found 8 temporary docs in docs/tasks/ ready for archival, 3 stale files to remove"
Assistant: [Performs cleanup operations]
```

**Example 3: During development**
```
User: "Create a player comparison utility"
Assistant: [Invokes project-manager agent to check for existing utilities]
project-manager: "Found similar utilities in lib/utils/player-helpers.ts - suggest adding to existing file"
Assistant: [Adds to existing file instead of creating duplicate]
```

### Other Specialized Agents

**principal-sdet** - Testing and quality assurance
- Invoke AFTER completing features, fixing bugs, or refactoring
- Creates test plans, executes tests, verifies system stability
- See [.claude/agents/principal-sdet.md](.claude/agents/principal-sdet.md)

**react-architect** - React architecture and best practices
- Invoke when planning or implementing React features
- Provides architectural guidance, identifies technical debt
- See [.claude/agents/react-architect.md](.claude/agents/react-architect.md)

**python-nfl-data-specialist** - Python NFL data integration
- Invoke for Python script work, NFL data fetching, child process communication
- See [.claude/agents/python-nfl-data-specialist.md](.claude/agents/python-nfl-data-specialist.md)

**dynasty-feature-planner** - Feature breakdown and planning
- Invoke when planning new features, breaking down complex work
- See [.claude/agents/dynasty-feature-planner.md](.claude/agents/dynasty-feature-planner.md)

**radix-ui-specialist** - Radix UI component implementation
- Invoke for ALL UI work to ensure proper Radix component usage
- See action items - must review all UI changes
- See [.claude/agents/radix-ui-specialist.md](.claude/agents/radix-ui-specialist.md)

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

## Communication Protocol: Bark + Discord

**CRITICAL:** You MUST use BOTH Bark notifications AND Discord messages to communicate with the user when away from computer. This dual-notification system ensures the user never misses important updates.

### When to Send Notifications (Bark + Discord)

**ALWAYS send BOTH notifications in these scenarios:**

1. **Before asking for ANY user input or decision** - NEVER ask a question without notifying first
2. **Task completion** - When any task, phase, or work item is completed
3. **Blocking issues** - Errors, failures, or issues requiring user intervention
4. **Testing/verification needed** - User action required to test or verify changes
5. **Long-running operations finish** - Background work completes
6. **Build/deployment status** - Success or failure of builds
7. **Code review needed** - PRs ready, commits pushed, changes need review

### Dual-Notification Pattern (REQUIRED)

**Step 1: Send Bark notification**
```typescript
mcp__bark__send_bark_notification({
  title: "Task Complete - Input Needed",
  body: "Sprint 3 mobile fixes done. Need decision on navigation. Check Discord.",
  level: "timeSensitive"
})
```

**Step 2: Send Discord message (IMMEDIATELY AFTER)**
```typescript
mcp__discord__send-message({
  channel: "general", // or user-specified channel
  message: "✅ **Task Complete - Input Needed**\n\nSprint 3 Phase 2 mobile fixes are complete:\n- P0-009: Dashboard Teams tab fixed\n- P0-010: Rankings scroll fixed\n\n**Decision needed:** Should I proceed with P1-016 (mobile navigation) or move to next sprint?\n\nReply here or in Claude Code."
})
```

**Step 3: Wait for user response via Discord**
- After sending notifications, **actively check Discord for user responses**
- When user replies in Discord, **acknowledge receipt immediately** with a confirmation message
- Process user's Discord response and continue work
- If user says to continue, confirm and proceed
- If user provides input, confirm understanding and execute

### Notification Levels

**Bark Levels:**
- `critical` - Errors, blockers, urgent decisions (red notification)
- `timeSensitive` - Task completion, important updates, decisions needed (yellow notification)
- `active` - General progress updates, non-urgent notifications (blue notification)

**Discord Format:**
- ✅ Success/completion
- ❌ Error/failure
- ⚠️ Warning/attention needed
- 🔄 In progress
- ❓ Question/decision needed
- 📋 Information/summary

### Discord Response Confirmation Protocol

When user responds in Discord:

1. **Read the Discord message** using `mcp__discord__read-messages`
2. **Immediately confirm receipt** with a message like:
   ```
   ✅ Got it! [Brief summary of what you understood]

   Proceeding with: [what you'll do next]
   ```
3. **Execute the work** as requested
4. **Send completion notification** (Bark + Discord) when done

### Discord Context Check on Startup (CRITICAL)

**REQUIRED: Check Discord for context when:**
1. **New Claude instance starts** - Fresh conversation with no prior history
2. **Conversation is compacted** - Context has been compressed/reset
3. **Returning after extended break** - Last interaction was >1 hour ago
4. **User references prior work** - User mentions tasks/decisions you're unaware of

**Startup Context Check Protocol:**

**Step 1: Immediately check Discord (FIRST ACTION)**
```typescript
// Read recent messages to understand ongoing work context
const messages = await mcp__discord__read-messages({
  channel: "general",
  limit: 20  // Last 20 messages for full context
})
```

**Step 2: Analyze messages for:**
- **Ongoing tasks**: What work is in progress?
- **Pending decisions**: Are there unanswered questions?
- **Recent completions**: What was just finished?
- **Blockers/issues**: Any problems reported?
- **User instructions**: Direct commands or requests?

**Step 3: Acknowledge context in greeting**
```typescript
await mcp__discord__send-message({
  channel: "general",
  message: "👋 **Claude Online - Context Restored**\n\n**Understood from Discord:**\n- [Summary of ongoing work]\n- [Pending decisions/questions]\n- [Last known state]\n\n**Ready to:** [Next action based on context]\n\nReply 'correct' to proceed or clarify if anything's missing."
})
```

**Example: Startup with Ongoing Work**
```typescript
// Scenario: User asked about fixing rankings page, then conversation was compacted

// Step 1: Check Discord
const messages = await mcp__discord__read-messages({ channel: "general", limit: 20 })

// Step 2: Find context
// Messages show: "Fix rankings scroll issue" was requested
//                "Found the problem - horizontal scroll not working on mobile"
//                No completion notification sent

// Step 3: Acknowledge and resume
await mcp__discord__send-message({
  channel: "general",
  message: `👋 **Claude Online - Context Restored**

**Understood from Discord:**
- Task: Fix rankings horizontal scroll on mobile (375px)
- Status: Issue identified but not yet fixed
- Last update: Found horizontal scroll not working

**Ready to:** Continue with rankings scroll fix implementation

Reply 'correct' to proceed or 'wait' if priorities changed.`
})

// Step 4: Wait for confirmation before proceeding
```

**Example: Startup with Pending Decision**
```typescript
// Scenario: Claude asked a question in Discord, then instance reset

// Step 1: Check Discord
const messages = await mcp__discord__read-messages({ channel: "general", limit: 20 })

// Step 2: Find unanswered question
// Last message from Claude: "Should I proceed with Option 1 or investigate further?"
// No user response yet

// Step 3: Re-surface the question
await mcp__discord__send-message({
  channel: "general",
  message: `👋 **Claude Back Online**

**Pending Decision:** My last message asked about fixing the TypeScript error:
- Option 1: Change to \`overflow-x-scroll\` (safest)
- Option 2: Add type assertion
- Option 3: Investigate further

**Still waiting for your response.** Reply with option number when ready.`
})
```

**When NOT to Check Discord:**
- User is actively typing in current conversation
- Discord check was performed <5 minutes ago
- Context is clearly established in current conversation

**Key Principle:** Never assume context when starting fresh. Always verify with Discord first.

### Examples

**Example 1: Task Completion**
```typescript
// Bark
mcp__bark__send_bark_notification({
  title: "Teams Tab Fixed ✅",
  body: "Dashboard Teams tab now populates on mobile. Ready for testing. Check Discord.",
  level: "timeSensitive"
})

// Discord (immediately after)
mcp__discord__send-message({
  channel: "general",
  message: "✅ **P0-009 Complete: Dashboard Teams Tab Fixed**\n\nThe Teams tab now correctly displays all team rosters on mobile (375px viewport).\n\n**Changes:**\n- Fixed sortedRosters filtering logic\n- Updated owner matching to handle edge cases\n- Added defensive null checks\n\n**Testing needed:** Please test on mobile device and confirm Teams tab shows all rosters.\n\nReply 'looks good' to proceed to P0-010 or 'issue' if problems found."
})
```

**Example 2: Blocking Error**
```typescript
// Bark
mcp__bark__send_bark_notification({
  title: "Build Failed ❌",
  body: "TypeScript errors in rankings page. Need guidance. Check Discord ASAP.",
  level: "critical"
})

// Discord
mcp__discord__send-message({
  channel: "general",
  message: "❌ **Build Failed - Urgent Input Needed**\n\n**Error:** TypeScript strict mode error in `app/rankings/page.tsx:465`\n\n**Issue:** `overflow-x-auto` class causing type error with Next.js 15\n\n**Options:**\n1. Change to `overflow-x-scroll` (standard CSS)\n2. Add type assertion\n3. Update Tailwind config\n\n**Recommendation:** Option 1 (safest)\n\nReply with option number or 'investigate further'"
})
```

**Example 3: User Response Handling**
```typescript
// User sends in Discord: "looks good, continue with rankings fix"

// Step 1: Read message
const messages = await mcp__discord__read-messages({ channel: "general", limit: 10 })

// Step 2: Immediately confirm
await mcp__discord__send-message({
  channel: "general",
  message: "✅ **Confirmed!** Starting P0-010: Rankings horizontal scroll fix\n\nETA: 1-2 hours\nWill notify when complete."
})

// Step 3: Do the work...

// Step 4: Notify completion (Bark + Discord)
```

### Discord Quick Commands (User Can Send)

When user is away from computer, they can reply in Discord with quick commands:

- **"continue"** / **"proceed"** - Continue with proposed plan
- **"looks good"** / **"lgtm"** - Approve and continue
- **"stop"** / **"wait"** - Stop and wait for further instruction
- **"investigate"** - Do more investigation before proceeding
- **"option 1"** / **"option 2"** - Choose from presented options
- **"test first"** - Run tests before proceeding
- **"show me"** - Provide more details/code snippets

**When user sends ANY message in Discord, acknowledge it immediately** with a confirmation before proceeding.

### Channel Configuration

**Default channel:** `general` (unless user specifies otherwise)

User can specify channel in their requests:
- "send to #dev-logs"
- "notify in #claude-updates"
- "ping me in #work-queue"

### Failure Recovery

If Bark or Discord notification fails:

1. **Log the error** in console
2. **Retry once** after 2 seconds
3. **Continue with task** (don't block work on notification failure)
4. **Mention notification failure** in next successful notification

### Summary: Notification Checklist

Before asking user ANYTHING:
- [ ] Send Bark notification with clear title and body
- [ ] Send Discord message with detailed context
- [ ] Wait for and monitor Discord for response
- [ ] When response received, confirm immediately
- [ ] Execute requested work
- [ ] Send completion notification (Bark + Discord)

**Never skip this protocol.** The user relies on these notifications to work remotely.

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
- Always confirm when creating new tasks, completing task, or when doing any task-related work, that there is no conflicting tasks with duplicate numbers.
- Always have an agent(s) that are specialized with testing, review changes prior to pushing to main to trigger a deployment.
- when pushing to main, always check the deployment afterwards with the Vercel CLI tool to confirm if the deployment was successful. If not, make sure to resolve and determine if you can fix forward.
- after deploying to production and the vercel build completes. ALWAYS use chrome dev tools to test/validate the changes directly at the production url of dynastyff.vercel.app
- Every time a UI task is worked or UI is changed ensure that the radix agent reviews and approves the changes or suggests and makes adjustments to improve as needed.