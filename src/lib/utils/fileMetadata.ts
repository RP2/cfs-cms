// File metadata extraction and type detection utilities

import type { File } from '$lib/types';

export type FileCategory =
	| 'image'
	| 'video'
	| 'audio'
	| 'pdf'
	| 'text'
	| 'code'
	| 'archive'
	| 'office'
	| 'unknown';
export type PreviewType = 'image' | 'media' | 'text' | 'generic';

export interface FileMetadata {
	category: FileCategory;
	previewType: PreviewType;
	extension: string;
	isPreviewable: boolean;
	isMutable: boolean; // Can file be renamed, moved, etc.
	isTrashed: boolean;
	hasExpiryWarning: boolean;
}

export interface MetadataDetails {
	dimensions?: { width: number; height: number };
	duration?: number; // seconds
	encoding?: string;
	lineCount?: number;
	pageCount?: number;
	containedItems?: number;
	colorProfile?: string;
	bitrate?: string;
	[key: string]: any;
}

const IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'image/avif'
];
const VIDEO_TYPES = [
	'video/mp4',
	'video/webm',
	'video/quicktime',
	'video/x-msvideo',
	'video/x-matroska'
];
const AUDIO_TYPES = [
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/webm',
	'audio/aac',
	'audio/flac'
];
const PDF_TYPES = ['application/pdf'];
const TEXT_TYPES = [
	'text/plain',
	'text/markdown',
	'text/html',
	'application/json',
	'application/xml'
];
const CODE_TYPES = [
	'text/x-python',
	'text/x-javascript',
	'text/x-typescript',
	'text/x-java',
	'text/x-cpp',
	'text/x-csharp',
	'text/x-golang',
	'text/x-rust',
	'text/x-ruby',
	'text/x-php',
	'text/x-swift',
	'text/x-kotlin'
];
const ARCHIVE_TYPES = [
	'application/zip',
	'application/x-rar-compressed',
	'application/x-7z-compressed',
	'application/gzip',
	'application/x-tar',
	'application/x-bzip2'
];
const OFFICE_TYPES = [
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/msword',
	'application/vnd.ms-excel',
	'application/vnd.ms-powerpoint'
];

/**
 * Determine file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
	if (IMAGE_TYPES.includes(mimeType)) return 'image';
	if (VIDEO_TYPES.includes(mimeType)) return 'video';
	if (AUDIO_TYPES.includes(mimeType)) return 'audio';
	if (PDF_TYPES.includes(mimeType)) return 'pdf';
	if (TEXT_TYPES.includes(mimeType)) return 'text';
	if (CODE_TYPES.includes(mimeType)) return 'code';
	if (ARCHIVE_TYPES.includes(mimeType)) return 'archive';
	if (OFFICE_TYPES.includes(mimeType)) return 'office';
	return 'unknown';
}

/**
 * Map category to preview type (4 core preview components)
 */
export function getPreviewType(category: FileCategory): PreviewType {
	switch (category) {
		case 'image':
			return 'image';
		case 'video':
		case 'audio':
			return 'media';
		case 'text':
		case 'code':
			return 'text';
		case 'pdf':
		case 'archive':
		case 'office':
		case 'unknown':
		default:
			return 'generic';
	}
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
}

/**
 * Determine if file type has a previewable component
 */
export function isPreviewable(category: FileCategory): boolean {
	return ['image', 'video', 'text', 'code'].includes(category);
}

/**
 * Build complete metadata for a file
 */
export function buildFileMetadata(file: File): FileMetadata {
	const category = getFileCategory(file.mimeType);
	const extension = getFileExtension(file.name);
	const previewType = getPreviewType(category);
	const isTrashed = file.deletedAt !== null;
	const hasExpiryWarning =
		isTrashed && file.trashedUntil
			? new Date(file.trashedUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			: false;

	return {
		category,
		previewType,
		extension,
		isPreviewable: isPreviewable(category),
		isMutable: !isTrashed,
		isTrashed,
		hasExpiryWarning
	};
}

/**
 * Get icon name for file category (lucide-svelte)
 */
export function getFileIcon(category: FileCategory): string {
	const iconMap: Record<FileCategory, string> = {
		image: 'FileImage',
		video: 'FileVideoCamera',
		audio: 'FileAudio',
		pdf: 'FileText',
		text: 'FileText',
		code: 'FileText',
		archive: 'Archive',
		office: 'FileText',
		unknown: 'File'
	};
	return iconMap[category];
}

/**
 * Format metadata details for display based on file category
 * Phase 1: Returns empty object. Phase 2+: Extract from file properties.
 */
export function extractMetadataDetails(file: File, _category: FileCategory): MetadataDetails {
	// Phase 1: No detailed metadata extraction
	// Phase 2+: Parse file properties from storage or EXIF data
	return {};
}

/**
 * Get expiry countdown text
 */
export function getExpiryCountdown(trashedUntil: Date | null): string {
	if (!trashedUntil) return '';

	const now = new Date();
	const expiryDate = new Date(trashedUntil);
	const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	if (daysRemaining <= 0) return 'Expiring today';
	if (daysRemaining === 1) return 'Expires tomorrow';
	if (daysRemaining <= 7) return `Expires in ${daysRemaining} days`;
	return `Expires ${expiryDate.toLocaleDateString()}`;
}
