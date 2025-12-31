/**
 * Operation Service - High-level UI orchestration operations
 *
 * Handles complex multi-step operations that involve:
 * - Validation
 * - Business logic
 * - Multiple service calls
 * - UI state coordination
 *
 * ViewWrapper calls these functions, which return data for UI updates.
 * Handlers in ViewWrapper add toast notifications and state management.
 *
 * Phase 1: Uses dataService for mock data
 * Phase 2: Will call API endpoints that talk to Cloudflare backend
 */

import { get } from 'svelte/store';
import { currentWorkspace, workspaceFolders, currentFiles, selectedFileIds } from '$lib/stores';
import {
	moveFilesToFolder,
	moveFilesToWorkspace,
	moveFolder,
	moveFolderToWorkspace,
	copyFilesToFolder,
	copyFilesToWorkspace,
	copyFoldersToFolder
} from './dataService';
import type { Folder, File } from '$lib/types';

// ==================== MOVE OPERATIONS ====================

/**
 * Validate move operation and return target workspace ID and folder ID
 * Returns null if invalid
 */
export function validateMoveOperation(
	targetWorkspaceId: string,
	targetFolderId: string | null
): { workspaceId: string; folderId: string | null } | null {
	const workspace = get(currentWorkspace);
	if (!targetWorkspaceId) return null;
	if (!workspace) return null;

	// Validate target folder exists if specified
	if (targetFolderId) {
		const folders = get(workspaceFolders);
		const targetFolder = folders.find((f) => f.id === targetFolderId);
		if (!targetFolder || targetFolder.workspaceId !== targetWorkspaceId) {
			return null;
		}
	}

	return { workspaceId: targetWorkspaceId, folderId: targetFolderId };
}

/**
 * Execute move operation for files to target folder
 * Handles both same-workspace and cross-workspace moves
 */
export function performFilesMove(
	fileIds: string[],
	targetWorkspaceId: string,
	targetFolderId: string | null
): void {
	if (fileIds.length === 0) return;

	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	const isCrossWorkspace = currentWs.id !== targetWorkspaceId;

	if (isCrossWorkspace) {
		moveFilesToWorkspace(fileIds, targetWorkspaceId);
	} else {
		moveFilesToFolder(fileIds, targetFolderId);
	}

	selectedFileIds.set(new Set());
}

/**
 * Execute move operation for folders to target folder
 * Prevents circular references (moving folder into itself or descendant)
 */
export function performFoldersMove(folderIds: string[], targetParentId: string | null): void {
	if (folderIds.length === 0) return;

	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	const allFolders = get(workspaceFolders);

	// Validate no circular references
	for (const folderId of folderIds) {
		if (targetParentId === folderId) {
			throw new Error('Cannot move folder into itself');
		}

		// Check if target is a descendant of source
		const descendants = getDescendantFolderIds(allFolders, folderId);
		if (descendants.has(targetParentId || '')) {
			throw new Error('Cannot move folder into its own subfolder');
		}
	}

	// Execute moves
	for (const folderId of folderIds) {
		moveFolder(folderId, targetParentId);
	}
}

/**
 * Execute cross-workspace folder move
 */
export function performFoldersCrossWorkspaceMove(
	folderIds: string[],
	targetWorkspaceId: string,
	targetParentId: string | null = null
): void {
	if (folderIds.length === 0) return;

	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	for (const folderId of folderIds) {
		moveFolderToWorkspace(folderId, targetWorkspaceId, targetParentId);
	}
}

// ==================== COPY/PASTE OPERATIONS ====================

/**
 * Execute copy operation for files
 */
export function performFilesCopy(
	fileIds: string[],
	targetFolderId: string | null,
	targetWorkspaceId?: string
): void {
	if (fileIds.length === 0) return;

	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	if (targetWorkspaceId && targetWorkspaceId !== currentWs.id) {
		copyFilesToWorkspace(fileIds, targetWorkspaceId);
	} else {
		copyFilesToFolder(fileIds, targetFolderId);
	}
}

/**
 * Execute copy operation for folders
 */
export function performFoldersCopy(folderIds: string[], targetParentId: string | null): void {
	if (folderIds.length === 0) return;

	const currentWs = get(currentWorkspace);
	if (!currentWs) throw new Error('No workspace selected');

	copyFoldersToFolder(folderIds, targetParentId);
}

// ==================== DRAG & DROP OPERATIONS ====================

/**
 * Handle file drop - determines move vs copy based on target
 */
export function handleFileDrop(
	fileIds: string[],
	targetFolderId: string | null,
	isCrossWorkspace: boolean
): void {
	if (fileIds.length === 0) return;

	const folders = get(workspaceFolders);
	const workspace = get(currentWorkspace);

	if (!workspace) return;

	const targetFolder = targetFolderId ? folders.find((f) => f.id === targetFolderId) : null;
	const targetWorkspaceId = targetFolder?.workspaceId ?? workspace.id;

	if (isCrossWorkspace) {
		moveFilesToWorkspace(fileIds, targetWorkspaceId);
	} else {
		moveFilesToFolder(fileIds, targetFolderId);
	}

	selectedFileIds.set(new Set());
}

/**
 * Handle folder drop - move folder to target
 */
export function handleFolderDrop(folderId: string, targetParentId: string | null): void {
	const allFolders = get(workspaceFolders);

	// Validate no circular references
	if (targetParentId === folderId) {
		throw new Error('Cannot move folder into itself');
	}

	const descendants = getDescendantFolderIds(allFolders, folderId);
	if (descendants.has(targetParentId || '')) {
		throw new Error('Cannot move folder into its own subfolder');
	}

	moveFolder(folderId, targetParentId);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all descendant folder IDs (for circular reference validation)
 * Duplicated from drag.ts - also used here for consistency
 */
export function getDescendantFolderIds(allFolders: Folder[], folderId: string): Set<string> {
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
