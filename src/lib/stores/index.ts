import { writable } from 'svelte/store';
import type { Workspace, Folder, File, Tag } from '$lib/types';
import { mockWorkspaces, mockFolders, mockFiles, mockTags } from '$lib/data/mock';

// Current workspace
export const currentWorkspace = writable<Workspace | null>(mockWorkspaces[0]);

// Current folder being viewed
export const currentFolder = writable<Folder | null>(null);

// All folders for current workspace
export const workspaceFolders = writable<Folder[]>(mockFolders);

// All files for current folder
export const currentFiles = writable<File[]>(mockFiles);

// All tags for current workspace
export const workspaceTags = writable<Tag[]>(mockTags);

// Selected files (for bulk operations)
export const selectedFileIds = writable<Set<string>>(new Set());

// View type (grid or list)
export const viewType = writable<'grid' | 'list'>('grid');

// Search query
export const searchQuery = writable<string>('');

// Applied filters
export const appliedFilters = writable<Set<string>>(new Set()); // tag IDs
