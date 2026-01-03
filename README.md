# 🎉 CFS CMS - Centralized Content Management System

A modern, open-source CMS built with SvelteKit and Cloudflare infrastructure, designed to centralize hosting and management of content across multiple websites. The UI/UX is inspired by Google Drive for familiar, intuitive content organization.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:5173 to see demo with mock data
```

## 📚 Documentation

Start here: **[docs/INDEX.md](./docs/INDEX.md)** ⭐ - Quick navigation guide

### Essential Documentation

- **[docs/PHASE1_COMPLETE.md](./docs/PHASE1_COMPLETE.md)** - Phase 1 implementation review
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture & patterns
- **[docs/TODO.md](./docs/TODO.md)** - Tasks, progress, and how to start Phase 2
- **[docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md)** - API specifications (for Phase 2)
- **[docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md)** - Backend integration guide (for Phase 2)

### Reference

- **[docs/DATABASE.md](./docs/DATABASE.md)** - D1 schema design (11 tables)
- **[docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)** - Architecture, decisions, tech stack
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** - 8-phase development plan
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local dev setup & commands
- **[docs/COMPONENTS.md](./docs/COMPONENTS.md)** - UI component inventory

## 🎯 What This Project Is

A Google Drive-like CMS for:

- Centralizing content across multiple websites
- Intuitive folder/file management
- Tag-based content discovery
- Cloudflare edge infrastructure
- Open source collaboration

## 🚀 Quick Paths

### For Developers

```bash
# Install dependencies
npm install

# Start dev server (mock data enabled)
npm run dev

# TypeScript type checking
npm run check

# Lint code
npm run lint
```

### For Phase 2 Backend Developers

1. Read [docs/INDEX.md](./docs/INDEX.md) - Navigation guide (2 min)
2. Study [docs/PHASE1_COMPLETE.md](./docs/PHASE1_COMPLETE.md) - Phase 1 status (20 min)
3. Review [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - How it works (15 min)
4. Learn [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md) - What to build (30 min)
5. Follow [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md) - How to build (step-by-step)

**Key Insight**: Only `src/lib/services/dataService.ts` changes. All 20+ components remain untouched.

### For AI Assistants (Claude, Copilot, etc.)

1. Read [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Context & patterns
2. Study [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical details
3. Review [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md) - Requirements
4. Reference [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md) - Code examples

## 📍 Current Status (January 2, 2026)

**Phase**: 1 ✅ Complete → Phase 2 🚀 In Progress  
**Architecture**: Three-layer dual-mode (Components → dataService → Stores → Mock Data OR API)  
**Latest Update**: January 2, 2026 - All dataService functions converted to dual-mode

### Phase 1 - 100% Complete ✅

All UI/UX and interactivity implemented:

**What's Built**:

- ✅ 35+ CRUD operations (all implemented and dual-mode ready)
- ✅ 20+ UI components (all working, zero changes needed for Phase 2)
- ✅ Google Drive-like interface
- ✅ Grid and list view modes
- ✅ Drag-drop file/folder moves
- ✅ Multi-select bulk operations
- ✅ Tag-based filtering
- ✅ Soft delete with 30-day trash
- ✅ Copy/paste with independence guarantee
- ✅ Context menus and keyboard shortcuts
- ✅ Breadcrumb navigation
- ✅ Responsive mobile design

**Key Architecture**:

- **Mock Data**: `src/lib/data/mock.ts` (ONLY imported by stores)
- **Data Service**: All CRUD through `src/lib/services/dataService.ts` (now dual-mode)
- **Reactive UI**: Svelte 5 `$derived` for hot reloading
- **ViewWrapper Pattern**: Zero code duplication between views
- **TypeScript**: Strict mode, no errors
- **Fire-and-Forget Pattern**: Optimistic UI + background async API calls

### Phase 2 - Backend Integration (🚀 Just Started!)

**What's Done Today** (January 2, 2026):

- ✅ **Converted all 35+ dataService functions to dual-mode**
  - Works with mock data (Phase 1) or API (Phase 2)
  - Fire-and-forget pattern: sync returns, background API calls
  - Optimistic UI updates: stores update before API response
  - Zero component changes needed

- ✅ **Fixed API endpoint error handling** (5 endpoints)
  - Changed from `httpError()` → `json()` pattern
  - Proper HTTP status codes
  - Ready for production

- ✅ **Created comprehensive testing checklist**
  - [docs/TESTING_CHECKLIST.md](./docs/TESTING_CHECKLIST.md)
  - 100+ test cases across all operations
  - Mock mode and API mode verification

- ✅ **Documented Phase 2 status**
  - [docs/PHASE2_STATUS.md](./docs/PHASE2_STATUS.md)
  - Full dual-mode architecture explanation
  - Deployment readiness checklist

**What's Ready for Testing**:

- **Mock Mode** (Current - `PUBLIC_USE_MOCK_DATA=true`)
  - All operations instant and working
  - Perfect for demo and UI testing
  - Ready to deploy as-is

- **API Mode** (Next - Requires backend endpoints)
  - API contract complete ([docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md))
  - Migration guide ready ([docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md))
  - Zero component modifications needed
  - Seamless upgrade path

**Estimated Duration**: 20-30 hours to create backend endpoints

See [docs/PHASE2_STATUS.md](./docs/PHASE2_STATUS.md) for full status.
See [docs/PHASE1_COMPLETE.md](./docs/PHASE1_COMPLETE.md) for Phase 1 review.

## 🎯 Next Steps

**Starting Phase 2?** Follow [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md)

**Need context?** Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**Want full specs?** See [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md)

See [docs/TODO.md](./docs/TODO.md) for detailed task list.

---

## 📚 Full Documentation

**Just getting started?**  
→ Start with [docs/INDEX.md](./docs/INDEX.md) for quick navigation

**Want to understand how it works?**  
→ Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**Building Phase 2 backend?**  
→ Follow [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md)

**Need API specifications?**  
→ See [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md)

**Full project vision?**  
→ Review [docs/ROADMAP.md](./docs/ROADMAP.md)

## 🤖 For AI Assistance

Use these files as context when working with Claude, Copilot, or Cursor:

- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Full AI instructions
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical patterns & examples
- [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md) - API spec for reference
- [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md) - Code migration examples
- [docs/TODO.md](./docs/TODO.md) - Current tasks

The `.cursorrules` file auto-loads in Cursor IDE for automatic context.

## Tech Stack

- **Framework**: SvelteKit + TypeScript (strict mode)
- **UI**: shadcn-svelte + Tailwind CSS
- **Infrastructure**: Cloudflare (Workers, D1, R2, KV)
- **Database**: D1 (SQLite on edge)
- **Storage**: R2 (S3-compatible)

## Project Status

**Phase 0 - Foundation**: ✅ COMPLETE  
**Phase 1 - UI/UX First**: ✅ COMPLETE (100% - all CRUD, components, interactivity)  
**Phase 2 - Backend Integration**: 🚀 READY (API contract defined, migration guide prepared)

**Current Focus**: Phase 2 backend integration (see [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md))

**Architecture Ready**: Only `src/lib/services/dataService.ts` changes for Phase 2. All 20+ components remain untouched.

See [docs/ROADMAP.md](./docs/ROADMAP.md) for full phase breakdown through Phase 8.

## License

MIT (planned for open source)
