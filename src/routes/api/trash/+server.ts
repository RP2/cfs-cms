import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// GET /api/trash - List trashed items in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (!workspaceId) {
			return httpError(400, { message: 'workspaceId is required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			return json({
				files: [],
				folders: [],
				total: 0
			});
		}

		// Fetch trashed files
		const filesResult = await platform.env.DB.prepare(
			`SELECT * FROM files 
       WHERE workspace_id = ? AND deleted_at IS NOT NULL 
       ORDER BY deleted_at DESC 
       LIMIT ? OFFSET ?`
		)
			.bind(workspaceId, limit, offset)
			.all();

		// Fetch trashed folders
		const foldersResult = await platform.env.DB.prepare(
			`SELECT * FROM folders 
       WHERE workspace_id = ? AND deleted_at IS NOT NULL 
       ORDER BY deleted_at DESC 
       LIMIT ? OFFSET ?`
		)
			.bind(workspaceId, limit, offset)
			.all();

		// Add type field
		const files = filesResult.results.map((f: any) => ({ ...f, type: 'file' }));
		const folders = foldersResult.results.map((f: any) => ({ ...f, type: 'folder' }));

		return json({
			files,
			folders,
			total: files.length + folders.length
		});
	} catch (err) {
		console.error('Get trash error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
