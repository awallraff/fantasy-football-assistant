# Guide: Updating for a new NFL season

When **nflverse** (via nflreadpy / `scripts/nfl_data_extractor.py`) publishes stats for a new league year, update the app so UI defaults, AI prompts, and API clamps stay correct.

**Typical timing:** Late August–September when regular-season data exists for the new year (parquet files available). Requesting a season before it exists yields empty data or upstream 404s.

---

## 1. When to update

- **Calendar:** After you confirm data for year **Y** loads (e.g. `stats_player_week_Y.parquet` or equivalent in nflverse).
- **Signal:** Features that list seasons (dashboard, trades, NFL Data page) should default to **Y**; rankings/AI should use **Y** for “latest” historical context where applicable.

---

## 2. Canonical constant

**File:** [`lib/constants/nfl-season.ts`](../../lib/constants/nfl-season.ts)

1. Bump:

   ```ts
   export const LATEST_AVAILABLE_SEASON = YYYY
   ```

2. Add a short `@changelog` bullet with date and reason.

This constant drives:

- `getDefaultSeasonYear()`, `getAvailableSeasonYears()`, `clampSeasonYearsToAvailable()`
- [`lib/nfl-data-fetcher-service.ts`](../../lib/nfl-data-fetcher-service.ts) — AI / historical fetch year
- [`lib/prompt-builder-service.ts`](../../lib/prompt-builder-service.ts) — default year for prompts
- [`components/nfl-data-manager-fixed.tsx`](../../components/nfl-data-manager-fixed.tsx) — UI default year selection
- Tests that assert against `LATEST_AVAILABLE_SEASON` (e.g. `__tests__/sleeper-api.unit.test.ts`)

---

## 3. Secondary checks (search the repo)

Run a project-wide search for hardcoded years in **user-facing** or **API** paths:

```bash
# Example — adjust as needed
rg "202[0-9]" lib/ app/ components/ --glob "*.ts*" | rg -v node_modules
```

Pay attention to:

- **Sleeper** season loops (e.g. `getUserLeagues` for multiple years) — ensure the range still includes the new season if product requires it.
- **Rankings page** default `selectedYear` / week — align with product (may already use `getNextUpcomingWeek` or constants).
- **Projections context** (`contexts/projections-context.tsx`) — `year: 2025` in `generateAIRankings`; update to current league year when you intentionally roll AI defaults.

---

## 4. Verify data availability

### Local Python

```bash
python scripts/nfl_data_extractor.py --years YYYY --positions QB --week 1
```

Expect valid JSON with non-empty `metadata` / player counts when data exists.

### Local API

With `npm run dev`:

```text
GET /api/nfl-data?action=extract&years=YYYY&positions=QB&week=1
```

No `validation_warning` preferred; if present, fix schema or data before release.

### Production

After deploy, hit the same query against your production origin (or external `NFL_DATA_API_URL` service directly).

---

## 5. Testing checklist

- [ ] `npm run lint`
- [ ] `npm run test:unit` (especially `sleeper-api`, `nfl-data-fetcher-service`, `use-dashboard-data` if touched)
- [ ] `npm run build`
- [ ] Manual: connect Sleeper, confirm league year selector includes new season
- [ ] Manual: `/nfl-data` — extract for new year succeeds

---

## 6. Deployment

1. Merge to `main` (or your release branch).
2. Confirm Vercel build succeeds.
3. Confirm env vars unchanged unless the external NFL API base URL changed.
4. Spot-check production URL (e.g. `dynastyff.vercel.app` per project practice).

---

## 7. Rollback

Revert the commit that bumped `LATEST_AVAILABLE_SEASON` or restore the previous value in `lib/constants/nfl-season.ts` and redeploy.

---

## Related docs

- [nfl-data-service runbook](../runbooks/nfl-data-service.md)
- [SRE_ACTION_ITEMS.md](../operations/SRE_ACTION_ITEMS.md)

---

**Last updated:** 2026-03-23 (TD-2026-03-20-004)
