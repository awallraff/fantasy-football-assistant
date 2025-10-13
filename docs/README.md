# Documentation Index

**Last Updated:** 2025-10-13

This directory contains technical documentation, guides, and runbooks for the Fantasy Football Assistant.

---

## 📚 Quick Navigation

### By Category

- **[🔌 Integrations](#integrations)** - External system integrations (Bark, Vercel, Sleeper)
- **[🏗️ Architecture](#architecture)** - System architecture, reviews, and design system
- **[🏃 Sprints](#sprints)** - Sprint-specific documentation and roadmaps
- **[✨ Features](#features)** - Feature-specific implementation docs
- **[⚙️ Operations](#operations)** - SRE, runbooks, and operational guides
- **[📋 Planning](#planning)** - Project status and roadmaps

### Claude Code Configuration

Claude-specific configuration is maintained in:
- **[CLAUDE.md](../CLAUDE.md)** - Primary AI assistant instructions (root level)
- **[.claude/instructions.md](../.claude/instructions.md)** - Additional Claude Code instructions
- **[.claude/agents/](../.claude/agents/)** - Custom agent definitions

---

## 🔌 Integrations

External system integrations and setup guides.

### Bark Push Notifications
- **[BARK_PUSH_NOTIFICATIONS.md](./integrations/bark/BARK_PUSH_NOTIFICATIONS.md)** - Setup iOS push notifications for trades, lineup deadlines, and player alerts

### Vercel Deployment
- **[DEPLOYMENT_GUIDE.md](./integrations/vercel/DEPLOYMENT_GUIDE.md)** - Vercel deployment guide
- **[VERCEL_POSTGRES_SETUP.md](./integrations/vercel/VERCEL_POSTGRES_SETUP.md)** - PostgreSQL database setup on Vercel

### Sleeper API
- **[SLEEPER_CACHE_IMPLEMENTATION.md](./integrations/sleeper/SLEEPER_CACHE_IMPLEMENTATION.md)** - Sleeper API caching implementation

---

## 🏗️ Architecture

System architecture, technical reviews, and design system documentation.

### Architecture Reviews
- **[ARCHITECTURAL_REVIEW.md](./architecture/reviews/ARCHITECTURAL_REVIEW.md)** - Code quality review with action items
- **[NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md](./architecture/reviews/NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md)** - Detailed technical review of NFL data integration
- **[NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md](./architecture/reviews/NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md)** - Executive summary of NFL data integration

### Data Layer
- **[PLAYER_DATA_ARCHITECTURE.md](./architecture/data-layer/PLAYER_DATA_ARCHITECTURE.md)** - Player data architecture and context
- **[PHASE_2_INDEXEDDB_ARCHITECTURE.md](./architecture/data-layer/PHASE_2_INDEXEDDB_ARCHITECTURE.md)** - IndexedDB persistent cache architecture

### Design System
- **[DESIGN_SYSTEM_IOS_DARK.md](./architecture/design-system/DESIGN_SYSTEM_IOS_DARK.md)** - iOS dark mode design system
- **[IOS_DARK_IMPLEMENTATION_GUIDE.md](./architecture/design-system/IOS_DARK_IMPLEMENTATION_GUIDE.md)** - Implementation guide for iOS dark theme
- **[IOS_DARK_THEME_SUMMARY.md](./architecture/design-system/IOS_DARK_THEME_SUMMARY.md)** - Summary of iOS dark theme
- **[QUICK_START_IOS_DARK.md](./architecture/design-system/QUICK_START_IOS_DARK.md)** - Quick start guide for iOS dark mode
- **[TABS_INPUT_IMPLEMENTATION.md](./architecture/design-system/TABS_INPUT_IMPLEMENTATION.md)** - Tabs and input component implementation
- **[VISUAL_MOCKUP_DESCRIPTION.md](./architecture/design-system/VISUAL_MOCKUP_DESCRIPTION.md)** - Visual design mockups and descriptions

---

## 🏃 Sprints

Sprint-specific documentation, roadmaps, and status updates.

### Roadmap
- **[DYNASTY_FEATURE_ROADMAP.md](./sprints/DYNASTY_FEATURE_ROADMAP.md)** - 6-sprint feature roadmap with task tracking

### Sprint 2
- **[SPRINT_2_STATUS.md](./sprints/sprint-2/SPRINT_2_STATUS.md)** - Sprint 2 status and progress
- **[SPRINT_2_COMPLETE.md](./sprints/sprint-2/SPRINT_2_COMPLETE.md)** - Sprint 2 completion report

### Sprint 3
- **[SPRINT_3_STATUS.md](./sprints/sprint-3/SPRINT_3_STATUS.md)** - Sprint 3 status and progress
- **[SPRINT_3_PROCESS.md](./sprints/sprint-3/SPRINT_3_PROCESS.md)** - Sprint 3 process and workflow
- **[SPRINT_3_DASHBOARD_AUDIT.md](./sprints/sprint-3/SPRINT_3_DASHBOARD_AUDIT.md)** - Dashboard audit findings
- **[SPRINT_3_MOBILE_AUDIT.md](./sprints/sprint-3/SPRINT_3_MOBILE_AUDIT.md)** - Mobile audit findings
- **[SPRINT_3_P0_P1_ISSUES.md](./sprints/sprint-3/SPRINT_3_P0_P1_ISSUES.md)** - P0/P1 priority issues
- **[SPRINT_3_PHASE2_MOBILE_FIXES.md](./sprints/sprint-3/SPRINT_3_PHASE2_MOBILE_FIXES.md)** - Phase 2 mobile fixes

---

## ✨ Features

Feature-specific implementation documentation.

### NFL Data Integration
- **[NFL_DATA_BEFORE_AFTER.md](./features/nfl-data/NFL_DATA_BEFORE_AFTER.md)** - Before/after comparison of NFL data implementation
- **[NFL_DATA_PAGE_FIXES.md](./features/nfl-data/NFL_DATA_PAGE_FIXES.md)** - NFL data page improvement roadmap
- **[NFL_DATA_INTEGRATION_QUICK_FIX_GUIDE.md](./features/nfl-data/NFL_DATA_INTEGRATION_QUICK_FIX_GUIDE.md)** - Quick fix guide for NFL data integration
- **[NFL_DATA_VERCEL_LIMITATION.md](./features/nfl-data/NFL_DATA_VERCEL_LIMITATION.md)** - Vercel limitations with NFL data processing
- **[P0-011-NFL-DATA-2025-FIX.md](./features/nfl-data/P0-011-NFL-DATA-2025-FIX.md)** - 2025 NFL data fix documentation

### Rankings
- **[ROOKIE_RANKINGS_2025_UPDATE.md](./features/rankings/ROOKIE_RANKINGS_2025_UPDATE.md)** - 2025 rookie rankings update
- **[ROOKIE_RANKINGS_SUMMARY.md](./features/rankings/ROOKIE_RANKINGS_SUMMARY.md)** - Rookie rankings summary

### Mobile Fixes
- **[MOBILE_LAYOUT_P0_FIX_REPORT.md](./features/mobile-fixes/MOBILE_LAYOUT_P0_FIX_REPORT.md)** - Mobile layout P0 fix report
- **[P0-009-TEAMS-TAB-FIX.md](./features/mobile-fixes/P0-009-TEAMS-TAB-FIX.md)** - Dashboard Teams tab fix
- **[P0-010_RANKINGS_MOBILE_SCROLL_FIX.md](./features/mobile-fixes/P0-010_RANKINGS_MOBILE_SCROLL_FIX.md)** - Rankings horizontal scroll fix

---

## ⚙️ Operations

SRE documentation, runbooks, and operational guides.

- **[SRE_ACTION_ITEMS.md](./operations/SRE_ACTION_ITEMS.md)** - SRE-identified action items
- **[SRE_REVIEW_NFL_DATA_FIXES.md](./operations/SRE_REVIEW_NFL_DATA_FIXES.md)** - Detailed SRE review of NFL data fixes

### Runbooks (Planned)
- 🔜 `runbooks/nfl-data-service.md` - Operational troubleshooting for NFL data service
- 🔜 `runbooks/cache-invalidation.md` - Cache invalidation procedures
- 🔜 `runbooks/deployment-rollback.md` - Deployment rollback procedures

---

## 📋 Planning

Project status, planning documents, and roadmaps.

- **[PROJECT_STATUS.md](./planning/PROJECT_STATUS.md)** - Current project status, priorities, and technical debt
- **[PAGE_REDESIGNS_ROADMAP.md](./planning/PAGE_REDESIGNS_ROADMAP.md)** - Page redesign roadmap

---

## 🎯 Documentation by Audience

### For Developers
**Start here:** [PROJECT_STATUS.md](./planning/PROJECT_STATUS.md) → [DYNASTY_FEATURE_ROADMAP.md](./sprints/DYNASTY_FEATURE_ROADMAP.md) → [CLAUDE.md](../CLAUDE.md)

Key docs:
- [ARCHITECTURAL_REVIEW.md](./architecture/reviews/ARCHITECTURAL_REVIEW.md) - Code quality guidelines
- [PLAYER_DATA_ARCHITECTURE.md](./architecture/data-layer/PLAYER_DATA_ARCHITECTURE.md) - Data layer patterns
- [CLAUDE.md](../CLAUDE.md) - Development conventions and commands

### For Product/Planning
**Start here:** [DYNASTY_FEATURE_ROADMAP.md](./sprints/DYNASTY_FEATURE_ROADMAP.md) → [PROJECT_STATUS.md](./planning/PROJECT_STATUS.md)

Key docs:
- [NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md](./architecture/reviews/NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md) - Technical decisions
- Sprint status docs in [sprints/](./sprints/)

### For Operations/SRE
**Start here:** [SRE_ACTION_ITEMS.md](./operations/SRE_ACTION_ITEMS.md) → [DEPLOYMENT_GUIDE.md](./integrations/vercel/DEPLOYMENT_GUIDE.md)

Key docs:
- [SRE_REVIEW_NFL_DATA_FIXES.md](./operations/SRE_REVIEW_NFL_DATA_FIXES.md) - Reliability review
- Operations runbooks in [operations/runbooks/](./operations/runbooks/) (coming soon)

### For End Users
- [BARK_PUSH_NOTIFICATIONS.md](./integrations/bark/BARK_PUSH_NOTIFICATIONS.md) - Setup push notifications
- 🔜 User-facing feature documentation

---

## 📝 Documentation Standards

### File Naming
- Use `UPPERCASE_WITH_UNDERSCORES.md` for major documents
- Use `lowercase-with-dashes.md` for guides and runbooks
- Date documents: Include "Last Updated: YYYY-MM-DD"

### Structure
All documents should include:
1. **Title and metadata** (created date, status, last updated)
2. **Overview/TL;DR** - What is this document about?
3. **Main content** - Organized with clear headings
4. **Resources/References** - Links to related docs
5. **Ownership** - Who maintains this doc?

### Maintenance
- Review quarterly (or after major releases)
- Mark outdated sections with ⚠️ warnings
- Archive superseded docs to `docs/archive/`
- Update `Last Updated` date when making changes

---

## 🔗 External Resources

- **Deployed App:** https://dynastyff.vercel.app
- **Sleeper API Docs:** https://docs.sleeper.app
- **nflreadpy Docs:** https://nflreadpy.nflverse.com
- **Next.js Docs:** https://nextjs.org/docs
- **Bark GitHub:** https://github.com/Finb/Bark
- **MCP Protocol:** https://modelcontextprotocol.io

---

## 📊 Documentation Roadmap

### Completed
- ✅ Reorganized documentation structure (2025-10-13)
- ✅ Created category-based folder hierarchy
- ✅ Updated navigation READMEs

### Sprint 6 (Testing & Documentation)
- [ ] Create `operations/runbooks/nfl-data-service.md`
- [ ] Create `operations/runbooks/cache-invalidation.md`
- [ ] Create `operations/runbooks/deployment-rollback.md`
- [ ] Create `architecture/service-layer.md`
- [ ] Create testing strategy documentation

### Future
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component library docs (Storybook)
- [ ] User onboarding guide
- [ ] Video tutorials/screencasts

---

## 🤝 Contributing to Docs

### Making Changes
1. Update the relevant document
2. Update "Last Updated" date
3. If adding new doc, update this README index
4. Keep documentation in sync with code changes

### Creating New Documentation
1. Use template from existing docs
2. Follow naming conventions above
3. Add to appropriate section in this README
4. Add folder-specific README if creating new category
5. Reference from related documents

### Documentation Requests
- Open GitHub issue with label `documentation`
- Include: target audience, content outline, priority
- Tag: @documentation-team

---

**Maintained By:** Development Team
**Review Frequency:** Quarterly
**Next Review:** 2026-01-13
