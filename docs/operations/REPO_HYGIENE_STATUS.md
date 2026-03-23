# Repository Hygiene Status

Last updated: 2026-03-20 (pass 2)
Owner: Repository hygiene pass
Scope: Markdown organization and project structure cleanliness

## Current hygiene summary

- Markdown placement has improved with task artifacts moved out of `docs/` root into `docs/tasks/sprint-3/`.
- Remaining uncategorized markdown files in `docs/` root were moved into architecture/design/operations/testing/integrations/guides folders.
- Section indexes were updated to preserve discoverability after doc moves.
- No files were deleted in this pass.

## Structural change log

| Date | Change (from -> to) | Why | Follow-up impact |
|---|---|---|---|
| 2026-03-20 | `docs/TASK-056-PERFORMANCE-AUDIT-RESULTS.md` -> `docs/tasks/sprint-3/TASK-056-PERFORMANCE-AUDIT-RESULTS.md` | Move task artifact from root into temporary-task area | Updated index and issue register source path |
| 2026-03-20 | `docs/task-057-lcp-bottleneck-analysis.md` -> `docs/tasks/sprint-3/task-057-lcp-bottleneck-analysis.md` | Reduce root-level clutter and co-locate related task docs | No code impact; docs-only move |
| 2026-03-20 | `docs/task-058-optimization-plan.md` -> `docs/tasks/sprint-3/task-058-optimization-plan.md` | Keep task planning docs grouped by sprint | No code impact; docs-only move |
| 2026-03-20 | `docs/task-058-phase1-results.md` -> `docs/tasks/sprint-3/task-058-phase1-results.md` | Keep phased task results together | No code impact; docs-only move |
| 2026-03-20 | `docs/task-058-phase2-results.md` -> `docs/tasks/sprint-3/task-058-phase2-results.md` | Keep phased task results together | No code impact; docs-only move |
| 2026-03-20 | `docs/DASHBOARD_ARCHITECTURE_REVIEW.md` -> `docs/architecture/reviews/DASHBOARD_ARCHITECTURE_REVIEW.md` | Move architecture review into canonical review folder | Updated documentation indexes and references |
| 2026-03-20 | `docs/COMPREHENSIVE_OPTIMIZATION_ASSESSMENT.md` -> `docs/architecture/reviews/COMPREHENSIVE_OPTIMIZATION_ASSESSMENT.md` | Co-locate optimization review with architecture review set | Updated internal references in assessment doc |
| 2026-03-20 | `docs/code-splitting-improvements.md` -> `docs/architecture/reviews/code-splitting-improvements.md` | Keep bundle/perf review with architecture reviews | Updated index visibility |
| 2026-03-20 | `docs/ui-ux-design-review.md` -> `docs/design/ui-ux-design-review.md` | Move design review into design category | Updated documentation index and review references |
| 2026-03-20 | `docs/ui-audit-report.md` -> `docs/design/ui-audit-report.md` | Move UX audit artifact into design category | Updated design index |
| 2026-03-20 | `docs/ios-dark-theme-dashboard-redesign.md` -> `docs/design/ios-dark-theme-dashboard-redesign.md` | Place redesign doc under design lifecycle area | Updated documentation index |
| 2026-03-20 | `docs/performance-analysis-dashboard.md` -> `docs/operations/performance-analysis-dashboard.md` | Treat performance audit artifact as operational reference | Updated operations/docs indexes and assessment references |
| 2026-03-20 | `docs/mobile-performance-audit-2025-10-24.md` -> `docs/testing/mobile-performance-audit-2025-10-24.md` | Move dated audit into testing category | Updated archive source reference |
| 2026-03-20 | `docs/sleeper-tech-stack-analysis.md` -> `docs/integrations/sleeper/sleeper-tech-stack-analysis.md` | Group Sleeper-specific analysis with Sleeper integration docs | Updated docs/integrations indexes |
| 2026-03-20 | `docs/radix-tailwind-specialist-guide.md` -> `docs/guides/radix-tailwind-specialist-guide.md` | Move implementation guide into guides category | Updated docs index visibility |

## Open hygiene risks

### Medium
- Duplicate or near-duplicate operational/testing markdown exists at repo root and `docs/` categories.
- Mixed filename conventions remain across similar doc types (`UPPERCASE_WITH_UNDERSCORES` vs `lowercase-with-dashes`) and should be normalized with redirect-safe renames.

### Low
- Filename style is mixed (`UPPERCASE_WITH_UNDERSCORES`, `lowercase-with-dashes`) across similar document types.
- A few sprint outputs in active folders may be archive-ready.

## Next safe actions

1. Standardize filename conventions for moved docs via low-risk, one-batch renames plus link updates.
2. Add yearly archive move policy to `docs/archive/` with a short README.
3. Review duplicate docs and keep one canonical source when approved.
