# Authentication Feature Landscape for CFS CMS

**Domain:** Self-hosted authentication for content management
**Researched:** Jan 23, 2026

## Table Stakes

Features users expect in any authentication system.

| Feature              | Why Expected           | Complexity | Notes                          |
| -------------------- | ---------------------- | ---------- | ------------------------------ |
| User registration    | Basic account creation | Low        | Email/password with validation |
| User login           | Access to system       | Low        | Session-based authentication   |
| Password hashing     | Security requirement   | Low        | Argon2/SCrypt recommended      |
| Session management   | Stay logged in         | Low        | Database-backed sessions       |
| Logout functionality | Security control       | Low        | Clear session cookies          |

## Differentiators

Features that set CFS CMS apart with self-hosted approach.

| Feature            | Value Proposition                 | Complexity | Notes                                  |
| ------------------ | --------------------------------- | ---------- | -------------------------------------- |
| Database sessions  | No external auth provider lock-in | Medium     | Full control over session data         |
| Multi-tenant ready | Workspace isolation built-in      | Medium     | Sessions scoped to workspaces          |
| Cloudflare native  | Optimized for Workers runtime     | Low        | Minimal latency, shared infrastructure |
| Free tier friendly | No auth provider costs            | Low        | Self-hosted scales with usage          |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature             | Why Avoid                               | What to Do Instead                        |
| ------------------------ | --------------------------------------- | ----------------------------------------- |
| OAuth providers          | Adds complexity, external dependencies  | Email/password with future OAuth add-on   |
| JWT tokens               | Stateless complexity, security concerns | Database sessions with secure cookies     |
| Password reset via email | Requires SMTP server setup              | Implement when email infrastructure ready |
| Multi-factor auth        | Scope creep, complex UX                 | Add in future phase if needed             |
| Social login             | External dependencies                   | Keep core auth simple                     |

## Feature Dependencies

```
User Registration → Password Hashing → Database Sessions → Login/Logout
                                      ↓
                         Multi-tenant Workspace Access
```

## MVP Authentication Scope

For initial auth implementation, prioritize:

1. **User registration** - Email/password signup
2. **Login/logout** - Basic session management
3. **Password security** - Proper hashing and validation
4. **Session persistence** - Stay logged in across browser sessions

Defer to post-MVP:

- Password reset functionality (needs email infrastructure)
- User profile management
- Account deletion
- Session management UI

## Lucia Auth Implementation Notes

**Recommended approach:** Lucia Auth v3 with SQLite adapter

**Key benefits:**

- Simple API, ~100 lines of code
- Battle-tested session management
- Excellent SvelteKit integration
- Cloudflare Workers compatible
- No external dependencies

**Basic implementation structure:**

```typescript
// lib/auth.ts - Lucia configuration
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { sqlite } from '@lucia-auth/adapter-sqlite';

export const auth = lucia({
	adapter: sqlite(db),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	sessionCookie: {
		expires: false // sessions don't expire
	}
});
```

## Sources

- Lucia Auth documentation: Comprehensive examples and patterns
- Supertokens vs Lucia comparison: Verified feature completeness
- Cloudflare Workers auth patterns: Session-based approaches optimal
- NPM package analysis: Lucia most actively maintained for self-hosted auth
