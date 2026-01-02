# GitHub Copilot Instructions for CFS CMS

**CFS CMS** is a Google Drive-like content management system built with SvelteKit + Cloudflare infrastructure. This guide focuses on the patterns and workflows unique to this project.

## Essential Reading

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Three-layer data flow, Svelte 5 patterns
- [docs/PHASE1_COMPLETE.md](../docs/PHASE1_COMPLETE.md) - Current implementation status
- [docs/TODO.md](../docs/TODO.md) - Active tasks and next steps

## Tech Stack & Key Decisions

- **Framework**: SvelteKit (v2+) with Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- **UI**: shadcn-svelte (copy-paste components) + Tailwind CSS 4.1.17 (theme colors ONLY)
- **Icons**: lucide-svelte (NEVER emojis)
- **Backend (Phase 2+)**: Cloudflare Workers + D1 (SQLite) + R2 (S3-compatible storage)
- **Auth (Phase 3)**: Cloudflare Zero Trust (MVP) + optional SvelteKit auth

## Three-Layer Architecture (Critical)

```
UI Components → dataService → Svelte Stores → Mock Data (Phase 1) / API (Phase 2+)
```

**Key Rules**:

1. **Components**: Import stores, derive reactive data with `$derived`, call dataService functions
2. **dataService.ts**: All CRUD operations - ONLY file that changes in Phase 2
3. **Stores**: Hold ALL workspace data (components filter by workspace)
4. **Mock data**: ONLY imported by `src/lib/stores/index.ts`

**Why**: Enables hot reloading, prevents cross-workspace bugs, makes backend migration trivial (zero component changes).

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

<!-- GridView.svelte - ONLY presentation -->
<script lang="ts">
  interface Props {
    folders: Folder[];
    formatFileSize: (bytes: number) => string;
    onHandleCreate: () => void;
  }
  let { folders, formatFileSize, onHandleCreate }: Props = $props();
</script>

{#each folders as folder}
  <Card onclick={onHandleCreate}>{formatFileSize(folder.size)}</Card>
{/each}
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

## Key File Locations

- **Components**: `src/lib/components/` (ViewWrapper, GridView, ListView, FolderItem, app-sidebar)
- **Modals**: `src/lib/components/modals/` (NewFolder, Rename, Delete, Upload, etc.)
- **Business Logic**: `src/lib/services/dataService.ts` (ALL CRUD - only file that changes in Phase 2)
- **State**: `src/lib/stores/index.ts` (Svelte stores)
- **Types**: `src/lib/types/index.ts` (TypeScript interfaces)
- **Utils**: `src/lib/utils/` (formatters, drag, fileMetadata)
- **Mock Data**: `src/lib/data/mock.ts` (Phase 1 only)

## Project-Specific Workflows

### Development

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run check        # TypeScript type checking (run before commits)
npm run lint         # ESLint (strict mode, no warnings)
```

### Deletion Behavior (Important)

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

<!-- ❌ WRONG -->
<div>📁 Folder</div>
<Folder class="h-4 w-4" /> <span>Folder</span>
```

## Common Pitfalls

❌ **Don't** import mock data in components/modals  
✅ **Do** import stores and call dataService

❌ **Don't** use functions for reactive lists  
✅ **Do** use `$derived` for computed values

❌ **Don't** filter stores when setting them  
✅ **Do** store ALL data, filter in UI with `$derived`

❌ **Don't** put business logic in ViewWrapper/components  
✅ **Do** put it in dataService

❌ **Don't** allow workspace deletion with content  
✅ **Do** check `isEmpty` first (enforced in dataService)

## Phase 2 Backend Migration

**Only `src/lib/services/dataService.ts` needs changes**. All 20+ components remain untouched.

See [docs/BACKEND_MIGRATION.md](../docs/BACKEND_MIGRATION.md) for step-by-step guide and [docs/PHASE2_API_CONTRACT.md](../docs/PHASE2_API_CONTRACT.md) for API specifications.

**Key Insight**: Three-layer architecture makes backend swap trivial - components already use abstraction layer.

---

**Last Updated**: January 1, 2026  
**Phase**: 1 ✅ Complete → Phase 2 🚀 Ready  
**Architecture**: Three-layer data flow established & verified

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
