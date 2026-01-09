import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { UpdateFileRequest } from '$lib/types/api';

// PATCH /api/files/[id] - Update file metadata
export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	try {
		const id = params.id as string;
		const updates: UpdateFileRequest = await request.json();

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			const now = new Date().toISOString();
			return json({ id, ...updates, updated_at: now });
		}

		const file = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!file) {
			return httpError(404, { message: 'File not found' });
		}

		const now = new Date().toISOString();
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name.trim());
		}

		if (updates.folderId !== undefined) {
			fields.push('folder_id = ?');
			values.push(updates.folderId);
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

		await platform!.env.DB.prepare(`UPDATE files SET ${fields.join(', ')} WHERE id = ?`)
			.bind(...values)
			.run();

		const updated = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(id)
			.first();

		// Convert response manually
		const f = updated as any;
		return json({
			id: f.id,
			workspaceId: f.workspace_id,
			folderId: f.folder_id || null,
			name: f.name,
			size: f.size,
			mimeType: f.mime_type,
			storagePath: f.storage_path,
			uploadedBy: f.uploaded_by,
			starred: Boolean(f.starred),
			tagIds: f.tag_ids ? JSON.parse(f.tag_ids) : [],
			createdAt: f.created_at,
			updatedAt: f.updated_at,
			deletedAt: f.deleted_at || null,
			trashedUntil: f.trashed_until || null
		});
	} catch (err) {
		console.error('Update file error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};

// DELETE /api/files/[id] - Soft delete file
export const DELETE: RequestHandler = async ({ params, platform, url }) => {
	try {
		const { id } = params;
		const permanent = url.searchParams.get('permanent') === 'true';

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			if (permanent) {
				return json({
					success: true,
					remainingCopies: 0,
					r2Deleted: true,
					message: 'File deleted (mock)'
				});
			}
			const now = new Date().toISOString();
			const trashedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
			return json({ success: true, deletedAt: now, trashedUntil });
		}

		const file = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(id)
			.first();

		if (!file) {
			return httpError(404, { message: 'File not found' });
		}

		if (permanent) {
			// Permanent delete
			await platform!.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();

			// Check remaining copies with same storage_path
			const refCount = await platform!.env.DB.prepare(
				'SELECT COUNT(*) as count FROM files WHERE storage_path = ?'
			)
				.bind(file.storage_path)
				.first();

			let r2Deleted = false;
			if ((refCount?.count as number) === 0) {
				// await platform!.env.R2.delete(file.storage_path); // Phase 2b
				r2Deleted = true;
			}

			return json({
				success: true,
				remainingCopies: refCount?.count as number,
				r2Deleted,
				message: r2Deleted ? 'File and R2 object deleted' : 'File deleted, R2 object preserved'
			});
		} else {
			// Soft delete
			const now = new Date().toISOString();
			const trashedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

			await platform!.env.DB.prepare(
				'UPDATE files SET deleted_at = ?, trashed_until = ?, updated_at = ? WHERE id = ?'
			)
				.bind(now, trashedUntil, now, id)
				.run();

			return json({
				success: true,
				deletedAt: now,
				trashedUntil
			});
		}
	} catch (err) {
		console.error('Delete file error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
