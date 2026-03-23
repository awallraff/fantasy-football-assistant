# Agent Git Workflow Best Practices

**Purpose:** Ensure every ticket is implemented in a clean, reviewable branch and never mixed with unrelated work.

---

## Required pre-ticket workflow

1. Start from a clean baseline.
   - Run `git status --short --branch`.
   - If unrelated local edits exist, do not include them in the new ticket branch.

2. Sync `main` before branching.
   - `git checkout main`
   - `git pull --ff-only origin main`

3. Create a new branch for each ticket.
   - Never implement a new ticket directly on `main`.
   - Branch naming format:
     - `ticket/TD-2026-03-20-009-short-summary`
     - `ticket/REF-ARCH-003-short-summary`
     - `ticket/chore-short-summary` (only for explicit non-ticket chores)

4. Keep scope to one ticket per branch.
   - Do not mix multiple ticket IDs in one branch unless explicitly approved.
   - If work expands, split follow-up items into separate branches.

---

## Commit and push hygiene

1. Stage intentionally.
   - Use targeted adds for relevant files.
   - Exclude generated artifacts and local cache files.

2. Validate before push.
   - Run required checks for the ticket (at minimum lint and relevant tests).

3. Push branch, not `main`.
   - `git push -u origin <branch-name>`

4. Open a PR from the ticket branch into `main`.
   - Include ticket ID(s), summary, test evidence, and risk notes.

---

## Multi-agent coordination rules

- If multiple agents are working simultaneously, each agent must use its own ticket branch.
- Never force-push shared branches unless explicitly requested by the user.
- Resolve conflicts by rebasing or merging from updated `main`, then re-run checks.

---

## Definition of ready-to-merge

A ticket branch is ready only when all are true:

- Ticket scope is complete.
- Required checks are passing.
- `git status` is clean after final commit.
- Branch is pushed and PR is open for review.

