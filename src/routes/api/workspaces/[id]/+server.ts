import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

// PATCH /api/workspaces/[id] - Update workspace (name, description, icon)
export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const { name, description, icon } = await request.json();

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			const now = new Date().toISOString();
			return json(
				{
					id,
					name: name ?? 'Workspace',
					description: description ?? null,
					icon: icon ?? null,
					updatedAt: now
				},
				{ status: 200 }
			);
		}

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
// Query params:
//   emptyTrash=true - Empty trash first, then delete workspace
export const DELETE: RequestHandler = async ({ params, request, url, platform }) => {
	try {
		const { id } = params;
		const emptyTrash = url.searchParams.get('emptyTrash') === 'true';

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return json({ success: true, message: 'Workspace deleted', trashedCount: 0 });
		}

		// Check workspace exists
		const workspace = await platform!.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!workspace) {
			return httpError(404, { message: 'Workspace not found' });
		}

		// Check if empty (no non-deleted items)
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

		const hasActiveContent =
			((hasFolders as any)?.count || 0) > 0 || ((hasFiles as any)?.count || 0) > 0;

		// If has active content, reject
		if (hasActiveContent) {
			return httpError(409, {
				message:
					'Cannot delete workspace with content. Please delete or move all files and folders first.',
				code: 'WORKSPACE_NOT_EMPTY'
			});
		}

		// No active content - permanently delete ALL items (including trashed) before deleting workspace
		let trashedCount = 0;
		{
			// Get ALL files in workspace (including trashed) for R2 cleanup
			const allFiles = await platform!.env.DB.prepare(
				'SELECT id, storage_path FROM files WHERE workspace_id = ?'
			)
				.bind(id)
				.all();

			// Delete files and handle R2 reference counting
			for (const file of allFiles.results || []) {
				// Delete from D1
				await platform!.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run();

				// Check if other copies exist
				const refCount = await platform!.env.DB.prepare(
					'SELECT COUNT(*) as count FROM files WHERE storage_path = ?'
				)
					.bind(file.storage_path)
					.first();

				// Only delete R2 file if no other copies remain
				if (((refCount as any)?.count || 0) === 0 && file.storage_path) {
					try {
						await platform!.env.R2.delete(file.storage_path);
					} catch (err) {
						console.error(`Failed to delete R2 file ${file.storage_path}:`, err);
					}
				}
			}

			trashedCount = (allFiles.results || []).length;

			// Delete ALL folders (including trashed)
			const allFolders = await platform!.env.DB.prepare(
				'SELECT COUNT(*) as count FROM folders WHERE workspace_id = ?'
			)
				.bind(id)
				.first();

			if (((allFolders as any)?.count || 0) > 0) {
				await platform!.env.DB.prepare('DELETE FROM folders WHERE workspace_id = ?').bind(id).run();

				trashedCount += (allFolders as any)?.count || 0;
			}
		}

		// Delete all tags in workspace (no foreign key cascade issues)
		await platform!.env.DB.prepare('DELETE FROM tags WHERE workspace_id = ?').bind(id).run();

		// Permanently delete workspace
		await platform!.env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(id).run();

		// Clear cache
		await platform!.env.KV.delete(`workspace:${id}`);

		return json({
			success: true,
			message: 'Workspace deleted',
			trashedCount
		});
	} catch (err) {
		console.error('Delete workspace error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
