import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// GET /api/search - Search files and folders
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const query = url.searchParams.get('query');
		const workspaceId = url.searchParams.get('workspaceId');
		const folderId = url.searchParams.get('folderId') || null;
		const type = url.searchParams.get('type') || 'all'; // file|folder|all
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (!query || !workspaceId) {
			return httpError(400, { message: 'query and workspaceId are required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			return json({
				results: [],
				total: 0,
				query
			});
		}

		const searchPattern = `%${query.toLowerCase()}%`;
		const results: any[] = [];

		// Search files
		if (type === 'file' || type === 'all') {
			let filesQuery = `SELECT *, 'file' as type FROM files 
         WHERE workspace_id = ? 
         AND deleted_at IS NULL 
         AND LOWER(name) LIKE ?`;

			const params = [workspaceId, searchPattern];

			if (folderId) {
				filesQuery += ' AND folder_id = ?';
				params.push(folderId);
			}

			filesQuery += ' LIMIT ? OFFSET ?';
			params.push(limit.toString(), offset.toString());

			const filesResult = await platform.env.DB.prepare(filesQuery)
				.bind(...params)
				.all();

			results.push(...filesResult.results);
		}

		// Search folders
		if (type === 'folder' || type === 'all') {
			let foldersQuery = `SELECT *, 'folder' as type FROM folders 
         WHERE workspace_id = ? 
         AND deleted_at IS NULL 
         AND LOWER(name) LIKE ?`;

			const params = [workspaceId, searchPattern];

			if (folderId) {
				foldersQuery += ' AND parent_id = ?';
				params.push(folderId);
			}

			foldersQuery += ' LIMIT ? OFFSET ?';
			params.push(limit.toString(), offset.toString());

			const foldersResult = await platform.env.DB.prepare(foldersQuery)
				.bind(...params)
				.all();

			results.push(...foldersResult.results);
		}

		// Add relevance score (simple: exact match = 1.0, contains = 0.5)
		const scoredResults = results.map((item) => ({
			...item,
			score: item.name.toLowerCase() === query.toLowerCase() ? 1.0 : 0.5
		}));

		// Sort by score descending
		scoredResults.sort((a, b) => b.score - a.score);

		return json({
			results: scoredResults,
			total: scoredResults.length,
			query
		});
	} catch (err) {
		console.error('Search error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
