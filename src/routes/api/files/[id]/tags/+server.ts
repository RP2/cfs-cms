import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id: fileId } = params;
		const { workspaceId, tagNames } = await request.json();

		// Validate inputs
		if (!fileId || !Array.isArray(tagNames) || tagNames.length === 0) {
			return json(
				{
					error: 'fileId and tagNames array are required',
					code: 'INVALID_INPUT'
				},
				{ status: 400 }
			);
		}

		// Get workspace ID from file if not provided
		let wsId = workspaceId;
		if (!wsId) {
			const fileRecord = await platform!.env.DB.prepare(
				'SELECT workspace_id FROM files WHERE id = ?'
			)
				.bind(fileId)
				.first();

			if (!fileRecord) {
				return json({ error: 'File not found', code: 'FILE_NOT_FOUND' }, { status: 404 });
			}

			wsId = (fileRecord as any).workspace_id;
		}

		// Verify file exists
		const file = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE id = ? AND workspace_id = ?'
		)
			.bind(fileId, wsId)
			.first();

		if (!file) {
			return json({ error: 'File not found', code: 'FILE_NOT_FOUND' }, { status: 404 });
		}

		// Upsert each tag and collect IDs
		const now = new Date().toISOString();
		const tagIds: string[] = [];

		for (const tagName of tagNames) {
			const normalizedName = tagName.trim().toLowerCase();

			// Find or create tag
			let tag = await platform!.env.DB.prepare(
				'SELECT * FROM tags WHERE workspace_id = ? AND LOWER(name) = ? AND deleted_at IS NULL'
			)
				.bind(wsId, normalizedName)
				.first();

			if (!tag) {
				// Create new tag
				const newId = `tag_${Date.now()}_${Math.random()}`;
				await platform!.env.DB.prepare(
					`INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
				)
					.bind(newId, wsId, normalizedName, 'accent', now, now)
					.run();

				tagIds.push(newId);
			} else {
				const tagId = (tag as any).id;
				if (tagId) {
					tagIds.push(tagId);
				}
			}
		}

		// Insert into file_tags junction table (ignore if already exists)
		for (const tagId of tagIds) {
			await platform!.env.DB.prepare(
				`INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)`
			)
				.bind(fileId, tagId)
				.run();
		}

		// Update file timestamp
		await platform!.env.DB.prepare('UPDATE files SET updated_at = ? WHERE id = ?')
			.bind(now, fileId)
			.run();

		// Fetch updated file with tags
		const updated = await platform!.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(fileId)
			.first();

		// Fetch associated tags
		const fileTags = await platform!.env.DB.prepare(
			`SELECT t.* FROM tags t
       INNER JOIN file_tags ft ON ft.tag_id = t.id
       WHERE ft.file_id = ? AND t.deleted_at IS NULL`
		)
			.bind(fileId)
			.all();

		const fileWithTags = {
			...snakeToCamel(updated),
			tags: (fileTags.results || []).map((t) => snakeToCamel(t))
		};

		// Invalidate cache
		if (platform?.env?.KV) {
			await platform.env.KV.delete(`workspace:${wsId}:files`);
		}

		return json({ file: fileWithTags });
	} catch (err) {
		console.error('Add tags to file error:', err);
		console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
