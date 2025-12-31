import { get } from 'svelte/store';
import { currentWorkspace, workspaceFolders, currentFiles, workspaceTags } from '$lib/stores';
import type { Folder, File, Tag } from '$lib/types';

export interface SearchResult {
	id: string;
	name: string;
	type: 'file' | 'folder';
	path: string;
	tags: Tag[];
	folderId?: string;
	workspaceId: string;
}

/**
 * Search files and folders in the current workspace
 * Phase 1: Searches local mock data
 * Phase 2: Will call API endpoints to Cloudflare D1
 */
export function searchItems(
	query: string,
	selectedTagIds: Set<string> = new Set()
): SearchResult[] {
	if (!query.trim()) return [];

	const workspace = get(currentWorkspace);
	if (!workspace) return [];

	const folders = get(workspaceFolders);
	const files = get(currentFiles);
	const tags = get(workspaceTags);
	const tagMap = new Map(tags.map((t: Tag) => [t.id, t]));

	const q = query.toLowerCase();
	const results: SearchResult[] = [];

	// Search folders (folders don't have tags yet in our data model, but structure is ready)
	folders.forEach((folder: Folder) => {
		if (folder.workspaceId !== workspace.id || folder.deletedAt) return;
		if (!folder.name.toLowerCase().includes(q)) return;

		const path = buildPath(folder.id, folders);
		results.push({
			id: folder.id,
			name: folder.name,
			type: 'folder',
			path,
			tags: [],
			folderId: folder.id,
			workspaceId: workspace.id
		});
	});

	// Search files
	files.forEach((file: File) => {
		if (file.workspaceId !== workspace.id || file.deletedAt) return;
		if (!file.name.toLowerCase().includes(q)) return;

		const fileTags = (file.tagIds || [])
			.map((id: string) => tagMap.get(id))
			.filter((tag: Tag | undefined): tag is Tag => tag !== undefined);

		// Filter by selected tags if any
		if (selectedTagIds.size > 0 && !fileTags.some((t: Tag) => selectedTagIds.has(t.id))) {
			return;
		}

		const path = buildPath(file.folderId, folders);
		results.push({
			id: file.id,
			name: file.name,
			type: 'file',
			path,
			tags: fileTags,
			folderId: file.folderId,
			workspaceId: workspace.id
		});
	});

	// Sort: folders first, then by name
	return results.sort((a: SearchResult, b: SearchResult) => {
		if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Build the full path for a folder/file
 */
function buildPath(folderId: string | null, folders: Folder[]): string {
	const path: string[] = [];
	let current = folders.find((f: Folder) => f.id === folderId);

	while (current) {
		path.unshift(current.name);
		current = folders.find((f: Folder) => f.id === current?.parentId);
	}

	return path.join(' / ') || 'Workspace Root';
}
