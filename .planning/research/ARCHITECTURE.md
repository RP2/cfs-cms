# Authentication Architecture Patterns for CFS CMS

**Domain:** Self-hosted auth in Cloudflare Workers
**Researched:** Jan 23, 2026

## Recommended Architecture

```
Client (SvelteKit) → API Routes → Lucia Auth → D1 Database
       ↓                                        ↓
   Session Cookies ←───────────────── Session Store
```

### Component Boundaries

| Component            | Responsibility                | Communicates With                      |
| -------------------- | ----------------------------- | -------------------------------------- |
| **SvelteKit Pages**  | User interface, form handling | Lucia auth helpers, API routes         |
| **API Routes**       | HTTP endpoints, validation    | Lucia auth, dataService                |
| **Lucia Auth**       | Session management, user auth | Database adapter, SvelteKit middleware |
| **Database Adapter** | User/session storage          | D1 database                            |

### Data Flow

1. **Registration:** User submits form → API validates → Lucia creates user → Session created → Cookie set
2. **Login:** User submits credentials → Lucia validates → Session created → Cookie set
3. **Protected Routes:** Middleware checks session → Database lookup → Allow/deny access
4. **Logout:** Session invalidated → Cookie cleared

## Patterns to Follow

### Pattern 1: Lucia SvelteKit Integration

**What:** Official Lucia middleware for SvelteKit
**When:** All authentication logic
**Example:**

```typescript
// hooks.server.ts
import { auth } from '$lib/auth';

export const handle = auth.handleAuth();
```

### Pattern 2: Database Session Storage

**What:** Sessions stored in D1 with user relationships
**When:** All session management
**Example:**

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  expires_at INTEGER NOT NULL
);
```

### Pattern 3: Secure Cookie Configuration

**What:** HttpOnly, Secure, SameSite cookies
**When:** Production deployments
**Example:**

```typescript
export const auth = lucia({
	sessionCookie: {
		name: 'auth-session',
		expires: false,
		attributes: {
			secure: !dev,
			httpOnly: true,
			sameSite: 'lax'
		}
	}
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: JWT Tokens

**What:** Using stateless JWT tokens instead of database sessions
**Why bad:** Increased complexity, token invalidation issues, security concerns
**Instead:** Database-backed sessions with Lucia

### Anti-Pattern 2: Client-side Auth State

**What:** Managing auth state in Svelte stores without server validation
**Why bad:** Security vulnerabilities, race conditions
**Instead:** Server-side session validation with Lucia middleware

### Anti-Pattern 3: Plain Text Passwords

**What:** Storing passwords without hashing
**Why bad:** Complete security breach if database compromised
**Instead:** Use Lucia's built-in password hashing with Argon2

## Scalability Considerations

| Concern          | At 100 users      | At 10K users      | At 1M users               |
| ---------------- | ----------------- | ----------------- | ------------------------- |
| Session storage  | D1 handles easily | D1 handles easily | May need session cleanup  |
| Password hashing | Fast enough       | Fast enough       | Consider faster hash      |
| Database queries | Sub-millisecond   | Millisecond range | Index optimization needed |
| Cookie size      | Minimal impact    | Minimal impact    | Minimal impact            |

## Cloudflare Workers Optimizations

- **Edge Runtime:** Lucia works natively in Workers
- **D1 Integration:** Direct database connections, no connection pooling needed
- **Global Sessions:** Sessions work across Cloudflare's edge network
- **Cookie Security:** Automatic secure cookie handling

## Sources

- Lucia Auth documentation and examples
- Cloudflare Workers security best practices
- Database session management patterns
- SvelteKit authentication middleware patterns
