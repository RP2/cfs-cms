import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/trash/empty - Permanently delete all trashed items older than 30 days
export const POST: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return httpError(400, { message: 'workspaceId is required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			return json({
				success: true,
				purgedFiles: 0,
				purgedFolders: 0,
				r2FilesPurged: 0,
				totalFreed: '0MB'
			});
		}

		const now = new Date().toISOString();

		// Find files to purge (trashed_until < now)
		const filesToPurge = await platform.env.DB.prepare(
			`SELECT * FROM files 
       WHERE workspace_id = ? AND deleted_at IS NOT NULL AND trashed_until < ?`
		)
			.bind(workspaceId, now)
			.all();

		// Track unique storage paths for R2 cleanup
		const storagePaths = new Set<string>();
		let totalSize = 0;
		let r2FilesPurged = 0;

		// Delete files and track storage paths
		for (const file of filesToPurge.results) {
			await platform.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run();

			storagePaths.add(file.storage_path);
			totalSize += file.size || 0;
		}

		// Check reference counts and delete from R2 if needed
		for (const path of storagePaths) {
			const refCount = await platform.env.DB.prepare(
				'SELECT COUNT(*) as count FROM files WHERE storage_path = ?'
			)
				.bind(path)
				.first();

			if (refCount && refCount.count === 0) {
				// No more references, delete from R2
				try {
					await platform.env.R2.delete(path);
					r2FilesPurged++;
				} catch (err) {
					console.error(`Failed to delete R2 object ${path}:`, err);
				}
			}
		}

		// Find folders to purge
		const foldersToPurge = await platform.env.DB.prepare(
			`SELECT * FROM folders 
       WHERE workspace_id = ? AND deleted_at IS NOT NULL AND trashed_until < ?`
		)
			.bind(workspaceId, now)
			.all();

		// Delete folders
		for (const folder of foldersToPurge.results) {
			await platform.env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(folder.id).run();
		}

		// Format total size freed
		const totalFreed =
			totalSize < 1024 * 1024
				? `${Math.round(totalSize / 1024)}KB`
				: `${Math.round(totalSize / (1024 * 1024))}MB`;

		return json({
			success: true,
			purgedFiles: filesToPurge.results.length,
			purgedFolders: foldersToPurge.results.length,
			r2FilesPurged,
			totalFreed
		});
	} catch (err) {
		console.error('Empty trash error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
