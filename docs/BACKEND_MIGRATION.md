# Phase 2 Backend Migration Guide

**Date**: January 1, 2026  
**Purpose**: Step-by-step guide for integrating Cloudflare backend  
**Audience**: Phase 2 developer implementing backend

---

## Overview

This guide shows exactly how to integrate the Cloudflare backend. The data service layer is already API-ready with optimistic updates.

**Key Principle**: The three-layer architecture with optimistic updates means minimal changes:

```
Components → dataService (optimistic + API) → Stores → API Routes → D1/R2
```

**Current Status**: dataService already fires API calls in background. Only API route handlers need implementation.

---

## Phase Overview

| Phase     | Data Source             | Changes                              | Status        |
| --------- | ----------------------- | ------------------------------------ | ------------- |
| Phase 1   | Mock data (in-memory)   | None                                 | ✅ Complete   |
| Phase 1.5 | API-ready architecture  | Removed dual-mode, added optimistic  | ✅ Complete   |
| Phase 2   | Cloudflare D1 + R2 + KV | Implement API route handlers only    | 🚀 This guide |
| Phase 3   | + Authentication        | Add Auth.js + update user references | Future        |

---

## Setup Steps

### Step 1: Initialize Cloudflare Project

```bash
# If not already set up
npm install -g @cloudflare/wrangler
wrangler login

# Initialize project
wrangler init
```

### Step 2: Create wrangler.toml

```toml
name = "cfs-cms"
main = "src/index.ts"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true

[env.development]
routes = [{ pattern = "*/api/*", zone_name = "example.com" }]
vars = { ENVIRONMENT = "development" }

[env.production]
routes = [{ pattern = "example.com/api/*", zone_name = "example.com" }]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "cfs_cms"
database_id = "YOUR_DATABASE_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "cfs-cms-files"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_NAMESPACE_ID"
```

### Step 3: Create D1 Database

```bash
wrangler d1 create cfs_cms
```

### Step 4: Apply Database Schema

Run the SQL from `docs/DATABASE.md`:

```bash
wrangler d1 execute cfs_cms --file docs/database.sql
```

### Step 5: Create R2 Bucket

```bash
wrangler r2 bucket create cfs-cms-files
```

### Step 6: Create KV Namespace

```bash
wrangler kv:namespace create cfs_cms
```

---

## File Structure

Create this structure under `src/routes/api/`:

```
src/routes/api/
├── workspaces/
│   ├── +server.ts          # GET, POST
│   └── [id]/
│       ├── +server.ts      # PATCH, DELETE
│       └── restore/+server.ts
├── folders/
│   ├── +server.ts          # POST
│   ├── [id]/
│   │   ├── +server.ts      # PATCH, DELETE
│   │   └── restore/+server.ts
│   └── copy/+server.ts
├── files/
│   ├── +server.ts          # POST (upload)
│   ├── [id]/
│   │   ├── +server.ts      # PATCH, DELETE
│   │   ├── restore/+server.ts
│   │   └── tags/+server.ts
│   ├── move/+server.ts
│   ├── copy/+server.ts
│   ├── copy-workspace/+server.ts
│   └── bulk-delete/+server.ts
├── tags/
│   ├── +server.ts          # POST
│   └── [id]/
│       └── +server.ts      # DELETE
├── trash/
│   ├── +server.ts          # GET
│   └── empty/+server.ts
└── search/+server.ts
```

---

## Migration Pattern

### Pattern: API Route Handler Implementation

**Current dataService** (already optimized):

```typescript
export function createFolder(parentId: string | null, name: string): Folder {
	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	// Create locally for instant UI
	const newFolder: Folder = { /* ... */ };
	const folders = get(workspaceFolders);
	workspaceFolders.set([...folders, newFolder]);

	// Fire API call in background
	fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ parentId, name, workspaceId: currentWs.id })
	}).catch(err => console.error('Create folder error:', err));

	return newFolder;
}
```

**What needs implementation** - API route handler:

```typescript
// src/routes/api/folders/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { workspaceId, parentId, name } = await request.json();

	// Mock fallback for local dev
	if (!platform?.env?.DB) {
		const mockFolder = {
			id: `folder_${Date.now()}`,
			workspaceId,
			parentId,
			name,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		return json(mockFolder, { status: 201 });
	}

	// Real database implementation
	const newId = `folder_${Date.now()}`;
	const now = new Date().toISOString();

	await platform.env.DB.prepare(
		'INSERT INTO folders (id, workspace_id, parent_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
	).bind(newId, workspaceId, parentId, name, now, now).run();

	const folder = await platform.env.DB.prepare(
		'SELECT * FROM folders WHERE id = ?'
	).bind(newId).first();

	return json(folder, { status: 201 });
};
```

**Key Points**:

1. ✅ dataService already fires API calls (no changes needed)
2. ✅ Implement API route handler with mock fallback
3. ✅ Replace mock data with D1 queries when ready
4. ✅ Components continue to work unchanged

---

### Pattern 2: Bulk Operations (Delete Multiple)

**Before** (Phase 1):

```typescript
export function deleteFiles(fileIds: string[]): void {
	if (fileIds.length === 0) return;

	const currentFilesList = get(currentFiles);
	const now = utcNow();
	const idSet = new Set(fileIds);

	currentFilesList.forEach((file) => {
		if (!idSet.has(file.id)) return;
		file.deletedAt = now;
		file.trashedUntil = computeTrashedUntil(now);
		file.updatedAt = now;
	});

	currentFiles.set([...currentFilesList]);
}
```

**After** (Phase 2):

```typescript
export async function deleteFiles(fileIds: string[]): Promise<void> {
	if (fileIds.length === 0) return;

	try {
		const response = await fetch('/api/files/bulk-delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileIds })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to delete files');
		}

		const result = await response.json();

		// Update local store with deleted status
		const currentFilesList = get(currentFiles);
		const idSet = new Set(fileIds);
		const now = new Date();

		currentFilesList.forEach((file) => {
			if (!idSet.has(file.id)) return;
			file.deletedAt = now;
			file.trashedUntil = result.trashedUntil
				? new Date(result.trashedUntil)
				: computeTrashedUntil(now);
			file.updatedAt = now;
		});

		currentFiles.set([...currentFilesList]);
		toast.success(`${result.deletedCount} files moved to trash`);
	} catch (error) {
		toast.error(`Failed to delete files: ${error.message}`);
		throw error;
	}
}
```

---

### Pattern 3: File Upload (Multipart)

**Before** (Phase 1 - mock):

```typescript
export function uploadFiles(files: FileList): void {
	const currentWs = get(currentWorkspace);
	const currentFolder_ = get(currentFolder);

	if (!currentWs || !currentFolder_) return;

	const currentFilesList = get(currentFiles);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const newFile: File = {
			id: `file_${Date.now()}_${i}`,
			workspaceId: currentWs.id,
			folderId: currentFolder_.id,
			name: file.name,
			size: file.size,
			mimeType: file.type || 'application/octet-stream',
			storagePath: URL.createObjectURL(file),
			uploadedBy: 'user_1',
			starred: false,
			tagIds: [],
			trashedUntil: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};
		currentFilesList.push(newFile);
	}

	currentFiles.set([...currentFilesList]);
}
```

**After** (Phase 2):

```typescript
export async function uploadFiles(files: FileList): Promise<void> {
	const currentWs = get(currentWorkspace);
	const currentFolder_ = get(currentFolder);

	if (!currentWs || !currentFolder_) return;

	try {
		const currentFilesList = get(currentFiles);
		const uploadedFiles: File[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const formData = new FormData();
			formData.append('file', file);
			formData.append('workspaceId', currentWs.id);
			formData.append('folderId', currentFolder_.id);
			formData.append('name', file.name);

			const response = await fetch('/api/files', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(`Upload failed: ${error.error}`);
			}

			const newFile: File = await response.json();
			uploadedFiles.push(newFile);
		}

		currentFiles.set([...currentFilesList, ...uploadedFiles]);
		toast.success(`${uploadedFiles.length} file(s) uploaded`);
	} catch (error) {
		toast.error(`Upload failed: ${error.message}`);
		throw error;
	}
}
```

---

### Pattern 4: Move Operations (Cross-Workspace)

**Before** (Phase 1):

```typescript
export function moveFilesToWorkspace(
	fileIds: string[],
	targetWorkspaceId: string,
	targetFolderId: string | null = null
): void {
	const targetWorkspace = get(workspaces).find((w) => w.id === targetWorkspaceId && !w.deletedAt);
	if (!targetWorkspace) {
		throw new Error('Target workspace not found.');
	}

	// Validate folder...
	moveFilesToFolder(fileIds, targetFolderId, { targetWorkspaceId });
}
```

**After** (Phase 2):

```typescript
export async function moveFilesToWorkspace(
	fileIds: string[],
	targetWorkspaceId: string,
	targetFolderId: string | null = null
): Promise<void> {
	try {
		const response = await fetch('/api/files/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fileIds,
				targetWorkspaceId,
				targetFolderId
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to move files');
		}

		const result = await response.json();

		// Update store
		const files = get(currentFiles);
		const idSet = new Set(fileIds);
		const now = new Date();

		files.forEach((file) => {
			if (!idSet.has(file.id)) return;
			file.workspaceId = targetWorkspaceId;
			file.folderId = targetFolderId;
			file.updatedAt = now;
		});

		currentFiles.set([...files]);
		toast.success(`${result.movedCount} file(s) moved`);
	} catch (error) {
		toast.error(`Failed to move files: ${error.message}`);
		throw error;
	}
}
```

---

## Example API Route Handler

### Create a Folder Endpoint

**File**: `src/routes/api/folders/+server.ts`

```typescript
import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { workspaceId, parentId, name } = await request.json();

		// Validate inputs
		if (!workspaceId || !name?.trim()) {
			return httpError(400, {
				error: 'workspaceId and name are required',
				code: 'INVALID_INPUT'
			});
		}

		// Verify workspace exists
		const workspace = await platform.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId)
			.first();

		if (!workspace) {
			return httpError(404, {
				error: 'Workspace not found',
				code: 'WORKSPACE_NOT_FOUND'
			});
		}

		// Verify parent folder (if provided) exists in same workspace
		if (parentId) {
			const parent = await platform.env.DB.prepare(
				'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
			)
				.bind(parentId, workspaceId)
				.first();

			if (!parent) {
				return httpError(404, {
					error: 'Parent folder not found in this workspace',
					code: 'FOLDER_NOT_FOUND'
				});
			}
		}

		// Check for duplicate name at same level
		const existing = await platform.env.DB.prepare(
			'SELECT * FROM folders WHERE workspace_id = ? AND parent_id = ? AND name = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId, parentId || null, name.trim())
			.first();

		if (existing) {
			return httpError(409, {
				error: 'A folder with this name already exists at this level',
				code: 'DUPLICATE_NAME'
			});
		}

		// Create folder
		const now = new Date().toISOString();
		const newId = `folder_${Date.now()}`;

		await platform.env.DB.prepare(
			`INSERT INTO folders
       (id, workspace_id, parent_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
		)
			.bind(newId, workspaceId, parentId || null, name.trim(), now, now)
			.run();

		// Fetch created folder
		const newFolder = await platform.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
			.bind(newId)
			.first();

		// Cache in KV
		await platform.env.KV.put(
			`folder:${newId}`,
			JSON.stringify(newFolder),
			{ expirationTtl: 600 } // 10 minute TTL
		);

		return json(newFolder, { status: 201 });
	} catch (err) {
		console.error('Create folder error:', err);
		return httpError(500, {
			error: 'Internal server error',
			code: 'INTERNAL_ERROR'
		});
	}
};
```

---

## Type Definitions for API

Create `src/lib/types/api.ts`:

```typescript
export interface ApiResponse<T> {
	data?: T;
	error?: string;
	code?: string;
	statusCode: number;
}

export interface BulkDeleteRequest {
	fileIds: string[];
}

export interface MoveFilesRequest {
	fileIds: string[];
	targetFolderId?: string | null;
	targetWorkspaceId?: string;
}

export interface CopyFilesRequest {
	fileIds: string[];
	targetFolderId?: string | null;
	targetWorkspaceId?: string;
}
```

---

## Testing Strategy

### Phase 2a: API + Mock Data

1. ✅ Keep `PUBLIC_USE_MOCK_DATA=true`
2. ✅ Create API endpoints
3. ✅ Update dataService to call API
4. ✅ Test that API returns mock data
5. ✅ Verify all CRUD operations work

### Phase 2b: Real Database

1. ✅ Populate D1 with test data
2. ✅ Update API to query D1 instead of mock
3. ✅ Test all endpoints with real database
4. ✅ Test concurrent operations
5. ✅ Test error conditions

### Phase 2c: Production

1. ✅ Remove `PUBLIC_USE_MOCK_DATA`
2. ✅ Deploy to production
3. ✅ Run smoke tests
4. ✅ Monitor performance

---

## Error Handling

### Standardize Errors

All API errors should follow this format:

```json
{
	"error": "Descriptive error message",
	"code": "ERROR_CODE",
	"statusCode": 400
}
```

### Error Handling in dataService

```typescript
try {
	const response = await fetch('/api/endpoint', {
		/* ... */
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(`API Error [${errorData.code}]: ${errorData.error}`);
	}

	return await response.json();
} catch (error) {
	// Log error
	console.error('Operation failed:', error);

	// Show user-friendly toast
	if (error instanceof TypeError) {
		toast.error('Network error. Please check your connection.');
	} else {
		toast.error(error.message || 'Operation failed');
	}

	throw error;
}
```

---

## Optimization: Caching with KV

### Cache Folder Hierarchy

```typescript
// After creating/updating folder
await platform.env.KV.put(
	`workspace:${workspaceId}:folders`,
	JSON.stringify(updatedFolders),
	{ expirationTtl: 600 } // 10 minutes
);
```

### Invalidate Cache

```typescript
// After any mutation
await platform.env.KV.delete(`workspace:${workspaceId}:folders`);
```

---

## Transactions & Data Integrity

### Multi-Step Operations

Use D1 transactions:

```typescript
const batch = platform.env.DB.batch([
  platform.env.DB.prepare('INSERT INTO files ...').bind(...),
  platform.env.DB.prepare('UPDATE folders ...').bind(...),
  platform.env.DB.prepare('INSERT INTO tags_files ...').bind(...)
]);

await batch.run();
```

---

## Reference Counting for R2

### When Copying a File

```typescript
// Don't upload to R2, reference existing file
const response = await platform.env.DB.prepare(
  `INSERT INTO files
   (id, workspace_id, folder_id, storage_path, ...)
   VALUES (?, ?, ?, ?, ...)`
).bind(newId, wsId, folderId, originalFile.storage_path, ...)
  .run();

// Don't increment any counter - D1 acts as reference count
```

### When Permanently Deleting

```typescript
// Delete D1 record
await platform.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run();

// Count remaining files with same storage_path
const refCount = await platform.env.DB.prepare(
	'SELECT COUNT(*) as count FROM files WHERE storage_path = ?'
)
	.bind(storagePath)
	.first();

// Only delete from R2 if no copies remain
if (refCount.count === 0) {
	await platform.env.R2.delete(storagePath);
}
```

---

## Deployment Checklist

- [ ] D1 database created and seeded
- [ ] R2 bucket configured
- [ ] KV namespace created
- [ ] All API endpoints implemented
- [ ] All dataService functions updated
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Environment variables set
- [ ] Testing complete (unit + integration)
- [ ] Performance verified (load testing)
- [ ] Security audit done (auth, permissions)
- [ ] Backup strategy documented
- [ ] Monitoring/alerting configured

---

## Troubleshooting

### API calls fail with 401

- Check Cloudflare Zero Trust configuration
- Verify JWT token in Authorization header
- Check user permissions in database

### File uploads timeout

- Increase worker timeout limit
- Implement chunked upload (Phase 3+)
- Check R2 bucket permissions

### Database queries slow

- Add missing indexes (see DATABASE.md)
- Check query plans with `EXPLAIN QUERY PLAN`
- Use KV caching for frequent queries

### Data out of sync with client

- Clear localStorage (viewType)
- Refresh page to re-fetch from API
- Check for unhandled errors in network tab

---

## Next Steps

1. ✅ Read [PHASE2_API_CONTRACT.md](PHASE2_API_CONTRACT.md)
2. ✅ Review [DATABASE.md](DATABASE.md) schema
3. ✅ Set up Cloudflare project
4. ✅ Create API route handlers
5. ✅ Update dataService functions
6. ✅ Test locally with `wrangler dev`
7. ✅ Deploy to Cloudflare Workers
8. ✅ Monitor and optimize

---

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [SvelteKit Endpoints](https://svelte.dev/docs/kit/routing#server)

---
