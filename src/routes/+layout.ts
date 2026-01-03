import {
	workspaces,
	workspaceFolders,
	currentFiles,
	workspaceTags,
	currentWorkspace
} from '$lib/stores';
import type { LayoutLoad } from './$types';

/**
 * Load initial data from API if using backend mode
 * In mock mode, stores are already initialized with mock data
 */
export const load: LayoutLoad = async () => {
	const useMockData = import.meta.env.PUBLIC_USE_MOCK_DATA === 'true';

	if (useMockData) {
		// Mock mode: Stores already seeded with mock data
		return {};
	}

	// Backend mode: Fetch data from API
	try {
		// Fetch workspaces
		const wsResponse = await fetch('/api/workspaces');
		if (wsResponse.ok) {
			const wsData = await wsResponse.json();
			workspaces.set(wsData.workspaces || []);
			// Set first workspace as current
			if (wsData.workspaces && wsData.workspaces.length > 0) {
				currentWorkspace.set(wsData.workspaces[0]);
				const firstWsId = wsData.workspaces[0].id;

				// Fetch folders for first workspace
				const folderResponse = await fetch(`/api/folders?workspaceId=${firstWsId}`);
				if (folderResponse.ok) {
					const folderData = await folderResponse.json();
					workspaceFolders.set(folderData.folders || []);
				} else {
					const err = await folderResponse.text();
				}

				// Fetch files for first workspace
				const fileResponse = await fetch(`/api/files?workspaceId=${firstWsId}`);
				if (fileResponse.ok) {
					const fileData = await fileResponse.json();
					currentFiles.set(fileData.files || []);
				}

				// Fetch tags for first workspace
				const tagResponse = await fetch(`/api/tags?workspaceId=${firstWsId}`);
				if (tagResponse.ok) {
					const tagData = await tagResponse.json();
					workspaceTags.set(tagData.tags || []);
				}
			}
		}
	} catch (err) {
		console.error('Failed to load initial data:', err);
	}

	return {};
};
