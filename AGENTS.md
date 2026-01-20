# AGENTS.md - CFS CMS Development Guide

This file contains essential information for agentic coding agents working in the CFS CMS repository.

**🎯 PRIMARY AI CONTEXT**: See [AI-CONTEXT.md](AI-CONTEXT.md) for complete development guide (400+ lines). This file is a quick reference only.

## Project Overview

**CFS CMS** is a Google Drive-like content management system built with:

- **Frontend**: SvelteKit (v2+) with Svelte 5 runes
- **UI**: shadcn-svelte components + Tailwind CSS 4.1.17
- **Backend**: Cloudflare Workers + D1 (SQLite) + R2 storage
- **Architecture**: Three-layer pattern (Components → dataService → Stores)

## Essential Commands

### Development

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run cf:dev           # Cloudflare dev mode with persistence
```

### Code Quality

```bash
npm run check            # TypeScript type checking (svelte-check)
npm run check:watch      # TypeScript checking with watch mode
npm run lint             # ESLint + Prettier check
npm run format           # Prettier formatting
```

### Testing

```bash
npm run test:api         # Run API tests with Vitest
```

### Build & Deploy

```bash
npm run build            # Production build
npm run preview          # Preview production build
npm run cf:deploy        # Deploy to Cloudflare Workers
```

## Code Style Guidelines

### TypeScript & Svelte 5 Patterns

- **Strict TypeScript mode** enabled
- **Svelte 5 runes** for reactivity: `$state`, `$derived`, `$props`, `$effect`
- **Three-layer architecture**: Components → dataService → Stores → Mock Data/API

### Import Conventions

```typescript
// Store imports
import { workspaces, currentWorkspace } from '$lib/stores';

// Service imports
import { createFolder } from '$lib/services/dataService';

// Type imports
import type { Workspace, Folder } from '$lib/types';

// UI component imports
import { Button } from '$lib/components/ui/button';
```

### Reactive Data Patterns

```svelte
<script lang="ts">
	// ✅ CORRECT: Use $derived for reactive lists
	let rootFolders = $derived(
		$workspaceFolders.filter((f) => f.parentId === null && f.workspaceId === $currentWorkspace?.id)
	);

	// ❌ WRONG: Functions won't update reactively
	function getRootFolders() {
		return $workspaceFolders.filter((f) => f.parentId === null);
	}
</script>
```

### Styling Standards

- **Theme colors ONLY** from `src/routes/layout.css` (never raw Tailwind classes)
- **Available colors**: `primary`, `secondary`, `accent`, `muted`, `destructive`, `background`, `foreground`, `card`, `border`, `sidebar-*`
- **Icons**: Always `lucide-svelte`, NEVER emojis

### Formatting Rules

- **Tabs**: Use tabs (not spaces)
- **Quotes**: Single quotes
- **Trailing commas**: None
- **Line width**: 100 characters
- **Svelte parser**: For `.svelte` files

## Architecture Rules

### Critical Boundaries

- **Mock data**: ONLY imported by `stores/index.ts`
- **Components**: Import stores, use `$derived`, call dataService functions
- **dataService.ts**: ALL CRUD operations - only file that changes in Phase 2
- **Business Logic**: Keep in dataService, not components

### Data Flow

```
UI Components → dataService → Svelte Stores → Mock Data (Phase 1) / API (Phase 2+)
```

### Phase-Based Development

- **Phase 1**: UI/UX complete with mock data ✅
- **Phase 2**: Backend integration in progress 🚀
- **Phase 3+**: Authentication, collaboration, etc.

## Key Files

### Core Architecture

- **`src/lib/services/dataService.ts`**: All CRUD operations (only file that changes in Phase 2)
- **`src/lib/stores/index.ts`**: State management (only imports mock data)
- **`src/lib/types/index.ts`**: TypeScript interfaces

### Documentation

- **`docs/ARCHITECTURE.md`**: Technical patterns
- **`docs/PHASE2_API_CONTRACT.md`**: API specifications
- **`.cursorrules`**: Comprehensive AI assistant guidelines (250 lines)
- **`.github/copilot-instructions.md`**: GitHub Copilot guidelines (252 lines)

## Testing Strategy

- **Vitest** for API testing (24/24 tests passing)
- **Real D1 database** for integration tests
- **Cross-workspace operations** validated
- **Run single test**: `npm run test:api -- [test-file-name]`

## Common Pitfalls

### ❌ Don't Do This

- Import mock data in components
- Use functions instead of `$derived` for reactive lists
- Use raw Tailwind color classes
- Use emojis instead of lucide-svelte icons
- Put business logic in components

### ✅ Do This Instead

- Import stores, use `$derived` for reactive data
- Call dataService functions for all CRUD operations
- Use theme color CSS variables from layout.css
- Use lucide-svelte icons consistently
- Keep business logic in dataService layer

## Development Workflow

1. **Always run** `npm run check` and `npm run lint` before committing
2. **Use Svelte 5 runes** for all reactive patterns
3. **Follow three-layer architecture** strictly
4. **Test API changes** with `npm run test:api`
5. **Reference existing patterns** in components before creating new ones

## Error Handling

- Use try-catch blocks in dataService functions
- Return consistent error objects with `message` and `code` properties
- Handle loading states in components with `$state`
- Validate user inputs before API calls

## btca

When you need up-to-date information about technologies used in this project, use btca to query source repositories directly.

**Available resources**: svelte, tailwind, cloudflareWorkers, vite, typescript

### Usage

```bash
btca ask -r <resource> -q "<question>"
```

Use multiple `-r` flags to query multiple resources at once:

```bash
btca ask -r svelte -r tailwind -q "How do I integrate Tailwind with Svelte?"
```

This codebase follows strict architectural patterns with comprehensive documentation, making it ideal for agentic development with clear boundaries and established conventions.
