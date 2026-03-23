# Open items and tasks

**Last updated:** 2026-03-23  
**Canonical tracker:** This file is the **single source of truth** for active backlog, deferred work, and referenced UX/architecture items. Historical engineering IDs use the prefix **`TD-2026-03-20-xxx`**. Reference-only rows from audits and roadmaps use **`REF-*`**.

---

## For AI agents and contributors

- When the user asks about **open items**, **open tasks**, **backlog**, or **what is left to do**, **read this file first** before scanning the whole repo.
- **Update this file** when you close an item, re-scope it, or verify it still applies: change **Status**, set **Last verified**, and move rows to **Resolved or superseded** when appropriate.
- **Do not** paste long narratives here—link to the primary doc (audit, sprint, design review). This file indexes and tracks status only.
- Detailed evidence remains in [SRE_ACTION_ITEMS.md](./SRE_ACTION_ITEMS.md), sprint docs, design audits, and architecture reviews.
- Before starting any new ticket, follow [AGENT_GIT_WORKFLOW_BEST_PRACTICES.md](./AGENT_GIT_WORKFLOW_BEST_PRACTICES.md), including creating a dedicated branch per ticket.

---

## Status values

| Status | Meaning |
|--------|---------|
| Open | Not started or not finished |
| In progress | Actively being worked |
| Blocked | Waiting on external dependency |
| Mitigated | Partially addressed; follow-up may remain |
| Deferred | Optional / lower priority; not blocking release |
| Done | Completed (move to resolved section when cleaning up) |

---

## Active engineering items (`TD-*`)

Stack rank: P0 first, then P1, P2, P3.

| ID | Status | Priority | Category | Summary | Primary sources | Code / notes | Last verified |
|----|--------|----------|----------|---------|-----------------|--------------|----------------|
| TD-2026-03-20-009 | Open | P1 | Quality | Trades page fetches Sleeper transactions directly in browser, causing CORS failures and repeated `net::ERR_FAILED`; trade history can appear empty despite available data. | SDET regression sweep (2026-03-23), Chrome DevTools console/network evidence | `components/trade-history.tsx`, `lib/sleeper-api.ts`; prefer server-side/API proxy for transactions path | 2026-03-23 |
| TD-2026-03-20-010 | Open | P2 | Quality | Dev server intermittently enters broken `.next` state with missing vendor chunks (e.g., `zod@3.25.67.js`), producing transient 500s on core routes until a full clean restart. | SDET regression sweep (2026-03-23), Next runtime overlay + terminal logs | `.next/server/vendor-chunks/*`; mitigation today: stop server, delete `.next`, restart `next dev -p 3000` | 2026-03-23 |
| TD-2026-03-20-008 | Open | P3 | Documentation | Indexing, archival conventions, dedupe root vs `docs/` copies. | [REPO_HYGIENE_STATUS.md](./REPO_HYGIENE_STATUS.md) | `docs/`, repo root | 2026-03-22 |
| TD-2026-03-20-011 | Open | P3 | Quality | `GET /favicon.ico` returns 404 in local/dev, creating avoidable console/network noise. | SDET regression sweep (2026-03-23), route check on port 3000 | Add `public/favicon.ico` (or `app/favicon.ico`) and verify 200 in dev/prod | 2026-03-23 |

---

## Reference backlog (`REF-*`)

Items tracked here for visibility; primary write-ups stay in linked docs. Not all may have separate TD IDs.

| ID | Status | Priority | Category | Summary | Primary sources | Code / notes | Last verified |
|----|--------|----------|----------|---------|-----------------|--------------|----------------|
| REF-ARCH-002 | Open | P3 | Architecture | Extract remaining inline styles to Tailwind/shared classes. | [ARCHITECTURAL_REVIEW.md](../architecture/reviews/ARCHITECTURAL_REVIEW.md), [PROJECT_STATUS.md](../planning/PROJECT_STATUS.md) | Various components | 2026-03-22 |
| REF-ARCH-003 | Open | P2 | Reliability | Single source of truth for NFL/Python column name normalization (`player_name` vs `player_display_name`, etc.). | [PROJECT_STATUS.md](../planning/PROJECT_STATUS.md), [NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md](../architecture/reviews/NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md) | Planned: `lib/nfl-data-normalizer.ts` (not present yet) | 2026-03-22 |
| REF-UX-001 | Deferred | P2 | UX | Mobile gestures and modal behavior: swipe between dashboard tabs, focus management and trap in `PlayerDetailModal`, swipe-to-dismiss on mobile modals; related checklist items in design docs. | [ui-ux-design-review.md](../design/ui-ux-design-review.md) (e.g. H-008), [ui-audit-report.md](../design/ui-audit-report.md) | [app/dashboard/page.tsx](../../app/dashboard/page.tsx), [player-detail-modal.tsx](../../components/player/player-detail-modal.tsx) | 2026-03-22 |
| REF-IOS-001 | Open | P2 | UX | iOS dark theme page-level polish: Dashboard, Rankings, Rookie Draft, Trades, NFL Data; loading/error polish optional. | [iOS_DARK_THEME_STATUS.md](../sprints/iOS_DARK_THEME_STATUS.md), [PAGE_REDESIGNS_ROADMAP.md](../planning/PAGE_REDESIGNS_ROADMAP.md) | Page components under `app/`, league/roster components | 2026-03-22 |
| REF-PERF-001 | Deferred | P3 | Performance | Post-deploy field Web Vitals: cadence for checking Vercel Analytics / CrUX / manual Lighthouse on production URL (see TD-001 resolution note). | [TASK-056](../tasks/sprint-3/TASK-056-PERFORMANCE-AUDIT-RESULTS.md) | Production URL in CLAUDE.md; not automated in CI | 2026-03-23 |
| REF-PERF-002 | Deferred | P3 | Performance | `/rankings` remains largest static route in build output (~22 kB page, ~177 kB First Load JS shared); optional further splitting or deferring non-default tab work. | Build `Route (app)` table | `app/rankings/page.tsx`, `VirtualizedRankingList`, player context | 2026-03-23 |
| REF-QA-001 | Deferred | P3 | Quality | Tests for `validateNFLDataResponse` invalid/edge payloads; rookie `RookieRankings` error + retry path. | TD-003 scope (resolved) | `lib/schemas/nfl-data-schemas.ts`, `components/dynasty/rookie-rankings.tsx` | 2026-03-23 |

---

## Deferred / optional (sprint and incremental)

Not blocking release; pull into sprints when capacity allows.

| Topic | IDs / tasks | Source |
|-------|-------------|--------|
| Sprint 3 optional | P1-D001–P1-D004 (API payload polish, touch-target audit on remaining pages, reusable mobile table component, skeleton loading) | [SPRINT_3_P0_P1_ISSUES.md](../sprints/sprint-3/SPRINT_3_P0_P1_ISSUES.md), [SPRINT_3_STATUS.md](../sprints/sprint-3/SPRINT_3_STATUS.md) |
| Images | Broader `next/image` adoption for avatars/logos (partial use today, e.g. player row) | [SPRINT_3_P0_P1_ISSUES.md](../sprints/sprint-3/SPRINT_3_P0_P1_ISSUES.md) (P1-014 narrative) |
| Roadmap sprints | Dynasty roadmap Sprints 4–8 | [DYNASTY_FEATURE_ROADMAP.md](../sprints/DYNASTY_FEATURE_ROADMAP.md) |
| Client debug | `NEXT_PUBLIC_DEBUG=true` enables `debugLog` / `debugInfo` in `lib/debug-utils.ts` (browser console); production builds strip most `console` via `next.config.mjs` except `error`/`warn`. | — |

---

## Resolved or superseded (compact)

| ID | Resolution | Date |
|----|------------|------|
| TD-2026-03-20-001 | **P0 LCP/TBT remediation (done).** Shipped: projections week/TTL cache + functional updates; `useMemo` (league overview, standings); dashboard debug once/session; dev-only logs (home, layout); `swcTraceProfiling` dev-only in `next.config.mjs`. See [TASK-056](../tasks/sprint-3/TASK-056-PERFORMANCE-AUDIT-RESULTS.md) for audit context; re-check Web Vitals on deploy. Acceptance: `npm run build`, `npm run test:unit`. | 2026-03-23 |
| TD-2026-03-20-002 | Sprint backlog superseded: code splitting addressed via `next/dynamic`; performance validation audit done (outcome under TD-001). | 2026-03-22 |
| TD-2026-03-20-003 | **Done:** Large-page decomposition (dashboard subviews, roster shells/tabs, trades + recommendations main views). **Sleeper/tools UX:** `useSleeperLocalLeagues`, `sleeper-tools-page-states` (hydration, load error, no-leagues cards). **Rookie data:** `RookieRankings` shows `ErrorDisplay` + retry on load failure (no silent empty list). | 2026-03-22 |
| TD-2026-03-20-004 | **Done (P2 ops docs).** [nfl-data-service runbook](../runbooks/nfl-data-service.md), [updating-nfl-season guide](../guides/updating-nfl-season.md), docs index + [SRE_ACTION_ITEMS](./SRE_ACTION_ITEMS.md) pointer; observability = Vercel logs + recommended alert table in runbook. Optional code: structured logging / metrics (`lib/logging-service`, metrics service) per SRE §4–6 — pull separately if needed. | 2026-03-23 |
| TD-2026-03-20-005 | **Done (P2).** Recommendations tools use Sleeper rosters + `usePlayerData` / `useProjections`: shared helpers in [league-roster-analysis.ts](../../lib/league-roster-analysis.ts) (greedy lineup, start/sit, complementary bench trade heuristic, waiver pool from unrostered players). Wired: [trade-recommendations.tsx](../../components/trade-recommendations.tsx), [lineup-optimizer.tsx](../../components/lineup-optimizer.tsx), [start-sit-advisor.tsx](../../components/start-sit-advisor.tsx), [strategic-insights.tsx](../../components/strategic-insights.tsx), [waiver-wire-analyzer.tsx](../../components/waiver-wire-analyzer.tsx). Tests: `lib/__tests__/league-roster-analysis.unit.test.ts`. Follow-ups: week-specific projections, real matchups/weather, richer trade UX. | 2026-03-23 |
| TD-2026-03-20-007 | **Done (P3 lib dedupe).** Single `fetchWithRetry` via [api-retry.ts](../../lib/api-retry.ts) ([fetch-with-retry.ts](../../lib/fetch-with-retry.ts) re-exports); `AbortError` not retried. Single `getCurrentNFLWeek()` in [nfl-season-utils.ts](../../lib/nfl-season-utils.ts) (`NFL_SEASON_DATES`); replaces local copies in projections context, recent activity, NFL cache service. Tests: `api-retry`, `nfl-season-utils` unit. Ongoing refactors: REF-ARCH-* (types, normalization). | 2026-03-23 |
| REF-ARCH-001 | **Done (P2).** Strict `any` cleanup: production (`prompt-builder-service`, `virtualized-ranking-list`, `use-rankings-sort`); [types/sleeper.ts](../../types/sleeper.ts) + [test-factories.ts](../../__tests__/utils/test-factories.ts) (`NFLWeeklyStats`, mock row types); [test-mocks.ts](../../__tests__/utils/test-mocks.ts) `Record<string, unknown>`; test files use `NFLDataResponse`, `AIResponseParserWithTier`, `unknown` deferred resolves, `Pick<Storage,...>`, `as unknown as` only where intentional. `npm run test:unit`, `npm run lint`. | 2026-03-23 |
| TD-2026-03-20-006 | ESLint: `npm run lint` reports no warnings or errors. | 2026-03-22 |
| (scope of TD-003) | NFL Zod validation at API: `validateNFLDataResponse`, `lib/schemas/nfl-data-schemas.ts`. | 2026-03-22 |
| (scope of TD-003) | `NoLeaguesConnected`: `components/no-leagues-connected.tsx`. | 2026-03-22 |
| (scope of TD-003) | Sleeper retry: `fetchWithRetry` / `lib/api-retry` in `lib/sleeper-api.ts`. | 2026-03-22 |
| (SRE drift) | `lib/nfl-season-utils.ts`: no hardcoded 2024 branch; old SRE “fix hardcoded 2024” item obsolete. | 2026-03-22 |
| ARCHITECTURAL_REVIEW | Dashboard state extracted to hooks (completed per review). | prior sprint |

---

## Related docs that may be stale

These files contain useful narrative but **may list “planned” work that is already done**. Trust **`OPEN_ITEMS.md`** for current status; use these for background:

- [PROJECT_STATUS.md](../planning/PROJECT_STATUS.md) — roadmap narrative; overlaps with TD/REF rows here.
- [ARCHITECTURAL_REVIEW.md](../architecture/reviews/ARCHITECTURAL_REVIEW.md) — still-valid items appear as REF-ARCH-*; TD-003 decomposition is complete (see Resolved).

---

## See also

- [ISSUE_REGISTER.md](./ISSUE_REGISTER.md) — Short alias; points here.
- [docs/README.md](../README.md) — Documentation index.
- [AGENT_GIT_WORKFLOW_BEST_PRACTICES.md](./AGENT_GIT_WORKFLOW_BEST_PRACTICES.md) — Required branch and ticket workflow for agents/contributors.
