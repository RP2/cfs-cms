import { writable } from 'svelte/store';
import type { Workspace, Folder, File, Tag, ViewMode, ViewScope } from '$lib/types';
import { mockWorkspaces, mockFolders, mockFiles, mockTags } from '$lib/data/mock';

/**
 * Check if we should use mock data or real backend
 * This is evaluated at module load time, so no repeated checks
 */
const USE_MOCK_DATA = import.meta.env.PUBLIC_USE_MOCK_DATA === 'true';

// All workspaces - empty if backend mode, seeded with mock if mock mode
export const workspaces = writable<Workspace[]>(
	USE_MOCK_DATA ? mockWorkspaces.filter((w) => !w.deletedAt) : []
);

// Current workspace - null if backend mode (will be set by app), or mock if mock mode
export const currentWorkspace = writable<Workspace | null>(
	USE_MOCK_DATA ? mockWorkspaces[0] : null
);

// Current folder being viewed (null = workspace root, null when in quick link views)
export const currentFolder = writable<Folder | null>(null);

// Current view mode (normal navigation vs quick links)
export const currentView = writable<ViewMode>('normal');

// Current scope (workspace-scoped vs global quick links)
export const viewScope = writable<ViewScope>('workspace');

// All folders for current workspace - empty if backend mode, seeded with mock if mock mode
export const workspaceFolders = writable<Folder[]>(USE_MOCK_DATA ? mockFolders : []);

// All files for current folder - empty if backend mode, seeded with mock if mock mode
export const currentFiles = writable<File[]>(USE_MOCK_DATA ? mockFiles : []);

// All tags (global) - empty if backend mode, seeded with mock if mock mode
export const workspaceTags = writable<Tag[]>(USE_MOCK_DATA ? mockTags : []);

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

// Clipboard store for copy/paste operations
export interface ClipboardItem {
	type: 'file' | 'folder';
	ids: string[];
}

function createClipboardStore() {
	const { subscribe, set } = writable<ClipboardItem | null>(null);

	return {
		subscribe,
		set: (value: ClipboardItem | null) => set(value),
		clear: () => set(null)
	};
}

export const clipboard = createClipboardStore();
