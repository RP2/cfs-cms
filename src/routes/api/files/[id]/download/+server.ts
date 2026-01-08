import { error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Max-Age': '86400'
};

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS
	});
};

// GET /api/files/:id/download - Download file from R2
export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const fileId = params.id;

		if (!platform?.env?.DB || !platform?.env?.R2) {
			return new Response(JSON.stringify({ message: 'Database or R2 not available' }), {
				status: 503,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Get file metadata from D1
		const file = await platform.env.DB.prepare(
			'SELECT * FROM files WHERE id = ? AND deleted_at IS NULL'
		)
			.bind(fileId)
			.first();

		if (!file) {
			return new Response(JSON.stringify({ message: 'File not found' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Get file from R2
		const r2Object = await platform.env.R2.get(file.storage_path);

		if (!r2Object) {
			return new Response(JSON.stringify({ message: 'File not found in storage' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Return file with proper headers
		return new Response(r2Object.body, {
			status: 200,
			headers: {
				...CORS_HEADERS,
				'Content-Type': file.mime_type || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${file.name}"`,
				'Content-Length': file.size.toString()
			}
		});
	} catch (err) {
		console.error('Download error:', err);
		return new Response(
			JSON.stringify({
				message: 'Internal server error',
				error: err instanceof Error ? err.message : String(err)
			}),
			{
				status: 500,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			}
		);
	}
};
