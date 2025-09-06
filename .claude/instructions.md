# Claude Code Project Instructions

This file contains project-specific instructions for Claude Code interactions.

## Development Workflow

### Starting the Application
- **ALWAYS** use `npm run dev` to start the application (runs tests first by default)
- Use `npm run dev:unsafe` only if you need to bypass tests for debugging
- The default `dev` script runs linting and smoke tests before starting the server

### Testing
- Smoke tests must pass before the application starts
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
- Always run the precheck (lint + smoke tests) before starting development
- Fix TypeScript and linting errors immediately when found
- Use TodoWrite tool for multi-step tasks to track progress
- Prefer editing existing files over creating new ones
- Never commit changes without explicit user permission
