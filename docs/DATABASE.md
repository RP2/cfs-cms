# CFS CMS - Database Design

Schema design and database documentation for CFS CMS.

## Overview

CFS CMS uses **Cloudflare D1** (SQLite) as the primary database for all relational data.

- **Type**: SQLite (via Cloudflare D1)
- **Consistency**: ACID-compliant
- **Backup**: Automatic via Cloudflare

## Schema Design

### 1. Users Table

Stores user account information.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);
```

**Indexes**:

- `email` (UNIQUE) - Login lookup
- `username` (UNIQUE) - Display name lookup
- `deleted_at` - Soft delete support

### 2. Workspaces Table

Organizes users into workspaces (organizations/teams).

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### 3. Workspace Members Table

Maps users to workspaces with roles.

```sql
CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'editor', 'viewer', 'member'
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(workspace_id, user_id)
);
```

**Roles**:

- `owner` - Full control
- `editor` - Can edit content
- `viewer` - Read-only
- `member` - Basic membership

### 4. Folders Table

Hierarchical folder structure.

```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Indexes**:

- `workspace_id` - Query folders by workspace
- `parent_id` - Build folder tree
- `deleted_at` - Soft delete support

### 5. Files Table

Stores file metadata.

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  folder_id TEXT,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- R2 path
  checksum TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Indexes**:

- `workspace_id, folder_id` - Query files in folder
- `deleted_at` - Soft delete support
- `mime_type` - Filter by type
- `created_at` - Sort by date

### 6. Tags Table

User-defined tags for categorizing content.

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT, -- Hex color for UI
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(workspace_id, name)
);
```

### 7. File Tags Table

Join table for files and tags (many-to-many).

```sql
CREATE TABLE file_tags (
  file_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (file_id, tag_id),
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 8. Folder Tags Table

Tags can also be applied to folders.

```sql
CREATE TABLE folder_tags (
  folder_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (folder_id, tag_id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 9. Shares Table

Public/private share links.

```sql
CREATE TABLE shares (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  item_id TEXT NOT NULL, -- file_id or folder_id
  item_type TEXT NOT NULL, -- 'file' or 'folder'
  share_token TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'download'
  is_public BOOLEAN DEFAULT FALSE,
  expires_at DATETIME,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 10. Sessions Table

User session management.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Indexes**:

- `token_hash` (UNIQUE) - Validate session tokens
- `expires_at` - Cleanup expired sessions
- `user_id` - Query user's sessions

### 11. Activity Log Table

Audit trail for workspace actions.

```sql
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'share', etc.
  resource_type TEXT NOT NULL, -- 'file', 'folder', 'tag', etc.
  resource_id TEXT,
  details TEXT, -- JSON details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Constraints & Validations

### Soft Deletes

Most tables use `deleted_at` column:

- Records are never truly deleted
- Queries automatically filter `deleted_at IS NULL`
- Enables recovery and audit trails

### Cascading

- Deleting a workspace cascades to all folders and files
- Deleting a folder cascades to nested folders and files
- Deleting a user removes their ownership but preserves created items

### Unique Constraints

- `users.email` - Prevent duplicate emails
- `users.username` - Unique handles
- `workspace_members(workspace_id, user_id)` - One role per user per workspace
- `tags(workspace_id, name)` - Tag names unique per workspace
- `sessions.token_hash` - Session tokens unique

## Performance Considerations

### Indexing Strategy

1. **Foreign keys** - Indexed automatically
2. **Workspace filtering** - Index on `workspace_id` for multi-tenancy
3. **Soft deletes** - Index on `deleted_at` for fast filtering
4. **Common sorts** - Index on `created_at`, `updated_at`
5. **Search** - Index on `name` fields for LIKE queries

### Query Optimization

- Use pagination for large result sets
- Leverage workspace_id partitioning
- Cache frequently accessed data in KV
- Consider denormalization for reports

## Migration Strategy

Migrations will be stored in `/db/migrations/` as numbered SQL files:

```
db/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_workspaces.sql
│   ├── 003_create_folders.sql
│   ├── 004_create_files.sql
│   ├── 005_create_tags.sql
│   └── ...
└── schema.sql
```

Run migrations with:

```bash
wrangler d1 migrations apply
```

## Data Types Reference

- **TEXT** - Strings, UUIDs, JSON
- **INTEGER** - Counts, file sizes
- **BOOLEAN** - True/false (0/1)
- **DATETIME** - Timestamps (ISO 8601, **always UTC**)
- **NULL** - Optional values

## Implementation Notes

### Timestamp Handling (CRITICAL)

**Storage**:

- D1 stores timestamps as TEXT in ISO 8601 format: `YYYY-MM-DD HH:MM:SS.SSS`
- **ALWAYS use UTC** - D1's `CURRENT_TIMESTAMP` returns UTC
- When inserting from application: use `new Date().toISOString()` (always UTC)

**Frontend**:

- JavaScript `Date` objects store time in UTC internally (milliseconds since epoch)
- `new Date()` is safe for in-memory operations (Phase 1)
- When sending to backend: **MUST use `.toISOString()`** to ensure UTC
- Display in user's local timezone in the UI using `.toLocaleString()`

**Why UTC?**:

- Prevents timezone bugs when users are in different timezones
- Prevents bugs when user travels or changes timezone
- Cloudflare infrastructure is UTC-based
- Trash retention (30 days) must be consistent across timezones

**Example**:

```typescript
// ✅ CORRECT: Send to D1
const timestamp = new Date().toISOString(); // "2025-12-31T10:30:00.000Z"
await db.prepare('INSERT INTO files (..., created_at) VALUES (?, ?)').bind(..., timestamp);

// ✅ CORRECT: Display to user
const displayTime = new Date(file.createdAt).toLocaleString(); // User's local timezone

// ❌ WRONG: Serialize Date object
const timestamp = new Date(); // Will use local timezone when serialized
```

### Other Notes

- Use UUIDs (TEXT) for all IDs
- Implement row-level security in application layer
- Regular backups via Cloudflare
- Monitor query performance with D1 analytics

---

**Last Updated**: December 29, 2025  
**Status**: Design phase (not yet implemented)  
**Next**: Create migration files per schema
