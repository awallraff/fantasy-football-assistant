# Documentation Index

**Last Updated:** 2025-10-11

This directory contains technical documentation, guides, and runbooks for the Fantasy Football Assistant.

---

## 📚 Quick Navigation

### User Guides
- **[Bark Push Notifications](./BARK_PUSH_NOTIFICATIONS.md)** - Setup iOS push notifications for trades, lineup deadlines, and player alerts

### Planned Documentation
- 🔜 `runbooks/nfl-data-service.md` - Operational troubleshooting for NFL data service
- 🔜 `guides/updating-nfl-season.md` - Annual season update checklist
- 🔜 `architecture/service-layer.md` - Service architecture deep dive
- 🔜 `testing/strategy.md` - Testing patterns and best practices

---

## 📋 Project-Level Documentation

Located in project root:

### Status & Planning
- **[PROJECT_STATUS.md](../PROJECT_STATUS.md)** - Current project status, priorities, and technical debt
- **[DYNASTY_FEATURE_ROADMAP.md](../DYNASTY_FEATURE_ROADMAP.md)** - 6-sprint feature roadmap with task tracking
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant instructions and project overview

### Architecture & Reviews
- **[ARCHITECTURAL_REVIEW.md](../ARCHITECTURAL_REVIEW.md)** - Code quality review with action items
- **[NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md](../NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md)** - NFL data integration overview
- **[NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md](../NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md)** - Detailed technical review

### SRE & Operations
- **[SRE_ACTION_ITEMS.md](../SRE_ACTION_ITEMS.md)** - SRE-identified action items
- **[SRE_REVIEW_NFL_DATA_FIXES.md](../SRE_REVIEW_NFL_DATA_FIXES.md)** - Detailed SRE review of NFL data fixes
- **[NFL_DATA_PAGE_FIXES.md](../NFL_DATA_PAGE_FIXES.md)** - NFL data page improvement roadmap

---

## 🎯 Documentation by Audience

### For Developers
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Start here for project overview
- [DYNASTY_FEATURE_ROADMAP.md](../DYNASTY_FEATURE_ROADMAP.md) - See what's being built
- [ARCHITECTURAL_REVIEW.md](../ARCHITECTURAL_REVIEW.md) - Code quality guidelines
- [CLAUDE.md](../CLAUDE.md) - Development conventions and commands

### For Product/Planning
- [DYNASTY_FEATURE_ROADMAP.md](../DYNASTY_FEATURE_ROADMAP.md) - Feature planning and priorities
- [NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md](../NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md) - Technical decisions summary
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Current state and metrics

### For Operations/SRE
- [SRE_ACTION_ITEMS.md](../SRE_ACTION_ITEMS.md) - Critical operational tasks
- [SRE_REVIEW_NFL_DATA_FIXES.md](../SRE_REVIEW_NFL_DATA_FIXES.md) - Reliability review
- 🔜 `runbooks/nfl-data-service.md` - Troubleshooting procedures

### For End Users
- [BARK_PUSH_NOTIFICATIONS.md](./BARK_PUSH_NOTIFICATIONS.md) - Setup push notifications
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

### Sprint 1 (This Sprint)
- ✅ Created BARK_PUSH_NOTIFICATIONS.md
- ✅ Created this README index

### Sprint 6 (Testing & Documentation)
- [ ] Create `runbooks/nfl-data-service.md`
- [ ] Create `guides/updating-nfl-season.md`
- [ ] Create `architecture/service-layer.md`
- [ ] Create `testing/strategy.md`

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
4. Reference from related documents

### Documentation Requests
- Open GitHub issue with label `documentation`
- Include: target audience, content outline, priority
- Tag: @documentation-team

---

**Maintained By:** Development Team
**Review Frequency:** Quarterly
**Next Review:** 2026-01-11
