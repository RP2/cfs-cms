# CFS CMS - Architecture Documentation

**Last Updated**: December 31, 2025  
**Current Phase**: Phase 1 - UI/UX First (Mock Data)

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Data Flow Architecture](#data-flow-architecture)
- [Svelte 5 Patterns](#svelte-5-patterns)
- [Component Reactivity](#component-reactivity)
- [Backend Integration Strategy](#backend-integration-strategy)

---

## Overview

CFS CMS uses a **three-layer architecture** designed for easy transition from mock data (Phase 1) to Cloudflare backend (Phase 2+):

```text
┌─────────────────────────────────────────────────┐
│           UI Components / Modals                │
│  (Svelte 5 with runes, theme colors, lucide)   │
└────────────────┬────────────────────────────────┘
                 │
                 │ import stores, call dataService
                 ▼
┌─────────────────────────────────────────────────┐
│          Data Service Layer                     │
│    (Business logic, CRUD abstraction)           │
└────────────────┬────────────────────────────────┘
                 │
                 │ get(store), set(store)
                 ▼
┌─────────────────────────────────────────────────┐
│          Svelte Stores (State)                  │
│  (Single source of truth for app state)         │
└────────────────┬────────────────────────────────┘
                 │
                 │ initialization only
                 ▼
┌─────────────────────────────────────────────────┐
│            Mock Data (Phase 1)                  │
│     OR Cloudflare API (Phase 2+)                │
└─────────────────────────────────────────────────┘
```

**Critical Rule**: Mock data is ONLY imported by `stores/index.ts` for initialization. NO component, modal, or service file should import mock data directly.

---

## Technology Stack

### Frontend

- **Framework**: SvelteKit 2+ (file-based routing, SSR-ready)
- **Language**: TypeScript (strict mode, no `any`)
- **Reactivity**: Svelte 5 runes (`$state`, `$derived`, `$props`, `$bindable`, `$effect`)
- **UI Library**: shadcn-svelte components
- **Styling**: Tailwind CSS 4.1.17 (theme colors only, no raw classes)
- **Icons**: lucide-svelte (NO emojis)

### Backend (Phase 2+)

- **Compute**: Cloudflare Workers (edge functions)
- **Database**: Cloudflare D1 (SQLite on edge)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Cache**: Cloudflare KV (key-value store)
- **Auth**: Cloudflare Zero Trust (MVP) + optional SvelteKit auth (Phase 3)

---

## Data Flow Architecture

### 1. Stores Layer (`src/lib/stores/index.ts`)

**Purpose**: Single source of truth for application state

**Responsibilities**:

- Initialize state from API endpoints (with mock fallback in API routes)
- Hold ALL workspace data (not filtered by workspace)
- Provide reactive state to components

**Key Stores**:

```typescript
// All workspaces (filtered to exclude soft-deleted)
export const workspaces = writable<Workspace[]>(mockWorkspaces.filter((w) => !w.deletedAt));

// Current workspace being viewed
export const currentWorkspace = writable<Workspace | null>(mockWorkspaces[0]);

// Current folder being viewed
export const currentFolder = writable<Folder | null>(null);

// ALL folders across ALL workspaces (UI filters per workspace)
export const workspaceFolders = writable<Folder[]>(mockFolders);

// ALL files across ALL workspaces (UI filters per workspace)
export const currentFiles = writable<File[]>(mockFiles);

// Selected file IDs for bulk operations
export const selectedFileIds = writable<Set<string>>(new Set());

// View type (grid/list) with localStorage persistence
export const viewType = createViewTypeStore();
```

**Important**: Stores hold data for ALL workspaces. Components filter by `currentWorkspace` in derived values.

---

### 2. Data Service Layer (`src/lib/services/dataService.ts`)

**Purpose**: Abstraction layer for all CRUD operations

**Responsibilities**:

- Provide clean API for data operations
- Optimistic UI updates (immediate store changes)
- Background API calls (fire-and-forget for consistency)
- Handle business logic (validation, relationships, soft deletes)
- NO direct mock data imports

**Key Functions**:

```typescript
// Workspace Operations
export function createWorkspace(name: string, description: string): Workspace;
export function deleteWorkspace(workspaceId: string): void;

// Folder Operations
export function createFolder(parentId: string | null, name: string): Folder;
export function renameFolder(folderId: string, newName: string): void;
export function deleteFolder(folderId: string): void;

// File Operations
export function renameFile(fileId: string, newName: string): void;
export function deleteFile(fileId: string): void;
export function uploadFiles(files: FileList): void;
```

**Current Implementation**: Functions use optimistic updates + background API calls:

```typescript
// Current implementation pattern
export function createFolder(parentId: string | null, name: string): Folder {
	const workspace = get(currentWorkspace);
	if (!workspace) throw new Error('No workspace selected');

	// Create locally for instant UI feedback
	const newFolder: Folder = { id: generateId(), name, parentId /* ... */ };
	const folders = get(workspaceFolders);
	workspaceFolders.set([...folders, newFolder]);

	// Fire API call in background
	fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ parentId, name, workspaceId: workspace.id })
	}).catch((err) => console.error('Create folder error:', err));

	return newFolder;
}
```

---

### 3. UI Components Layer (`src/lib/components/`, `src/routes/`)

**Purpose**: Render UI and handle user interactions

**Responsibilities**:

- Import stores and derive reactive data
- Call dataService functions for mutations
- Handle UI state (modals, selections, view types)
- NO business logic, NO direct mock data imports

**Reactive Patterns**:

```svelte
<script lang="ts">
	import { currentWorkspace, workspaceFolders } from '$lib/stores';
	import { createFolder } from '$lib/services/dataService';

	// ✅ CORRECT: Derive filtered data reactively
	let rootFolders = $derived(
		$currentWorkspace
			? $workspaceFolders.filter(
					(f) => f.parentId === null && f.workspaceId === $currentWorkspace.id && !f.deletedAt
				)
			: []
	);

	// ❌ WRONG: Function won't update reactively
	function getRootFolders() {
		if (!$currentWorkspace) return [];
		return $workspaceFolders.filter((f) => f.parentId === null);
	}

	// ✅ CORRECT: Call dataService for mutations
	function handleCreate() {
		createFolder(parentId, folderName);
	}

	// ❌ WRONG: Direct mock data manipulation
	mockFolders.push(newFolder);
	workspaceFolders.set([...mockFolders.filter((f) => !f.deletedAt)]);
</script>

{#each rootFolders as folder (folder.id)}
	<FolderItem {folder} />
{/each}
```

---

## Svelte 5 Patterns

### Runes Overview

Svelte 5 introduced **runes** for explicit reactivity. Always use runes, never legacy syntax.

#### `$state` - Local Component State

```svelte
<script lang="ts">
	let count = $state(0); // Reactive local state
	let user = $state<User | null>(null); // Typed reactive state
</script>

<button onclick={() => count++}>Count: {count}</button>
```

#### `$derived` - Computed Values

```svelte
<script lang="ts">
	import { workspaceFolders, currentWorkspace } from '$lib/stores';

	// ✅ Automatically updates when workspaceFolders or currentWorkspace change
	let rootFolders = $derived(
		$workspaceFolders.filter((f) => f.workspaceId === $currentWorkspace?.id && !f.deletedAt)
	);

	let folderCount = $derived(rootFolders.length);
</script>

<p>You have {folderCount} folders</p>
```

#### `$props` - Component Props

```svelte
<script lang="ts">
	interface Props {
		folder: Folder;
		depth?: number;
	}

	let { folder, depth = 0 }: Props = $props();
</script>

<div style="margin-left: {depth * 20}px">
	{folder.name}
</div>
```

#### `$bindable` - Two-Way Binding

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  let { open = $bindable(false) } = $props();
</script>

<Dialog bind:open>...</Dialog>

<!-- Parent.svelte -->
<script lang="ts">
  let modalOpen = $state(false);
</script>

<Modal bind:open={modalOpen} />
```

#### `$effect` - Side Effects

```svelte
<script lang="ts">
	import { currentFolder } from '$lib/stores';

	let open = $state(false);

	// Auto-expand when current folder changes
	$effect(() => {
		if ($currentFolder?.id === folder.id) {
			open = true;
		}
	});
</script>
```

---

## Component Reactivity

### Hot Reloading Best Practices

**Problem**: Components not updating when data changes

**Solution**: Use `$derived` for computed values, not functions

```svelte
<!-- ❌ BAD: Won't update reactively -->
<script lang="ts">
  function getRootFolders() {
    return $workspaceFolders.filter(f => f.parentId === null);
  }
</script>

{#each getRootFolders() as folder}
  <Folder {folder} />
{/each}

<!-- ✅ GOOD: Updates immediately -->
<script lang="ts">
  let rootFolders = $derived(
    $workspaceFolders.filter(f => f.parentId === null)
  );
</script>

{#each rootFolders as folder}
  <Folder {folder} />
{/each}
```

### Store Subscriptions

**Accessing Stores in Components**:

- Use `$storeName` syntax (auto-subscribes)
- Svelte automatically cleans up subscriptions

```svelte
<script lang="ts">
	import { currentWorkspace, workspaceFolders } from '$lib/stores';

	// ✅ Automatically subscribes and updates
	let folders = $derived($workspaceFolders.filter((f) => f.workspaceId === $currentWorkspace?.id));
</script>

<p>Workspace: {$currentWorkspace?.name}</p><p>Folders: {folders.length}</p>
```

**Accessing Stores in Services**:

- Use `get()` function (one-time read)

```typescript
import { get } from 'svelte/store';
import { currentWorkspace, workspaceFolders } from '$lib/stores';

export function createFolder(name: string) {
	const workspace = get(currentWorkspace);
	const folders = get(workspaceFolders);

	// ... business logic

	workspaceFolders.set([...folders, newFolder]);
}
```

---

## Backend Integration Strategy

### Phase 1: Frontend with API Architecture (Current)

**Data Flow**:

```
Component → dataService → Stores (optimistic) + API call → Component
```

**Files**:

- `src/lib/data/mock.ts` - Mock data for API fallback only
- `src/lib/stores/index.ts` - Initialize stores from API
- `src/lib/services/dataService.ts` - Optimistic updates + API calls
- `src/routes/api/*` - API endpoints (mock fallback when no DB)

**Characteristics**:

- Optimistic UI updates (instant feedback)
- Background API calls (fire-and-forget)
- Mock data fallback in API routes (for local dev)
- Full CRUD operations ready for real backend

---

### Phase 2: Cloudflare Backend (In Progress)

**Data Flow**:

```
Component → dataService (optimistic) → API Routes → Cloudflare Workers → D1/R2 → API Routes → Component (if needed)
```

**Migration Steps**:

1. **Implement API Route Handlers** (`src/routes/api/*`):

```typescript
// src/routes/api/folders/+server.ts
export async function POST({ request, platform }) {
	const { parentId, name } = await request.json();

	// Query D1
	const result = await platform.env.DB.prepare(
		'INSERT INTO folders (id, workspace_id, parent_id, name, created_at) VALUES (?, ?, ?, ?, ?)'
	)
		.bind(newId, workspaceId, parentId, name, new Date())
		.run();

	return json(result);
}
```

2. **Replace mock data with real database queries** in API handlers:

```typescript
// Before (mock fallback)
if (!platform?.env?.DB) {
	return json(mockFolders);
}

// After (real database)
const result = await platform.env.DB.prepare(
	'INSERT INTO folders (id, workspace_id, parent_id, name, created_at) VALUES (?, ?, ?, ?, ?)'
)
	.bind(newId, workspaceId, parentId, name, new Date())
	.run();

return json(result);
```

3. **Components and dataService remain unchanged** - Already using optimistic update pattern

---

## Component Architecture Patterns

### ViewWrapper Pattern (December 30, 2025)

**Problem**: FileGrid component was becoming too large with duplicated logic between grid and list views.

**Solution**: Three-component pattern where presentation is separated from business logic:

```
ViewWrapper.svelte (Orchestrator)
├── Contains: State, handlers, formatters, derived data
├── Exports: Props to child views
└── Delegates to:
    ├── GridView.svelte (Card grid presentation)
    └── ListView.svelte (Table/list presentation)
```

#### ViewWrapper Responsibilities

**State Management**:

- All local UI state (`$state` runes)
- Modal open/close states
- Loading states
- Selected file tracking

**Derived Data**:

- Filtered folders/files based on current view
- Tag mappings
- Workspace-specific filtering
- Trash/starred/tags view logic

**Event Handlers**:

- All CRUD operations (via dataService)
- Navigation logic
- Selection management
- Modal triggers

**Utility Functions**:

- Date/size formatters
- Icon selection logic
- Tag class generation
- Trash expiry calculations

**Example**:

```svelte
<!-- ViewWrapper.svelte -->
<script lang="ts">
	// State
	let showNewFolderModal = $state(false);

	// Derived data
	let folders = $derived.by(() => {
		// Complex filtering logic
	});

	// Handlers
	function handleStarFile(fileId: string) {
		toggleFileStar(fileId);
	}

	// Formatters
	function formatFileSize(bytes: number): string {
		// Formatting logic
	}
</script>

<!-- Delegate to presentation components -->
{#if $viewType === 'grid'}
	<GridView {folders} {files} {formatFileSize} onHandleStarFile={handleStarFile} ... />
{:else}
	<ListView {folders} {files} {formatFileSize} onHandleStarFile={handleStarFile} ... />
{/if}
```

#### GridView/ListView Responsibilities

**ONLY Presentation**:

- Render UI elements (cards, tables, lists)
- Layout and styling
- User interaction triggers (call parent handlers)
- NO state management
- NO data manipulation
- NO business logic

**Props Interface**:

- Data arrays (folders, files)
- Display functions (formatters, icon getters)
- Event handlers (callbacks to ViewWrapper)
- Configuration flags (isLoading, isTrashView)

**Example**:

```svelte
<!-- GridView.svelte -->
<script lang="ts">
	interface Props {
		folders: Folder[];
		files: File[];
		formatFileSize: (bytes: number) => string;
		onHandleStarFile: (id: string) => void;
		// ... all other props
	}

	let { folders, files, formatFileSize, onHandleStarFile }: Props = $props();
</script>

<!-- Pure presentation -->
{#each files as file}
	<Card>
		<p>{formatFileSize(file.size)}</p>
		<Button onclick={() => onHandleStarFile(file.id)}>⭐</Button>
	</Card>
{/each}
```

#### Benefits

✅ **Zero Code Duplication**: All logic in ViewWrapper, shared by both views  
✅ **Consistent Behavior**: Both views use identical handlers/formatters  
✅ **Easy Maintenance**: Change logic once, affects both views  
✅ **Clear Separation**: Presentation vs business logic  
✅ **Testability**: Logic can be tested independently

#### Migration Checklist

When creating new view components:

- [ ] Move all `$state` declarations to ViewWrapper
- [ ] Move all derived data logic to ViewWrapper
- [ ] Move all event handlers to ViewWrapper
- [ ] Move all formatter functions to ViewWrapper
- [ ] GridView/ListView should ONLY receive props and render UI
- [ ] Both views should have identical Props interfaces
- [ ] No logic duplication between GridView and ListView

---

## Copy/Paste Architecture

### File Independence Model

**Core Principle**: Copied files are **completely independent** database records that happen to share the same R2 storage file.

```text
Original File (in trash)          Copy 1 (active)             Copy 2 (in workspace 2)
┌──────────────────────┐         ┌──────────────────────┐    ┌──────────────────────┐
│ id: file_123         │         │ id: file_456         │    │ id: file_789         │
│ workspaceId: ws_1    │         │ workspaceId: ws_1    │    │ workspaceId: ws_2    │
│ folderId: folder_A   │         │ folderId: folder_B   │    │ folderId: null       │
│ name: "document.pdf" │         │ name: "doc (copy)"   │    │ name: "doc (copy)"   │
│ deletedAt: 2025-12   │         │ deletedAt: null      │    │ deletedAt: null      │
│ starred: true        │         │ starred: false       │    │ starred: true        │
│ tagIds: [tag1, tag2] │         │ tagIds: []           │    │ tagIds: [tag3]       │
│ storagePath: "abc123"│◄────┐   │ storagePath: "abc123"│◄───┼──│ storagePath: "abc123"│
└──────────────────────┘     │   └──────────────────────┘    │  └──────────────────────┘
                             │                               │
                             └───────────────────────────────┘
                                  SHARED R2 FILE (content-addressed)
                                  Only deleted when ALL copies removed
```

### Independence Guarantees

**Each copy has**:

- ✅ Unique `id` (separate database row)
- ✅ Own `workspaceId` (can be in different workspace)
- ✅ Own `folderId` (can be in different location)
- ✅ Own `name` (can be renamed independently)
- ✅ Own `deletedAt` (can be trashed/restored independently)
- ✅ Own `starred` (starred status doesn't transfer)
- ✅ Own `tagIds` (tags don't transfer)
- ✅ Own `createdAt`/`updatedAt` (separate lifecycle)

**Shared between copies**:

- 🔗 `storagePath` - Points to same R2 object (content-addressed by checksum)

### Why This Works

1. **Copy from trash**: Original can be deleted, copy stays active
2. **Cross-workspace copies**: Full multi-tenant isolation
3. **Reference counting**: R2 file only deleted when ALL copies removed
4. **Zero storage duplication**: 1000 copies = 1 R2 file
5. **Independent lifecycle**: Each copy has its own trash/restore/delete flow

### Phase 2 Backend Implementation

```typescript
// When permanently deleting a file
async function permanentlyDeleteFile(fileId: string): Promise<number> {
	// 1. Delete the file record from D1
	await db.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run();

	// 2. Check remaining copies
	const result = await db
		.prepare('SELECT COUNT(*) as count FROM files WHERE storage_path = ?')
		.bind(storagePath)
		.first();

	// 3. Only delete from R2 if no copies remain
	if (result.count === 0) {
		await env.R2.delete(storagePath);
	}

	return result.count; // Return for UI feedback
}
```

---

## Best Practices

### DO ✅

- **Use Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`)
- **Use theme colors** from `layout.css` (e.g., `bg-accent`, `text-muted-foreground`)
- **Use lucide-svelte icons** (e.g., `<Folder class="h-4 w-4" />`)
- **Use `$derived`** for computed values that need reactivity
- **Import from stores** in components, derive filtered data
- **Call dataService functions** for all CRUD operations
- **Soft delete** with `deletedAt` timestamp for files/folders
- **Filter by workspace** in UI layer, stores hold all data
- **Workspace-scope quick links** (Starred, Tags, Trash per workspace)
- **Require empty workspace** before deletion (enforce in dataService)
- **Use UTC timestamps** - `.toISOString()` when sending to backend (Phase 2+)
- **Independent copies** - Each copy is a separate database row with unique lifecycle

### DON'T ❌

- **Don't import mock data** in components, modals, or services
- **Don't use raw Tailwind classes** like `bg-blue-500` (use theme colors)
- **Don't use emojis** for icons (use lucide-svelte)
- **Don't use functions** for reactive lists (use `$derived`)
- **Don't manipulate mock data directly** (use dataService)
- **Don't filter stores** when setting them (preserve all workspace data)
- **Don't hard delete** files/folders (use soft delete with `deletedAt`)
- **Don't allow workspace deletion** with content (check isEmpty first)
- **Don't make quick links global** (scope to current workspace)

---

## Deletion Behavior

### Files and Folders - Soft Delete

**Pattern**: Move to trash with 30-day retention

- Set `deletedAt` timestamp
- Set `trashedUntil` date (30 days from deletion)
- User can restore from Trash view (workspace-scoped)
- User can permanently delete from Trash view
- Auto-purge after 30 days (Phase 2+ with backend job)

**Code Example**:

```typescript
export function deleteFile(fileId: string): void {
	const file = currentFilesList.find((f) => f.id === fileId);
	if (!file) return;

	file.deletedAt = new Date();
	file.trashedUntil = computeTrashedUntil(file.deletedAt);
	file.updatedAt = file.deletedAt;

	currentFiles.set([...currentFilesList]);
}
```

### Workspaces - Permanent Delete

**Pattern**: Require empty workspace, permanent deletion

- Check workspace is empty (no non-deleted files/folders)
- Throw error if content exists
- Permanently remove from array (no trash)
- Force user to clean up content first
- No recovery possible after deletion

**Code Example**:

```typescript
export function deleteWorkspace(workspaceId: string): void {
	// Check if empty
	const hasFolders = currentFoldersList.some((f) => f.workspaceId === workspaceId && !f.deletedAt);
	const hasFiles = currentFilesList.some((f) => f.workspaceId === workspaceId && !f.deletedAt);

	if (hasFolders || hasFiles) {
		throw new Error(
			'Cannot delete workspace with content. Please delete or move all files and folders first.'
		);
	}

	// Permanently delete
	workspaces.set(currentWorkspacesList.filter((w) => w.id !== workspaceId));
}
```

**Why Different?**

- Files/folders: Individual items, frequent operations, undo is valuable
- Workspaces: Top-level containers, rare deletions, should be intentional
- Prevents accidental loss of entire workspace hierarchies
- Simpler mental model: "Clean workspace before deletion"

---

## File Structure Reference

```
src/
├── lib/
│   ├── components/
│   │   ├── app-sidebar.svelte       # Main sidebar with reactive folder list
│   │   ├── ViewWrapper.svelte       # Orchestrates grid/list views and actions
│   │   ├── GridView.svelte          # Card grid presentation
│   │   ├── ListView.svelte          # Table/list presentation
│   │   ├── FolderItem.svelte        # Recursive folder tree with derived children
│   │   └── modals/
│   │       ├── NewFolderModal.svelte
│   │       ├── NewWorkspaceModal.svelte
│   │       ├── RenameModal.svelte
│   │       ├── DeleteConfirmModal.svelte
│   │       └── DeleteWorkspaceModal.svelte
│   ├── data/
│   │   └── mock.ts                  # Mock data (ONLY imported by stores)
│   ├── services/
│   │   └── dataService.ts           # CRUD abstraction layer
│   ├── stores/
│   │   └── index.ts                 # Application state (ONLY file importing mock)
│   └── types/
│       └── index.ts                 # TypeScript type definitions
└── routes/
    ├── +layout.svelte               # App layout with breadcrumbs
    └── +page.svelte                 # Main content area
```

---

## Key Learnings

### December 30, 2025 - Architecture Refactoring

**Problem**: Cross-workspace data corruption - performing CRUD in one workspace caused items to disappear in other workspaces.

**Root Cause**:

1. Components were importing and manipulating `mockFolders`/`mockFiles` directly
2. After manipulation, they set stores to workspace-filtered subsets:
   ```typescript
   mockFolders.push(newFolder);
   workspaceFolders.set([...mockFolders.filter((f) => f.workspaceId === currentId)]); // ❌ Lost other workspaces!
   ```
3. `getRootFolders()` function didn't update reactively when data changed

**Solution**:

1. Removed ALL mock data imports from components/modals
2. All CRUD operations now go through `dataService`
3. Stores hold ALL workspace data, UI filters in `$derived` values
4. Converted functions to `$derived` for automatic reactivity

**Benefits**:

- ✅ No more cross-workspace bugs
- ✅ Hot reloading works everywhere (sidebar, grid, breadcrumbs)
- ✅ Production-ready architecture
- ✅ Easy backend migration (only modify dataService)

---

**For Future AI Models**: This architecture is intentionally designed for easy context handoff and backend integration. The three-layer separation ensures you can modify the data layer without touching 50+ component files. Always follow the data flow: UI → dataService → Stores → UI.
