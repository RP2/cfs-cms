import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// POST /api/folders/copy - Copy folders with all nested files
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { folderIds, targetFolderId } = await request.json();

		if (!Array.isArray(folderIds) || folderIds.length === 0) {
			return httpError(400, { message: 'folderIds array is required' });
		}

		if (!platform?.env?.DB) {
			// Mock fallback for local dev
			const copies = folderIds.map((id, index) => ({
				id: `folder_copy_${Date.now()}_${index}`,
				parentId: targetFolderId,
				name: `Copy of folder_${index}`,
				createdAt: new Date().toISOString()
			}));
			return json(
				{
					success: true,
					copiedCount: copies.length,
					foldersCreated: copies.length,
					filesCreated: 0,
					copies
				},
				{ status: 201 }
			);
		}

		const now = new Date().toISOString();
		const copies = [];
		let totalFilesCreated = 0;

		// Recursive function to copy a folder and its contents
		async function copyFolderRecursive(
			originalFolderId: string,
			newParentId: string | null,
			workspaceId: string
		): Promise<any> {
			// Fetch original folder
			const original = await platform!.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
				.bind(originalFolderId)
				.first();

			if (!original) return null;

			// Create new folder
			const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const copyName = original.name.includes('Copy of')
				? original.name.replace(/Copy of/, 'Copy (2) of')
				: `Copy of ${original.name}`;

			await platform!.env.DB.prepare(
				`INSERT INTO folders (id, workspace_id, parent_id, name, icon, starred, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(newFolderId, workspaceId, newParentId, copyName, original.icon || null, 0, now, now)
				.run();

			const newFolder = await platform!.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
				.bind(newFolderId)
				.first();

			// Copy all files in this folder
			const files = await platform!.env.DB.prepare(
				'SELECT * FROM files WHERE folder_id = ? AND deleted_at IS NULL'
			)
				.bind(originalFolderId)
				.all();

			for (const file of files.results) {
				const newFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				const fileCopyName = file.name.includes('Copy of')
					? file.name.replace(/Copy of/, 'Copy (2) of')
					: `Copy of ${file.name}`;

				await platform!.env.DB.prepare(
					`INSERT INTO files (id, workspace_id, folder_id, name, mime_type, size, storage_path, uploaded_by, starred, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
					.bind(
						newFileId,
						workspaceId,
						newFolderId,
						fileCopyName,
						file.mime_type,
						file.size,
						file.storage_path, // Share storage path
						file.uploaded_by,
						0,
						now,
						now
					)
					.run();

				totalFilesCreated++;
			}

			// Recursively copy subfolders
			const subfolders = await platform!.env.DB.prepare(
				'SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL'
			)
				.bind(originalFolderId)
				.all();

			for (const subfolder of subfolders.results) {
				await copyFolderRecursive(subfolder.id, newFolderId, workspaceId);
			}

			return newFolder;
		}

		// Copy each folder
		for (const folderId of folderIds) {
			const original = await platform.env.DB.prepare('SELECT * FROM folders WHERE id = ?')
				.bind(folderId)
				.first();

			if (original) {
				const copy = await copyFolderRecursive(
					folderId,
					targetFolderId || null,
					original.workspace_id
				);
				if (copy) copies.push(copy);
			}
		}

		return json(
			{
				success: true,
				copiedCount: copies.length,
				foldersCreated: copies.length,
				filesCreated: totalFilesCreated,
				copies
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Copy folders error:', err);
		return httpError(500, { message: 'Internal server error' });
	}
};
