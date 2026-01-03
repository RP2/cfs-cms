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

/**
 * Get all descendant folder IDs for circular reference validation
 * Used to prevent moving a folder into itself or its own subfolder
 */
export function getDescendantFolderIds(allFolders: Folder[], folderId: string): Set<string> {
	const descendants = new Set<string>();
	const stack = [folderId];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		const children = allFolders
			.filter((f) => f.parentId === current && !f.deletedAt)
			.map((f) => f.id);
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
 * Environment check: Use mock data or real API calls
 * Set PUBLIC_USE_MOCK_DATA=false to enable Cloudflare backend
 */
const USE_MOCK_DATA = import.meta.env.PUBLIC_USE_MOCK_DATA === 'true';

/**
 * Data Service Layer
 *
 * Dual-mode operation:
 * - Mock Mode (PUBLIC_USE_MOCK_DATA=true): In-memory store manipulation
 * - Backend Mode (PUBLIC_USE_MOCK_DATA=false): API calls to Cloudflare D1/R2/KV
 *
 * All functions check USE_MOCK_DATA and route accordingly.
 * Components remain unchanged regardless of mode.
 */

// ==================== WORKSPACE OPERATIONS ====================

/**
 * Create a new workspace
 */
export async function createWorkspace(name: string, description: string): Promise<Workspace> {
	if (USE_MOCK_DATA) {
		// Mock mode: In-memory manipulation
		const newWorkspace: Workspace = {
			id: `workspace_${Date.now()}`,
			name: name.trim(),
			description: description.trim(),
			ownerId: 'user_1',
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};

		const currentWorkspaces = get(workspaces);
		workspaces.set([...currentWorkspaces, newWorkspace]);
		currentWorkspace.set(newWorkspace);

		return newWorkspace;
	} else {
		// Backend mode: API call
		const response = await fetch('/api/workspaces', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, description })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create workspace');
		}

		const newWorkspace = await response.json();

		// Update store for UI consistency
		const currentWorkspaces = get(workspaces);
		workspaces.set([...currentWorkspaces, newWorkspace]);
		currentWorkspace.set(newWorkspace);

		return newWorkspace;
	}
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Check and delete locally
		const currentWorkspacesList = get(workspaces);
		const workspace = currentWorkspacesList.find((w) => w.id === workspaceId);

		if (!workspace) return;

		const currentFoldersList = get(workspaceFolders);
		const currentFilesList = get(currentFiles);

		const hasFolders = currentFoldersList.some(
			(f) => f.workspaceId === workspaceId && !f.deletedAt
		);
		const hasFiles = currentFilesList.some((f) => f.workspaceId === workspaceId && !f.deletedAt);

		if (hasFolders || hasFiles) {
			throw new Error(
				'Cannot delete workspace with content. Please delete or move all files and folders first.'
			);
		}

		const updatedWorkspaces = currentWorkspacesList.filter((w) => w.id !== workspaceId);
		workspaces.set(updatedWorkspaces);

		const currentWs = get(currentWorkspace);
		if (currentWs?.id === workspaceId) {
			const nextWorkspace = updatedWorkspaces[0] || null;
			currentWorkspace.set(nextWorkspace);
			currentFolder.set(null);
		}
	} else {
		// Backend mode: API call
		const response = await fetch(`/api/workspaces/${workspaceId}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to delete workspace');
		}

		// Update store
		const currentWorkspacesList = get(workspaces);
		const updatedWorkspaces = currentWorkspacesList.filter((w) => w.id !== workspaceId);
		workspaces.set(updatedWorkspaces);

		const currentWs = get(currentWorkspace);
		if (currentWs?.id === workspaceId) {
			const nextWorkspace = updatedWorkspaces[0] || null;
			currentWorkspace.set(nextWorkspace);
			currentFolder.set(null);
		}
	}
}

export function restoreWorkspace(workspaceId: string): void {
	const currentWorkspacesList = get(workspaces);
	const updated = currentWorkspacesList.map((ws) =>
		ws.id === workspaceId ? { ...ws, deletedAt: null } : ws
	);
	workspaces.set(updated);
	// TODO: Replace with Cloudflare backend call (PATCH /api/workspaces/:id)
}

export function renameWorkspace(workspaceId: string, newName: string): void {
	if (!newName.trim()) throw new Error('Name is required');

	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
		const currentWorkspacesList = get(workspaces);
		const now = new Date();
		const updated = currentWorkspacesList.map((ws) =>
			ws.id === workspaceId ? { ...ws, name: newName.trim(), updatedAt: now } : ws
		);
		workspaces.set(updated);

		// Update current workspace if it's the one being renamed
		const currentWs = get(currentWorkspace);
		if (currentWs?.id === workspaceId) {
			currentWorkspace.set({ ...currentWs, name: newName.trim(), updatedAt: now });
		}
	} else {
		// Backend mode: Fire async API call in background, don't wait
		(async () => {
			try {
				const response = await fetch(`/api/workspaces/${workspaceId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});

				if (!response.ok) {
					console.error('Failed to rename workspace');
					return;
				}

				const updated = await response.json();

				// Update store
				const currentWorkspacesList = get(workspaces);
				const index = currentWorkspacesList.findIndex((w) => w.id === workspaceId);
				if (index !== -1) {
					currentWorkspacesList[index] = updated;
					workspaces.set([...currentWorkspacesList]);
				}

				// Update current workspace if it's the one being updated
				const currentWs = get(currentWorkspace);
				if (currentWs?.id === workspaceId) {
					currentWorkspace.set(updated);
				}
			} catch (err) {
				console.error('Rename workspace error:', err);
			}
		})();
	}
}

export function updateWorkspaceDescription(workspaceId: string, newDescription: string): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
		const currentWorkspacesList = get(workspaces);
		const now = new Date();
		const updated = currentWorkspacesList.map((ws) =>
			ws.id === workspaceId ? { ...ws, description: newDescription.trim(), updatedAt: now } : ws
		);
		workspaces.set(updated);

		// Update current workspace if it's the one being updated
		const currentWs = get(currentWorkspace);
		if (currentWs?.id === workspaceId) {
			currentWorkspace.set({ ...currentWs, description: newDescription.trim(), updatedAt: now });
		}
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch(`/api/workspaces/${workspaceId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ description: newDescription })
				});

				if (!response.ok) {
					console.error('Failed to update workspace');
					return;
				}

				const updated = await response.json();

				// Update store
				const currentWorkspacesList = get(workspaces);
				const index = currentWorkspacesList.findIndex((w) => w.id === workspaceId);
				if (index !== -1) {
					currentWorkspacesList[index] = updated;
					workspaces.set([...currentWorkspacesList]);
				}

				// Update current workspace if it's the one being updated
				const currentWs = get(currentWorkspace);
				if (currentWs?.id === workspaceId) {
					currentWorkspace.set(updated);
				}
			} catch (err) {
				console.error('Update workspace description error:', err);
			}
		})();
	}
}

export function updateWorkspaceIcon(workspaceId: string, newIcon: string): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
		const currentWorkspacesList = get(workspaces);
		const now = new Date();
		const updated = currentWorkspacesList.map((ws) =>
			ws.id === workspaceId ? { ...ws, icon: newIcon, updatedAt: now } : ws
		);
		workspaces.set(updated);

		// Update current workspace if it's the one being updated
		const currentWs = get(currentWorkspace);
		if (currentWs?.id === workspaceId) {
			currentWorkspace.set({ ...currentWs, icon: newIcon, updatedAt: now });
		}
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch(`/api/workspaces/${workspaceId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ icon: newIcon })
				});

				if (!response.ok) {
					console.error('Failed to update workspace');
					return;
				}

				const updated = await response.json();

				// Update store
				const currentWorkspacesList = get(workspaces);
				const index = currentWorkspacesList.findIndex((w) => w.id === workspaceId);
				if (index !== -1) {
					currentWorkspacesList[index] = updated;
					workspaces.set([...currentWorkspacesList]);
				}

				// Update current workspace if it's the one being updated
				const currentWs = get(currentWorkspace);
				if (currentWs?.id === workspaceId) {
					currentWorkspace.set(updated);
				}
			} catch (err) {
				console.error('Update workspace icon error:', err);
			}
		})();
	}
}

export async function createFolder(parentId: string | null, name: string): Promise<Folder> {
	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	if (USE_MOCK_DATA) {
		// Mock mode: Check duplicates and create locally
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

		currentFoldersList.push(newFolder);
		workspaceFolders.set([...currentFoldersList]);

		return newFolder;
	} else {
		// Backend mode: API call
		const response = await fetch('/api/folders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ workspaceId: currentWs.id, parentId, name })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create folder');
		}

		const newFolder = await response.json();

		// Update store
		const currentFoldersList = get(workspaceFolders);
		workspaceFolders.set([...currentFoldersList, newFolder]);

		return newFolder;
	}
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
	if (!newName.trim()) throw new Error('Name is required');

	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;
		if (newName === folder.name) return;

		folder.name = newName.trim();
		folder.updatedAt = new Date();

		workspaceFolders.set([...currentFoldersList]);
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;
		if (newName === folder.name) return;

		// Optimistic update
		folder.name = newName.trim();
		folder.updatedAt = new Date();
		workspaceFolders.set([...currentFoldersList]);

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/folders/${folderId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});

				if (!response.ok) {
					console.error('Failed to rename folder');
				}
			} catch (err) {
				console.error('Rename folder error:', err);
			}
		})();
	}
}

export async function deleteFolder(folderId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Soft delete locally
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;

		const deletedAt = new Date();
		folder.deletedAt = deletedAt;
		folder.updatedAt = deletedAt;
		folder.trashedUntil = computeTrashedUntil(deletedAt);

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
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;

		const deletedAt = new Date();

		// Optimistic update
		folder.deletedAt = deletedAt;
		folder.updatedAt = deletedAt;
		folder.trashedUntil = computeTrashedUntil(deletedAt);

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

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/folders/${folderId}`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					console.error('Failed to delete folder');
				}
			} catch (err) {
				console.error('Delete folder error:', err);
			}
		})();
	}
}

// ==================== FILE OPERATIONS ====================

export async function renameFile(fileId: string, newName: string): Promise<void> {
	if (!newName.trim()) throw new Error('Name is required');

	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;
		if (newName === file.name) return;

		file.name = newName.trim();
		file.updatedAt = new Date();

		currentFiles.set([...currentFilesList]);
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);
		if (!file) return;
		if (newName === file.name) return;

		// Optimistic update
		file.name = newName.trim();
		file.updatedAt = new Date();
		currentFiles.set([...currentFilesList]);

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/files/${fileId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});

				if (!response.ok) {
					console.error('Failed to rename file');
				}
			} catch (err) {
				console.error('Rename file error:', err);
			}
		})();
	}
}

export function setFileTags(fileId: string, tagIds: string[]): void {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (!file) return;

	file.tagIds = [...new Set(tagIds)];
	file.updatedAt = utcNow();

	currentFiles.set([...currentFilesList]);
}

export async function deleteFile(fileId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Soft delete locally
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;

		file.deletedAt = utcNow();
		file.trashedUntil = computeTrashedUntil(file.deletedAt);
		file.updatedAt = file.deletedAt;

		currentFiles.set([...currentFilesList]);
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;

		// Optimistic update
		file.deletedAt = utcNow();
		file.trashedUntil = computeTrashedUntil(file.deletedAt);
		file.updatedAt = file.deletedAt;
		currentFiles.set([...currentFilesList]);

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/files/${fileId}`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					console.error('Failed to delete file');
				}
			} catch (err) {
				console.error('Delete file error:', err);
			}
		})();
	}
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
	if (fileIds.length === 0) return;

	if (USE_MOCK_DATA) {
		// Mock mode: Bulk soft delete locally
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
	} else {
		// Backend mode: API call
		const response = await fetch('/api/files/bulk-delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileIds })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to delete files');
		}

		const result = await response.json();

		// Update store
		const currentFilesList = get(currentFiles);
		const idSet = new Set(fileIds);
		const trashedUntil = new Date(result.trashedUntil);
		const deletedAt = new Date();

		currentFilesList.forEach((file) => {
			if (!idSet.has(file.id)) return;
			file.deletedAt = deletedAt;
			file.trashedUntil = trashedUntil;
			file.updatedAt = deletedAt;
		});

		currentFiles.set([...currentFilesList]);
	}
}

export function uploadFiles(files: FileList): void {
	const currentWs = get(currentWorkspace);
	const currentFolder_ = get(currentFolder);

	if (!currentWs || !currentFolder_) return;

	const currentFilesList = get(currentFiles);

	if (USE_MOCK_DATA) {
		// Mock mode: Add mock files to store
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const formData = new FormData();
					formData.append('file', file);
					formData.append('workspaceId', currentWs.id);
					formData.append('folderId', currentFolder_.id);
					formData.append('name', file.name);

					const response = await fetch('/api/files', {
						method: 'POST',
						body: formData
					});

					if (response.ok) {
						const newFile = await response.json();
						const updated = get(currentFiles);
						currentFiles.set([...updated, newFile]);
					}
				}
			} catch (err) {
				console.error('Upload files error:', err);
			}
		})();
	}
}

// ==================== MOVE OPERATIONS ====================

export function moveFilesToFolder(
	fileIds: string[],
	targetFolderId: string | null,
	opts?: { targetWorkspaceId?: string }
): void {
	if (fileIds.length === 0) return;

	if (USE_MOCK_DATA) {
		// Mock mode: Update locally
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const folders = get(workspaceFolders);
				const targetFolder = targetFolderId
					? folders.find((f) => f.id === targetFolderId && !f.deletedAt)
					: null;

				const targetWorkspaceId = targetFolder
					? targetFolder.workspaceId
					: (opts?.targetWorkspaceId ?? get(currentWorkspace)?.id);

				if (!targetWorkspaceId) return;

				const response = await fetch('/api/files/move', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fileIds,
						targetFolderId,
						targetWorkspaceId
					})
				});

				if (!response.ok) {
					console.error('Failed to move files');
					return;
				}

				// Update store optimistically (already done above in mock logic)
				const files = get(currentFiles);
				const now = new Date();
				const idSet = new Set(fileIds);

				files.forEach((file) => {
					if (!idSet.has(file.id)) return;
					file.workspaceId = targetWorkspaceId;
					file.folderId = targetFolderId;
					file.updatedAt = now;
				});

				currentFiles.set([...files]);
			} catch (err) {
				console.error('Move files error:', err);
			}
		})();
	}
}

export function moveFilesToWorkspace(
	fileIds: string[],
	targetWorkspaceId: string,
	targetFolderId: string | null = null
): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Validate and move
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch('/api/files/move', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fileIds,
						targetFolderId,
						targetWorkspaceId
					})
				});

				if (!response.ok) {
					console.error('Failed to move files to workspace');
					return;
				}

				// Update store
				const files = get(currentFiles);
				const now = new Date();
				const idSet = new Set(fileIds);

				files.forEach((file) => {
					if (!idSet.has(file.id)) return;
					file.workspaceId = targetWorkspaceId;
					file.folderId = targetFolderId;
					file.updatedAt = now;
				});

				currentFiles.set([...files]);
			} catch (err) {
				console.error('Move files to workspace error:', err);
			}
		})();
	}
}

export function moveFolder(folderId: string, targetParentId: string | null): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Move locally
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const folders = get(workspaceFolders);
				const folder = folders.find((f) => f.id === folderId && !f.deletedAt);
				if (!folder) return;

				const response = await fetch('/api/folders/move', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						folderId,
						targetParentId,
						targetWorkspaceId: folder.workspaceId
					})
				});

				if (!response.ok) {
					console.error('Failed to move folder');
					return;
				}

				// Update store
				folder.parentId = targetParentId;
				folder.updatedAt = new Date();
				workspaceFolders.set([...folders]);
			} catch (err) {
				console.error('Move folder error:', err);
			}
		})();
	}
}

export function moveFolderToWorkspace(
	folderId: string,
	targetWorkspaceId: string,
	targetParentId: string | null = null
): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Validate and move
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const folders = get(workspaceFolders);
				const files = get(currentFiles);
				const folder = folders.find((f) => f.id === folderId && !f.deletedAt);
				if (!folder) return;

				const response = await fetch('/api/folders/move', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						folderId,
						targetParentId,
						targetWorkspaceId
					})
				});

				if (!response.ok) {
					console.error('Failed to move folder to workspace');
					return;
				}

				// Update store
				const descendants = getDescendantFolderIds(folders, folderId);
				const allAffectedFolderIds = new Set([folderId, ...Array.from(descendants)]);
				const now = new Date();

				folders.forEach((f) => {
					if (!allAffectedFolderIds.has(f.id)) return;
					f.workspaceId = targetWorkspaceId;
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
			} catch (err) {
				console.error('Move folder to workspace error:', err);
			}
		})();
	}
}

// ==================== STAR/UNSTAR OPERATIONS ====================

export async function toggleFileStar(fileId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Toggle locally
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;

		file.starred = !file.starred;
		file.updatedAt = new Date();

		currentFiles.set([...currentFilesList]);
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);
		if (!file) return;

		const newStarred = !file.starred;

		// Optimistic update
		file.starred = newStarred;
		file.updatedAt = new Date();
		currentFiles.set([...currentFilesList]);

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/files/${fileId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ starred: newStarred })
				});

				if (!response.ok) {
					console.error('Failed to update file');
				}
			} catch (err) {
				console.error('Toggle star error:', err);
			}
		})();
	}
}

export async function toggleFolderStar(folderId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Toggle locally
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;

		folder.starred = !folder.starred;
		folder.updatedAt = new Date();

		workspaceFolders.set([...currentFoldersList]);
	} else {
		// Backend mode: API call
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);
		if (!folder) return;

		const response = await fetch(`/api/folders/${folderId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ starred: !folder.starred })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update folder');
		}

		const updated = await response.json();

		// Update store
		const index = currentFoldersList.findIndex((f) => f.id === folderId);
		if (index !== -1) {
			currentFoldersList[index] = updated;
			workspaceFolders.set([...currentFoldersList]);
		}
	}
}

// ==================== TRASH OPERATIONS ====================

export async function restoreFile(fileId: string): Promise<void> {
	if (USE_MOCK_DATA) {
		// Mock mode: Restore locally
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;

		file.deletedAt = null;
		file.trashedUntil = null;
		file.updatedAt = new Date();

		currentFiles.set([...currentFilesList]);
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFilesList = get(currentFiles);
		const file = currentFilesList.find((f) => f.id === fileId);

		if (!file) return;

		// Optimistic update
		file.deletedAt = null;
		file.trashedUntil = null;
		file.updatedAt = new Date();
		currentFiles.set([...currentFilesList]);

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/files/${fileId}/restore`, {
					method: 'POST'
				});

				if (!response.ok) {
					console.error('Failed to restore file');
				}
			} catch (err) {
				console.error('Restore file error:', err);
			}
		})();
	}
}

// ==================== TAG OPERATIONS ====================

export function upsertTag(workspaceId: string, name: string, color = 'accent'): Tag {
	if (USE_MOCK_DATA) {
		// Mock mode: Create or find tag locally
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
	} else {
		// Backend mode: Fire async API call, return mock tag locally
		const normalized = normalizeTagName(name);
		if (!normalized) throw new Error('Tag name is required');

		const currentTags = get(workspaceTags);
		const existing = currentTags.find((t) => normalizeTagName(t.name) === normalized);

		if (existing) {
			// Fire API call to restore if needed
			if (existing.deletedAt) {
				(async () => {
					try {
						const response = await fetch(`/api/tags`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ workspaceId, name: name.trim(), color })
						});

						if (response.ok) {
							const restored = await response.json();
							const tags = get(workspaceTags);
							workspaceTags.set(tags.map((t) => (t.id === existing.id ? restored : t)));
						}
					} catch (err) {
						console.error('Restore tag error:', err);
					}
				})();

				const revived = { ...existing, deletedAt: null, updatedAt: new Date() };
				workspaceTags.set(currentTags.map((t) => (t.id === existing.id ? revived : t)));
				return revived;
			}
			return existing;
		}

		// Create locally and fire API call
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

		(async () => {
			try {
				await fetch('/api/tags', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ workspaceId, name: name.trim(), color })
				});
			} catch (err) {
				console.error('Create tag error:', err);
			}
		})();

		return newTag;
	}
}

export function removeTagFromWorkspace(tagId: string): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Soft delete tag locally
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
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch(`/api/tags/${tagId}`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' }
				});

				if (!response.ok) {
					console.error('Failed to remove tag');
					return;
				}

				// Update store
				const tags = get(workspaceTags);
				const tag = tags.find((t) => t.id === tagId);
				if (tag) {
					const updatedTags = tags.map((t) =>
						t.id === tagId ? { ...t, deletedAt: new Date() } : t
					);
					workspaceTags.set(updatedTags);

					const files = get(currentFiles).map((f) => {
						if (!f.tagIds?.includes(tagId)) return f;
						return { ...f, tagIds: f.tagIds.filter((id) => id !== tagId), updatedAt: new Date() };
					});
					currentFiles.set(files);
				}
			} catch (err) {
				console.error('Remove tag error:', err);
			}
		})();
	}
}

export function addTagsToFile(
	fileId: string,
	workspaceId: string,
	names: string[],
	opts?: { color?: string }
): { tags: Tag[]; file?: File } {
	if (USE_MOCK_DATA) {
		// Mock mode: Add tags locally
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
	} else {
		// Backend mode: Fire async API call in background
		const files = get(currentFiles);
		const targetIndex = files.findIndex((f) => f.id === fileId);
		if (targetIndex === -1) {
			return { tags: [] };
		}

		// Create tags locally
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

		// Fire API call in background
		(async () => {
			try {
				await fetch(`/api/files/${fileId}/tags`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						workspaceId,
						tagNames: names.map((n) => n.trim())
					})
				});
			} catch (err) {
				console.error('Add tags to file error:', err);
			}
		})();

		return { tags: createdOrFoundTags, file: files[targetIndex] };
	}
}

export function addTagsToFiles(
	fileIds: string[],
	workspaceId: string,
	names: string[],
	opts?: { color?: string }
): { tags: Tag[]; updatedFiles: File[] } {
	if (USE_MOCK_DATA) {
		// Mock mode: Add tags locally
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
	} else {
		// Backend mode: Fire async API calls in background for each file
		if (fileIds.length === 0) return { tags: [], updatedFiles: [] };

		const files = get(currentFiles);
		const idSet = new Set(fileIds);

		// Create tags locally
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

		// Fire API calls in background
		(async () => {
			try {
				for (const fileId of fileIds) {
					await fetch(`/api/files/${fileId}/tags`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							workspaceId,
							tagNames: names.map((n) => n.trim())
						})
					});
				}
			} catch (err) {
				console.error('Add tags to files error:', err);
			}
		})();

		return { tags: resolvedTags, updatedFiles: updatedFiles.filter((f) => idSet.has(f.id)) };
	}
}

export function replaceFileTags(
	fileId: string,
	workspaceId: string,
	tagNames: string[],
	opts?: { color?: string }
): { tags: Tag[]; file?: File } {
	if (USE_MOCK_DATA) {
		// Mock mode: Replace tags locally
		const normalizedNames = tagNames
			.map((n) => n.trim())
			.filter(Boolean)
			.map((n) => normalizeTagName(n));

		const uniqueNormalized = Array.from(new Set(normalizedNames));

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
	} else {
		// Backend mode: Fire async API call in background
		const normalizedNames = tagNames
			.map((n) => n.trim())
			.filter(Boolean)
			.map((n) => normalizeTagName(n));

		const uniqueNormalized = Array.from(new Set(normalizedNames));

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

		// Fire API call in background
		(async () => {
			try {
				await fetch(`/api/files/${fileId}/tags`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						workspaceId,
						tagNames: tagNames.map((n) => n.trim())
					})
				});
			} catch (err) {
				console.error('Replace file tags error:', err);
			}
		})();

		return { tags: resolvedTags, file: get(currentFiles).find((f) => f.id === fileId) };
	}
}

export function restoreFolder(folderId: string): void {
	if (USE_MOCK_DATA) {
		// Mock mode: Restore locally with files
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
	} else {
		// Backend mode: Optimistic update + async API call
		const currentFoldersList = get(workspaceFolders);
		const folder = currentFoldersList.find((f) => f.id === folderId);

		if (!folder) return;

		// Optimistic update
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

		// Fire API call in background
		(async () => {
			try {
				const response = await fetch(`/api/folders/${folderId}/restore`, {
					method: 'POST'
				});

				if (!response.ok) {
					console.error('Failed to restore folder');
				}
			} catch (err) {
				console.error('Restore folder error:', err);
			}
		})();
	}
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
export async function permanentlyDeleteFile(fileId: string): Promise<number> {
	const currentFilesList = get(currentFiles);
	const file = currentFilesList.find((f) => f.id === fileId);

	if (USE_MOCK_DATA) {
		// Mock mode: Delete locally with reference counting
		const totalCopies = file ? getFileCopyCount(fileId) : 0;
		const remainingCopies = totalCopies - 1;

		const filtered = currentFilesList.filter((f) => f.id !== fileId);
		currentFiles.set(filtered);

		return remainingCopies;
	} else {
		// Backend mode: Optimistic delete + async API call
		const totalCopies = file ? getFileCopyCount(fileId) : 0;
		const remainingCopies = totalCopies - 1;

		// Optimistic update
		const filtered = currentFilesList.filter((f) => f.id !== fileId);
		currentFiles.set(filtered);

		// Fire API call in background (handles R2 reference counting)
		(async () => {
			try {
				const response = await fetch(`/api/files/${fileId}?permanent=true`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					console.error('Failed to permanently delete file');
				}
			} catch (err) {
				console.error('Permanently delete file error:', err);
			}
		})();

		return remainingCopies;
	}
}

export function permanentlyDeleteFolder(folderId: string): void {
	const currentFoldersList = get(workspaceFolders);
	const currentFilesList = get(currentFiles);

	if (USE_MOCK_DATA) {
		// Mock mode: Remove locally
		const filteredFolders = currentFoldersList.filter((f) => f.id !== folderId);
		const filteredFiles = currentFilesList.filter((f) => f.folderId !== folderId);

		workspaceFolders.set(filteredFolders);
		currentFiles.set(filteredFiles);
	} else {
		// Backend mode: Optimistic delete + async API call
		// Remove folder
		const filteredFolders = currentFoldersList.filter((f) => f.id !== folderId);
		// Also remove all files in this folder
		const filteredFiles = currentFilesList.filter((f) => f.folderId !== folderId);

		workspaceFolders.set(filteredFolders);
		currentFiles.set(filteredFiles);

		// Fire API call in background (cascades to nested folders/files and R2 cleanup)
		(async () => {
			try {
				const response = await fetch(`/api/folders/${folderId}?permanent=true`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					console.error('Failed to permanently delete folder');
				}
			} catch (err) {
				console.error('Permanently delete folder error:', err);
			}
		})();
	}
}

// ==================== COPY/PASTE OPERATIONS ====================

// Strips existing copy prefix so we don't stack "Copy of Copy of ..."
function stripCopyPrefix(name: string): string | null {
	const match = /^Copy(?: \((\d+)\))? of (.+)$/.exec(name);
	return match ? match[2] : null;
}

// Ensures copy indicator is a prefix so it can be removed or renumbered later
function buildCopyName(originalName: string, existingNames: Set<string>): string {
	const baseName = stripCopyPrefix(originalName) ?? originalName;
	const lastDot = baseName.lastIndexOf('.');
	const hasExtension = lastDot > 0; // treat ".env" as no-extension for prefixing
	const base = hasExtension ? baseName.slice(0, lastDot) : baseName;
	const ext = hasExtension ? baseName.slice(lastDot) : '';

	let attempt = 1;
	while (true) {
		const prefix = attempt === 1 ? 'Copy of ' : `Copy (${attempt}) of `;
		const candidate = `${prefix}${base}${ext}`;
		if (!existingNames.has(candidate)) return candidate;
		attempt += 1;
	}
}

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

	const existingNames = new Set(
		currentFilesList
			.filter(
				(f) => f.workspaceId === workspace.id && f.folderId === targetFolderId && !f.deletedAt
			)
			.map((f) => f.name)
	);

	const copied: File[] = [];

	if (USE_MOCK_DATA) {
		// Mock mode: Create local copies
		for (const fileId of fileIds) {
			const original = currentFilesList.find((f) => f.id === fileId);
			if (!original) continue;

			const newFile: File = {
				id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				workspaceId: workspace.id,
				folderId: targetFolderId,
				name: buildCopyName(original.name, existingNames),
				mimeType: original.mimeType,
				size: original.size,
				storagePath: original.storagePath,
				uploadedBy: 'user_1',
				starred: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
				trashedUntil: null,
				tagIds: []
			};

			copied.push(newFile);
			existingNames.add(newFile.name);
		}

		currentFiles.set([...currentFilesList, ...copied]);
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch('/api/files/copy', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fileIds,
						targetFolderId,
						workspaceId: workspace.id
					})
				});

				if (!response.ok) {
					console.error('Failed to copy files');
					return;
				}

				const result = await response.json();
				const newCopies: File[] = result.copies || [];

				// Update store with copied files
				const files = get(currentFiles);
				currentFiles.set([...files, ...newCopies]);

				return newCopies;
			} catch (err) {
				console.error('Copy files error:', err);
			}
		})();
	}

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

	const existingNames = new Set(
		currentFilesList
			.filter((f) => f.workspaceId === targetWorkspaceId && f.folderId === null && !f.deletedAt)
			.map((f) => f.name)
	);

	const copied: File[] = [];

	if (USE_MOCK_DATA) {
		// Mock mode: Create local copies
		for (const fileId of fileIds) {
			const original = currentFilesList.find((f) => f.id === fileId);
			if (!original) continue;

			const newFile: File = {
				id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				workspaceId: targetWorkspaceId,
				folderId: null,
				name: buildCopyName(original.name, existingNames),
				mimeType: original.mimeType,
				size: original.size,
				storagePath: original.storagePath,
				uploadedBy: 'user_1',
				starred: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
				trashedUntil: null,
				tagIds: []
			};

			copied.push(newFile);
			existingNames.add(newFile.name);
		}

		currentFiles.set([...currentFilesList, ...copied]);
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch('/api/files/copy-workspace', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fileIds,
						targetWorkspaceId
					})
				});

				if (!response.ok) {
					console.error('Failed to copy files to workspace');
					return;
				}

				const result = await response.json();
				const newCopies: File[] = result.copies || [];

				// Update store with copied files
				const files = get(currentFiles);
				currentFiles.set([...files, ...newCopies]);

				return newCopies;
			} catch (err) {
				console.error('Copy files to workspace error:', err);
			}
		})();
	}

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

	const folderNamesByParent = new Map<string | null, Set<string>>();
	const getFolderNames = (parentId: string | null) => {
		if (folderNamesByParent.has(parentId)) return folderNamesByParent.get(parentId)!;

		const names = new Set(
			currentFoldersList
				.filter((f) => f.workspaceId === workspace.id && f.parentId === parentId && !f.deletedAt)
				.map((f) => f.name)
		);
		folderNamesByParent.set(parentId, names);
		return names;
	};

	const copied: Folder[] = [];
	const oldToNewFolderMap = new Map<string, string>();

	// Copy folders recursively
	const copyFolderRecursive = (sourceFolderId: string, newParentId: string | null): void => {
		// Get source folder and children
		const sourceFolder = currentFoldersList.find((f) => f.id === sourceFolderId);
		if (!sourceFolder || sourceFolder.deletedAt) return;

		// Create new independent folder
		const nameSet = getFolderNames(newParentId);
		const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const newFolder: Folder = {
			id: newFolderId, // Unique ID
			workspaceId: workspace.id,
			parentId: newParentId,
			name: buildCopyName(sourceFolder.name, nameSet),
			description: sourceFolder.description,
			starred: false, // Copies are never starred
			createdAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			updatedAt: new Date(), // TODO Phase 2: Use toUTC() for D1
			deletedAt: null, // Copies are never deleted (independent)
			trashedUntil: null
		};

		copied.push(newFolder);
		nameSet.add(newFolder.name);
		oldToNewFolderMap.set(sourceFolderId, newFolderId);

		// Recursively copy children
		const children = currentFoldersList.filter(
			(f) => f.parentId === sourceFolderId && !f.deletedAt
		);
		for (const child of children) {
			copyFolderRecursive(child.id, newFolderId);
		}
	};

	if (USE_MOCK_DATA) {
		// Mock mode: Copy folders and files locally
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
					id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					workspaceId: workspace.id,
					folderId: newFolderId,
					name: originalFile.name,
					mimeType: originalFile.mimeType,
					size: originalFile.size,
					storagePath: originalFile.storagePath,
					uploadedBy: 'user_1',
					starred: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					deletedAt: null,
					trashedUntil: null,
					tagIds: []
				};

				copiedFiles.push(newFile);
			}
		}

		// Update stores
		workspaceFolders.set([...currentFoldersList, ...copied]);
		currentFiles.set([...currentFilesList, ...copiedFiles]);
	} else {
		// Backend mode: Fire async API call in background
		(async () => {
			try {
				const response = await fetch('/api/folders/copy', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						folderIds,
						targetFolderId,
						workspaceId: workspace.id
					})
				});

				if (!response.ok) {
					console.error('Failed to copy folders');
					return;
				}

				const result = await response.json();
				const newCopiedFolders: Folder[] = result.copies || [];
				const newCopiedFiles: File[] = result.copiedFiles || [];

				// Update stores with copied folders and files
				const folders = get(workspaceFolders);
				const files = get(currentFiles);
				workspaceFolders.set([...folders, ...newCopiedFolders]);
				currentFiles.set([...files, ...newCopiedFiles]);

				return newCopiedFolders;
			} catch (err) {
				console.error('Copy folders error:', err);
			}
		})();
	}

	return copied;
}
