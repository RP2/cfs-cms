<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { currentWorkspace, currentFolder, viewType } from '$lib/stores';
	import { mockWorkspaces, getSubfolders } from '$lib/data/mock';
	import type { Folder, Workspace } from '$lib/types';
	import FolderItem from './FolderItem.svelte';
	import RenameModal from './modals/RenameModal.svelte';
	import DeleteConfirmModal from './modals/DeleteConfirmModal.svelte';
	import { Briefcase, Star, Tag, Plus, Trash2, Grid3x3, List, User } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	let workspaces = $state(mockWorkspaces.filter((workspace) => !workspace.deletedAt));
	type WorkspaceIcon = 'briefcase' | 'star' | 'grid' | 'tag';
	const workspaceIconOrder: WorkspaceIcon[] = ['briefcase', 'star', 'grid', 'tag'];
	const workspaceIconMap: Record<WorkspaceIcon, typeof Briefcase> = {
		briefcase: Briefcase,
		star: Star,
		grid: Grid3x3,
		tag: Tag
	};
	let workspaceIcons = $state<Record<string, WorkspaceIcon>>(
		mockWorkspaces.reduce(
			(icons, workspace) => {
				icons[workspace.id] = 'briefcase';
				return icons;
			},
			{} as Record<string, WorkspaceIcon>
		)
	);

	let renameModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let renameTarget = $state<Folder | null>(null);
	let deleteTarget = $state<Folder | null>(null);

	function selectWorkspace(workspace: any) {
		currentWorkspace.set(workspace);
		currentFolder.set(null);
	}

	function getWorkspaceIconComponent(workspaceId: string) {
		const iconName = workspaceIcons[workspaceId] ?? 'briefcase';
		return workspaceIconMap[iconName];
	}

	function cycleWorkspaceIcon(workspaceId: string) {
		const currentIcon = workspaceIcons[workspaceId] ?? 'briefcase';
		const nextIndex = (workspaceIconOrder.indexOf(currentIcon) + 1) % workspaceIconOrder.length;
		const nextIcon = workspaceIconOrder[nextIndex];
		workspaceIcons = { ...workspaceIcons, [workspaceId]: nextIcon };
	}

	function resetWorkspaceIcon(workspaceId: string) {
		workspaceIcons = { ...workspaceIcons, [workspaceId]: 'briefcase' };
	}

	function handleDeleteWorkspace(workspace: Workspace) {
		workspace.deletedAt = new Date();
		workspaces = [...mockWorkspaces.filter((item) => !item.deletedAt)];

		if ($currentWorkspace?.id === workspace.id) {
			const nextWorkspace = workspaces[0] ?? null;
			currentWorkspace.set(nextWorkspace);
			currentFolder.set(null);
		}
	}

	function getRootFolders() {
		if (!$currentWorkspace) return [];
		return getSubfolders(null, $currentWorkspace.id);
	}

	function handleRenameFolder(folder: Folder) {
		renameTarget = folder;
		renameModalOpen = true;
	}

	function handleDeleteFolder(folder: Folder) {
		deleteTarget = folder;
		deleteModalOpen = true;
	}
</script>

<Sidebar.Root {collapsible} {...restProps} bind:ref>
	<!-- Workspace Selector Header -->
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
					>
						<Briefcase class="size-4" />
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">
							{$currentWorkspace?.name || 'Select Workspace'}
						</span>
						<span class="truncate text-xs">Content Management</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<!-- Workspace List -->
		<Sidebar.Separator />
		<Sidebar.Menu>
			<Sidebar.GroupLabel>WORKSPACES</Sidebar.GroupLabel>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					<Plus class="size-4" />
					<span>New Workspace</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			{#each workspaces as workspace}
				{@const WorkspaceIcon = getWorkspaceIconComponent(workspace.id)}
				<Sidebar.MenuItem>
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							<Sidebar.MenuButton
								isActive={$currentWorkspace?.id === workspace.id}
								onclick={() => selectWorkspace(workspace)}
							>
								<WorkspaceIcon class="size-4" />
								<span>{workspace.name}</span>
							</Sidebar.MenuButton>
						</ContextMenu.Trigger>
						<ContextMenu.Content>
							<ContextMenu.Item onselect={() => cycleWorkspaceIcon(workspace.id)}>
								Change icon
							</ContextMenu.Item>
							<ContextMenu.Item onselect={() => resetWorkspaceIcon(workspace.id)}>
								Reset icon
							</ContextMenu.Item>
							<ContextMenu.Item
								variant="destructive"
								onselect={() => handleDeleteWorkspace(workspace)}
							>
								Delete workspace
							</ContextMenu.Item>
						</ContextMenu.Content>
					</ContextMenu.Root>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>

		<!-- Remove MenuAction -->
	</Sidebar.Header>

	<!-- Main Navigation -->
	<Sidebar.Content>
		<!-- Folders -->
		<Sidebar.Separator />
		<Sidebar.Group>
			<Sidebar.GroupLabel>FOLDERS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Plus class="size-4" />
						<span>New Folder</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>

				{#each getRootFolders() as folder (folder.id)}
					<FolderItem
						{folder}
						on:rename-folder={(event) => handleRenameFolder(event.detail)}
						on:delete-folder={(event) => handleDeleteFolder(event.detail)}
					/>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Quick Links -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>QUICK LINKS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Star class="size-4" />
						<span>Starred</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Tag class="size-4" />
						<span>Tags</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Trash2 class="size-4" />
						<span>Trash</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>

	<!-- Footer with View Toggle & User -->
	<Sidebar.Footer>
		<Sidebar.Separator />
		<!-- View Toggle -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					title={$viewType === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
					onclick={() => viewType.set($viewType === 'grid' ? 'list' : 'grid')}
				>
					{#if $viewType === 'grid'}
						<Grid3x3 class="h-4 w-4" />
						<span>Grid View</span>
					{:else}
						<List class="h-4 w-4" />
						<span>List View</span>
					{/if}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<Sidebar.Separator />

		<!-- User Menu -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					<Avatar class="h-8 w-8 rounded-lg">
						<AvatarFallback class="rounded-lg">
							<User class="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">User Account</span>
						<span class="truncate text-xs">user@example.com</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<RenameModal bind:open={renameModalOpen} bind:item={renameTarget} itemType="folder" />
	<DeleteConfirmModal bind:open={deleteModalOpen} bind:item={deleteTarget} itemType="folder" />

	<Sidebar.Rail />
</Sidebar.Root>
