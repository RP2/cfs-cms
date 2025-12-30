<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { currentFolder } from '$lib/stores';
	import { getSubfolders } from '$lib/data/mock';
	import type { Folder } from '$lib/types';
	import { Folder as FolderIcon, ChevronRight } from '@lucide/svelte';
	import FolderItem from './FolderItem.svelte';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		folder: Folder;
	}

	let { folder }: Props = $props();
	const dispatch = createEventDispatcher<{ 'rename-folder': Folder; 'delete-folder': Folder }>();

	let open = $state(false);

	let children = $derived(getSubfolders(folder.id, folder.workspaceId));
	let hasChildren = $derived(children.length > 0);

	function selectThisFolder() {
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
</script>

<Sidebar.MenuItem>
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<Sidebar.MenuButton isActive={$currentFolder?.id === folder.id} onclick={selectThisFolder}>
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
		<ContextMenu.Content>
			{#if hasChildren}
				<ContextMenu.Item onselect={toggleOpen}>{open ? 'Collapse' : 'Expand'}</ContextMenu.Item>
			{/if}
			<ContextMenu.Item onselect={() => dispatch('rename-folder', folder)}>Rename</ContextMenu.Item>
			<ContextMenu.Item variant="destructive" onselect={() => dispatch('delete-folder', folder)}>
				Delete
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>

	{#if hasChildren && open}
		<Sidebar.MenuSub>
			{#each children as subfolder (subfolder.id)}
				<Sidebar.MenuSubItem>
					<FolderItem folder={subfolder} />
				</Sidebar.MenuSubItem>
			{/each}
		</Sidebar.MenuSub>
	{/if}
</Sidebar.MenuItem>
