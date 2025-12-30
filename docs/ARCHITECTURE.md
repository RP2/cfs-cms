# CFS CMS - Architecture Documentation

**Last Updated**: December 30, 2025  
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

```
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

- Initialize state from mock data (Phase 1) or API (Phase 2+)
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
- Manage store updates (Phase 1) or API calls (Phase 2+)
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

**Phase 1 (Current)**: Functions use `get()` and `set()` to manipulate stores

**Phase 2 (Future)**: Functions will use `fetch()` to call API endpoints:

```typescript
// Example future implementation
export async function createFolder(parentId: string | null, name: string): Promise<Folder> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ parentId, name })
	});
	return response.json();
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
          (f) => f.parentId === null && 
                 f.workspaceId === $currentWorkspace.id && 
                 !f.deletedAt
        )
      : []
  );

  // ❌ WRONG: Function won't update reactively
  function getRootFolders() {
    if (!$currentWorkspace) return [];
    return $workspaceFolders.filter(...);
  }

  // ✅ CORRECT: Call dataService for mutations
  function handleCreate() {
    createFolder(parentId, folderName);
  }

  // ❌ WRONG: Direct mock data manipulation
  mockFolders.push(newFolder);
  workspaceFolders.set([...mockFolders.filter(...)]);
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

### Phase 1: Mock Data (Current)

**Data Flow**:

```
Component → dataService → Stores (mock data) → Component
```

**Files**:

- `src/lib/data/mock.ts` - Mock data definitions
- `src/lib/stores/index.ts` - Initialize stores from mock data
- `src/lib/services/dataService.ts` - Manipulate stores

**Characteristics**:

- All data in-memory
- No network requests
- Instant UI feedback
- Full CRUD operations work locally

---

### Phase 2: Cloudflare Backend (Future)

**Data Flow**:

```
Component → dataService → API Routes → Cloudflare Workers → D1/R2 → API Routes → dataService → Component
```

**Migration Steps**:

1. **Create API Routes** (`src/routes/api/`):

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

2. **Update dataService** (ONLY file that needs changes):

```typescript
// Before (Phase 1)
export function createFolder(parentId: string | null, name: string): Folder {
	const folders = get(workspaceFolders);
	const newFolder = {
		/* ... */
	};
	workspaceFolders.set([...folders, newFolder]);
	return newFolder;
}

// After (Phase 2)
export async function createFolder(parentId: string | null, name: string): Promise<Folder> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ parentId, name })
	});

	if (!response.ok) throw new Error('Failed to create folder');

	const newFolder = await response.json();

	// Update local store for immediate UI feedback
	const folders = get(workspaceFolders);
	workspaceFolders.set([...folders, newFolder]);

	return newFolder;
}
```

3. **Components remain unchanged** - They already use dataService abstraction

---

## Best Practices

### DO ✅

- **Use Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`)
- **Use theme colors** from `layout.css` (e.g., `bg-accent`, `text-muted-foreground`)
- **Use lucide-svelte icons** (e.g., `<Folder class="h-4 w-4" />`)
- **Use `$derived`** for computed values that need reactivity
- **Import from stores** in components, derive filtered data
- **Call dataService functions** for all CRUD operations
- **Soft delete** with `deletedAt` timestamp, never hard delete
- **Filter by workspace** in UI layer, stores hold all data

### DON'T ❌

- **Don't import mock data** in components, modals, or services
- **Don't use raw Tailwind classes** like `bg-blue-500` (use theme colors)
- **Don't use emojis** for icons (use lucide-svelte)
- **Don't use functions** for reactive lists (use `$derived`)
- **Don't manipulate mock data directly** (use dataService)
- **Don't filter stores** when setting them (preserve all workspace data)
- **Don't hard delete** records (use soft delete pattern)

---

## File Structure Reference

```
src/
├── lib/
│   ├── components/
│   │   ├── app-sidebar.svelte       # Main sidebar with reactive folder list
│   │   ├── FileGrid.svelte          # Grid/list view with derived files/folders
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
