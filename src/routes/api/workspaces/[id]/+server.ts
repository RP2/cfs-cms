import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

// PATCH /api/workspaces/[id] - Update workspace (name, description, icon)
export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const { name, description, icon } = await request.json();

		// Fetch current workspace
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!workspace) {
			return httpError(404, { message: 'Workspace not found' });
		}

		const now = new Date().toISOString();

		// Update only provided fields
		await platform!.env.DB.prepare(
			`UPDATE workspaces 
       SET name = COALESCE(?, name), 
           description = COALESCE(?, description), 
           icon = COALESCE(?, icon),
           updated_at = ?
       WHERE id = ?`
		)
			.bind(name || null, description || null, icon || null, now, id)
			.run();

		// Fetch updated workspace
		const updated = await platform!.env.DB.prepare('SELECT * FROM workspaces WHERE id = ?')
			.bind(id)
			.first();

		// Update cache
		await platform!.env.KV.put(`workspace:${id}`, JSON.stringify(updated), {
			expirationTtl: 600
		});

		return json(snakeToCamel(updated));
	} catch (err) {
		console.error('Update workspace error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// DELETE /api/workspaces/[id] - Delete a workspace (permanent)
export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;

		// Check workspace exists
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!workspace) {
			return httpError(404, { message: 'Workspace not found' });
		}

		// Check if empty
		const hasFolders = await platform!.env.DB.prepare(
			'SELECT COUNT(*) as count FROM folders WHERE workspace_id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		const hasFiles = await platform!.env.DB.prepare(
			'SELECT COUNT(*) as count FROM files WHERE workspace_id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if ((hasFolders?.count as number) > 0 || (hasFiles?.count as number) > 0) {
			return httpError(409, {
				message:
					'Cannot delete workspace with content. Please delete or move all files and folders first.'
			});
		}

		// Permanently delete
		await platform!.env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(id).run();

		// Clear cache
		await platform!.env.KV.delete(`workspace:${id}`);

		return json({
			success: true,
			message: 'Workspace deleted'
		});
	} catch (err) {
		console.error('Delete workspace error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
