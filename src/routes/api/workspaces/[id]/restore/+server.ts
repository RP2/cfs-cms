import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/workspaces/:id/restore - Restore a soft-deleted workspace (Phase 2 support)
export const POST: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;

		if (!platform?.env?.DB) {
			return json({ id, deletedAt: null, updatedAt: new Date().toISOString() });
		}

		// Check exists (even if deleted)
		const ws = await platform.env.DB.prepare('SELECT * FROM workspaces WHERE id = ?')
			.bind(id)
			.first();

		if (!ws) {
			return httpError(404, { message: 'Workspace not found' });
		}

		const now = new Date().toISOString();
		await platform.env.DB.prepare(
			'UPDATE workspaces SET deleted_at = NULL, updated_at = ? WHERE id = ?'
		)
			.bind(now, id)
			.run();

		const restored = await platform.env.DB.prepare('SELECT * FROM workspaces WHERE id = ?')
			.bind(id)
			.first();

		return json(restored);
	} catch (err) {
		console.error('Restore workspace error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
