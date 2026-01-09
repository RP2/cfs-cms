import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { UpdateFolderRequest } from '$lib/types/api';

// PATCH /api/folders/[id] - Update folder (rename, move, star)
export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	try {
		const id = params.id as string;
		const updates: UpdateFolderRequest = await request.json();

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			const now = new Date().toISOString();
			return json({ id, ...updates, updated_at: now });
		}

		// Check folder exists
		const folder = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!folder) {
			return httpError(404, { message: 'Folder not found' });
		}

		const now = new Date().toISOString();
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name.trim());
		}

		if (updates.parentId !== undefined) {
			fields.push('parent_id = ?');
			values.push(updates.parentId);
		}

		if (updates.starred !== undefined) {
			fields.push('starred = ?');
			values.push(updates.starred ? 1 : 0);
		}

		if (fields.length === 0) {
			return httpError(400, { message: 'No updates provided' });
		}

		fields.push('updated_at = ?');
		values.push(now);
		values.push(id);

		await platform!.env.DB.prepare(`UPDATE folders SET ${fields.join(', ')} WHERE id = ?`)
			.bind(...values)
			.run();

		// Fetch updated folder
		const updated = await platform!.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
			.bind(id)
			.first();

		// Update cache
		await platform!.env.KV.put(`folder:${id}`, JSON.stringify(updated), { expirationTtl: 600 });

		// Convert response manually
		const f = updated as any;
		return json({
			id: f.id,
			workspaceId: f.workspace_id,
			parentId: f.parent_id || null,
			name: f.name,
			starred: Boolean(f.starred),
			createdAt: f.created_at,
			updatedAt: f.updated_at,
			deletedAt: f.deleted_at || null,
			trashedUntil: f.trashed_until || null
		});
	} catch (err) {
		console.error('Update folder error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// DELETE /api/folders/[id] - Soft or permanent delete folder
export const DELETE: RequestHandler = async ({ params, platform, url }) => {
	try {
		const id = params.id as string;
		const permanent = url.searchParams.get('permanent') === 'true';

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			if (permanent) {
				return json({ success: true, permanentlyDeleted: true });
			}
			const now = new Date().toISOString();
			const trashedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
			return json({ success: true, deletedAt: now, trashedUntil });
		}

		const folder = await platform!.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
			.bind(id)
			.first();

		if (!folder) {
			return httpError(404, { message: 'Folder not found' });
		}

		if (permanent) {
			// Build list of all descendant folders including current
			const toVisit: string[] = [id];
			const allFolderIds: string[] = [];

			while (toVisit.length) {
				const currentId = toVisit.pop()!;
				allFolderIds.push(currentId);
				const children = await platform!.env.DB.prepare(
					'SELECT id FROM folders WHERE parent_id = ?'
				)
					.bind(currentId)
					.all();
				for (const row of children.results as any[]) {
					toVisit.push(row.id);
				}
			}

			// Delete files in these folders
			if (allFolderIds.length > 0) {
				const placeholders = allFolderIds.map(() => '?').join(',');
				await platform!.env.DB.prepare(`DELETE FROM files WHERE folder_id IN (${placeholders})`)
					.bind(...allFolderIds)
					.run();
			}

			// Delete the folders themselves
			if (allFolderIds.length > 0) {
				const placeholders2 = allFolderIds.map(() => '?').join(',');
				await platform!.env.DB.prepare(`DELETE FROM folders WHERE id IN (${placeholders2})`)
					.bind(...allFolderIds)
					.run();
			}

			// Clear cache for root folder
			await platform!.env.KV.delete(`folder:${id}`);

			return json({ success: true, permanentlyDeleted: true });
		}

		const now = new Date().toISOString();
		const trashedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		// Soft delete folder
		await platform!.env.DB.prepare(
			'UPDATE folders SET deleted_at = ?, trashed_until = ?, updated_at = ? WHERE id = ?'
		)
			.bind(now, trashedUntil, now, id)
			.run();

		// Soft delete all files in folder
		await platform!.env.DB.prepare(
			'UPDATE files SET deleted_at = ?, trashed_until = ?, updated_at = ? WHERE folder_id = ?'
		)
			.bind(now, trashedUntil, now, id)
			.run();

		// Clear cache
		await platform!.env.KV.delete(`folder:${id}`);

		return json({
			success: true,
			deletedAt: now,
			trashedUntil
		});
	} catch (err) {
		console.error('Delete folder error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
