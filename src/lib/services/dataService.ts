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

/**
 * IMPORTANT: Timestamp Handling
 *
 * JavaScript Date objects store time in UTC internally (milliseconds since Unix epoch).
 * However, when serialized to JSON, they use the local timezone.
 *
 * For Phase 2+ (Cloudflare D1 backend):
 * - D1 stores timestamps as TEXT in ISO 8601 format (YYYY-MM-DD HH:MM:SS.SSS)
 * - ALWAYS use .toISOString() when sending to backend
 * - ALWAYS store in UTC to avoid timezone bugs
 * - Display in user's local timezone in the UI
 *
 * Current Phase 1 (mock data):
 * - Date objects are fine since they're in-memory
 * - Still stored in UTC internally (Date.now() is always UTC)
 * - No timezone issues as long as we don't serialize/deserialize
 *
 * Phase 2 Migration:
 * Replace: createdAt: new Date()
 * With: createdAt: new Date() // Backend will use .toISOString() when sending to D1
 */

/**
 * Helper for Phase 2: Convert Date to ISO string for D1 storage
 * Use this when sending timestamps to Cloudflare backend
 */
function toUTC(date: Date): string {
	return date.toISOString();
}

function getDescendantFolderIds(allFolders: Folder[], folderId: string): Set<string> {
	const descendants = new Set<string>();
	const stack = [folderId];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		const children = allFolders.filter((f) => f.parentId === current).map((f) => f.id);
		for (const childId of children) {
			if (!descendants.has(childId)) {
				descendants.add(childId);
				stack.push(childId);
			}
		}
	}

	return descendants;
}

function normalizeTagName(name: string): string {
	return name.trim().toLowerCase();
}

/**
 * Create a UTC timestamp to avoid timezone issues
 * Cloudflare D1 stores timestamps in UTC, so we should too
 */
function utcNow(): Date {
	return new Date(Date.now());
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
	file.updatedAt = utcNow();

	currentFiles.set([...currentFilesList]);
}

export function deleteFile(fileId: string): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	// Soft delete file
	file.deletedAt = utcNow();
	file.trashedUntil = computeTrashedUntil(file.deletedAt);
	file.updatedAt = file.deletedAt;

	currentFiles.set([...currentFilesList]);
}

export function deleteFiles(fileIds: string[]): void {
	if (fileIds.length === 0) return;

	const currentFilesList = get(currentFiles);
	const now = utcNow();
	const idSet = new Set(fileIds);

	currentFilesList.forEach((file) => {
		if (!idSet.has(file.id)) return;
		file.deletedAt = now;
		file.trashedUntil = computeTrashedUntil(now);
		file.updatedAt = now;
	});

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

// ==================== MOVE OPERATIONS ====================

export function moveFilesToFolder(
	fileIds: string[],
	targetFolderId: string | null,
	opts?: { targetWorkspaceId?: string }
): void {
	if (fileIds.length === 0) return;

	const folders = get(workspaceFolders);
	const files = get(currentFiles);
	const targetFolder = targetFolderId
		? folders.find((f) => f.id === targetFolderId && !f.deletedAt)
		: null;

	const targetWorkspaceId = targetFolder
		? targetFolder.workspaceId
		: (opts?.targetWorkspaceId ?? get(currentWorkspace)?.id);

	if (!targetWorkspaceId) {
		throw new Error('A target workspace is required to move files.');
	}

	if (targetFolder && targetFolder.workspaceId !== targetWorkspaceId) {
		throw new Error('Target folder is not in the specified workspace.');
	}

	const now = new Date();
	const idSet = new Set(fileIds);

	files.forEach((file) => {
		if (!idSet.has(file.id)) return;
		file.workspaceId = targetWorkspaceId;
		file.folderId = targetFolderId;
		file.updatedAt = now;
	});

	currentFiles.set([...files]);
}

export function moveFilesToWorkspace(
	fileIds: string[],
	targetWorkspaceId: string,
	targetFolderId: string | null = null
): void {
	const targetWorkspace = get(workspaces).find((w) => w.id === targetWorkspaceId && !w.deletedAt);
	if (!targetWorkspace) {
		throw new Error('Target workspace not found.');
	}

	if (targetFolderId) {
		const folders = get(workspaceFolders);
		const targetFolder = folders.find(
			(f) => f.id === targetFolderId && f.workspaceId === targetWorkspaceId && !f.deletedAt
		);
		if (!targetFolder) {
			throw new Error('Target folder is not available in the destination workspace.');
		}
	}

	moveFilesToFolder(fileIds, targetFolderId, { targetWorkspaceId });
}

export function moveFolder(folderId: string, targetParentId: string | null): void {
	const folders = get(workspaceFolders);
	const folder = folders.find((f) => f.id === folderId && !f.deletedAt);
	if (!folder) return;

	const targetParent = targetParentId
		? folders.find((f) => f.id === targetParentId && !f.deletedAt)
		: null;

	if (targetParent && targetParent.workspaceId !== folder.workspaceId) {
		throw new Error('Cannot move folder into a different workspace without confirmation.');
	}

	const descendants = getDescendantFolderIds(folders, folderId);
	if (targetParentId && descendants.has(targetParentId)) {
		throw new Error('Cannot move a folder into its own descendant.');
	}

	folder.parentId = targetParentId;
	folder.updatedAt = new Date();
	workspaceFolders.set([...folders]);
}

export function moveFolderToWorkspace(
	folderId: string,
	targetWorkspaceId: string,
	targetParentId: string | null = null
): void {
	const folders = get(workspaceFolders);
	const files = get(currentFiles);
	const folder = folders.find((f) => f.id === folderId && !f.deletedAt);
	if (!folder) return;

	const targetWorkspace = get(workspaces).find((w) => w.id === targetWorkspaceId && !w.deletedAt);
	if (!targetWorkspace) {
		throw new Error('Target workspace not found.');
	}

	const targetParent = targetParentId
		? folders.find(
				(f) => f.id === targetParentId && f.workspaceId === targetWorkspaceId && !f.deletedAt
			)
		: null;

	const descendants = getDescendantFolderIds(folders, folderId);
	if (targetParentId && descendants.has(targetParentId)) {
		throw new Error('Cannot move a folder into its own descendant.');
	}

	const allAffectedFolderIds = new Set([folderId, ...Array.from(descendants)]);
	const now = new Date();

	folders.forEach((f) => {
		if (!allAffectedFolderIds.has(f.id)) return;
		f.workspaceId = targetWorkspaceId;
		// Preserve hierarchy; only the root moved folder changes parent if specified
		if (f.id === folderId) {
			f.parentId = targetParentId;
		}
		f.updatedAt = now;
	});

	files.forEach((file) => {
		const folderId = file.folderId;
		if (!folderId || !allAffectedFolderIds.has(folderId)) return;
		file.workspaceId = targetWorkspaceId;
		file.updatedAt = now;
	});

	workspaceFolders.set([...folders]);
	currentFiles.set([...files]);
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

export function addTagsToFiles(
	fileIds: string[],
	workspaceId: string,
	names: string[],
	opts?: { color?: string }
): { tags: Tag[]; updatedFiles: File[] } {
	if (fileIds.length === 0) return { tags: [], updatedFiles: [] };

	const files = get(currentFiles);
	const idSet = new Set(fileIds);

	const normalizedNames = names
		.map((n) => n.trim())
		.filter(Boolean)
		.map((n) => normalizeTagName(n));

	const uniqueNormalized = Array.from(new Set(normalizedNames));
	const nameByNormalized = new Map<string, string>();
	for (const rawName of names.map((n) => n.trim()).filter(Boolean)) {
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

	const newTagIds = resolvedTags.map((t) => t.id);
	const now = new Date();

	const updatedFiles = files.map((file) => {
		if (!idSet.has(file.id)) return file;
		const merged = Array.from(new Set([...(file.tagIds || []), ...newTagIds]));
		return { ...file, tagIds: merged, updatedAt: now };
	});

	currentFiles.set(updatedFiles);
	return { tags: resolvedTags, updatedFiles: updatedFiles.filter((f) => idSet.has(f.id)) };
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

/**
 * Get the count of file copies that share the same storage path
 * Used to determine if R2 file can be safely deleted
 */
export function getFileCopyCount(fileId: string): number {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return 0;

	// Count all files with same storagePath (including this one)
	return currentFilesList.filter((f) => f.storagePath === file.storagePath).length;
}

/**
 * Permanently delete a file from the system
 * Returns the count of remaining copies that share the same storagePath
 * @returns Number of remaining copies (for UI feedback)
 */
export function permanentlyDeleteFile(fileId: string): number {
	// TODO: Replace with Cloudflare backend call (DELETE /api/files/:id?permanent=true)
	// Backend MUST implement reference counting before deleting R2 files:
	// 1. Delete the file record from D1
	// 2. Check if any other file records reference the same storagePath
	// 3. Only delete from R2 if refcount = 0 (no other copies exist)
	// This prevents deleting R2 files that still have active copies

	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	// Count remaining copies BEFORE deleting this one
	const totalCopies = file ? getFileCopyCount(fileId) : 0;
	const remainingCopies = totalCopies - 1;

	// Remove this file record from UI
	const filtered = currentFilesList.filter((f) => f.id !== fileId);
	currentFiles.set(filtered);

	// Return count for UI feedback
	return remainingCopies;
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

// ==================== COPY/PASTE OPERATIONS ====================

/**
 * Copy files to target folder in current workspace
 * Creates new file records pointing to same R2 storage (no duplication)
 *
 * IMPORTANT: Copies are COMPLETELY INDEPENDENT from originals:
 * - New unique ID (separate database row)
 * - Always starts as NOT deleted (deletedAt: null)
 * - Always starts as NOT starred (starred: false)
 * - Only shares storagePath (R2 file reference)
 * - Original can be deleted without affecting copies
 * - Copies can be deleted without affecting original
 */
export function copyFilesToFolder(fileIds: string[], targetFolderId: string | null): File[] {
	const currentFilesList = get(currentFiles);
	const workspace = get(currentWorkspace);

	if (!workspace) throw new Error('No workspace selected');

	const copied: File[] = [];

	for (const fileId of fileIds) {
		const original = currentFilesList.find((f) => f.id === fileId);
		if (!original) continue; // Allow copying even if file is deleted

		// Create completely independent file record
		const newFile: File = {
			id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
			workspaceId: workspace.id,
			folderId: targetFolderId,
			name: `${original.name} (copy)`,
			mimeType: original.mimeType,
			size: original.size,
			storagePath: original.storagePath, // ONLY thing shared - R2 file reference
			uploadedBy: 'user_1', // TODO: Get from auth context
			starred: false, // Copies are never starred
			createdAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			updatedAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			deletedAt: null, // Copies are never deleted (independent from original)
			trashedUntil: null,
			tagIds: [] // Copies don't inherit tags
		};

		copied.push(newFile);
	}

	// Add all copies to store
	currentFiles.set([...currentFilesList, ...copied]);
	return copied;
}

/**
 * Copy files to a different workspace
 * Files keep their structure in the target workspace root
 *
 * IMPORTANT: Cross-workspace copies are COMPLETELY INDEPENDENT:
 * - New unique ID (separate database row)
 * - Different workspace_id (multi-tenant isolation)
 * - Always starts fresh (not deleted, not starred, no tags)
 * - Only shares storagePath (R2 file reference)
 */
export function copyFilesToWorkspace(fileIds: string[], targetWorkspaceId: string): File[] {
	const currentFilesList = get(currentFiles);

	const copied: File[] = [];

	for (const fileId of fileIds) {
		const original = currentFilesList.find((f) => f.id === fileId);
		if (!original) continue; // Allow copying even if file is deleted

		// Create completely independent file record
		const newFile: File = {
			id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
			workspaceId: targetWorkspaceId, // Different workspace
			folderId: null, // Start at root
			name: `${original.name} (copy)`,
			mimeType: original.mimeType,
			size: original.size,
			storagePath: original.storagePath, // ONLY thing shared - R2 file reference
			uploadedBy: 'user_1', // TODO: Get from auth context
			starred: false, // Copies are never starred
			createdAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			updatedAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			deletedAt: null, // Copies are never deleted (independent from original)
			trashedUntil: null,
			tagIds: [] // Copies don't inherit tags
		};

		copied.push(newFile);
	}

	// Add all copies to store
	currentFiles.set([...currentFilesList, ...copied]);
	return copied;
}

/**
 * Copy folders to target folder in current workspace
 * Recursively copies folder structure and all nested files
 *
 * IMPORTANT: Copied folders and files are COMPLETELY INDEPENDENT:
 * - New unique IDs for folders and all nested files
 * - All copies start fresh (not deleted, not starred)
 * - Files inside share storagePath with originals (R2 references)
 * - Deleting original folder doesn't affect copies
 */
export function copyFoldersToFolder(folderIds: string[], targetFolderId: string | null): Folder[] {
	const currentFoldersList = get(workspaceFolders);
	const currentFilesList = get(currentFiles);
	const workspace = get(currentWorkspace);

	if (!workspace) throw new Error('No workspace selected');

	const copied: Folder[] = [];
	const oldToNewFolderMap = new Map<string, string>();

	// Copy folders recursively
	const copyFolderRecursive = (sourceFolderId: string, newParentId: string | null): void => {
		// Get source folder and children
		const sourceFolder = currentFoldersList.find((f) => f.id === sourceFolderId);
		if (!sourceFolder || sourceFolder.deletedAt) return;

		// Create new independent folder
		const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const newFolder: Folder = {
			id: newFolderId, // Unique ID
			workspaceId: workspace.id,
			parentId: newParentId,
			name: `${sourceFolder.name} (copy)`,
			description: sourceFolder.description,
			starred: false, // Copies are never starred
			createdAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			updatedAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			deletedAt: null, // Copies are never deleted (independent)
			trashedUntil: null
		};

		copied.push(newFolder);
		oldToNewFolderMap.set(sourceFolderId, newFolderId);

		// Recursively copy children
		const children = currentFoldersList.filter(
			(f) => f.parentId === sourceFolderId && !f.deletedAt
		);
		for (const child of children) {
			copyFolderRecursive(child.id, newFolderId);
		}
	};

	// Start copying each requested folder
	for (const folderId of folderIds) {
		copyFolderRecursive(folderId, targetFolderId);
	}

	// Copy all files in the new folders (each file is independent)
	const copiedFiles: File[] = [];
	for (const [oldFolderId, newFolderId] of oldToNewFolderMap.entries()) {
		const filesInOldFolder = currentFilesList.filter(
			(f) => f.folderId === oldFolderId && !f.deletedAt
		);

		for (const originalFile of filesInOldFolder) {
			// Create independent file record
			const newFile: File = {
				id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
				workspaceId: workspace.id,
				folderId: newFolderId, // New folder structure
				name: originalFile.name, // Keep original name (inside copy folder)
				mimeType: originalFile.mimeType,
				size: originalFile.size,
				storagePath: originalFile.storagePath, // ONLY thing shared - R2 file reference
				uploadedBy: 'user_1', // TODO: Get from auth context
				starred: false, // Copies are never starred
				createdAt: new Date(), // TODO Phase 2: Use toUTC() for D1
				updatedAt: new Date(), // TODO Phase 2: Use toUTC() for D1
				deletedAt: null, // Copies are never deleted (independent)
				trashedUntil: null,
				tagIds: [] // Copies don't inherit tags
			};

			copiedFiles.push(newFile);
		}
	}

	// Update stores
	workspaceFolders.set([...currentFoldersList, ...copied]);
	currentFiles.set([...currentFilesList, ...copiedFiles]);

	return copied;
}
