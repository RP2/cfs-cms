<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { currentFolder, workspaceFolders, currentView, viewScope } from '$lib/stores';
	import type { Folder } from '$lib/types';
	import { Folder as FolderIcon, ChevronRight } from '@lucide/svelte';
	import FolderItem from './FolderItem.svelte';
	import { createEventDispatcher } from 'svelte';
	import MenuContent from './context-menus/MenuContent.svelte';
	import { buildFolderMenu } from './context-menus/menuBuilder';

	interface Props {
		folder: Folder;
		activeDropTargetKey?: string | null;
		onFolderDragOver?: (event: DragEvent, key?: string) => void;
		onFolderDragLeave?: (key?: string) => void;
		onFolderDrop?: (event: DragEvent, folderId: string, workspaceId: string) => void;
		clipboard?: { type: 'file' | 'folder'; ids: string[] } | null;
		onCopyFolder?: (folderId: string) => void;
		onPaste?: (targetFolderId: string | null, workspaceId: string) => void;
		onStarFolder?: (folderId: string) => void;
		onNewFolder?: (parentId: string) => void;
	}

	let {
		folder,
		activeDropTargetKey = null,
		onFolderDragOver,
		onFolderDragLeave,
		onFolderDrop,
		clipboard,
		onCopyFolder,
		onPaste,
		onStarFolder,
		onNewFolder
	}: Props = $props();
	const dispatch = createEventDispatcher<{ 'rename-folder': Folder; 'delete-folder': Folder }>();

	let open = $state(false);
	let activeDropClass = $derived(
		activeDropTargetKey === `folder-${folder.id}` ? 'ring-2 ring-accent' : ''
	);

	// Derive children from store instead of query function
	let children = $derived(
		$workspaceFolders.filter(
			(f) => f.parentId === folder.id && f.workspaceId === folder.workspaceId && !f.deletedAt
		)
	);
	let hasChildren = $derived(children.length > 0);

	function selectThisFolder() {
		currentView.set('normal');
		viewScope.set('workspace');
		currentFolder.set(folder);
		// Auto-expand when navigating to a folder with children
		if (hasChildren) {
			open = true;
		}
	}

	function toggleOpen() {
		if (hasChildren) {
			open = !open;
		}
	}

	// Auto-expand when this folder becomes the current folder
	$effect(() => {
		if ($currentFolder?.id === folder.id && hasChildren) {
			open = true;
		}
	});

	const menuItems = $derived(
		buildFolderMenu({
			isTrash: false,
			clipboard: clipboard ?? null,
			inRoot: true,
			isStarred: false,
			onToggleOpen: hasChildren ? toggleOpen : undefined,
			toggleLabel: hasChildren ? (open ? 'Collapse' : 'Expand') : undefined,
			onNewFolder: onNewFolder ? () => onNewFolder(folder.id) : undefined,
			onRename: () => dispatch('rename-folder', folder),
			onStar: () => onStarFolder?.(folder.id),
			onRestore: () => {},
			onDelete: () => dispatch('delete-folder', folder),
			onPermanentDelete: () => {},
			onCopy: () => onCopyFolder?.(folder.id),
			onPaste: (targetFolderId) => onPaste?.(targetFolderId, folder.workspaceId),
			targetFolderId: folder.id,
			deleteLabel: 'Delete',
			pasteLabelMode: 'folder'
		})
	);
</script>

<Sidebar.MenuItem>
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<Sidebar.MenuButton
				isActive={$currentFolder?.id === folder.id}
				onclick={selectThisFolder}
				ondragover={(event) => onFolderDragOver?.(event, `folder-${folder.id}`)}
				ondragleave={() => onFolderDragLeave?.(`folder-${folder.id}`)}
				ondrop={(event) => onFolderDrop?.(event, folder.id, folder.workspaceId)}
				class={activeDropClass}
			>
				<FolderIcon />
				<span>{folder.name}</span>
			</Sidebar.MenuButton>
			{#if hasChildren}
				<Sidebar.MenuAction onclick={toggleOpen}>
					<ChevronRight
						class="transition-transform duration-200"
						style="transform: rotate({open ? 90 : 0}deg)"
					/>
				</Sidebar.MenuAction>
			{/if}
		</ContextMenu.Trigger>
		<MenuContent items={menuItems} />
	</ContextMenu.Root>

	{#if hasChildren && open}
		<Sidebar.MenuSub>
			{#each children as subfolder (subfolder.id)}
				<Sidebar.MenuSubItem>
					<FolderItem
						folder={subfolder}
						{activeDropTargetKey}
						{onFolderDragOver}
						{onFolderDragLeave}
						{onFolderDrop}
						{clipboard}
						{onCopyFolder}
						{onPaste}
						on:rename-folder={(event) => dispatch('rename-folder', event.detail)}
						on:delete-folder={(event) => dispatch('delete-folder', event.detail)}
					/>
				</Sidebar.MenuSubItem>
			{/each}
		</Sidebar.MenuSub>
	{/if}
</Sidebar.MenuItem>
