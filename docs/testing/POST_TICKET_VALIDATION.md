# Post-ticket validation (Option A: CI + MCP)

**Last updated:** 2026-03-23  
**Policy:** Automated **CI** stays **lint + build + Jest**. **Full product** checks in a real browser use **documented scenarios** executed by a human or an AI agent with **MCP** (Cursor)—not `@playwright/test` in this repo.

---

## Two layers

| Layer | When | What runs | Where |
|--------|------|------------|--------|
| **Automated (every PR / pre-merge)** | Push, CI, local before commit | `npm run lint`, `npm run build`, `npm run test:unit` (and `test:integration` when relevant) | Terminal / CI |
| **Browser / full product** | After a ticket is done, before merge if UI-facing, after deploy for production smoke | Scenarios under [docs/testing/scenarios/](scenarios/) using **browser MCP** + optional **Chrome DevTools MCP** | Cursor agent or manual Chrome |

**Do not** add Playwright (npm) or CI-driven browser E2E unless project policy changes. **Playwright MCP** in Cursor is separate: it is allowed for agent-driven flows; it is not the same as adding `@playwright/test` to `package.json`.

---

## Ticket closure checklist (recommended)

1. **Automated**
   - [ ] `npm run lint`
   - [ ] `npm run build`
   - [ ] `npm run test:unit` (and integration tests if the change crosses services)
   - [ ] Optional one-liner: `npm run validate:smoke` (lint + build)

2. **Browser (if the ticket touched UI, routing, cache, or APIs used from the client)**
   - [ ] Run the **smoke** scenario [smoke-core-routes.md](scenarios/smoke-core-routes.md) (or a ticket-specific scenario you add next to it).
   - [ ] For performance or regressions: use **Chrome DevTools MCP** (Lighthouse, Performance trace, Network) or follow [CHROME_DEVTOOLS_TESTING.md](CHROME_DEVTOOLS_TESTING.md) manually.

3. **Mobile-first**
   - [ ] At **375px** width for any changed surface (see scenario template).

---

## MCP usage (agents)

### Browser automation

Use **one** primary browser MCP for consistency (either **cursor-ide-browser** or **user-Playwright**—both expose navigate, snapshot, click, type). Follow the lock/unlock workflow for **cursor-ide-browser** if that is the primary tool: navigate → lock → interact → unlock.

### Chrome DevTools MCP

Use for **audits and diagnostics**, not for duplicating every click path:

- Lighthouse / performance traces  
- Network request lists (API errors, 4xx/5xx)  
- Console messages  
- Mobile emulation / resize  

Deep manual steps remain in [CHROME_DEVTOOLS_TESTING.md](CHROME_DEVTOOLS_TESTING.md).

---

## Adding a new scenario

1. Copy [scenarios/SCENARIO_TEMPLATE.md](scenarios/SCENARIO_TEMPLATE.md) to `docs/testing/scenarios/<short-name>.md`.  
2. Optional: prefix with a ticket ID, e.g. `td-2026-03-20-xxx-rankings-tab.md`.  
3. List it in [scenarios/README.md](scenarios/README.md).

---

## Related docs

- [CHROME_DEVTOOLS_TESTING.md](CHROME_DEVTOOLS_TESTING.md) — manual Chrome DevTools reference  
- [scenarios/README.md](scenarios/README.md) — scenario index  
- [CLAUDE.md](../../CLAUDE.md) — project commands and testing requirements  
