# AI-CONTEXT.md - CFS CMS Development Guide

**CFS CMS** is a Google Drive-like content management system built with SvelteKit + Cloudflare infrastructure. This is the primary context document for AI agents working on this project.

## Quick Start for AI Agents

**Essential Reading Path** (15 minutes):

1. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical patterns (15 min)
2. [docs/PHASE2_API_CONTRACT.md](docs/PHASE2_API_CONTRACT.md) - API specs (30 min)
3. [docs/TODO.md](docs/TODO.md) - Current tasks (5 min)

**Current Phase**: Phase 1 ✅ Complete → Phase 2 🚀 Backend Integration In Progress

## Tech Stack & Architecture

**Framework**: SvelteKit (v2+) with Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)  
**UI**: shadcn-svelte + Tailwind CSS 4.1.17 (theme colors ONLY)  
**Icons**: lucide-svelte (NEVER emojis)  
**Backend**: Cloudflare Workers + D1 (SQLite) + R2 storage

### Three-Layer Architecture (Critical)

```
UI Components → dataService → Svelte Stores → Mock Data (Phase 1) / API (Phase 2+)
```

**Key Rules**:

1. **Components**: Import stores, derive reactive data with `$derived`, call dataService functions
2. **dataService.ts**: All CRUD operations - ONLY file that changes in Phase 2
3. **Stores**: Hold ALL workspace data (components filter by workspace)
4. **Mock data**: ONLY imported by `src/lib/stores/index.ts`

**Why**: Enables hot reloading, prevents cross-workspace bugs, makes backend migration trivial.

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run cf:dev           # Cloudflare dev mode with persistence

# Code Quality (ALWAYS run before committing)
npm run check            # TypeScript type checking
npm run lint             # ESLint + Prettier check
npm run format           # Prettier formatting

# Testing
npm run test:api         # Run API tests with Vitest

# Build & Deploy
npm run build            # Production build
npm run cf:deploy        # Deploy to Cloudflare Workers
```

## Critical Code Patterns

### ✅ Reactive Lists (MUST Use $derived)

```svelte
<script lang="ts">
	import { workspaceFolders, currentWorkspace } from '$lib/stores';

	// ✅ CORRECT: Auto-updates when data changes
	let rootFolders = $derived(
		$workspaceFolders.filter(
			(f) => f.parentId === null && f.workspaceId === $currentWorkspace?.id && !f.deletedAt
		)
	);

	// ❌ WRONG: Won't update reactively
	function getRootFolders() {
		return $workspaceFolders.filter((f) => f.parentId === null);
	}
</script>

{#each rootFolders as folder (folder.id)}
	<FolderItem {folder} />
{/each}
```

### ✅ ViewWrapper Pattern (Presentation vs Logic)

**ViewWrapper.svelte**: State, handlers, formatters, derived data  
**GridView.svelte / ListView.svelte**: Pure presentation, receive props

```svelte
<!-- ViewWrapper.svelte -->
<script lang="ts">
  import { createFolder } from '$lib/services/dataService';

  let showModal = $state(false);
  let folders = $derived.by(() => /* complex filtering */);

  function handleCreate() {
    createFolder(parentId, name);
    showModal = false;
  }

  function formatFileSize(bytes: number): string { /* ... */ }
</script>

{#if $viewType === 'grid'}
	<GridView {folders} {formatFileSize} onHandleCreate={handleCreate} />
{:else}
	<ListView {folders} {formatFileSize} onHandleCreate={handleCreate} />
{/if}
```

### ✅ Data Service (All CRUD Operations)

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

// Phase 2: Replace with API call
export async function createFolder(parentId: string | null, name: string): Promise<Folder> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		body: JSON.stringify({ parentId, name })
	});
	const newFolder = await response.json();

	// Update local store for immediate UI feedback
	const folders = get(workspaceFolders);
	workspaceFolders.set([...folders, newFolder]);
	return newFolder;
}
```

## Styling Standards

### Theme Colors (Required)

**NEVER use raw Tailwind classes** (`bg-blue-500`, `text-gray-600`). ONLY use theme colors from `src/routes/layout.css`:

```svelte
<!-- ❌ WRONG -->
<div class="bg-blue-500 text-gray-600">

<!-- ✅ CORRECT -->
<div class="bg-accent text-muted-foreground">
```

**Available**: `primary`, `secondary`, `accent`, `muted`, `destructive`, `background`, `foreground`, `card`, `border`, `sidebar-*`

### Icons (Required)

**ALWAYS lucide-svelte, NEVER emojis**:

```svelte
<!-- ✅ CORRECT -->
<script>
	import { Folder } from 'lucide-svelte';
</script>

<!-- ❌ WRONG --><div>📁 Folder</div>
```

## Key File Locations

- **Components**: `src/lib/components/` (ViewWrapper, GridView, ListView, FolderItem, app-sidebar)
- **Modals**: `src/lib/components/modals/` (NewFolder, Rename, Delete, Upload, etc.)
- **Business Logic**: `src/lib/services/dataService.ts` (ALL CRUD - only file that changes in Phase 2)
- **State**: `src/lib/stores/index.ts` (Svelte stores)
- **Types**: `src/lib/types/index.ts` (TypeScript interfaces)
- **Utils**: `src/lib/utils/` (formatters, drag, fileMetadata)
- **Mock Data**: `src/lib/data/mock.ts` (Phase 1 only)

## Project-Specific Workflows

### Deletion Behavior

- **Files/Folders**: Soft delete with `deletedAt` (30-day trash, workspace-scoped)
- **Workspaces**: Permanent delete (requires empty workspace, throws error if not)

### Copy/Paste Architecture

Copied files are **independent database records** sharing the same R2 storage:

- Each copy has unique `id`, `workspaceId`, `folderId`, `name`, `starred`, `tagIds`
- All copies share `storagePath` (content-addressed by checksum)
- R2 file only deleted when ALL copies removed (reference counting)

### Drag-Drop System

Centralized in `src/lib/utils/drag.ts`:

- `DRAG_ARM_DELAY_MS = 30` - Delay before drag activates
- `DRAG_MOVE_THRESHOLD_PX = 8` - Movement threshold to start drag
- ViewWrapper owns drag controller, GridView/ListView use hooks
- Moves route through `dataService.moveFilesToFolder()` / `moveFilesToWorkspace()`

## Common Pitfalls

❌ **Don't** import mock data in components/modals  
✅ **Do** import stores and call dataService

❌ **Don't** use functions for reactive lists  
✅ **Do** use `$derived` for computed values

❌ **Don't** filter stores when setting them  
✅ **Do** store ALL data, filter in UI with `$derived`

❌ **Don't** put business logic in ViewWrapper/components  
✅ **Do** put it in dataService

❌ **Don't** use raw Tailwind color classes  
✅ **Do** use theme color CSS variables

❌ **Don't** use emojis instead of icons  
✅ **Do** use lucide-svelte icons consistently

## Phase 2 Backend Migration

**Only `src/lib/services/dataService.ts` needs changes**. All 20+ components remain untouched.

See [docs/BACKEND_MIGRATION.md](docs/BACKEND_MIGRATION.md) for step-by-step guide and [docs/PHASE2_API_CONTRACT.md](docs/PHASE2_API_CONTRACT.md) for API specifications.

**Key Insight**: Three-layer architecture makes backend swap trivial - components already use abstraction layer.

## Error Handling

- Use try-catch blocks in dataService functions
- Return consistent error objects with `message` and `code` properties
- Handle loading states in components with `$state`
- Validate user inputs before API calls

## Testing Strategy

- **Vitest** for API testing (24/24 tests passing)
- **Real D1 database** for integration tests
- **Cross-workspace operations** validated
- **Run single test**: `npm run test:api -- [test-file-name]`

## Formatting Rules

- **Tabs**: Use tabs (not spaces)
- **Quotes**: Single quotes
- **Trailing commas**: None
- **Line width**: 100 characters
- **Svelte parser**: For `.svelte` files

## Handoff Information

When passing to another AI:

- Reference this file first for complete context
- Check `docs/TODO.md` for current tasks
- Review `docs/ARCHITECTURE.md` for technical patterns
- Use `docs/PHASE2_API_CONTRACT.md` for API specifications

## Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)

---

**Last Updated**: January 20, 2026  
**Phase**: 1 ✅ Complete → Phase 2 🚀 Backend Integration In Progress  
**Architecture**: Three-layer data flow established & verified
