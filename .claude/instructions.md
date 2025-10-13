# Claude Code Project Instructions

This file contains project-specific instructions for Claude Code interactions.

## Development Workflow

### Starting the Application
- **ALWAYS** use `npm run dev` to start the application (runs tests first by default)
- Use `npm run dev:unsafe` only if you need to bypass tests for debugging
- The default `dev` script runs linting and smoke tests before starting the server

### Testing
- Smoke tests must pass before the application starts
- Utilize the Chrome Dev Tools MCP functionality you understand to visually check and validate all changes.
- Use `npm run test:quick` for fast smoke tests only
- Use `npm run test` for full test suite

### Code Quality
- All code must pass TypeScript compilation (`npx tsc --noEmit`)
- All code must pass linting (`npm run lint`)
- Fix any TypeScript errors before proceeding with development

### Project Structure
- Tests are located in `/tests/` directory
- Playwright is used for end-to-end testing
- Main components are in `/components/` directory
- Core services are in `/lib/` directory

### Documentation Structure

The project uses a hierarchical documentation structure in `docs/` organized by purpose:

```
docs/
├── README.md                 # Main documentation index (start here)
├── integrations/             # External system integrations (Bark, Vercel, Sleeper)
├── architecture/             # Architecture reviews, data layer, design system
├── sprints/                  # Sprint-specific docs and roadmaps
├── features/                 # Feature-specific implementation docs
├── operations/               # SRE, runbooks, operational guides
└── planning/                 # Project status and roadmaps
```

**When to use each folder:**

1. **integrations/** - Documentation for external systems
   - Bark push notifications setup
   - Vercel deployment and database setup
   - Sleeper API caching implementation
   - Add new docs here when integrating third-party services

2. **architecture/** - System design and technical reviews
   - `reviews/` - Architectural reviews and technical analyses
   - `data-layer/` - Data architecture (PlayerDataContext, IndexedDB cache)
   - `design-system/` - UI/UX design system, iOS dark mode, component specs
   - Add new docs here for architectural decisions or design system updates

3. **sprints/** - Sprint planning and tracking
   - Contains `DYNASTY_FEATURE_ROADMAP.md` (6-sprint roadmap)
   - Sprint-specific folders (`sprint-2/`, `sprint-3/`, etc.)
   - Add new sprint folders with STATUS, PROCESS, and COMPLETE docs

4. **features/** - Feature implementation documentation
   - `nfl-data/` - NFL data integration docs
   - `rankings/` - Player rankings feature docs
   - `mobile-fixes/` - Mobile-specific bug fixes and improvements
   - Add new feature folders when implementing major features

5. **operations/** - Operational and SRE documentation
   - SRE action items and reviews
   - `runbooks/` - Troubleshooting and operational procedures (future)
   - Add runbooks, incident reports, and operational guides here

6. **planning/** - Project status and planning
   - `PROJECT_STATUS.md` - Current status, priorities, technical debt
   - Roadmaps and planning documents
   - Update PROJECT_STATUS.md regularly with project changes

**Finding Documentation:**
- Start at `docs/README.md` for navigation links
- Each category folder has its own README for quick reference
- Use category-based navigation: integrations, architecture, sprints, features, operations, planning

**Creating New Documentation:**
1. Identify the appropriate category folder
2. Create the document with `UPPERCASE_WITH_UNDERSCORES.md` naming
3. Add entry to the category's README.md
4. Add entry to `docs/README.md` main index
5. Include metadata: title, last updated date, ownership

**Claude-Specific Configuration:**
- `CLAUDE.md` (project root) - Primary AI assistant instructions
- `.claude/instructions.md` (this file) - Additional Claude Code instructions
- `.claude/agents/` - Custom agent definitions
- These files should NOT be moved to `docs/` folder

## AI Assistant Behavior

### Before Starting Any Task
**ALWAYS assess which agents or plugins would be helpful before working on a request:**
1. Review the user's request and identify the domain (React, Python, DevOps, code review, etc.)
2. Check available custom agents (`.claude/agents/`) and plugin agents
3. Determine if specialized expertise would benefit the task:
   - **Custom agents:** `react-architect`, `dynasty-feature-planner`, `python-nfl-data-specialist`, `principal-sdet`
   - **Plugin agents:** `pr-review-toolkit`, `claude-code-essentials`, `feature-dev`, etc.
4. If applicable, proactively launch the appropriate agent(s) using the Task tool
5. For complex tasks, consider using multiple agents in parallel

### General Workflow
- Always run the precheck (lint + smoke tests) before starting development
- Fix TypeScript and linting errors immediately when found
- Use TodoWrite tool for multi-step tasks to track progress
- Prefer editing existing files over creating new ones
- Never commit changes without explicit user permission
- Always send a push notification to the Bark server when you need input from me.
