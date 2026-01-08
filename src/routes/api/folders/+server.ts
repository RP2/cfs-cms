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
			return json({ message: 'workspaceId and name are required' }, { status: 400 });
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			const now = new Date().toISOString();
			return json(
				{
					id: `folder_${Date.now()}`,
					workspaceId,
					parentId: parentId || null,
					name: name.trim(),
					starred: 0,
					createdAt: now,
					updatedAt: now,
					deletedAt: null,
					trashedUntil: null
				},
				{ status: 201 }
			);
		}

		// Verify workspace exists
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId)
			.first();

		if (!workspace) {
			return json({ message: 'Workspace not found' }, { status: 404 });
		}

		// Verify parent folder if provided
		if (parentId) {
			let parent = null;
			// Retry for up to 1 second to allow parent to be committed
			for (let attempt = 0; attempt < 5; attempt++) {
				parent = await platform!.env.DB.prepare(
					'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
				)
					.bind(parentId, workspaceId)
					.first();

				if (parent) break;
				if (attempt < 4) {
					// Wait 200ms before retrying (exponential: 200ms, 400ms, 600ms, 800ms)
					await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
				}
			}

			if (!parent) {
				return json({ message: 'Parent folder not found in this workspace' }, { status: 404 });
			}
		}

		// Check for duplicate name at same level
		const existing = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE workspace_id = ? AND parent_id = ? AND name = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId, parentId || null, name.trim())
			.first();

		if (existing) {
			return json(
				{ message: 'A folder with this name already exists at this level' },
				{ status: 409 }
			);
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
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};

// GET /api/folders?workspaceId=... - List all folders in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return httpError(400, { message: 'workspaceId is required' });
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return json({ folders: [] });
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE workspace_id = ? ORDER BY created_at'
		)
			.bind(workspaceId)
			.all();

		return json({ folders: snakeToCamel(result.results || []) });
	} catch (err) {
		console.error('List folders error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
