import {
	workspaces,
	workspaceFolders,
	currentFiles,
	currentWorkspace,
	currentFolder
} from '$lib/stores';
import type { Workspace, Folder, File } from '$lib/types';
import { get } from 'svelte/store';

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

	// TODO: Replace with Cloudflare backend call (DELETE /api/workspaces/:id)
	// Backend should handle cascading deletes of folders/files

	// Soft delete workspace
	workspace.deletedAt = new Date();

	// Also soft delete all folders and files in this workspace
	const currentFoldersList = get(workspaceFolders);
	currentFoldersList.forEach((folder) => {
		if (folder.workspaceId === workspaceId) {
			folder.deletedAt = new Date();
		}
	});

	const currentFilesList = get(currentFiles);
	currentFilesList.forEach((file) => {
		if (file.workspaceId === workspaceId) {
			file.deletedAt = new Date();
		}
	});

	// Update stores
	workspaces.set(currentWorkspacesList.filter((w) => !w.deletedAt));

	// If we just deleted the current workspace, switch to another
	const currentWs = get(currentWorkspace);
	if (currentWs?.id === workspaceId) {
		const nextWorkspace =
			currentWorkspacesList.find((w) => !w.deletedAt && w.id !== workspaceId) || null;
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
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null
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
	folder.deletedAt = new Date();

	// Also soft delete all files in this folder
	const currentFilesList = get(currentFiles);
	currentFilesList.forEach((file) => {
		if (file.folderId === folderId) {
			file.deletedAt = new Date();
		}
	});

	workspaceFolders.set([...currentFoldersList]);
	currentFiles.set([...currentFilesList.filter((f) => !f.deletedAt)]);
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

export function deleteFile(fileId: string): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	// Soft delete file
	file.deletedAt = new Date();

	currentFiles.set([...currentFilesList.filter((f) => !f.deletedAt)]);
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
			tagIds: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};
		currentFilesList.push(newFile);
	}

	currentFiles.set([...currentFilesList.filter((f) => !f.deletedAt)]);
}
