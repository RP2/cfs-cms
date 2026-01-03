import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { UpdateFolderRequest } from '$lib/types/api';

// PATCH /api/folders/[id] - Update folder (rename, move, star)
export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const updates: UpdateFolderRequest = await request.json();

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

		return json(updated);
	} catch (err) {
		console.error('Update folder error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// DELETE /api/folders/[id] - Soft delete folder
export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;

		const folder = await platform!.env.DB.prepare(
			'SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!folder) {
			return httpError(404, { message: 'Folder not found' });
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
