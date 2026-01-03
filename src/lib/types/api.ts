// API Request/Response Types for CFS CMS Backend

import type { Workspace, Folder, File, Tag } from './index';

// ==================== Generic API Response ====================
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	code?: string;
}

export interface ApiError {
	error: string;
	code: string;
	statusCode: number;
}

// ==================== Workspace ====================
export interface CreateWorkspaceRequest {
	name: string;
	description?: string;
	icon?: string;
}

export interface DeleteWorkspaceResponse {
	success: boolean;
	message: string;
}

// ==================== Folder ====================
export interface CreateFolderRequest {
	workspaceId: string;
	parentId: string | null;
	name: string;
}

export interface UpdateFolderRequest {
	name?: string;
	parentId?: string | null;
	starred?: boolean;
}

export interface DeleteFolderResponse {
	success: boolean;
	deletedAt: string;
	trashedUntil: string;
}

export interface MoveFolderRequest {
	targetParentId: string | null;
	targetWorkspaceId?: string;
}

export interface CopyFoldersRequest {
	folderIds: string[];
	targetFolderId: string | null;
}

export interface CopyFoldersResponse {
	success: boolean;
	copiedCount: number;
	foldersCreated: number;
	filesCreated: number;
	copies: Folder[];
}

// ==================== File ====================
export interface UpdateFileRequest {
	name?: string;
	folderId?: string | null;
	starred?: boolean;
	tagIds?: string[];
}

export interface DeleteFileResponse {
	success: boolean;
	deletedAt: string;
	trashedUntil: string;
}

export interface PermanentlyDeleteFileResponse {
	success: boolean;
	remainingCopies: number;
	r2Deleted: boolean;
	message: string;
}

export interface BulkDeleteRequest {
	fileIds: string[];
}

export interface BulkDeleteResponse {
	success: boolean;
	deletedCount: number;
	trashedUntil: string;
}

export interface MoveFilesRequest {
	fileIds: string[];
	targetFolderId?: string | null;
	targetWorkspaceId?: string;
}

export interface MoveFilesResponse {
	success: boolean;
	movedCount: number;
	files: File[];
}

export interface CopyFilesRequest {
	fileIds: string[];
	targetFolderId?: string | null;
	targetWorkspaceId?: string;
}

export interface CopyFilesResponse {
	success: boolean;
	copiedCount: number;
	copies: File[];
}

// ==================== Tag ====================
export interface UpsertTagRequest {
	workspaceId: string;
	name: string;
	color?: string;
}

export interface AddTagsToFileRequest {
	tagNames: string[];
	color?: string;
}

export interface AddTagsResponse {
	file: File;
	tags: Tag[];
}

export interface RemoveTagResponse {
	success: boolean;
	filesRemoved: number;
}

// ==================== Trash ====================
export interface TrashItem {
	id: string;
	name: string;
	deletedAt: string;
	trashedUntil: string;
	type: 'file' | 'folder';
}

export interface TrashListResponse {
	files: TrashItem[];
	folders: TrashItem[];
	total: number;
}

export interface EmptyTrashResponse {
	success: boolean;
	purgedFiles: number;
	purgedFolders: number;
	r2FilesPurged: number;
	totalFreed: string;
}

// ==================== Search ====================
export interface SearchResult {
	id: string;
	name: string;
	type: 'file' | 'folder';
	folderId: string | null;
	workspaceId: string;
	score: number;
}

export interface SearchResponse {
	results: SearchResult[];
	total: number;
	query: string;
}
