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
- **UI Library**: shadcn-svelte + Tailwind CSS 4.1.17
- **Compute**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite on edge)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV
- **Auth**: Cloudflare Zero Trust (MVP) + SvelteKit auth (Phase 3 optional)
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

**Phase 1 - UI/UX First (In Progress)**

Building the Google Drive-like interface with mocked data. Backend integration comes after UI is solid. Authentication deferred to Phase 3 (using Cloudflare Zero Trust for MVP protection).

### Phase 1 Strategy

- **Mock Data**: `src/lib/data/mock.ts` with `PUBLIC_USE_MOCK_DATA` env var
- **State Management**: Svelte stores (`workspace`, `folders`, `files`, `tags`, `selection`)
- **UI Components**: shadcn-svelte with theme colors (NO raw Tailwind classes)
- **Icons**: lucide-svelte icons (NO emojis)
- **Modals**: NewFolderModal, UploadModal, RenameModal, DeleteConfirmModal
- **Demo Page**: `/demo` showcases mocked CMS (public example)
- **Local Testing**: Full interaction testing without backend
- **Easy Migration**: Swap mock queries with D1 queries in Phase 2

## Styling Guidelines

### Theme Colors

**ALWAYS use theme colors from `src/routes/layout.css`, NEVER use raw Tailwind color classes**

Available theme colors:

- `primary` - Primary action color (light gray for light mode)
- `primary-foreground` - Text on primary backgrounds
- `secondary` - Secondary actions
- `muted` - Disabled/inactive states (light gray)
- `muted-foreground` - Secondary text color
- `accent` - Orange accent color (for highlights, CTAs)
- `accent-foreground` - White text on accent backgrounds
- `background` - Page background (white light mode)
- `foreground` - Primary text (dark gray light mode)
- `card` - Card backgrounds
- `border` - Border color
- `destructive` - Error/delete actions (red)
- `sidebar-*` - Sidebar-specific theme colors

**❌ BAD**: `bg-blue-500`, `text-gray-600`, `border-red-200`  
**✅ GOOD**: `bg-accent`, `text-muted-foreground`, `border-destructive`

### Icons

**ALWAYS use lucide-svelte icons, NEVER use emojis**

Import from `@lucide/svelte`:

```typescript
import { Plus, Trash2, Edit, Folder, File, Grid3x3, List, Search, Upload, ChevronDown, MoreVertical } from '@lucide/svelte';
```

Common icon usage:

- **Navigation**: `Folder`, `File`, `Grid3x3`, `List`, `ChevronDown`
- **Actions**: `Plus`, `Edit`, `Trash2`, `Upload`, `Download`
- **UI**: `Search`, `MoreVertical`, `X`, `Check`, `AlertCircle`
- **Status**: `AlertCircle`, `CheckCircle`, `Clock`, `Home`

**❌ BAD**: `<div>📁 My Folder</div>`, `<span>➕ New</span>`  
**✅ GOOD**: `<Folder class="h-4 w-4" />` with `<span>New</span>`

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
**Project Phase**: 1 - UI/UX First (In Progress)  
**Theme**: Monochromatic + Orange Accent  
**Icons**: Lucide SVG Icons  
**Ready For**: CRUD Operations & Interactive Features
