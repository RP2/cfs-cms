import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

// POST /api/files - Upload file (mock for now, real R2 in Phase 2b)
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const workspaceId = formData.get('workspaceId') as string;
		const folderId = (formData.get('folderId') as string) || null;
		const name = (formData.get('name') as string) || file.name;

		if (!file || !workspaceId) {
			return httpError(400, { message: 'file and workspaceId are required' });
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			const now = new Date().toISOString();
			const newId = `file_${Date.now()}`;
			const storagePath = `${workspaceId}/${newId}/${name}`;
			return json(
				{
					id: newId,
					workspaceId,
					folderId,
					name,
					size: (file && (file as any).size) || 0,
					mimeType: (file && (file as any).type) || 'application/octet-stream',
					storagePath,
					uploadedBy: 'user_1',
					starred: 0,
					createdAt: now,
					updatedAt: now,
					deletedAt: null,
					trashedUntil: null
				},
				{ status: 201 }
			);
		}

		// For Phase 2a testing: create record with placeholder storage path
		// Phase 2b: Upload to R2 first
		const now = new Date().toISOString();
		const newId = `file_${Date.now()}`;
		const storagePath = `${workspaceId}/${newId}/${file.name}`;

		await platform!.env.DB.prepare(
			`INSERT INTO files (id, workspace_id, folder_id, name, mime_type, size, storage_path, uploaded_by, starred, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				newId,
				workspaceId,
				folderId,
				name,
				file.type || 'application/octet-stream',
				file.size,
				storagePath,
				'user_1', // TODO: auth
				0,
				now,
				now
			)
			.run();

		// Phase 2b: Upload to R2
		// await platform!.env.R2.put(storagePath, file.stream());

		const newFile = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(newId)
			.first();

		return json(newFile, { status: 201 });
	} catch (err) {
		console.error('Upload file error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// GET /api/files?workspaceId=... - List all files in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return httpError(400, { message: 'workspaceId is required' });
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return json({ files: [] });
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY created_at'
		)
			.bind(workspaceId)
			.all();

		return json({ files: snakeToCamel(result.results || []) });
	} catch (err) {
		console.error('List files error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
