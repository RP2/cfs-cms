# Phase 2 Context: Backend Integration & Authentication

**Phase Goal:** Replace mock data with Cloudflare D1/R2/KV backend + Lucia self-hosted auth while preserving existing UI/UX experience.

**Timeline:** 4 weeks

- Week 1: Cloudflare infrastructure setup
- Week 2: Lucia auth foundation + UI
- Week 3: API protection + integration
- Week 4: Full testing + production ready

**Key Constraints:**

- Must remain free/self-hosted (no external auth providers)
- All data stays within Cloudflare ecosystem
- Three-layer architecture maintained: Components → dataService → Svelte Stores
- Optimistic updates preserved with real backend persistence

**Success Criteria:**

- wrangler.toml configured correctly
- R2 CORS allows file uploads (no 403 errors)
- Lucia auth working (register/login)
- All API routes protected with auth
- dataService uses real user context
- `npm run cf:deploy` succeeds
- All tests pass with real backend
- Existing UI/UX experience preserved

**Current State:**

- Phase 1 UI/UX complete with Google Drive-like experience
- All CRUD operations work with mock data
- dataService layer ready for backend integration
- Hardcoded 'user_1' used throughout codebase
- Comprehensive research complete in .planning/research/

**Technical Approach:**

- Lucia Auth v3 with SQLite adapter for D1 compatibility
- Database-backed sessions (not JWT)
- Password hashing with Argon2
- Session-based authentication with secure cookies
- User-scoped workspace and file operations

**Deliverables:**

1. Cloudflare resources configured (D1, R2, KV)
2. Lucia auth system implemented
3. Login/register UI with validation
4. All API endpoints protected
5. dataService integrated with real user context
6. Full test suite passing
7. Production deployment working

**Risks:**

- R2 CORS configuration complexity (well-documented in research)
- Lucia D1 adapter integration (SQLite compatibility verified)
- User context propagation through dataService layer
- Session persistence across deployments

**References:**

- Detailed roadmap: .planning/PHASE2_ROADMAP.md
- Research: .planning/research/ directory
- API contract: docs/PHASE2_API_CONTRACT.md
- Architecture: docs/ARCHITECTURE.md</content>
  <parameter name="filePath">.planning/phases/02-backend-integration/02-CONTEXT.md
