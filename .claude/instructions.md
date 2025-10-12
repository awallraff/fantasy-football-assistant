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

## AI Assistant Behavior

### Before Starting Any Task
**ALWAYS assess which agents or plugins would be helpful before working on a request:**
1. Review the user's request and identify the domain (React, Python, DevOps, code review, etc.)
2. Check available custom agents (`.claude/agents/`) and plugin agents
3. Determine if specialized expertise would benefit the task:
   - **Custom agents:** `react-architect`, `dynasty-feature-planner`, `python-nfl-data-specialist`
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
