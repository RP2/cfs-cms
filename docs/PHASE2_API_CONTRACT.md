# Phase 2 API Contract - Cloudflare Backend

**Date**: January 1, 2026  
**Status**: Specification for Phase 2 implementation  
**Target**: Cloudflare Workers + D1 + R2

---

## Overview

This document defines all API endpoints needed for Phase 2 backend integration. Each endpoint maps to existing `dataService.ts` functions that currently operate on in-memory stores.

**Base Path**: `/api`

**Authentication**: Cloudflare Zero Trust (JWT in Authorization header, Phase 2)

**Error Format**:

```json
{
	"error": "Error description",
	"code": "ERROR_CODE",
	"statusCode": 400
}
```

---

## Workspace Endpoints

### POST /api/workspaces

**Purpose**: Create a new workspace

**Request**:

```json
{
	"name": "Photography Portfolio",
	"description": "Portfolio of my work",
	"icon": "📸"
}
```

**Response** (201):

```json
{
	"id": "workspace_1704110400000",
	"name": "Photography Portfolio",
	"description": "Portfolio of my work",
	"icon": "📸",
	"ownerId": "user_123",
	"createdAt": "2026-01-01T12:00:00.000Z",
	"updatedAt": "2026-01-01T12:00:00.000Z",
	"deletedAt": null
}
```

**Maps to**: `dataService.createWorkspace(name, description)`

**Implementation Notes**:

- `ownerId` comes from auth context (Cloudflare Zero Trust)
- `id` can be ULIDv1 or similar for better performance than timestamps
- Return full workspace object

---

### DELETE /api/workspaces/:id

**Purpose**: Permanently delete a workspace

**Request**: None

**Response** (200):

```json
{
	"success": true,
	"message": "Workspace deleted"
}
```

**Errors**:

- 404: Workspace not found
- 409: Workspace contains files/folders

**Maps to**: `dataService.deleteWorkspace(workspaceId)`

**Implementation Notes**:

- Check workspace is empty (no non-deleted files/folders)
- Permanent deletion (no soft delete)
- Should be an admin-only operation (check ownership)

---

### GET /api/workspaces

**Purpose**: List all workspaces for current user

**Request**: None (optional: `?limit=50&offset=0`)

**Response** (200):

```json
{
	"workspaces": [
		{
			"id": "workspace_1704110400000",
			"name": "Photography Portfolio",
			"description": "Portfolio of my work",
			"icon": "📸",
			"ownerId": "user_123",
			"createdAt": "2026-01-01T12:00:00.000Z",
			"updatedAt": "2026-01-01T12:00:00.000Z",
			"deletedAt": null
		}
	],
	"total": 1
}
```

**Maps to**: Derived from store, filtered by `ownerId`

**Implementation Notes**:

- Only return workspaces where `ownerId === currentUser.id`
- Filter out soft-deleted workspaces (`deletedAt !== null`)
- Paginate if needed (Phase 2+)

---

## Folder Endpoints

### POST /api/folders

**Purpose**: Create a new folder

**Request**:

```json
{
	"workspaceId": "workspace_1704110400000",
	"parentId": null,
	"name": "Q1 2026",
	"icon": "📁"
}
```

**Response** (201):

```json
{
	"id": "folder_1704110400001",
	"workspaceId": "workspace_1704110400000",
	"parentId": null,
	"name": "Q1 2026",
	"icon": "📁",
	"starred": false,
	"createdAt": "2026-01-01T12:00:00.000Z",
	"updatedAt": "2026-01-01T12:00:00.000Z",
	"deletedAt": null,
	"trashedUntil": null
}
```

**Errors**:

- 400: Invalid parent ID or circular reference
- 409: Folder with same name already exists at this level

**Maps to**: `dataService.createFolder(parentId, name)`

**Implementation Notes**:

- Extract `workspaceId` from parent folder or request
- Validate parent folder exists in same workspace
- Check for duplicate names at same level
- Prevent circular references (can't move into own descendant)

---

### PATCH /api/folders/:id

**Purpose**: Update folder (rename, move, star)

**Request** (any combination):

```json
{
	"name": "Q1 2026 Photos",
	"parentId": "folder_1704110400002",
	"starred": true,
	"icon": "📷"
}
```

**Response** (200): Updated folder object

**Errors**:

- 400: Invalid new parent (circular reference, wrong workspace)
- 404: Folder not found
- 409: Duplicate name

**Maps to**: `dataService.renameFolder()`, `dataService.moveFolder()`, `dataService.toggleFolderStar()`

**Implementation Notes**:

- Validate all constraints before updating
- Return updated folder object
- Circular reference check: new parent can't be descendant of this folder

---

### DELETE /api/folders/:id

**Purpose**: Soft delete a folder and all nested files

**Request**: None

**Response** (200):

```json
{
	"success": true,
	"deletedAt": "2026-01-01T12:00:00.000Z",
	"trashedUntil": "2026-01-31T12:00:00.000Z"
}
```

**Maps to**: `dataService.deleteFolder(folderId)`

**Implementation Notes**:

- Set `deletedAt` timestamp
- Calculate `trashedUntil` as `deletedAt + 30 days`
- Cascade soft delete all files in folder
- Cascade soft delete all subfolders
- Return trash expiry date for UI countdown

---

### POST /api/folders/:id/restore

**Purpose**: Restore a soft-deleted folder

**Request**: None

**Response** (200): Restored folder object

**Maps to**: `dataService.restoreFolder(folderId)`

**Implementation Notes**:

- Clear `deletedAt` and `trashedUntil`
- Recursively restore all soft-deleted subfolders and files
- Restore to original location (parent folder)

---

## File Endpoints

### POST /api/files

**Purpose**: Upload a file or create file record

**Request** (multipart/form-data):

```
file: (binary)
workspaceId: workspace_1704110400000
folderId: folder_1704110400001 (or null for workspace root)
name: photo.jpg (optional, defaults to filename)
```

**Response** (201):

```json
{
	"id": "file_1704110400002",
	"workspaceId": "workspace_1704110400000",
	"folderId": "folder_1704110400001",
	"name": "photo.jpg",
	"size": 2048576,
	"mimeType": "image/jpeg",
	"storagePath": "r2://workspace_1704110400000/photo.jpg",
	"uploadedBy": "user_123",
	"starred": false,
	"tagIds": [],
	"createdAt": "2026-01-01T12:00:00.000Z",
	"updatedAt": "2026-01-01T12:00:00.000Z",
	"deletedAt": null,
	"trashedUntil": null
}
```

**Errors**:

- 400: Invalid workspace/folder
- 413: File too large
- 415: File type not allowed

**Maps to**: `dataService.uploadFiles(fileList)`

**Implementation Notes**:

- Upload to R2 with path: `${workspaceId}/${fileId}/${fileName}`
- Store in D1 with metadata
- Content-addressed naming for deduplication (Phase 2+)
- Return file object with R2 metadata

---

### PATCH /api/files/:id

**Purpose**: Update file metadata (rename, move, star, tags)

**Request** (any combination):

```json
{
	"name": "vacation.jpg",
	"folderId": "folder_1704110400002",
	"starred": true,
	"tagIds": ["tag_1", "tag_2"]
}
```

**Response** (200): Updated file object

**Errors**:

- 404: File not found
- 400: Invalid folder (wrong workspace, doesn't exist)

**Maps to**: `dataService.renameFile()`, `dataService.moveFilesToFolder()`, `dataService.toggleFileStar()`, `dataService.setFileTags()`

**Implementation Notes**:

- If `folderId` changes, validate target folder in same workspace
- Merge tags (don't replace, unless using PUT)
- Return updated file object

---

### DELETE /api/files/:id

**Purpose**: Soft delete a file

**Request**: None

**Response** (200):

```json
{
	"success": true,
	"deletedAt": "2026-01-01T12:00:00.000Z",
	"trashedUntil": "2026-01-31T12:00:00.000Z"
}
```

**Maps to**: `dataService.deleteFile(fileId)`

**Implementation Notes**:

- Set `deletedAt` and `trashedUntil`
- Don't delete R2 file (other copies may exist)
- Return trash expiry date for UI countdown

---

### DELETE /api/files/:id?permanent=true

**Purpose**: Permanently delete a file

**Request**: None

**Response** (200):

```json
{
	"success": true,
	"remainingCopies": 0,
	"r2Deleted": true,
	"message": "File and R2 object deleted"
}
```

**Errors**:

- 404: File not found

**Maps to**: `dataService.permanentlyDeleteFile(fileId)`

**Implementation Notes**:

- Delete D1 record
- Count remaining files with same `storagePath`
- Only delete R2 file if `remainingCopies === 0`
- Return copy count for UI feedback
- This is the ONLY way to trigger R2 deletion

---

### POST /api/files/:id/restore

**Purpose**: Restore a soft-deleted file

**Request**: None

**Response** (200): Restored file object

**Maps to**: `dataService.restoreFile(fileId)`

**Implementation Notes**:

- Clear `deletedAt` and `trashedUntil`
- Restore to original folder/workspace
- Verify R2 file still exists (for UI feedback)

---

### POST /api/files/bulk-delete

**Purpose**: Soft delete multiple files

**Request**:

```json
{
	"fileIds": ["file_1", "file_2", "file_3"]
}
```

**Response** (200):

```json
{
	"success": true,
	"deletedCount": 3,
	"trashedUntil": "2026-01-31T12:00:00.000Z"
}
```

**Maps to**: `dataService.deleteFiles(fileIds)`

**Implementation Notes**:

- Delete all specified files
- Return count of deleted files
- R2 files preserved (reference counting)

---

## File Move Endpoints

### POST /api/files/move

**Purpose**: Move files to a folder

**Request**:

```json
{
	"fileIds": ["file_1", "file_2"],
	"targetFolderId": "folder_1704110400002",
	"targetWorkspaceId": "workspace_1704110400000"
}
```

**Response** (200):

```json
{
	"success": true,
	"movedCount": 2,
	"files": [
		{
			/* updated file objects */
		}
	]
}
```

**Errors**:

- 400: Invalid target folder/workspace
- 404: Source file not found

**Maps to**: `dataService.moveFilesToFolder()`, `dataService.moveFilesToWorkspace()`

**Implementation Notes**:

- If `targetWorkspaceId` differs from current, requires confirmation
- Validate target folder exists in target workspace
- Update `workspaceId`, `folderId`, `updatedAt`
- Preserve metadata (tags, starred, size, etc.)
- Can move deleted files (will restore context)

---

## File Copy Endpoints

### POST /api/files/copy

**Purpose**: Copy files to a folder

**Request**:

```json
{
	"fileIds": ["file_1", "file_2"],
	"targetFolderId": "folder_1704110400002"
}
```

**Response** (201):

```json
{
	"success": true,
	"copiedCount": 2,
	"copies": [
		{
			"id": "file_copied_1",
			"storagePath": "r2://original/path",
			"name": "Copy of photo.jpg",
			"createdAt": "2026-01-01T12:00:00.000Z"
		}
	]
}
```

**Errors**:

- 400: Invalid target folder
- 404: Source file not found

**Maps to**: `dataService.copyFilesToFolder()`

**Implementation Notes**:

- Create new D1 records with unique IDs
- Share `storagePath` (no R2 upload)
- Rename with "Copy of" prefix
- Clear tags, starred, deletedAt
- Return array of created copies

---

### POST /api/files/copy-workspace

**Purpose**: Copy files to a different workspace

**Request**:

```json
{
	"fileIds": ["file_1"],
	"targetWorkspaceId": "workspace_1704110400001"
}
```

**Response** (201):

```json
{
	"success": true,
	"copiedCount": 1,
	"copies": [
		{
			/* copy objects */
		}
	]
}
```

**Maps to**: `dataService.copyFilesToWorkspace()`

**Implementation Notes**:

- Create new D1 records in target workspace
- Place at workspace root (no folder)
- Share `storagePath` with original
- Clear tags, starred, deletedAt

---

## Folder Copy Endpoints

### POST /api/folders/copy

**Purpose**: Copy a folder with all nested files

**Request**:

```json
{
	"folderIds": ["folder_1"],
	"targetFolderId": "folder_1704110400002"
}
```

**Response** (201):

```json
{
	"success": true,
	"copiedCount": 1,
	"foldersCreated": 1,
	"filesCreated": 5,
	"copies": [
		{
			/* copied folder objects */
		}
	]
}
```

**Maps to**: `dataService.copyFoldersToFolder()`

**Implementation Notes**:

- Recursively copy folder structure
- Create new D1 records for all folders
- Copy all nested files with new IDs
- Share file `storagePath` values
- Preserve folder hierarchy
- Clear all tags, starred, deletedAt

---

## Tag Endpoints

### POST /api/tags

**Purpose**: Create or find a tag

**Request**:

```json
{
	"workspaceId": "workspace_1704110400000",
	"name": "Important",
	"color": "accent"
}
```

**Response** (200 or 201):

```json
{
	"id": "tag_1704110400000",
	"workspaceId": "workspace_1704110400000",
	"name": "Important",
	"color": "accent",
	"createdAt": "2026-01-01T12:00:00.000Z",
	"updatedAt": "2026-01-01T12:00:00.000Z",
	"deletedAt": null
}
```

**Maps to**: `dataService.upsertTag(workspaceId, name, color)`

**Implementation Notes**:

- Normalize tag name: `trim().toLowerCase()`
- Check if tag exists (case-insensitive)
- If exists and soft-deleted, restore it
- Return 200 if found, 201 if created
- Workspace-scoped (unique per workspace)

---

### POST /api/files/:id/tags

**Purpose**: Add tags to a file

**Request**:

```json
{
	"tagNames": ["Important", "Q1 2026"],
	"color": "accent"
}
```

**Response** (200):

```json
{
	"file": {
		/* updated file */
	},
	"tags": [
		{
			/* tag objects */
		}
	]
}
```

**Maps to**: `dataService.addTagsToFile()` or `dataService.addTagsToFiles()`

**Implementation Notes**:

- Create tags if missing (upsert)
- Add to file's `tagIds` array
- Don't replace existing tags
- Return updated file and created tags

---

### DELETE /api/tags/:id

**Purpose**: Remove a tag from workspace

**Request**: None

**Response** (200):

```json
{
	"success": true,
	"filesRemoved": 5
}
```

**Maps to**: `dataService.removeTagFromWorkspace(tagId)`

**Implementation Notes**:

- Soft delete tag (`deletedAt = now`)
- Remove from all files' `tagIds` arrays
- Return count of affected files

---

## Trash Endpoints

### GET /api/trash

**Purpose**: List trashed items in workspace

**Request**: `?workspaceId=workspace_1&limit=50&offset=0`

**Response** (200):

```json
{
	"files": [
		{
			"id": "file_1",
			"name": "deleted.jpg",
			"deletedAt": "2026-01-01T12:00:00.000Z",
			"trashedUntil": "2026-01-31T12:00:00.000Z",
			"type": "file"
		}
	],
	"folders": [
		{
			"id": "folder_1",
			"name": "Old Photos",
			"deletedAt": "2026-01-01T12:00:00.000Z",
			"trashedUntil": "2026-01-31T12:00:00.000Z",
			"type": "folder"
		}
	],
	"total": 2
}
```

**Implementation Notes**:

- Filter files/folders by `workspaceId` and `deletedAt !== null`
- Sort by `deletedAt` descending (most recent first)
- Calculate days until purge: `trashedUntil - now`

---

### POST /api/trash/empty

**Purpose**: Permanently delete all trashed items older than 30 days

**Request**: `?workspaceId=workspace_1`

**Response** (200):

```json
{
	"success": true,
	"purgedFiles": 3,
	"purgedFolders": 1,
	"r2FilesPurged": 1,
	"totalFreed": "512MB"
}
```

**Implementation Notes**:

- Find all items where `trashedUntil < now`
- Delete from D1
- For files, apply reference counting (only delete R2 if no copies remain)
- Return counts and storage freed

---

## Search Endpoints

### GET /api/search

**Purpose**: Search files and folders

**Request**:

```
?query=photo
&workspaceId=workspace_1
&folderId=folder_1 (optional)
&type=file|folder|all
&limit=50
&offset=0
```

**Response** (200):

```json
{
	"results": [
		{
			"id": "file_1",
			"name": "photo.jpg",
			"type": "file",
			"folderId": "folder_1",
			"workspaceId": "workspace_1",
			"score": 0.95
		}
	],
	"total": 1,
	"query": "photo"
}
```

**Implementation Notes**:

- Full-text search on `name` field
- Can be enhanced with content search (Phase 3+)
- Filters automatically exclude soft-deleted items
- Relevance scoring for sort order

---

## Share Endpoints (Phase 3+)

These are documented for future reference but not needed for Phase 2.

### POST /api/files/:id/share

### DELETE /api/shares/:id

### GET /api/shares/:token

---

## Error Responses

### Common Error Codes

```typescript
"WORKSPACE_NOT_FOUND" // 404
"WORKSPACE_NOT_EMPTY" // 409
"FOLDER_NOT_FOUND" // 404
"CIRCULAR_REFERENCE" // 400
"DUPLICATE_NAME" // 409
"FILE_NOT_FOUND" // 404
"TAG_NOT_FOUND" // 404
"INVALID_PERMISSION" // 403
"UNAUTHORIZED" // 401
"INTERNAL_ERROR" // 500
```

### Error Response Format

```json
{
	"error": "Workspace contains files and cannot be deleted",
	"code": "WORKSPACE_NOT_EMPTY",
	"statusCode": 409
}
```

---

## Rate Limiting

**Suggested Limits** (Cloudflare Workers):

- 100 requests per minute per user
- 10 file uploads per minute
- 1MB per request (files handled separately)

---

## Database Transactions

**Critical Operations** requiring transactions:

- Copy operations (multiple inserts)
- Move operations with reference updates
- Delete operations with cascades
- Tag operations affecting multiple files

**Implementation**: Use D1 transactions with savepoints

---

## Optimization Considerations

### Query Performance

- Index on `workspaceId` (all tables)
- Index on `folderId` (files, folders)
- Index on `parentId` (folders)
- Index on `deletedAt` (for trash queries)
- Index on `tagIds` (for tag filtering)

### Caching (KV)

- Cache workspace metadata (30 min TTL)
- Cache folder hierarchy per workspace (10 min TTL)
- Cache tag list per workspace (5 min TTL)
- Invalidate on mutations

---

## Timestamp Format

**All timestamps in ISO 8601 format**:

```
2026-01-01T12:00:00.000Z
```

- Always UTC (`Z` suffix)
- 3 decimal places for milliseconds
- Generated server-side (not client)

---

## Pagination

**Query parameters**:

```
?limit=50 (max 500)
&offset=0 (or page=1)
```

**Response**:

```json
{
	"items": [],
	"total": 100,
	"limit": 50,
	"offset": 0,
	"hasMore": true
}
```

---

## Next Steps for Phase 2

1. **Create route handlers** in `src/routes/api/`
2. **Setup D1 database** with schema from `docs/DATABASE.md`
3. **Configure R2 bucket** for file storage
4. **Implement each endpoint** following this contract
5. **Update dataService** functions to call endpoints
6. **Add error handling** and logging
7. **Test with mock data** and real API calls
8. **Deploy to Cloudflare**

---

## References

- [ARCHITECTURE.md](ARCHITECTURE.md) - Data flow
- [DATABASE.md](DATABASE.md) - D1 schema
- [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md) - Implementation status
- [BACKEND_MIGRATION.md](BACKEND_MIGRATION.md) - Step-by-step guide

---
