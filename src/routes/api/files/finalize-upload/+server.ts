import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { currentWorkspace } from '$lib/stores';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { uploadSessionId, fileName, fileSize, mimeType, workspaceId, folderId, totalChunks } =
			await request.json();

		// Validation
		if (!uploadSessionId || !fileName || !workspaceId || !totalChunks) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!platform?.env?.KV || !platform?.env?.R2 || !platform?.env?.DB) {
			return json({ error: 'Services not available' }, { status: 500 });
		}

		// Verify workspace exists
		const workspace = await platform.env.DB.prepare(
			'SELECT * FROM workspaces WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(workspaceId)
			.first();

		if (!workspace) {
			return json({ error: 'Workspace not found' }, { status: 404 });
		}

		// Verify folder exists (if provided)
		if (folderId) {
			const folder = await platform.env.DB.prepare(
				'SELECT * FROM folders WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL'
			)
				.bind(folderId, workspaceId)
				.first();

			if (!folder) {
				return json({ error: 'Folder not found' }, { status: 404 });
			}
		}

		// Retrieve all chunks from KV
		const chunks: Uint8Array[] = [];
		for (let i = 0; i < totalChunks; i++) {
			const kvKey = `upload:${uploadSessionId}:chunk:${i}`;
			const chunkData = await platform.env.KV.getArrayBuffer(kvKey);

			if (!chunkData) {
				return json({ error: `Missing chunk ${i}` }, { status: 400 });
			}

			chunks.push(new Uint8Array(chunkData));
		}

		// Combine chunks
		const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
		const combined = new Uint8Array(totalSize);
		let offset = 0;

		for (const chunk of chunks) {
			combined.set(chunk, offset);
			offset += chunk.length;
		}

		// Generate file ID and R2 path
		const newId = `file_${Date.now()}`;
		const r2Path = `${workspaceId}/${newId}/${fileName}`;

		// Upload to R2
		await platform.env.R2.put(r2Path, combined, {
			httpMetadata: {
				contentType: mimeType || 'application/octet-stream'
			},
			customMetadata: {
				uploadedAt: new Date().toISOString(),
				originalName: fileName
			}
		});

		console.log(`Uploaded file to R2: ${r2Path} (${totalSize} bytes)`);

		// Create D1 record
		const now = new Date().toISOString();
		const result = await platform.env.DB.prepare(
			`INSERT INTO files 
			 (id, workspace_id, folder_id, name, size, mime_type, storage_path, uploaded_by, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				newId,
				workspaceId,
				folderId || null,
				fileName,
				fileSize,
				mimeType || 'application/octet-stream',
				r2Path,
				'user_session', // TODO: Get from auth context
				now,
				now
			)
			.run();

		console.log(`Created D1 file record: ${newId}`);

		// Clean up KV chunks
		for (let i = 0; i < totalChunks; i++) {
			const kvKey = `upload:${uploadSessionId}:chunk:${i}`;
			await platform.env.KV.delete(kvKey);
		}

		console.log(`Cleaned up ${totalChunks} chunks from KV`);

		// Fetch the created file
		const newFile = await platform.env.DB.prepare('SELECT * FROM files WHERE id = ?')
			.bind(newId)
			.first();

		return json(
			{
				success: true,
				file: newFile,
				r2Path,
				chunks: totalChunks
			},
			{
				status: 201,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			}
		);
	} catch (err) {
		console.error('Finalize upload error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Finalize upload failed' },
			{ status: 500 }
		);
	}
};

export const OPTIONS: RequestHandler = async () => {
	return json(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400'
		}
	});
};
