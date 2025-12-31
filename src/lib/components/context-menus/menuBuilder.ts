import type { SvelteComponent } from 'svelte';
import type { ClipboardItem } from '$lib/stores';

type IconComponent = typeof SvelteComponent;

export type MenuItem =
	| {
			kind: 'item';
			label: string;
			icon?: IconComponent;
			variant?: 'destructive';
			disabled?: boolean;
			action: () => void;
	  }
	| { kind: 'separator' };

const pasteLabel = (targetFolderId: string | null, mode: 'folder' | 'generic' = 'folder') =>
	mode === 'generic' ? 'Paste' : targetFolderId ? 'Paste into folder' : 'Paste';

function maybeSeparator(items: MenuItem[]) {
	if (items.length && items[items.length - 1]?.kind === 'separator') return;
	items.push({ kind: 'separator' });
}

export function buildFileMenu(opts: {
	isTrash: boolean;
	clipboard: ClipboardItem | null;
	isSelected: boolean;
	isStarred: boolean;
	inRoot: boolean;
	onToggleSelect: () => void;
	onRename: () => void;
	onStar: () => void;
	onRestore: () => void;
	onDelete: () => void;
	onPermanentDelete: () => void;
	onCopy: () => void;
	onPaste: (targetFolderId: string | null) => void;
	targetFolderId: string | null;
	pasteLabelMode?: 'folder' | 'generic';
}): MenuItem[] {
	const items: MenuItem[] = [];

	if (opts.isTrash) {
		items.push({ kind: 'item', label: 'Restore', action: opts.onRestore });
		items.push({
			kind: 'item',
			label: 'Delete permanently',
			variant: 'destructive',
			action: opts.onPermanentDelete
		});
		return items;
	}

	items.push({
		kind: 'item',
		label: opts.isSelected ? 'Deselect' : 'Select',
		action: opts.onToggleSelect
	});
	items.push({ kind: 'item', label: 'Edit', action: opts.onRename });
	items.push({ kind: 'item', label: opts.isStarred ? 'Unstar' : 'Star', action: opts.onStar });
	maybeSeparator(items);
	items.push({ kind: 'item', label: 'Copy', action: opts.onCopy });
	if (opts.clipboard) {
		items.push({
			kind: 'item',
			label: pasteLabel(opts.targetFolderId, opts.pasteLabelMode),
			action: () => opts.onPaste(opts.targetFolderId),
			icon: undefined
		});
	}
	items.push({
		kind: 'item',
		label: 'Move to Trash',
		variant: 'destructive',
		action: opts.onDelete
	});
	return items;
}

export function buildFolderMenu(opts: {
	isTrash: boolean;
	clipboard: ClipboardItem | null;
	inRoot: boolean;
	isStarred: boolean;
	deleteLabel?: string;
	onNewFolder?: () => void;
	onToggleOpen?: () => void;
	toggleLabel?: string;
	onRename: () => void;
	onStar: () => void;
	onRestore: () => void;
	onDelete: () => void;
	onPermanentDelete: () => void;
	onCopy: () => void;
	onPaste: (targetFolderId: string | null) => void;
	targetFolderId: string | null;
	pasteLabelMode?: 'folder' | 'generic';
}): MenuItem[] {
	const items: MenuItem[] = [];

	if (opts.isTrash) {
		items.push({ kind: 'item', label: 'Restore', action: opts.onRestore });
		items.push({
			kind: 'item',
			label: 'Delete permanently',
			variant: 'destructive',
			action: opts.onPermanentDelete
		});
		return items;
	}

	if (opts.onToggleOpen && opts.toggleLabel) {
		items.push({ kind: 'item', label: opts.toggleLabel, action: opts.onToggleOpen });
	}

	if (opts.onNewFolder) {
		items.push({ kind: 'item', label: 'New Folder', action: opts.onNewFolder });
	}
	items.push({ kind: 'item', label: 'Edit', action: opts.onRename });
	items.push({ kind: 'item', label: opts.isStarred ? 'Unstar' : 'Star', action: opts.onStar });
	maybeSeparator(items);
	items.push({ kind: 'item', label: 'Copy', action: opts.onCopy });
	if (opts.clipboard) {
		items.push({
			kind: 'item',
			label: pasteLabel(opts.targetFolderId, opts.pasteLabelMode),
			action: () => opts.onPaste(opts.targetFolderId)
		});
	}
	maybeSeparator(items);
	items.push({
		kind: 'item',
		label: opts.deleteLabel ?? 'Move to Trash',
		variant: 'destructive',
		action: opts.onDelete
	});
	return items;
}

export function buildBackgroundMenu(opts: {
	clipboard: ClipboardItem | null;
	inRoot: boolean;
	onNewFolder: () => void;
	onUpload: () => void;
	onPaste: (targetFolderId: string | null) => void;
	targetFolderId: string | null;
	pasteLabelMode?: 'folder' | 'generic';
}): MenuItem[] {
	const items: MenuItem[] = [];
	items.push({ kind: 'item', label: 'New Folder', action: opts.onNewFolder });
	items.push({ kind: 'item', label: 'Upload Files', action: opts.onUpload });
	if (opts.clipboard) {
		maybeSeparator(items);
		items.push({
			kind: 'item',
			label: pasteLabel(opts.targetFolderId, opts.pasteLabelMode),
			action: () => opts.onPaste(opts.targetFolderId)
		});
	}
	return items;
}

export function buildWorkspaceMenu(opts: {
	clipboard: ClipboardItem | null;
	onChangeIcon: () => void;
	onPaste: () => void;
	onDeleteWorkspace: () => void;
}): MenuItem[] {
	const items: MenuItem[] = [];
	items.push({ kind: 'item', label: 'Change icon', action: opts.onChangeIcon });
	if (opts.clipboard) {
		items.push({ kind: 'item', label: 'Paste', action: opts.onPaste });
	}
	items.push({
		kind: 'item',
		label: 'Delete workspace',
		variant: 'destructive',
		action: opts.onDeleteWorkspace
	});
	return items;
}
