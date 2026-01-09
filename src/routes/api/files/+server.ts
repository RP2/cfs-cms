import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { snakeToCamel } from '$lib/utils/db';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

// POST /api/files - DEPRECATED: Use /api/files/upload-chunk + /api/files/finalize-upload instead
export const POST: RequestHandler = async ({ request, platform }) => {
	return new Response(
		JSON.stringify({
			error:
				'Use chunked upload endpoints: POST /api/files/upload-chunk and POST /api/files/finalize-upload',
			deprecated: true
		}),
		{
			status: 410, // Gone
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		}
	);
};

// GET /api/files?workspaceId=... - List all files in workspace
export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const workspaceId = url.searchParams.get('workspaceId');

		if (!workspaceId) {
			return new Response(JSON.stringify({ message: 'workspaceId is required' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Mock fallback for static demo
		if (!platform?.env?.DB) {
			return new Response(JSON.stringify({ files: [] }), {
				status: 200,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const result = await platform!.env.DB.prepare(
			'SELECT * FROM files WHERE workspace_id = ? ORDER BY created_at'
		)
			.bind(workspaceId)
			.all();

		return new Response(JSON.stringify({ files: snakeToCamel(result.results || []) }), {
			status: 200,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error('Upload file error:', {
			errorMessage,
			stack: err instanceof Error ? err.stack : undefined
		});
		return new Response(JSON.stringify({ message: errorMessage || 'Internal server error' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
};
