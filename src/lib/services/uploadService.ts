import { toast } from 'svelte-sonner';

const CHUNK_SIZE = 512 * 1024; // 512KB chunks

/**
 * Compress image to WebP format for web
 * Uses browser-image-compression library
 * Only available in browser context
 */
export async function compressImage(file: File): Promise<File> {
	// Check if we're in browser
	if (typeof window === 'undefined') {
		console.warn('Image compression only available in browser context');
		return file;
	}

	try {
		// Dynamically import to reduce initial bundle size and avoid server-side issues
		const imageCompression = await import('browser-image-compression');

		const compressed = await imageCompression.default(file, {
			maxSizeMB: 2,
			maxWidthOrHeight: 2048,
			useWebWorker: true,
			fileType: 'image/webp'
		});

		console.log(
			`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB`
		);

		return compressed;
	} catch (err) {
		console.error('Image compression failed:', err);
		// Return original file if compression fails
		return file;
	}
}

export async function uploadFileInChunks(
	file: File,
	workspaceId: string,
	folderId: string | null,
	onProgress?: (percent: number) => void
): Promise<any> {
	const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
	const uploadSessionId = generateSessionId();

	console.log(`Starting upload: ${file.name} (${totalChunks} chunks)`);

	try {
		// Upload all chunks
		for (let i = 0; i < totalChunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const formData = new FormData();
			formData.append('chunk', chunk);
			formData.append('chunkIndex', String(i));
			formData.append('totalChunks', String(totalChunks));
			formData.append('uploadSessionId', uploadSessionId);
			formData.append('fileName', file.name);
			formData.append('fileType', file.type);
			formData.append('fileSize', String(file.size));
			formData.append('workspaceId', workspaceId);
			formData.append('folderId', folderId || '');

			const response = await fetch('/api/files/upload-chunk', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Upload chunk ${i + 1}/${totalChunks} failed: ${response.statusText}`
				);
			}

			onProgress?.((((i + 1) / totalChunks) * 100) | 0);
		}

		console.log(`All chunks uploaded, finalizing...`);

		// Finalize upload
		const finalResponse = await fetch('/api/files/finalize-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				uploadSessionId,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				workspaceId,
				folderId: folderId || null,
				totalChunks
			})
		});

		if (!finalResponse.ok) {
			const errorData = await finalResponse.json().catch(() => ({}));
			throw new Error(errorData.error || 'Failed to finalize upload');
		}

		const result = await finalResponse.json();
		console.log(`Upload complete: ${file.name}`);

		// Return the file object from the API response
		return result.file;
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Upload failed';
		console.error(`Upload failed: ${message}`);
		throw new Error(message);
	}
}

/**
 * Generate a unique session ID for grouping chunks
 */
function generateSessionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
