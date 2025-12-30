<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		currentWorkspace,
		currentFolder,
		viewType,
		workspaceFolders,
		workspaces
	} from '$lib/stores';
	import type { Folder, Workspace } from '$lib/types';
	import FolderItem from './FolderItem.svelte';
	import NewFolderModal from './modals/NewFolderModal.svelte';
	import NewWorkspaceModal from './modals/NewWorkspaceModal.svelte';
	import RenameModal from './modals/RenameModal.svelte';
	import DeleteConfirmModal from './modals/DeleteConfirmModal.svelte';
	import DeleteWorkspaceModal from './modals/DeleteWorkspaceModal.svelte';
	import {
		Briefcase,
		Star,
		Tag,
		Plus,
		Trash2,
		Grid3x3,
		List,
		User,
		BookOpen,
		Glasses,
		Palette,
		Zap,
		Rocket,
		Target,
		Trophy,
		Lightbulb,
		Archive
	} from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';
	import IconPickerModal from './modals/IconPickerModal.svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	type WorkspaceIcon =
		| 'briefcase'
		| 'book'
		| 'glasses'
		| 'palette'
		| 'zap'
		| 'rocket'
		| 'target'
		| 'trophy'
		| 'lightbulb'
		| 'archive'
		| 'star'
		| 'grid'
		| 'tag';
	const workspaceIconMap: Record<WorkspaceIcon, typeof Briefcase> = {
		briefcase: Briefcase,
		book: BookOpen,
		glasses: Glasses,
		palette: Palette,
		zap: Zap,
		rocket: Rocket,
		target: Target,
		trophy: Trophy,
		lightbulb: Lightbulb,
		archive: Archive,
		star: Star,
		grid: Grid3x3,
		tag: Tag
	};

	// Initialize workspace icons from the store instead of mockWorkspaces
	let workspaceIcons = $state<Record<string, WorkspaceIcon>>(
		$workspaces.reduce(
			(icons, workspace) => {
				icons[workspace.id] = 'briefcase';
				return icons;
			},
			{} as Record<string, WorkspaceIcon>
		)
	);

	let newFolderModalOpen = $state(false);
	let newWorkspaceModalOpen = $state(false);
	let renameModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let deleteWorkspaceModalOpen = $state(false);
	let iconPickerModalOpen = $state(false);
	let iconPickerWorkspaceId = $state<string | null>(null);
	let renameTarget = $state<Folder | null>(null);
	let deleteTarget = $state<Folder | null>(null);
	let deleteWorkspaceTarget = $state<Workspace | null>(null);

	function selectWorkspace(workspace: any) {
		currentWorkspace.set(workspace);
		currentFolder.set(null);
	}

	function getWorkspaceIconComponent(workspaceId: string) {
		const iconName = workspaceIcons[workspaceId] ?? 'briefcase';
		return workspaceIconMap[iconName];
	}

	function openIconPicker(workspaceId: string) {
		iconPickerWorkspaceId = workspaceId;
		iconPickerModalOpen = true;
	}

	function handleIconSelect(iconId: string) {
		if (iconPickerWorkspaceId) {
			workspaceIcons = { ...workspaceIcons, [iconPickerWorkspaceId]: iconId as WorkspaceIcon };
		}
	}

	function handleDeleteWorkspace(workspace: Workspace) {
		deleteWorkspaceTarget = workspace;
		deleteWorkspaceModalOpen = true;
	}

	// Use $derived for reactive root folders list - updates immediately when folders change
	let rootFolders = $derived(
		$currentWorkspace
			? $workspaceFolders.filter(
					(f: Folder) =>
						f.parentId === null && f.workspaceId === $currentWorkspace.id && !f.deletedAt
				)
			: []
	);

	function handleRenameFolder(folder: Folder) {
		renameTarget = folder;
		renameModalOpen = true;
	}

	function handleDeleteFolder(folder: Folder) {
		deleteTarget = folder;
		deleteModalOpen = true;
	}

	function openNewFolder() {
		newFolderModalOpen = true;
	}

	function openNewWorkspace() {
		newWorkspaceModalOpen = true;
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
				<Sidebar.MenuButton onclick={openNewWorkspace}>
					<Plus class="size-4" />
					<span>New Workspace</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			{#each $workspaces as workspace (workspace.id)}
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
							<ContextMenu.Item onclick={() => openIconPicker(workspace.id)}>
								Change icon
							</ContextMenu.Item>
							<ContextMenu.Item
								variant="destructive"
								onclick={() => handleDeleteWorkspace(workspace)}
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
					<Sidebar.MenuButton onclick={openNewFolder}>
						<Plus class="size-4" />
						<span>New Folder</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>

				{#each rootFolders as folder (folder.id)}
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

	<NewFolderModal bind:open={newFolderModalOpen} />
	<NewWorkspaceModal bind:open={newWorkspaceModalOpen} />
	<RenameModal bind:open={renameModalOpen} bind:item={renameTarget} itemType="folder" />
	<DeleteConfirmModal bind:open={deleteModalOpen} bind:item={deleteTarget} itemType="folder" />
	<DeleteWorkspaceModal
		bind:open={deleteWorkspaceModalOpen}
		bind:workspace={deleteWorkspaceTarget}
	/>
	<IconPickerModal bind:open={iconPickerModalOpen} onSelect={handleIconSelect} />

	<Sidebar.Rail />
</Sidebar.Root>
