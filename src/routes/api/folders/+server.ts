import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { CreateFolderRequest } from '$lib/types/api';
import { snakeToCamel } from '$lib/utils/db';

// POST /api/folders - Create a folder
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { workspaceId, parentId, name }: CreateFolderRequest = await request.json();

		// Validate
		if (!workspaceId || !name?.trim()) {
			return httpError(400, { message: 'workspaceId and name are required' });
		}

		// Verify workspace exists
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId)
			.first();

		if (!workspace) {
			return httpError(404, { message: 'Workspace not found' });
		}

		// Verify parent folder if provided
		if (parentId) {
			const parent = await platform!.env.DB.prepare(
				'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
			)
				.bind(parentId, workspaceId)
				.first();

			if (!parent) {
				return httpError(404, { message: 'Parent folder not found in this workspace' });
			}
		}

		// Check for duplicate name at same level
		const existing = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE workspace_id = ? AND parent_id IS ? AND name = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId, parentId || null, name.trim())
			.first();

		if (existing) {
			return httpError(409, {
				message: 'A folder with this name already exists at this level'
			});
		}

		// Create folder
		const now = new Date().toISOString();
		const newId = `folder_${Date.now()}`;

		await platform!.env.DB.prepare(
			`INSERT INTO folders (id, workspace_id, parent_id, name, starred, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(newId, workspaceId, parentId || null, name.trim(), 0, now, now)
			.run();

		// Fetch created folder
		const newFolder = await platform!.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
			.bind(newId)
			.first();

		// Cache
		await platform!.env.KV.put(`folder:${newId}`, JSON.stringify(newFolder), {
			expirationTtl: 600
		});

		return json(newFolder, { status: 201 });
	} catch (err) {
		console.error('Create folder error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// GET /api/folders?workspaceId=... - List all folders in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return httpError(400, { message: 'workspaceId is required' });
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY created_at'
		)
			.bind(workspaceId)
			.all();

		return json({ folders: snakeToCamel(result.results || []) });
	} catch (err) {
		console.error('List folders error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
