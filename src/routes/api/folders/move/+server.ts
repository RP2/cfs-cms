import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Helper: Get all descendant folder IDs (prevents circular reference)
async function getDescendantFolderIds(db: any, folderId: string): Promise<Set<string>> {
	const descendants = new Set<string>();
	const queue = [folderId];

	while (queue.length > 0) {
		const currentId = queue.shift()!;
		const children = await db
			.prepare('SELECT id FROM folders WHERE parent_id = ? AND deleted_at IS NULL')
			.bind(currentId)
			.all();

		for (const child of children.results) {
			const childId = (child as any).id;
			descendants.add(childId);
			queue.push(childId);
		}
	}

	return descendants;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { folderId, targetParentId, targetWorkspaceId } = await request.json();

		// Validate inputs
		if (!folderId) {
			return json({ error: 'folderId is required', code: 'INVALID_INPUT' }, { status: 400 });
		}

		// Verify folder exists
		const folder = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(folderId)
			.first();

		if (!folder) {
			return json({ error: 'Folder not found', code: 'FOLDER_NOT_FOUND' }, { status: 404 });
		}

		const f = folder as any;
		const targetWsId = targetWorkspaceId || f.workspace_id;

		// Circular reference check: can't move into own descendant
		if (targetParentId) {
			const descendants = await getDescendantFolderIds(platform!.env.DB, folderId);
			if (descendants.has(targetParentId)) {
				return json(
					{
						error: 'Cannot move folder into its own descendant',
						code: 'CIRCULAR_REFERENCE'
					},
					{ status: 400 }
				);
			}

			// Verify target parent exists in target workspace
			const targetParent = await platform!.env.DB.prepare(
				'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
			)
				.bind(targetParentId, targetWsId)
				.first();

			if (!targetParent) {
				return json(
					{
						error: 'Target parent folder not found',
						code: 'FOLDER_NOT_FOUND'
					},
					{ status: 404 }
				);
			}
		}

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

		const now = new Date().toISOString();

		// Update folder and all descendants to new workspace if needed
		if (targetWorkspaceId && targetWorkspaceId !== f.workspace_id) {
			const descendants = await getDescendantFolderIds(platform!.env.DB, folderId);
			descendants.add(folderId);

			const folderIds = Array.from(descendants);
			const placeholders = folderIds.map(() => '?').join(',');

			// Update all folders in hierarchy
			await platform!.env.DB.prepare(
				`UPDATE folders SET workspace_id = ?, updated_at = ? WHERE id IN (${placeholders})`
			)
				.bind(targetWsId, now, ...folderIds)
				.run();

			// Update all files in these folders (recursively)
			await platform!.env.DB.prepare(
				`UPDATE files SET workspace_id = ?, updated_at = ? WHERE folder_id IN (${placeholders})`
			)
				.bind(targetWsId, now, ...folderIds)
				.run();

			// Invalidate caches
			await platform!.env.KV.delete(`workspace:${targetWsId}:folders`);
			await platform!.env.KV.delete(`workspace:${f.workspace_id}:folders`);
			await platform!.env.KV.delete(`workspace:${targetWsId}:files`);
			await platform!.env.KV.delete(`workspace:${f.workspace_id}:files`);
		} else {
			// Same workspace move, just update parent_id
			await platform!.env.DB.prepare(
				`UPDATE folders SET parent_id = ?, updated_at = ? WHERE id = ?`
			)
				.bind(targetParentId || null, now, folderId)
				.run();

			await platform!.env.KV.delete(`workspace:${targetWsId}:folders`);
		}

		return json({
			success: true,
			folderId,
			targetParentId: targetParentId || null,
			targetWorkspaceId: targetWsId
		});
	} catch (err) {
		console.error('Move folder error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
