# AGENTS.md - CFS CMS Development Guide

This file contains essential information for agentic coding agents working in the CFS CMS repository.

**🎯 PRIMARY AI CONTEXT**: See [AI-CONTEXT.md](AI-CONTEXT.md) for complete development guide (400+ lines). This file is a quick reference only.

## Project Overview

**CFS CMS** is a Google Drive-like content management system built with:

- **Frontend**: SvelteKit (v2+) with Svelte 5 runes
- **UI**: shadcn-svelte components + Tailwind CSS 4.1.17
- **Backend**: Cloudflare Workers + D1 (SQLite) + R2 storage
- **Architecture**: Three-layer pattern (Components → dataService → Stores)

**⚠️ CURRENT STATUS**: Phase 1 (UI/UX complete) → Phase 2 (Backend integration with auth). Research shows Cloudflare deployment issues need immediate fixes before auth implementation.

## Research & Planning

All project research and planning is documented in `.planning/research/`. **Always reference research before making changes.**

### Research Files

| File                                                  | Purpose                        | Key Findings                                                     |
| ----------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| [SUMMARY.md](.planning/research/SUMMARY.md)           | Executive summary with roadmap | Cloudflare deployment fixes, Lucia Auth implementation plan      |
| [STACK.md](.planning/research/STACK.md)               | Technology recommendations     | wrangler.toml configuration, R2 CORS setup, Lucia Auth details   |
| [FEATURES.md](.planning/research/FEATURES.md)         | Auth feature landscape         | Database sessions, multi-tenant ready, self-hosted approach      |
| [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) | System patterns                | Session-based auth, workspace isolation, Cloudflare optimization |
| [PITFALLS.md](.planning/research/PITFALLS.md)         | Deployment & auth pitfalls     | R2 CORS issues, Lucia misconfiguration, session management       |
| [COMPARISON.md](.planning/research/COMPARISON.md)     | Lucia vs alternatives          | Why Lucia over Supertokens/Custom JWT for Cloudflare             |

### Key Research Conclusions

- **Deployment**: Fix missing wrangler.toml and R2 CORS configuration to resolve 403 upload errors
- **Authentication**: Lucia Auth provides optimal self-hosted solution for Cloudflare Workers
- **Architecture**: Database-backed sessions superior to JWT for self-hosted apps
- **Cost**: All components stay within Cloudflare free tiers (Workers, D1, R2, KV)

## MCP Servers

**Recommended MCP servers** for enhanced Cloudflare development workflow:

### Cloudflare MCP Server

- **Purpose**: Automate Cloudflare resource management (D1, R2, KV, Workers)
- **Benefits**:
  - Create/configure wrangler.toml automatically
  - Set up R2 CORS policies programmatically
  - Deploy and monitor Workers
  - Database migrations and backups
- **Implementation**: Custom MCP server using Cloudflare API

### Database MCP Server

- **Purpose**: D1 database operations and schema management
- **Benefits**:
  - Run migrations automatically
  - Query optimization suggestions
  - Schema validation against research specifications
  - Backup/restore operations
- **Implementation**: SQLite-compatible MCP with D1 adapter

### Testing MCP Server

- **Purpose**: Automated testing and validation
- **Benefits**:
  - Run API tests against deployed Workers
  - Validate auth flows end-to-end
  - CORS configuration testing
  - Performance monitoring
- **Implementation**: Vitest + Playwright integration

**Current Status**: No MCP servers configured yet. Consider implementing Cloudflare MCP server for Phase 1 deployment fixes.

## MCP Servers

**Recommended MCP servers** for enhanced Cloudflare development workflow:

### Cloudflare MCP Server

- **Purpose**: Automate Cloudflare resource management (D1, R2, KV, Workers)
- **Benefits**:
  - Create/configure wrangler.toml automatically
  - Set up R2 CORS policies programmatically
  - Deploy and monitor Workers
  - Database migrations and backups
- **Implementation**: Custom MCP server using Cloudflare API

### Database MCP Server

- **Purpose**: D1 database operations and schema management
- **Benefits**:
  - Run migrations automatically
  - Query optimization suggestions
  - Schema validation against research specifications
  - Backup/restore operations
- **Implementation**: SQLite-compatible MCP with D1 adapter

### Testing MCP Server

- **Purpose**: Automated testing and validation
- **Benefits**:
  - Run API tests against deployed Workers
  - Validate auth flows end-to-end
  - CORS configuration testing
  - Performance monitoring
- **Implementation**: Vitest + Playwright integration

**Current Status**: No MCP servers configured yet. Consider implementing Cloudflare MCP server for Phase 1 deployment fixes.

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
npm run test:api         # Run all API tests with Vitest
npm run test:api -- tests/api.test.ts --reporter=verbose  # Run with verbose output
```

**Running Single Tests:**

```bash
# Vitest supports running individual test files or specific test cases
npx vitest run tests/api.test.ts --reporter=verbose  # Specific test file
npx vitest run --grep "should create a workspace"     # Run tests matching pattern
```

### Build & Deploy

```bash
npm run build            # Production build
npm run preview          # Preview production build
npm run cf:deploy        # Deploy to Cloudflare Workers
```

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode**: Enabled (`"strict": true` in tsconfig.json)
- **Module resolution**: Bundler
- **ES Module**: Interop enabled
- **Source maps**: Enabled for debugging
- **Vitest globals**: Available in test files

### ESLint Rules

- **Base configs**: ESLint recommended, TypeScript recommended, Svelte recommended
- **Prettier integration**: ESLint config includes Prettier
- **Global variables**: Browser and Node globals available
- **Parser**: TypeScript parser with project service for .svelte files

### Formatting Rules (Prettier)

- **Tabs**: Use tabs (not spaces) - `"useTabs": true`
- **Quotes**: Single quotes - `"singleQuote": true`
- **Trailing commas**: None - `"trailingComma": "none"`
- **Line width**: 100 characters - `"printWidth": 100`
- **Svelte parser**: For `.svelte` files
- **Tailwind plugin**: Integrated with layout.css stylesheet

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

### Naming Conventions

- **Components**: PascalCase (e.g., `WorkspaceCard.svelte`)
- **Stores**: camelCase (e.g., `currentWorkspace`)
- **Services**: camelCase functions (e.g., `createFolder`)
- **Types**: PascalCase interfaces (e.g., `Workspace`, `Folder`)
- **Files**: kebab-case for components, camelCase for utilities

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

### Error Handling

- Use try-catch blocks in dataService functions
- Return consistent error objects with `message` and `code` properties
- Handle loading states in components with `$state`
- Validate user inputs before API calls

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
- **Phase 2**: Backend integration with Lucia Auth (in progress)
- **Phase 3+**: Multi-tenant features, advanced auth

## Key Files

### Core Architecture

- **`src/lib/services/dataService.ts`**: All CRUD operations (only file that changes in Phase 2)
- **`src/lib/stores/index.ts`**: State management (only imports mock data)
- **`src/lib/types/index.ts`**: TypeScript interfaces

### Documentation

- **`docs/ARCHITECTURE.md`**: Technical patterns
- **`docs/PHASE2_API_CONTRACT.md`**: API specifications
- **`.planning/research/`**: All project research and planning documents
- **`.planning/PHASE2_ROADMAP.md`**: Detailed Phase 2 implementation guide
- **`.cursorrules`**: Comprehensive AI assistant guidelines (250 lines)
- **`.github/copilot-instructions.md`**: GitHub Copilot guidelines (252 lines)

## Testing Strategy

- **Vitest** for API testing (24/24 tests passing)
- **Real D1 database** for integration tests
- **Cross-workspace operations** validated
- **Test timeout**: 30 seconds for API calls
- **Environment**: Node.js for test execution
- **Global test functions**: Available without imports

## Common Pitfalls

### ❌ Don't Do This

- Import mock data in components
- Use functions instead of `$derived` for reactive lists
- Use raw Tailwind color classes
- Use emojis instead of lucide-svelte icons
- Put business logic in components
- Deploy without proper wrangler.toml configuration
- Skip R2 CORS configuration (causes 403 upload errors)

### ✅ Do This Instead

- Import stores, use `$derived` for reactive data
- Call dataService functions for all CRUD operations
- Use theme color CSS variables from layout.css
- Use lucide-svelte icons consistently
- Keep business logic in dataService layer
- Reference `.planning/research/` for implementation details
- Test deployment fixes before implementing auth

## Development Workflow

1. **Always check research** in `.planning/research/` before implementing changes
2. **Run `npm run check` and `npm run lint`** before committing
3. **Use Svelte 5 runes** for all reactive patterns
4. **Follow three-layer architecture** strictly
5. **Test API changes** with `npm run test:api`
6. **Reference existing patterns** in components before creating new ones

## Error Handling

- Use try-catch blocks in dataService functions
- Return consistent error objects with `message` and `code` properties
- Handle loading states in components with `$state`
- Validate user inputs before API calls

## btca

When you need up-to-date information about technologies used in this project, use btca to query source repositories directly.

**Available resources**: svelte, tailwind, vite, typescript, cloudflareWorkers, opencode

### Usage

```bash
btca ask -r <resource> -q "<question>"
```

Use multiple `-r` flags to query multiple resources at once:

```bash
btca ask -r svelte -r tailwind -q "How do I integrate Tailwind with Svelte?"
```

This codebase follows strict architectural patterns with comprehensive documentation, making it ideal for agentic development with clear boundaries and established conventions.
