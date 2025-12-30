import {
	workspaces,
	workspaceFolders,
	workspaceTags,
	currentFiles,
	currentWorkspace,
	currentFolder
} from '$lib/stores';
import type { Workspace, Folder, File, Tag } from '$lib/types';
import { get } from 'svelte/store';

const TRASH_RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeTagName(name: string): string {
	return name.trim().toLowerCase();
}

function computeTrashedUntil(deletedAt: Date): Date {
	return new Date(deletedAt.getTime() + TRASH_RETENTION_DAYS * MS_PER_DAY);
}

/**
 * Data Service Layer
 *
 * Abstracts all data operations. Currently uses in-memory stores (mock data).
 * When Cloudflare backend is ready, replace these functions with API calls.
 *
 * Example future implementation:
 *   const response = await fetch('/api/workspaces', {
 *     method: 'POST',
 *     body: JSON.stringify({ name, description })
 *   });
 *   return response.json();
 */

// ==================== WORKSPACE OPERATIONS ====================

/**
 * Create a new workspace
 * TODO: Replace with Cloudflare backend call when ready
 */
export function createWorkspace(name: string, description: string): Workspace {
	const newWorkspace: Workspace = {
		id: `workspace_${Date.now()}`,
		name: name.trim(),
		description: description.trim(),
		ownerId: 'user_1', // Placeholder until auth is implemented
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null
	};

	// Add to store
	const currentWorkspaces = get(workspaces);
	workspaces.set([...currentWorkspaces, newWorkspace]);
	currentWorkspace.set(newWorkspace);

	return newWorkspace;
}

export function deleteWorkspace(workspaceId: string): void {
	const currentWorkspacesList = get(workspaces);
	const workspace = currentWorkspacesList.find((w) => w.id === workspaceId);

	if (!workspace) return;

	// Check if workspace is empty (no non-deleted folders or files)
	const currentFoldersList = get(workspaceFolders);
	const currentFilesList = get(currentFiles);

	const hasFolders = currentFoldersList.some((f) => f.workspaceId === workspaceId && !f.deletedAt);
	const hasFiles = currentFilesList.some((f) => f.workspaceId === workspaceId && !f.deletedAt);

	if (hasFolders || hasFiles) {
		throw new Error(
			'Cannot delete workspace with content. Please delete or move all files and folders first.'
		);
	}

	// TODO: Replace with Cloudflare backend call (DELETE /api/workspaces/:id)
	// Backend should handle permanent deletion

	// Permanently delete workspace (remove from array)
	const updatedWorkspaces = currentWorkspacesList.filter((w) => w.id !== workspaceId);
	workspaces.set(updatedWorkspaces);

	// If we just deleted the current workspace, switch to another
	const currentWs = get(currentWorkspace);
	if (currentWs?.id === workspaceId) {
		const nextWorkspace = updatedWorkspaces[0] || null;
		currentWorkspace.set(nextWorkspace);
		currentFolder.set(null);
	}
}

export function createFolder(parentId: string | null, name: string): Folder {
	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	// Check if folder name already exists at this level
	const currentFoldersList = get(workspaceFolders);
	const exists = currentFoldersList.some(
		(f) => f.workspaceId === currentWs.id && f.parentId === parentId && f.name === name.trim()
	);

	if (exists) throw new Error('A folder with this name already exists');

	const newFolder: Folder = {
		id: `folder_${Date.now()}`,
		workspaceId: currentWs.id,
		parentId,
		name: name.trim(),
		starred: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
		trashedUntil: null
	};

	// Add to store
	currentFoldersList.push(newFolder);
	workspaceFolders.set([...currentFoldersList]);

	return newFolder;
}

export function renameFolder(folderId: string, newName: string): void {
	if (!newName.trim()) throw new Error('Name is required');

	const currentFoldersList = get(workspaceFolders);
	const folder = currentFoldersList.find((f) => f.id === folderId);

	if (!folder) return;
	if (newName === folder.name) return;

	folder.name = newName.trim();
	folder.updatedAt = new Date();

	workspaceFolders.set([...currentFoldersList]);
}

export function deleteFolder(folderId: string): void {
	const currentFoldersList = get(workspaceFolders);
	const folder = currentFoldersList.find((f) => f.id === folderId);

	if (!folder) return;

	// Soft delete folder
	const deletedAt = new Date();
	folder.deletedAt = deletedAt;
	folder.updatedAt = deletedAt;
	folder.trashedUntil = computeTrashedUntil(deletedAt);

	// Also soft delete all files in this folder
	const currentFilesList = get(currentFiles);
	currentFilesList.forEach((file) => {
		if (file.folderId === folderId) {
			file.deletedAt = deletedAt;
			file.trashedUntil = computeTrashedUntil(deletedAt);
			file.updatedAt = deletedAt;
		}
	});

	workspaceFolders.set([...currentFoldersList]);
	currentFiles.set([...currentFilesList]);
}

// ==================== FILE OPERATIONS ====================

export function renameFile(fileId: string, newName: string): void {
	if (!newName.trim()) throw new Error('Name is required');

	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;
	if (newName === file.name) return;

	file.name = newName.trim();
	file.updatedAt = new Date();

	currentFiles.set([...currentFilesList]);
}

export function setFileTags(fileId: string, tagIds: string[]): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	file.tagIds = [...new Set(tagIds)];
	file.updatedAt = new Date();

	currentFiles.set([...currentFilesList]);
}

export function deleteFile(fileId: string): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	// Soft delete file
	file.deletedAt = new Date();
	file.trashedUntil = computeTrashedUntil(file.deletedAt);
	file.updatedAt = file.deletedAt;

	currentFiles.set([...currentFilesList]);
}

export function uploadFiles(files: FileList): void {
	const currentWs = get(currentWorkspace);
	const currentFolder_ = get(currentFolder);

	if (!currentWs || !currentFolder_) return;

	const currentFilesList = get(currentFiles);

	// Add mock files to store
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const newFile: File = {
			id: `file_${Date.now()}_${i}`,
			workspaceId: currentWs.id,
			folderId: currentFolder_.id,
			name: file.name,
			size: file.size,
			mimeType: file.type || 'application/octet-stream',
			storagePath: URL.createObjectURL(file), // Mock storage path
			uploadedBy: 'user_1',
			starred: false,
			tagIds: [],
			trashedUntil: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};
		currentFilesList.push(newFile);
	}

	currentFiles.set([...currentFilesList]);
}

// ==================== STAR/UNSTAR OPERATIONS ====================

export function toggleFileStar(fileId: string): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	file.starred = !file.starred;
	file.updatedAt = new Date();

	currentFiles.set([...currentFilesList]);
}

export function toggleFolderStar(folderId: string): void {
	const currentFoldersList = get(workspaceFolders);
	const folder = currentFoldersList.find((f) => f.id === folderId);

	if (!folder) return;

	folder.starred = !folder.starred;
	folder.updatedAt = new Date();

	workspaceFolders.set([...currentFoldersList]);
}

// ==================== TRASH OPERATIONS ====================

export function restoreFile(fileId: string): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	file.deletedAt = null;
	file.trashedUntil = null;
	file.updatedAt = new Date();

	currentFiles.set([...currentFilesList]);
}

// ==================== TAG OPERATIONS ====================

export function upsertTag(workspaceId: string, name: string, color = 'accent'): Tag {
	const normalized = normalizeTagName(name);
	if (!normalized) throw new Error('Tag name is required');

	const currentTags = get(workspaceTags);
	const existing = currentTags.find((t) => normalizeTagName(t.name) === normalized);

	if (existing) {
		if (existing.deletedAt) {
			const revived = { ...existing, deletedAt: null, updatedAt: new Date() };
			workspaceTags.set(currentTags.map((t) => (t.id === existing.id ? revived : t)));
			return revived;
		}
		return existing;
	}

	const now = new Date();
	const newTag: Tag = {
		id: `tag_${Date.now()}`,
		workspaceId,
		name: name.trim(),
		color,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};

	workspaceTags.set([...currentTags, newTag]);
	return newTag;
}

export function removeTagFromWorkspace(tagId: string): void {
	const tags = get(workspaceTags);
	const tag = tags.find((t) => t.id === tagId);
	if (!tag) return;

	const updatedTags = tags.map((t) => (t.id === tagId ? { ...t, deletedAt: new Date() } : t));
	workspaceTags.set(updatedTags);

	const files = get(currentFiles).map((f) => {
		if (!f.tagIds?.includes(tagId)) return f;
		return { ...f, tagIds: f.tagIds.filter((id) => id !== tagId), updatedAt: new Date() };
	});
	currentFiles.set(files);
}

export function addTagsToFile(
	fileId: string,
	workspaceId: string,
	names: string[],
	opts?: { color?: string }
): { tags: Tag[]; file?: File } {
	const files = get(currentFiles);
	const targetIndex = files.findIndex((f) => f.id === fileId);
	if (targetIndex === -1) {
		return { tags: [] };
	}

	const createdOrFoundTags = names
		.map((n) => upsertTag(workspaceId, n, opts?.color))
		.filter(Boolean) as Tag[];

	const existingTagIds = files[targetIndex].tagIds || [];
	const mergedTagIds = Array.from(
		new Set([...existingTagIds, ...createdOrFoundTags.map((t) => t.id)])
	);

	files[targetIndex] = {
		...files[targetIndex],
		tagIds: mergedTagIds,
		updatedAt: new Date()
	};

	currentFiles.set([...files]);
	return { tags: createdOrFoundTags, file: files[targetIndex] };
}

export function replaceFileTags(
	fileId: string,
	workspaceId: string,
	tagNames: string[],
	opts?: { color?: string }
): { tags: Tag[]; file?: File } {
	const normalizedNames = tagNames
		.map((n) => n.trim())
		.filter(Boolean)
		.map((n) => normalizeTagName(n));

	// Deduplicate incoming names by normalized value
	const uniqueNormalized = Array.from(new Set(normalizedNames));

	// Map back to the original names with the first-seen casing
	const nameByNormalized = new Map<string, string>();
	for (const rawName of tagNames.map((n) => n.trim()).filter(Boolean)) {
		const norm = normalizeTagName(rawName);
		if (norm && !nameByNormalized.has(norm)) {
			nameByNormalized.set(norm, rawName);
		}
	}

	const resolvedTags = uniqueNormalized
		.map((norm) => {
			const displayName = nameByNormalized.get(norm) ?? norm;
			return upsertTag(workspaceId, displayName, opts?.color);
		})
		.filter(Boolean) as Tag[];

	setFileTags(
		fileId,
		resolvedTags.map((t) => t.id)
	);
	return { tags: resolvedTags, file: get(currentFiles).find((f) => f.id === fileId) };
}

export function restoreFolder(folderId: string): void {
	const currentFoldersList = get(workspaceFolders);
	const folder = currentFoldersList.find((f) => f.id === folderId);

	if (!folder) return;

	folder.deletedAt = null;
	folder.trashedUntil = null;
	folder.updatedAt = new Date();

	const currentFilesList = get(currentFiles);
	currentFilesList.forEach((file) => {
		if (file.folderId === folderId) {
			file.deletedAt = null;
			file.trashedUntil = null;
			file.updatedAt = new Date();
		}
	});

	currentFiles.set([...currentFilesList]);

	workspaceFolders.set([...currentFoldersList]);
}

export function permanentlyDeleteFile(fileId: string): void {
	// TODO: Replace with Cloudflare backend call (DELETE /api/files/:id?permanent=true)
	// Backend should delete from R2 storage and D1 database

	const currentFilesList = get(currentFiles);
	const filtered = currentFilesList.filter((f) => f.id !== fileId);

	currentFiles.set(filtered);
}

export function permanentlyDeleteFolder(folderId: string): void {
	// TODO: Replace with Cloudflare backend call (DELETE /api/folders/:id?permanent=true)
	// Backend should cascade delete all files and subfolders

	const currentFoldersList = get(workspaceFolders);
	const currentFilesList = get(currentFiles);

	// Remove folder
	const filteredFolders = currentFoldersList.filter((f) => f.id !== folderId);

	// Also remove all files in this folder
	const filteredFiles = currentFilesList.filter((f) => f.folderId !== folderId);

	workspaceFolders.set(filteredFolders);
	currentFiles.set(filteredFiles);
}
