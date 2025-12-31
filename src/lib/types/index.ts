// Type definitions for CFS CMS

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export interface Workspace {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	ownerId: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export interface Folder {
	id: string;
	workspaceId: string;
	parentId: string | null;
	name: string;
	description?: string;
	starred: boolean;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	trashedUntil: Date | null;
}

export interface File {
	id: string;
	workspaceId: string;
	folderId: string | null;
	name: string;
	mimeType: string;
	size: number; // in bytes
	storagePath: string;
	uploadedBy: string;
	starred: boolean;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	trashedUntil: Date | null;
	tagIds?: string[];
}

export interface Tag {
	id: string;
	workspaceId: string;
	name: string;
	color: string; // Tailwind color class like 'bg-blue-500'
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export type ViewType = 'grid' | 'list';

export type ViewMode = 'normal' | 'starred' | 'tags' | 'trash';

export type ViewScope = 'workspace' | 'global';
