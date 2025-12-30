# GitHub Copilot Instructions for CFS CMS

You are assisting with the development of **CFS CMS**, a centralized content management system built with SvelteKit and Cloudflare infrastructure.

## Project Context

**Read these files first for complete context**:

- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - **NEW**: Data flow, Svelte 5 patterns, hot reload guide
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

**For complete architecture details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

### Three-Layer Data Flow (Established December 30, 2025)

```
UI Components → Data Service → Svelte Stores → Mock Data (Phase 1) / API (Phase 2+)
```

**Critical Rules**:

- ✅ Mock data ONLY imported by `src/lib/stores/index.ts`
- ✅ All CRUD operations use `src/lib/services/dataService.ts`
- ✅ Components use `$derived` for reactive computed values
- ✅ Hot reloading works everywhere (sidebar, grid, breadcrumbs)
- ✅ Backend-ready: only dataService needs changes for Phase 2

### Key Folders

- `/src/routes/` - Pages and layouts (SvelteKit routing)
- `/src/lib/components/` - Reusable UI components
  - `app-sidebar.svelte` - Main sidebar with workspace/folder navigation
  - `ViewWrapper.svelte` - File/folder display orchestrator (state & logic)
  - `GridView.svelte` - Card grid presentation (pure UI)
  - `ListView.svelte` - Table/list presentation (pure UI)
  - `FolderItem.svelte` - Recursive folder tree component
  - `modals/` - All modal dialogs (NewFolder, Rename, Delete, etc.)
- `/src/lib/services/` - Business logic and API client
  - `dataService.ts` - All CRUD operations, abstracts data access
- `/src/lib/stores/` - Svelte stores for state management
- `/src/lib/types/` - TypeScript type definitions
- `/src/lib/data/` - Mock data (Phase 1 only)
- `/docs/` - All project documentation

## Code Patterns

**For comprehensive Svelte 5 patterns, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#svelte-5-patterns)**

### Component Structure (Svelte 5 Runes)

```svelte
<!-- ComponentName.svelte -->
<script lang="ts">
	import { workspaceFolders, currentWorkspace } from '$lib/stores';

	interface Props {
		folder: Folder;
		depth?: number;
	}

	let { folder, depth = 0 }: Props = $props();

	// ✅ Use $derived for reactive computed values
	let children = $derived(
		$workspaceFolders.filter((f) => f.parentId === folder.id && !f.deletedAt)
	);
</script>

<div style="margin-left: {depth * 20}px">
	{folder.name} ({children.length} children)
</div>
```

### Data Service Pattern

```typescript
// src/lib/services/dataService.ts
import { workspaceFolders } from '$lib/stores';
import { get } from 'svelte/store';

export function createFolder(parentId: string | null, name: string): Folder {
	const folders = get(workspaceFolders);
	const newFolder = {
		/* ... */
	};
	workspaceFolders.set([...folders, newFolder]);
	return newFolder;
}
```

### Reactive List Pattern (IMPORTANT)

```svelte
<script lang="ts">
	import { workspaceFolders, currentWorkspace } from '$lib/stores';

	// ❌ BAD: Won't update reactively
	function getRootFolders() {
		return $workspaceFolders.filter((f) => f.parentId === null);
	}

	// ✅ GOOD: Updates immediately when data changes
	let rootFolders = $derived($workspaceFolders.filter((f) => f.parentId === null && !f.deletedAt));
</script>

{#each rootFolders as folder (folder.id)}
	<Folder {folder} />
{/each}
```

### Legacy Service Pattern (Pre-December 30)

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

### Phase 1 Architecture (December 30, 2025)

**Three-Layer Data Flow**:

```
UI Components → dataService → Stores → Mock Data (initialization only)
```

**Implementation**:

- **Mock Data**: `src/lib/data/mock.ts` - ONLY imported by `src/lib/stores/index.ts`
- **Data Service**: `src/lib/services/dataService.ts` - All CRUD operations
- **State Management**: Svelte stores hold ALL workspace data (UI filters per workspace)
- **UI Components**: Use `$derived` for reactive data, call dataService for mutations
- **Hot Reload**: Sidebar, grid, breadcrumbs update immediately on data changes
- **Backend Ready**: Only dataService needs changes for Phase 2 API integration

### Phase 1 Benefits

- **Local Testing**: Full interaction testing without backend
- **Hot Reloading**: All views update immediately on CRUD operations
- **Production-Ready Architecture**: Clean separation of concerns
- **Easy Migration**: Only modify dataService for backend integration (zero component changes)

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
import {
	Plus,
	Trash2,
	Edit,
	Folder,
	File,
	Grid3x3,
	List,
	Search,
	Upload,
	ChevronDown,
	MoreVertical
} from '@lucide/svelte';
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
2. **Deletion rules**:
   - Files/folders: Soft delete with `deletedAt` (30-day trash retention)
   - Workspaces: Permanent delete (must be empty, no trash for workspaces)
3. **Workspace scoping**: Quick links (Starred, Tags, Trash) are workspace-specific
4. **Type safety** - Strict TypeScript mode, all types defined
5. **Multi-tenancy** - All queries must filter by workspace_id
6. **Error handling** - Wrap async operations with try/catch
7. **Performance** - Cache in KV when appropriate, paginate large queries

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

**Last Updated**: December 30, 2025  
**Project Phase**: 1 - UI/UX First (In Progress)  
**Theme**: Monochromatic + Orange Accent  
**Icons**: Lucide SVG Icons  
**Component Architecture**: ViewWrapper → GridView/ListView pattern  
**Ready For**: CRUD Operations & Interactive Features
