import type { File, Folder, Tag, Workspace } from '$lib/types';

// Size formatting for display (KB/MB/GB)
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}

// Locale-friendly short date
export function formatDateShort(date: Date | string): string {
	return new Date(date).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

// Build full folder path for selects
export function buildFolderPath(folderId: string | null, folders: Folder[]): string {
	if (!folderId) return 'Workspace Root';
	const path: string[] = [];
	let current = folders.find((f) => f.id === folderId);
	while (current) {
		path.unshift(current.name);
		current = folders.find((f) => f.id === current?.parentId);
	}
	return path.join(' / ') || 'Workspace Root';
}

// Resolve workspace name by id
export function getWorkspaceName(id: string | null | undefined, workspaces: Workspace[]): string {
	const ws = workspaces.find((w) => w.id === id);
	return ws?.name ?? 'Workspace';
}

// Trash expiry helpers
export function getTrashExpiry(
	item: File | Folder,
	retentionDays: number,
	now = Date.now()
): Date | null {
	const deletedAt = item.deletedAt;
	if (!deletedAt && !item.trashedUntil) return null;
	const base = item.trashedUntil ? new Date(item.trashedUntil) : new Date(deletedAt as Date);
	if (!item.trashedUntil && deletedAt) {
		base.setTime(base.getTime() + retentionDays * 24 * 60 * 60 * 1000);
	}
	// Normalize to not drift across calls
	if (base.getTime() < now) return base;
	return base;
}

export function formatTrashExpiry(
	item: File | Folder,
	retentionDays: number,
	formatDate: (date: Date | string) => string,
	now = Date.now()
): string | null {
	const expiry = getTrashExpiry(item, retentionDays, now);
	if (!expiry) return null;
	const diffDays = Math.max(0, Math.ceil((expiry.getTime() - now) / (24 * 60 * 60 * 1000)));
	return `${formatDate(expiry)} (${diffDays} day${diffDays === 1 ? '' : 's'} left)`;
}

// Tag styling helper
export function getTagClass(tagId: string, tagMap: Map<string, Tag>): string {
	const tag = tagMap.get(tagId);
	if (!tag) return 'border-transparent bg-muted text-muted-foreground';
	const textColor = tag.color === 'muted' ? 'muted-foreground' : `${tag.color}-foreground`;
	return `border-transparent bg-${tag.color} text-${textColor}`;
}
