import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/folders/:id/restore - Restore a soft-deleted folder
export const POST: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			return json({
				id,
				deletedAt: null,
				trashedUntil: null,
				updatedAt: new Date().toISOString()
			});
		}

		const now = new Date().toISOString();

		// Restore folder
		await platform.env.DB.prepare(
			`UPDATE folders 
       SET deleted_at = NULL, trashed_until = NULL, updated_at = ?
       WHERE id = ?`
		)
			.bind(now, id)
			.run();

		// Also restore all files in this folder
		await platform.env.DB.prepare(
			`UPDATE files 
       SET deleted_at = NULL, trashed_until = NULL, updated_at = ?
       WHERE folder_id = ?`
		)
			.bind(now, id)
			.run();

		// Fetch restored folder
		const folder = await platform.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
			.bind(id)
			.first();

		if (!folder) {
			return httpError(404, { message: 'Folder not found' });
		}

		return json(folder);
	} catch (err) {
		console.error('Restore folder error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
