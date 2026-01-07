import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/files/bulk-delete - Soft delete multiple files
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { fileIds } = await request.json();

		if (!Array.isArray(fileIds) || fileIds.length === 0) {
			return httpError(400, { message: 'fileIds array is required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			const now = new Date();
			const trashedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			return json({
				success: true,
				deletedCount: fileIds.length,
				trashedUntil: trashedUntil.toISOString()
			});
		}

		const now = new Date();
		const trashedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		const nowStr = now.toISOString();
		const trashedUntilStr = trashedUntil.toISOString();

		// Build batch update for all files
		const placeholders = fileIds.map(() => '?').join(',');
		const result = await platform.env.DB.prepare(
			`UPDATE files 
       SET deleted_at = ?, trashed_until = ?, updated_at = ?
       WHERE id IN (${placeholders})`
		)
			.bind(nowStr, trashedUntilStr, nowStr, ...fileIds)
			.run();

		return json({
			success: true,
			deletedCount: result.meta.changes || fileIds.length,
			trashedUntil: trashedUntilStr
		});
	} catch (err) {
		console.error('Bulk delete files error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
