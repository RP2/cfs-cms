import {
	workspaces,
	workspaceFolders,
	currentFiles,
	workspaceTags,
	currentWorkspace
} from '$lib/stores';
import type { LayoutLoad } from './$types';

/**
 * Load workspace data from API
 * Non-blocking async function for background loading
 */
async function loadWorkspaceData(
	fetch: typeof window.fetch,
	wsId: string,
	onData: (folders: any[], files: any[], tags: any[]) => void
) {
	try {
		const folders: any[] = [];
		const files: any[] = [];
		const tags: any[] = [];

		// Fetch folders
		const folderResponse = await fetch(`/api/folders?workspaceId=${wsId}`);
		if (folderResponse.ok) {
			const folderData = await folderResponse.json();
			folders.push(...(folderData.folders || []));
		}

		// Fetch files
		const fileResponse = await fetch(`/api/files?workspaceId=${wsId}`);
		if (fileResponse.ok) {
			const fileData = await fileResponse.json();
			files.push(...(fileData.files || []));
		}

		// Fetch tags
		const tagResponse = await fetch(`/api/tags?workspaceId=${wsId}`);
		if (tagResponse.ok) {
			const tagData = await tagResponse.json();
			tags.push(...(tagData.tags || []));
		}

		onData(folders, files, tags);
	} catch (err) {
		console.error(`Failed to load data for workspace ${wsId}:`, err);
	}
}

/**
 * Load initial data from API if using backend mode
 * Strategy: Load first workspace eagerly, load others in background
 */
export const load: LayoutLoad = async ({ fetch }) => {
	const useMockData = import.meta.env.PUBLIC_USE_MOCK_DATA === 'true';

	if (useMockData) {
		// Mock mode: Stores already seeded with mock data
		return {};
	}

	// Backend mode: Fetch data from API
	try {
		// Fetch workspaces list
		const wsResponse = await fetch('/api/workspaces');
		if (!wsResponse.ok) {
			console.error('Failed to fetch workspaces');
			return {};
		}

		const wsData = await wsResponse.json();
		const allWsIds = wsData.workspaces || [];
		workspaces.set(allWsIds);

		if (allWsIds.length === 0) {
			return {};
		}

		// Eagerly load first workspace (blocking)
		const firstWs = allWsIds[0];
		currentWorkspace.set(firstWs);

		const allFolders: any[] = [];
		const allFiles: any[] = [];
		const allTags: any[] = [];

		// Load first workspace data eagerly
		try {
			const folderResponse = await fetch(`/api/folders?workspaceId=${firstWs.id}`);
			if (folderResponse.ok) {
				const folderData = await folderResponse.json();
				allFolders.push(...(folderData.folders || []));
			}

			const fileResponse = await fetch(`/api/files?workspaceId=${firstWs.id}`);
			if (fileResponse.ok) {
				const fileData = await fileResponse.json();
				allFiles.push(...(fileData.files || []));
			}

			const tagResponse = await fetch(`/api/tags?workspaceId=${firstWs.id}`);
			if (tagResponse.ok) {
				const tagData = await tagResponse.json();
				allTags.push(...(tagData.tags || []));
			}
		} catch (err) {
			console.error('Failed to load first workspace data:', err);
		}

		// Set initial data for first workspace
		workspaceFolders.set(allFolders);
		currentFiles.set(allFiles);
		workspaceTags.set(allTags);

		// Background load remaining workspaces (non-blocking)
		if (allWsIds.length > 1) {
			Promise.all(
				allWsIds.slice(1).map(
					(ws) =>
						new Promise((resolve) => {
							loadWorkspaceData(fetch, ws.id, (folders, files, tags) => {
								// Merge into existing data
								workspaceFolders.update((current) => [...current, ...folders]);
								currentFiles.update((current) => [...current, ...files]);
								workspaceTags.update((current) => [...current, ...tags]);
								resolve(null);
							});
						})
				)
			).catch((err) => console.error('Background workspace loading error:', err));
		}
	} catch (err) {
		console.error('Failed to load initial workspaces:', err);
	}

	return {};
};
