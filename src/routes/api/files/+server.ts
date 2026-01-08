import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Max-Age': '86400'
};

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS
	});
};

// POST /api/files - Upload file (mock for now, real R2 in Phase 2b)
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.json();
		const { file: base64Data, fileName, fileType, fileSize, workspaceId, folderId, name } = body;

		console.log('Upload attempt:', { fileName: name || fileName, workspaceId, folderId, fileSize });

		if (!base64Data || !workspaceId) {
			return new Response(JSON.stringify({ message: 'file and workspaceId are required' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const now = new Date().toISOString();
		const newId = `file_${Date.now()}`;
		const finalName = name || fileName;
		const storagePath = `${workspaceId}/${newId}/${finalName}`;

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return new Response(
				JSON.stringify({
					id: newId,
					workspaceId,
					folderId: folderId || null,
					name: finalName,
					size: fileSize,
					mimeType: fileType || 'application/octet-stream',
					storagePath,
					uploadedBy: 'user_1',
					starred: false,
					tagIds: [],
					createdAt: now,
					updatedAt: now,
					deletedAt: null,
					trashedUntil: null
				}),
				{
					status: 201,
					headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
				}
			);
		}

		// Database mode: Insert file record
		await platform!.env.DB.prepare(
			`INSERT INTO files (id, workspace_id, folder_id, name, mime_type, size, storage_path, uploaded_by, starred, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				newId,
				workspaceId,
				folderId,
				finalName,
				fileType || 'application/octet-stream',
				fileSize,
				storagePath,
				'user_1', // TODO: auth
				0,
				now,
				now
			)
			.run();

		// Upload to R2 (decode base64 back to binary)
		const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
		await platform!.env.R2.put(storagePath, binaryData);

		console.log('R2 upload complete:', storagePath);

		const newFile = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(newId)
			.first();

		console.log('Upload success:', newFile?.id);

		// Convert snake_case to camelCase for response
		return new Response(
			JSON.stringify({
				id: newFile.id,
				workspaceId: newFile.workspace_id,
				folderId: newFile.folder_id || null,
				name: newFile.name,
				size: newFile.size,
				mimeType: newFile.mime_type,
				storagePath: newFile.storage_path,
				uploadedBy: newFile.uploaded_by,
				starred: newFile.starred === 1,
				tagIds: newFile.tag_ids ? JSON.parse(newFile.tag_ids) : [],
				createdAt: newFile.created_at,
				updatedAt: newFile.updated_at,
				deletedAt: newFile.deleted_at || null,
				trashedUntil: newFile.trashed_until || null
			}),
			{
				status: 201,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		console.error('Upload file error:', err);
		return new Response(
			JSON.stringify({
				message: 'Internal server error',
				error: err instanceof Error ? err.message : String(err)
			}),
			{
				status: 500,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			}
		);
	}
};

// GET /api/files?workspaceId=... - List all files in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return new Response(JSON.stringify({ message: 'workspaceId is required' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return new Response(JSON.stringify({ files: [] }), {
				status: 200,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE workspace_id = ? ORDER BY created_at'
		)
			.bind(workspaceId)
			.all();

		return new Response(JSON.stringify({ files: snakeToCamel(result.results || []) }), {
			status: 200,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error('Upload file error:', {
			errorMessage,
			stack: err instanceof Error ? err.stack : undefined
		});
		return new Response(JSON.stringify({ message: errorMessage || 'Internal server error' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
};
