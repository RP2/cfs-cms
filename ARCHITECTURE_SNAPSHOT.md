# CFS CMS Architecture Snapshot - December 30, 2025

## Current State

**Phase**: 1 - UI/UX First (In Progress)  
**Status**: Core UI complete, ViewWrapper pattern implemented, workspace-scoped quick links  
**Last Major Change**: Component refactor (FileGrid → ViewWrapper pattern)

## Component Hierarchy

```
+layout.svelte (App Shell)
├── app-sidebar.svelte (Workspace/Folder Navigation)
│   ├── FolderItem.svelte (Recursive)
│   └── Modals (8 components)
│       ├── NewFolderModal.svelte
│       ├── NewWorkspaceModal.svelte
│       ├── RenameModal.svelte
│       ├── EditFileModal.svelte
│       ├── DeleteConfirmModal.svelte
│       ├── DeleteWorkspaceModal.svelte
│       ├── IconPickerModal.svelte
│       └── UploadModal.svelte
│
└── +page.svelte (Main Content)
    └── ViewWrapper.svelte (Orchestrator)
        ├── GridView.svelte (Card Grid UI)
        └── ListView.svelte (Table/List UI)
```

## Data Flow

```
User Action
    ↓
UI Component
    ↓
Event Handler (in ViewWrapper or app-sidebar)
    ↓
dataService.ts function
    ↓
Store manipulation (get/set)
    ↓
Store update triggers reactivity
    ↓
$derived values update
    ↓
UI re-renders automatically
```

## Store Structure

```typescript
// Primary State
workspaces: Workspace[]           // All workspaces
currentWorkspace: Workspace|null  // Active workspace
currentFolder: Folder|null        // Active folder (null = root)
workspaceFolders: Folder[]        // ALL folders (UI filters)
currentFiles: File[]              // ALL files (UI filters)
workspaceTags: Tag[]              // All tags

// View State
currentView: ViewMode             // 'normal'|'starred'|'tags'|'trash'
viewScope: ViewScope              // Always 'workspace' (global removed)
viewType: 'grid'|'list'          // Persisted to localStorage

// Selection & Search
selectedFileIds: Set<string>      // Selected files
searchQuery: string               // Search input
appliedFilters: Set<string>       // Tag IDs for filtering
```

## Key Patterns

### ViewWrapper Pattern

**Problem**: Duplicated logic between grid and list views

**Solution**:

- ViewWrapper holds ALL state, handlers, formatters
- GridView/ListView are pure presentation (receive props only)
- Zero code duplication

**Files**:

- `src/lib/components/ViewWrapper.svelte` - Orchestrator
- `src/lib/components/GridView.svelte` - Card grid presentation
- `src/lib/components/ListView.svelte` - Table/list presentation

### Reactive Data Pattern

```svelte
<script lang="ts">
	import { workspaceFolders, currentWorkspace } from '$lib/stores';

	// ✅ CORRECT: Uses $derived for automatic reactivity
	let rootFolders = $derived(
		$workspaceFolders.filter(
			(f) => f.workspaceId === $currentWorkspace?.id && !f.deletedAt && f.parentId === null
		)
	);
</script>

<!-- Updates automatically when stores change -->
{#each rootFolders as folder}
	<FolderItem {folder} />
{/each}
```

### Data Service Pattern

```typescript
// src/lib/services/dataService.ts
export function createFolder(parentId: string | null, name: string): Folder {
	const folders = get(workspaceFolders);
	const newFolder = {
		/* ... */
	};
	workspaceFolders.set([...folders, newFolder]);
	return newFolder;
}
```

**Phase 2 Migration**: Replace `get(store)` and `set(store)` with `fetch()` API calls

## Workspace Scoping

All quick links are workspace-specific:

- **Starred**: Shows starred items in `currentWorkspace` only
- **Tags**: Shows tagged files in `currentWorkspace` only
- **Trash**: Shows deleted items in `currentWorkspace` only

No global views exist. Each workspace has its own trash, starred items, and tags.

## Deletion Rules

### Files & Folders - Soft Delete

- Set `deletedAt` timestamp
- Set `trashedUntil` (30 days from deletion)
- Moved to Trash view (workspace-scoped)
- Can be restored or permanently deleted
- Auto-purge after 30 days (Phase 2+)

### Workspaces - Permanent Delete

- Must be empty (no non-deleted files/folders)
- Throws error if content exists
- Permanently removed (no trash)
- No recovery possible
- User must clean up content first

## File Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── app-sidebar.svelte         # Main navigation
│   │   ├── ViewWrapper.svelte         # File display orchestrator
│   │   ├── GridView.svelte            # Card grid UI
│   │   ├── ListView.svelte            # Table/list UI
│   │   ├── FolderItem.svelte          # Recursive folder tree
│   │   └── modals/                    # 8 modal components
│   ├── services/
│   │   └── dataService.ts             # CRUD operations
│   ├── stores/
│   │   └── index.ts                   # Application state
│   ├── types/
│   │   └── index.ts                   # TypeScript definitions
│   ├── data/
│   │   └── mock.ts                    # Phase 1 mock data
│   └── utils.ts                       # Utility functions
├── routes/
│   ├── +layout.svelte                 # App shell
│   ├── +page.svelte                   # Main content
│   └── layout.css                     # Theme colors
└── app.html                           # HTML template
```

## Critical Rules

1. **Mock Data Import**: ONLY `src/lib/stores/index.ts` imports `mock.ts`
2. **CRUD Operations**: ALL go through `dataService.ts`
3. **Reactivity**: Use `$derived` for computed values (not functions)
4. **Store Usage**: Stores hold ALL workspace data, UI filters using `$derived`
5. **Theme Colors**: Use theme variables (e.g., `bg-accent`), never raw Tailwind colors
6. **Icons**: Use lucide-svelte, never emojis
7. **Deletion**: Soft delete files/folders, permanent delete workspaces (must be empty)

## Phase 2 Readiness

To integrate backend:

1. Update `dataService.ts` functions to call API endpoints
2. Replace `get(store)` / `set(store)` with `fetch()` calls
3. Keep all component code unchanged
4. Stores populated from API responses instead of mock data

Zero component changes required for backend integration.

## Testing Status

- ✅ TypeScript: All files compile with no errors
- ✅ Linting: Passes (some markdown formatting warnings in docs)
- ✅ Hot Reload: Sidebar, grid, breadcrumbs update immediately
- ✅ Local Testing: Full interaction testing with mock data

## What's Working

- Workspace switching and navigation
- Folder tree (unlimited depth, recursive)
- Grid/list view toggle (persisted)
- Quick links (Starred, Tags, Trash)
- CRUD operations (create, rename, delete)
- Workspace management (create, icon picker, delete with validation)
- Soft delete with 30-day retention
- Tag filtering
- Breadcrumb navigation
- File selection UI

## Next Steps (Phase 1)

See `docs/TODO.md` for complete task list:

- Context menus (right-click actions)
- Keyboard shortcuts (Ctrl+A, Delete, etc.)
- Search implementation
- Drag & drop
- Mobile responsive layout
- Accessibility audit

---

**Commit Ready**: Yes  
**Documentation**: Complete  
**Architecture**: Stable  
**Backend Ready**: Yes (only dataService needs changes)
