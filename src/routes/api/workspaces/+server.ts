import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { CreateWorkspaceRequest } from '$lib/types/api';
import { snakeToCamel } from '$lib/utils/db';

// POST /api/workspaces - Create a workspace
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { name, description, icon }: CreateWorkspaceRequest = await request.json();

		// Validate
		if (!name?.trim()) {
			return httpError(400, { message: 'Workspace name is required' });
		}

		const now = new Date().toISOString();
		const newId = `workspace_${Date.now()}`;
		const ownerId = 'user_1'; // TODO: Replace with actual auth user

		// Phase 1: User seeded manually via Cloudflare console
		// Phase 3: Replace with proper auth (users created via signup)

		// Insert into D1
		await platform!.env.DB.prepare(
			`INSERT INTO workspaces (id, name, description, icon, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(newId, name.trim(), description || null, icon || null, ownerId, now, now)
			.run();

		// Fetch created workspace
		const workspace = await platform!.env.DB.prepare('SELECT * FROM workspaces WHERE id = ?')
			.bind(newId)
			.first();

		// Cache in KV (optional, 10 min TTL)
		await platform!.env.KV.put(`workspace:${newId}`, JSON.stringify(workspace), {
			expirationTtl: 600
		});

		return json(snakeToCamel(workspace), { status: 201 });
	} catch (err) {
		console.error('Create workspace error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// GET /api/workspaces - List all workspaces for current user
export const GET: RequestHandler = async ({ platform }) => {
	try {
		const ownerId = 'user_1'; // TODO: Replace with actual auth user

		const result = await platform!.env.DB.prepare(
			`SELECT * FROM workspaces WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
		)
			.bind(ownerId)
			.all();

		return json({
			workspaces: snakeToCamel(result.results || []),
			total: result.results?.length || 0
		});
	} catch (err) {
		console.error('List workspaces error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
