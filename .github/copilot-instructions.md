# GitHub Copilot Instructions for CFS CMS

You are assisting with the development of **CFS CMS**, a centralized content management system built with SvelteKit and Cloudflare infrastructure.

## Project Context

**Read these files first for complete context**:

- `README.md` - Project overview
- `docs/PROJECT_CONTEXT.md` - Architecture and all technology decisions
- `docs/TODO.md` - Current tasks and priorities
- `docs/ROADMAP.md` - 8-phase development plan

## Tech Stack

- **Framework**: SvelteKit (v2+) with TypeScript (strict mode)
- **Compute**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite on edge)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV
- **UI/UX Model**: Google Drive-like interface

## Project Philosophy

- **Learning-first**: Intentional exploration of SvelteKit (coming from Astro/React)
- **AI-friendly**: Designed for easy context handoff between AI models
- **Modular**: Features developed independently and deployed separately
- **Open source ready**: Clean code, well-documented, community-focused

## Architecture Overview

### Layer Structure

```
SvelteKit Components (UI) → State/Services → API Routes → Cloudflare Workers/D1/R2
```

### Key Folders

- `/src/routes/` - Pages and layouts (SvelteKit routing)
- `/src/lib/components/` - Reusable UI components
- `/src/lib/services/` - Business logic and API client
- `/src/lib/stores/` - Svelte stores for state management
- `/src/lib/types/` - TypeScript type definitions
- `/docs/` - All project documentation

## Code Patterns

### Component Structure

```typescript
// ComponentName.svelte
<script lang="ts">
  interface Props {
    // Props interface
  }

  let { prop1, prop2 }: Props = $props();
</script>

<template>
  <!-- Component JSX -->
</template>

<style>
  /* Scoped styles */
</style>
```

### Service Pattern

```typescript
// src/lib/services/serviceName.ts
export async function getData() {
  // API call or business logic
}
```

### Type Definitions

```typescript
// src/lib/types/Item.ts
export interface Item {
  id: string;
  name: string;
  // ...
}
```

## File Naming Conventions

- **Components**: PascalCase.svelte
- **Services**: camelCase.ts
- **Types**: PascalCase.ts
- **Routes**: Use SvelteKit conventions (+page.svelte, +layout.svelte, +server.ts)
- **Stores**: camelCase.ts with leading underscore (\_store.ts)

## Database Schema

See `docs/DATABASE.md` for complete schema. Key tables:

- `users` - User accounts
- `workspaces` - Organizations/teams
- `folders` - Hierarchical structure
- `files` - Content storage metadata
- `tags` - Content categorization
- `shares` - Public/private sharing

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run check        # TypeScript type checking
npm run lint         # Run ESLint
```

## When to Ask for Help

Ask for help with:

- Complex TypeScript types
- SvelteKit-specific patterns
- Cloudflare Workers integration
- Database schema and queries
- Architecture decisions

## Current Phase

**Phase 0 - Foundation**: ✅ COMPLETE

- Vision documented
- Architecture designed
- Database schema complete (11 tables)
- Development guides written

**Next**: Phase 1 (Authentication & Users)

## Important Notes

1. **No business logic in components** - Keep components focused on UI
2. **Soft deletes** - Use `deleted_at` column, never hard delete
3. **Type safety** - Strict TypeScript mode, all types defined
4. **Multi-tenancy** - All queries must filter by workspace_id
5. **Error handling** - Wrap async operations with try/catch
6. **Performance** - Cache in KV when appropriate, paginate large queries

## Code Quality Standards

- ✅ TypeScript strict mode (no `any`)
- ✅ Proper error handling
- ✅ Clear variable/function names
- ✅ Comments for complex logic
- ✅ Type definitions for all data
- ✅ No console.log in production code

## Handoff Information

When passing to another AI:

- Reference `docs/PROJECT_CONTEXT.md` for architecture
- Check `docs/TODO.md` for current tasks
- Review `docs/ROADMAP.md` for phase context
- Use `.cursorrules` (for Cursor IDE) as supplement

## Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)

---

**Last Updated**: December 29, 2025  
**Project Phase**: 0 - Foundation (Complete)  
**Ready For**: Development and Phase 1 Implementation
