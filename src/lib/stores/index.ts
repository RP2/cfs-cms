import { writable } from 'svelte/store';
import type { Workspace, Folder, File, Tag, ViewMode, ViewScope } from '$lib/types';
import { mockWorkspaces, mockFolders, mockFiles, mockTags } from '$lib/data/mock';

// All workspaces
export const workspaces = writable<Workspace[]>(mockWorkspaces.filter((w) => !w.deletedAt));

// Current workspace
export const currentWorkspace = writable<Workspace | null>(mockWorkspaces[0]);

// Current folder being viewed (null = workspace root, null when in quick link views)
export const currentFolder = writable<Folder | null>(null);

// Current view mode (normal navigation vs quick links)
export const currentView = writable<ViewMode>('normal');

// Current scope (workspace-scoped vs global quick links)
export const viewScope = writable<ViewScope>('workspace');

// All folders for current workspace
export const workspaceFolders = writable<Folder[]>(mockFolders);

// All files for current folder
export const currentFiles = writable<File[]>(mockFiles);

// All tags (global)
export const workspaceTags = writable<Tag[]>(mockTags);

// Selected files (for bulk operations)
export const selectedFileIds = writable<Set<string>>(new Set());

// View type (grid or list) - persisted to localStorage
function createViewTypeStore() {
	const stored = typeof window !== 'undefined' ? localStorage.getItem('viewType') : null;
	const initial = (stored as 'grid' | 'list') || 'grid';
	const { subscribe, set } = writable<'grid' | 'list'>(initial);

	return {
		subscribe,
		set: (value: 'grid' | 'list') => {
			if (typeof window !== 'undefined') {
				localStorage.setItem('viewType', value);
			}
			set(value);
		}
	};
}

export const viewType = createViewTypeStore();

// Search query
export const searchQuery = writable<string>('');

// Applied filters
export const appliedFilters = writable<Set<string>>(new Set()); // tag IDs

// Loading states for async operations
export const loadingFolders = writable<boolean>(false);
export const loadingFiles = writable<boolean>(false);
export const loadingWorkspaces = writable<boolean>(false);

// Current authenticated user
export const currentUser = writable<{ id: string; email: string; name: string } | null>({
	id: 'user_1', // Will be replaced with real auth
	email: 'user@example.com',
	name: 'User'
});
