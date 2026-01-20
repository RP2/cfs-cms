# CFS CMS - Complete Upload Implementation Guide

**Date**: January 20, 2026
**Status**: ✅ Current implementation working | 🚀 R2 Multipart recommended
**Purpose**: Comprehensive guide covering all upload approaches and implementation details

---

## Table of Contents

1. [Current Implementation (Chunked Upload)](#current-implementation-chunked-upload)
2. [Recommended Implementation (R2 Multipart)](#recommended-implementation-r2-multipart)
3. [Migration Strategy](#migration-strategy)
4. [API Reference](#api-reference)
5. [Performance Comparison](#performance-comparison)
6. [Troubleshooting](#troubleshooting)

---

## Current Implementation (Chunked Upload)

### Architecture Overview

```
Client Browser → SvelteKit API → Cloudflare Worker → KV Storage → R2 Storage
                                      ↓
                                 D1 Database (Metadata)
```

### Implementation Details

#### 1. Client-Side Chunking (`uploadService.ts`)

```typescript
// Key parameters
const CHUNK_SIZE = 512 * 1024; // 512KB chunks

export async function uploadFileInChunks(
  file: File,
  workspaceId: string,
  folderId: string | null,
  onProgress?: (percent: number) => void
): Promise<any> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadSessionId = generateSessionId();

  // Upload each chunk to KV
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', String(i));
    // ... other metadata

    await fetch('/api/files/upload-chunk', {
      method: 'POST',
      body: formData
    });
  }

  // Finalize upload
  const result = await fetch('/api/files/finalize-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadSessionId, fileName: file.name, ... })
  });

  return result.json();
}
```

#### 2. KV Chunk Storage (`/api/files/upload-chunk`)

```typescript
export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();
	const chunk = formData.get('chunk') as Blob;
	const chunkIndex = Number(formData.get('chunkIndex'));
	const uploadSessionId = formData.get('uploadSessionId') as string;

	// Store chunk in KV with expiration
	const chunkBuffer = await chunk.arrayBuffer();
	const kvKey = `upload:${uploadSessionId}:chunk:${chunkIndex}`;

	await platform.env.KV.put(kvKey, chunkBuffer, {
		expirationTtl: 3600 // 1 hour
	});

	return json({ received: chunkIndex });
};
```

#### 3. Upload Finalization (`/api/files/finalize-upload`)

```typescript
export const POST: RequestHandler = async ({ request, platform }) => {
	const { uploadSessionId, fileName, fileSize, totalChunks } = await request.json();

	// Retrieve all chunks from KV
	const chunks: Uint8Array[] = [];
	for (let i = 0; i < totalChunks; i++) {
		const kvKey = `upload:${uploadSessionId}:chunk:${i}`;
		const chunkData = await platform.env.KV.getArrayBuffer(kvKey);
		chunks.push(new Uint8Array(chunkData));
	}

	// Combine chunks in memory
	const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const combined = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}

	// Upload to R2
	const r2Path = `${workspaceId}/${newId}/${fileName}`;
	await platform.env.R2.put(r2Path, combined, {
		httpMetadata: { contentType: mimeType },
		customMetadata: { uploadedAt: new Date().toISOString() }
	});

	// Create D1 record
	await platform.env.DB.prepare(/* INSERT query */).bind(/* params */).run();

	// Cleanup KV chunks
	for (let i = 0; i < totalChunks; i++) {
		await platform.env.KV.delete(`upload:${uploadSessionId}:chunk:${i}`);
	}

	return json({ file: newFile });
};
```

### Current Issues

- **403 Forbidden**: Cloudflare CSRF protection blocks chunked uploads in development
- **Memory Usage**: Combining chunks in Worker memory limits file sizes
- **Performance**: Sequential chunk uploads, KV roundtrips add latency
- **Complexity**: Multi-step process with staging area

---

## Recommended Implementation (R2 Multipart)

### Architecture Overview

```
Client Browser → SvelteKit API → Cloudflare Worker → R2 Multipart API
                                      ↓
                                 D1 Database (Metadata)
                                      ↓
                            R2 Assembles Parts Automatically
```

### Implementation Details

Based on [Cloudflare's official R2 multipart documentation](https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/).

#### 1. Initiate Multipart Upload

```typescript
// API endpoint: POST /api/files/mpu-create
export const POST: RequestHandler = async ({ request, platform }) => {
	const { fileName, workspaceId, folderId } = await request.json();

	// Generate unique key
	const fileId = `file_${Date.now()}`;
	const r2Key = `${workspaceId}/${fileId}/${fileName}`;

	// Create multipart upload
	const multipartUpload = await platform.env.R2.createMultipartUpload(r2Key);

	return json({
		uploadId: multipartUpload.uploadId,
		key: multipartUpload.key,
		fileId
	});
};
```

#### 2. Upload Parts Directly to R2

```typescript
// API endpoint: PUT /api/files/mpu-uploadpart
export const PUT: RequestHandler = async ({ request, platform }) => {
	const url = new URL(request.url);
	const uploadId = url.searchParams.get('uploadId');
	const partNumber = parseInt(url.searchParams.get('partNumber') || '0');
	const key = url.searchParams.get('key');

	if (!uploadId || !key || !request.body) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	// Resume multipart upload and upload part
	const multipartUpload = platform.env.R2.resumeMultipartUpload(key, uploadId);
	const uploadedPart = await multipartUpload.uploadPart(partNumber, request.body);

	return json({
		partNumber: uploadedPart.partNumber,
		etag: uploadedPart.etag
	});
};
```

#### 3. Complete Multipart Upload

```typescript
// API endpoint: POST /api/files/mpu-complete
export const POST: RequestHandler = async ({ request, platform }) => {
	const { uploadId, key, parts, fileId, workspaceId, folderId, fileName, fileSize, mimeType } =
		await request.json();

	// Resume and complete upload
	const multipartUpload = platform.env.R2.resumeMultipartUpload(key, uploadId);
	const object = await multipartUpload.complete(parts);

	// Create D1 record
	const now = new Date().toISOString();
	await platform.env.DB.prepare(/* INSERT query */)
		.bind(fileId, workspaceId, folderId, fileName, fileSize, mimeType, key, 'user_1', now, now)
		.run();

	return json({ file: { id: fileId /* ... other fields */ } });
};
```

#### 4. Client-Side Multipart Management

```typescript
// Updated uploadService.ts
export async function uploadFileMultipart(
	file: File,
	workspaceId: string,
	folderId: string | null,
	onProgress?: (percent: number) => void
): Promise<any> {
	const PART_SIZE = 5 * 1024 * 1024; // 5MB minimum
	const totalParts = Math.ceil(file.size / PART_SIZE);

	// 1. Initiate multipart upload
	const initResponse = await fetch('/api/files/mpu-create', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fileName: file.name, workspaceId, folderId })
	});
	const { uploadId, key, fileId } = await initResponse.json();

	// 2. Upload parts in parallel
	const uploadPromises = [];
	const uploadedParts = [];

	for (let i = 0; i < totalParts; i++) {
		const start = i * PART_SIZE;
		const end = Math.min(start + PART_SIZE, file.size);
		const part = file.slice(start, end);

		const promise = uploadPart(part, i + 1, uploadId, key).then((partInfo) => {
			uploadedParts.push(partInfo);
			onProgress?.(((i + 1) / totalParts) * 100);
		});

		uploadPromises.push(promise);
	}

	// Wait for all parts to upload
	await Promise.all(uploadPromises);

	// Sort parts by part number for completion
	uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

	// 3. Complete multipart upload
	const completeResponse = await fetch('/api/files/mpu-complete', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			uploadId,
			key,
			parts: uploadedParts,
			fileId,
			workspaceId,
			folderId,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type
		})
	});

	return completeResponse.json();
}

async function uploadPart(part: Blob, partNumber: number, uploadId: string, key: string) {
	const response = await fetch(
		`/api/files/mpu-uploadpart?uploadId=${uploadId}&partNumber=${partNumber}&key=${encodeURIComponent(key)}`,
		{ method: 'PUT', body: part }
	);

	if (!response.ok) throw new Error(`Part ${partNumber} upload failed`);

	return response.json();
}
```

### Benefits of R2 Multipart

1. **Direct to Storage**: Parts go directly to R2, no intermediate storage
2. **Parallel Uploads**: Multiple parts can upload simultaneously
3. **R2 Assembly**: No memory-intensive chunk combining in Worker
4. **Better Reliability**: Resumable uploads, retry failed parts
5. **Scalability**: Handles very large files efficiently
6. **Cloudflare Native**: Official recommended approach

### Error Handling & Cleanup

```typescript
// Abort multipart upload
export const DELETE: RequestHandler = async ({ request, platform }) => {
	const url = new URL(request.url);
	const uploadId = url.searchParams.get('uploadId');
	const key = url.searchParams.get('key');

	const multipartUpload = platform.env.R2.resumeMultipartUpload(key, uploadId);
	await multipartUpload.abort();

	return json({ success: true });
};
```

---

## Migration Strategy

### Phase 1: Fix Current Implementation

1. Resolve 403 Forbidden issue (deploy to production)
2. Test chunked uploads end-to-end
3. Optimize chunk size (1MB-2MB instead of 512KB)

### Phase 2: Implement R2 Multipart

1. Create new API endpoints alongside existing ones
2. Update `uploadService.ts` with multipart logic
3. Add feature flag to switch between implementations
4. Test thoroughly with large files

### Phase 3: Deprecate Old Implementation

1. Monitor performance metrics
2. Gradually migrate users
3. Remove old chunked endpoints after successful rollout

### Backward Compatibility

- Keep existing endpoints working during transition
- Add version headers or query params to switch implementations
- Maintain same client API in `dataService.ts`

---

## API Reference

### Current Chunked Endpoints

#### POST `/api/files/upload-chunk`

**Purpose**: Store file chunk in KV
**Body**: `multipart/form-data`

- `chunk`: File chunk (Blob)
- `chunkIndex`: Chunk number (0-based)
- `totalChunks`: Total number of chunks
- `uploadSessionId`: Unique session identifier
- `fileName`, `fileSize`, `mimeType`: File metadata
- `workspaceId`, `folderId`: Destination info

**Response**: `{ received: number, sessionId: string }`

#### POST `/api/files/finalize-upload`

**Purpose**: Combine chunks and upload to R2
**Body**: `application/json`

```json
{
	"uploadSessionId": "string",
	"fileName": "string",
	"fileSize": "number",
	"mimeType": "string",
	"workspaceId": "string",
	"folderId": "string|null",
	"totalChunks": "number"
}
```

**Response**: `{ file: FileObject }`

### R2 Multipart Endpoints

#### POST `/api/files/mpu-create`

**Purpose**: Initiate multipart upload
**Body**: `application/json`

```json
{
	"fileName": "string",
	"workspaceId": "string",
	"folderId": "string|null"
}
```

**Response**: `{ uploadId: string, key: string, fileId: string }`

#### PUT `/api/files/mpu-uploadpart`

**Purpose**: Upload part directly to R2
**Query Params**: `uploadId`, `partNumber`, `key`
**Body**: Raw part data
**Response**: `{ partNumber: number, etag: string }`

#### POST `/api/files/mpu-complete`

**Purpose**: Complete multipart upload
**Body**: `application/json`

```json
{
  "uploadId": "string",
  "key": "string",
  "parts": [{ partNumber: number, etag: string }],
  "fileId": "string",
  "workspaceId": "string",
  "folderId": "string|null",
  "fileName": "string",
  "fileSize": "number",
  "mimeType": "string"
}
```

**Response**: `{ file: FileObject }`

#### DELETE `/api/files/mpu-abort`

**Purpose**: Cancel multipart upload
**Query Params**: `uploadId`, `key`
**Response**: `{ success: boolean }`

---

## Performance Comparison

| Metric                     | Chunked (Current)         | R2 Multipart                    | Improvement        |
| -------------------------- | ------------------------- | ------------------------------- | ------------------ |
| **Memory Usage**           | High (combining)          | Low (R2 assembly)               | ~80% reduction     |
| **Network Requests**       | N chunks + 1 finalize     | 1 create + N parts + 1 complete | Similar count      |
| **Parallelization**        | Sequential                | Parallel parts                  | 5-10x faster       |
| **Resume Capability**      | Yes (KV TTL)              | Yes (R2 native)                 | Better reliability |
| **File Size Limit**        | Worker memory (~128MB)    | R2 limits (unlimited)           | Unlimited          |
| **Error Recovery**         | Restart from failed chunk | Retry failed parts              | Better UX          |
| **Development Complexity** | Medium                    | Medium-High                     | Similar            |
| **Production Maintenance** | KV cleanup required       | R2 handles cleanup              | Simpler            |

---

## Troubleshooting

### 403 Forbidden in Development

**Cause**: Cloudflare WAF blocks multipart POST requests
**Solutions**:

1. Deploy to Cloudflare Pages for testing
2. Add custom headers: `X-Requested-With: XMLHttpRequest`
3. Configure WAF rules to allow file uploads

### Large File Upload Failures

**Current Issue**: Memory limits in chunk combining
**R2 Multipart Solution**: R2 handles assembly, no memory limit

### Slow Upload Performance

**Current Issue**: Sequential chunk processing
**R2 Multipart Solution**: Parallel part uploads

### Incomplete Uploads

**Current Issue**: KV TTL expiration (1 hour)
**R2 Multipart Solution**: Persistent until explicitly aborted

### Testing Large Files

```bash
# Create test file
dd if=/dev/zero of=test_100MB.bin bs=1M count=100

# Test chunked upload
curl -X POST http://localhost:8787/api/files \
  -F "file=@test_100MB.bin" \
  -F "workspaceId=test" \
  -H "X-Requested-With: XMLHttpRequest"
```

---

## Implementation Priority

**Immediate (Fix Current)**:

- Resolve 403 issue
- Test production deployment
- Optimize chunk size

**Short-term (Implement R2 Multipart)**:

- Create new API endpoints
- Update upload service
- Test performance improvements

**Long-term (Advanced Features)**:

- Signed URLs for client-direct uploads
- Upload progress with resumability
- Batch upload optimizations

**Recommended**: Implement R2 multipart uploads for production-ready, scalable file uploads.</content>
<parameter name="filePath">docs/UPLOAD_IMPLEMENTATION.md
