# Scenario: [short title]

**Last updated:** YYYY-MM-DD  
**Ticket (optional):** TD-2026-03-20-xxx  
**Type:** smoke | regression | performance | ticket-specific  

---

## Preconditions

- **BASE_URL:** `http://localhost:3000` (or production URL)
- **Environment:** local dev server running (`npm run dev`) or deployed build
- **Data / auth:** e.g. Sleeper test username if needed (see [CHROME_DEVTOOLS_TESTING.md](../CHROME_DEVTOOLS_TESTING.md))

---

## Steps (MCP or manual)

1. Navigate to `BASE_URL/...`
2. Resize or emulate **375px** width; confirm [describe layout expectation]
3. [Action] → [Expected result]

---

## Pass criteria

- [ ] No uncaught console errors related to [area]
- [ ] [Specific UI or data assertion]
- [ ] Touch targets / scroll behavior acceptable on 375px (if applicable)

---

## Notes

- Optional: link PR, screenshots, or Chrome DevTools MCP findings (Lighthouse, network).
