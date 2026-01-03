import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

// GET /api/tags?workspaceId=... - List all tags in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return json({ error: 'workspaceId is required', code: 'INVALID_INPUT' }, { status: 400 });
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM tags WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY name'
		)
			.bind(workspaceId)
			.all();

		return json({ tags: snakeToCamel(result.results || []) });
	} catch (err) {
		console.error('List tags error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};

// POST /api/tags - Create or find tag (upsert)
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { workspaceId, name, color } = await request.json();

		// Validate inputs
		if (!workspaceId || !name?.trim()) {
			return json(
				{
					error: 'workspaceId and name are required',
					code: 'INVALID_INPUT'
				},
				{ status: 400 }
			);
		}

		// Verify workspace exists
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId)
			.first();

		if (!workspace) {
			return json({ error: 'Workspace not found', code: 'WORKSPACE_NOT_FOUND' }, { status: 404 });
		}

		// Normalize tag name: trim and lowercase for deduplication
		const normalizedName = name.trim().toLowerCase();

		// Check if tag exists (case-insensitive) or find soft-deleted one
		const existing = await platform!.env.DB.prepare(
			'SELECT * FROM tags WHERE workspace_id = ? AND LOWER(name) = ?'
		)
			.bind(workspaceId, normalizedName)
			.first();

		const now = new Date().toISOString();

		if (existing) {
			// If soft-deleted, restore it
			const e = existing as any;
			if (e.deleted_at) {
				await platform!.env.DB.prepare(
					'UPDATE tags SET deleted_at = NULL, updated_at = ? WHERE id = ?'
				)
					.bind(now, e.id)
					.run();

				// Return restored tag
				const restored = await platform!.env.DB.prepare('SELECT * FROM tags WHERE id = ?')
					.bind(e.id)
					.first();

				return json(snakeToCamel(restored), { status: 200 });
			}
			// Already exists and not deleted
			return json(snakeToCamel(existing), { status: 200 });
		}

		// Create new tag
		const newId = `tag_${Date.now()}`;
		const tagColor = color || 'accent';

		await platform!.env.DB.prepare(
			`INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
		)
			.bind(newId, workspaceId, normalizedName, tagColor, now, now)
			.run();

		// Fetch created tag
		const newTag = await platform!.env.DB.prepare('SELECT * FROM tags WHERE id = ?')
			.bind(newId)
			.first();

		// Invalidate cache
		await platform!.env.KV.delete(`workspace:${workspaceId}:tags`);

		return json(snakeToCamel(newTag), { status: 201 });
	} catch (err) {
		console.error('Create/find tag error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
