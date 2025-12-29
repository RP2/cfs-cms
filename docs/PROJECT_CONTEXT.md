# CFS CMS - Project Context & Architecture

This document is designed to provide AI models (Copilot, Cursor, Claude, etc.) with comprehensive context about the project's goals, architecture, and decisions.

## Project Overview

**Name**: CFS CMS (Centralized Content Management System)  
**Purpose**: A Google Drive-like CMS for managing content across multiple websites  
**Creator**: Riley  
**Status**: Initial Planning Phase  
**Last Updated**: December 29, 2025

## Business Goals

1. **Centralized Management**: Single dashboard for managing all content across multiple websites
2. **Ease of Use**: Familiar Google Drive-like interface for non-technical users
3. **Scalability**: Leverage Cloudflare edge computing for global performance
4. **Open Source**: Build in public with clear contribution guidelines
5. **Learning Journey**: Document transition from Astro/React to SvelteKit

## Technology Decisions

### Framework Choice: SvelteKit

- **Why**: Modern, reactive framework with built-in routing and excellent DX
- **Learning Path**: Coming from Astro (static focus) and React (component-heavy), SvelteKit offers a middle ground with server capabilities
- **Key Advantages**:
  - Built-in routing matches Astro's file-based approach
  - More lightweight than React while maintaining reactivity
  - Excellent TypeScript support
  - Better suited for Cloudflare Workers deployment

### Infrastructure: Cloudflare

- **Compute**: Cloudflare Workers (serverless functions)
- **Database**: D1 (SQLite on edge)
- **Storage**: R2 (S3-compatible object storage)
- **Cache**: KV (key-value store for performance)
- **Why**:
  - Edge computing reduces latency globally
  - Integrated ecosystem eliminates vendor switching
  - Cost-effective at scale
  - Workers provide excellent TypeScript support

### Database Strategy

- **Primary**: D1 (SQLite) for relational data
- **Schema**: TBD - will include tables for:
  - Users/Authentication
  - Workspaces/Organizations
  - Folders/Hierarchy
  - Files/Content items
  - Tags/Metadata
  - Permissions

### File Storage

- **R2** for media/large files
- Implement soft-delete pattern for safety
- Implement versioning for content

## Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────┐
│      Svelte Components (UI)          │  - Page components
│      Form handling & validation      │  - Layout components
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│    SvelteKit Stores & Services       │  - State management
│    Business logic                    │  - API client abstraction
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│    API Routes (Server endpoints)     │  - /api/files
│    Authentication/Authorization      │  - /api/folders
│    Database queries                  │  - /api/auth
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│    Cloudflare Workers/D1/R2/KV      │  - Execution environment
│    Infrastructure                    │  - Data persistence
└─────────────────────────────────────┘
```

### Key Services (To Be Built)

1. **Auth Service**
   - User authentication
   - Session management
   - Permission checks

2. **File Service**
   - Upload/download handling
   - R2 integration
   - File metadata management

3. **Folder Service**
   - Hierarchy management
   - Recursive operations
   - Path resolution

4. **Tag/Search Service**
   - Tag management
   - Search indexing
   - Discoverability features

5. **Workspace Service**
   - Multi-tenant support
   - Organization management
   - Role-based access control

## UI/UX Inspiration: Google Drive

### Key Features to Replicate

- **Sidebar Navigation**: Workspace/folder tree
- **Main View**: Grid or list toggle for items
- **Context Menu**: Right-click actions
- **Breadcrumb Navigation**: Current path
- **Search Bar**: Quick file/folder search
- **Drag & Drop**: Move items between folders
- **Bulk Actions**: Select multiple items
- **File Preview**: Media preview pane

### Unique Enhancements (Future)

- Multi-site distribution settings
- Content versioning timeline
- Advanced metadata/tagging interface
- Publishing workflows

## Development Phases

### Phase 0: Foundation (Current)

- [x] Project structure planning
- [ ] Core directory structure
- [ ] TypeScript configuration
- [ ] Database schema design

### Phase 1: Authentication & Users

- [ ] Auth system setup
- [ ] User model/database
- [ ] Login/signup UI
- [ ] Session management

### Phase 2: Core UI & Navigation

- [ ] Dashboard layout
- [ ] Sidebar navigation
- [ ] Folder tree
- [ ] File listing view
- [ ] Breadcrumb navigation

### Phase 3: File Management

- [ ] File upload to R2
- [ ] File listing
- [ ] File deletion
- [ ] File metadata storage

### Phase 4: Folder Management

- [ ] Create folders
- [ ] Rename folders
- [ ] Delete folders
- [ ] Move items between folders
- [ ] Recursive operations

### Phase 5: Tagging & Search

- [ ] Tag system
- [ ] Tag assignment UI
- [ ] Search functionality
- [ ] Filter/discovery

### Phase 6: Sharing & Permissions

- [ ] Share links
- [ ] Permission models
- [ ] Collaborative editing considerations

### Phase 7: Multi-Site Distribution (MVP)

- [ ] API for external sites
- [ ] Content distribution settings
- [ ] Webhook integration

### Phase 8: Polish & Open Source

- [ ] Documentation
- [ ] Contributing guidelines
- [ ] Public repository preparation
- [ ] Community setup

## Code Organization Principles

1. **Component Structure**
   - One component per file
   - Descriptive names
   - Clear props interfaces

2. **Service/Logic Separation**
   - Business logic in `/lib/services`
   - UI in `/routes` and `/lib/components`
   - No business logic in components

3. **Type Safety**
   - All types in `/lib/types`
   - Strict TypeScript mode
   - Database-driven types

4. **File Naming**
   - Components: PascalCase.svelte
   - Services: camelCase.ts
   - Types: PascalCase.ts
   - Routes: +page.svelte, +layout.svelte

## Known Challenges & Solutions

### Challenge: Learning SvelteKit while building

- **Solution**: Start with simple features, document learning, reference official docs

### Challenge: Cloudflare Workers limitations

- **Solution**: Understand cold-start impacts, use KV caching strategically

### Challenge: D1 concurrent write limits

- **Solution**: Design for read-heavy operations, batch writes when needed

### Challenge: R2 cost for large files

- **Solution**: Implement file size limits, compression, cleanup policies

## For AI Model Handoff

When transitioning context:

1. Read this file first for overall strategy
2. Check ROADMAP.md for phase priorities
3. Review TODO.md for current tasks
4. Reference PROJECT_CONTEXT.md for decisions
5. Examine src/lib/types for data structures
6. Check latest git commits for recent changes

## Success Metrics

- [ ] Functional prototype by Phase 2
- [ ] Full file CRUD operations by Phase 3
- [ ] Search/discovery working by Phase 5
- [ ] First external site integration by Phase 7
- [ ] Open source launch by Phase 8

---

**Next Steps**: Begin Phase 0 with core directory structure and database schema design.
