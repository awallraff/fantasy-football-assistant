# Runbook: NFL data service

**Scope:** Node NFL pipeline (`lib/nfl-data-service.ts`, cache, `/api/nfl-data`), optional external Python API, and the NFL Data UI (`/nfl-data`).  
**Related:** [SRE_ACTION_ITEMS.md](../operations/SRE_ACTION_ITEMS.md), [updating-nfl-season.md](../guides/updating-nfl-season.md).

---

## Architecture (quick)

| Environment | Data path |
|-------------|-----------|
| **Production (Vercel)** | If `NFL_DATA_API_URL` (or `NEXT_PUBLIC_NFL_DATA_API_URL`) is set → HTTP to that service (`lib/nfl-data-api-client.ts`). If unset → empty payload + `error` explaining missing API/Python. |
| **Local dev** | Same URL check first; else spawn `python` / `python3` running `scripts/nfl_data_extractor.py` with `--years`, `--positions`, `--week`. |

**API entry:** `app/api/nfl-data/route.ts` — GET/POST, `action` = `test` | `extract` | `player` | `team` | `position` | `current-week`. Extract path uses `nflDataCacheService.extractNFLData` (Prisma-backed cache) then Zod validation (`lib/schemas/nfl-data-schemas.ts`).

---

## Common failure scenarios

### 1. Empty data + `error` in JSON (production)

**Symptoms:** UI shows no stats; network response includes `error` string.

**Causes:**

- **`NFL_DATA_API_URL` not set on Vercel** — `NFLDataService` returns structured empty response with message about configuring the URL or local Python.
- **`VERCEL=1` without external API** — by design; deploy a Render (or similar) Python wrapper and set the env var.

**Resolution:**

1. Vercel → Project → Settings → Environment Variables → set `NFL_DATA_API_URL` to the base URL of the Python service (no trailing slash required for client code; client appends `/api/nfl-data/extract?...`).
2. Redeploy. Smoke-test:  
   `GET /api/nfl-data?action=test` or `action=extract&years=2024&positions=QB`

### 2. Python / local extraction fails (development)

**Symptoms:** Terminal stderr from child process; response `error` with exception message; logs `Error extracting NFL data:`.

**Checks:**

1. **Interpreter:** Windows uses `python`, Unix-like uses `python3` (`nfl-data-service.ts`).
2. **Script path:** `process.cwd()/scripts/nfl_data_extractor.py` must exist.
3. **Dependencies:** nflreadpy / nfl_data_py stack per `scripts/` requirements (see repo README or script header).
4. **Timeout:** Default 120s; large year ranges can exceed — reduce years or increase `timeout` in options.

**Resolution:** Fix environment; re-run from `/nfl-data` page or curl local API.

### 3. Validation warning (not a hard failure)

**Symptoms:** HTTP 200 with `validation_warning` and `validation_errors` in JSON.

**Meaning:** Python returned data that failed Zod checks — partial or malformed fields.

**Resolution:** Inspect `validation_errors`; update schema or fix extractor. Treat as **degraded** until schema and data align.

### 4. HTTP 500 from `/api/nfl-data`

**Symptoms:** `500` + `{ error: 'Internal server error', message: ... }`.

**Causes:** Uncaught exception in route handler (cache/Prisma/Python client).

**Resolution:**

1. Vercel **Functions** logs or local server console — stack trace after `NFL Data API Error:`.
2. If Prisma: verify `DATABASE_URL`, migrations, and that cache tables exist.
3. Reproduce with minimal query: `?action=extract&years=2024&positions=QB`.

### 5. 404 / no data for a requested season (external nflverse)

**Symptoms:** Empty stats for a year that is “too new” (data not published yet).

**Resolution:** `LATEST_AVAILABLE_SEASON` in `lib/constants/nfl-season.ts` must not exceed what nflverse has published. See [updating-nfl-season.md](../guides/updating-nfl-season.md). Years are clamped via `clampSeasonYearsToAvailable`.

---

## Verification checklist

### External API (production)

```bash
# Replace BASE with your NFL_DATA_API_URL origin
curl -sS "${BASE}/api/nfl-data/extract?years=2024&positions=QB" | head -c 500
```

### Local Python

```bash
cd /path/to/fantasy-football-assistant
python scripts/nfl_data_extractor.py --years 2024 --positions QB
```

Expect JSON on stdout; errors on stderr.

### App API (after `npm run dev`)

```text
GET http://localhost:3000/api/nfl-data?action=test
GET http://localhost:3000/api/nfl-data?action=extract&years=2024&positions=QB
```

---

## Rollback

1. **Code:** `git revert <sha>` and push; Vercel redeploys (see [DEPLOYMENT_GUIDE.md](../integrations/vercel/DEPLOYMENT_GUIDE.md)).
2. **Config:** Remove or fix bad `NFL_DATA_API_URL` in Vercel and redeploy.
3. **Cache:** Use existing cache API routes under `app/api/cache/*` if documented for your deployment (invalidate/warm) — only if bad cached rows are suspected.

---

## Observability and alerts

**Today (no custom metrics SDK):**

- **Vercel:** Runtime logs for serverless functions — filter `NFL Data API Error`, `Cache`, `Using external NFL Data API`.
- **Client:** Browser Network tab for `/api/nfl-data` status and response body.

**Recommended monitoring (adapt to your stack — e.g. Vercel Analytics, Log Drain, Datadog):**

| Signal | Suggested condition | Severity |
|--------|---------------------|----------|
| Route failures | `5xx` rate on `/api/nfl-data` elevated for 15m | P1 |
| Empty errors | Spike in responses with `error` field populated | P1 |
| Latency | p95 of `/api/nfl-data` &gt; 60s for 10m | P2 |
| External dependency | Timeouts/abort to `NFL_DATA_API_URL` | P1 |

**Future work (not required for this runbook):** structured logging service, explicit metrics counters — see [SRE_ACTION_ITEMS.md](../operations/SRE_ACTION_ITEMS.md) items 4–6.

---

## Escalation

- **Primary:** Repo maintainers / deployment owner.
- **On-call:** Define per team (PagerDuty/Slack) — this doc does not assign names.

---

**Last updated:** 2026-03-23 (TD-2026-03-20-004)
