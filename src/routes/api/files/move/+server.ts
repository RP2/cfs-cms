import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { fileIds, targetFolderId, targetWorkspaceId } = await request.json();

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return json({
				success: true,
				movedCount: Array.isArray(fileIds) ? fileIds.length : 0
			});
		}

		// Validate inputs
		if (!Array.isArray(fileIds) || fileIds.length === 0) {
			return json({ error: 'fileIds array is required', code: 'INVALID_INPUT' }, { status: 400 });
		}

		// Verify all files exist
		const placeholders = fileIds.map(() => '?').join(',');
		const files = await platform!.env.DB.prepare(
			`SELECT * FROM files WHERE id IN (${placeholders})`
		)
			.bind(...fileIds)
			.all();

		if (files.results.length !== fileIds.length) {
			return json(
				{ error: 'One or more files not found', code: 'FILE_NOT_FOUND' },
				{ status: 404 }
			);
		}

		const firstFile = files.results[0] as any;
		const targetWsId = targetWorkspaceId || firstFile.workspace_id;

		// If moving to different workspace, verify it exists
		if (targetWorkspaceId) {
			const workspace = await platform!.env.DB.prepare(
				'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
			)
				.bind(targetWorkspaceId)
				.first();

			if (!workspace) {
				return json(
					{ error: 'Target workspace not found', code: 'WORKSPACE_NOT_FOUND' },
					{ status: 404 }
				);
			}
		}

		// If targetFolderId provided, verify it exists in target workspace
		if (targetFolderId) {
			const folder = await platform!.env.DB.prepare(
				'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
			)
				.bind(targetFolderId, targetWsId)
				.first();

			if (!folder) {
				return json(
					{ error: 'Target folder not found', code: 'FOLDER_NOT_FOUND' },
					{ status: 404 }
				);
			}
		}

		// Update all files
		const now = new Date().toISOString();
		const updateQueries = fileIds.map((fileId) =>
			platform!.env.DB.prepare(
				`UPDATE files SET workspace_id = ?, folder_id = ?, updated_at = ? WHERE id = ?`
			).bind(targetWsId, targetFolderId || null, now, fileId)
		);

		await platform!.env.DB.batch(updateQueries);

		// Invalidate cache
		await platform!.env.KV.delete(`workspace:${targetWsId}:files`);
		if (targetWorkspaceId && firstFile.workspace_id !== targetWorkspaceId) {
			await platform!.env.KV.delete(`workspace:${firstFile.workspace_id}:files`);
		}

		return json({
			success: true,
			movedCount: fileIds.length
		});
	} catch (err) {
		console.error('Move files error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
