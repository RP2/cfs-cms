// Mock data for Phase 1 UI development
// When PUBLIC_USE_MOCK_DATA env var is set, this data is used
// In production (Phase 2+), queries go to real D1 database

import type { Workspace, Folder, File, Tag, User } from '$lib/types';

export const mockUser: User = {
	id: 'user_1',
	email: 'riley@example.com',
	username: 'riley',
	displayName: 'Riley',
	avatarUrl: null,
	createdAt: new Date('2025-01-01'),
	updatedAt: new Date('2025-01-01'),
	deletedAt: null
};

export const mockWorkspaces: Workspace[] = [
	{
		id: 'ws_1',
		name: 'Photography Portfolio',
		description: 'All professional photography projects',
		icon: 'briefcase',
		ownerId: 'user_1',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null
	},
	{
		id: 'ws_2',
		name: 'Design Assets',
		description: 'Logos, icons, and design resources',
		icon: 'palette',
		ownerId: 'user_1',
		createdAt: new Date('2025-01-05'),
		updatedAt: new Date('2025-01-05'),
		deletedAt: null
	},
	{
		id: 'ws_3',
		name: 'Personal Archive',
		description: 'Personal memories and documents',
		icon: 'archive',
		ownerId: 'user_1',
		createdAt: new Date('2025-01-10'),
		updatedAt: new Date('2025-01-10'),
		deletedAt: null
	}
];

export const mockFolders: Folder[] = [
	// Photography Portfolio folders
	{
		id: 'folder_1',
		workspaceId: 'ws_1',
		parentId: null,
		name: '2025 Projects',
		description: 'Current year photography projects',
		starred: true,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null,
		trashedUntil: null
	},
	{
		id: 'folder_2',
		workspaceId: 'ws_1',
		parentId: 'folder_1',
		name: 'Beach Shoot',
		description: 'Summer beach photography session',
		starred: false,
		createdAt: new Date('2025-01-15'),
		updatedAt: new Date('2025-01-15'),
		deletedAt: null,
		trashedUntil: null
	},
	{
		id: 'folder_3',
		workspaceId: 'ws_1',
		parentId: 'folder_1',
		name: 'Portrait Sessions',
		description: 'Client portrait photography',
		starred: true,
		createdAt: new Date('2025-01-20'),
		updatedAt: new Date('2025-01-20'),
		deletedAt: null,
		trashedUntil: null
	},
	{
		id: 'folder_4',
		workspaceId: 'ws_1',
		parentId: null,
		name: '2024 Archive',
		description: 'Previous year projects',
		starred: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		deletedAt: null,
		trashedUntil: null
	},

	// Design Assets folders
	{
		id: 'folder_5',
		workspaceId: 'ws_2',
		parentId: null,
		name: 'Logos',
		description: 'Brand logos and variations',
		starred: false,
		createdAt: new Date('2025-01-08'),
		updatedAt: new Date('2025-01-08'),
		deletedAt: null,
		trashedUntil: null
	},
	{
		id: 'folder_6',
		workspaceId: 'ws_2',
		parentId: null,
		name: 'Icons',
		description: 'Icon sets and individual icons',
		starred: false,
		createdAt: new Date('2025-01-08'),
		updatedAt: new Date('2025-01-08'),
		deletedAt: null,
		trashedUntil: null
	},

	// Deleted folder for trash testing
	{
		id: 'folder_deleted_1',
		workspaceId: 'ws_1',
		parentId: null,
		name: 'Old Campaign',
		description: 'Deleted marketing campaign',
		starred: false,
		createdAt: new Date('2024-12-01'),
		updatedAt: new Date('2024-12-15'),
		deletedAt: new Date('2024-12-15'),
		trashedUntil: new Date('2025-01-14')
	}
];

export const mockTags: Tag[] = [
	{
		id: 'tag_1',
		workspaceId: 'ws_1',
		name: 'Client Approvals',
		color: 'accent',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null
	},
	{
		id: 'tag_2',
		workspaceId: 'ws_1',
		name: 'Invoices Q1',
		color: 'secondary',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null
	},
	{
		id: 'tag_3',
		workspaceId: 'ws_1',
		name: 'To Publish',
		color: 'muted',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null
	},
	{
		id: 'tag_4',
		workspaceId: 'ws_1',
		name: 'Marketing 2025',
		color: 'accent',
		createdAt: new Date('2025-01-15'),
		updatedAt: new Date('2025-01-15'),
		deletedAt: null
	},
	{
		id: 'tag_5',
		workspaceId: 'ws_2',
		name: 'Brand Guidelines',
		color: 'primary',
		createdAt: new Date('2025-01-08'),
		updatedAt: new Date('2025-01-08'),
		deletedAt: null
	}
];

export const mockFiles: File[] = [
	// Beach Shoot files
	{
		id: 'file_1',
		workspaceId: 'ws_1',
		folderId: 'folder_2',
		name: 'DSC_0001.jpg',
		mimeType: 'image/jpeg',
		size: 5242880, // 5 MB
		storagePath: 'workspace_1/folder_2/DSC_0001.jpg',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-15'),
		updatedAt: new Date('2025-01-15'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_4']
	},
	{
		id: 'file_2',
		workspaceId: 'ws_1',
		folderId: 'folder_2',
		name: 'DSC_0002.jpg',
		mimeType: 'image/jpeg',
		size: 4871900,
		storagePath: 'workspace_1/folder_2/DSC_0002.jpg',
		uploadedBy: 'user_1',
		starred: true,
		createdAt: new Date('2025-01-15'),
		updatedAt: new Date('2025-01-15'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_4', 'tag_2']
	},
	{
		id: 'file_3',
		workspaceId: 'ws_1',
		folderId: 'folder_2',
		name: 'Sunset_Final.psd',
		mimeType: 'application/x-photoshop',
		size: 134217728, // 128 MB
		storagePath: 'workspace_1/folder_2/Sunset_Final.psd',
		uploadedBy: 'user_1',
		starred: true,
		createdAt: new Date('2025-01-16'),
		updatedAt: new Date('2025-01-16'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_2', 'tag_4']
	},
	{
		id: 'file_4',
		workspaceId: 'ws_1',
		folderId: 'folder_2',
		name: 'Beach_Edit_Notes.txt',
		mimeType: 'text/plain',
		size: 1024,
		storagePath: 'workspace_1/folder_2/Beach_Edit_Notes.txt',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-17'),
		updatedAt: new Date('2025-01-17'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: []
	},

	// Portrait Sessions files
	{
		id: 'file_5',
		workspaceId: 'ws_1',
		folderId: 'folder_3',
		name: 'Client_Portrait_001.jpg',
		mimeType: 'image/jpeg',
		size: 6291456,
		storagePath: 'workspace_1/folder_3/Client_Portrait_001.jpg',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-20'),
		updatedAt: new Date('2025-01-20'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_1', 'tag_2']
	},
	{
		id: 'file_6',
		workspaceId: 'ws_1',
		folderId: 'folder_3',
		name: 'Client_Portrait_002.jpg',
		mimeType: 'image/jpeg',
		size: 6291456,
		storagePath: 'workspace_1/folder_3/Client_Portrait_002.jpg',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-20'),
		updatedAt: new Date('2025-01-20'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_1', 'tag_3']
	},

	// Mixed content: files at "2025 Projects" level alongside subfolders
	{
		id: 'file_9',
		workspaceId: 'ws_1',
		folderId: 'folder_1',
		name: '2025_Overview.pdf',
		mimeType: 'application/pdf',
		size: 2097152, // 2 MB
		storagePath: 'workspace_1/folder_1/2025_Overview.pdf',
		uploadedBy: 'user_1',
		starred: true,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_2']
	},
	{
		id: 'file_10',
		workspaceId: 'ws_1',
		folderId: 'folder_1',
		name: 'Year_Plan.docx',
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		size: 512000,
		storagePath: 'workspace_1/folder_1/Year_Plan.docx',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-02'),
		updatedAt: new Date('2025-01-02'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: []
	},

	// Logos files
	{
		id: 'file_7',
		workspaceId: 'ws_2',
		folderId: 'folder_5',
		name: 'Logo_Main.svg',
		mimeType: 'image/svg+xml',
		size: 102400,
		storagePath: 'workspace_2/folder_5/Logo_Main.svg',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-08'),
		updatedAt: new Date('2025-01-08'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_5']
	},
	{
		id: 'file_8',
		workspaceId: 'ws_2',
		folderId: 'folder_5',
		name: 'Logo_Variation.png',
		mimeType: 'image/png',
		size: 204800,
		storagePath: 'workspace_2/folder_5/Logo_Variation.png',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2025-01-08'),
		updatedAt: new Date('2025-01-08'),
		deletedAt: null,
		trashedUntil: null,
		tagIds: ['tag_5']
	},

	// Deleted file for trash testing
	{
		id: 'file_deleted_1',
		workspaceId: 'ws_1',
		folderId: 'folder_2',
		name: 'Draft_Photo.jpg',
		mimeType: 'image/jpeg',
		size: 3145728,
		storagePath: 'workspace_1/folder_2/Draft_Photo.jpg',
		uploadedBy: 'user_1',
		starred: false,
		createdAt: new Date('2024-12-10'),
		updatedAt: new Date('2024-12-20'),
		deletedAt: new Date('2024-12-20'),
		trashedUntil: new Date('2025-01-19'),
		tagIds: []
	}
];

// Helper function to get folders for a workspace
export function getFoldersForWorkspace(workspaceId: string): Folder[] {
	return mockFolders.filter((f) => f.workspaceId === workspaceId && !f.deletedAt);
}

// Helper function to get files for a folder
export function getFilesForFolder(folderId: string): File[] {
	return mockFiles.filter((f) => f.folderId === folderId && !f.deletedAt);
}

// Helper function to get subfolders for a folder
export function getSubfolders(parentId: string | null, workspaceId: string): Folder[] {
	return mockFolders.filter(
		(f) => f.parentId === parentId && f.workspaceId === workspaceId && !f.deletedAt
	);
}

// Helper function to get tags for a workspace
export function getTagsForWorkspace(workspaceId: string): Tag[] {
	return mockTags.filter((t) => t.workspaceId === workspaceId && !t.deletedAt);
}
