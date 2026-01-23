# Phase 2 Roadmap: Lucia Auth Implementation

**Phase:** Backend Integration with Authentication
**Duration:** 2-3 weeks
**Goal:** Replace mock data with real Cloudflare backend + self-hosted authentication

## Phase Overview

Phase 2 transforms CFS CMS from a demo app into a production-ready system with:

- ✅ Cloudflare Workers deployment (fixed)
- ✅ Lucia Auth for user management
- ✅ Database-backed sessions
- ✅ Protected API endpoints
- ✅ Real user accounts replacing 'user_1'

## Detailed Implementation Steps

### Step 1: Cloudflare Infrastructure Setup (1-2 days)

**Tasks:**

- Create D1 database: `npx wrangler d1 create cfs_cms`
- Create R2 bucket: `npx wrangler r2 bucket create cfs-cms-files`
- Create KV namespace: `npx wrangler kv namespace create "cfs-cms-cache"`
- Configure wrangler.toml with real IDs
- Set up R2 CORS policy for file uploads

**Success Criteria:**

- `npm run cf:deploy` succeeds without errors
- R2 bucket accepts file uploads (no 403 errors)
- D1 database accessible from Workers

### Step 2: Lucia Auth Foundation (2-3 days)

**Tasks:**

- Install Lucia: `npm install lucia @lucia-auth/adapter-sqlite`
- Create `src/lib/auth.ts` with Lucia configuration
- Add user and session tables to D1 schema
- Configure SvelteKit hooks (`src/hooks.server.ts`)
- Set up password hashing with Argon2

**Success Criteria:**

- Lucia auth instance configured and working
- Database tables created successfully
- Basic auth middleware functional

### Step 3: Authentication UI (2-3 days)

**Tasks:**

- Create `src/routes/login/+page.svelte`
- Create `src/routes/register/+page.svelte`
- Add logout functionality
- Implement form validation
- Add loading states and error handling
- Style with existing shadcn components

**Success Criteria:**

- Users can register with email/password
- Users can login and stay logged in
- Form validation prevents invalid submissions
- UI matches existing design system

### Step 4: API Authentication Guards (2-3 days)

**Tasks:**

- Update all API routes in `src/routes/api/` to check authentication
- Add user context to database operations
- Replace hardcoded `'user_1'` with real user IDs
- Implement proper error responses for unauthorized requests

**Success Criteria:**

- All API endpoints require authentication
- Workspace operations tied to real users
- File/folder operations respect user permissions
- Clear error messages for auth failures

### Step 5: Data Service Integration (2-3 days)

**Tasks:**

- Update `src/lib/services/dataService.ts` to use authenticated user context
- Replace all `'user_1'` references with `auth.getUser()`
- Handle auth state changes (login/logout)
- Maintain optimistic UI updates with real backend persistence

**Success Criteria:**

- All CRUD operations work with authenticated users
- UI updates immediately, persists to backend
- No breaking changes to component interfaces
- Error handling for auth failures

### Step 6: Testing & Validation (2-3 days)

**Tasks:**

- Update API tests to work with authentication
- Test end-to-end user flows
- Validate session persistence across browser sessions
- Performance testing with real D1/R2 resources

**Success Criteria:**

- All existing tests pass with auth
- User registration/login flows work end-to-end
- Session cookies persist correctly
- Performance acceptable for production use

## Technical Architecture

### Database Schema Changes

```sql
-- New tables for Lucia auth
CREATE TABLE user (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Existing tables get user_id columns
ALTER TABLE workspaces ADD COLUMN owner_id TEXT NOT NULL;
ALTER TABLE files ADD COLUMN uploaded_by TEXT NOT NULL;
```

### Code Structure Changes

```
src/
├── lib/
│   ├── auth.ts              # New: Lucia configuration
│   └── services/
│       └── dataService.ts   # Updated: Uses auth context
├── routes/
│   ├── api/                 # Updated: Auth guards added
│   ├── login/               # New: Login page
│   └── register/            # New: Registration page
└── hooks.server.ts          # Updated: Lucia middleware
```

## Dependencies & Requirements

### New Dependencies

- `lucia` - Auth framework
- `@lucia-auth/adapter-sqlite` - D1 adapter

### Cloudflare Resources Required

- D1 Database (free tier: 500MB)
- R2 Bucket (free tier: 10GB storage)
- KV Namespace (free tier: 30K operations/day)
- Workers (free tier: 100K requests/day)

## Risk Mitigation

### Rollback Plan

- Keep mock data fallback in API routes
- Auth-optional mode during development
- Database migration rollback scripts

### Testing Strategy

- Unit tests for auth logic
- Integration tests for API endpoints
- E2E tests for user flows
- Performance benchmarks

## Success Metrics

- ✅ Users can register/login/logout
- ✅ All CRUD operations work with real users
- ✅ File uploads work without 403 errors
- ✅ Sessions persist across browser restarts
- ✅ `npm run test:api` passes all tests
- ✅ `npm run cf:deploy` succeeds
- ✅ No breaking changes to UI/UX

## Next Phase Preview (Phase 3)

After Phase 2 completion:

- Multi-user workspace sharing
- User profile management
- Password reset functionality
- Advanced permissions system

## Timeline & Milestones

| Week | Milestone      | Deliverables                              |
| ---- | -------------- | ----------------------------------------- |
| 1    | Infrastructure | wrangler.toml configured, R2 CORS working |
| 2    | Auth Core      | Lucia setup, user registration/login      |
| 3    | Integration    | API guards, dataService updates           |
| 4    | Testing        | Full test suite passing, production ready |

## References

- [Lucia Auth Documentation](https://lucia-auth.com/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)
- Research: `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`
