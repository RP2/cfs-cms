# 🎉 CFS CMS - Centralized Content Management System

A modern, open-source CMS built with SvelteKit and Cloudflare infrastructure, designed to centralize hosting and management of content across multiple websites. The UI/UX is inspired by Google Drive for familiar, intuitive content organization.

## Quick Start

```bash
npm install

# Option A: Seed UI from mock data
echo "PUBLIC_USE_MOCK_DATA=true" > .env.local
npm run dev

# Option B: Static demo via API fallbacks (no env needed)
# Lists start empty; all routes work without Cloudflare bindings
npm run dev
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

**Key Insight**: Components remain untouched. Implement API route handlers and connect Cloudflare D1/R2; dataService already calls them.

### For AI Assistants (Claude, Copilot, etc.)

1. Read [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Context & patterns
2. Study [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical details
3. Review [docs/PHASE2_API_CONTRACT.md](./docs/PHASE2_API_CONTRACT.md) - Requirements
4. Reference [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md) - Code examples

## 📍 Current Status (January 6, 2026)

**Phase**: 1 ✅ Complete → Phase 2 🚀 In Progress  
**Architecture**: Three-layer (Components → dataService → Stores). dataService is API-only; mock support lives in API route fallbacks and optional store seeding.  
**Latest Update**: January 6, 2026 - 27 API endpoints implemented with mock fallbacks; dataService simplified to API-only

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

- **Mock Data**: `src/lib/data/mock.ts` (ONLY imported by stores when `PUBLIC_USE_MOCK_DATA=true`)
- **Data Service**: All CRUD via `src/lib/services/dataService.ts` (API-only, optimistic updates)
- **API Routes**: `src/routes/api/*` implement 27 endpoints with mock fallbacks
- **Reactive UI**: Svelte 5 `$derived` for hot reloading
- **ViewWrapper Pattern**: Zero code duplication between views
- **TypeScript**: Strict mode, no errors
- **Fire-and-Forget Pattern**: Optimistic UI + background async API calls

### Phase 2 - Backend Integration (🚀 In Progress)

**What's Done (January 6, 2026):**

- ✅ **Simplified dataService to API-only** (optimistic UI + background API calls)
- ✅ **Implemented 27 API endpoints** with mock fallbacks for static demos
- ✅ **Added mock fallbacks to core CRUD routes** (workspaces, folders, files, tags, moves)
- ✅ **Phase 1 docs and architecture updated** (see docs/\*)

**Ways to Run**:

- **Mock Store Seeding** (`PUBLIC_USE_MOCK_DATA=true`)
  - Seeds UI from `src/lib/data/mock.ts` via Svelte stores
  - Great for rich demo content without Cloudflare

- **API Fallback Demo** (no env needed)
  - All API routes return synthetic or empty data if Cloudflare bindings are missing
  - Ideal for static demos; lists start empty and mutate via actions

**Backend**: Cloudflare setup supported. Replace fallbacks with real D1/R2 queries per [docs/BACKEND_MIGRATION.md](./docs/BACKEND_MIGRATION.md).

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
**Phase 2 - Backend Integration**: 🚀 In Progress (27 endpoints implemented + mock fallbacks)

**Current Focus**: Connect Cloudflare D1/R2 in your environment. Handlers already include D1 logic with graceful fallbacks.

**Architecture Ready**: UI remains unchanged. dataService is API-only; components stay untouched during backend integration.

See [docs/ROADMAP.md](./docs/ROADMAP.md) for full phase breakdown through Phase 8.

## License

MIT (planned for open source)
