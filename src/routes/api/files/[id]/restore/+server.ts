import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/files/:id/restore - Restore a soft-deleted file
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

		// Update file to clear deletion timestamps
		await platform.env.DB.prepare(
			`UPDATE files 
       SET deleted_at = NULL, trashed_until = NULL, updated_at = ?
       WHERE id = ?`
		)
			.bind(now, id)
			.run();

		// Fetch restored file
		const file = await platform.env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(id).first();

		if (!file) {
			return httpError(404, { message: 'File not found' });
		}

		return json(file);
	} catch (err) {
		console.error('Restore file error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
