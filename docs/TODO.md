# CFS CMS - Active TODO List

## Current Phase: Phase 1 - UI/UX First (MVP)

**Strategy**: Build functional Google Drive-like UI with mocked data first. Backend integration with Cloudflare comes after UI is solid. Auth deferred until Phase 2 (using Cloudflare Zero Trust for MVP protection).

### High Priority - Week 1 (UI Foundation)

#### Install & Setup shadcn-svelte

- [ ] Install shadcn-svelte CLI and components
- [ ] Add Button, Card, Dialog, Input, Separator, Tabs components
- [ ] Verify Tailwind integration working with shadcn components
- [ ] Commit initial component setup

#### Core Component Structure

- [ ] Create `Sidebar.svelte` - Workspace switcher, folder navigation
- [ ] Create `Header.svelte` - Search, breadcrumbs, user menu placeholder
- [ ] Create `FileGrid.svelte` - Grid display of files/folders
- [ ] Create `FileListItem.svelte` - Individual file/folder card
- [ ] Create `FolderTree.svelte` - Collapsible folder hierarchy
- [ ] Create `BreadcrumbNav.svelte` - Current path navigation

#### Main Layout Pages

- [ ] Update `src/routes/+layout.svelte` - Main app shell with sidebar + header
- [ ] Create `src/routes/+page.svelte` - Workspace selector / welcome
- [ ] Create `src/routes/workspace/[id]/+page.svelte` - Main dashboard (folder view)

### High Priority - Week 2 (Interaction & State)

#### Svelte Stores (State Management)

- [ ] Create `src/lib/stores/workspace.ts` - Current workspace state
- [ ] Create `src/lib/stores/folders.ts` - Folder navigation, current folder
- [ ] Create `src/lib/stores/files.ts` - File list, sorting, filtering
- [ ] Create `src/lib/stores/tags.ts` - Available tags state
- [ ] Create `src/lib/stores/selection.ts` - Selected files/folders (for actions)

#### Mock Data Seeding

- [ ] Create `src/lib/data/mock.ts` - Sample workspaces, folders, files, tags
- [ ] Add `PUBLIC_USE_MOCK_DATA` env var check for seeding
- [ ] Create realistic sample data (5+ workspaces, 20+ folders, 50+ files)
- [ ] Add `src/routes/demo` page showcasing mock data
- [ ] Ensure mock data easily disableable in production

#### Modals & Dialogs

- [ ] Create folder creation modal
- [ ] Create file upload modal (no actual upload yet, just UI)
- [ ] Create rename dialog
- [ ] Create delete confirmation modal
- [ ] Wire modals to stores (optimistic updates)

#### Additional Pages

- [ ] Create `src/routes/workspace/[id]/search` - Search results mockup
- [ ] Create `src/routes/workspace/[id]/tags` - Tag browsing interface
- [ ] Create `src/routes/workspace/[id]/settings` - Workspace settings mockup

### Medium Priority - Week 3 (Refinement)

#### Interactions & UX Polish

- [ ] Drag-drop folder navigation (basic implementation)
- [ ] File/folder context menu (right-click)
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
