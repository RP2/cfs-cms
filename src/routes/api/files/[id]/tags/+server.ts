import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id: fileId } = params;
		const { workspaceId, tagNames } = await request.json();

		// Validate inputs
		if (!fileId || !workspaceId || !Array.isArray(tagNames) || tagNames.length === 0) {
			return json(
				{
					error: 'fileId, workspaceId, and tagNames array are required',
					code: 'INVALID_INPUT'
				},
				{ status: 400 }
			);
		}

		// Verify file exists
		const file = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE id = ? AND workspace_id = ?'
		)
			.bind(fileId, workspaceId)
			.first();

		if (!file) {
			return json({ error: 'File not found', code: 'FILE_NOT_FOUND' }, { status: 404 });
		}

		const f = file as any;

		// Parse existing tags
		let existingTags: string[] = [];
		try {
			existingTags = f.tag_ids ? JSON.parse(f.tag_ids) : [];
		} catch {
			existingTags = [];
		}

		// Upsert each tag and collect IDs
		const now = new Date().toISOString();
		const newTagIds = new Set(existingTags);

		for (const tagName of tagNames) {
			const normalizedName = tagName.trim().toLowerCase();

			// Find or create tag
			let tag = await platform!.env.DB.prepare(
				'SELECT * FROM tags WHERE workspace_id = ? AND LOWER(name) = ? AND deleted_at IS NULL'
			)
				.bind(workspaceId, normalizedName)
				.first();

			if (!tag) {
				// Create new tag
				const newId = `tag_${Date.now()}_${Math.random()}`;
				await platform!.env.DB.prepare(
					`INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
				)
					.bind(newId, workspaceId, normalizedName, 'accent', now, now)
					.run();

				tag = await platform!.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(newId).first();
			}

			if (tag) {
				newTagIds.add((tag as any).id);
			}
		}

		// Update file with new tags
		const tagIdsJson = JSON.stringify(Array.from(newTagIds));
		await platform!.env.DB.prepare('UPDATE files SET tag_ids = ?, updated_at = ? WHERE id = ?')
			.bind(tagIdsJson, now, fileId)
			.run();

		// Fetch updated file
		const updated = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(fileId)
			.first();

		// Invalidate cache
		await platform!.env.KV.delete(`workspace:${workspaceId}:files`);

		return json({ file: snakeToCamel(updated) });
	} catch (err) {
		console.error('Add tags to file error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
