import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/files/copy - Copy files to a folder
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { fileIds, targetFolderId } = await request.json();

		if (!Array.isArray(fileIds) || fileIds.length === 0) {
			return httpError(400, { message: 'fileIds array is required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			const copies = fileIds.map((id, index) => ({
				id: `file_copy_${Date.now()}_${index}`,
				folderId: targetFolderId,
				name: `Copy of file_${index}`,
				createdAt: new Date().toISOString()
			}));
			return json(
				{
					success: true,
					copiedCount: copies.length,
					copies
				},
				{ status: 201 }
			);
		}

		const now = new Date().toISOString();
		const copies = [];

		// Fetch original files
		const placeholders = fileIds.map(() => '?').join(',');
		const originals = await platform.env.DB.prepare(
			`SELECT * FROM files WHERE id IN (${placeholders})`
		)
			.bind(...fileIds)
			.all();

		// Create copies
		for (const original of originals.results) {
			const newId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const copyName = original.name.includes('Copy of')
				? original.name.replace(/Copy of/, 'Copy (2) of')
				: `Copy of ${original.name}`;

			await platform.env.DB.prepare(
				`INSERT INTO files (id, workspace_id, folder_id, name, mime_type, size, storage_path, uploaded_by, starred, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					newId,
					original.workspace_id,
					targetFolderId || null,
					copyName,
					original.mime_type,
					original.size,
					original.storage_path, // Share storage path
					original.uploaded_by,
					0, // Clear starred
					now,
					now
				)
				.run();

			const newFile = await platform.env.DB.prepare('SELECT * FROM files WHERE id = ?')
				.bind(newId)
				.first();

			copies.push(newFile);
		}

		return json(
			{
				success: true,
				copiedCount: copies.length,
				copies
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Copy files error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
