# Browser / MCP test scenarios

**Purpose:** Executable checklists for **post-ticket** and **release** validation using a real browser (via **MCP** in Cursor or manually). These are **not** run by `npm test`.

## Index

| Scenario | Scope |
|----------|--------|
| [smoke-core-routes.md](smoke-core-routes.md) | Main routes load; no obvious blank/error shell |

## Conventions

- **Filename:** `kebab-case.md`; optional prefix `td-2026-03-20-xxx-` when tied to an engineering ID.
- **New scenarios:** Start from [SCENARIO_TEMPLATE.md](SCENARIO_TEMPLATE.md).
- **Base URL:** Scenarios use a placeholder `BASE_URL` (e.g. `http://localhost:3000` or production). Set explicitly before running.

See [POST_TICKET_VALIDATION.md](../POST_TICKET_VALIDATION.md) for how this fits with CI (lint, build, Jest).
