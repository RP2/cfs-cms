import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;

		// Verify tag exists
		const tag = await platform!.env.DB.prepare(
			'SELECT * FROM tags WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(id)
			.first();

		if (!tag) {
			return json({ error: 'Tag not found', code: 'TAG_NOT_FOUND' }, { status: 404 });
		}

		const t = tag as any;
		const now = new Date().toISOString();

		// Soft delete tag
		await platform!.env.DB.prepare('UPDATE tags SET deleted_at = ?, updated_at = ? WHERE id = ?')
			.bind(now, now, id)
			.run();

		// Remove tag from all files in this workspace
		await platform!.env.DB.prepare(
			`UPDATE files SET updated_at = ? 
       WHERE workspace_id = ? AND json_extract(tag_ids, '$[*]') LIKE ?`
		)
			.bind(now, t.workspace_id, `%"${id}"%`)
			.run();

		// Invalidate cache
		await platform!.env.KV.delete(`workspace:${t.workspace_id}:tags`);

		return json({ success: true, message: 'Tag deleted', tagId: id });
	} catch (err) {
		console.error('Delete tag error:', err);
		return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
	}
};
