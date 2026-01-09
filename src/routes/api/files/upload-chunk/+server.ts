import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max
const CHUNK_EXPIRY = 3600; // 1 hour in seconds

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const formData = await request.formData();

		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = Number(formData.get('chunkIndex'));
		const totalChunks = Number(formData.get('totalChunks'));
		const uploadSessionId = formData.get('uploadSessionId') as string;
		const fileName = formData.get('fileName') as string;
		const fileSize = Number(formData.get('fileSize'));
		const workspaceId = formData.get('workspaceId') as string;

		// Validation
		if (!chunk || !uploadSessionId || !fileName || !workspaceId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (chunkIndex < 0 || chunkIndex >= totalChunks || isNaN(totalChunks)) {
			return json({ error: 'Invalid chunk index or total' }, { status: 400 });
		}

		if (fileSize > MAX_FILE_SIZE) {
			return json(
				{ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
				{ status: 413 }
			);
		}

		// Store chunk in KV with session prefix
		if (!platform?.env?.KV) {
			return json({ error: 'KV not available' }, { status: 500 });
		}

		const chunkBuffer = await chunk.arrayBuffer();
		const kvKey = `upload:${uploadSessionId}:chunk:${chunkIndex}`;

		await platform.env.KV.put(kvKey, chunkBuffer, {
			expirationTtl: CHUNK_EXPIRY
		});

		console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for session ${uploadSessionId}`);

		return json(
			{
				received: chunkIndex,
				total: totalChunks,
				sessionId: uploadSessionId
			},
			{
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			}
		);
	} catch (err) {
		console.error('Upload chunk error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Upload chunk failed' },
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
