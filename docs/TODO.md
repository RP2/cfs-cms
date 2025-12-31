# CFS CMS - Active TODO List

## Current Phase: Phase 1 - UI/UX First (MVP)

**Strategy**: Build functional Google Drive-like UI with mocked data first. Backend integration with Cloudflare comes after UI is solid. Auth deferred until Phase 2 (using Cloudflare Zero Trust for MVP protection).

**Recent Improvements (December 31, 2025)**:

- ✅ Centralized drag/drop arming with shared constants (`DRAG_ARM_DELAY_MS`, `DRAG_MOVE_THRESHOLD_PX`) in `src/lib/utils/drag.ts`, owned by ViewWrapper
- ✅ Drag/drop moves files via dataService (`moveFilesToFolder`/`moveFilesToWorkspace`) with cross-workspace confirmation
- ✅ Added arming feedback on grid/list items; normal click preserved when not armed
- ✅ Aligned folder star placement in ListView with file star position
- ✅ Multi-select toolbar enabled for bulk trash/move/tag; selection state centralized in `selectedFileIds`
- ✅ Basic file/folder search flow refreshed (mock data) so grid/list consume filtered sets via derived state
- ✅ Context menus/paste polish: generic vs folder-specific paste labels, background paste targets current folder, session-only clipboard, and keyboard shortcuts now avoid hijacking native copy/paste
- ✅ Implemented copy/paste data layer functions (`copyFilesToFolder`, `copyFilesToWorkspace`, `copyFoldersToFolder`) that create independent records but reuse `storagePath` so R2 objects are not duplicated

**Recent Improvements (December 30, 2025)**:

- ✅ Fixed cross-workspace data corruption bug
- ✅ Established proper data flow architecture (Components → dataService → Stores)
- ✅ Removed all direct mock data usage from components
- ✅ Converted functions to `$derived` for hot reloading
- ✅ Created ARCHITECTURE.md documentation
- ✅ Sidebar, grid, and breadcrumbs now hot reload properly

### High Priority - Week 1 (UI Foundation)

#### Install & Setup shadcn-svelte

- [x] Install shadcn-svelte CLI and components
- [x] Add Button, Card, Dialog, Input, Separator, Tabs components
- [x] Add Sidebar (sidebar-07 variant), Breadcrumb, Toggle-group
- [x] Add Checkbox, Badge, Avatar, Context-menu, Dropdown-menu
- [x] Add Scroll-area, Tooltip, Alert, Skeleton
- [x] Verify Tailwind integration working with shadcn components
- [x] Commit initial component setup

#### Core Component Structure

- [x] Create `app-sidebar.svelte` - Workspace switcher, folder navigation (shadcn sidebar-07)
- [x] Create `FolderItem.svelte` - Recursive folder tree component (unlimited depth)
- [x] Create `ViewWrapper.svelte` - Grid/list display orchestrator for files/folders
- [x] Implement breadcrumb navigation in layout
- [ ] Create `FileListItem.svelte` - Individual file/folder card component (optional extraction)

#### Main Layout Pages

- [x] Update `src/routes/+layout.svelte` - Main app shell with sidebar + breadcrumbs
- [x] Create `src/routes/+page.svelte` - Workspace selector / welcome
- [ ] Create `src/routes/workspace/[id]/+page.svelte` - Main dashboard (folder view)

### High Priority - Week 2 (Interaction & State)

#### Recent Architecture Changes (December 30, 2025)

- ✅ Quick Links (Starred, Tags, Trash) are workspace-scoped
- ✅ Tags view shows all tagged files in current workspace
- ✅ Workspace deletion requires empty workspace (no files/folders)
- ✅ Workspace deletion is permanent (no trash for workspaces)
- ✅ ViewWrapper pattern implemented (orchestrator + presentation views)

#### Svelte Stores (State Management)

- [x] Create `src/lib/stores/workspace.ts` - Current workspace state
- [x] Create `src/lib/stores/folders.ts` - Folder navigation, current folder
- [x] Create `src/lib/stores/files.ts` - File list, sorting, filtering
- [x] Create `src/lib/stores/tags.ts` - Available tags state
- [x] Create `src/lib/stores/selection.ts` - Selected files/folders (for actions)

#### Mock Data Seeding

- [x] Create `src/lib/data/mock.ts` - Sample workspaces, folders, files, tags
- [x] Add `PUBLIC_USE_MOCK_DATA` env var check for seeding
- [x] Create realistic sample data (3 workspaces, hierarchical folders, files with metadata)
- [ ] Add `src/routes/demo` page showcasing mock data
- [x] Ensure mock data easily disableable in production

#### Modals & Dialogs

- [x] Create folder creation modal (NewFolderModal.svelte)
- [x] Create file upload modal (UploadModal.svelte - no actual upload yet, just UI)
- [x] Create rename dialog (RenameModal.svelte)
- [x] Create delete confirmation modal (DeleteConfirmModal.svelte)
- [ ] Wire modals to stores (optimistic updates)
- [ ] Connect modal triggers to buttons in sidebar/ViewWrapper

#### Additional Pages

- [ ] Create `src/routes/workspace/[id]/search` - Search results mockup
- [ ] Create `src/routes/workspace/[id]/tags` - Tag browsing interface
- [ ] Create `src/routes/workspace/[id]/settings` - Workspace settings mockup

### Medium Priority - Week 3 (Refinement)

#### Interactions & UX Polish

- [x] Drag/drop file moves (ViewWrapper + dataService, cross-workspace confirm)
- [x] File/folder context menu (right-click)
- [ ] Keyboard shortcuts (Ctrl+A select, Delete, etc.)
- [ ] Loading states and animations
- [ ] Empty state UI (new workspace, no files)
- [ ] Responsive mobile layout

#### Search & Filtering

- [ ] Local search implementation (filters mock data)
- [ ] File type filtering
- [ ] Sort options (name, date, size)
- [ ] Tag filtering

### Low Priority (Before Cloudflare Integration)

- [ ] Dark mode toggle (Tailwind dark mode)
- [ ] Accessibility audit (keyboard nav, ARIA labels)
- [ ] Visual refinements based on Google Drive design patterns
- [ ] Performance optimization (virtualization for large lists)
- [ ] Unit tests for store logic
- [ ] Copy/paste backend contract: reuse `storagePath` on copies, reference-count R2 objects, and ensure API endpoints duplicate metadata only (no extra uploads)

---

## Completed Tasks ✅

- [x] Project vision documented (README.md)
- [x] Tech stack decisions made (PROJECT_CONTEXT.md)
- [x] Architecture overview created (PROJECT_CONTEXT.md)
- [x] Project roadmap created (ROADMAP.md)
- [x] Context files created for AI handoff (.cursorrules, .github/copilot-instructions.md)
- [x] Database schema designed (docs/DATABASE.md)
- [x] Essential project files (LICENSE, CONTRIBUTING.md, .env.example)
- [x] GitHub templates (issue/PR templates)
- [x] dependabot.yml enhanced with production best practices

---

## Notes

### Architecture: UI-First Approach

- **Phase 1 Focus**: Visual interface with mocked data (local testing)
- **Phase 2 Focus**: Cloudflare backend (D1, R2, API routes)
- **Phase 3 Focus**: SvelteKit auth + Zero Trust dual protection

### Mock Data Strategy

- Mock data lives in `src/lib/data/mock.ts`
- Seeded by environment variable `PUBLIC_USE_MOCK_DATA=true`
- Demo page at `/demo` showcases mocked CMS
- On production (Cloudflare), `PUBLIC_USE_MOCK_DATA` unset - queries go to D1
- Easy to toggle for testing/development

### shadcn-svelte Integration

- Copy-paste component model (components copied to `src/lib/components/ui/`)
- No hallucination - AI trained on shadcn patterns
- Full Tailwind customization available
- Matches Google Drive UX familiarity

### Learning Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [shadcn-svelte](https://www.shadcn-svelte.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

---

**Last Updated**: December 29, 2025  
**Current Phase**: Phase 1 (UI/UX First)  
**Owner**: Riley
