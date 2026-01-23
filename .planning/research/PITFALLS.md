# Cloudflare Deployment & Auth Pitfalls

**Domain:** CFS CMS on Cloudflare Workers
**Researched:** Jan 23, 2026

## Critical Pitfalls

Mistakes that cause deployment failures or security issues.

### Pitfall 1: Missing wrangler.toml Configuration

**What goes wrong:** Deployment fails with cryptic errors, R2/D1 bindings don't work
**Why it happens:** Copying example config without filling in actual Cloudflare resource IDs
**Consequences:** Application non-functional, 403 errors on all operations
**Prevention:** Use `wrangler d1 create`, `wrangler r2 bucket create`, `wrangler kv namespace create` to get real IDs
**Detection:** Check wrangler deploy logs for binding errors

### Pitfall 2: Incorrect R2 CORS Configuration

**What goes wrong:** File uploads fail with 403 Forbidden, browser blocks cross-origin requests
**Why it happens:** Missing or incorrect CORS policy on R2 bucket
**Consequences:** Core file upload functionality broken
**Prevention:** Configure CORS with proper origins, methods, and headers before deployment
**Detection:** Check browser network tab for CORS preflight failures

### Pitfall 3: Lucia Auth Misconfiguration

**What goes wrong:** Sessions don't persist, users can't stay logged in
**Why it happens:** Wrong environment settings, missing database adapter
**Consequences:** Authentication appears broken, users constantly logged out
**Prevention:** Follow Lucia documentation exactly, test in development first
**Detection:** Check browser cookies, database session table

## Moderate Pitfalls

Mistakes that cause performance or maintenance issues.

### Pitfall 1: Development vs Production Environment Mismatch

**What goes wrong:** Auth works in dev but fails in production
**Why it happens:** Different cookie security settings, database connections
**Prevention:** Use Lucia's environment-aware configuration
**Detection:** Test auth flow in production preview

### Pitfall 2: Session Table Without Cleanup

**What goes wrong:** D1 database grows indefinitely with expired sessions
**Why it happens:** No automatic cleanup of old sessions
**Prevention:** Implement periodic session cleanup or set reasonable expiration
**Detection:** Monitor D1 database size over time

### Pitfall 3: Insecure Cookie Settings

**What goes wrong:** Session cookies vulnerable to interception
**Why it happens:** Missing secure/httpOnly flags in production
**Prevention:** Configure proper cookie attributes in Lucia
**Detection:** Security audit, check cookie settings in browser dev tools

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 1: Lucia Version Compatibility

**What goes wrong:** Breaking changes between Lucia versions
**Why it happens:** Upgrading without checking migration guide
**Prevention:** Read changelog, test upgrades in development
**Detection:** TypeScript compilation errors

### Pitfall 2: D1 Migration Conflicts

**What goes wrong:** Auth tables conflict with existing schema
**Why it happens:** Not coordinating migrations between features
**Prevention:** Plan database schema evolution upfront
**Detection:** Migration errors during deployment

## Phase-Specific Warnings

| Phase Topic             | Likely Pitfall               | Mitigation                           |
| ----------------------- | ---------------------------- | ------------------------------------ |
| **wrangler.toml setup** | Wrong account/zone IDs       | Use `wrangler whoami` to verify      |
| **R2 CORS config**      | Missing localhost origins    | Include dev origins in CORS policy   |
| **Lucia auth init**     | Wrong adapter configuration  | Test database connection first       |
| **Session middleware**  | Missing from hooks.server.ts | Verify middleware order in SvelteKit |
| **Cookie security**     | Insecure in production       | Environment-aware cookie config      |

## Cloudflare-Specific Gotchas

### Workers Runtime Limitations

- **No Node.js APIs:** Lucia uses Web Crypto API, works fine
- **Request/Response cloning:** Required for Lucia middleware
- **Environment variables:** Must be configured in wrangler.toml

### D1 Database Constraints

- **No foreign key enforcement:** Handle in application code
- **Limited concurrent connections:** Design for eventual consistency
- **Migration complexity:** Test migrations thoroughly

### R2 Storage Nuances

- **No direct browser uploads:** Use Workers API endpoints
- **CORS required for browser access:** Configure before client usage
- **Eventual consistency:** Handle with optimistic UI updates

## Sources

- Cloudflare Workers deployment issues from community forums
- Lucia Auth troubleshooting documentation
- R2 CORS configuration pitfalls from developer reports
- Cloudflare D1 limitations and workarounds
