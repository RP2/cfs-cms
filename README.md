# 🎉 CFS CMS - Centralized Content Management System

A modern, open-source CMS built with SvelteKit and Cloudflare infrastructure, designed to centralize hosting and management of content across multiple websites. The UI/UX is inspired by Google Drive for familiar, intuitive content organization.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:5173 to see demo with mock data
```

## 📚 Documentation

All project documentation is in the [`/docs`](./docs) folder:

### Getting Started

- **[docs/START_HERE.md](./docs/START_HERE.md)** - Full guide with quick paths and overview
- **[docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)** - Architecture, decisions, tech stack

### Planning & Management

- **[docs/ROADMAP.md](./docs/ROADMAP.md)** - 8-phase development plan with timeline
- **[docs/TODO.md](./docs/TODO.md)** - Current tasks and priorities

### Technical Guides

- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local dev setup & running
- **[docs/DATABASE.md](./docs/DATABASE.md)** - D1 schema design (11 tables)
- **[docs/CLOUDFLARE_SETUP.md](./docs/CLOUDFLARE_SETUP.md)** - Infrastructure setup

### System Documentation

- **[docs/PROJECT_PLANNING.md](./docs/PROJECT_PLANNING.md)** - How to use this documentation system
- **[docs/DOCUMENTATION_MAP.md](./docs/DOCUMENTATION_MAP.md)** - Visual guide to all files
- **[docs/SETUP_COMPLETE.md](./docs/SETUP_COMPLETE.md)** - Summary of what was created

## 🎯 What This Project Is

A Google Drive-like CMS for:

- Centralizing content across multiple websites
- Intuitive folder/file management
- Tag-based content discovery
- Cloudflare edge infrastructure
- Open source collaboration

## 🚀 Quick Paths

**New to the project?**  
→ Start with [docs/START_HERE.md](./docs/START_HERE.md)

**Want to understand architecture?**  
→ Read [docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)

**Ready to develop locally?**  
→ Follow [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

**Need the full vision?**  
→ Review [docs/ROADMAP.md](./docs/ROADMAP.md)

## 🤖 For AI Assistance

Share these with Claude, Copilot, or Cursor:

- [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md) - Full context
- [`docs/TODO.md`](./docs/TODO.md) - Specific task
- Relevant guide from `/docs` - Technical details

The `.cursorrules` file auto-loads in Cursor IDE.

## Tech Stack

- **Framework**: SvelteKit + TypeScript (strict mode)
- **UI**: shadcn-svelte + Tailwind CSS
- **Infrastructure**: Cloudflare (Workers, D1, R2, KV)
- **Database**: D1 (SQLite on edge)
- **Storage**: R2 (S3-compatible)

## Project Status

**Phase 0 - Foundation**: ✅ COMPLETE  
**Phase 1 - UI/UX First (IN PROGRESS)**

Database schema designed, architecture planned. Currently building the user interface with shadcn-svelte components, mocked data, and Google Drive-like interaction patterns. Cloudflare backend integration happens after UI is solid.

See [docs/ROADMAP.md](./docs/ROADMAP.md) for detailed phase breakdown.

## License

MIT (planned for open source)
