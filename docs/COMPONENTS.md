# CFS CMS Components Documentation

This document tracks shadcn-svelte components and custom application components for easy reference across AI models and development sessions.

**Last Updated**: December 30, 2025  
**Installation Command**: `npx shadcn-svelte@latest add [component-name]`

---

## Custom Application Components

### ViewWrapper Pattern (Core Architecture)

**Purpose**: Orchestrate file/folder display with separated presentation logic

#### ViewWrapper.svelte

- **Location**: `src/lib/components/ViewWrapper.svelte`
- **Role**: State manager, event handler, data orchestrator
- **Contains**:
  - All UI state (`$state` runes)
  - Derived data filtering (folders, files, tags)
  - Event handlers for all CRUD operations
  - Utility functions (formatters, icon selection)
  - Modal state management
- **Delegates to**: GridView.svelte or ListView.svelte based on `$viewType`
- **Imports**: Stores, dataService, modals
- **NO**: Direct presentation rendering (delegates to child views)

#### GridView.svelte

- **Location**: `src/lib/components/GridView.svelte`
- **Role**: Card grid presentation layer
- **Contains**:
  - Grid layout with Card components
  - File/folder card rendering
  - Context menus
  - Loading skeletons
- **Receives**: All data and handlers via props from ViewWrapper
- **NO**: State management, business logic, data manipulation

#### ListView.svelte

- **Location**: `src/lib/components/ListView.svelte`
- **Role**: Table/list presentation layer
- **Contains**:
  - Table layout with rows
  - File/folder list rendering
  - Context menus
  - Loading skeletons
- **Receives**: All data and handlers via props from ViewWrapper
- **NO**: State management, business logic, data manipulation

**Key Principle**: ViewWrapper holds ALL logic. GridView and ListView are **pure presentation** components that render UI based on props.

### Other Custom Components

#### app-sidebar.svelte

- Collapsible sidebar with workspace/folder navigation
- Uses shadcn sidebar-07 variant
- Reactive folder tree using FolderItem

#### FolderItem.svelte

- Recursive folder tree component
- Self-referencing for unlimited depth
- Uses `$derived` for reactive child folders

#### Modals (src/lib/components/modals/)

- NewFolderModal.svelte
- NewWorkspaceModal.svelte
- RenameModal.svelte
- EditFileModal.svelte
- DeleteConfirmModal.svelte
- DeleteWorkspaceModal.svelte
- UploadModal.svelte

---

## shadcn-svelte Components Inventory

## ✅ Installed Components

### Data Display

- ✅ **card** - File/folder grid items, content containers
- ✅ **table** - Alternative list view for files

### Forms & Input

- ✅ **input** - Search bar, text inputs, form fields
- ✅ **select** - Dropdown selectors (⚠️ overwrites separator component)
- ✅ **dialog** - Modals for create, rename, delete, upload actions

### Navigation & Menus

- ✅ **button** - All interactive buttons throughout UI
- ✅ **dropdown-menu** - Workspace switcher, user menu, bulk actions
- ✅ **context-menu** - Right-click file/folder actions
- ✅ **breadcrumb** - Current path navigation (Home > Projects > 2025)

### Layout & Organization

- ✅ **tabs** - Grid/list view toggle
- ✅ **toggle-group** - Toggle button groups (grid/list view)
- ✅ **separator** - Visual dividers between sections
- ✅ **sidebar** - Collapsible responsive sidebar (sidebar-07 variant)

### Feedback & Indicators

- ✅ **checkbox** - Multi-select files/folders
- ✅ **badge** - Tag display on files
- ✅ **avatar** - User profile pictures in header
- ✅ **label** - Form labels in modals
- ✅ **scroll-area** - Scrollable folder trees
- ✅ **tooltip** - Hover hints on buttons
- ✅ **alert** - Error/success messages
- ✅ **skeleton** - Loading state placeholders
- ✅ **separator** - Visual dividers between sections

## Component Import Pattern

All components are in `src/lib/components/ui/` and exported from `src/lib/components/ui/index.ts`:

```typescript
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
```

## Usage Notes

- **Full Tailwind Customization**: All components use Tailwind and can be customized via the `cn()` utility
- **Copy-Paste Pattern**: Components are copied to your repo, not imported from npm
- **TypeScript**: All components are fully typed
- **No Hallucinations**: AI models are trained on shadcn patterns and won't generate invalid code

### ⚠️ Known Issues

- **Select Component**: Installing `select` overwrites the `separator` component. If you need both, reinstall `separator` after installing `select`:

  ```bash
  npx shadcn-svelte@latest add separator
  ```

## Related Utilities

- `$lib/utils.ts` - Contains `cn()` function for Tailwind class merging
- Tailwind CSS v4.1.17 - Styling foundation
- Bits UI v2.14.4 - Underlying component library

---

To add a new component:

```bash
npx shadcn-svelte@latest add [component-name]
```

Then update this file to track the addition.
