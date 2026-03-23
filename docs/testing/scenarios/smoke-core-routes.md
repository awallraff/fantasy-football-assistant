# Scenario: Smoke — core routes

**Last updated:** 2026-03-23  
**Type:** smoke  

---

## Preconditions

- **BASE_URL:** Set explicitly (e.g. `http://localhost:3000` or `https://dynastyff.vercel.app` after deploy).
- Dev: `npm run dev` running **or** production URL for post-deploy checks.

---

## Steps (MCP browser or manual)

Run at **375px** and once at desktop width (e.g. 1280px) unless noted.

1. **Home** — `BASE_URL/`  
   - Page loads; main CTA / league entry UI visible (not a blank error shell).

2. **Dashboard** — `BASE_URL/dashboard`  
   - Route resolves; loading or content area visible (expect login/league prompts if unauthenticated).

3. **Rankings** — `BASE_URL/rankings`  
   - Rankings UI shell loads (tabs or list region visible).

4. **Recommendations** — `BASE_URL/recommendations`  
   - Page loads without full-page crash.

5. **Trades** (if applicable) — `BASE_URL/trades`  
   - Page loads.

6. **NFL Data** — `BASE_URL/nfl-data`  
   - Page loads; tool or placeholder visible.

7. **Rookie draft** — `BASE_URL/rookie-draft`  
   - Page loads.

8. **More** — `BASE_URL/more`  
   - Navigation / links area visible.

Adjust paths if the app route map changes; keep this list aligned with `app/` routes.

---

## Optional: API health (not browser)

- `GET BASE_URL/api/cache/health` (or project health endpoint) returns success if configured in environment.

---

## Pass criteria

- [ ] No full-page Next.js error overlay on any route above (unless testing error handling intentionally).
- [ ] Console: no repeating unhandled errors during navigation (warnings may be acceptable per environment).
- [ ] At 375px, no unusable horizontal scroll on core content for these pages (known exceptions documented per ticket).

---

## After deploy

Re-run against **production** `BASE_URL` and spot-check the same routes.
